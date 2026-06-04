from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.history import SearchHistoryItem
from app.services.search_history_service import SearchHistoryService


class HistoryController:
    @staticmethod
    def get_history(db: Session, current_user: User, page: int = 1, limit: int = 10) -> tuple[list[SearchHistoryItem], int, int]:
        total = SearchHistoryService.count_history(db, current_user)
        rows = SearchHistoryService.list_history(db, current_user, page=page, limit=limit)
        total_pages = max((total + limit - 1) // limit, 1) if total > 0 else 0

        items = [
            SearchHistoryItem(keyword=row.keyword, searched_at=row.searched_at)
            for row in rows
        ]
        return items, total, total_pages
