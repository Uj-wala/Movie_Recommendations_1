import re
from collections import Counter, defaultdict
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.favorite import Favorite
from app.models.user import User
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.movie_view_repository import MovieViewRepository
from app.repositories.user_preference_repository import UserPreferenceRepository
from app.repositories.search_history_repository import SearchHistoryRepository
from app.services.omdb_service import FALLBACK_MOVIES, resolve_online_poster
from app.services.telugu_2025_service import TELUGU_2025_MOVIE_RECORDS


STOP_WORDS = {
    "a",
    "an",
    "and",
    "the",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "from",
    "by",
    "vs",
    "vs.",
    "movie",
    "film",
    "story",
}

SIGNAL_MAP: dict[str, list[str]] = {
    "batman": ["superhero", "action", "crime", "dc"],
    "superman": ["superhero", "action", "adventure", "dc"],
    "justice league": ["superhero", "action", "adventure", "ensemble", "dc"],
    "marvel": ["superhero", "action", "adventure", "fantasy"],
    "superhero": ["superhero", "action", "adventure"],
    "hero": ["superhero", "action", "adventure"],
    "dc": ["superhero", "action", "crime"],
    "gotham": ["crime", "thriller", "action", "superhero"],
    "action": ["action", "thriller", "crime", "adventure"],
    "thriller": ["thriller", "mystery", "crime"],
    "crime": ["crime", "thriller", "mystery"],
    "mystery": ["mystery", "thriller", "crime"],
    "sci-fi": ["sci-fi", "action", "adventure"],
    "science fiction": ["sci-fi", "action", "adventure"],
    "fantasy": ["fantasy", "adventure", "action"],
    "space": ["sci-fi", "adventure"],
    "galaxy": ["sci-fi", "adventure"],
    "adventure": ["adventure", "action"],
    "dragon": ["fantasy", "action"],
    "spy": ["spy", "thriller", "crime"],
    "secret": ["thriller", "spy", "mystery"],
}

GENRE_KEYWORDS: dict[str, set[str]] = {
    "action": {"action", "adventure", "battle", "hero", "heroic", "fight", "superhero", "war"},
    "adventure": {"adventure", "journey", "quest", "explore", "exploration", "travel", "space"},
    "crime": {"crime", "criminal", "detective", "gangster", "murder", "police"},
    "drama": {"drama", "family", "life", "relationship", "emotional"},
    "fantasy": {"fantasy", "magic", "myth", "dragon", "legend", "supernatural"},
    "mystery": {"mystery", "murder", "secret", "clue", "investigation", "detective", "thriller"},
    "romance": {"romance", "love", "romantic", "relationship"},
    "sci-fi": {"sci-fi", "science", "science fiction", "space", "alien", "future", "robot", "galaxy"},
    "superhero": {"superhero", "hero", "heroes", "villain", "comic", "marvel", "dc"},
    "thriller": {"thriller", "suspense", "danger", "secret", "spy", "crime", "mystery"},
    "spy": {"spy", "agent", "mission", "covert", "intel"},
}


