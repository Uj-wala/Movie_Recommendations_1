from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.movie_view import MovieView


class MovieViewRepository:
    @staticmethod
    def upsert(
        db: Session,
        user_id: int,
        imdb_id: str,
        title: str,
        year: str,
        poster_url: str,
    ) -> MovieView:
        view = (
            db.query(MovieView)
            .filter(MovieView.user_id == user_id, MovieView.imdb_id == imdb_id)
            .first()
        )
        if view:
            view.title = title
            view.year = year
            view.poster_url = poster_url
            view.viewed_at = datetime.now(timezone.utc)
        else:
            view = MovieView(
                user_id=user_id,
                imdb_id=imdb_id,
                title=title,
                year=year,
                poster_url=poster_url,
            )
            db.add(view)

        db.commit()
        db.refresh(view)
        return view

    @staticmethod
    def list_by_user(db: Session, user_id: int, limit: int = 10) -> list[MovieView]:
        return (
            db.query(MovieView)
            .filter(MovieView.user_id == user_id)
            .order_by(MovieView.viewed_at.desc(), MovieView.id.desc())
            .limit(limit)
            .all()
        )
