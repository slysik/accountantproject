import { supabase } from './supabase';
import { fuzzyCompanyMatch } from './fuzzy-match';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Domains that should never be used for tenant domain matching. */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
]);

/** Extract the domain portion of an email address. */
export function extractEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

/**
 * Try to find an existing tenant (account) that matches the given company name
 * and email domain.
 *
 * Matching strategy:
 * 1. If the email domain is NOT a free provider, look for accounts with a
 *    matching domain first and fuzzy-match the company name among those.
 * 2. If no domain match (or free email), fuzzy-match against all accounts.
 */
export async function findMatchingTenant(
  companyName: string,
  emailDomain: string
): Promise<{ accountId: string; accountName: string } | null> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, domain');

  if (error || !accounts || accounts.length === 0) return null;

  const isFreeEmail = FREE_EMAIL_DOMAINS.has(emailDomain.toLowerCase());

  // Try domain-matched accounts first (non-free emails only)
  if (!isFreeEmail) {
    const domainMatches = accounts.filter(
      (a: { domain?: string }) =>
        a.domain?.toLowerCase() === emailDomain.toLowerCase()
    );

    if (domainMatches.length > 0) {
      const names = domainMatches.map((a: { name: string }) => a.name);
      const matched = fuzzyCompanyMatch(companyName, names);
      if (matched) {
        const account = domainMatches.find(
          (a: { name: string }) => a.name === matched
        )!;
        return { accountId: account.id, accountName: account.name };
      }
    }
  }

  // Fall back to fuzzy match across all accounts
  const allNames = accounts.map((a: { name: string }) => a.name);
  const matched = fuzzyCompanyMatch(companyName, allNames);
  if (matched) {
    const account = accounts.find(
      (a: { name: string }) => a.name === matched
    )!;
    return { accountId: account.id, accountName: account.name };
  }

  return null;
}

/**
 * Create a brand-new tenant (account) with the signing-up user as owner.
 * Also provisions a Business trial subscription.
 *
 * @returns The new account_id.
 */
export async function createTenant(params: {
  companyName: string;
  emailDomain: string;
  userId: string;
  firstName: string;
  lastName: string;
  client?: SupabaseClient;
}): Promise<string> {
  const { companyName, emailDomain, userId, firstName, lastName, client } = params;
  const db = client ?? supabase;

  // 1. Create the account
  const { data: account, error: accountError } = await db
    .from('accounts')
    .insert({
      name: companyName,
      domain: emailDomain,
      created_by_user_id: userId,
    })
    .select('id')
    .single();

  if (accountError || !account) {
    throw new Error(
      `Failed to create account: ${accountError?.message ?? 'unknown error'}`
    );
  }

  const accountId: string = account.id;

  // 2. Link user as owner
  const { error: linkError } = await db
    .from('account_users')
    .insert({
      account_id: accountId,
      user_id: userId,
      role: 'owner',
      status: 'active',
    });

  if (linkError) {
    throw new Error(`Failed to link user to account: ${linkError.message}`);
  }

  // 3. Create account profile
  const { error: profileError } = await db
    .from('account_profiles')
    .insert({
      user_id: userId,
      account_name: companyName,
      first_name: firstName,
      last_name: lastName,
      business_name: companyName,
    });

  if (profileError) {
    throw new Error(`Failed to create account profile: ${profileError.message}`);
  }

  // 4. Provision Business trial subscription (30 days)
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { error: subError } = await db
    .from('subscriptions')
    .insert({
      user_id: userId,
      account_id: accountId,
      plan: 'trial',
      status: 'active',
      trial_ends_at: trialEnd.toISOString(),
      plan_expires_at: trialEnd.toISOString(),
      allowed_active_users: 4,
    });

  if (subError) {
    throw new Error(`Failed to create subscription: ${subError.message}`);
  }

  // 5. Create a company entry so it appears in the sidebar
  let { error: companyError } = await db
    .from('companies')
    .upsert(
      { user_id: userId, name: companyName, account_id: accountId, deleted_at: null },
      { onConflict: 'user_id,name' }
    );

  // Retry without account_id if column doesn't exist yet (pre-migration)
  if (companyError) {
    console.error('Company create attempt 1 failed:', companyError.message);
    ({ error: companyError } = await db
      .from('companies')
      .upsert(
        { user_id: userId, name: companyName, deleted_at: null },
        { onConflict: 'user_id,name' }
      ));
    if (companyError) {
      console.error('Company create attempt 2 failed:', companyError.message);
    }
  }

  return accountId;
}

/**
 * Add an existing user to an existing tenant with the given role.
 */
export async function addUserToTenant(
  accountId: string,
  userId: string,
  role?: string,
  client?: SupabaseClient
): Promise<void> {
  const db = client ?? supabase;
  const { error } = await db
    .from('account_users')
    .insert({
      account_id: accountId,
      user_id: userId,
      role: role ?? 'member',
      status: 'active',
    });

  if (error) {
    throw new Error(`Failed to add user to tenant: ${error.message}`);
  }
}
