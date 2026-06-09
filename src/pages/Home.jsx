/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle, FiFilm, FiTrendingUp, FiZap } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import {
  getHomeMovieSections,
  getMovieDetails,
  getRecommendations,
  searchMovies,
  loginUser,
  registerUser,
  resetPassword,
  getFavorites,
  addFavorite,
  removeFavorite,
  setAuthorizationHeader,
  clearAuth,
  getSearchHistory,
} from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CinematicBackground } from '../components/CinematicBackground';
import { SearchBar } from '../components/SearchBar';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { Loader } from '../components/Loader';
import { Pagination } from '../components/Pagination';
import { Navbar } from '../components/Navbar';
import { ThemeToggle } from '../components/ThemeToggle';
import { AuthModal } from '../components/AuthModal';
import heroPoster from '../assets/hero-poster.svg';
import { FavoritesPage } from './FavoritesPage';

const normalizeFavorite = (favorite) => ({
  ...favorite,
  imdbID: favorite.imdbID || favorite.imdb_id,
  Title: favorite.Title || favorite.title,
  Year: favorite.Year || favorite.year,
  Poster: favorite.Poster || favorite.poster_url,
  Type: favorite.Type || favorite.type || 'movie',
});

const normalizeFavoritesList = (favoriteList = []) => {
  const favoritesMap = new Map();

  favoriteList.forEach((favorite) => {
    const normalized = normalizeFavorite(favorite);
    if (normalized.imdbID) {
      favoritesMap.set(normalized.imdbID, normalized);
    }
  });

  return Array.from(favoritesMap.values());
};

const toStoredFavorite = (movie) => ({
  imdbID: movie.imdbID,
  Title: movie.Title,
  Year: movie.Year,
  Poster: movie.Poster,
  Type: movie.Type || 'movie',
  imdbRating: movie.imdbRating,
  averageRating: movie.averageRating,
});

const normalizeMovieCard = (movie) => ({
  ...movie,
  imdbID: movie.imdbID || movie.imdb_id,
  Title: movie.Title || movie.title,
  Year: movie.Year || movie.year,
  Poster: movie.Poster || movie.poster,
  Type: movie.Type || movie.type || 'movie',
  Plot: movie.Plot || movie.plot,
  imdbRating: movie.imdbRating || movie.imdb_rating,
  averageRating: movie.averageRating ?? movie.average_rating ?? null,
});

