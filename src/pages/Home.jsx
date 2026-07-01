/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import {
  getHomeMovieSections,
  getMovieDetails,
  getProfile,
  getRecommendations,
  searchMovies,
  loginUser,
  registerUser,
  requestPasswordReset,
  getFavorites,
  addFavorite,
  removeFavorite,
  getCollections,
  getDiscoverCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  followCollection,
  unfollowCollection,
  addMovieToCollection,
  removeMovieFromCollection,
  getNotifications,
  markNotificationsRead,
  setAuthorizationHeader,
  clearAuth,
  getSearchHistory,
} from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { HomeContent } from '../components/home/HomeContent';
import {
  getRandomHeroMovie,
  isUnauthorizedError,
  normalizeCollections,
  normalizeFavoritesList,
  normalizeMovieCard,
  toStoredFavorite,
} from '../utils/homeMovies';
import heroPoster from '../assets/hero-poster.svg';

export const Home = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [telugu2025Movies, setTelugu2025Movies] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [discoverCollections, setDiscoverCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);
  const [searchHistoryPage, setSearchHistoryPage] = useState(1);
  const [searchHistoryLimit] = useState(8);
  const [searchHistoryTotalPages, setSearchHistoryTotalPages] = useState(0);
  const [searchHistoryTotal, setSearchHistoryTotal] = useState(0);
  const [authToken, setAuthToken] = useLocalStorage('authToken', '');
  const [authEmail, setAuthEmail] = useLocalStorage('authEmail', '');
  const [profile, setProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const searchRequestIdRef = useRef(0);
  const authClearedToastShownRef = useRef(false);
  const [recommendationsRefreshKey, setRecommendationsRefreshKey] = useState(0);
  const { addToast } = useToast();
  const watchlistStorageKey = authEmail ? `watchlistMovies:${authEmail.toLowerCase().trim()}` : 'watchlistMovies:guest';
  const [localFavorites, setLocalFavorites] = useLocalStorage(watchlistStorageKey, []);
  const [favorites, setFavorites] = useState(() => normalizeFavoritesList(localFavorites));
  const [compareMovies, setCompareMovies] = useLocalStorage('compareMovies', []);
  const activeView = location.pathname.startsWith('/favorites')
    ? 'favorites'
    : location.pathname.startsWith('/watchlist')
      ? 'watchlist'
      : location.pathname.startsWith('/collections')
        ? 'collections'
        : location.pathname.startsWith('/compare')
          ? 'compare'
          : location.pathname.startsWith('/admin')
            ? 'admin'
            : 'home';

  const replaceFavorites = useCallback((nextFavorites) => {
    const normalizedFavorites = normalizeFavoritesList(nextFavorites);
    setFavorites(normalizedFavorites);
    setLocalFavorites(normalizedFavorites);
    return normalizedFavorites;
  }, [setLocalFavorites]);

  const refreshRecommendations = useCallback(() => {
    if (!authToken) return;
    setRecommendationsRefreshKey((value) => value + 1);
  }, [authToken]);

  const validateAuthCredentials = (emailValue, passwordValue) => {
    const email = emailValue.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) return 'Email is required.';
    if (!emailRegex.test(email)) return 'Enter a valid email address.';
    if (!passwordValue) return 'Password is required.';
    if (passwordValue.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  useEffect(() => {
    let isCurrent = true;

    getHomeMovieSections().then((result) => {
      if (!isCurrent) return;
      if (result.success) {
        const featured = result.data.featured || [];
        setFeaturedMovies(featured);
        setHeroMovie(getRandomHeroMovie(featured));
        setTrendingMovies(result.data.trending);
        setPopularMovies(result.data.popular);
        setTelugu2025Movies(result.data.telugu2025 || []);
      } else {
        setError(result.error || 'No movies found');
      }
      setFeaturedLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      if (authClearedToastShownRef.current) {
        return;
      }
      authClearedToastShownRef.current = true;
      setAuthToken('');
      setAuthEmail('');
      setProfile(null);
      setFavorites([]);
      setError('');
      addToast('Session expired. Please sign in again.', 'warning');
    };
    window.addEventListener('cineverse:auth_cleared', handler);
    return () => window.removeEventListener('cineverse:auth_cleared', handler);
  }, [addToast, setAuthEmail, setAuthToken]);

  useEffect(() => {
    if (authToken) {
      authClearedToastShownRef.current = false;
    }
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setFavorites(normalizeFavoritesList(localFavorites));
    }
  }, [authToken, localFavorites]);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    setError('');
    const result = await getFavorites();
    if (result.success) {
      replaceFavorites(result.data);
    } else {
      setError(result.error || 'Unable to load watchlist');
    }
    setFavoritesLoading(false);
  }, [replaceFavorites]);

  const loadCollections = useCallback(async () => {
    if (!authToken) {
      setCollections([]);
      return;
    }

    setCollectionsLoading(true);
    const result = await getCollections();
    if (result.success) {
      setCollections(normalizeCollections(result.data));
    } else {
      const message = result.error || 'Unable to load collections';
      setError(message);
      addToast(message, 'error');
    }
    setCollectionsLoading(false);
  }, [addToast, authToken]);

  const loadDiscoverCollections = useCallback(async () => {
    if (!authToken) {
      setDiscoverCollections([]);
      return;
    }

    const result = await getDiscoverCollections();
    if (result.success) {
      setDiscoverCollections(normalizeCollections(result.data));
    }
  }, [authToken]);

  const loadNotifications = useCallback(async () => {
    if (!authToken) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    const result = await getNotifications();
    if (result.success) {
      setNotifications(result.data.items || []);
      setUnreadNotifications(result.data.unread_count || 0);
    }
  }, [authToken]);

  useEffect(() => {
    let isCurrent = true;

    if (!authToken) {
      setRecommendedMovies([]);
      setRecommendedLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setRecommendedLoading(true);
    getRecommendations(8).then((result) => {
      if (!isCurrent) return;
      loadNotifications();

      if (!result.success || !result.data.length) {
        setRecommendedMovies([]);
        setRecommendedLoading(false);
        return;
      }

      Promise.all(
        result.data.map(async (movie) => {
          try {
            const details = await getMovieDetails(movie.imdbID);
            if (details.success && details.data) {
              return normalizeMovieCard({
                ...movie,
                ...details.data,
                score: movie.score,
                matchedSignals: movie.matchedSignals,
                reason: movie.reason,
              });
            }
          } catch {
            // Fall back to the recommendation payload if the detail lookup fails.
          }

          return normalizeMovieCard(movie);
        })
      ).then((enrichedMovies) => {
        if (!isCurrent) return;
        setRecommendedMovies(enrichedMovies);
        setRecommendedLoading(false);
      });
    });

    return () => {
      isCurrent = false;
    };
  }, [authToken, loadNotifications, recommendationsRefreshKey]);

  const loadSearchHistory = useCallback(async (page = 1) => {
    if (!authToken) {
      return;
    }

    const result = await getSearchHistory(page, searchHistoryLimit);
    if (result.success) {
      setRecentSearches(result.data);
      setSearchHistoryPage(result.page || page);
      setSearchHistoryTotalPages(result.totalPages || 0);
      setSearchHistoryTotal(result.total || 0);
    }
  }, [authToken, searchHistoryLimit, setRecentSearches]);

  useEffect(() => {
    if (authToken) {
      setAuthorizationHeader(authToken);
      loadFavorites();
      loadCollections();
      loadDiscoverCollections();
      loadNotifications();
      loadSearchHistory(1);
      getProfile().then((result) => {
        if (result.success) {
          setProfile(result.data);
        }
      });
      return;
    }

    setAuthorizationHeader(null);
    setProfile(null);
    setRecommendedMovies([]);
    setCollections([]);
    setDiscoverCollections([]);
    setNotifications([]);
    setUnreadNotifications(0);
    setIsNotificationPanelOpen(false);
    setCollectionsLoading(false);
    setRecommendedLoading(false);
    setSearchHistoryPage(1);
    setSearchHistoryTotalPages(0);
    setSearchHistoryTotal(0);
  }, [authToken, loadCollections, loadDiscoverCollections, loadFavorites, loadNotifications, loadSearchHistory]);

  const handleCreateCollection = useCallback(async (name, description) => {
    if (!authToken) {
      handleAuthOpen('login');
      return null;
    }

    const result = await createCollection(name, description);
    if (!result.success) {
      addToast(result.error || 'Unable to create collection.', 'error');
      return null;
    }

    const created = normalizeCollections([result.data])[0];
    setCollections((current) => normalizeCollections([created, ...current]));
    addToast('Collection created successfully.', 'success');
    return created;
  }, [addToast, authToken]);

  const handleUpdateCollection = useCallback(async (collectionId, payload) => {
    const result = await updateCollection(collectionId, payload);
    if (!result.success) {
      addToast(result.error || 'Unable to update collection.', 'error');
      return;
    }

    const updated = normalizeCollections([result.data])[0];
    setCollections((current) => current.map((collection) => (
      collection.id === collectionId ? updated : collection
    )));
    addToast('Collection updated successfully.', 'success');
  }, [addToast]);

  const handleDeleteCollection = useCallback(async (collectionId) => {
    const result = await deleteCollection(collectionId);
    if (!result.success) {
      addToast(result.error || 'Unable to delete collection.', 'error');
      return;
    }

    setCollections((current) => current.filter((collection) => collection.id !== collectionId));
    addToast('Collection deleted successfully.', 'info');
  }, [addToast]);

  const handleFollowCollection = useCallback(async (collectionId, isFollowed) => {
    if (!authToken) {
      handleAuthOpen('login');
      return;
    }

    const result = isFollowed
      ? await unfollowCollection(collectionId)
      : await followCollection(collectionId);

    if (!result.success) {
      addToast(result.error || 'Unable to update collection follow.', 'error');
      return;
    }

    setDiscoverCollections((current) => current.map((collection) => (
      collection.id === collectionId ? normalizeCollections([result.data])[0] : collection
    )));
    addToast(isFollowed ? 'Collection unfollowed.' : 'Collection followed.', isFollowed ? 'info' : 'success');
    loadNotifications();
  }, [addToast, authToken, loadNotifications]);

  const handleMarkNotificationRead = useCallback(async (notificationId) => {
    const result = await markNotificationsRead([notificationId]);
    if (result.success) {
      setNotifications(result.data.items || []);
      setUnreadNotifications(result.data.unread_count || 0);
    }
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    const result = await markNotificationsRead();
    if (result.success) {
      setNotifications(result.data.items || []);
      setUnreadNotifications(result.data.unread_count || 0);
    }
  }, []);

  const handleNotificationsToggle = useCallback(() => {
    setIsNotificationPanelOpen((isOpen) => {
      const nextIsOpen = !isOpen;
      if (nextIsOpen) {
        loadNotifications();
      }
      return nextIsOpen;
    });
  }, [loadNotifications]);

  const handleAddMovieToCollection = useCallback(async (collectionId, movie) => {
    if (!authToken) {
      handleAuthOpen('login');
      return false;
    }

    const result = await addMovieToCollection(collectionId, movie);
    if (!result.success) {
      const isDuplicate = result.error === 'Movie already in collection';
      addToast(result.error || 'Unable to add movie to collection.', isDuplicate ? 'info' : 'error');
      return isDuplicate;
    }

    setCollections((current) => current.map((collection) => {
      if (collection.id !== collectionId) return collection;
      const movies = [result.data, ...(collection.movies || [])];
      return { ...collection, movies, movie_count: movies.length };
    }));
    addToast('Movie added to collection.', 'success');
    return true;
  }, [addToast, authToken]);

  const handleRemoveMovieFromCollection = useCallback(async (collectionId, imdbID) => {
    const result = await removeMovieFromCollection(collectionId, imdbID);
    if (!result.success) {
      addToast(result.error || 'Unable to remove movie from collection.', 'error');
      return;
    }

    setCollections((current) => current.map((collection) => {
      if (collection.id !== collectionId) return collection;
      const movies = (collection.movies || []).filter((movie) => movie.imdb_id !== imdbID && movie.imdbID !== imdbID);
      return { ...collection, movies, movie_count: movies.length };
    }));
    addToast('Movie removed from collection.', 'info');
  }, [addToast]);

  const handleSearch = useCallback(async (term, options = {}) => {
    const { remember = true } = options;
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    if (!term.trim()) {
      setMovies([]);
      setError('');
      setCurrentPage(1);
      setTotalPages(0);
      setSearchTerm('');
      return;
    }

    const query = term.trim();
    setSearchTerm(query);
    setCurrentPage(1);
    setIsLoading(true);
    setError('');

    if (remember) {
      if (!authToken) {
        // Keep local recent searches capped when the user is not signed in.
        setRecentSearches((prev) => {
          const filtered = prev.filter((item) => {
            const keyword = typeof item === 'string' ? item : item.keyword;
            return keyword.toLowerCase() !== query.toLowerCase();
          });
          return [query, ...filtered].slice(0, 10);
        });
      } else {
        // Refresh page 1 so the newest search appears at the top of the history feed.
        setTimeout(() => loadSearchHistory(1), 500);
      }
    }

    const result = await searchMovies(query, 1);

    if (requestId !== searchRequestIdRef.current) {
      return;
    }

    if (result.success) {
      const moviesFound = result.data.Search || [];
      setMovies(moviesFound);
      const pages = Math.ceil(result.data.totalResults / 10);
      setTotalPages(pages);
      setError(moviesFound.length > 0 ? '' : 'No movies found');
      refreshRecommendations();
    } else {
      setMovies([]);
      setError(result.error || 'No movies found');
      setTotalPages(0);
    }

    setIsLoading(false);
  }, [setRecentSearches, authToken, loadSearchHistory, refreshRecommendations]);

  const handleSearchHistoryPageChange = useCallback((page) => {
    if (!authToken) return;
    if (page < 1 || page > searchHistoryTotalPages) return;
    loadSearchHistory(page);
  }, [authToken, loadSearchHistory, searchHistoryTotalPages]);

  const handlePageChange = useCallback(async (page) => {
    if (!searchTerm.trim() || page < 1 || page > totalPages) return;

    setCurrentPage(page);
    setIsLoading(true);
    setError('');

    const result = await searchMovies(searchTerm, page);

    if (result.success) {
      setMovies(result.data.Search || []);
      setError('');
    } else {
      setMovies([]);
      setError(result.error || 'Failed to fetch movies');
    }

    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchTerm, totalPages]);

  const handleAuthOpen = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setIsAuthModalOpen(true);
  };

  const handleProfileOpen = () => {
    if (!authToken) {
      handleAuthOpen('login');
      return;
    }
    navigate('/profile');
  };

  const handlePasswordResetRequest = async (email) => {
    setAuthLoading(true);
    setAuthError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      const message = !email.trim() ? 'Email is required.' : 'Enter a valid email address.';
      setAuthError(message);
      addToast(message, 'error');
      setAuthLoading(false);
      return false;
    }

    try {
      const result = await requestPasswordReset(email.trim());
      if (!result.success) {
        const message = result.error || 'Unable to create reset link.';
        setAuthError(message);
        addToast(message, 'error');
        return false;
      }

      setAuthError('');
      addToast(
        result.data?.delivery === 'email'
          ? 'Password reset link sent to your email.'
          : 'Use the reset link shown in the dialog.',
        'success'
      );
      return { success: true, resetLink: result.data?.reset_link || '' };
    } catch (err) {
      const message = err.message || 'Unable to create reset link.';
      setAuthError(message);
      addToast(message, 'error');
      return { success: false };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');

    const validationMessage = validateAuthCredentials(email, password);
    if (validationMessage) {
      setAuthError(validationMessage);
      addToast(validationMessage, 'error');
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'register') {
        const registrationResult = await registerUser(email, password);
        if (!registrationResult.success) {
          const message = registrationResult.error || 'Registration failed.';
          setAuthError(message);
          addToast(message, 'error');
          return;
        }
      }

      const loginResult = await loginUser(email, password);
      if (!loginResult.success) {
        const message = loginResult.error || 'Login failed.';
        setAuthError(message);
        addToast(message, 'error');
        return;
      }

      const token = loginResult.data.access_token;
      setAuthToken(token);
      setAuthEmail(email);
      setAuthorizationHeader(token);
      addToast('Signed in successfully.', 'success');
      setIsAuthModalOpen(false);
    } catch (err) {
      const message = err.message || 'Authentication failed.';
      setAuthError(message);
      addToast(message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setAuthToken('');
    setAuthEmail('');
    setProfile(null);
    setFavorites([]);
    setError('');
    addToast('Logged out successfully.', 'info');
  };

  const handleFavoriteToggle = useCallback(async (imdbID) => {
    const existing = favorites.find((f) => f.imdbID === imdbID);
    const movieToToggle = movies.find((m) => m.imdbID === imdbID) ||
      featuredMovies.find((m) => m.imdbID === imdbID) ||
      trendingMovies.find((m) => m.imdbID === imdbID) ||
      popularMovies.find((m) => m.imdbID === imdbID) ||
      telugu2025Movies.find((m) => m.imdbID === imdbID) ||
      recommendedMovies.find((m) => m.imdbID === imdbID) ||
      collections
        .flatMap((collection) => collection.movies || [])
        .map(normalizeMovieCard)
        .find((m) => m.imdbID === imdbID) ||
      selectedMovie ||
      favorites.find((f) => f.imdbID === imdbID);

    if (!movieToToggle) return;

    if (!authToken) {
      if (existing) {
        replaceFavorites(localFavorites.filter((movie) => movie.imdbID !== imdbID));
        addToast('Removed from local watchlist.', 'info');
        return;
      }

      const storedMovie = toStoredFavorite(movieToToggle);
      if (localFavorites.some((movie) => movie.imdbID === imdbID)) return;
      replaceFavorites([storedMovie, ...localFavorites]);
      addToast('Added to local watchlist.', 'success');
      return;
    }

    if (existing) {
      const result = await removeFavorite(imdbID);
      if (result.success) {
        replaceFavorites(localFavorites.filter((fav) => fav.imdbID !== imdbID));
        addToast('Removed from your watchlist.', 'info');
        refreshRecommendations();
      } else if (result.error === 'Watchlist movie not found') {
        replaceFavorites(localFavorites.filter((fav) => fav.imdbID !== imdbID));
        addToast('This movie was already removed from your watchlist.', 'info');
      } else {
        const message = result.error || 'Unable to remove favorite';
        setError(message);
        addToast(message, 'error');
      }
      return;
    }

    const result = await addFavorite(movieToToggle);
    if (result.success) {
      replaceFavorites([result.data, ...localFavorites]);
      addToast('Added to your watchlist.', 'success');
      refreshRecommendations();
    } else if (result.error === 'Movie already in watchlist') {
      replaceFavorites(normalizeFavoritesList([movieToToggle, ...localFavorites]));
      addToast('Movie is already in your watchlist.', 'info');
    } else if (isUnauthorizedError(result.error)) {
      clearAuth();
      setAuthToken('');
      setAuthEmail('');
      setProfile(null);
      replaceFavorites([toStoredFavorite(movieToToggle), ...localFavorites]);
      addToast('Session expired. Added locally. Sign in again to save it to your account.', 'warning');
    } else {
      const message = result.error || 'Unable to save favorite';
      setError(message);
      addToast(message, 'error');
    }
  }, [
    authToken,
    favorites,
    movies,
    featuredMovies,
    trendingMovies,
    popularMovies,
    telugu2025Movies,
    recommendedMovies,
    collections,
    selectedMovie,
    localFavorites,
    replaceFavorites,
    addToast,
    refreshRecommendations,
    setAuthEmail,
    setAuthToken,
  ]);

  const isFavorite = (imdbID) => favorites.some((m) => m.imdbID === imdbID);
  const normalizedCompareMovies = normalizeFavoritesList(compareMovies).slice(0, 2).map(normalizeMovieCard);
  const isCompareSelected = (imdbID) => normalizedCompareMovies.some((movie) => movie.imdbID === imdbID);
  const isCompareLimitReached = normalizedCompareMovies.length >= 2;

  const handleCompareToggle = useCallback(async (movie) => {
    if (!movie?.imdbID) return;

    const normalizedMovie = normalizeMovieCard(movie);
    const isSelected = normalizedCompareMovies.some((selectedMovie) => selectedMovie.imdbID === normalizedMovie.imdbID);

    if (isSelected) {
      setCompareMovies((current) => current.filter((selectedMovie) => {
        const currentMovie = normalizeMovieCard(selectedMovie);
        return currentMovie.imdbID !== normalizedMovie.imdbID;
      }));
      addToast('Removed from comparison.', 'info');
      return;
    }

    if (normalizedCompareMovies.length >= 2) {
      addToast('You can compare up to 2 movies at a time.', 'warning');
      return;
    }

    let movieForComparison = normalizedMovie;
    const details = await getMovieDetails(normalizedMovie.imdbID);
    if (details.success && details.data) {
      movieForComparison = normalizeMovieCard({
        ...normalizedMovie,
        ...details.data,
      });
    }

    setCompareMovies((current) => normalizeFavoritesList([movieForComparison, ...current]).slice(0, 2));
    addToast('Added to comparison.', 'success');
  }, [addToast, normalizedCompareMovies, setCompareMovies]);

  const handleRemoveCompareMovie = useCallback((imdbID) => {
    setCompareMovies((current) => current.filter((movie) => normalizeMovieCard(movie).imdbID !== imdbID));
    addToast('Removed from comparison.', 'info');
  }, [addToast, setCompareMovies]);

  const handleClearCompareMovies = useCallback(() => {
    setCompareMovies([]);
    addToast('Comparison cleared.', 'info');
  }, [addToast, setCompareMovies]);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  const isSearchActive = Boolean(searchTerm.trim());
  const hasSearchResults = movies.length > 0;
  const visibleMovies = hasSearchResults ? movies : (!isSearchActive ? featuredMovies : []);
  const isDiscoveryMode = !isSearchActive;
  const heroPosterSrc = heroMovie?.Poster && heroMovie.Poster !== 'N/A' ? heroMovie.Poster : heroPoster;
  const isAuthenticated = Boolean(authToken);
  const showRecommendedSection = isDiscoveryMode;

  return (
    <HomeContent
      {...{
        isDark, favorites, activeView, navigate, isAuthenticated, authEmail, profile,
        compareMovies: normalizedCompareMovies,
        unreadNotifications, isNotificationPanelOpen, notifications, collections,
        collectionsLoading, discoverCollections, favoritesLoading, searchTerm,
        visibleMovies, isDiscoveryMode, heroMovie, heroPosterSrc, isLoading,
        recentSearches, searchHistoryPage, searchHistoryTotalPages, searchHistoryTotal,
        searchHistoryLimit, featuredLoading, error, showRecommendedSection,
        recommendedLoading, recommendedMovies, trendingMovies, popularMovies,
        telugu2025Movies, currentPage, totalPages, movies, selectedMovie, isModalOpen,
        isAuthModalOpen, authMode, authLoading, authError,
        handleAuthOpen, handleProfileOpen, handleLogout, handleNotificationsToggle,
        handleMarkNotificationRead, handleMarkAllNotificationsRead, handleCreateCollection,
        handleUpdateCollection, handleDeleteCollection, handleRemoveMovieFromCollection,
        handleFavoriteToggle, isFavorite, handleCompareToggle, handleRemoveCompareMovie,
        handleClearCompareMovies, isCompareSelected, isCompareLimitReached, handleMovieClick, handleFollowCollection,
        handleSearch, handleSearchHistoryPageChange, handlePageChange, handleModalClose,
        refreshRecommendations, loadNotifications, handleAuthSubmit, setAuthMode,
        handlePasswordResetRequest, handleAddMovieToCollection, setIsAuthModalOpen,
        setIsNotificationPanelOpen,
      }}
    />
  );
};
