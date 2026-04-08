'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { FcGoogle } from 'react-icons/fc';
import PublicFooter from '@/components/PublicFooter';
import SiteLogo from '@/components/SiteLogo';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    resendSignupConfirmation,
  } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSuccess('Check your email for a password reset link.');
        setPendingConfirmationEmail('');
      } else if (mode === 'signin') {
        await signInWithEmail(email, password);
        router.push('/mfa/setup');
      } else {
        const result = await signUpWithEmail(email, password);

        if (result.sessionCreated) {
          setPendingConfirmationEmail('');
          router.push('/mfa/setup');
        } else {
          setPendingConfirmationEmail(email);
          setSuccess('Account created. Check your email to confirm your address, then sign in to finish two-factor setup.');
          setMode('signin');
          setPassword('');
        }
      }
    } catch (err: unknown) {
      const supabaseError = err as { message?: string; status?: number };
      setError(supabaseError.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail) return;

    setError('');
    setSuccess('');
    setResendingConfirmation(true);

    try {
      await resendSignupConfirmation(pendingConfirmationEmail);
      setSuccess(`Confirmation email resent to ${pendingConfirmationEmail}.`);
    } catch (err: unknown) {
      const supabaseError = err as { message?: string };
      setError(supabaseError.message ?? 'Failed to resend confirmation email.');
    } finally {
      setResendingConfirmation(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      const supabaseError = err as { message?: string };
      setError(supabaseError.message ?? 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo className="h-8 w-8" size={32} />
          <span className="text-base font-semibold text-text-primary">Accountant&apos;s Best Friend</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-muted">
          <Link href="/pricing" className="transition-colors hover:text-text-primary">Pricing</Link>
          <Link href="/contact" className="transition-colors hover:text-text-primary">Contact</Link>
        </nav>
      </header>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] rounded-2xl border border-border-primary bg-bg-secondary p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <SiteLogo className="h-14 w-14" size={56} />
          <h1 className="text-xl font-semibold text-text-primary">
            Accountant&apos;s Best Friend
          </h1>
          <p className="text-sm text-text-muted">
            {mode === 'signin'
              ? 'Sign in to your account'
              : 'Create a new account'}
          </p>
        </div>

        {/* Mode Toggle — hidden on forgot password screen */}
        {mode !== 'forgot' && (
          <div className="mb-6 flex rounded-lg border border-border-primary bg-bg-tertiary p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-bg-secondary text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs text-accent-primary hover:text-accent-dark transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          )}

          {error && <p className="text-sm text-error">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}

          {pendingConfirmationEmail && mode === 'signin' && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendingConfirmation || loading}
              className="text-left text-xs font-medium text-accent-primary transition-colors hover:text-accent-dark disabled:opacity-50"
            >
              {resendingConfirmation
                ? 'Resending confirmation email...'
                : `Resend confirmation email to ${pendingConfirmationEmail}`}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className="text-center text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Back to sign in
            </button>
          )}
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-primary" />
          <span className="text-xs text-text-muted">Or continue with</span>
          <div className="h-px flex-1 bg-border-primary" />
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:opacity-50"
        >
          <FcGoogle className="h-5 w-5" />
          Google
        </button>
      </div>
      </div>

      <PublicFooter />
    </div>
  );
}
