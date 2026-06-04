from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.dashboard_controller import DashboardController
from app.database.session import get_db
from app.schemas.error import ErrorResponse
from app.schemas.dashboard import DashboardStatsData
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "",
    response_model=DashboardStatsData,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
    summary="Get dashboard statistics",
    description="Return the authenticated user's favorite count, search count, and up to three recent search keywords.",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return DashboardController.get_dashboard(db=db, current_user=current_user)
