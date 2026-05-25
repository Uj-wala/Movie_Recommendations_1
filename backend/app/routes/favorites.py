from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.favorite import Favorite
from app.models.user import User
from app.schemas.favorite import FavoriteCreate, FavoriteResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    payload: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duplicate = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.imdb_id == payload.imdb_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Movie already in favorites")

    favorite = Favorite(
        user_id=current_user.id,
        imdb_id=payload.imdb_id,
        title=payload.title,
        year=payload.year,
        poster_url=payload.poster_url,
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


@router.get("", response_model=list[FavoriteResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )


@router.delete("/{imdb_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    imdb_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorite = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id, Favorite.imdb_id == imdb_id)
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite movie not found")

    db.delete(favorite)
    db.commit()
    return None
