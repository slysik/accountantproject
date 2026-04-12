#!/usr/bin/env bun
/**
 * Check a user's data in Supabase.
 * Usage: bun scripts/check-user.ts <email>
 */
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: bun scripts/check-user.ts <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: { users } } = await admin.auth.admin.listUsers();
const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!user) {
  console.log(`User not found: ${email}`);
  process.exit(0);
}

console.log(`\nUser: ${user.email} (${user.id})`);
console.log(`Confirmed: ${!!user.email_confirmed_at}`);

const { data: subs } = await admin.from('subscriptions').select('*').eq('user_id', user.id);
console.log(`\nSubscriptions:`, JSON.stringify(subs, null, 2));

const { data: companies } = await admin.from('companies').select('*').eq('user_id', user.id);
console.log(`\nCompanies:`, JSON.stringify(companies, null, 2));

const { data: profiles } = await admin.from('account_profiles').select('*').eq('user_id', user.id);
console.log(`\nAccount Profiles:`, JSON.stringify(profiles, null, 2));
