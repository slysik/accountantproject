import { supabase } from './supabase';

export type Plan = 'trial' | 'personal' | 'lite' | 'business' | 'elite' | 'vps';

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: 'active' | 'cancelled';
  trial_ends_at: string;
  plan_starts_at: string | null;
  plan_expires_at: string | null;
  allowed_active_users: number | null;
  created_at: string;
}

export interface PlanDetails {
  name: string;
  price: number; // USD/month
  maxUsers: number;
  maxTransactions: number | null; // null = unlimited
  maxYears: number | null;        // null = unlimited
  features: string[];
}

export const PLANS: Record<Exclude<Plan, 'trial'>, PlanDetails> = {
  personal: {
    name: 'Personal',
    price: 5,
    maxUsers: 1,
    maxTransactions: 500,
    maxYears: null,
    features: [
      'Single user',
      'Up to 500 transactions',
      'Unlimited years',
      'CSV import & export',
      'IRS Schedule C categories',
      'Receipt attachments',
      'Excel & QBO export',
    ],
  },
  lite: {
    name: 'Lite',
    price: 10,
    maxUsers: 1,
    maxTransactions: null,
    maxYears: null,
    features: [
      'Single user',
      'Unlimited transactions',
      'Unlimited years',
      'CSV import & export',
      'IRS Schedule C categories',
      'Receipt attachments',
      'Excel & QBO export',
    ],
  },
  business: {
    name: 'Business',
    price: 25,
    maxUsers: 4,
    maxTransactions: null,
    maxYears: 5,
    features: [
      'Up to 4 users',
      'Unlimited transactions',
      'Up to 5 years of data',
      'CSV import & export',
      'IRS Schedule C categories',
      'Receipt attachments',
      'Excel & QBO export',
      'Priority support',
    ],
  },
  elite: {
    name: 'Elite',
    price: 100,
    maxUsers: 20,
    maxTransactions: null,
    maxYears: null,
    features: [
      'Up to 20 users',
      'Unlimited transactions',
      'Unlimited years',
      'CSV import & export',
      'IRS Schedule C categories',
      'Receipt attachments',
      'Excel & QBO export',
      'Priority support',
      'Dedicated account manager',
    ],
  },
  vps: {
    name: 'Virtual Private Server',
    price: 250,
    maxUsers: 20,
    maxTransactions: null,
    maxYears: null,
    features: [
      'Everything in Elite',
      'Your own secured copy of Accountant\'s Best Friend',
      'Deployment to your own server environment',
      'Isolated infrastructure for your business',
      'Priority support',
      'Dedicated account manager',
    ],
  },
};

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Subscription;
}

export async function createTrialSubscription(userId: string): Promise<Subscription> {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan: 'trial',
      status: 'active',
      trial_ends_at: trialEndsAt.toISOString(),
      plan_expires_at: trialEndsAt.toISOString(),
      allowed_active_users: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Subscription;
}

export async function selectPlan(userId: string, plan: Exclude<Plan, 'trial'>): Promise<void> {
  const planStartsAt = new Date();
  const planExpiresAt = new Date(planStartsAt);
  planExpiresAt.setDate(planExpiresAt.getDate() + 30);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: 'active',
      plan_starts_at: planStartsAt.toISOString(),
      plan_expires_at: planExpiresAt.toISOString(),
      allowed_active_users: PLANS[plan].maxUsers,
    })
    .eq('user_id', userId);
  if (error) throw error;
}

export function isTrialExpired(sub: Subscription): boolean {
  if (sub.plan !== 'trial') return false;
  return new Date() > new Date(sub.trial_ends_at);
}

export function isAccessAllowed(sub: Subscription): boolean {
  if (sub.status !== 'active') return false;
  if (isTrialExpired(sub)) return false;
  return true;
}

