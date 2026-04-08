'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LuCheck, LuShield, LuSmartphone } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';

type Step = 'scan' | 'verify';

export default function MFASetupPage() {
  const {
    user,
    loading: authLoading,
    mfaRequired,
    mfaSetupRequired,
    enrollTOTP,
    verifyTOTPEnrollment,
    signOut,
  } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('scan');
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    if (mfaRequired) {
      router.push('/mfa/verify');
      return;
    }

    if (!mfaSetupRequired) {
      router.push('/dashboard');
      return;
    }

    const startEnrollment = async () => {
      setError('');
      setLoading(true);
      try {
        const data = await enrollTOTP();
        setEnrollData(data);
      } catch (err: unknown) {
        setError((err as { message?: string }).message ?? 'Failed to start authenticator setup.');
      } finally {
        setLoading(false);
      }
    };

    void startEnrollment();
  }, [authLoading, user, mfaRequired, mfaSetupRequired, enrollTOTP, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;

    setError('');
    setLoading(true);
    try {
      await verifyTOTPEnrollment(enrollData.factorId, code.replace(/\s/g, ''));
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Preparing two-factor authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-[460px] rounded-2xl border border-border-primary bg-bg-secondary p-8">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10">
            <LuShield className="h-7 w-7 text-accent-primary" />
          </div>
          <h1 className="text-center text-xl font-semibold text-text-primary">
            Set Up Two-Factor Authentication
          </h1>
          <p className="text-center text-sm text-text-muted">
            To keep your account secure, register an authenticator app before continuing.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {step === 'scan' && enrollData && (
          <section className="flex flex-col gap-5">
            <div className="rounded-xl border border-border-primary bg-bg-tertiary/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <LuSmartphone className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Step 1 — Scan the QR code</h2>
              </div>
              <p className="text-xs text-text-muted">
                Open Google Authenticator, Authy, or another TOTP app and scan this QR code.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-border-primary bg-white p-3">
                <Image src={enrollData.qrCode} alt="MFA QR code" width={180} height={180} unoptimized />
              </div>
              <details className="w-full">
                <summary className="cursor-pointer text-xs text-accent-primary hover:text-accent-dark">
                  Enter a secret key manually instead
                </summary>
                <p className="mt-2 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 font-mono text-xs text-text-primary break-all">
                  {enrollData.secret}
                </p>
              </details>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
            >
              I&apos;ve scanned it
            </button>
          </section>
        )}

        {step === 'verify' && enrollData && (
          <section>
            <div className="mb-5 rounded-xl border border-border-primary bg-bg-tertiary/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <LuCheck className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Step 2 — Confirm your code</h2>
              </div>
              <p className="text-xs text-text-muted">
                Enter the 6-digit code from your authenticator app to finish account setup.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
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
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="flex-1 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Finish Setup'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('scan'); setError(''); setCode(''); }}
                  className="rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
                >
                  Back
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => signOut()}
            className="text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
