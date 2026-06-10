from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.watchlist import Watchlist
from app.models.user import User
from app.schemas.watchlist import WatchlistCreate, WatchlistResponse
from app.services.auth_service import get_current_user
from app.services.omdb_service import get_movie_by_imdb_id

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


async def _safe_movie_lookup(movie_id: str) -> dict:
    try:
        return await get_movie_by_imdb_id(movie_id)
    except HTTPException:
        return {
            "imdb_id": movie_id,
            "title": movie_id,
            "year": "",
            "poster": "N/A",
        }


def _build_watchlist_response(record: Watchlist, movie: dict, payload: WatchlistCreate | None = None) -> WatchlistResponse:
    payload_title = getattr(payload, "title", None)
    payload_year = getattr(payload, "year", None)
    payload_poster = getattr(payload, "poster_url", None)
    payload_imdb_id = getattr(payload, "imdb_id", None)

    return WatchlistResponse(
        id=record.id,
        movie_id=record.movie_id,
        imdb_id=payload_imdb_id or movie.get("imdb_id", record.movie_id),
        title=payload_title or movie.get("title", record.movie_id),
        year=payload_year or movie.get("year", ""),
        poster_url=payload_poster or movie.get("poster", movie.get("poster_url", "N/A")),
        created_at=record.created_at,
    )


@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    payload: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duplicate = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id, Watchlist.movie_id == payload.imdb_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Movie already in watchlist")

    watchlist_item = Watchlist(
        user_id=current_user.id,
        movie_id=payload.imdb_id,
    )
    db.add(watchlist_item)
    db.commit()
    db.refresh(watchlist_item)
    movie = await _safe_movie_lookup(payload.imdb_id)
    return _build_watchlist_response(watchlist_item, movie, payload)


@router.get("", response_model=list[WatchlistResponse])
async def list_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    watchlist_items = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id)
        .order_by(Watchlist.created_at.desc())
        .all()
    )

    response: list[WatchlistResponse] = []
    for item in watchlist_items:
        movie = await _safe_movie_lookup(item.movie_id)
        response.append(_build_watchlist_response(item, movie))

    return response


@router.delete("/{movieId}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    movieId: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    watchlist_item = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id, Watchlist.movie_id == movieId)
        .first()
    )
    if not watchlist_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist movie not found")

    db.delete(watchlist_item)
    db.commit()
    return None
