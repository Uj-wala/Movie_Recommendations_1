import { AnimatePresence, motion } from 'framer-motion';
import { FiHeart, FiTrash2, FiX } from 'react-icons/fi';

const placeholderImage = 'https://placehold.co/120x180/07111f/67e8f9?text=N/A';

export const Favorites = ({
  favorites,
  onMovieClick,
  onFavoriteToggle,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed bottom-0 right-0 top-16 z-40 w-full overflow-y-auto border-l border-white/10 bg-slate-950/88 p-6 shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:w-[27rem]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 190, damping: 24 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">Live watchlist</p>
                <h2 className="mt-1 text-2xl font-black text-white">Watchlist</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close watchlist"
              >
                <FiX />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-3"
                  >
                    <div className="flex gap-3">
                      <div className="h-20 w-14 animate-shimmer rounded-lg bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 animate-shimmer rounded-full bg-white/10" />
                        <div className="h-3 w-1/2 animate-shimmer rounded-full bg-white/10" />
                      </div>
                      <div className="h-10 w-10 animate-shimmer shrink-0 rounded-full bg-white/10" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
                <FiHeart className="mx-auto mb-4 h-10 w-10 text-fuchsia-200" />
                <p>Your saved movie queue is empty.</p>
              </div>
            ) : (
              <div className="space-y-4\">
                {favorites.map((movie) => (
                  <motion.article
                    key={movie.imdbID}
                    layout
                    whileHover={{ x: -4 }}
                    className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.07] p-3 transition hover:bg-white/[0.11]"
                    onClick={() => onMovieClick(movie)}
                  >
                    <div className="flex gap-3">
                      <img
                        src={movie.Poster === 'N/A' ? placeholderImage : movie.Poster}
                        alt={movie.Title}
                        className="h-20 w-14 rounded-lg object-cover"
                        onError={(event) => {
                          event.currentTarget.src = placeholderImage;
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-black text-white">{movie.Title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{movie.Year} • {movie.Type}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onFavoriteToggle(movie.imdbID);
                        }}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-300/20 bg-rose-300/10 text-rose-100 transition hover:bg-rose-300/20"
                        aria-label={`Remove ${movie.Title} from watchlist`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
