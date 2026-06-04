from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.favorite_repository import FavoriteRepository
from app.repositories.search_history_repository import SearchHistoryRepository


class DashboardService:
    @staticmethod
    def get_stats(db: Session, user: User) -> dict:
        return {
            "total_favorites": FavoriteRepository.count_by_user(db, user.id),
            "total_searches": SearchHistoryRepository.count_by_user(db, user.id),
            "recent_searches": SearchHistoryRepository.recent_keywords(db, user.id, limit=3),
        }
