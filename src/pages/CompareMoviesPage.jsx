import { motion } from 'framer-motion';
import { FiArrowLeft, FiColumns, FiTrash2, FiX, FiAward, FiTrendingUp } from 'react-icons/fi';
import { EmptyState } from '../components/EmptyState';

const placeholderImage = 'https://placehold.co/600x900/07111f/67e8f9?text=No+Poster';

const getPoster = (movie) => (movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : placeholderImage);

const comparisonRows = [
  ['Year', (movie) => movie.Year || 'N/A'],
  ['Type', (movie) => movie.Type || 'movie'],
  ['IMDb Rating', (movie) => movie.imdbRating || 'N/A'],
  ['Community Rating', (movie) => movie.averageRating ?? movie.communityAverageRating ?? 'N/A'],
  ['Runtime', (movie) => movie.Runtime || 'N/A'],
  ['Genre', (movie) => movie.Genre || 'N/A'],
  ['Director', (movie) => movie.Director || 'N/A'],
  ['Cast', (movie) => movie.Actors || 'N/A'],
  ['Plot', (movie) => movie.Plot || 'N/A'],
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const staggered = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

/**
 * Calculate a comparison score for a movie based on its ratings and metadata
 * @param {Object} movie - The movie object
 * @returns {number} - A score from 0-100
 */
const calculateMovieScore = (movie) => {
  let score = 0;
  let factors = 0;

  // IMDb Rating (0-40 points)
  if (movie.imdbRating && movie.imdbRating !== 'N/A') {
    const rating = parseFloat(movie.imdbRating);
    if (!isNaN(rating)) {
      score += (rating / 10) * 40;
      factors += 1;
    }
  }

  // Community Rating (0-30 points)
  const communityRating = movie.averageRating ?? movie.communityAverageRating;
  if (communityRating && communityRating !== 'N/A') {
    const rating = parseFloat(communityRating);
    if (!isNaN(rating)) {
      score += (rating / 10) * 30;
      factors += 1;
    }
  }

  // Recency bonus (0-20 points) - newer movies get slight bonus
  if (movie.Year && movie.Year !== 'N/A') {
    const year = parseInt(movie.Year);
    if (!isNaN(year)) {
      const currentYear = new Date().getFullYear();
      const yearDiff = Math.max(0, currentYear - year);
      const recencyBonus = Math.max(0, 20 - (yearDiff * 1));
      score += Math.min(recencyBonus, 20);
      factors += 1;
    }
  }

  // Runtime factor (0-10 points) - movies with proper runtime are better rated
  if (movie.Runtime && movie.Runtime !== 'N/A' && !movie.Runtime.includes('N/A')) {
    score += 10;
    factors += 1;
  }

  return factors > 0 ? Math.round(score / factors) : 0;
};

/**
 * Get comparison message based on movie scores
 * @param {Object} movie1 - First movie
 * @param {Object} movie2 - Second movie
 * @returns {Object} - { message, winner, isDraw }
 */
const getComparisonMessage = (movie1, movie2) => {
  const score1 = calculateMovieScore(movie1);
  const score2 = calculateMovieScore(movie2);
  const diff = Math.abs(score1 - score2);

  if (diff < 5) {
    return {
      message: "It's a tie! Both movies are equally excellent. Your choice depends on personal preference!",
      winner: null,
      isDraw: true,
      score1,
      score2,
    };
  }

  const winner = score1 > score2 ? movie1 : movie2;
  const winnerIdx = score1 > score2 ? 0 : 1;
  const loser = score1 > score2 ? movie2 : movie1;
  const winnerScore = Math.max(score1, score2);
  const loserScore = Math.min(score1, score2);

  if (diff >= 20) {
    return {
      message: `${winner.Title} clearly edges out ${loser.Title} with a significantly higher score!`,
      winner,
      winnerIdx,
      isDraw: false,
      score1,
      score2,
    };
  }

  return {
    message: `${winner.Title} slightly edges out ${loser.Title} in overall quality!`,
    winner,
    winnerIdx,
    isDraw: false,
    score1,
    score2,
  };
};

const ComparisonSummary = ({ movies }) => {
  if (movies.length < 2) return null;

  const comparison = getComparisonMessage(movies[0], movies[1]);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`relative mb-8 overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6 ${
      comparison.isDraw
        ? 'border-slate-200 bg-white dark:border-amber-300/25 dark:bg-amber-300/10'
        : 'border-slate-200 bg-white dark:border-emerald-300/25 dark:bg-emerald-300/10'
    }`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
        animate={{ x: ['-45%', '45%', '-45%'] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-300/10"
        animate={{ scale: [1, 1.16, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {comparison.isDraw ? (
            <FiTrendingUp className="h-6 w-6 text-slate-500 dark:text-amber-200" />
          ) : (
            <FiAward className="h-6 w-6 text-emerald-600 dark:text-emerald-200" />
          )}
          <p className={`font-black text-sm uppercase tracking-[0.16em] ${
            comparison.isDraw ? 'text-slate-600 dark:text-amber-100' : 'text-emerald-700 dark:text-emerald-100'
          }`}>
            Comparison Result
          </p>
        </div>

        <p className={`text-lg font-bold ${
          comparison.isDraw ? 'text-slate-900 dark:text-amber-50' : 'text-slate-900 dark:text-emerald-50'
        }`}>
          {comparison.message}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <motion.div
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{movies[0].Title}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-cyan-200">{comparison.score1}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overall Score</p>
          </motion.div>
          <motion.div
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{movies[1].Title}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-cyan-200">{comparison.score2}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overall Score</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const CompareMoviesPage = ({
  movies = [],
  onBack,
  onRemove,
  onClear,
  onMovieClick,
}) => (
  <motion.main
    className="relative isolate mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8"
    initial="hidden"
    animate="show"
    variants={staggered}
  >
    <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-slate-950" />
    <motion.div
      aria-hidden="true"
      className="fixed left-[-8rem] top-20 -z-10 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-500/10"
      animate={{ x: [0, 42, 0], y: [0, 28, 0], scale: [1, 1.12, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      aria-hidden="true"
      className="fixed bottom-10 right-[-7rem] -z-10 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl dark:bg-indigo-500/10"
      animate={{ x: [0, -36, 0], y: [0, -24, 0], opacity: [0.45, 0.75, 0.45] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
    {/* Header Section */}
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
    >
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500 dark:text-cyan-200">
          Side-by-side decision board
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl md:text-5xl dark:text-white">Compare Movies</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
          Select up to 2 movies from any movie card, then compare their ratings, cast, story, and release details here.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {movies.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm transition hover:border-rose-300 hover:text-rose-700 sm:px-5 sm:py-3 sm:text-sm dark:border-rose-300/30 dark:bg-rose-300/10 dark:text-rose-100 dark:hover:bg-rose-300/20"
          >
            <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 sm:px-5 sm:py-3 sm:text-sm dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-100 dark:hover:bg-cyan-300/20"
        >
          <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          Back
        </button>
      </div>
    </motion.div>

    {/* Empty State */}
    {movies.length === 0 ? (
      <EmptyState
        icon={<FiColumns className="h-7 w-7" />}
        title="No movies selected for comparison."
        description="Use the Compare button on a movie card to add your first movie."
        actionLabel="Back to movies"
        actionIcon={<FiArrowLeft />}
        onAction={onBack}
      />
    ) : (
      <div className="space-y-6 sm:space-y-8">
        {/* Incomplete Comparison Message */}
        {movies.length === 1 && (
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm sm:p-5 dark:border-indigo-300/25 dark:bg-indigo-300/10 dark:text-indigo-100"
          >
            Select one more movie to complete the comparison.
          </motion.div>
        )}

        {/* Comparison Summary */}
        {movies.length === 2 && <ComparisonSummary movies={movies} />}

        {/* Movie Cards - Responsive Grid */}
        <motion.section
          className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2"
          variants={staggered}
          initial="hidden"
          animate="show"
        >
          {movies.map((movie, idx) => (
            <motion.article
              key={movie.imdbID}
              variants={fadeUp}
              transition={{ duration: 0.48, ease: 'easeOut' }}
              whileHover={{ y: -8, scale: 1.012 }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:hover:border-white/20 dark:hover:bg-white/10"
            >
              {/* Movie Header */}
              <button
                type="button"
                onClick={() => onMovieClick(movie)}
                className="block w-full text-left"
              >
                <div className="flex flex-col gap-4 p-4 sm:p-5 md:p-6">
                  {/* Poster and Info */}
                  <div className="flex gap-4">
                    <img
                      src={getPoster(movie)}
                      alt={movie.Title}
                      className="h-40 w-28 flex-shrink-0 rounded-xl object-cover object-top transition duration-500 group-hover:scale-[1.035] sm:h-48 sm:w-32"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-cyan-200">
                        {movie.Type || 'Movie'} / {movie.Year || 'N/A'}
                      </p>
                      <h2 className="mt-2 text-lg font-black text-slate-950 sm:text-xl md:text-2xl dark:text-white">
                        {movie.Title}
                      </h2>
                      {movie.Plot && movie.Plot !== 'N/A' && (
                        <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600 sm:line-clamp-4 sm:text-sm dark:text-slate-300">
                          {movie.Plot}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Remove Button */}
              <div className="border-t border-slate-200 p-4 sm:p-5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => onRemove(movie.imdbID)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-300/30 dark:bg-rose-300/10 dark:text-rose-100 dark:hover:bg-rose-300/20"
                >
                  <FiTrash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Remove
                </button>
              </div>
            </motion.article>
          ))}
        </motion.section>

        {/* Comparison Table - Responsive */}
        {movies.length > 0 && (
          <motion.section
            variants={fadeUp}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl"
          >
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-white/10">
                <thead className="bg-slate-100 text-slate-600 dark:bg-slate-950/75 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-[0.16em] sm:px-5 sm:py-4">Detail</th>
                    {movies.map((movie) => (
                      <th
                        key={movie.imdbID}
                        className="px-4 py-3 font-black uppercase tracking-[0.16em] sm:px-5 sm:py-4"
                      >
                        {movie.Title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-950/35">
                  {comparisonRows.map(([label, getValue]) => (
                    <motion.tr
                      key={label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * comparisonRows.findIndex(([rowLabel]) => rowLabel === label), duration: 0.32 }}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-950/50"
                    >
                      <td className="px-4 py-3 font-black text-slate-700 sm:px-5 sm:py-4 w-36 dark:text-cyan-100">
                        {label}
                      </td>
                      {movies.map((movie) => (
                        <td
                          key={`${movie.imdbID}-${label}`}
                          className="px-4 py-3 leading-6 text-slate-600 sm:px-5 sm:py-4 dark:text-slate-200"
                        >
                          {getValue(movie)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked View */}
            <div className="block sm:hidden">
              <div className="space-y-6 p-4">
                {comparisonRows.map(([label, getValue]) => (
                  <div key={label} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0 dark:border-white/10">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700 mb-3 dark:text-cyan-100">
                      {label}
                    </p>
                    <div className="space-y-2">
                      {movies.map((movie) => (
                        <div key={`${movie.imdbID}-${label}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/50">
                          <p className="text-xs text-slate-500 mb-1 dark:text-slate-400">{movie.Title}</p>
                          <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{getValue(movie)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </div>
    )}
  </motion.main>
);
