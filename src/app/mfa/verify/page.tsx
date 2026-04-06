'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LuShield, LuMail, LuSmartphone } from 'react-icons/lu';

type Method = 'totp' | 'email';

export default function MFAVerifyPage() {
  const { user, mfaRequired, challengeAndVerifyMFA, listMFAFactors, sendEmailOTP, signOut } = useAuth();
  const router = useRouter();

  const [method, setMethod] = useState<Method>('totp');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Redirect if MFA not actually required
  useEffect(() => {
    if (!mfaRequired && user) {
      router.push('/dashboard');
    }
  }, [mfaRequired, user, router]);

  // Load the verified TOTP factor ID
  useEffect(() => {
    listMFAFactors().then((factors) => {
      const totp = factors.find((f) => f.status === 'verified');
      if (totp) setFactorId(totp.id);
      else setMethod('email'); // fall back to email if no TOTP enrolled
    }).catch(() => setMethod('email'));
  }, [listMFAFactors]);

  const handleTOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError('');
    setLoading(true);
    try {
      await challengeAndVerifyMFA(factorId, code.replace(/\s/g, ''));
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await sendEmailOTP();
      setEmailSent(true);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to send email.');
    } finally {
      setLoading(false);
    }
  }, [sendEmailOTP]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-[440px] rounded-2xl border border-border-primary bg-bg-secondary p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10">
            <LuShield className="h-7 w-7 text-accent-primary" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Two-Factor Verification</h1>
          <p className="text-center text-sm text-text-muted">
            {user?.email && <span className="font-medium text-text-secondary">{user.email}</span>}
          </p>
        </div>

        {/* Method tabs */}
        <div className="mb-6 flex rounded-lg border border-border-primary bg-bg-tertiary p-1">
          <button
            onClick={() => { setMethod('totp'); setError(''); setCode(''); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              method === 'totp'
                ? 'bg-bg-secondary text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <LuSmartphone className="h-4 w-4" />
            Authenticator
          </button>
          <button
            onClick={() => { setMethod('email'); setError(''); setCode(''); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              method === 'email'
                ? 'bg-bg-secondary text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <LuMail className="h-4 w-4" />
            Email OTP
          </button>
        </div>

        {/* TOTP method */}
        {method === 'totp' && (
          <form onSubmit={handleTOTPSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Open your authenticator app and enter the 6-digit code.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-3 text-center text-2xl font-mono tracking-widest text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {/* Email OTP method */}
        {method === 'email' && (
          <div className="flex flex-col gap-4">
            {!emailSent ? (
              <>
                <p className="text-sm text-text-muted">
                  We&apos;ll send a one-time code to <span className="font-medium text-text-secondary">{user?.email}</span>.
                </p>
                {error && <p className="text-sm text-error">{error}</p>}
                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-text-muted">
                  Check your email for a magic link — clicking it will sign you in fully. You can also{' '}
                  <button onClick={handleSendEmail} className="text-accent-primary hover:underline">
                    resend
                  </button>.
                </p>
                {error && <p className="text-sm text-error">{error}</p>}
              </>
            )}
          </div>
        )}

        {/* Sign out link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => signOut()}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
