import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiLock, FiMail, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { CinematicBackground } from '../components/CinematicBackground';
import { Navbar } from '../components/Navbar';
import { useToast } from '../context/useToast';
import { useTheme } from '../context/useTheme';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { clearAuth, getProfile, updateProfile, changeProfilePassword, setAuthorizationHeader } from '../services/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!emailPattern.test(trimmed)) return 'Enter a valid email address.';
  return '';
};

const validatePassword = (value) => {
  if (!value) return 'Password is required.';
  if (value.length < 8 || value.length > 128) return 'Password must be between 8 and 128 characters.';
  if (!/[A-Za-z]/.test(value)) return 'Password must include at least one letter.';
  if (!/\d/.test(value)) return 'Password must include at least one number.';
  return '';
};

const getInitials = (value) => {
  const source = String(value || '').trim();
  if (!source) return 'U';

  const [userPart = ''] = source.split('@');
  const tokens = userPart
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return source.slice(0, 2).toUpperCase() || 'U';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isDark } = useTheme();
  const [authToken, setAuthToken] = useLocalStorage('authToken', '');
  const [authEmail, setAuthEmail] = useLocalStorage('authEmail', '');
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(authEmail || '');
  const [emailError, setEmailError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAuthorizationHeader(authToken || null);
  }, [authToken]);

  useEffect(() => {
    if (!authToken) {
      setIsLoading(false);
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError('');

    getProfile().then((result) => {
      if (!isCurrent) return;
      if (result.success) {
        setProfile(result.data);
        setEmail(result.data.email || authEmail || '');
      } else {
        setError(result.error || 'Unable to load profile.');
      }
      setIsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [authEmail, authToken]);

  const handleLogout = () => {
    clearAuth();
    setAuthToken('');
    setAuthEmail('');
    navigate('/');
  };

  const handleEmailSave = async () => {
    const validation = validateEmail(email);
    setEmailError(validation);
    if (validation) return;

    setSavingEmail(true);
    setError('');
    const result = await updateProfile(email.trim());
    if (!result.success) {
      setError(result.error || 'Unable to update profile.');
      setSavingEmail(false);
      return;
    }

    setProfile(result.data);
    setAuthEmail(result.data.email);
    addToast('Profile updated successfully.', 'success');
    setSavingEmail(false);
  };

  const handlePasswordChange = async () => {
    const currentValidation = currentPassword ? '' : 'Current password is required.';
    const newValidation = validatePassword(newPassword);
    const confirmValidation = newPassword !== confirmPassword ? 'Passwords do not match.' : '';

    setPasswordError(currentValidation || newValidation || confirmValidation);
    if (currentValidation || newValidation || confirmValidation) return;

    setSavingPassword(true);
    setError('');
    const result = await changeProfilePassword(currentPassword, newPassword);
    if (!result.success) {
      setError(result.error || 'Unable to change password.');
      setSavingPassword(false);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast('Password changed successfully.', 'success');
    setSavingPassword(false);
  };

  const isAuthenticated = Boolean(authToken);

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-950'}`}>
      <CinematicBackground />

      <Navbar
        favoriteCount={0}
        activeView="home"
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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-100 transition hover:bg-white/10"
        >
          <FiArrowLeft />
          Back to home
        </button>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
        >
          {!isAuthenticated ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Profile locked</p>
              <h1 className="mt-2 text-3xl font-black">Sign in to manage your profile</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Profile editing and password changes are available after login. Use the home page login button to access your account.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-300"
              >
                Go to Home
              </button>
            </div>
          ) : (
            <>
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/30 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.35),_rgba(15,23,42,0.96))] text-xl font-black text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.18)]">
                {getInitials(profile?.email || authEmail)}
                <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Profile Page</p>
                <h1 className="mt-1 text-2xl font-black">Account Details</h1>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Current Email</p>
              <p className="text-lg font-black text-white">{profile?.email || authEmail || 'Loading...'}</p>
              <p className="text-sm text-slate-400">
                {isLoading
                  ? 'Loading profile...'
                  : profile?.created_at
                    ? `Member since ${new Date(profile.created_at).toLocaleDateString()}`
                    : 'Manage your account details here.'}
              </p>
              {profile?.is_admin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-100 transition hover:bg-amber-300/20"
                >
                  Open Admin Dashboard
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                const result = await getProfile();
                if (result.success) {
                  setProfile(result.data);
                  setEmail(result.data.email || authEmail || '');
                } else {
                  setError(result.error || 'Unable to refresh profile.');
                }
                setIsLoading(false);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black transition hover:bg-white/10"
            >
              <FiRefreshCw />
              Refresh Profile
            </button>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-2">
                <FiMail className="text-cyan-200" />
                <div>
                  <h2 className="text-lg font-black">Edit Profile</h2>
                  <p className="text-sm text-slate-400">Update the email address attached to your account.</p>
                </div>
              </div>
              <label className="block text-sm font-semibold text-slate-300">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError(validateEmail(event.target.value));
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />
                {emailError && <p className="mt-2 text-xs text-rose-300">{emailError}</p>}
              </label>
              <button
                type="button"
                onClick={handleEmailSave}
                disabled={savingEmail}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEmail ? 'Saving...' : 'Save Changes'}
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-2">
                <FiLock className="text-fuchsia-200" />
                <div>
                  <h2 className="text-lg font-black">Change Password</h2>
                  <p className="text-sm text-slate-400">Use your current password before choosing a new one.</p>
                </div>
              </div>

              <div className="grid gap-4">
                <label className="block text-sm font-semibold text-slate-300">
                  Current password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setPasswordError('');
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-300">
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setPasswordError('');
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-300">
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordError('');
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-fuchsia-400"
                  />
                </label>
                {passwordError && <p className="text-xs text-rose-300">{passwordError}</p>}
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={savingPassword}
                  className="inline-flex items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/15 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-fuchsia-100 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </section>
          </div>
            </>
          )}
        </motion.section>
      </main>
    </div>
  );
};
