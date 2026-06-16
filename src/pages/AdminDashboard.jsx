import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiEdit3,
  FiFilm,
  FiHeart,
  FiHome,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiStar,
  FiTrash2,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useToast } from '../context/useToast';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../context/useTheme';
import {
  clearAuth,
  createAdminReview,
  deleteAdminReview,
  getAdminReviews,
  getAdminStats,
  getAdminUsers,
  getProfile,
  setAuthorizationHeader,
  updateAdminReview,
} from '../services/api';

const emptyForm = {
  imdb_id: '',
  review: '',
  rating: 5,
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDark } = useTheme();
  const [authToken, setAuthToken] = useLocalStorage('authToken', '');
  const [authEmail, setAuthEmail] = useLocalStorage('authEmail', '');
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLimit] = useState(15);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [savingReview, setSavingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const isAuthenticated = Boolean(authToken);
  const isAdmin = Boolean(profile?.is_admin);

  useEffect(() => {
    setAuthorizationHeader(authToken || null);
  }, [authToken]);

  const loadDashboard = async () => {
    if (!authToken) {
      setProfile(null);
      setStats(null);
      setUsers([]);
      setReviews([]);
      setUsersLoading(false);
      setReviewsLoading(false);
      setStatsLoading(false);
      return;
    }

    setError('');
    const profileResult = await getProfile();
    if (!profileResult.success) {
      setError(profileResult.error || 'Unable to load profile.');
      setUsersLoading(false);
      setReviewsLoading(false);
      setStatsLoading(false);
      return;
    }

    setProfile(profileResult.data);
    if (!profileResult.data.is_admin) {
      setUsersLoading(false);
      setReviewsLoading(false);
      setStatsLoading(false);
      return;
    }

    setUsersLoading(true);
    setReviewsLoading(true);
    setStatsLoading(true);

    const [statsResult, usersResult, reviewsResult] = await Promise.all([
      getAdminStats(),
      getAdminUsers(),
      getAdminReviews(reviewsPage, reviewsLimit),
    ]);

    if (statsResult.success) {
      setStats(statsResult.data);
    } else {
      setError(statsResult.error || 'Unable to load dashboard statistics.');
    }

    if (usersResult.success) {
      setUsers(usersResult.data);
    } else {
      setError(usersResult.error || 'Unable to load user list.');
    }

    if (reviewsResult.success) {
      setReviews(reviewsResult.data.items || []);
      setReviewsTotal(reviewsResult.data.total || 0);
    } else {
      setError(reviewsResult.error || 'Unable to load reviews.');
    }

    setUsersLoading(false);
    setReviewsLoading(false);
    setStatsLoading(false);
  };

  useEffect(() => {
    let isCurrent = true;

    (async () => {
      if (!isCurrent) return;
      await loadDashboard();
    })();

    return () => {
      isCurrent = false;
    };
  }, [authToken, reviewsPage]);

  const refreshDashboard = async () => {
    await loadDashboard();
  };

  const handleLogout = () => {
    clearAuth();
    setAuthToken('');
    setAuthEmail('');
    setProfile(null);
    setStats(null);
    setUsers([]);
    setReviews([]);
    setReviewsTotal(0);
    navigate('/');
  };

  const handleFormChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startCreate = () => {
    setEditingReviewId(null);
    setForm(emptyForm);
    setFormError('');
  };

  const startEdit = (review) => {
    setEditingReviewId(review.id);
    setForm({
      imdb_id: review.imdb_id,
      review: review.review,
      rating: review.rating ?? 5,
    });
    setFormError('');
  };

  const submitReview = async () => {
    if (!form.imdb_id.trim()) {
      setFormError('IMDb ID is required.');
      return;
    }
    if (!form.review.trim()) {
      setFormError('Review text is required.');
      return;
    }

    setSavingReview(true);
    setFormError('');

    const payload = {
      imdb_id: form.imdb_id.trim(),
      review: form.review.trim(),
      rating:
        form.rating === '' || form.rating == null
          ? null
          : Math.min(5, Math.max(1, Number(form.rating))),
    };

    const result = editingReviewId
      ? await updateAdminReview(editingReviewId, { review: payload.review, rating: payload.rating })
      : await createAdminReview(payload);

    if (!result.success) {
      setFormError(result.error || 'Unable to save review.');
      setSavingReview(false);
      return;
    }

    addToast(editingReviewId ? 'Review updated successfully.' : 'Review created successfully.', 'success');
    setForm(emptyForm);
    setEditingReviewId(null);
    await loadDashboard();
    setSavingReview(false);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;

    setDeletingReviewId(reviewId);
    const result = await deleteAdminReview(reviewId);
    if (!result.success) {
      addToast(result.error || 'Unable to delete review.', 'error');
      setDeletingReviewId(null);
      return;
    }

    addToast('Review deleted successfully.', 'success');
    if (editingReviewId === reviewId) {
      startCreate();
    }
    await loadDashboard();
    setDeletingReviewId(null);
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.email} ${user.id}`.toLowerCase().includes(userFilter.toLowerCase())
      ),
    [users, userFilter]
  );

  const filteredReviews = useMemo(
    () =>
      reviews.filter((review) =>
        `${review.user_email} ${review.imdb_id} ${review.review} ${review.rating ?? ''}`
          .toLowerCase()
          .includes(reviewFilter.toLowerCase())
      ),
    [reviews, reviewFilter]
  );

  const buttonTheme = {
    back: isDark
      ? 'border-amber-300/30 bg-amber-300/15 text-amber-100 hover:bg-amber-300/25'
      : 'border-amber-300 bg-amber-100 text-amber-900 shadow-none hover:bg-amber-200',
    refresh: isDark
      ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
      : 'border-cyan-300 bg-cyan-100 text-cyan-900 shadow-none hover:bg-cyan-200',
    cancel: isDark
      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
      : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200',
    adminBadge: isDark
      ? 'bg-amber-300/20 text-amber-100'
      : 'bg-amber-100 text-amber-900 shadow-none',
    userBadge: isDark
      ? 'bg-slate-900/80 text-slate-300'
      : 'bg-slate-100 text-slate-800',
    edit: isDark
      ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
      : 'border-cyan-300 bg-cyan-100 text-cyan-900 shadow-none hover:bg-cyan-200',
    delete: isDark
      ? 'border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
      : 'border-rose-300 bg-rose-100 text-rose-900 shadow-none hover:bg-rose-200',
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDark ? 'text-white' : 'text-slate-950'}`}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(180deg,_rgba(2,6,23,1),_rgba(15,23,42,1))]" />

      <Navbar
        favoriteCount={0}
        activeView="admin"
        onHomeClick={() => navigate('/')}
        onWatchlistClick={() => navigate('/watchlist')}
        onFavoritesClick={() => navigate('/favorites')}
        isAuthenticated={isAuthenticated}
        authEmail={authEmail}
        onLoginClick={() => navigate('/')}
        onRegisterClick={() => navigate('/')}
        onProfileClick={() => navigate('/profile')}
        onLogoutClick={handleLogout}
      />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${buttonTheme.back}`}
        >
          <FiArrowLeft />
          Back to home
        </button>

        {!isAuthenticated ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Admin access locked</p>
            <h1 className="mt-2 text-3xl font-black">Sign in to access the admin dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Use the admin account to view users, all review ratings, and moderation tools.
            </p>
          </div>
        ) : statsLoading || usersLoading || reviewsLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300 backdrop-blur-xl">
            Loading admin dashboard...
          </div>
        ) : !isAdmin ? (
          <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-8 text-rose-100 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em]">Forbidden</p>
            <h1 className="mt-2 text-3xl font-black">Admin privileges required</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7">
              The signed-in account does not have admin permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Admin dashboard</p>
                  <h1 className="mt-2 text-4xl font-black">Platform control center</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                    Manage users, create and edit reviews, and moderate every rating in one place.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshDashboard}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${buttonTheme.refresh}`}
                >
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>

              {error && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">
                  <FiAlertTriangle className="mt-1 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<FiUsers />} label="Total users" value={stats?.total_users ?? 0} />
              <StatCard icon={<FiFilm />} label="Reviews" value={stats?.total_reviews ?? 0} />
              <StatCard icon={<FiHeart />} label="Favorites" value={stats?.total_favorites ?? 0} />
              <StatCard
                icon={<FiBarChart2 />}
                label="Most searched movie"
                value={stats?.most_searched_movie || 'N/A'}
                subtitle={stats?.most_searched_movie_count ? `${stats.most_searched_movie_count} searches` : 'No search data yet'}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">User list</p>
                    <h2 className="mt-2 text-2xl font-black">User management</h2>
                  </div>
                  <label className="block w-full max-w-sm">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Search users
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">
                      <FiSearch className="text-slate-400" />
                      <input
                        value={userFilter}
                        onChange={(event) => setUserFilter(event.target.value)}
                        placeholder="Filter by email or ID"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </label>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                      <thead className="bg-slate-950/80 text-slate-300">
                        <tr>
                          <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">ID</th>
                          <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Email</th>
                          <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Role</th>
                          <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5">
                              <td className="px-4 py-3 font-semibold text-white">{user.id}</td>
                              <td className="px-4 py-3 text-slate-200">{user.email}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                                    user.is_admin ? buttonTheme.adminBadge : buttonTheme.userBadge
                                  }`}
                                >
                                  {user.is_admin ? 'Admin' : 'User'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-300">{formatDate(user.created_at)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Review editor</p>
                    <h2 className="mt-2 text-2xl font-black">
                      {editingReviewId ? 'Edit review or rating' : 'Create review or rating'}
                    </h2>
                  </div>
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={startCreate}
                      className={`rounded-2xl border px-4 py-2 text-sm font-black transition ${buttonTheme.cancel}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-300">
                    IMDb ID
                    <input
                      type="text"
                      value={form.imdb_id}
                      onChange={(event) => handleFormChange('imdb_id', event.target.value)}
                      disabled={Boolean(editingReviewId)}
                      placeholder="tt0468569"
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-slate-300">
                    Review
                    <textarea
                      rows={5}
                      value={form.review}
                      onChange={(event) => handleFormChange('review', event.target.value)}
                      placeholder="Write the review text..."
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    />
                  </label>

                  <label className="block text-sm font-semibold text-slate-300">
                    Rating
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      inputMode="numeric"
                      value={form.rating}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (nextValue === '') {
                          handleFormChange('rating', '');
                          return;
                        }

                        const nextNumber = Number(nextValue);
                        if (Number.isNaN(nextNumber)) return;
                        handleFormChange('rating', String(Math.min(5, Math.max(1, nextNumber))));
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 [appearance:textfield] [-moz-appearance:textfield]"
                    />
                  </label>

                  {formError && (
                    <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100">
                      {formError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={savingReview}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiSave />
                    {savingReview ? 'Saving...' : editingReviewId ? 'Update Review' : 'Create Review'}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">All reviews</p>
                  <h2 className="mt-2 text-2xl font-black">Users reviews and ratings</h2>
                </div>
                <label className="block w-full max-w-md">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Search reviews
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    <FiSearch className="text-slate-400" />
                    <input
                      value={reviewFilter}
                      onChange={(event) => setReviewFilter(event.target.value)}
                      placeholder="Filter by user, imdb id, text, or rating"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </label>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                    <thead className="bg-slate-950/80 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">ID</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">IMDb ID</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">User</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Rating</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Review</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Updated</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-white/5">
                      {filteredReviews.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No reviews found.
                          </td>
                        </tr>
                      ) : (
                        filteredReviews.map((review) => (
                          <tr key={review.id} className="align-top hover:bg-white/5">
                            <td className="px-4 py-3 font-semibold text-white">{review.id}</td>
                            <td className="px-4 py-3 text-slate-200">{review.imdb_id}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-white">{review.user_email}</p>
                                <p className="text-xs text-slate-400">User ID {review.user_id}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {review.rating != null ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-900 shadow-none dark:border-amber-300/20 dark:bg-amber-300/15 dark:text-amber-100">
                                  <FiStar className="fill-current text-amber-500 dark:text-amber-300" />
                                  {review.rating}/5
                                </span>
                              ) : (
                                <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 shadow-none dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
                                  No rating
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              <p className="max-w-xl whitespace-pre-wrap leading-6">{review.review}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{formatDate(review.updated_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(review)}
                                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${buttonTheme.edit}`}
                                >
                                  <FiEdit3 />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={deletingReviewId === review.id}
                                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonTheme.delete}`}
                                >
                                  <FiTrash2 />
                                  {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Showing {filteredReviews.length} of {reviewsTotal} reviews
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewsPage((page) => Math.max(1, page - 1))}
                    disabled={reviewsPage === 1}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewsPage((page) => page + 1)}
                    disabled={reviewsPage * reviewsLimit >= reviewsTotal}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtitle }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
    <div className="flex items-center gap-3 text-slate-300">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    {icon}
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.22em]">{label}</p>
                </div>
    <p className="mt-4 text-3xl font-black text-white">{value}</p>
    {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
  </div>
);
