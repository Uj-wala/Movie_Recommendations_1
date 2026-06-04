from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.favorite import Favorite


class FavoriteRepository:
    @staticmethod
    def count_by_user(db: Session, user_id: int) -> int:
        return db.query(func.count(Favorite.id)).filter(Favorite.user_id == user_id).scalar() or 0

    @staticmethod
    def exists_by_user_and_imdb_id(db: Session, user_id: int, imdb_id: str) -> bool:
        return (
            db.query(Favorite.id)
            .filter(Favorite.user_id == user_id, Favorite.imdb_id == imdb_id)
            .first()
            is not None
        )

    @staticmethod
    def create(db: Session, user_id: int, imdb_id: str, title: str, year: str, poster_url: str) -> Favorite:
        favorite = Favorite(
            user_id=user_id,
            imdb_id=imdb_id,
            title=title,
            year=year,
            poster_url=poster_url,
        )
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        return favorite

    @staticmethod
    def list_by_user(db: Session, user_id: int) -> list[Favorite]:
        return (
            db.query(Favorite)
            .filter(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
            .all()
        )
