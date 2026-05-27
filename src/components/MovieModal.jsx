import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiHeart, FiStar, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { getMovieDetails } from '../services/api';
import { SkeletonMovieModal } from './SkeletonLoader';

const placeholderImage = 'https://placehold.co/600x900/07111f/67e8f9?text=No+Poster';

export const MovieModal = ({ movie, isOpen, onClose, isFavorite, onFavoriteToggle }) => {
  const [movieDetails, setMovieDetails] = useState(null);

  useEffect(() => {
    if (!isOpen || !movie) return undefined;

    let isCurrent = true;

    getMovieDetails(movie.imdbID).then((result) => {
      if (!isCurrent) return;
      setMovieDetails(result.success ? result.data : movie);
    });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, movie]);

  if (!isOpen) return null;

  const details = movieDetails || movie;
  const isLoading = movieDetails?.imdbID !== movie.imdbID;
  const posterUrl = details.Poster === 'N/A' ? placeholderImage : details.Poster;
  const ratings = Array.isArray(details.Ratings) ? details.Ratings : [];

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-end overflow-y-auto bg-slate-950/72 p-3 backdrop-blur-xl sm:place-items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        initial={{ opacity: 0, y: 50, scale: 0.92, rotateX: -8 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: 40, scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        onClick={(event) => event.stopPropagation()}
        className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950/86 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:grid-cols-[0.82fr_1.18fr]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          aria-label="Close modal"
        >
          <FiX />
        </button>

        <div className="relative min-h-72 overflow-hidden md:min-h-[42rem]">
          <img
            src={posterUrl}
            alt={details.Title}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = placeholderImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent md:bg-gradient-to-r" />
        </div>

        <div className="overflow-y-auto p-6 sm:p-8">
          {isLoading ? (
            <SkeletonMovieModal />
          ) : (
            <div className="space-y-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
                  {details.Type || 'movie'} dossier
                </p>
                <h2 className="mt-3 pr-10 text-3xl font-black leading-tight text-white sm:text-5xl">
                  {details.Title}
                </h2>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-slate-300">
                  {details.Released && details.Released !== 'N/A' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                      <FiCalendar className="text-cyan-200" />
                      {details.Released}
                    </span>
                  )}
                  {details.Runtime && details.Runtime !== 'N/A' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                      <FiClock className="text-fuchsia-200" />
                      {details.Runtime}
                    </span>
                  )}
                  {details.imdbRating && details.imdbRating !== 'N/A' && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/20 px-3 py-1.5 text-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.25)]">
                      <FiStar className="fill-current text-amber-300" />
                      {Number.parseFloat(details.imdbRating).toFixed(1)}/10
                    </span>
                  )}
                </div>
              </div>

              {details.Plot && details.Plot !== 'N/A' && (
                <p className="text-base leading-7 text-slate-300">{details.Plot}</p>
              )}

              <button
                type="button"
                onClick={() => onFavoriteToggle(movie.imdbID)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-black transition ${
                  isFavorite
                    ? 'bg-fuchsia-300 text-slate-950 shadow-[0_0_34px_rgba(217,70,239,0.38)]'
                    : 'bg-cyan-300 text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.34)] hover:bg-cyan-200'
                }`}
              >
                <FiHeart className={isFavorite ? 'fill-current' : ''} />
                {isFavorite ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBlock label="Genre" value={details.Genre} />
                <InfoBlock label="Director" value={details.Director} icon={<FiUser />} />
                <InfoBlock label="Cast" value={details.Actors} icon={<FiUsers />} wide />
              </div>

              {ratings.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
                    Ratings
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {ratings.map((rating) => (
                      <div key={rating.Source} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{rating.Source}</p>
                        <p className="mt-2 text-lg font-black text-white">{rating.Value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
};

const InfoBlock = ({ label, value, icon, wide = false }) => {
  if (!value || value === 'N/A') return null;

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/10 p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
        {icon}
        {label}
      </p>
      <p className="text-sm leading-6 text-white">{value}</p>
    </div>
  );
};
