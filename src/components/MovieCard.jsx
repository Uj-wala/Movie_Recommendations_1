import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiHeart, FiPlayCircle, FiStar } from 'react-icons/fi';

const placeholderImage = 'https://placehold.co/600x900/07111f/67e8f9?text=No+Poster';

export const MovieCard = ({
  movie,
  onClick,
  onFavoriteToggle,
  isFavorite = false,
}) => {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const posterUrl = !movie.Poster || movie.Poster === 'N/A' ? placeholderImage : movie.Poster;
  // Prefer averageRating (1-5) from backend; otherwise convert imdbRating (1-10) to 1-5 scale
  const rating = (movie.averageRating != null)
    ? String(movie.averageRating)
    : movie.imdbRating && movie.imdbRating !== 'N/A'
      ? String(Number.parseFloat(movie.imdbRating) / 2)
      : null;

  const handleMouseMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    setTilt({
      rotateX: ((y / bounds.height) - 0.5) * -12,
      rotateY: ((x / bounds.width) - 0.5) * 12,
    });
  };

  return (
    <motion.article
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0 })}
      animate={tilt}
      whileHover={{ y: -10, scale: 1.025 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/90 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.65)] backdrop-blur-xl [transform-style:preserve-3d] min-h-[580px] sm:min-w-[250px]"
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-300/0 via-fuchsia-400/0 to-indigo-400/0 opacity-0 blur transition duration-300 group-hover:from-cyan-300/45 group-hover:via-fuchsia-400/20 group-hover:to-indigo-400/45 group-hover:opacity-100" />
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[0.9rem] border border-white/10 bg-slate-950">
        <div
          className="relative h-[280px] shrink-0 overflow-hidden bg-slate-900 sm:h-[300px] lg:h-[320px]"
          style={{ lineHeight: 0 }}
        >
          <img
            src={posterUrl}
            alt={movie.Title}
            className="absolute inset-0 block h-full w-full object-cover object-top transition duration-700 group-hover:scale-110"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
            onError={(event) => {
              event.currentTarget.src = placeholderImage;
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/85 to-transparent" />
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFavoriteToggle(movie.imdbID);
            }}
            whileTap={{ scale: 0.82 }}
            animate={isFavorite ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border text-sm backdrop-blur-xl transition ${
              isFavorite
                ? 'border-fuchsia-300/50 bg-fuchsia-400/30 text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.38)]'
                : 'border-white/15 bg-slate-950/55 text-white hover:border-cyan-300/50 hover:text-cyan-100'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <FiHeart className={isFavorite ? 'fill-current' : ''} />
          </motion.button>
        </div>

        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black leading-tight text-white">
            {movie.Title}
          </h3>

          {movie.Plot && movie.Plot !== 'N/A' && (
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">
              {movie.Plot}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-cyan-100">
              <FiPlayCircle />
              {movie.Type}
            </span>
            {rating && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-300/20 px-2 py-0.5 text-[0.68rem] font-black text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.25)]">
                <FiStar className="fill-current text-amber-300" />
                {Number.parseFloat(rating).toFixed(1)}/5
              </span>
            )}
          </div>

          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FiCalendar className="text-cyan-200" />
            {movie.Year}
          </p>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onFavoriteToggle(movie.imdbID);
            }}
            className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${
              isFavorite
                ? 'border-fuchsia-300/40 bg-fuchsia-300/15 text-fuchsia-100 hover:bg-fuchsia-300/25'
                : 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
            }`}
          >
            <FiHeart className={isFavorite ? 'fill-current' : ''} />
            {isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </motion.article>
  );
};
