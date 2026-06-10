/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiHeart, FiStar, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { useToast } from '../context/useToast';
import { getMovieDetails, getMovieReviews, addReview, updateReview, deleteReview } from '../services/api';
import { SkeletonMovieModal } from './SkeletonLoader';

const placeholderImage = 'https://placehold.co/600x900/07111f/67e8f9?text=No+Poster';

export const MovieModal = ({
  movie,
  isOpen,
  onClose,
  isFavorite,
  onFavoriteToggle,
  isAuthenticated,
  authEmail,
  onRequireAuth,
  onMovieViewed,
}) => {
  const { addToast } = useToast();
  const [movieDetails, setMovieDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPageSize] = useState(5);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(4);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (!isOpen || !movie) return undefined;

    let isCurrent = true;

    getMovieDetails(movie.imdbID).then((result) => {
      if (!isCurrent) return;
      setMovieDetails(result.success ? result.data : movie);
      if (result.success) {
        onMovieViewed?.(result.data);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, movie, onMovieViewed]);

  useEffect(() => {
    if (!isOpen || !movie) return undefined;

    let isCurrent = true;
    const loadReviews = async (page = reviewsPage) => {
      setIsLoadingReviews(true);
      setReviewsError('');
      const result = await getMovieReviews(movie.imdbID, page, reviewsPageSize);
      if (!isCurrent) return;
      if (!result.success) {
        setReviewsError(result.error || 'Unable to load reviews');
        setReviews([]);
        setReviewsTotal(0);
      } else {
        setReviews(result.data.items || []);
        setReviewsTotal(result.data.total || 0);
        setReviewsPage(result.data.page || page);
      }
      setIsLoadingReviews(false);
    };

    loadReviews(reviewsPage);

    return () => {
      isCurrent = false;
    };
  }, [isOpen, movie, reviewsPage, reviewsPageSize]);

  const userReview = reviews.find((review) => review.user_email === authEmail);

  useEffect(() => {
    if (userReview) {
      setReviewText(userReview.review);
      setReviewRating(userReview.rating ?? 4);
    } else {
      setReviewText('');
      setReviewRating(4);
    }
  }, [userReview]);

  const handleSaveReview = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    if (!reviewText.trim()) {
      addToast('Please enter your review text.', 'error');
      return;
    }

    setIsSavingReview(true);
    const payload = { review: reviewText.trim(), rating: reviewRating || null };

    const result = userReview
      ? await updateReview(movie.imdbID, payload.review, payload.rating)
      : await addReview(movie.imdbID, payload.review, payload.rating);

    if (!result.success) {
      addToast(result.error || 'Unable to save review.', 'error');
      setIsSavingReview(false);
      return;
    }

    const updatedReview = result.data;
    setReviews((currentReviews) => {
      const existingIndex = currentReviews.findIndex((item) => item.id === updatedReview.id);
      if (existingIndex !== -1) {
        const nextReviews = [...currentReviews];
        nextReviews[existingIndex] = updatedReview;
        return nextReviews;
      }
      return [updatedReview, ...currentReviews];
    });
    addToast(userReview ? 'Review updated successfully.' : 'Review added successfully.', 'success');
    setIsSavingReview(false);
    // reload first page of reviews
    setReviewsPage(1);
    const reload = await getMovieReviews(movie.imdbID, 1, reviewsPageSize);
    if (reload.success) {
      setReviews(reload.data.items || []);
      setReviewsTotal(reload.data.total || 0);
    }
    // refresh movie details to pick up new average rating
    const md = await getMovieDetails(movie.imdbID);
    if (md.success) setMovieDetails(md.data);
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    setIsDeletingReview(true);
    const result = await deleteReview(movie.imdbID);

    if (!result.success) {
      addToast(result.error || 'Unable to delete review.', 'error');
      setIsDeletingReview(false);
      return;
    }

    setReviews((currentReviews) => currentReviews.filter((item) => item.id !== userReview.id));
    setReviewText('');
    setReviewRating(8);
    addToast('Review deleted successfully.', 'info');
    setIsDeletingReview(false);
    // reload current page
    const reload = await getMovieReviews(movie.imdbID, reviewsPage, reviewsPageSize);
    if (reload.success) {
      setReviews(reload.data.items || []);
      setReviewsTotal(reload.data.total || 0);
    }
    // refresh movie details to pick up new average rating
    const md = await getMovieDetails(movie.imdbID);
    if (md.success) setMovieDetails(md.data);
  };

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
                  {(details.averageRating != null || (details.imdbRating && details.imdbRating !== 'N/A')) && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/20 px-3 py-1.5 text-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.25)]">
                      <FiStar className="fill-current text-amber-300" />
                      {details.averageRating != null
                        ? Number.parseFloat(details.averageRating).toFixed(1)
                        : Number.parseFloat(details.imdbRating) / 2
                      }/5
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
                    {ratings.map((rating) => {
                      let displayValue = rating.Value;
                      try {
                        const v = String(rating.Value).trim();
                        // Convert any "/10" values to "/5" by halving the numeric part
                        if (v.endsWith('/10')) {
                          const num = parseFloat(v.split('/')[0]);
                          if (!Number.isNaN(num)) displayValue = `${(num / 2).toFixed(1)}/5`;
                        }
                      } catch {
                        // fallback: leave original value
                      }

                      return (
                        <div key={rating.Source} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{rating.Source}</p>
                          <p className="mt-2 text-lg font-black text-white">{displayValue}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                      Community Reviews
                    </p>
                    <p className="text-xs text-slate-400">Share your review and rating for this movie.</p>
                  </div>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                    {reviews.length} review{reviews.length === 1 ? '' : 's'}
                  </span>
                </div>

                {isAuthenticated ? (
                  <div className="space-y-4">
                    <textarea
                      className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                      rows={4}
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      placeholder="Write your review here..."
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <label htmlFor="review-rating" className="font-black uppercase tracking-[0.18em] text-slate-400">
                          Rating
                        </label>
                        <select
                          id="review-rating"
                          className="rounded-3xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white focus:outline-none"
                          value={reviewRating}
                          onChange={(event) => setReviewRating(Number(event.target.value))}
                        >
                          {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSaveReview}
                          disabled={isSavingReview}
                          className="inline-flex items-center justify-center rounded-3xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {userReview ? 'Update Review' : 'Submit Review'}
                        </button>
                        {userReview && (
                          <button
                            type="button"
                            onClick={handleDeleteReview}
                            disabled={isDeletingReview}
                            className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-3 text-sm font-black text-white transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-300">
                    <p className="mb-4 text-sm">Login to add a review and rating for this movie.</p>
                    <button
                      type="button"
                      onClick={() => onRequireAuth?.()}
                      className="inline-flex items-center justify-center rounded-3xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                    >
                      Login to leave review
                    </button>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  {isLoadingReviews ? (
                    <p className="text-sm text-slate-400">Loading reviews...</p>
                  ) : reviewsError ? (
                    <p className="text-sm text-rose-400">{reviewsError}</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-slate-400">No reviews yet. Be the first to add one.</p>
                  ) : (
                    <>
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                            <span className="font-black text-white">{review.user_email}</span>
                            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                              {review.rating ?? 'No rating'}
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-slate-200">{review.review}</p>
                        </div>
                      ))}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          Showing page {reviewsPage} — {reviewsTotal} review{reviewsTotal === 1 ? '' : 's'} total
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const prev = Math.max(1, reviewsPage - 1);
                              setReviewsPage(prev);
                              const r = await getMovieReviews(movie.imdbID, prev, reviewsPageSize);
                              if (r.success) {
                                setReviews(r.data.items || []);
                                setReviewsTotal(r.data.total || 0);
                              } else {
                                setReviewsError(r.error || 'Unable to load reviews');
                              }
                            }}
                            disabled={reviewsPage === 1}
                            className="rounded-2xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const maxPage = Math.max(1, Math.ceil(reviewsTotal / reviewsPageSize));
                              const next = Math.min(maxPage, reviewsPage + 1);
                              setReviewsPage(next);
                              const r = await getMovieReviews(movie.imdbID, next, reviewsPageSize);
                              if (r.success) {
                                setReviews(r.data.items || []);
                                setReviewsTotal(r.data.total || 0);
                              } else {
                                setReviewsError(r.error || 'Unable to load reviews');
                              }
                            }}
                            disabled={reviewsPage >= Math.ceil(reviewsTotal / reviewsPageSize)}
                            className="rounded-2xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {details.averageRating != null && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/20 px-3 py-1.5 text-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.25)]">
                        <FiStar className="fill-current text-amber-300" />
                        {Number.parseFloat(details.averageRating).toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
