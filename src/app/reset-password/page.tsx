'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { LuCheck } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const { updatePassword } = useAuth();
  const router = useRouter();

  // Supabase recovery links may arrive with tokens in the URL hash or a PKCE code
  // in the query string. Explicitly establish the session here so password updates
  // do not depend on implicit client-side URL detection timing.
  useEffect(() => {
    let cancelled = false;

    async function bootstrapRecoverySession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const searchParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const authCode = searchParams.get('code');

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (authCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(authCode);
          if (error) throw error;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) {
          setValidSession(!!session);
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Failed to establish password reset session:', err);
        if (!cancelled) {
          setValidSession(false);
          setCheckingSession(false);
        }
      }
    }

    void bootstrapRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <p className="text-sm text-text-muted">Verifying reset link...</p>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-[440px] rounded-2xl border border-border-primary bg-bg-secondary p-8 text-center">
          <SiteLogo className="mx-auto mb-4 h-14 w-14" size={56} />
          <h1 className="mb-2 text-lg font-semibold text-text-primary">Invalid or expired link</h1>
          <p className="mb-6 text-sm text-text-muted">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-[440px] rounded-2xl border border-border-primary bg-bg-secondary p-8">
        <div className="mb-8 flex flex-col items-center gap-2">
          <SiteLogo className="h-14 w-14" size={56} />
          <h1 className="text-xl font-semibold text-text-primary">Set new password</h1>
          <p className="text-sm text-text-muted">Enter a new password for your account</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <LuCheck className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium text-text-primary">Password updated!</p>
            <p className="text-xs text-text-muted">Redirecting you to the dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                required
                minLength={6}
                className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
