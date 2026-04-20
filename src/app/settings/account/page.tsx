'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LuCheck, LuArrowRight, LuCopy } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  EMPTY_ACCOUNT_PROFILE,
  getAccountProfile,
  saveAccountProfile,
  type AccountProfile,
} from '@/lib/account-profile';
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
  const [accountId, setAccountId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<AccountProfile>(EMPTY_ACCOUNT_PROFILE);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password change state
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (user) getSubscription(user.id).then(setSub);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.account_id) setAccountId(data.account_id as string);
      });
  }, [user]);

  const handleCopyId = () => {
    if (!accountId) return;
    void navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!user) {
      setProfile(EMPTY_ACCOUNT_PROFILE);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    getAccountProfile(user.id)
      .then((data) => {
        setProfile(data);
      })
      .catch((err: unknown) => {
        setProfileError((err as { message?: string }).message ?? 'Failed to load account details.');
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [user]);

  const updateProfileField = (field: keyof AccountProfile, value: string) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileError('');
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      const savedProfile = await saveAccountProfile({
        ...profile,
        user_id: user.id,
      });
      setProfile(savedProfile);
      setProfileSuccess(true);
    } catch (err: unknown) {
      setProfileError((err as { message?: string }).message ?? 'Failed to save account details.');
    } finally {
      setProfileSaving(false);
    }
  };

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
      setNewPw(''); setConfirm('');
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
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Spend Details</h2>
        <p className="mb-5 text-xs text-text-muted">
          Store your business and contact information here so your spend details stay organized in one place.
        </p>

        {profileSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <LuCheck className="h-4 w-4 flex-shrink-0 text-success" />
            <span className="text-sm text-success">Spend details saved successfully.</span>
          </div>
        )}
        {profileError && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {profileError}
          </div>
        )}

        {profileLoading ? (
          <p className="text-sm text-text-muted">Loading account details...</p>
        ) : (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Account name
                </label>
                <input
                  type="text"
                  value={profile.account_name}
                  onChange={(e) => updateProfileField('account_name', e.target.value)}
                  placeholder="Primary account name"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Business name
                </label>
                <input
                  type="text"
                  value={profile.business_name}
                  onChange={(e) => updateProfileField('business_name', e.target.value)}
                  placeholder="Legal or trading business name"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  First name
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => updateProfileField('first_name', e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Last name
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => updateProfileField('last_name', e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Contact email
                </label>
                <input
                  type="email"
                  value={profile.contact_email}
                  onChange={(e) => updateProfileField('contact_email', e.target.value)}
                  placeholder={user?.email ?? 'contact@business.com'}
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => updateProfileField('phone', e.target.value)}
                  placeholder="Business or primary phone"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Website
                </label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => updateProfileField('website', e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Address line 1
                </label>
                <input
                  type="text"
                  value={profile.address_line_1}
                  onChange={(e) => updateProfileField('address_line_1', e.target.value)}
                  placeholder="Street address"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Address line 2
                </label>
                <input
                  type="text"
                  value={profile.address_line_2}
                  onChange={(e) => updateProfileField('address_line_2', e.target.value)}
                  placeholder="Suite, unit, or apartment"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  City
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => updateProfileField('city', e.target.value)}
                  placeholder="City"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  State / region
                </label>
                <input
                  type="text"
                  value={profile.state_region}
                  onChange={(e) => updateProfileField('state_region', e.target.value)}
                  placeholder="State or region"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Postal code
                </label>
                <input
                  type="text"
                  value={profile.postal_code}
                  onChange={(e) => updateProfileField('postal_code', e.target.value)}
                  placeholder="ZIP or postal code"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Country
                </label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => updateProfileField('country', e.target.value)}
                  placeholder="Country"
                  className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="self-start rounded-lg bg-accent-primary px-5 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save Spend Details'}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Account Summary Wizard</h2>
        <p className="mb-5 text-xs text-text-muted">
          For existing companies, reopen the guided setup flow directly at the follow-up steps you want to revisit.
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <Link
            href="/setup?start=1"
            className="rounded-xl border border-border-primary bg-bg-tertiary px-4 py-4 transition-colors hover:border-accent-primary hover:bg-accent-primary/5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Step 2</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Banking Details</p>
                <p className="mt-1 text-xs text-text-muted">Review saved bank and card labels.</p>
              </div>
              <LuArrowRight className="h-4 w-4 flex-shrink-0 text-accent-primary" />
            </div>
          </Link>

          <Link
            href="/setup?start=2"
            className="rounded-xl border border-border-primary bg-bg-tertiary px-4 py-4 transition-colors hover:border-accent-primary hover:bg-accent-primary/5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Step 3</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Expense Import</p>
                <p className="mt-1 text-xs text-text-muted">Jump back into the expense import flow.</p>
              </div>
              <LuArrowRight className="h-4 w-4 flex-shrink-0 text-accent-primary" />
            </div>
          </Link>

          <Link
            href="/setup?start=3"
            className="rounded-xl border border-border-primary bg-bg-tertiary px-4 py-4 transition-colors hover:border-accent-primary hover:bg-accent-primary/5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Step 4</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Sales Import</p>
                <p className="mt-1 text-xs text-text-muted">Open the optional income and sales step.</p>
              </div>
              <LuArrowRight className="h-4 w-4 flex-shrink-0 text-accent-primary" />
            </div>
          </Link>
        </div>
      </section>

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

            <div className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
              <div>
                <p className="text-xs text-text-muted">Account (Tenant) ID</p>
                <p className="mt-0.5 font-mono text-xs text-text-primary">{accountId ?? '—'}</p>
              </div>
              {accountId && (
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 rounded-lg border border-border-primary bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent-primary hover:text-accent-primary"
                >
                  <LuCopy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {!['elite', 'vps'].includes(sub.plan) && (
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
