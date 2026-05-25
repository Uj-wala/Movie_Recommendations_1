from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.schemas.favorite import FavoriteCreate, FavoriteResponse
from app.schemas.movie import MovieDetailResponse, MovieSearchResponse, MovieSummary

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "FavoriteCreate",
    "FavoriteResponse",
    "MovieSearchResponse",
    "MovieDetailResponse",
    "MovieSummary",
]
