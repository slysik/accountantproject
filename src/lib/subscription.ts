import { supabase } from './supabase';

export type Plan = 'trial' | 'individual' | 'business' | 'elite' | 'vps';

export interface Subscription {
  id: string;
  user_id: string;
  account_id?: string;
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
  individual: {
    name: 'Individual',
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
    maxYears: null,
    features: [
      'Up to 4 users',
      'Unlimited transactions',
      'Unlimited years',
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

export async function getSubscription(userId: string, accountId?: string): Promise<Subscription | null> {
  if (accountId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();
    if (!error && data) return data as Subscription;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Subscription;
}

export async function createTrialSubscription(userId: string, accountId?: string): Promise<Subscription> {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    plan: 'trial',
    status: 'active',
    trial_ends_at: trialEndsAt.toISOString(),
    plan_expires_at: trialEndsAt.toISOString(),
    allowed_active_users: accountId ? 4 : 1,
  };
  if (accountId) insertPayload.account_id = accountId;

  let { data, error } = await supabase
    .from('subscriptions')
    .insert(insertPayload)
    .select()
    .single();

  // If account_id column doesn't exist yet (pre-migration), retry without it
  if (error && accountId) {
    delete insertPayload.account_id;
    ({ data, error } = await supabase
      .from('subscriptions')
      .insert(insertPayload)
      .select()
      .single());
  }

  if (error) throw error;
  return data as Subscription;
}

export async function selectPlan(userId: string, plan: Exclude<Plan, 'trial'>, accountId?: string): Promise<void> {
  const planStartsAt = new Date();
  const planExpiresAt = new Date(planStartsAt);
  planExpiresAt.setDate(planExpiresAt.getDate() + 30);

  const updatePayload = {
    plan,
    status: 'active',
    plan_starts_at: planStartsAt.toISOString(),
    plan_expires_at: planExpiresAt.toISOString(),
    allowed_active_users: PLANS[plan].maxUsers,
  };

  if (accountId) {
    const { error } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('account_id', accountId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('subscriptions')
      .update(updatePayload)
      .eq('user_id', userId);
    if (error) throw error;
  }
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
export type AccessScope = 'all' | 'selected';

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
  access_scope: AccessScope;
}

export interface AccountMemberCompanyAccess {
  member_id: string;
  company_name: string;
}

/** Returns members the current user (as owner) has added. */
export async function getAccountMembers(ownerUserId: string, accountId?: string): Promise<AccountMember[]> {
  let query = supabase
    .from('account_members')
    .select('*')
    .order('created_at', { ascending: true });

  if (accountId) {
    query = query.eq('account_id', accountId);
  } else {
    query = query.eq('owner_user_id', ownerUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AccountMember[];
}

/** Adds a member by email and sends them an invitation email. */
export async function addAccountMember(
  ownerUserId: string,
  email: string,
  ownerEmail?: string,
  role: TeamRole = 'contributor',
  accountId?: string,
): Promise<AccountMember> {
  const sub = await getSubscription(ownerUserId, accountId);
  const maxUsers = maxUsersForSubscription(sub);

  if (!sub || sub.plan === 'trial' || sub.plan === 'individual') {
    throw new Error('Your current plan does not include team members.');
  }

  const members = await getAccountMembers(ownerUserId, accountId);
  if (members.length + 1 >= maxUsers) {
    throw new Error(`You have reached the ${maxUsers}-user limit for your plan.`);
  }

  const now = new Date().toISOString();
  const insertPayload: Record<string, unknown> = {
    owner_user_id: ownerUserId,
    member_email: email.toLowerCase().trim(),
    invited_at: now,
    role,
  };
  if (accountId) insertPayload.account_id = accountId;

  const { data, error } = await supabase
    .from('account_members')
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;

  // Fire invite email (non-blocking — member is added regardless)
  try {
    await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberEmail: email.toLowerCase().trim(),
        ownerEmail: ownerEmail ?? '',
        inviteToken: (data as AccountMember).invite_token,
      }),
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

export async function updateMemberAccessScope(memberId: string, accessScope: AccessScope): Promise<void> {
  const { error } = await supabase
    .from('account_members')
    .update({ access_scope: accessScope })
    .eq('id', memberId);
  if (error) throw error;
}

export async function getAccountMemberCompanyAccess(ownerUserId: string): Promise<AccountMemberCompanyAccess[]> {
  const { data, error } = await supabase
    .from('account_member_companies')
    .select('member_id, company_name')
    .eq('owner_user_id', ownerUserId)
    .order('company_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as AccountMemberCompanyAccess[];
}

export async function replaceMemberCompanyAccess(
  ownerUserId: string,
  memberId: string,
  companyNames: string[]
): Promise<void> {
  const normalizedNames = Array.from(
    new Set(
      companyNames
        .map((name) => name.trim())
        .filter(Boolean)
    )
  );

  const { error: deleteError } = await supabase
    .from('account_member_companies')
    .delete()
    .eq('owner_user_id', ownerUserId)
    .eq('member_id', memberId);
  if (deleteError) throw deleteError;

  if (normalizedNames.length === 0) return;

  const { error: insertError } = await supabase
    .from('account_member_companies')
    .insert(
      normalizedNames.map((companyName) => ({
        owner_user_id: ownerUserId,
        member_id: memberId,
        company_name: companyName,
      }))
    );
  if (insertError) throw insertError;
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

/**
 * Checks if the current user is a member of another active account.
 * Used by AuthGuard to grant access to invited users who have no subscription of their own.
 * Uses account_users table for multi-tenant lookup.
 */
export async function findOwnerSubscription(userId: string): Promise<Subscription | null> {
  // Try account_users first (post-migration path)
  const { data: accountUsers, error } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!error && accountUsers && accountUsers.length > 0) {
    let fallback: Subscription | null = null;

    for (const au of accountUsers) {
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('account_id', au.account_id)
        .maybeSingle();

      if (subError || !sub) continue;
      if ((sub as Subscription).status === 'active') return sub as Subscription;
      if (!fallback) fallback = sub as Subscription;
    }

    if (fallback) return fallback;
  }

  // Fallback: check account_members by email (pre-migration or pending members)
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return null;

  const { data: membership, error: memberError } = await supabase
    .from('account_members')
    .select('owner_user_id')
    .eq('member_email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle();

  if (memberError || !membership) return null;

  const { data: ownerSub, error: ownerSubError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', membership.owner_user_id as string)
    .maybeSingle();

  if (ownerSubError || !ownerSub) return null;
  return ownerSub as Subscription;
}

/**
 * Finds the owner user_id for the account the given user belongs to.
 * Uses account_users table for multi-tenant lookup.
 */
export async function findOwnerAccountUserId(userId: string): Promise<string | null> {
  // Try account_users first (post-migration path)
  const { data: accountUsers, error } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!error && accountUsers && accountUsers.length > 0) {
    for (const au of accountUsers) {
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, status')
        .eq('account_id', au.account_id)
        .maybeSingle();

      if (subError || !sub) continue;
      if (sub.status === 'active') return sub.user_id as string;
    }

    // Fallback: look up the account creator
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('created_by_user_id')
      .eq('id', accountUsers[0].account_id)
      .single();

    if (!accountError && account) return account.created_by_user_id as string;
  }

  // Fallback: check account_members by email (pre-migration or pending members)
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email;
  if (!email) return null;

  const { data: membership, error: memberError } = await supabase
    .from('account_members')
    .select('owner_user_id')
    .eq('member_email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle();

  if (memberError || !membership) return null;
  return membership.owner_user_id as string;
}
