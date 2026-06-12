from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate, PaginatedReviews
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _get_average_rating(db: Session, imdb_id: str) -> float | None:
    avg = db.query(func.avg(Review.rating)).filter(Review.imdb_id == imdb_id).scalar()
    return float(avg) if avg is not None else None


def _build_review_response(review: Review, average_rating: float | None, user_email: str | None) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        imdb_id=review.imdb_id,
        review=review.review,
        rating=review.rating,
        average_rating=average_rating,
        user_id=review.user_id,
        user_email=user_email or "",
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get("", response_model=PaginatedReviews)
def list_reviews(
    imdb_id: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    try:
        total = db.query(func.count(Review.id)).filter(Review.imdb_id == imdb_id).scalar() or 0
        average_rating = _get_average_rating(db, imdb_id)

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

            items.append(_build_review_response(r, average_rating, user_email))

        return PaginatedReviews(page=page, page_size=page_size, total=total, average_rating=average_rating, items=items)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to fetch reviews") from exc


@router.get("/{imdb_id}", response_model=ReviewResponse)
def get_review(
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

    return _build_review_response(review, _get_average_rating(db, imdb_id), current_user.email)


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
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Review already exists for this movie") from exc
    db.refresh(review)

    return _build_review_response(review, _get_average_rating(db, review.imdb_id), current_user.email)


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

    return _build_review_response(review, _get_average_rating(db, review.imdb_id), current_user.email)


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
