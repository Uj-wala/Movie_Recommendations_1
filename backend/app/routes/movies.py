from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.review import Review
from app.schemas.history import SearchKeywordQuery
from app.schemas.movie import MovieDetailResponse, MovieSearchResponse
from app.services.auth_service import get_current_user
from app.services.omdb_service import get_movie_by_imdb_id, search_movies
from app.services.search_history_service import SearchHistoryService
from app.services.telugu_2025_service import (
    get_telugu_2025_movie_by_id,
    search_telugu_2025_movies,
)

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/search", response_model=MovieSearchResponse)
async def movie_search(
    query: SearchKeywordQuery = Depends(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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


@router.get("/{imdb_id}", response_model=MovieDetailResponse)
async def movie_detail(imdb_id: str, db: Session = Depends(get_db)):
    local_movie = get_telugu_2025_movie_by_id(imdb_id)
    if local_movie:
        try:
            avg = db.query(func.avg(Review.rating)).filter(Review.imdb_id == imdb_id).scalar()
            average = float(avg) if avg is not None else None
        except Exception:
            average = None

        local_movie["average_rating"] = average
        return local_movie

    # Fetch movie data from OMDb service (or fallback)
    data = await get_movie_by_imdb_id(imdb_id)

    try:
        avg = db.query(func.avg(Review.rating)).filter(Review.imdb_id == imdb_id).scalar()
        average = float(avg) if avg is not None else None
    except Exception:
        average = None

    # Attach average rating (1-5) to movie response
    data["average_rating"] = average
    return data
