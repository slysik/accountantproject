'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LuCheck, LuArrowRight } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import {
  getSubscription,
  trialDaysRemaining,
  isTrialExpired,
  maxUsersForSubscription,
  PLANS,
  type Subscription,
} from '@/lib/subscription';

function planLabel(plan: string) {
  if (plan === 'trial') return 'Free Trial';
  return PLANS[plan as keyof typeof PLANS]?.name ?? plan;
}

function planExpiry(sub: Subscription): string {
  if (sub.plan === 'trial') {
    const d = new Date(sub.trial_ends_at);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (sub.plan_expires_at) {
    const d = new Date(sub.plan_expires_at);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return '—';
}

export default function AccountSettingsPage() {
  const { user, updatePassword } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);

  // Password change state
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (user) getSubscription(user.id).then(setSub);
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (newPw !== confirm) { setPwError('Passwords do not match.'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwLoading(true);
    try {
      await updatePassword(newPw);
      setPwSuccess(true);
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err: unknown) {
      setPwError((err as { message?: string }).message ?? 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const expired = sub ? isTrialExpired(sub) : false;
  const daysLeft = sub?.plan === 'trial' ? trialDaysRemaining(sub) : null;
  const includedUsers = maxUsersForSubscription(sub);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Plan & Billing ─────────────────────────────────── */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Plan &amp; Billing</h2>

        {sub ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
              <div>
                <p className="text-xs text-text-muted">Current plan</p>
                <p className="mt-0.5 font-semibold text-text-primary">{planLabel(sub.plan)}</p>
              </div>
              {sub.plan !== 'trial' && (
                <span className="rounded-full bg-accent-primary/15 px-3 py-1 text-xs font-medium text-accent-primary">
                  Active
                </span>
              )}
              {sub.plan === 'trial' && !expired && (
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                </span>
              )}
              {sub.plan === 'trial' && expired && (
                <span className="rounded-full bg-error/15 px-3 py-1 text-xs font-medium text-error">
                  Expired
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
              <div>
                <p className="text-xs text-text-muted">
                  {sub.plan === 'trial' ? 'Trial expires' : 'Plan expires'}
                </p>
                <p className="mt-0.5 text-sm text-text-primary">{planExpiry(sub)}</p>
              </div>
            </div>

            {sub.plan !== 'trial' && (
              <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
                <div>
                  <p className="text-xs text-text-muted">Included users</p>
                  <p className="mt-0.5 text-sm text-text-primary">
                    {includedUsers} user{includedUsers !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {sub.plan !== 'elite' && (
              <Link
                href="/subscribe"
                className="flex items-center gap-2 self-start rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
              >
                {sub.plan === 'trial' ? 'Choose a plan' : 'Upgrade plan'}
                <LuArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Loading plan info...</p>
        )}
      </section>

      {/* ── Change Password ────────────────────────────────── */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Change Password</h2>
        <p className="mb-5 text-xs text-text-muted">
          Your account email is <span className="text-text-secondary">{user?.email}</span>.
          Enter a new password below to update it.
        </p>

        {pwSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <LuCheck className="h-4 w-4 flex-shrink-0 text-success" />
            <span className="text-sm text-success">Password updated successfully.</span>
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              New password
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading || !newPw || !confirm}
            className="self-start rounded-lg bg-accent-primary px-5 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
