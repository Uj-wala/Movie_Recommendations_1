from datetime import datetime

from pydantic import AliasChoices, BaseModel, Field


class WatchlistCreate(BaseModel):
    imdb_id: str = Field(
        min_length=5,
        max_length=20,
        validation_alias=AliasChoices("imdb_id", "movie_id"),
        serialization_alias="imdb_id",
    )
    title: str | None = None
    year: str | None = None
    poster_url: str | None = None


class WatchlistResponse(BaseModel):
    id: int
    movie_id: str
    imdb_id: str
    title: str
    year: str
    poster_url: str
    created_at: datetime

    class Config:
        from_attributes = True
