from pydantic import BaseModel, ConfigDict, Field

from app.schemas.movie import MovieSummary


class RecommendationItem(MovieSummary):
    score: float = Field(ge=0)
    matched_signals: list[str] = Field(default_factory=list)
    reason: str


class RecommendationResponse(BaseModel):
    success: bool = True
    data: list[RecommendationItem]
    total: int
    seed_terms: list[str]
    sources: list[str]
    preferred_genres: list[str] = Field(default_factory=list)

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "success": True,
                "data": [
                    {
                        "imdb_id": "tt0468569",
                        "title": "The Dark Knight",
                        "year": "2008",
                        "type": "movie",
                        "poster": "https://example.com/poster.jpg",
                        "plot": "Batman faces the Joker in Gotham City.",
                        "imdb_rating": "9.0",
                        "average_rating": 9.0,
                        "score": 18.4,
                        "matched_signals": ["action", "superhero"],
                        "reason": "Based on your search history",
                    }
                ],
                "total": 1,
                "seed_terms": ["action", "superhero"],
                "sources": ["favorites", "search_history", "previously_viewed"],
                "preferred_genres": ["action", "superhero", "thriller"],
            }
        },
    )
