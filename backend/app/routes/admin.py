from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.favorite import Favorite
from app.models.review import Review
from app.models.search_history import SearchHistory
from app.models.user import User
from app.schemas.admin import (
    AdminReviewCreateRequest,
    AdminReviewListResponse,
    AdminReviewResponse,
    AdminReviewUpdateRequest,
    AdminStatsResponse,
    AdminUserResponse,
)
from app.services.auth_service import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


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

    db.commit()
    db.refresh(review)
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

    db.delete(review)
    db.commit()
    return {"success": True, "message": "Review deleted successfully"}


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
