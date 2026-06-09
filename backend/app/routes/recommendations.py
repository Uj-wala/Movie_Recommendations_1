from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.error import ErrorResponse, ValidationErrorResponse
from app.schemas.recommendation import RecommendationResponse
from app.services.auth_service import get_current_user
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get(
    "",
    response_model=RecommendationResponse,
    responses={
        400: {"model": ValidationErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "User not found"},
    },
)
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=25),
):
    return RecommendationService.get_recommendations(db=db, user=current_user, limit=limit)