class RecommendationService:
    @staticmethod
    def _tokenize(text: str) -> list[str]:
        cleaned = re.sub(r"[^a-z0-9]+", " ", text.lower())
        return [token for token in cleaned.split() if token and token not in STOP_WORDS]

    @staticmethod
    def _extract_signals(texts: Iterable[str]) -> list[str]:
        signals: list[str] = []
        for raw_text in texts:
            normalized = raw_text.lower()
            for pattern, mapped_signals in SIGNAL_MAP.items():
                if pattern in normalized:
                    signals.extend(mapped_signals)
            signals.extend(RecommendationService._tokenize(normalized))

        return list(dict.fromkeys(signals))

    @staticmethod
    def _identify_preferred_genres(seed_terms: Iterable[str]) -> list[str]:
        genre_scores: Counter[str] = Counter()
        for term in seed_terms:
            normalized_term = term.lower()
            for genre, keywords in GENRE_KEYWORDS.items():
                if normalized_term == genre or normalized_term in keywords:
                    genre_scores[genre] += 2
                elif any(keyword in normalized_term for keyword in keywords):
                    genre_scores[genre] += 1

        return [genre for genre, _ in genre_scores.most_common()]

    @staticmethod
    def _collect_user_activity(db: Session, user: User) -> dict:
        favorite_rows = FavoriteRepository.list_by_user(db, user.id)
        history_rows = SearchHistoryRepository.list_by_user(db, user.id, offset=0, limit=25)
        viewed_rows = MovieViewRepository.list_by_user(db, user.id, limit=25)

        seed_texts = [favorite.title for favorite in favorite_rows]
        seed_texts.extend(row.keyword for row in history_rows)
        seed_texts.extend(view.title for view in viewed_rows)

        sources: list[str] = []
        if favorite_rows:
            sources.append("favorites")
        if history_rows:
            sources.append("search_history")
        if viewed_rows:
            sources.append("previously_viewed")

        seed_terms = RecommendationService._extract_signals(seed_texts)
        preferred_genres = RecommendationService._identify_preferred_genres(seed_terms)

        if preferred_genres:
            UserPreferenceRepository.replace_genre_preferences(
                db=db,
                user_id=user.id,
                genres=preferred_genres,
                source="recommendation_activity",
            )

        return {
            "favorite_rows": favorite_rows,
            "history_rows": history_rows,
            "viewed_rows": viewed_rows,
            "seed_texts": seed_texts,
            "seed_terms": seed_terms,
            "preferred_genres": preferred_genres,
            "sources": sources,
        }

    @staticmethod
    def _catalog() -> list[dict]:
        catalog: list[dict] = []
        seen_ids: set[str] = set()

        for movie in [*FALLBACK_MOVIES, *TELUGU_2025_MOVIE_RECORDS]:
            imdb_id = movie.get("imdb_id")
            if not imdb_id or imdb_id in seen_ids:
                continue
            seen_ids.add(imdb_id)
            catalog.append(movie)

        return catalog

    @staticmethod
    def _normalize_movie(movie: dict) -> dict:
        imdb_rating = movie.get("imdb_rating")
        average_rating = movie.get("average_rating")

        score = None
        if average_rating is not None:
            score = float(average_rating)
        elif imdb_rating and imdb_rating != "N/A":
            try:
                score = float(imdb_rating) / 2
            except (TypeError, ValueError):
                score = None

        return {
            "imdb_id": movie.get("imdb_id", ""),
            "title": movie.get("title", ""),
            "year": movie.get("year", ""),
            "type": movie.get("type", "movie"),
            "poster": movie.get("poster", "N/A"),
            "plot": movie.get("plot"),
            "imdb_rating": movie.get("imdb_rating", "N/A"),
            "average_rating": score,
            "genre": movie.get("genre", ""),
            "director": movie.get("director", ""),
        }

    @staticmethod
    def _seed_movie_ids(db: Session, user: User) -> set[str]:
        favorite_ids = {row[0] for row in db.query(Favorite.imdb_id).filter(Favorite.user_id == user.id).all()}
        viewed_rows = MovieViewRepository.list_by_user(db, user.id, limit=100)
        favorite_ids.update(view.imdb_id for view in viewed_rows)
        return favorite_ids

    @staticmethod
    def _score_movie(movie: dict, seed_terms: list[str], preferred_genres: list[str]) -> tuple[float, list[str]]:
        combined_text = " ".join(
            part for part in [movie["title"], movie["genre"], movie["director"], movie.get("plot") or ""] if part
        ).lower()
        token_set = set(RecommendationService._tokenize(combined_text))
        matches: list[str] = []
        score = 0.0

        rating = movie.get("average_rating")
        if rating is not None:
            score += float(rating) * 2.0

        for term in seed_terms:
            if term in token_set or term in combined_text:
                matches.append(term)
                score += 2.5

        genre_tokens = RecommendationService._tokenize(movie.get("genre", ""))
        genre_overlap = [term for term in seed_terms if term in genre_tokens]
        for term in genre_overlap:
            if term not in matches:
                matches.append(term)
            score += 3.0

        title_tokens = RecommendationService._tokenize(movie.get("title", ""))
        title_overlap = [term for term in seed_terms if term in title_tokens]
        for term in title_overlap:
            if term not in matches:
                matches.append(term)
            score += 4.0

        for genre in preferred_genres:
            genre_keywords = GENRE_KEYWORDS.get(genre, set())
            if any(keyword in combined_text for keyword in genre_keywords):
                if genre not in matches:
                    matches.append(genre)
                score += 3.25

        if "superhero" in seed_terms and any(word in token_set for word in ["action", "fantasy", "adventure", "crime"]):
            if "superhero" not in matches:
                matches.append("superhero")
            score += 4.5

        if any(term in seed_terms for term in ["batman", "superman", "justice league", "dc", "marvel"]):
            if "comic-book" not in matches:
                matches.append("comic-book")
            score += 3.5

        if "thriller" in seed_terms and any(word in token_set for word in ["mystery", "crime", "thriller"]):
            if "thriller" not in matches:
                matches.append("thriller")
            score += 2.5

        if not matches and rating is not None:
            score += float(rating)

        return score, matches

    @staticmethod
    def _build_recommendation_payload(movie: dict, score: float, matched_signals: list[str]) -> dict:
        poster = resolve_online_poster(
            imdb_id=movie["imdb_id"],
            title=movie["title"],
            fallback_poster=movie.get("poster", "N/A"),
        )
        reason = (
            f"Matches your {', '.join(matched_signals[:3])} preferences."
            if matched_signals
            else "Popular pick from the local movie catalog."
        )

        return {
            "imdb_id": movie["imdb_id"],
            "title": movie["title"],
            "year": movie["year"],
            "type": movie["type"],
            "poster": poster,
            "plot": movie.get("plot"),
            "imdb_rating": movie["imdb_rating"],
            "average_rating": movie["average_rating"],
            "score": round(float(score), 2),
            "matched_signals": matched_signals,
            "reason": reason,
        }

    @staticmethod
    def analyze_user_activity(db: Session, user: User) -> dict:
        return RecommendationService._collect_user_activity(db, user)

    @staticmethod
    def identify_preferred_genres(db: Session, user: User) -> list[str]:
        activity = RecommendationService._collect_user_activity(db, user)
        return activity["preferred_genres"]

    @staticmethod
    def generate_recommended_movies(
        db: Session,
        user: User,
        limit: int = 10,
        activity: dict | None = None,
    ) -> list[dict]:
        activity = activity or RecommendationService._collect_user_activity(db, user)
        seed_terms = activity["seed_terms"]
        preferred_genres = activity["preferred_genres"]
        seen_movie_ids = RecommendationService._seed_movie_ids(db, user)

        scored_movies: list[tuple[float, dict, list[str]]] = []
        deduped_catalog: dict[str, dict] = {}

        for movie in RecommendationService._catalog():
            normalized = RecommendationService._normalize_movie(movie)
            imdb_id = normalized["imdb_id"]
            if not imdb_id or imdb_id in seen_movie_ids or imdb_id in deduped_catalog:
                continue

            deduped_catalog[imdb_id] = normalized
            score, matched_signals = RecommendationService._score_movie(normalized, seed_terms, preferred_genres)
            if seed_terms:
                if matched_signals:
                    score += 1.0
            else:
                score += normalized["average_rating"] or 0.0

            scored_movies.append((score, normalized, matched_signals))

        if not scored_movies:
            for movie in RecommendationService._catalog():
                normalized = RecommendationService._normalize_movie(movie)
                imdb_id = normalized["imdb_id"]
                if not imdb_id or imdb_id in deduped_catalog:
                    continue
                deduped_catalog[imdb_id] = normalized
                score = normalized["average_rating"] or 0.0
                scored_movies.append((score, normalized, []))

        scored_movies.sort(
            key=lambda item: (
                item[0],
                item[1]["average_rating"] or 0.0,
                item[1]["title"].lower(),
            ),
            reverse=True,
        )

        recommendations: list[dict] = []
        seen_recommendation_ids: set[str] = set()
        for score, movie, matched_signals in scored_movies:
            imdb_id = movie["imdb_id"]
            if imdb_id in seen_recommendation_ids:
                continue
            seen_recommendation_ids.add(imdb_id)
            recommendations.append(RecommendationService._build_recommendation_payload(movie, score, matched_signals))
            if len(recommendations) >= limit:
                break

        return recommendations

    @staticmethod
    def get_recommendations(db: Session, user: User, limit: int = 10) -> dict:
        activity = RecommendationService._collect_user_activity(db, user)
        recommendations = RecommendationService.generate_recommended_movies(
            db,
            user,
            limit=limit,
            activity=activity,
        )

        return {
            "success": True,
            "data": recommendations,
            "total": len(recommendations),
            "seed_terms": activity["seed_terms"],
            "sources": activity["sources"],
            "preferred_genres": activity["preferred_genres"],
        }
