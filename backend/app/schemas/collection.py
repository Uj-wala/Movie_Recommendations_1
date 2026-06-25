from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CollectionBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Collection name is required")
        return cleaned

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Collection name is required")
        return cleaned

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class CollectionMovieCreate(BaseModel):
    imdb_id: str = Field(min_length=5, max_length=20)
    title: str = Field(min_length=1, max_length=255)
    year: str = Field(min_length=1, max_length=10)
    poster_url: str = Field(min_length=1, max_length=500)
    type: str = Field(default="movie", min_length=1, max_length=40)


class CollectionMovieResponse(BaseModel):
    id: int
    imdb_id: str
    title: str
    year: str
    poster_url: str
    type: str
    created_at: datetime

    class Config:
        from_attributes = True


class CollectionResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    movie_count: int
    followers_count: int = 0
    followed_by_me: bool = False
    owner_email: str | None = None
    movies: list[CollectionMovieResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
