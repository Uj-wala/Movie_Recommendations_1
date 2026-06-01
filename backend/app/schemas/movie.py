from typing import Any

from pydantic import BaseModel, Field


class MovieSummary(BaseModel):
    imdb_id: str
    title: str
    year: str
    type: str
    poster: str


class MovieSearchResponse(BaseModel):
    title: str
    page: int
    total_results: int
    results: list[MovieSummary]


class MovieDetailResponse(BaseModel):
    imdb_id: str
    title: str
    year: str
    rated: str | None = None
    released: str | None = None
    runtime: str | None = None
    genre: str | None = None
    director: str | None = None
    writer: str | None = None
    actors: str | None = None
    plot: str | None = None
    language: str | None = None
    country: str | None = None
    poster: str | None = None
    imdb_rating: str | None = None
    imdb_votes: str | None = None
    box_office: str | None = None
    type: str | None = None
    total_seasons: str | None = None
    ratings: list[dict[str, Any]] = Field(default_factory=list)
    average_rating: float | None = None
