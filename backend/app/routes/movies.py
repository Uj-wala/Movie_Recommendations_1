from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.review import Review
from app.models.user import User
from app.repositories.movie_view_repository import MovieViewRepository
from app.repositories.user_repository import UserRepository
from app.schemas.history import SearchKeywordQuery
from app.schemas.movie import MovieCompareResponse, MovieDetailResponse, MovieSearchResponse
from app.services.auth_service import _decode_user_id, get_optional_current_user, optional_auth_scheme
from app.services.movie_compare_service import MovieCompareService
from app.services.omdb_service import get_movie_by_imdb_id, search_movies
from app.services.search_history_service import SearchHistoryService
from app.services.telugu_2025_service import (
    get_telugu_2025_movie_by_id,
    search_telugu_2025_movies,
)

router = APIRouter(prefix="/movies", tags=["movies"])


def get_search_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_auth_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None

    parsed_user_id = _decode_user_id(credentials.credentials)
    user = UserRepository.get_by_id(db, parsed_user_id)
    if not user:
        return None
    return user


def _movie_rating_snapshot(db: Session, imdb_id: str, current_user: User | None) -> tuple[float | None, float | None, int | None]:
    try:
        all_avg = db.query(func.avg(Review.rating)).filter(Review.imdb_id == imdb_id).scalar()
        community_avg = db.query(func.avg(Review.rating)).filter(Review.imdb_id == imdb_id)
        if current_user:
            community_avg = community_avg.filter(Review.user_id != current_user.id)
        community_value = community_avg.scalar()
        user_rating = None
        if current_user:
            user_rating = db.query(Review.rating).filter(Review.imdb_id == imdb_id, Review.user_id == current_user.id).scalar()
        return (
            float(all_avg) if all_avg is not None else None,
            float(community_value) if community_value is not None else None,
            int(user_rating) if user_rating is not None else None,
        )
    except Exception:
        return None, None, None


@router.get("/search", response_model=MovieSearchResponse)
async def movie_search(
    query: SearchKeywordQuery = Depends(),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_search_user),
):
    if current_user:
        SearchHistoryService.track_search(db=db, user=current_user, keyword=query.keyword)
    result = await search_movies(title=query.normalized_keyword, page=query.page)
    return result


@router.get("/telugu/2025", response_model=MovieSearchResponse)
def telugu_2025_movies(
    q: str = Query("", description="Optional title, genre, or director search"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    return search_telugu_2025_movies(query=q, page=page, page_size=page_size)


@router.get("/compare", response_model=MovieCompareResponse)
async def compare_movies(
    movie1: str = Query(..., min_length=1, description="First movie IMDb id"),
    movie2: str = Query(..., min_length=1, description="Second movie IMDb id"),
    db: Session = Depends(get_db),
):
    return await MovieCompareService.compare_movies(db=db, movie1=movie1, movie2=movie2)


@router.get("/{imdb_id}", response_model=MovieDetailResponse)
async def movie_detail(
    imdb_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    average_all, community_average, user_rating = _movie_rating_snapshot(db, imdb_id, current_user)
    local_movie = get_telugu_2025_movie_by_id(imdb_id)
    if local_movie:
        local_movie["average_rating"] = community_average if current_user else average_all
        local_movie["community_average_rating"] = community_average if current_user else average_all
        local_movie["user_rating"] = user_rating
        if current_user:
            MovieViewRepository.upsert(
                db=db,
                user_id=current_user.id,
                imdb_id=local_movie["imdb_id"],
                title=local_movie["title"],
                year=local_movie["year"],
                poster_url=local_movie["poster"],
            )
        return local_movie

    # Fetch movie data from OMDb service (or fallback)
    data = await get_movie_by_imdb_id(imdb_id)
    # Attach both community and user-specific ratings to movie response
    data["average_rating"] = community_average if current_user else average_all
    data["community_average_rating"] = community_average if current_user else average_all
    data["user_rating"] = user_rating
    if current_user:
        MovieViewRepository.upsert(
            db=db,
            user_id=current_user.id,
            imdb_id=data["imdb_id"],
            title=data["title"],
            year=data["year"],
            poster_url=data.get("poster") or "N/A",
        )
    return data