export const Home = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
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
  const [localFavorites, setLocalFavorites] = useLocalStorage('favoriteMovies', []);
  const [favorites, setFavorites] = useState(() => normalizeFavoritesList(localFavorites));
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);
  const [searchHistoryPage, setSearchHistoryPage] = useState(1);
  const [searchHistoryLimit] = useState(8);
  const [searchHistoryTotalPages, setSearchHistoryTotalPages] = useState(0);
  const [searchHistoryTotal, setSearchHistoryTotal] = useState(0);
  const [authToken, setAuthToken] = useLocalStorage('authToken', '');
  const [authEmail, setAuthEmail] = useLocalStorage('authEmail', '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const searchRequestIdRef = useRef(0);
  const [recommendationsRefreshKey, setRecommendationsRefreshKey] = useState(0);
  const { addToast } = useToast();
  const activeView = location.pathname.startsWith('/favorites') ? 'favorites' : 'home';

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
        setFeaturedMovies(result.data.featured);
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
  }, [authToken, recommendationsRefreshKey]);

  useEffect(() => {
    const handler = () => {
      setAuthToken('');
      setAuthEmail('');
      setFavorites(normalizeFavoritesList(localFavorites));
      setError('');
      addToast('Session expired. Please sign in again.', 'warning');
    };
    window.addEventListener('cineverse:auth_cleared', handler);
    return () => window.removeEventListener('cineverse:auth_cleared', handler);
  }, [addToast, localFavorites, setAuthEmail, setAuthToken]);

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
      loadSearchHistory(1);
      return;
    }

    setAuthorizationHeader(null);
    setRecommendedMovies([]);
    setRecommendedLoading(false);
    setSearchHistoryPage(1);
    setSearchHistoryTotalPages(0);
    setSearchHistoryTotal(0);
  }, [authToken, loadFavorites, loadSearchHistory]);

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
      } else if (authMode === 'reset') {
        const resetResult = await resetPassword(email, password);
        if (!resetResult.success) {
          const message = resetResult.error || 'Password reset failed.';
          setAuthError(message);
          addToast(message, 'error');
          return;
        }

        addToast('Password updated successfully. Please sign in again.', 'success');
        setAuthMode('login');
        return;
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
    setFavorites(normalizeFavoritesList(localFavorites));
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
    selectedMovie,
    localFavorites,
    replaceFavorites,
    addToast,
    refreshRecommendations,
  ]);

  const isFavorite = (imdbID) => favorites.some((m) => m.imdbID === imdbID);

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
  const heroMovie = featuredMovies[0];
  const isAuthenticated = Boolean(authToken);
  const showRecommendedSection = isDiscoveryMode;

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-950'}`}>
      <CinematicBackground />

      <Navbar
        favoriteCount={favorites.length}
        activeView={activeView}
        onHomeClick={() => navigate('/')}
        onFavoritesClick={() => navigate('/favorites')}
        isAuthenticated={isAuthenticated}
        authEmail={authEmail}
        onLoginClick={() => handleAuthOpen('login')}
        onRegisterClick={() => handleAuthOpen('register')}
        onLogoutClick={handleLogout}
      />

      {activeView === 'favorites' ? (
        <FavoritesPage
          favorites={favorites}
          onBack={() => navigate('/')}
          onMovieClick={handleMovieClick}
          onFavoriteToggle={handleFavoriteToggle}
          isFavorite={isFavorite}
          isLoading={favoritesLoading}
        />
      ) : (
      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="grid min-h-[calc(100vh-8rem)] items-center gap-12 py-12 md:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-cyan-700 shadow-[0_0_32px_rgba(34,211,238,0.18)] backdrop-blur-xl dark:text-cyan-100">
              <FiZap />
              OMDb powered cinema radar
            </div>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-[0.95] tracking-normal text-theme-strong sm:text-5xl lg:text-6xl xl:text-7xl">
                CineVerse
                <span className="block text-slate-700 dark:text-cyan-200">
                  Neural Listings
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-theme-muted sm:text-lg">
                Search the OMDb universe, build a live watchlist, and save your watchlist into SQLite-backed storage through the FastAPI backend.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-theme-muted">
              {isAuthenticated ? (
                <p>
                  Signed in as <span className="font-black text-theme-strong">{authEmail}</span>
                </p>
              ) : (
                <p>Favorites save locally. Login or register to save them with the backend API.</p>
              )}
            </div>
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              recentSearches={recentSearches}
              onRecentSearch={handleSearch}
              historyPagination={{
                page: searchHistoryPage,
                totalPages: searchHistoryTotalPages,
                totalItems: searchHistoryTotal,
                limit: searchHistoryLimit,
              }}
              onHistoryPageChange={handleSearchHistoryPageChange}
              isAuthenticated={isAuthenticated}
            />
          </div>

          <motion.div
            className="relative hidden min-h-[24rem] md:block md:min-h-[32rem] lg:min-h-[34rem]"
            style={{ perspective: 1200 }}
            initial={{ opacity: 0, rotateY: -18, y: 40 }}
            animate={{ opacity: 1, rotateY: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12 }}
          >
            {heroMovie && (
              <div className="absolute inset-0 rotate-2 rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-[0_30px_100px_rgba(79,70,229,0.34)] backdrop-blur-2xl">
                <img
                  src={heroPoster}
                  alt={heroMovie.Title}
                  className="h-full w-full rounded-[1.45rem] object-cover object-center"
                />
                <div className="absolute inset-4 rounded-[1.45rem] bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">Featured signal</p>
                  <h2 className="mt-2 text-4xl font-black text-theme-strong">{heroMovie.Title}</h2>
                  <p className="mt-2 text-theme-muted">{heroMovie.Type} / {heroMovie.Year}</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.section>

        <section className="relative">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-slate-600 dark:text-cyan-200">
                {isDiscoveryMode ? <FiTrendingUp /> : <FiFilm />}
                {isDiscoveryMode ? 'Trending movies' : `Search results for "${searchTerm}"`}
              </div>
              <h2 className="mt-2 text-3xl font-black text-theme-strong sm:text-4xl">
                {isDiscoveryMode ? 'Featured launch queue' : 'Matched transmissions'}
              </h2>
            </div>
            <ThemeToggle />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mb-10 flex items-start gap-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-5 text-rose-100 shadow-[0_0_32px_rgba(244,63,94,0.12)] backdrop-blur-xl"
              >
                <FiAlertTriangle className="mt-1 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {(isLoading || featuredLoading) && <Loader />}

          {!isLoading && !featuredLoading && !isDiscoveryMode && visibleMovies.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {visibleMovies.map((movie) => (
                <motion.div
                  key={movie.imdbID}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.96 },
                    show: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                  <MovieCard
                    movie={movie}
                    onClick={() => handleMovieClick(movie)}
                    onFavoriteToggle={handleFavoriteToggle}
                    isFavorite={isFavorite(movie.imdbID)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {!isLoading && !featuredLoading && isDiscoveryMode && (
            <div className="space-y-16">
              {showRecommendedSection && (
                <section>
                  <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-600 dark:text-fuchsia-200">
                        Personalized picks
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-theme-strong sm:text-3xl">
                        Recommended For You
                      </h3>
                    </div>
                    {!isAuthenticated && (
                      <p className="max-w-xl text-sm text-theme-muted">
                        Sign in to load personalized recommendations based on your favorites, search history, and recently viewed movies.
                      </p>
                    )}
                  </div>

                  {recommendedLoading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-theme-muted backdrop-blur-xl">
                      Loading your recommendations...
                    </div>
                  ) : recommendedMovies.length > 0 ? (
                    <motion.div
                      className="mx-auto grid max-w-7xl grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: '-80px' }}
                      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                    >
                      {recommendedMovies.map((movie) => (
                        <motion.div
                          key={movie.imdbID}
                          variants={{
                            hidden: { opacity: 0, y: 28, scale: 0.96 },
                            show: { opacity: 1, y: 0, scale: 1 },
                          }}
                        >
                          <MovieCard
                            movie={movie}
                            onClick={() => handleMovieClick(movie)}
                            onFavoriteToggle={handleFavoriteToggle}
                            isFavorite={isFavorite(movie.imdbID)}
                            compact
                            recommended
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : isAuthenticated ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-theme-muted backdrop-blur-xl">
                      Start searching and adding favorites to get personalized recommendations.
                    </div>
                  ) : null}
                </section>
              )}

              {trendingMovies.length > 0 && (
                <MovieSection
                  title="Trending movies"
                  eyebrow="Live audience heat"
                  movies={trendingMovies}
                  onMovieClick={handleMovieClick}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={isFavorite}
                />
              )}
              {popularMovies.length > 0 && (
                <MovieSection
                  title="Popular movies"
                  eyebrow="All-time sci-fi picks"
                  movies={popularMovies}
                  onMovieClick={handleMovieClick}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={isFavorite}
                />
              )}
              {telugu2025Movies.length > 0 && (
                <MovieSection
                  title="Telugu movies 2025"
                  eyebrow="Local API collection"
                  movies={telugu2025Movies}
                  onMovieClick={handleMovieClick}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={isFavorite}
                />
              )}
              {trendingMovies.length === 0 && popularMovies.length === 0 && telugu2025Movies.length === 0 && <NoMoviesFound />}
            </div>
          )}

          {!isLoading && !featuredLoading && !isDiscoveryMode && visibleMovies.length === 0 && (
            <NoMoviesFound />
          )}

          {!isLoading && movies.length > 0 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </section>
      </main>
      )}

      <AnimatePresence>
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            isFavorite={isFavorite(selectedMovie.imdbID)}
            onFavoriteToggle={handleFavoriteToggle}
            isAuthenticated={isAuthenticated}
            authEmail={authEmail}
            onRequireAuth={() => handleAuthOpen('login')}
            onMovieViewed={refreshRecommendations}
          />
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAuthSubmit}
        onModeChange={setAuthMode}
        isLoading={authLoading}
        error={authError}
      />
    </div>
  );
};

const MovieSection = ({ title, eyebrow, movies, onMovieClick, onFavoriteToggle, isFavorite }) => (
  <section>
    <div className="mb-6">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-600 dark:text-fuchsia-200">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black text-theme-strong sm:text-3xl">{title}</h3>
    </div>
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {movies.map((movie) => (
        <motion.div
          key={movie.imdbID}
          variants={{
            hidden: { opacity: 0, y: 28, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1 },
          }}
        >
          <MovieCard
            movie={movie}
            onClick={() => onMovieClick(movie)}
            onFavoriteToggle={onFavoriteToggle}
            isFavorite={isFavorite(movie.imdbID)}
          />
        </motion.div>
      ))}
    </motion.div>
  </section>
);

const NoMoviesFound = () => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-theme-muted backdrop-blur-xl">
    No movies found.
  </div>
);
