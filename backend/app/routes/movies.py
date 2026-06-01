
from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.search_history import SearchHistory
from app.models.review import Review
from app.schemas.movie import MovieDetailResponse, MovieSearchResponse
from app.services.omdb_service import get_movie_by_imdb_id, search_movies
from app.services.auth_service import get_optional_current_user


router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/search", response_model=MovieSearchResponse)
async def movie_search(
    title: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_current_user),
):
    result = await search_movies(title=title, page=page)

    if current_user:
        keyword = title.strip()
        entry = SearchHistory(user_id=current_user.id, keyword=keyword)
        db.add(entry)
        db.commit()

    return result


@router.get("/{imdb_id}", response_model=MovieDetailResponse)
async def movie_detail(imdb_id: str, db: Session = Depends(get_db)):
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
