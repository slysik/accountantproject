'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuUsers, LuPlus, LuTrash2, LuCheck, LuInfo } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import {
  getSubscription,
  getAccountMembers,
  addAccountMember,
  removeAccountMember,
  maxUsersForSubscription,
  type AccountMember,
  type Subscription,
} from '@/lib/subscription';

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        getSubscription(user.id),
        getAccountMembers(user.id),
      ]);
      setSub(s);
      setMembers(m);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const maxUsers = maxUsersForSubscription(sub);
  // +1 because the owner themselves counts as a user
  const totalUsers = members.length + 1;
  const canAddMore = totalUsers < maxUsers;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !user) return;
    if (trimmed === user.email?.toLowerCase()) {
      setError('You cannot add yourself as a team member.');
      return;
    }
    if (members.some((m) => m.member_email === trimmed)) {
      setError('This person is already on your team.');
      return;
    }
    setAdding(true);
    try {
      await addAccountMember(user.id, trimmed);
      setEmail('');
      setSuccess(`${trimmed} has been added to your team.`);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to add member.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (member: AccountMember) => {
    setError(''); setSuccess('');
    setRemoving(member.id);
    try {
      await removeAccountMember(member.id);
      setSuccess(`${member.member_email} has been removed.`);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to remove member.');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Current team ─────────────────────────────────────── */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuUsers className="h-4 w-4 text-accent-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Team Members</h2>
          </div>
          <span className="text-xs text-text-muted">
            {totalUsers} / {maxUsers === Infinity ? '∞' : maxUsers} user{maxUsers !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Plan-limit notice */}
        {(sub?.plan === 'trial' || sub?.plan === 'lite') && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent-primary/30 bg-accent-primary/10 px-3 py-2.5 text-xs text-text-secondary">
            <LuInfo className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-primary" />
            Team members are available on Business ($25/mo) and Elite ($100/mo) plans.
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <LuCheck className="h-4 w-4 flex-shrink-0 text-success" />
            <span className="text-sm text-success">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : (
          <>
            {/* Owner row */}
            <div className="mb-2 flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                <p className="text-xs text-text-muted">Account owner</p>
              </div>
              <span className="rounded-full bg-accent-primary/15 px-2.5 py-0.5 text-xs font-medium text-accent-primary">
                Owner
              </span>
            </div>

            {/* Member rows */}
            {members.map((m) => (
              <div
                key={m.id}
                className="mb-2 flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{m.member_email}</p>
                  <p className="text-xs text-text-muted">
                    Added {new Date(m.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(m)}
                  disabled={removing === m.id}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                  {removing === m.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}

            {members.length === 0 && (
              <p className="mt-2 text-xs text-text-muted">
                No team members yet. Add someone below.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── Add member ────────────────────────────────────────── */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Add Team Member</h2>
        <p className="mb-5 text-xs text-text-muted">
          Enter the email address of the person you want to add. They can sign in (or create an
          account) with that email to access the dashboard.
        </p>

        {!canAddMore && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            You&apos;ve reached the user limit for your plan ({maxUsers} user{maxUsers !== 1 ? 's' : ''}).
            Upgrade to add more team members.
          </div>
        )}

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            disabled={!canAddMore || sub?.plan === 'trial'}
            className="flex-1 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={adding || !email.trim() || !canAddMore || sub?.plan === 'trial'}
            className="flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            <LuPlus className="h-4 w-4" />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </form>
      </section>
    </div>
  );
}
