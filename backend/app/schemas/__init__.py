from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.schemas.dashboard import DashboardStatsData
from app.schemas.favorite import FavoriteCreate, FavoriteResponse
from app.schemas.error import ErrorResponse, ValidationErrorResponse
from app.schemas.history import SearchHistoryItem, SearchHistoryQuery, SearchHistoryResponse, SearchKeywordQuery
from app.schemas.movie import MovieDetailResponse, MovieSearchResponse, MovieSummary
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "FavoriteCreate",
    "FavoriteResponse",
    "ErrorResponse",
    "ValidationErrorResponse",
    "SearchKeywordQuery",
    "SearchHistoryQuery",
    "MovieSearchResponse",
    "MovieDetailResponse",
    "MovieSummary",
    "SearchHistoryItem",
    "SearchHistoryResponse",
    "DashboardStatsData",
    "ReviewCreate",
    "ReviewResponse",
    "ReviewUpdate",
]
