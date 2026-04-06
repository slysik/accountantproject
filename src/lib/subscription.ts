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
