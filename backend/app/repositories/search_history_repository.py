from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.search_history import SearchHistory


class SearchHistoryRepository:
    @staticmethod
    def create(db: Session, user_id: int, keyword: str) -> SearchHistory:
        record = SearchHistory(
            user_id=user_id,
            keyword=keyword,
            searched_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def latest_for_user(db: Session, user_id: int) -> SearchHistory | None:
        return (
            db.query(SearchHistory)
            .filter(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.searched_at.desc(), SearchHistory.id.desc())
            .first()
        )

    @staticmethod
    def list_by_user(db: Session, user_id: int, offset: int = 0, limit: int = 10) -> list[SearchHistory]:
        return (
            db.query(SearchHistory)
            .filter(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.searched_at.desc(), SearchHistory.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def count_by_user(db: Session, user_id: int) -> int:
        return db.query(func.count(SearchHistory.id)).filter(SearchHistory.user_id == user_id).scalar() or 0

    @staticmethod
    def recent_keywords(db: Session, user_id: int, limit: int = 3) -> list[str]:
        rows = (
            db.query(SearchHistory.keyword)
            .filter(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.searched_at.desc(), SearchHistory.id.desc())
            .limit(limit)
            .all()
        )
        return [row[0] for row in rows]
