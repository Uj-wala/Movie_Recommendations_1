/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { useTheme } from '../context/useTheme';

export const AuthModal = ({ isOpen, mode, onClose, onSubmit, onModeChange, isLoading, error }) => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required.';
    if (!emailPattern.test(trimmed)) return 'Enter a valid email address.';
    return '';
  };

  const validatePassword = (value, requireStrength = false) => {
    if (!value) return 'Password is required.';
    if (!requireStrength) return '';
    if (value.length < 8 || value.length > 128) return 'Password must be between 8 and 128 characters.';
    if (!/[A-Za-z]/.test(value)) return 'Password must include at least one letter.';
    if (!/\d/.test(value)) return 'Password must include at least one number.';
    return '';
  };

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setEmailError('');
      setPasswordError('');
    }
  }, [isOpen, mode]);

  if (!isOpen) {
    return null;
  }

  const isResetMode = mode === 'reset';
  const requireStrength = mode !== 'login';
  const title = mode === 'register' ? 'Create account' : isResetMode ? 'Reset password' : 'Sign in';
  const submitLabel = mode === 'register' ? 'Register' : isResetMode ? 'Update password' : 'Login';
  const shellText = isDark ? 'text-slate-100' : 'text-[#f8fafc]';
  const mutedText = isDark ? 'text-slate-300' : 'text-[#cbd5e1]';
  const softText = isDark ? 'text-slate-400' : 'text-[#94a3b8]';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Authentication</p>
            <h2 className={`mt-2 text-2xl font-black ${shellText}`}>{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300/70 bg-slate-100 text-slate-900 shadow-sm transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label="Close authentication dialog"
          >
            <FiX />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedEmail = email.trim();
            const emailValidation = validateEmail(trimmedEmail);
            const passwordValidation = validatePassword(password, requireStrength);

            setEmailError(emailValidation);
            setPasswordError(passwordValidation);

            if (emailValidation || passwordValidation) {
              return;
            }

            onSubmit(trimmedEmail, password);
          }}
          className="space-y-4"
        >
          <label className={`block text-sm font-semibold ${mutedText}`}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(validateEmail(event.target.value));
              }}
              required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
            {emailError && <p className="mt-2 text-xs text-rose-300">{emailError}</p>}
          </label>

          <label className={`block text-sm font-semibold ${mutedText}`}>
            {isResetMode ? 'New password' : 'Password'}
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(validatePassword(event.target.value, requireStrength));
              }}
              required
              autoComplete={isResetMode ? 'new-password' : 'current-password'}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
            {passwordError && <p className="mt-2 text-xs text-rose-300">{passwordError}</p>}
          </label>

          {!isResetMode ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-300/70 bg-slate-100/95 px-4 py-3 text-xs text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Forgot your password?</span>
              <button
                type="button"
                onClick={() => onModeChange?.('reset')}
                className="inline-flex items-center gap-1 font-black uppercase tracking-[0.16em] text-cyan-600 transition hover:text-cyan-500 dark:text-cyan-300 dark:hover:text-cyan-200"
              >
                <FiArrowLeft className="text-[0.7rem]" />
                Reset it
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-xs leading-6 text-cyan-100">
              Enter your email and a new password to update the account password.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !!emailError || !!passwordError || !email || !password}
            className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Working...' : submitLabel}
          </button>

          {isResetMode && (
            <button
              type="button"
              onClick={() => onModeChange?.('login')}
              className={`w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] ${softText} transition hover:bg-white/10`}
            >
              Back to sign in
            </button>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
};
