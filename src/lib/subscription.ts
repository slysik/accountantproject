import { supabase } from './supabase';

export type Plan = 'trial' | 'lite' | 'business' | 'elite';

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: 'active' | 'cancelled';
  trial_ends_at: string;
  plan_starts_at: string | null;
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
  lite: {
    name: 'Lite',
    price: 10,
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
    })
    .select()
    .single();

  if (error) throw error;
  return data as Subscription;
}

export async function selectPlan(userId: string, plan: Exclude<Plan, 'trial'>): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: 'active',
      plan_starts_at: new Date().toISOString(),
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
  return PLANS[sub.plan].maxUsers;
}

// ── Team / account members ────────────────────────────────────────────────

export interface AccountMember {
  id: string;
  owner_user_id: string;
  member_email: string;
  member_user_id: string | null;
  created_at: string;
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

/** Adds a member by email. Attempts to resolve their user_id if they exist. */
export async function addAccountMember(ownerUserId: string, email: string): Promise<AccountMember> {
  const sub = await getSubscription(ownerUserId);
  const maxUsers = maxUsersForSubscription(sub);

  if (!sub || sub.plan === 'trial') {
    throw new Error('Your current plan does not include team members.');
  }

  const members = await getAccountMembers(ownerUserId);
  if (members.length + 1 >= maxUsers) {
    throw new Error(`You have reached the ${maxUsers}-user limit for your plan.`);
  }

  const { data, error } = await supabase
    .from('account_members')
    .insert({ owner_user_id: ownerUserId, member_email: email.toLowerCase().trim() })
    .select()
    .single();
  if (error) throw error;
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

/**
 * Checks if the current user is a member of another active account.
 * Used by AuthGuard to grant access to invited users who have no subscription of their own.
 */
export async function findOwnerSubscription(memberEmail: string): Promise<Subscription | null> {
  // Find the membership record where the member's email matches
  const { data: membership, error } = await supabase
    .from('account_members')
    .select('owner_user_id')
    .eq('member_email', memberEmail.toLowerCase())
    .maybeSingle();

  if (error) return null;

  if (!membership) return null;

  // Fetch the owner's subscription
  return getSubscription(membership.owner_user_id);
}
