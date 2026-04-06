'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { LuShield, LuSmartphone, LuCheck, LuTrash2, LuRefreshCw } from 'react-icons/lu';
import Image from 'next/image';

type Step = 'manage' | 'enroll-scan' | 'enroll-verify';

interface TOTPFactor {
  id: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
}

export default function SecuritySettingsPage() {
  const { listMFAFactors, enrollTOTP, verifyTOTPEnrollment, unenrollMFA } = useAuth();

  const [step, setStep] = useState<Step>('manage');
  const [factors, setFactors] = useState<TOTPFactor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);

  // Enrollment state
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const refreshFactors = useCallback(async () => {
    setLoadingFactors(true);
    try {
      const data = await listMFAFactors();
      setFactors(data as TOTPFactor[]);
    } catch {
      // ignore
    } finally {
      setLoadingFactors(false);
    }
  }, [listMFAFactors]);

  useEffect(() => { refreshFactors(); }, [refreshFactors]);

  const handleStartEnroll = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await enrollTOTP();
      setEnrollData(data);
      setStep('enroll-scan');
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to start enrollment.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    setError('');
    setLoading(true);
    try {
      await verifyTOTPEnrollment(enrollData.factorId, code.replace(/\s/g, ''));
      setSuccessMsg('Authenticator app connected successfully.');
      setStep('manage');
      setCode('');
      setEnrollData(null);
      await refreshFactors();
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (factorId: string) => {
    setError('');
    setLoading(true);
    try {
      await unenrollMFA(factorId);
      setSuccessMsg('Authenticator app removed.');
      await refreshFactors();
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to remove factor.');
    } finally {
      setLoading(false);
    }
  };

  const verifiedFactors = factors.filter((f) => f.status === 'verified');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <LuShield className="h-6 w-6 text-accent-primary" />
        <h1 className="text-2xl font-bold text-text-primary">Security Settings</h1>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <LuCheck className="h-4 w-4 text-success flex-shrink-0" />
          <span className="text-sm text-success">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Manage view */}
      {step === 'manage' && (
        <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
          <div className="mb-4 flex items-center gap-2">
            <LuSmartphone className="h-4 w-4 text-accent-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Two-Factor Authentication (2FA)</h2>
          </div>
          <p className="mb-5 text-xs text-text-muted">
            2FA adds a second layer of security. When signing in you&apos;ll need to enter a code
            from your authenticator app (e.g. Google Authenticator, Authy) in addition to your password.
          </p>

          {loadingFactors ? (
            <p className="text-xs text-text-muted">Loading...</p>
          ) : verifiedFactors.length > 0 ? (
            <div className="flex flex-col gap-3">
              {verifiedFactors.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <LuCheck className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-text-primary">
                      Authenticator app connected
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnenroll(f.id)}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={handleStartEnroll}
                disabled={loading}
                className="mt-1 flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-dark transition-colors disabled:opacity-50"
              >
                <LuRefreshCw className="h-3.5 w-3.5" />
                Replace with a new device
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEnroll}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              <LuSmartphone className="h-4 w-4" />
              {loading ? 'Setting up...' : 'Set up Authenticator App'}
            </button>
          )}
        </section>
      )}

      {/* Enroll — scan QR step */}
      {step === 'enroll-scan' && enrollData && (
        <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">Step 1 — Scan QR Code</h2>
          <p className="mb-5 text-xs text-text-muted">
            Open Google Authenticator, Authy, or any TOTP app and scan the QR code below.
            Can&apos;t scan? Enter the secret key manually.
          </p>

          <div className="mb-5 flex flex-col items-center gap-4">
            <div className="rounded-xl border border-border-primary bg-white p-3">
              {/* QR code is returned as a data URI by Supabase */}
              <Image src={enrollData.qrCode} alt="MFA QR code" width={180} height={180} unoptimized />
            </div>
            <details className="w-full">
              <summary className="cursor-pointer text-xs text-accent-primary hover:text-accent-dark">
                Show secret key instead
              </summary>
              <p className="mt-2 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 font-mono text-xs text-text-primary break-all">
                {enrollData.secret}
              </p>
            </details>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('enroll-verify'); setError(''); }}
              className="flex-1 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
            >
              I&apos;ve scanned it → Next
            </button>
            <button
              onClick={() => { setStep('manage'); setEnrollData(null); setError(''); }}
              className="rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Enroll — verify code step */}
      {step === 'enroll-verify' && enrollData && (
        <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">Step 2 — Confirm the Code</h2>
          <p className="mb-5 text-xs text-text-muted">
            Enter the 6-digit code shown in your authenticator app to confirm it&apos;s set up correctly.
          </p>

          <form onSubmit={handleVerifyEnrollment} className="flex flex-col gap-4">
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
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex-1 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Confirm & Enable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('enroll-scan'); setError(''); setCode(''); }}
                className="rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                Back
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
