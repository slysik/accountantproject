'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuUsers, LuPlus, LuTrash2, LuCheck, LuInfo, LuRefreshCw } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import {
  getSubscription,
  getAccountMembers,
  addAccountMember,
  removeAccountMember,
  updateMemberRole,
  maxUsersForSubscription,
  type AccountMember,
  type Subscription,
  type TeamRole,
} from '@/lib/subscription';

const INVITE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function enrollmentStatus(m: AccountMember): 'enrolled' | 'pending' | 'expired' {
  if (m.member_user_id) return 'enrolled';
  const invitedAt = new Date(m.invited_at ?? m.created_at).getTime();
  return Date.now() - invitedAt <= INVITE_EXPIRY_MS ? 'pending' : 'expired';
}

function formatInvitedAt(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: 'Admin',
  contributor: 'Contributor',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<TeamRole, string> = {
  admin: 'bg-accent-primary/10 text-accent-primary',
  contributor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  viewer: 'bg-bg-tertiary text-text-muted',
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin: 'Full access — can add/edit companies, expenses, and manage team members.',
  contributor: 'Can add and edit companies and expenses. Cannot manage team or billing.',
  viewer: 'Read-only access to companies and expenses. No modifications.',
};

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<TeamRole>('contributor');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
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
  const totalUsers = members.length + 1;
  const canAddMore = totalUsers < maxUsers;
  const planBlocked = sub?.plan === 'trial' || sub?.plan === 'personal' || sub?.plan === 'lite';

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
      await addAccountMember(user.id, trimmed, user.email, newRole);
      setEmail('');
      setNewRole('contributor');
      setSuccess(`Invitation sent to ${trimmed} as ${ROLE_LABELS[newRole]}.`);
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

  const handleRoleChange = async (member: AccountMember, role: TeamRole) => {
    setError(''); setSuccess('');
    setUpdatingRole(member.id);
    try {
      await updateMemberRole(member.id, role);
      setSuccess(`${member.member_email} is now ${ROLE_LABELS[role]}.`);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to update role.');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleResend = async (member: AccountMember) => {
    setError(''); setSuccess('');
    setResending(member.id);
    try {
      const { error: updateErr } = await import('@/lib/supabase').then(({ supabase }) =>
        supabase
          .from('account_members')
          .update({ invited_at: new Date().toISOString() })
          .eq('id', member.id)
      );
      if (updateErr) throw updateErr;

      await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberEmail: member.member_email,
          ownerEmail: user?.email ?? '',
          inviteToken: member.invite_token,
        }),
      });
      setSuccess(`Invitation resent to ${member.member_email}.`);
      await refresh();
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to resend invitation.');
    } finally {
      setResending(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Role legend ──────────────────────────────────────── */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Team Roles</h2>
        <div className="flex flex-col gap-2">
          {(Object.keys(ROLE_LABELS) as TeamRole[]).map((role) => (
            <div key={role} className="flex items-start gap-3">
              <span className={`mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
              <p className="text-xs text-text-muted">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </section>

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

        {planBlocked && (
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
            {members.map((m) => {
              const status = enrollmentStatus(m);
              return (
                <div
                  key={m.id}
                  className="mb-2 rounded-lg bg-bg-tertiary px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{m.member_email}</p>
                      <p className="text-xs text-text-muted">
                        Invited {formatInvitedAt(m.invited_at ?? m.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2">
                      {/* Enrollment status */}
                      {status === 'enrolled' && (
                        <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          Enrolled
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          Pending
                        </span>
                      )}
                      {status === 'expired' && (
                        <>
                          <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
                            Expired
                          </span>
                          <button
                            onClick={() => handleResend(m)}
                            disabled={resending === m.id}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-accent-primary transition-colors hover:bg-accent-primary/10 disabled:opacity-50"
                          >
                            <LuRefreshCw className="h-3 w-3" />
                            {resending === m.id ? 'Sending...' : 'Resend'}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleRemove(m)}
                        disabled={removing === m.id}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-error transition-colors hover:bg-error/10 disabled:opacity-50"
                      >
                        <LuTrash2 className="h-3.5 w-3.5" />
                        {removing === m.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-text-muted">Role:</span>
                    {(['admin', 'contributor', 'viewer'] as TeamRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => m.role !== role && handleRoleChange(m, role)}
                        disabled={updatingRole === m.id}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          m.role === role
                            ? ROLE_COLORS[role]
                            : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary disabled:opacity-50'
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <p className="mt-2 text-xs text-text-muted">No team members yet. Add someone below.</p>
            )}
          </>
        )}
      </section>

      {/* ── Add member ────────────────────────────────────────── */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Add Team Member</h2>
        <p className="mb-5 text-xs text-text-muted">
          Enter their email and choose a role. They&apos;ll receive an invitation link valid for 1 hour.
        </p>

        {!canAddMore && !planBlocked && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            You&apos;ve reached the user limit for your plan ({maxUsers} users). Upgrade to add more.
          </div>
        )}

        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              disabled={!canAddMore || planBlocked}
              className="flex-1 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as TeamRole)}
              disabled={!canAddMore || planBlocked}
              className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary disabled:opacity-50"
            >
              <option value="contributor">Contributor</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={adding || !email.trim() || !canAddMore || planBlocked}
              className="flex items-center gap-1.5 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              <LuPlus className="h-4 w-4" />
              {adding ? 'Sending...' : 'Invite'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
