import re

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.review import Review
from app.schemas.movie import (
    AttributeComparison,
    GenreComparison,
    MovieCompareItem,
    MovieComparisonSummary,
    MovieCompareResponse,
    NumericComparison,
)
from app.services.omdb_service import get_movie_by_imdb_id
from app.services.telugu_2025_service import get_telugu_2025_movie_by_id


MOVIE_ID_PATTERN = re.compile(r"^(tt\d{7,10}|fake-cine-\d{3}|telugu-2025-\d{3})$")


class MovieCompareService:
    @staticmethod
    def validate_movie_id(movie_id: str, field_name: str) -> str:
        normalized_id = movie_id.strip()
        if not normalized_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={field_name: "Movie id is required"},
            )
        if not MOVIE_ID_PATTERN.fullmatch(normalized_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={field_name: "Invalid movie id"},
            )
        return normalized_id

    @staticmethod
    def get_review_stats(db: Session, imdb_id: str) -> tuple[float | None, int]:
        average_rating, total_reviews = (
            db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.imdb_id == imdb_id)
            .one()
        )
        return (
            round(float(average_rating), 2) if average_rating is not None else None,
            int(total_reviews or 0),
        )

    @staticmethod
    async def get_movie_or_404(imdb_id: str) -> dict:
        local_movie = get_telugu_2025_movie_by_id(imdb_id)
        if local_movie:
            return dict(local_movie)

        try:
            return await get_movie_by_imdb_id(imdb_id)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_404_NOT_FOUND:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Movie not found: {imdb_id}",
                ) from exc
            raise

    @staticmethod
    async def build_compare_item(db: Session, imdb_id: str) -> MovieCompareItem:
        movie = await MovieCompareService.get_movie_or_404(imdb_id)
        average_rating, total_reviews = MovieCompareService.get_review_stats(db, imdb_id)

        movie["average_rating"] = average_rating
        movie["community_average_rating"] = average_rating
        movie["user_rating"] = None
        return MovieCompareItem(
            movie=movie,
            average_user_rating=average_rating,
            total_reviews=total_reviews,
        )

    @staticmethod
    def _parse_year(value: str | None) -> int | None:
        if not value:
            return None
        match = re.search(r"\d{4}", str(value))
        return int(match.group()) if match else None

    @staticmethod
    def _parse_runtime_minutes(value: str | None) -> int | None:
        if not value or value == "N/A":
            return None
        match = re.search(r"\d+", str(value))
        return int(match.group()) if match else None

    @staticmethod
    def _genres(value: str | None) -> set[str]:
        if not value or value == "N/A":
            return set()
        return {genre.strip() for genre in value.split(",") if genre.strip()}

    @staticmethod
    def _rating_value(item: MovieCompareItem) -> float | None:
        if item.average_user_rating is not None:
            return item.average_user_rating
        imdb_rating = item.movie.imdb_rating
        if not imdb_rating or imdb_rating == "N/A":
            return None
        try:
            return round(float(imdb_rating) / 2, 2)
        except ValueError:
            return None

    @staticmethod
    def _numeric_comparison(
        movie1_value: float | int | None,
        movie2_value: float | int | None,
        higher_is_better: bool = True,
    ) -> NumericComparison:
        winner = None
        difference = None
        if movie1_value is not None and movie2_value is not None:
            difference = round(abs(float(movie1_value) - float(movie2_value)), 2)
            if movie1_value != movie2_value:
                movie1_wins = movie1_value > movie2_value if higher_is_better else movie1_value < movie2_value
                winner = "movie1" if movie1_wins else "movie2"

        return NumericComparison(
            movie1=movie1_value,
            movie2=movie2_value,
            difference=difference,
            winner=winner,
        )

    @staticmethod
    def _attribute_comparisons(movie1: dict, movie2: dict) -> list[AttributeComparison]:
        fields = ["rated", "language", "country", "director", "type", "box_office"]
        return [
            AttributeComparison(
                field=field,
                movie1=movie1.get(field),
                movie2=movie2.get(field),
                same=movie1.get(field) == movie2.get(field),
            )
            for field in fields
        ]

    @staticmethod
    def _model_to_dict(model) -> dict:
        if hasattr(model, "model_dump"):
            return model.model_dump()
        return model.dict()

    @staticmethod
    def _highlights(
        item1: MovieCompareItem,
        item2: MovieCompareItem,
        rating: NumericComparison,
        release_year: NumericComparison,
        duration: NumericComparison,
        genres: GenreComparison,
    ) -> list[str]:
        highlights: list[str] = []
        title1 = item1.movie.title
        title2 = item2.movie.title

        if rating.winner:
            winner = title1 if rating.winner == "movie1" else title2
            highlights.append(f"{winner} has the higher rating.")
        if release_year.winner:
            newer = title1 if release_year.winner == "movie1" else title2
            highlights.append(f"{newer} has the newer release year.")
        if duration.winner:
            longer = title1 if duration.winner == "movie1" else title2
            highlights.append(f"{longer} has the longer runtime.")
        if genres.common:
            highlights.append(f"Both movies share: {', '.join(genres.common)}.")
        if not highlights:
            highlights.append("No major differences were available from the stored movie attributes.")

        return highlights

    @staticmethod
    def build_summary(item1: MovieCompareItem, item2: MovieCompareItem) -> MovieComparisonSummary:
        movie1 = MovieCompareService._model_to_dict(item1.movie)
        movie2 = MovieCompareService._model_to_dict(item2.movie)
        rating = MovieCompareService._numeric_comparison(
            MovieCompareService._rating_value(item1),
            MovieCompareService._rating_value(item2),
        )
        release_year = MovieCompareService._numeric_comparison(
            MovieCompareService._parse_year(item1.movie.year),
            MovieCompareService._parse_year(item2.movie.year),
        )
        duration = MovieCompareService._numeric_comparison(
            MovieCompareService._parse_runtime_minutes(item1.movie.runtime),
            MovieCompareService._parse_runtime_minutes(item2.movie.runtime),
        )

        movie1_genres = MovieCompareService._genres(item1.movie.genre)
        movie2_genres = MovieCompareService._genres(item2.movie.genre)
        genres = GenreComparison(
            common=sorted(movie1_genres & movie2_genres),
            only_movie1=sorted(movie1_genres - movie2_genres),
            only_movie2=sorted(movie2_genres - movie1_genres),
        )

        return MovieComparisonSummary(
            rating=rating,
            release_year=release_year,
            duration_minutes=duration,
            genres=genres,
            attributes=MovieCompareService._attribute_comparisons(movie1, movie2),
            highlights=MovieCompareService._highlights(item1, item2, rating, release_year, duration, genres),
        )

    @staticmethod
    async def compare_movies(db: Session, movie1: str, movie2: str) -> MovieCompareResponse:
        movie1_id = MovieCompareService.validate_movie_id(movie1, "movie1")
        movie2_id = MovieCompareService.validate_movie_id(movie2, "movie2")

        item1 = await MovieCompareService.build_compare_item(db, movie1_id)
        item2 = await MovieCompareService.build_compare_item(db, movie2_id)
        return MovieCompareResponse(
            movie1=item1,
            movie2=item2,
            summary=MovieCompareService.build_summary(item1, item2),
        )
