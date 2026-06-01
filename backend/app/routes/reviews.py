from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate, PaginatedReviews
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=PaginatedReviews)
def list_reviews(
    imdb_id: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    try:
        total = db.query(func.count(Review.id)).filter(Review.imdb_id == imdb_id).scalar() or 0

        offset = (page - 1) * page_size
        reviews = (
            db.query(Review)
            .filter(Review.imdb_id == imdb_id)
            .order_by(Review.updated_at.desc(), Review.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        items = []
        for r in reviews:
            user_email = None
            try:
                user_email = r.user.email
            except Exception:
                user_email = None

            items.append(
                ReviewResponse(
                    id=r.id,
                    imdb_id=r.imdb_id,
                    review=r.review,
                    rating=r.rating,
                    user_id=r.user_id,
                    user_email=user_email,
                    created_at=r.created_at,
                    updated_at=r.updated_at,
                )
            )

        return PaginatedReviews(page=page, page_size=page_size, total=total, items=items)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to fetch reviews") from exc


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    return ReviewResponse(
        id=review.id,
        imdb_id=review.imdb_id,
        review=review.review,
        rating=review.rating,
        user_id=review.user_id,
        user_email=current_user.email,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.patch("/{imdb_id}", response_model=ReviewResponse)
def update_review(
    imdb_id: str,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = (
        db.query(Review)
        .filter(Review.imdb_id == imdb_id, Review.user_id == current_user.id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if payload.review is not None:
        review.review = payload.review.strip()
    if payload.rating is not None:
        review.rating = payload.rating

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        imdb_id=review.imdb_id,
        review=review.review,
        rating=review.rating,
        user_id=review.user_id,
        user_email=current_user.email,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.delete("/{imdb_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    imdb_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = (
        db.query(Review)
        .filter(Review.imdb_id == imdb_id, Review.user_id == current_user.id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    db.delete(review)
    db.commit()
    return None
