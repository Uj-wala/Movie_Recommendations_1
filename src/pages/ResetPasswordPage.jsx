import { useState } from 'react';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { useToast } from '../context/useToast';

const validatePassword = (value) => {
  if (!value) return 'New password is required.';
  if (value.length < 8 || value.length > 128) return 'Password must be between 8 and 128 characters.';
  if (!/[A-Za-z]/.test(value)) return 'Password must include at least one letter.';
  if (!/\d/.test(value)) return 'Password must include at least one number.';
  return '';
};

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const passwordError = validatePassword(newPassword);
    const confirmError = newPassword !== confirmPassword ? 'Passwords do not match.' : '';

    if (!token) {
      setError('Reset link is missing or invalid. Request a new password reset link.');
      return;
    }

    if (passwordError || confirmError) {
      setError(passwordError || confirmError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await resetPassword(token, newPassword);
    if (!result.success) {
      setError(result.error || 'Unable to reset password. Request a new reset link.');
      setIsSubmitting(false);
      return;
    }

    addToast('Password updated successfully. Please sign in.', 'success');
    setIsSubmitting(false);
    navigate('/');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl sm:p-8"
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:text-cyan-100"
          >
            <FiArrowLeft />
            Back to sign in
          </Link>

          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Authentication</p>
            <h1 className="mt-2 text-3xl font-black text-white">Choose a new password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use the reset link you opened to set a new password for your account.
            </p>
          </div>

          {!token && (
            <div className="mb-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100">
              Reset link is missing. Return to sign in and request a new reset link.
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-300">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError('');
                }}
                autoComplete="new-password"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-300">
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError('');
                }}
                autoComplete="new-password"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token || !newPassword || !confirmPassword}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiLock />
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
