/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiRefreshCw, FiUser, FiX } from 'react-icons/fi';
import { useToast } from '../context/useToast';
import { changeProfilePassword, getProfile, updateProfile } from '../services/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!emailPattern.test(trimmed)) return 'Enter a valid email address.';
  return '';
};

const validatePassword = (value) => {
  if (!value) return 'Password is required.';
  if (value.length < 8 || value.length > 128) return 'Password must be between 8 and 128 characters';
  if (!/[A-Za-z]/.test(value)) return 'Password must include at least one letter';
  if (!/\d/.test(value)) return 'Password must include at least one number';
  return '';
};

const validateCurrentPassword = (value) => {
  if (!value) return 'Current password is required.';
  return '';
};

export const ProfileModal = ({ isOpen, onClose, currentEmail = '', onProfileUpdated }) => {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(currentEmail);
  const [emailError, setEmailError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    let isCurrent = true;
    setError('');
    setEmailError('');
    setPasswordError('');
    setEmail(currentEmail);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsLoading(true);

    getProfile().then((result) => {
      if (!isCurrent) return;
      if (result.success) {
        setProfile(result.data);
        setEmail(result.data.email || currentEmail);
      } else {
        setError(result.error || 'Unable to load profile.');
      }
      setIsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, currentEmail]);

  if (!isOpen) return null;

  const handleSaveEmail = async () => {
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
    onProfileUpdated?.(result.data.email);
    addToast('Profile updated successfully.', 'success');
    setSavingEmail(false);
  };

  const handleChangePassword = async () => {
    const currentValidation = validateCurrentPassword(currentPassword);
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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Account</p>
            <h2 className="mt-2 text-2xl font-black text-white">Profile Settings</h2>
            <p className="mt-2 text-sm text-slate-400">View and update your account details.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/70 bg-slate-100 text-slate-900 shadow-sm transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label="Close profile dialog"
          >
            <FiX />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                <FiUser />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Profile Details</p>
                <p className="text-lg font-black text-white">{profile?.email || currentEmail || 'Loading...'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              {isLoading ? 'Loading your profile...' : profile?.created_at ? `Member since ${new Date(profile.created_at).toLocaleDateString()}` : 'Your account profile is ready.'}
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100">
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
                  setEmail(result.data.email || currentEmail);
                } else {
                  setError(result.error || 'Unable to refresh profile.');
                }
                setIsLoading(false);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              <FiRefreshCw />
              Refresh Profile
            </button>
          </div>

          <div className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiMail className="text-cyan-200" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Update Email</h3>
              </div>
              <label className="block text-sm font-semibold text-slate-300">
                New email address
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
                onClick={handleSaveEmail}
                disabled={savingEmail}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEmail ? 'Saving...' : 'Save Email'}
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <FiLock className="text-fuchsia-200" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-200">Change Password</h3>
              </div>
              <div className="grid gap-4">
                <label className="block text-sm font-semibold text-slate-300">
                  Current password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setPasswordError(validateCurrentPassword(event.target.value));
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
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  className="inline-flex items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-fuchsia-300/15 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-fuchsia-100 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-300/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
