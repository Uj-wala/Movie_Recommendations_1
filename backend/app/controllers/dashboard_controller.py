from sqlalchemy.orm import Session

from app.models.user import User
from app.services.dashboard_service import DashboardService


class DashboardController:
    @staticmethod
    def get_dashboard(db: Session, current_user: User) -> dict:
        return DashboardService.get_stats(db, current_user)
