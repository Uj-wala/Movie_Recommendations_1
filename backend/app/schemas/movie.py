from typing import Any

from pydantic import BaseModel, Field


class MovieSummary(BaseModel):
    imdb_id: str
    title: str
    year: str
    type: str
    poster: str
    plot: str | None = None
    imdb_rating: str | None = None
    average_rating: float | None = None


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
    community_average_rating: float | None = None
    user_rating: int | None = None


class MovieCompareItem(BaseModel):
    movie: MovieDetailResponse
    average_user_rating: float | None = None
    total_reviews: int


class NumericComparison(BaseModel):
    movie1: float | int | None = None
    movie2: float | int | None = None
    difference: float | int | None = None
    winner: str | None = None


class GenreComparison(BaseModel):
    common: list[str] = Field(default_factory=list)
    only_movie1: list[str] = Field(default_factory=list)
    only_movie2: list[str] = Field(default_factory=list)


class AttributeComparison(BaseModel):
    field: str
    movie1: str | None = None
    movie2: str | None = None
    same: bool


class MovieComparisonSummary(BaseModel):
    rating: NumericComparison
    release_year: NumericComparison
    duration_minutes: NumericComparison
    genres: GenreComparison
    attributes: list[AttributeComparison] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)


class MovieCompareResponse(BaseModel):
    movie1: MovieCompareItem
    movie2: MovieCompareItem
    summary: MovieComparisonSummary