export function trialDaysRemaining(sub: Subscription): number {
  const diff = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function maxUsersForSubscription(sub: Subscription | null): number {
  if (!sub) return 1;
  if (sub.plan === 'trial') return 1;
  if (typeof sub.allowed_active_users === 'number' && Number.isFinite(sub.allowed_active_users)) {
    return sub.allowed_active_users;
  }
  return PLANS[sub.plan].maxUsers;
}

// ── Team / account members ────────────────────────────────────────────────

export type TeamRole = 'admin' | 'contributor' | 'viewer';

export interface AccountMember {
  id: string;
  owner_user_id: string;
  member_email: string;
  member_user_id: string | null;
  created_at: string;
  invited_at: string;
  invite_token: string | null;
  invite_token_used_at: string | null;
  role: TeamRole;
}

/** Returns members the current user (as owner) has added. */
export async function getAccountMembers(ownerUserId: string): Promise<AccountMember[]> {
  const { data, error } = await supabase
    .from('account_members')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AccountMember[];
}

/** Adds a member by email and sends them an invitation email. */
export async function addAccountMember(
  ownerUserId: string,
  email: string,
  ownerEmail?: string,
  role: TeamRole = 'contributor',
): Promise<AccountMember> {
  const sub = await getSubscription(ownerUserId);
  const maxUsers = maxUsersForSubscription(sub);

  if (!sub || sub.plan === 'trial' || sub.plan === 'personal' || sub.plan === 'lite') {
    throw new Error('Your current plan does not include team members.');
  }

  const members = await getAccountMembers(ownerUserId);
  if (members.length + 1 >= maxUsers) {
    throw new Error(`You have reached the ${maxUsers}-user limit for your plan.`);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('account_members')
    .insert({
      owner_user_id: ownerUserId,
      member_email: email.toLowerCase().trim(),
      invited_at: now,
      role,
    })
    .select()
    .single();
  if (error) throw error;

  // Fire invite email (non-blocking — member is added regardless)
  try {
    await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberEmail: email.toLowerCase().trim(), ownerEmail: ownerEmail ?? '' }),
    });
  } catch {
    // ignore email errors
  }

  return data as AccountMember;
}

/** Removes a member by their record id. */
export async function removeAccountMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('account_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}

/** Updates the role of a team member. */
export async function updateMemberRole(memberId: string, role: TeamRole): Promise<void> {
  const { error } = await supabase
    .from('account_members')
    .update({ role })
    .eq('id', memberId);
  if (error) throw error;
}

/** Returns the current user's role within an owner's account, or null if not a member. */
export async function getMyTeamRole(memberEmail: string): Promise<TeamRole | null> {
  const { data, error } = await supabase
    .from('account_members')
    .select('role, member_user_id')
    .eq('member_email', memberEmail.toLowerCase().trim())
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.role as TeamRole;
}

const INVITE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

async function listOwnerAccountUserIds(memberEmail: string): Promise<string[]> {
  const normalizedEmail = memberEmail.toLowerCase().trim();

  const { data, error } = await supabase
    .from('account_members')
    .select('owner_user_id, member_user_id, invited_at, created_at')
    .eq('member_email', normalizedEmail)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const now = Date.now();
  const seen = new Set<string>();
  const ownerIds: string[] = [];

  for (const row of data) {
    const ownerUserId = row.owner_user_id as string | null;
    if (!ownerUserId || seen.has(ownerUserId)) continue;

    // Already enrolled — always allowed
    if (row.member_user_id) {
      seen.add(ownerUserId);
      ownerIds.push(ownerUserId);
      continue;
    }

    // Not yet enrolled — only allow within the 24-hour invite window
    const invitedAt = new Date(row.invited_at ?? row.created_at).getTime();
    if (now - invitedAt <= INVITE_EXPIRY_MS) {
      seen.add(ownerUserId);
      ownerIds.push(ownerUserId);
    }
  }

  return ownerIds;
}

/**
 * Checks if the current user is a member of another active account.
 * Used by AuthGuard to grant access to invited users who have no subscription of their own.
 */
export async function findOwnerSubscription(memberEmail: string): Promise<Subscription | null> {
  const ownerUserIds = await listOwnerAccountUserIds(memberEmail);
  if (ownerUserIds.length === 0) return null;

  let fallback: Subscription | null = null;

  for (const ownerUserId of ownerUserIds) {
    const sub = await getSubscription(ownerUserId);
    if (!sub) continue;
    if (sub.status === 'active') return sub;
    if (!fallback) fallback = sub;
  }

  return fallback;
}

export async function findOwnerAccountUserId(memberEmail: string): Promise<string | null> {
  const ownerUserIds = await listOwnerAccountUserIds(memberEmail);
  if (ownerUserIds.length === 0) return null;

  for (const ownerUserId of ownerUserIds) {
    const sub = await getSubscription(ownerUserId);
    if (sub?.status === 'active') return ownerUserId;
  }

  return ownerUserIds[0] ?? null;
}
