from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.search_history_repository import SearchHistoryRepository


class SearchHistoryService:
    @staticmethod
    def validate_keyword(keyword: str) -> str:
        normalized = keyword.strip()
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"keyword": "Keyword is required"},
            )
        if len(normalized) > 255:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"keyword": "Keyword must be 255 characters or fewer"},
            )
        return normalized

    @staticmethod
    def track_search(db: Session, user: User, keyword: str):
        SearchHistoryService.validate_keyword(keyword)
        return SearchHistoryRepository.create(db, user.id, keyword)

    @staticmethod
    def list_history(db: Session, user: User, page: int = 1, limit: int = 10):
        offset = (page - 1) * limit
        return SearchHistoryRepository.list_by_user(db, user.id, offset=offset, limit=limit)

    @staticmethod
    def count_history(db: Session, user: User) -> int:
        return SearchHistoryRepository.count_by_user(db, user.id)

    @staticmethod
    def recent_keywords(db: Session, user: User, limit: int = 3) -> list[str]:
        return SearchHistoryRepository.recent_keywords(db, user.id, limit=limit)
