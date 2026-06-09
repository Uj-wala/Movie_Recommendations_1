from app.models.favorite import Favorite
from app.models.movie_view import MovieView
from app.models.review import Review
from app.models.user import User
from app.models.search_history import SearchHistory
from app.models.user_preference import UserPreference

__all__ = ["User", "Favorite", "Review", "SearchHistory", "MovieView", "UserPreference"]
