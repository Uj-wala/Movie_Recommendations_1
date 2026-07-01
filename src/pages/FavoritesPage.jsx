import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart } from 'react-icons/fi';
import { EmptyState } from '../components/EmptyState';
import { MovieCard } from '../components/MovieCard';
import { Loader } from '../components/Loader';

export const FavoritesPage = ({
  favorites,
  onBack,
  onMovieClick,
  onFavoriteToggle,
  isFavorite,
  isLoading = false,
  collectionLabel = 'Watchlist',
  onCompareToggle,
  isCompareSelected = () => false,
  isCompareLimitReached = false,
}) => {
  const isFavorites = collectionLabel === 'Favorites';
  const heading = isFavorites ? 'Favorites' : 'Watchlist';
  const emptyTitle = isFavorites ? 'No favorite movies added yet.' : 'No watchlist movies added yet.';
  const emptyDescription = isFavorites
    ? 'Add movies using the heart button or the Add to Favorites button. Your saved list will show up here.'
    : 'Add movies using the heart button or the Add to Watchlist button. Your saved list will show up here.';

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-200">
            Saved movie queue
          </p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Movies you add from search, trending, popular, and local API collections appear here.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
        >
          <FiArrowLeft />
          Back to movies
        </button>
      </div>

      {isLoading ? (
        <Loader count={6} />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={<FiHeart className="h-7 w-7" />}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel="Back to movies"
          actionIcon={<FiArrowLeft />}
          onAction={onBack}
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {favorites.map((movie) => (
            <motion.div
              key={movie.imdbID}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
            >
              <MovieCard
                movie={movie}
                onClick={() => onMovieClick(movie)}
                onFavoriteToggle={onFavoriteToggle}
                isFavorite={isFavorite(movie.imdbID)}
                onCompareToggle={onCompareToggle}
                isCompareSelected={isCompareSelected(movie.imdbID)}
                isCompareDisabled={isCompareLimitReached}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
};
