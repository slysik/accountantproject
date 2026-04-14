'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuBuilding2, LuShield, LuTriangle, LuUsers, LuKeyRound, LuX } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { isMasterAdminEmail } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

type AdminAccountState = {
  user_id: string;
  email: string;
  account_name: string | null;
  first_name: string | null;
  business_name: string | null;
  contact_email: string | null;
  phone: string | null;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
  account_created_at: string;
  last_sign_in_at: string | null;
  company_count: number;
  active_team_members: number;
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type PasswordModal = { userId: string; email: string } | null;

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AdminAccountState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password change modal state
  const [pwModal, setPwModal] = useState<PasswordModal>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const isAdmin = isMasterAdminEmail(user?.email);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/accounts')
      .then(async (res) => {
        const payload = (await res.json()) as { accounts?: AdminAccountState[]; error?: string };
        if (!res.ok) {
          throw new Error(payload.error ?? 'Failed to load admin account data.');
        }
        setAccounts(payload.accounts ?? []);
      })
      .catch((err: unknown) => {
        setError((err as { message?: string }).message ?? 'Failed to load admin account data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAdmin]);

  const summary = useMemo(() => {
    const planCounts = accounts.reduce<Record<string, number>>((acc, account) => {
      acc[account.plan] = (acc[account.plan] ?? 0) + 1;
      return acc;
    }, {});

    return {
      accountCount: accounts.length,
      totalCompanies: accounts.reduce((sum, account) => sum + account.company_count, 0),
      totalTeamMembers: accounts.reduce((sum, account) => sum + account.active_team_members, 0),
      planCounts,
    };
  }, [accounts]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwModal) return;
    setPwError(''); setPwSuccess('');
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    setPwLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: pwModal.userId, newPassword }),
      });
      const payload = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Failed to update password.');
      setPwSuccess('Password updated successfully.');
      setNewPassword('');
    } catch (err: unknown) {
      setPwError((err as { message?: string }).message ?? 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-error/10 p-2 text-error">
            <LuTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Admin Access Required</h2>
            <p className="mt-2 text-sm text-text-muted">
              This page is reserved for the mapped site administrator account.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-accent-primary/10 p-3 text-accent-primary">
            <LuShield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Site Administration</h1>
            <p className="text-sm text-text-muted">
              Master workspace overview for active customer workspaces.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Active Workspaces</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.accountCount}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Companies Tracked</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.totalCompanies}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Team Seats In Use</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.totalTeamMembers}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Plan Mix</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.planCounts).map(([plan, count]) => (
            <div
              key={plan}
              className="rounded-full border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary"
            >
              {plan}: {count}
            </div>
          ))}
          {Object.keys(summary.planCounts).length === 0 && (
            <p className="text-sm text-text-muted">No active account data yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Active Account States</h2>

        {loading ? (
          <p className="text-sm text-text-muted">Loading account states...</p>
        ) : error ? (
          <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-text-muted">No active accounts found.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <article
                key={account.user_id}
                className="rounded-2xl border border-border-primary bg-bg-tertiary/60 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {account.business_name || account.account_name || account.first_name || account.email}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">{account.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent-primary/10 px-2.5 py-1 text-[11px] font-medium text-accent-primary">
                        {account.plan}
                      </span>
                      <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                        {account.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2 lg:min-w-[22rem]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">Created</p>
                      <p>{formatDate(account.account_created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">Last Sign In</p>
                      <p>{formatDateTime(account.last_sign_in_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">Plan Expires</p>
                      <p>{formatDate(account.plan_expires_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">Trial Ends</p>
                      <p>{formatDate(account.trial_ends_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-border-primary bg-bg-secondary px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 text-xs text-text-muted">
                      <LuBuilding2 className="h-3.5 w-3.5 text-accent-primary" />
                      Companies
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{account.company_count}</p>
                  </div>
                  <div className="rounded-xl border border-border-primary bg-bg-secondary px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 text-xs text-text-muted">
                      <LuUsers className="h-3.5 w-3.5 text-accent-primary" />
                      Team Members
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{account.active_team_members}</p>
                  </div>
                  <div className="rounded-xl border border-border-primary bg-bg-secondary px-4 py-3">
                    <p className="mb-1 text-xs text-text-muted">Contact Email</p>
                    <p className="truncate text-sm font-medium text-text-primary">
                      {account.contact_email || '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border-primary bg-bg-secondary px-4 py-3">
                    <p className="mb-1 text-xs text-text-muted">Phone</p>
                    <p className="truncate text-sm font-medium text-text-primary">
                      {account.phone || '—'}
                    </p>
                  </div>
                </div>

                {/* Admin actions */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => { setPwModal({ userId: account.user_id, email: account.email }); setPwError(''); setPwSuccess(''); setNewPassword(''); }}
                    className="flex items-center gap-1.5 rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-accent-primary"
                  >
                    <LuKeyRound className="h-3.5 w-3.5" />
                    Change Password
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Password Change Modal ─────────────────────────────── */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-primary bg-bg-secondary p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Change Password</h2>
                <p className="mt-1 text-xs text-text-muted">{pwModal.email}</p>
              </div>
              <button
                onClick={() => setPwModal(null)}
                className="rounded p-1 text-text-muted transition-colors hover:text-text-primary"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            {pwSuccess ? (
              <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                {pwSuccess}
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                    autoFocus
                    className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                  />
                </div>
                {pwError && <p className="text-sm text-error">{pwError}</p>}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={pwLoading || newPassword.length < 6}
                    className="flex-1 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwModal(null)}
                    className="rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!pwSuccess && (
              <p className="mt-4 text-xs text-text-muted">
                Requires <code className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in server environment.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
