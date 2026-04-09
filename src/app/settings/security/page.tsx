'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { LuShield, LuSmartphone, LuCheck, LuRefreshCw, LuLock, LuLockOpen } from 'react-icons/lu';
import Image from 'next/image';

type Step = 'manage' | 'enroll-scan' | 'enroll-verify';

interface TOTPFactor {
  id: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  friendly_name?: string;
}

export default function SecuritySettingsPage() {
  const { listMFAFactors, enrollTOTP, verifyTOTPEnrollment, unenrollMFA, set2FARequired } = useAuth();

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

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const isEnrolled = verifiedFactors.length > 0;

  // ── Enable 2FA ────────────────────────────────────────────────────────────
  const handleEnable = async () => {
    setError('');
    setLoading(true);
    try {
      await set2FARequired(true);
      // Start enrollment immediately
      const data = await enrollTOTP();
      setEnrollData(data);
      setStep('enroll-scan');
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to enable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  // ── Disable 2FA ───────────────────────────────────────────────────────────
  const handleDisable = async () => {
    setError('');
    setLoading(true);
    try {
      // Remove all verified TOTP factors
      for (const factor of verifiedFactors) {
        await unenrollMFA(factor.id);
      }
      await set2FARequired(false);
      await refreshFactors();
      setSuccessMsg('Two-factor authentication has been disabled.');
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  // ── Replace device ────────────────────────────────────────────────────────
  const handleReplace = async () => {
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

  // ── Verify enrollment ─────────────────────────────────────────────────────
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    setError('');
    setLoading(true);
    try {
      await verifyTOTPEnrollment(enrollData.factorId, code.replace(/\s/g, ''));
      setSuccessMsg('Authenticator app connected. Two-factor authentication is now active.');
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

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent-primary/10 p-2.5 text-accent-primary">
            <LuShield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">Security Settings</h1>
            <p className="text-xs text-text-muted">Manage authentication and access protection for your account.</p>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
          <LuCheck className="h-4 w-4 flex-shrink-0 text-success" />
          <span className="text-sm text-success">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* 2FA toggle card — manage view */}
      {step === 'manage' && (
        <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <LuSmartphone className="h-4 w-4 flex-shrink-0 text-accent-primary" />
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Two-Factor Authentication</h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  Require a code from your authenticator app each time you sign in.
                </p>
              </div>
            </div>

            {/* Status badge */}
            {loadingFactors ? null : (
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isEnrolled
                    ? 'bg-success/10 text-success'
                    : 'bg-bg-tertiary text-text-muted'
                }`}
              >
                {isEnrolled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>

          {loadingFactors ? (
            <p className="text-xs text-text-muted">Loading...</p>
          ) : isEnrolled ? (
            /* ── 2FA is ON and enrolled ── */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <LuLock className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-text-primary">
                    Authenticator app active
                  </span>
                </div>
                <button
                  onClick={handleReplace}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-dark transition-colors disabled:opacity-50"
                >
                  <LuRefreshCw className="h-3.5 w-3.5" />
                  Replace device
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border-primary bg-bg-tertiary px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Disable 2FA</p>
                  <p className="text-xs text-text-muted">
                    You will only need your password to sign in.
                  </p>
                </div>
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg border border-error/40 bg-error/5 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                >
                  <LuLockOpen className="h-3.5 w-3.5" />
                  {loading ? 'Disabling...' : 'Disable'}
                </button>
              </div>
            </div>
          ) : (
            /* ── 2FA is OFF ── */
            <div className="flex items-center justify-between rounded-lg border border-border-primary bg-bg-tertiary px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">Enable 2FA</p>
                <p className="text-xs text-text-muted">
                  Protect your account with an authenticator app like Google Authenticator or Authy.
                </p>
              </div>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
              >
                <LuLock className="h-3.5 w-3.5" />
                {loading ? 'Starting...' : 'Enable'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Enroll — scan QR */}
      {step === 'enroll-scan' && enrollData && (
        <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">Step 1 — Scan QR Code</h2>
          <p className="mb-5 text-xs text-text-muted">
            Open Google Authenticator, Authy, or any TOTP app and scan the QR code below.
            Can&apos;t scan? Enter the secret key manually.
          </p>

          <div className="mb-5 flex flex-col items-center gap-4">
            <div className="rounded-xl border border-border-primary bg-white p-3">
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

      {/* Enroll — verify code */}
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
