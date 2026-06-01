from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    imdb_id: str
    review: str = Field(..., min_length=1)
    rating: int | None = Field(None, ge=1, le=5)


class ReviewUpdate(BaseModel):
    review: str | None = Field(None, min_length=1)
    rating: int | None = Field(None, ge=1, le=10)


class ReviewResponse(BaseModel):
    id: int
    imdb_id: str
    review: str
    rating: int | None = None
    user_id: int
    user_email: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class PaginatedReviews(BaseModel):
    page: int
    page_size: int
    total: int
    items: list[ReviewResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True,
    }
