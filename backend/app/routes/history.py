from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.search_history import SearchHistory
from app.schemas.history import SearchHistoryItem
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/", response_model=List[SearchHistoryItem])
def get_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(50)
        .all()
    )
    return items
