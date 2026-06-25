/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiFolderPlus, FiHeart, FiStar, FiThumbsUp, FiUser, FiUsers, FiX } from 'react-icons/fi';
import { useToast } from '../context/useToast';
import { getMovieDetails, getMovieReviews, getMyReview, addReview, updateReview, deleteReview, likeReview, unlikeReview } from '../services/api';
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
  onNotificationCreated,
  collections = [],
  onCreateCollection,
  onAddMovieToCollection,
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
  const [myReview, setMyReview] = useState(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');

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

  useEffect(() => {
    if (!isOpen || !movie || !isAuthenticated) {
      setMyReview(null);
      return undefined;
    }

    let isCurrent = true;

    getMyReview(movie.imdbID).then((result) => {
      if (!isCurrent) return;
      if (result.success) {
        setMyReview(result.data);
      } else if (result.error === 'Review not found' || result.error === 'Resource not found') {
        setMyReview(null);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, movie, isAuthenticated]);

  const userReview = myReview || reviews.find((review) => review.user_email === authEmail);

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
    setMyReview(updatedReview);
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
    setReviewRating(4);
    setMyReview(null);
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

  const handleReviewLikeToggle = async (review) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    const result = review.liked_by_me
      ? await unlikeReview(review.id)
      : await likeReview(review.id);

    if (!result.success) {
      addToast(result.error || 'Unable to update review like.', 'error');
      return;
    }

    setReviews((currentReviews) => currentReviews.map((item) => (
      item.id === review.id ? result.data : item
    )));
    addToast(review.liked_by_me ? 'Review like removed.' : 'Review liked.', review.liked_by_me ? 'info' : 'success');
    onNotificationCreated?.();
  };

  const handleAddToCollection = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    let collectionId = selectedCollectionId;
    if (collectionId === 'new') {
      if (!newCollectionName.trim()) {
        addToast('Enter a collection name first.', 'error');
        return;
      }
      const created = await onCreateCollection?.(newCollectionName.trim(), '');
      if (!created) return;
      collectionId = String(created.id);
      setSelectedCollectionId(collectionId);
      setNewCollectionName('');
    }

    if (!collectionId) {
      addToast('Choose a collection first.', 'error');
      return;
    }

    const movieForCollection = {
      ...details,
      imdbID: details.imdbID || movie.imdbID,
      Title: details.Title || movie.Title,
      Year: details.Year || movie.Year,
      Poster: details.Poster || movie.Poster || 'N/A',
      Type: details.Type || movie.Type || 'movie',
    };

    await onAddMovieToCollection?.(Number(collectionId), movieForCollection);
  };

  if (!isOpen) return null;

  const details = movieDetails || movie;
  const isLoading = movieDetails?.imdbID !== movie.imdbID;
  const posterUrl = details.Poster === 'N/A' ? placeholderImage : details.Poster;
  const ratings = Array.isArray(details.Ratings) ? details.Ratings : [];
  const communityRating = details.communityAverageRating ?? details.averageRating;
  const personalRating = userReview?.rating ?? details.userRating ?? null;

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
        className="relative flex min-h-0 w-full max-w-5xl max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-3xl border border-white/15 bg-slate-950/86 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl md:h-[min(92vh,900px)] md:flex-row md:max-h-[calc(100vh-3rem)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          aria-label="Close modal"
        >
          <FiX />
        </button>

        <div className="relative h-72 shrink-0 overflow-hidden md:h-full md:w-[42%]">
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8">
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
                  {communityRating != null && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-300/20 px-3 py-1.5 text-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.25)]">
                      <FiStar className="fill-current text-amber-300" />
                      {Number.parseFloat(communityRating).toFixed(1)}/5
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

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
                  <FiFolderPlus />
                  Add to Collection
                </div>
                {isAuthenticated ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="space-y-3">
                      <select
                        value={selectedCollectionId}
                        onChange={(event) => setSelectedCollectionId(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-300 focus:outline-none"
                      >
                        <option value="">Choose collection</option>
                        {collections.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.name}
                          </option>
                        ))}
                        <option value="new">Create new collection</option>
                      </select>
                      {selectedCollectionId === 'new' && (
                        <input
                          value={newCollectionName}
                          onChange={(event) => setNewCollectionName(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                          placeholder="New collection name"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddToCollection}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                    >
                      <FiFolderPlus />
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequireAuth?.()}
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                  >
                    Login to use collections
                  </button>
                )}
              </div>

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

                {communityRating != null ? (
                  <div className="mb-4 flex flex-wrap items-center gap-3 rounded-3xl border border-amber-300/20 bg-amber-300/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-amber-200">
                      <FiStar className="fill-current text-amber-300" />
                      <span className="text-sm font-black uppercase tracking-[0.2em]">Community Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={communityRating} />
                      <span className="text-sm font-black text-amber-100">
                        {Number.parseFloat(communityRating).toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    No community ratings yet.
                  </div>
                )}

                {isAuthenticated ? (
                  <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
                    <div className="mb-4">
                      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                        Submit Review
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Share your opinion and give this movie your own star rating.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <textarea
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                        rows={4}
                        value={reviewText}
                        onChange={(event) => setReviewText(event.target.value)}
                        placeholder="Write your review here..."
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <label className="block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Your Rating
                          </label>
                          <StarRatingInput rating={reviewRating} onChange={setReviewRating} />
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
                      {personalRating != null && (
                        <div className="mb-4 rounded-3xl border border-cyan-500/25 bg-cyan-200 px-4 py-3 text-cyan-950 shadow-[0_0_18px_rgba(34,211,238,0.12)] dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                            Your Rating
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <StarDisplay rating={personalRating} />
                            <span className="text-sm font-black text-cyan-950 dark:text-cyan-100">
                              {Number.parseFloat(personalRating).toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                      )}
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-300">
                            <span className="font-black text-white">{review.user_email}</span>
                            {review.rating != null ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-200 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-950 shadow-[0_0_18px_rgba(251,191,36,0.14)] dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                                <FiStar className="fill-current text-amber-500 dark:text-amber-300" />
                                {review.rating}/5
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
                                No rating
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-slate-200">{review.review}</p>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {review.likes_count || 0} like{review.likes_count === 1 ? '' : 's'}
                            </span>
                            {review.user_email !== authEmail && (
                              <button
                                type="button"
                                onClick={() => handleReviewLikeToggle(review)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition ${
                                  review.liked_by_me
                                    ? 'border border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100 hover:bg-fuchsia-300/20'
                                    : 'border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
                                }`}
                              >
                                <FiThumbsUp className={review.liked_by_me ? 'fill-current' : ''} />
                                {review.liked_by_me ? 'Liked' : 'Like'}
                              </button>
                            )}
                          </div>
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
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-200 px-3 py-1.5 text-amber-950 shadow-[0_0_22px_rgba(251,191,36,0.18)] dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                        <FiStar className="fill-current text-amber-500 dark:text-amber-300" />
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

const StarRatingInput = ({ rating, onChange }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => {
      const active = value <= rating;
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-950/70 text-lg transition hover:border-amber-300/60 hover:bg-amber-300/10"
          aria-label={`Set rating to ${value} star${value === 1 ? '' : 's'}`}
        >
          <FiStar className={active ? 'fill-current text-amber-300' : 'text-slate-500'} />
        </button>
      );
    })}
  </div>
);

const StarDisplay = ({ rating }) => {
  const normalized = Math.max(0, Math.min(5, Number.parseFloat(rating) || 0));

  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${normalized.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => {
        const active = value <= Math.round(normalized);
        return <FiStar key={value} className={active ? 'fill-current text-amber-300' : 'text-slate-600'} />;
      })}
    </div>
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
