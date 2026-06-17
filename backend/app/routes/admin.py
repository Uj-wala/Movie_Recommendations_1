from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.admin_activity_log import AdminActivityLog
from app.models.favorite import Favorite
from app.models.review import Review
from app.models.search_history import SearchHistory
from app.models.user import User
from app.schemas.admin import (
    AdminActivityLogListResponse,
    AdminActivityLogResponse,
    AdminActionResponse,
    AdminReviewCreateRequest,
    AdminReviewListResponse,
    AdminReviewResponse,
    AdminReviewUpdateRequest,
    AdminStatsResponse,
    AdminUserResponse,
    AdminUserRoleUpdateRequest,
)
from app.services.auth_service import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


def _format_log_details(**details: object) -> str | None:
    cleaned = {key: value for key, value in details.items() if value is not None}
    if not cleaned:
        return None
    return "; ".join(f"{key}={value}" for key, value in cleaned.items())


def _record_admin_activity(
    db: Session,
    *,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: str | int | None = None,
    status: str = "success",
    details: str | None = None,
) -> None:
    db.add(
        AdminActivityLog(
            actor_user_id=actor.id if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            status=status,
            details=details,
        )
    )


def _build_activity_log_response(log: AdminActivityLog) -> AdminActivityLogResponse:
    return AdminActivityLogResponse(
        id=log.id,
        actor_user_id=log.actor_user_id,
        actor_email=log.actor.email if log.actor else None,
        action=log.action,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        status=log.status,
        details=log.details,
        created_at=log.created_at,
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role")

    if user.is_admin and not payload.is_admin:
        admin_count = db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one admin account must remain active")

    previous_role = user.is_admin
    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    _record_admin_activity(
        db,
        actor=current_user,
        action="update_user_role",
        entity_type="user",
        entity_id=user.id,
        details=_format_log_details(user_email=user.email, before=previous_role, after=user.is_admin),
    )
    db.commit()
    return user


@router.delete("/users/{user_id}", response_model=AdminActionResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account from the dashboard")

    if user.is_admin:
        admin_count = db.query(func.count(User.id)).filter(User.is_admin.is_(True)).scalar() or 0
        if admin_count <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one admin account must remain active")

    deleted_user_email = user.email
    deleted_user_is_admin = user.is_admin
    db.delete(user)
    db.commit()
    _record_admin_activity(
        db,
        actor=current_user,
        action="delete_user",
        entity_type="user",
        entity_id=user_id,
        details=_format_log_details(user_email=deleted_user_email, was_admin=deleted_user_is_admin),
    )
    db.commit()
    return AdminActionResponse(message="User deleted successfully")


def _build_admin_review_response(review: Review) -> AdminReviewResponse:
    user_email = review.user.email if review.user else ""
    return AdminReviewResponse(
        id=review.id,
        imdb_id=review.imdb_id,
        review=review.review,
        rating=review.rating,
        user_id=review.user_id,
        user_email=user_email,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get("/reviews", response_model=AdminReviewListResponse)
def list_reviews(
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    offset = max(page - 1, 0) * max(limit, 1)
    total = db.query(func.count(Review.id)).scalar() or 0
    reviews = (
        db.query(Review)
        .order_by(Review.updated_at.desc(), Review.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return AdminReviewListResponse(
        page=page,
        limit=limit,
        total=total,
        items=[_build_admin_review_response(review) for review in reviews],
    )


@router.post("/reviews", response_model=AdminReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: AdminReviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = (
        db.query(Review)
        .filter(Review.user_id == current_user.id, Review.imdb_id == payload.imdb_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Review already exists for this movie")

    review = Review(
        user_id=current_user.id,
        imdb_id=payload.imdb_id,
        review=payload.review.strip(),
        rating=payload.rating,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    _record_admin_activity(
        db,
        actor=current_user,
        action="create_review",
        entity_type="review",
        entity_id=review.id,
        details=_format_log_details(imdb_id=review.imdb_id, rating=review.rating),
    )
    db.commit()
    return _build_admin_review_response(review)


@router.patch("/reviews/{review_id}", response_model=AdminReviewResponse)
def update_review(
    review_id: int,
    payload: AdminReviewUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if payload.review is not None:
        review.review = payload.review.strip()
    if payload.rating is not None:
        review.rating = payload.rating

    updated_imdb_id = review.imdb_id
    db.commit()
    db.refresh(review)
    _record_admin_activity(
        db,
        actor=current_user,
        action="update_review",
        entity_type="review",
        entity_id=review.id,
        details=_format_log_details(imdb_id=updated_imdb_id, rating=review.rating),
    )
    db.commit()
    return _build_admin_review_response(review)


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    deleted_imdb_id = review.imdb_id
    deleted_review_rating = review.rating
    db.delete(review)
    db.commit()
    _record_admin_activity(
        db,
        actor=current_user,
        action="delete_review",
        entity_type="review",
        entity_id=review_id,
        details=_format_log_details(imdb_id=deleted_imdb_id, rating=deleted_review_rating),
    )
    db.commit()
    return {"success": True, "message": "Review deleted successfully"}


@router.get("/activity-logs", response_model=AdminActivityLogListResponse)
def list_activity_logs(
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    safe_page = max(page, 1)
    safe_limit = max(limit, 1)
    offset = (safe_page - 1) * safe_limit
    total = db.query(func.count(AdminActivityLog.id)).scalar() or 0
    logs = (
        db.query(AdminActivityLog)
        .order_by(AdminActivityLog.created_at.desc(), AdminActivityLog.id.desc())
        .offset(offset)
        .limit(safe_limit)
        .all()
    )
    return AdminActivityLogListResponse(
        page=safe_page,
        limit=safe_limit,
        total=total,
        items=[_build_activity_log_response(log) for log in logs],
    )


@router.get("/stats", response_model=AdminStatsResponse)
def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    favorite_count = db.query(func.count(Favorite.id)).scalar() or 0
    review_count = db.query(func.count(Review.id)).scalar() or 0
    top_search = (
        db.query(
            SearchHistory.keyword.label("keyword"),
            func.count(SearchHistory.id).label("search_count"),
        )
        .group_by(SearchHistory.keyword)
        .order_by(func.count(SearchHistory.id).desc(), SearchHistory.keyword.asc())
        .first()
    )

    return AdminStatsResponse(
        total_users=db.query(func.count(User.id)).scalar() or 0,
        total_reviews=review_count,
        total_favorites=favorite_count,
        most_searched_movie=top_search.keyword if top_search else None,
        most_searched_movie_count=int(top_search.search_count) if top_search else 0,
    )
