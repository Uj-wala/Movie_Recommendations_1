from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminUserResponse(BaseModel):
    id: int
    email: EmailStr
    is_admin: bool
    created_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class AdminStatsResponse(BaseModel):
    total_users: int
    total_reviews: int
    total_favorites: int
    most_searched_movie: str | None = None
    most_searched_movie_count: int = 0


class AdminReviewCreateRequest(BaseModel):
    imdb_id: str
    review: str
    rating: int | None = None


class AdminReviewUpdateRequest(BaseModel):
    review: str | None = None
    rating: int | None = None


class AdminReviewResponse(BaseModel):
    id: int
    imdb_id: str
    review: str
    rating: int | None = None
    user_id: int
    user_email: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {
        "from_attributes": True,
    }


class AdminReviewListResponse(BaseModel):
    page: int
    limit: int
    total: int
    items: list[AdminReviewResponse]
