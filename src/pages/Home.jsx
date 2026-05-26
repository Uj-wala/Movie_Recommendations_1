import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle, FiFilm, FiTrendingUp, FiZap, FiLogIn, FiLogOut, FiUserPlus } from 'react-icons/fi';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import {
  getHomeMovieSections,
  searchMovies,
  loginUser,
  registerUser,
  getFavorites,
  addFavorite,
  removeFavorite,
  setAuthorizationHeader,
  clearAuth,
} from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CinematicBackground } from '../components/CinematicBackground';
import { SearchBar } from '../components/SearchBar';
import { MovieCard } from '../components/MovieCard';
import { MovieModal } from '../components/MovieModal';
import { Loader } from '../components/Loader';
import { Pagination } from '../components/Pagination';
import { Navbar } from '../components/Navbar';
import { Favorites } from '../components/Favorites';
import { ThemeToggle } from '../components/ThemeToggle';
import { AuthModal } from '../components/AuthModal';

const normalizeFavorite = (favorite) => ({
  ...favorite,
  imdbID: favorite.imdb_id,
  Title: favorite.title,
  Year: favorite.year,
  Poster: favorite.poster_url,
  Type: 'movie',
});

export const Home = () => {
  const { isDark } = useTheme();
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [authToken, setAuthToken] = useLocalStorage('authToken', '');
  const [authEmail, setAuthEmail] = useLocalStorage('authEmail', '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    let isCurrent = true;

    getHomeMovieSections().then((result) => {
      if (!isCurrent) return;
      if (result.success) {
        setFeaturedMovies(result.data.featured);
        setTrendingMovies(result.data.trending);
        setPopularMovies(result.data.popular);
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
    if (authToken) {
      setAuthorizationHeader(authToken);
      loadFavorites();
    }
  }, [authToken]);

  const loadFavorites = useCallback(async () => {
    if (!authToken) {
      setFavorites([]);
      return;
    }

    setError('');
    const result = await getFavorites();
    if (result.success) {
      setFavorites(result.data.map(normalizeFavorite));
    } else {
      setError(result.error || 'Unable to load watchlist');
    }
  }, [authToken]);

  const handleSearch = useCallback(async (term) => {
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

    setRecentSearches((prev) => [query, ...prev.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 6));

    const result = await searchMovies(query, 1);

    if (result.success) {
      setMovies(result.data.Search || []);
      const pages = Math.ceil(result.data.totalResults / 10);
      setTotalPages(pages);
      setError('');
    } else {
      setMovies([]);
      setError(result.error || 'No movies found');
      setTotalPages(0);
    }

    setIsLoading(false);
  }, [setRecentSearches]);

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

    try {
      if (authMode === 'register') {
        const registrationResult = await registerUser(email, password);
        if (!registrationResult.success) {
          throw new Error(registrationResult.error);
        }
      }

      const loginResult = await loginUser(email, password);
      if (!loginResult.success) {
        throw new Error(loginResult.error);
      }

      const token = loginResult.data.access_token;
      setAuthToken(token);
      setAuthEmail(email);
      setAuthorizationHeader(token);
      await loadFavorites();
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
    setFavorites([]);
    setError('');
    addToast('Logged out successfully.', 'info');
  };

  const handleFavoriteToggle = useCallback(async (imdbID) => {
    if (!authToken) {
      addToast('Please login to save favorites.', 'warning');
      handleAuthOpen('login');
      return;
    }

    const existing = favorites.find((f) => f.imdbID === imdbID);
    const movieToToggle = movies.find((m) => m.imdbID === imdbID) ||
      featuredMovies.find((m) => m.imdbID === imdbID) ||
      selectedMovie ||
      favorites.find((f) => f.imdbID === imdbID);

    if (!movieToToggle) return;

    if (existing) {
      const result = await removeFavorite(imdbID);
      if (result.success) {
        setFavorites((prev) => prev.filter((fav) => fav.imdbID !== imdbID));
        addToast('Removed from your watchlist.', 'info');
      } else {
        const message = result.error || 'Unable to remove favorite';
        setError(message);
        addToast(message, 'error');
      }
      return;
    }

    const result = await addFavorite(movieToToggle);
    if (result.success) {
      setFavorites((prev) => [normalizeFavorite(result.data), ...prev]);
      addToast('Added to your watchlist.', 'success');
    } else {
      const message = result.error || 'Unable to save favorite';
      setError(message);
      addToast(message, 'error');
    }
  }, [authToken, favorites, movies, featuredMovies, selectedMovie]);

  const isFavorite = (imdbID) => favorites.some((m) => m.imdbID === imdbID);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300);
  };

  const visibleMovies = movies.length ? movies : featuredMovies;
  const isDiscoveryMode = movies.length === 0 && !searchTerm;
  const heroMovie = featuredMovies[0];
  const isAuthenticated = Boolean(authToken);

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-950'}`}>
      <CinematicBackground />

      <Navbar
        favoriteCount={favorites.length}
        onFavoritesClick={() => setIsFavoritesOpen(true)}
      />

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="grid min-h-[calc(100vh-8rem)] items-center gap-10 py-10 md:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.18)] backdrop-blur-xl">
              <FiZap />
              OMDb powered cinema radar
            </div>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-[0.95] tracking-normal text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                CineVerse
                <span className="block bg-gradient-to-r from-cyan-200 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  Neural Listings
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Search the OMDb universe, build a live watchlist, and save your watchlist into SQLite-backed storage through the FastAPI backend.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {isAuthenticated ? (
                  <p>
                    Signed in as <span className="font-black text-white">{authEmail}</span>
                  </p>
                ) : (
                  <p>Please login or register to save favorites to the database.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {!isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAuthOpen('login')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      <FiLogIn /> Login
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAuthOpen('register')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-3 text-sm font-black text-fuchsia-100 transition hover:bg-fuchsia-300/15"
                    >
                      <FiUserPlus /> Register
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <FiLogOut /> Logout
                  </button>
                )}
              </div>
            </div>
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              recentSearches={recentSearches}
              onRecentSearch={handleSearch}
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
                  src={heroMovie.Poster}
                  alt={heroMovie.Title}
                  className="h-full w-full rounded-[1.45rem] object-cover opacity-80"
                />
                <div className="absolute inset-4 rounded-[1.45rem] bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200">Featured signal</p>
                  <h2 className="mt-2 text-4xl font-black text-white">{heroMovie.Title}</h2>
                  <p className="mt-2 text-slate-300">{heroMovie.Type} • {heroMovie.Year}</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.section>

        <section className="relative">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
                {isDiscoveryMode ? <FiTrendingUp /> : <FiFilm />}
                {isDiscoveryMode ? 'Trending movies' : `Search results for "${searchTerm}"`}
              </div>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
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
                className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-5 text-rose-100 shadow-[0_0_32px_rgba(244,63,94,0.12)] backdrop-blur-xl"
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
            <div className="space-y-14">
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
              {trendingMovies.length === 0 && popularMovies.length === 0 && <NoMoviesFound />}
            </div>
          )}

          {!isLoading && movies.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </section>
      </main>

      <AnimatePresence>
        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            isFavorite={isFavorite(selectedMovie.imdbID)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}
      </AnimatePresence>

      <Favorites
        favorites={favorites}
        onMovieClick={handleMovieClick}
        onFavoriteToggle={handleFavoriteToggle}
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAuthSubmit}
        isLoading={authLoading}
        error={authError}
      />
    </div>
  );
};

const MovieSection = ({ title, eyebrow, movies, onMovieClick, onFavoriteToggle, isFavorite }) => (
  <section>
    <div className="mb-6">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-200">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h3>
    </div>
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
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
  <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 backdrop-blur-xl">
    No movies found.
  </div>
);
