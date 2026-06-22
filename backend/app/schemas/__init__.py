from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.dashboard import DashboardStatsData
from app.schemas.admin import AdminActivityLogListResponse, AdminStatsResponse, AdminUserResponse
from app.schemas.collection import (
    CollectionCreate,
    CollectionMovieCreate,
    CollectionMovieResponse,
    CollectionResponse,
    CollectionUpdate,
)
from app.schemas.favorite import FavoriteCreate, FavoriteResponse
from app.schemas.error import ErrorResponse, ValidationErrorResponse
from app.schemas.history import SearchHistoryItem, SearchHistoryQuery, SearchHistoryResponse, SearchKeywordQuery
from app.schemas.movie import MovieDetailResponse, MovieSearchResponse, MovieSummary
from app.schemas.recommendation import RecommendationItem, RecommendationResponse
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "ResetPasswordRequest",
    "ProfileUpdateRequest",
    "ChangePasswordRequest",
    "TokenResponse",
    "UserResponse",
    "ProfileResponse",
    "FavoriteCreate",
    "FavoriteResponse",
    "CollectionCreate",
    "CollectionUpdate",
    "CollectionMovieCreate",
    "CollectionMovieResponse",
    "CollectionResponse",
    "ErrorResponse",
    "ValidationErrorResponse",
    "SearchKeywordQuery",
    "SearchHistoryQuery",
    "MovieSearchResponse",
    "MovieDetailResponse",
    "MovieSummary",
    "RecommendationItem",
    "RecommendationResponse",
    "SearchHistoryItem",
    "SearchHistoryResponse",
    "DashboardStatsData",
    "AdminStatsResponse",
    "AdminUserResponse",
    "AdminActivityLogListResponse",
    "ReviewCreate",
    "ReviewResponse",
    "ReviewUpdate",
]
