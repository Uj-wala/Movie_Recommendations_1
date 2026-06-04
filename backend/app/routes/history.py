from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.history_controller import HistoryController
from app.database.session import get_db
from app.schemas.error import ErrorResponse, ValidationErrorResponse
from app.schemas.history import SearchHistoryQuery, SearchHistoryResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get(
    "",
    response_model=SearchHistoryResponse,
    responses={
        400: {"model": ValidationErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
def get_history(
    query: SearchHistoryQuery = Depends(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    items, total, total_pages = HistoryController.get_history(
        db=db,
        current_user=current_user,
        page=query.page,
        limit=query.limit,
    )
    return {
        "success": True,
        "data": items,
        "page": query.page,
        "limit": query.limit,
        "total": total,
        "total_pages": total_pages,
    }
