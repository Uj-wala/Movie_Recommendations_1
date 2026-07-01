import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiFilm,
  FiClock,
  FiHeart,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { AnalyticsCard, BarChart, DonutChart, SparklineChart, StatCard } from '../components/admin/AdminAnalytics'; import { AdminReviewsPanel } from '../components/admin/AdminReviewsPanel';
import { useToast } from '../context/useToast';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../context/useTheme';
import {
  clearAuth,
  createAdminReview,
  deleteAdminUser,
  deleteAdminReview,
  getAdminActivityLogs,
  getAdminReviews,
  getAdminStats,
  getAdminUsers,
  getProfile,
  setAuthorizationHeader,
  updateAdminUserRole,
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

const formatDayLabel = (date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const isSameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

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
  const [activityLogs, setActivityLogs] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLimit] = useState(15);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [updatingUserRoleId, setUpdatingUserRoleId] = useState(null);
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

  const loadDashboard = useCallback(async () => {
    if (!authToken) {
      setProfile(null);
      setStats(null);
      setUsers([]);
      setReviews([]);
      setActivityLogs([]);
      setUsersLoading(false);
      setReviewsLoading(false);
      setStatsLoading(false);
      setActivityLogsLoading(false);
      return;
    }

    setError('');
    const profileResult = await getProfile();
    if (!profileResult.success) {
      setError(profileResult.error || 'Unable to load profile.');
      setUsersLoading(false);
      setReviewsLoading(false);
      setStatsLoading(false);
      setActivityLogs([]);
      setActivityLogsLoading(false);
      return;
    }

    setProfile(profileResult.data);
    if (!profileResult.data.is_admin) {
      setUsersLoading(false);
      setReviewsLoading(false);
      setStatsLoading(false);
      setActivityLogs([]);
      setActivityLogsLoading(false);
      return;
    }

    setUsersLoading(true);
    setReviewsLoading(true);
    setStatsLoading(true);
    setActivityLogsLoading(true);

    const [statsResult, usersResult, reviewsResult, activityLogsResult] = await Promise.all([
      getAdminStats(),
      getAdminUsers(),
      getAdminReviews(reviewsPage, reviewsLimit),
      getAdminActivityLogs(1, 20),
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

    if (activityLogsResult.success) {
      setActivityLogs(activityLogsResult.data.items || []);
    } else {
      setError(activityLogsResult.error || 'Unable to load activity logs.');
    }

    setUsersLoading(false);
    setReviewsLoading(false);
    setStatsLoading(false);
    setActivityLogsLoading(false);
  }, [authToken, reviewsLimit, reviewsPage]);

  useEffect(() => {
    let isCurrent = true;

    (async () => {
      if (!isCurrent) return;
      await loadDashboard();
    })();

    return () => {
      isCurrent = false;
    };
  }, [loadDashboard]);

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
    setActivityLogs([]);
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

  const handleToggleUserRole = async (user) => {
    if (!window.confirm(`Change the role for ${user.email}?`)) return;

    setUpdatingUserRoleId(user.id);
    const result = await updateAdminUserRole(user.id, !user.is_admin);
    if (!result.success) {
      addToast(result.error || 'Unable to update user role.', 'error');
      setUpdatingUserRoleId(null);
      return;
    }

    addToast('User role updated successfully.', 'success');
    await loadDashboard();
    setUpdatingUserRoleId(null);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;

    setDeletingUserId(user.id);
    const result = await deleteAdminUser(user.id);
    if (!result.success) {
      addToast(result.error || 'Unable to delete user.', 'error');
      setDeletingUserId(null);
      return;
    }

    addToast('User deleted successfully.', 'success');
    await loadDashboard();
    setDeletingUserId(null);
  };

  const activityLogLabelTheme = (action) => {
    if (action.includes('delete')) {
      return isDark
        ? 'border-rose-400/25 bg-rose-500/10 text-rose-100'
        : 'border-rose-300 bg-rose-100 text-rose-900 shadow-none';
    }
    if (action.includes('update')) {
      return isDark
        ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100'
        : 'border-cyan-300 bg-cyan-100 text-cyan-900 shadow-none';
    }
    return isDark
      ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
      : 'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-none';
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

  const userChartData = useMemo(() => {
    const adminCount = users.filter((user) => user.is_admin).length;
    const regularCount = Math.max(users.length - adminCount, 0);
    const total = Math.max(users.length, 1);

    return {
      total: users.length,
      adminCount,
      regularCount,
      adminShare: Math.round((adminCount / total) * 100),
    };
  }, [users]);

  const ratingChartData = useMemo(() => {
    const buckets = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: filteredReviews.filter((review) => Number(review.rating) === rating).length,
    }));
    const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
    const ratedReviews = filteredReviews.filter((review) => review.rating != null);
    const averageRating = ratedReviews.length
      ? (
          ratedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / ratedReviews.length
        ).toFixed(1)
      : 'N/A';

    return {
      buckets,
      maxCount,
      ratedReviews: ratedReviews.length,
      averageRating,
    };
  }, [filteredReviews]);

  const activityChartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const counts = days.map(
      (day) =>
        filteredReviews.filter((review) => {
          const updatedAt = new Date(review.updated_at || review.created_at || '');
          return !Number.isNaN(updatedAt.getTime()) && isSameDay(updatedAt, day);
        }).length
    );
    const maxCount = Math.max(...counts, 1);
    const points = counts
      .map((count, index) => {
        const x = (index / Math.max(days.length - 1, 1)) * 100;
        const y = 100 - (count / maxCount) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    return {
      days,
      counts,
      maxCount,
      points,
    };
  }, [filteredReviews]);

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
  const panelClass = isDark
    ? 'border-slate-800 bg-slate-900/95 shadow-[0_24px_80px_rgba(0,0,0,0.34)]'
    : 'border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]';
  const tableShellClass = isDark
    ? 'border-slate-800 bg-slate-950/55'
    : 'border-slate-200 bg-slate-50 shadow-inner';
  const tableHeadClass = isDark
    ? 'bg-slate-950/90 text-slate-300'
    : 'bg-slate-100 text-slate-700';
  const tableBodyClass = isDark
    ? 'divide-y divide-slate-800 bg-slate-900/60'
    : 'divide-y divide-slate-200 bg-white';
  const tableRowClass = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const toolbarPillClass = isDark
    ? 'border-white/10 bg-slate-950/70 text-slate-300'
    : 'border-slate-200 bg-white text-slate-700 shadow-sm';

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'}`}>

      <Navbar
        favoriteCount={0}
        activeView="admin"
        onHomeClick={() => navigate('/')}
        onWatchlistClick={() => navigate('/watchlist')}
        onFavoritesClick={() => navigate('/favorites')}
        onCollectionsClick={() => navigate('/collections')}
        onCompareClick={() => navigate('/compare')}
        isAuthenticated={isAuthenticated}
        authEmail={authEmail}
        onLoginClick={() => navigate('/')}
        onRegisterClick={() => navigate('/')}
        onProfileClick={() => navigate('/profile')}
        onLogoutClick={handleLogout}
      />

      <main className="mx-auto w-full max-w-[1800px] space-y-8 px-3 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-8 2xl:px-10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${buttonTheme.back}`}
        >
          <FiArrowLeft />
          Back to home
        </button>

        {!isAuthenticated ? (
          <div className={`rounded-3xl border p-8 ${panelClass}`}>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Admin access locked</p>
            <h1 className="mt-2 text-3xl font-black">Sign in to access the admin dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Use the admin account to view users, all review ratings, and moderation tools.
            </p>
          </div>
        ) : statsLoading || usersLoading || reviewsLoading || activityLogsLoading ? (
          <div className={`rounded-3xl border p-8 text-center text-slate-300 ${panelClass}`}>
            Loading admin dashboard...
          </div>
        ) : !isAdmin ? (
          <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-8 text-rose-100 shadow-[0_18px_55px_rgba(244,63,94,0.10)]">
            <p className="text-xs font-black uppercase tracking-[0.22em]">Forbidden</p>
            <h1 className="mt-2 text-3xl font-black">Admin privileges required</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7">
              The signed-in account does not have admin permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${panelClass}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Admin dashboard</p>
                  <h1 className="mt-2 text-3xl font-black sm:text-4xl">Platform control center</h1>
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

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className={`rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${panelClass}`}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Audit trail</p>
                  <h2 className="mt-2 text-2xl font-black">Recent admin activity</h2>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] ${toolbarPillClass}`}>
                  <FiClock />
                  {activityLogs.length} loaded
                </div>
              </div>

              <div className={`overflow-hidden rounded-2xl border sm:rounded-3xl ${tableShellClass}`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                    <thead className={tableHeadClass}>
                      <tr>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Action</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Actor</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Target</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">Details</th>
                        <th className="px-4 py-3 font-black uppercase tracking-[0.18em]">When</th>
                      </tr>
                    </thead>
                    <tbody className={tableBodyClass}>
                      {activityLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            No audit entries yet.
                          </td>
                        </tr>
                      ) : (
                        activityLogs.map((log) => (
                          <tr key={log.id} className={`align-top ${tableRowClass}`}>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${activityLogLabelTheme(log.action)}`}
                              >
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              <div className="space-y-1">
                                <p className="font-semibold text-white">{log.actor_email || 'System'}</p>
                                <p className="text-xs text-slate-400">User ID {log.actor_user_id ?? 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              <div className="space-y-1">
                                <p className="font-semibold text-white">
                                  {log.entity_type} {log.entity_id ?? 'N/A'}
                                </p>
                                <p className="text-xs text-slate-400">Status: {log.status}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              <p className="max-w-xl whitespace-pre-wrap leading-6">{log.details || 'No extra details'}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{formatDate(log.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${panelClass}`}
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Visual analytics</p>
                  <h2 className="mt-2 text-2xl font-black">Graphical dashboard snapshot</h2>
                </div>
                <p className="text-sm text-slate-400">
                  Charts are based on the loaded users and the current review page.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <AnalyticsCard
                  title="User roles"
                  subtitle={`${userChartData.adminCount} admins and ${userChartData.regularCount} users`}
                >
                  <DonutChart
                    primary={userChartData.adminCount}
                    secondary={userChartData.regularCount}
                    isDark={isDark}
                    centerLabel={`${userChartData.adminShare}%`}
                    centerCaption="admins"
                  />
                </AnalyticsCard>

                <AnalyticsCard
                  title="Rating spread"
                  subtitle={`${ratingChartData.ratedReviews} rated reviews on this page`}
                >
                  <BarChart data={ratingChartData.buckets} maxCount={ratingChartData.maxCount} isDark={isDark} />
                  <div className="mt-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    <span>Average rating</span>
                    <span>{ratingChartData.averageRating}/5</span>
                  </div>
                </AnalyticsCard>

                <AnalyticsCard
                  title="Recent review activity"
                  subtitle="Last 7 days from the loaded page"
                >
                  <SparklineChart data={activityChartData.counts} isDark={isDark} />
                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {activityChartData.days.map((day, index) => (
                      <div key={day.toISOString()} className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          {formatDayLabel(day)}
                        </div>
                        <div className="mt-2 text-sm font-black text-white">{activityChartData.counts[index]}</div>
                      </div>
                    ))}
                  </div>
                </AnalyticsCard>
              </div>
            </motion.section>

            <section className="space-y-5 sm:space-y-6">
              <div className={`min-w-0 rounded-2xl border p-4 sm:rounded-3xl sm:p-6 ${panelClass}`}>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">User list</p>
                    <h2 className="mt-2 text-2xl font-black">User management</h2>
                  </div>
                  <label className="block w-full max-w-sm">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Search users
                    </span>
                    <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${toolbarPillClass}`}>
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

                <div className={`overflow-hidden rounded-3xl border ${tableShellClass}`}>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1120px] table-fixed divide-y divide-white/10 text-left text-sm">
                      <colgroup>
                        <col className="w-24" />
                        <col className="w-[34%]" />
                        <col className="w-40" />
                        <col className="w-64" />
                        <col className="w-[30%]" />
                      </colgroup>
                      <thead className={tableHeadClass}>
                        <tr>
                          <th className="px-6 py-4 font-black uppercase tracking-[0.18em]">No.</th>
                          <th className="px-6 py-4 font-black uppercase tracking-[0.18em]">Email</th>
                          <th className="px-6 py-4 font-black uppercase tracking-[0.18em]">Role</th>
                          <th className="px-6 py-4 font-black uppercase tracking-[0.18em]">Created</th>
                          <th className="px-6 py-4 font-black uppercase tracking-[0.18em]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={tableBodyClass}>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <tr key={user.id} className={tableRowClass}>
                              <td className="px-6 py-4 font-semibold text-white" title={`User ID ${user.id}`}>
                                {index + 1}
                              </td>
                              <td className="break-words px-6 py-4 text-slate-200">{user.email}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                                    user.is_admin ? buttonTheme.adminBadge : buttonTheme.userBadge
                                  }`}
                                >
                                  {user.is_admin ? 'Admin' : 'User'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{formatDate(user.created_at)}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserRole(user)}
                                    disabled={updatingUserRoleId === user.id || user.id === profile?.id}
                                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                      isDark
                                        ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
                                        : 'border-cyan-300 bg-cyan-100 text-cyan-900 shadow-none hover:bg-cyan-200'
                                    }`}
                                  >
                                    <FiUsers />
                                    {updatingUserRoleId === user.id ? 'Updating...' : user.is_admin ? 'Demote' : 'Promote'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user)}
                                    disabled={deletingUserId === user.id || user.id === profile?.id}
                                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonTheme.delete}`}
                                  >
                                    <FiTrash2 />
                                    {deletingUserId === user.id ? 'Deleting...' : 'Delete User'}
                                  </button>
                                </div>
                                {user.id === profile?.id && (
                                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                                    Current account
                                  </p>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <AdminReviewsPanel
                {...{
                  panelClass, buttonTheme, toolbarPillClass, tableShellClass, tableHeadClass, tableBodyClass,
                  tableRowClass, editingReviewId, startCreate, form, handleFormChange, submitReview,
                  savingReview, formError, reviewFilter, setReviewFilter, filteredReviews, formatDate,
                  startEdit, handleDeleteReview, deletingReviewId, reviewsTotal, reviewsPage, setReviewsPage,
                  reviewsLimit,
                }}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
