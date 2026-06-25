from app.models.favorite import Favorite
from app.models.collection import Collection, CollectionMovie
from app.models.collection_follow import CollectionFollow
from app.models.admin_activity_log import AdminActivityLog
from app.models.movie_view import MovieView
from app.models.notification import Notification
from app.models.review import Review
from app.models.review_like import ReviewLike
from app.models.user import User
from app.models.search_history import SearchHistory
from app.models.user_preference import UserPreference
from app.models.watchlist import Watchlist

__all__ = [
    "User",
    "Favorite",
    "Collection",
    "CollectionMovie",
    "CollectionFollow",
    "Watchlist",
    "Review",
    "ReviewLike",
    "Notification",
    "SearchHistory",
    "MovieView",
    "UserPreference",
    "AdminActivityLog",
]
