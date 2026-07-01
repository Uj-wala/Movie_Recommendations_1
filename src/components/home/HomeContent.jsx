import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle, FiFilm, FiTrendingUp, FiZap } from 'react-icons/fi';
import heroPoster from '../../assets/hero-poster.svg';
import { AuthModal } from '../AuthModal';
import { CinematicBackground } from '../CinematicBackground';
import { Loader } from '../Loader';
import { MovieCard } from '../MovieCard';
import { MovieModal } from '../MovieModal';
import { Navbar } from '../Navbar';
import { NotificationPanel } from '../NotificationPanel';
import { Pagination } from '../Pagination';
import { SearchBar } from '../SearchBar';
import { CollectionsPage } from '../../pages/CollectionsPage';
import { CompareMoviesPage } from '../../pages/CompareMoviesPage';
import { FavoritesPage } from '../../pages/FavoritesPage';
import { MovieSection, NoMoviesFound } from './MovieSections';

export const HomeContent = ({
  isDark,
  favorites,
  activeView,
  navigate,
  isAuthenticated,
  authEmail,
  handleAuthOpen,
  handleProfileOpen,
  handleLogout,
  unreadNotifications,
  isNotificationPanelOpen,
  handleNotificationsToggle,
  notifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
  collections,
  collectionsLoading,
  handleCreateCollection,
  handleUpdateCollection,
  handleDeleteCollection,
  handleRemoveMovieFromCollection,
  handleFavoriteToggle,
  isFavorite,
  compareMovies,
  handleCompareToggle,
  handleRemoveCompareMovie,
  handleClearCompareMovies,
  isCompareSelected,
  isCompareLimitReached,
  handleMovieClick,
  discoverCollections,
  handleFollowCollection,
  favoritesLoading,
  searchTerm,
  visibleMovies,
  isDiscoveryMode,
  heroMovie,
  heroPosterSrc,
  profile,
  handleSearch,
  isLoading,
  recentSearches,
  searchHistoryPage,
  searchHistoryTotalPages,
  searchHistoryTotal,
  searchHistoryLimit,
  handleSearchHistoryPageChange,
  featuredLoading,
  error,
  showRecommendedSection,
  recommendedLoading,
  recommendedMovies,
  trendingMovies,
  popularMovies,
  telugu2025Movies,
  currentPage,
  totalPages,
  handlePageChange,
  movies,
  selectedMovie,
  isModalOpen,
  handleModalClose,
  refreshRecommendations,
  loadNotifications,
  isAuthModalOpen,
  authMode,
  handleAuthSubmit,
  setAuthMode,
  handlePasswordResetRequest,
  setIsAuthModalOpen,
  setIsNotificationPanelOpen,
  authLoading,
  authError,
  handleAddMovieToCollection,
}) => (
  <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-950'}`}>
    <CinematicBackground />

    <Navbar
      favoriteCount={favorites.length}
      activeView={activeView}
      onHomeClick={() => navigate('/')}
      onWatchlistClick={() => navigate('/watchlist')}
      onFavoritesClick={() => navigate('/favorites')}
      onCollectionsClick={() => navigate('/collections')}
      onCompareClick={() => navigate('/compare')}
      compareCount={compareMovies.length}
      isAuthenticated={isAuthenticated}
      authEmail={authEmail}
      onLoginClick={() => handleAuthOpen('login')}
      onRegisterClick={() => handleAuthOpen('register')}
      onProfileClick={handleProfileOpen}
      onLogoutClick={handleLogout}
      unreadNotifications={unreadNotifications}
      isNotificationsOpen={isNotificationPanelOpen}
      onNotificationsClick={handleNotificationsToggle}
    />

    <NotificationPanel
      isOpen={isNotificationPanelOpen}
      notifications={notifications}
      unreadCount={unreadNotifications}
      onClose={() => setIsNotificationPanelOpen(false)}
      onMarkRead={handleMarkNotificationRead}
      onMarkAllRead={handleMarkAllNotificationsRead}
    />

    {activeView === 'collections' ? (
      <CollectionsPage
        collections={collections}
        isLoading={collectionsLoading}
        onBack={() => navigate('/')}
        onCreateCollection={handleCreateCollection}
        onUpdateCollection={handleUpdateCollection}
        onDeleteCollection={handleDeleteCollection}
        onRemoveMovie={handleRemoveMovieFromCollection}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={isFavorite}
        onCompareToggle={handleCompareToggle}
        isCompareSelected={isCompareSelected}
        isCompareLimitReached={isCompareLimitReached}
        onMovieClick={handleMovieClick}
        discoverCollections={discoverCollections}
        onFollowCollection={handleFollowCollection}
      />
    ) : activeView === 'favorites' || activeView === 'watchlist' ? (
      <FavoritesPage
        favorites={favorites}
        onBack={() => navigate('/')}
        onMovieClick={handleMovieClick}
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={isFavorite}
        onCompareToggle={handleCompareToggle}
        isCompareSelected={isCompareSelected}
        isCompareLimitReached={isCompareLimitReached}
        isLoading={favoritesLoading}
        collectionLabel={activeView === 'favorites' ? 'Favorites' : 'Watchlist'}
      />
    ) : activeView === 'compare' ? (
      <CompareMoviesPage
        movies={compareMovies}
        onBack={() => navigate('/')}
        onRemove={handleRemoveCompareMovie}
        onClear={handleClearCompareMovies}
        onMovieClick={handleMovieClick}
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Signed in as <span className="font-black text-theme-strong">{authEmail}</span>
                  </p>
                  {profile?.is_admin && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-900 shadow-none transition hover:bg-amber-200 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/20"
                    >
                      Admin Dashboard
                    </button>
                  )}
                </div>
              ) : (
                <p>Watchlist items save locally. Login or register to save them with the backend API.</p>
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
                  src={heroPosterSrc || heroPoster}
                  alt={heroMovie.Title}
                  className="h-full w-full rounded-[1.45rem] object-cover object-center"
                />
                <div className="absolute inset-4 rounded-[1.45rem] bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/15" />
                <div className="absolute bottom-10 left-10 right-10">
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#67e8f9] drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">Featured signal</p>
                  <h2 className="mt-2 text-4xl font-black text-[#f8fafc] drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)]">{heroMovie.Title}</h2>
                  <p className="mt-2 text-[#e2e8f0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">{heroMovie.Type} / {heroMovie.Year}</p>
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
                    onCompareToggle={handleCompareToggle}
                    isCompareSelected={isCompareSelected(movie.imdbID)}
                    isCompareDisabled={isCompareLimitReached}
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
                        Sign in to load personalized recommendations based on your watchlist, search history, and recently viewed movies.
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
                            onCompareToggle={handleCompareToggle}
                            isCompareSelected={isCompareSelected(movie.imdbID)}
                            isCompareDisabled={isCompareLimitReached}
                            compact
                            recommended
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : isAuthenticated ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-theme-muted backdrop-blur-xl">
                      Start searching and adding movies to your watchlist to get personalized recommendations.
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
                  onCompareToggle={handleCompareToggle}
                  isCompareSelected={isCompareSelected}
                  isCompareLimitReached={isCompareLimitReached}
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
                  onCompareToggle={handleCompareToggle}
                  isCompareSelected={isCompareSelected}
                  isCompareLimitReached={isCompareLimitReached}
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
                  onCompareToggle={handleCompareToggle}
                  isCompareSelected={isCompareSelected}
                  isCompareLimitReached={isCompareLimitReached}
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
          onNotificationCreated={loadNotifications}
          collections={collections}
          onCreateCollection={handleCreateCollection}
          onAddMovieToCollection={handleAddMovieToCollection}
        />
      )}
    </AnimatePresence>

    <AuthModal
      isOpen={isAuthModalOpen}
      mode={authMode}
      onClose={() => setIsAuthModalOpen(false)}
      onSubmit={handleAuthSubmit}
      onModeChange={setAuthMode}
      onRequestPasswordReset={handlePasswordResetRequest}
      isLoading={authLoading}
      error={authError}
    />
  </div>
);
