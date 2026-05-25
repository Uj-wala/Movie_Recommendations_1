from datetime import datetime

from pydantic import BaseModel, Field


class FavoriteCreate(BaseModel):
    imdb_id: str = Field(min_length=5, max_length=20)
    title: str = Field(min_length=1, max_length=255)
    year: str = Field(min_length=1, max_length=10)
    poster_url: str = Field(min_length=1, max_length=500)


class FavoriteResponse(BaseModel):
    id: int
    imdb_id: str
    title: str
    year: str
    poster_url: str
    created_at: datetime

    class Config:
        from_attributes = True
