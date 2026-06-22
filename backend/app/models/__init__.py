from app.models.favorite import Favorite
from app.models.collection import Collection, CollectionMovie
from app.models.admin_activity_log import AdminActivityLog
from app.models.movie_view import MovieView
from app.models.review import Review
from app.models.user import User
from app.models.search_history import SearchHistory
from app.models.user_preference import UserPreference
from app.models.watchlist import Watchlist

__all__ = [
    "User",
    "Favorite",
    "Collection",
    "CollectionMovie",
    "Watchlist",
    "Review",
    "SearchHistory",
    "MovieView",
    "UserPreference",
    "AdminActivityLog",
]
