from fastapi import APIRouter, Query

from app.schemas.movie import MovieDetailResponse, MovieSearchResponse
from app.services.omdb_service import get_movie_by_imdb_id, search_movies

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/search", response_model=MovieSearchResponse)
async def movie_search(title: str = Query(..., min_length=1), page: int = Query(1, ge=1)):
    return await search_movies(title=title, page=page)


@router.get("/{imdb_id}", response_model=MovieDetailResponse)
async def movie_detail(imdb_id: str):
    return await get_movie_by_imdb_id(imdb_id)
