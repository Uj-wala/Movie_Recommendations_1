import { motion } from 'framer-motion';
import { MovieCard } from '../MovieCard';

export const MovieSection = ({
  title,
  eyebrow,
  movies,
  onMovieClick,
  onFavoriteToggle,
  isFavorite,
  onCompareToggle,
  isCompareSelected,
  isCompareLimitReached,
}) => (
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
            onCompareToggle={onCompareToggle}
            isCompareSelected={isCompareSelected(movie.imdbID)}
            isCompareDisabled={isCompareLimitReached}
          />
        </motion.div>
      ))}
    </motion.div>
  </section>
);

export const NoMoviesFound = () => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-theme-muted backdrop-blur-xl">
    No movies found.
  </div>
);
