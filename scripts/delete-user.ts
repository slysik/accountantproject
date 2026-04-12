#!/usr/bin/env bun
/**
 * Delete a Supabase auth user by email, including all related data.
 * Usage: bun scripts/delete-user.ts <email>
 */
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const email = process.argv[2];
if (!email) {
  console.error('Usage: bun scripts/delete-user.ts <email>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find user by email
const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
if (listError) {
  console.error('Failed to list users:', listError.message);
  process.exit(1);
}

const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

const userId = user.id;
console.log(`Found user: ${email} (${userId})`);

// Direct SQL connection to bypass RLS
const pgClient = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com', port: 5432,
  database: 'postgres', user: 'postgres.enkmkdhloycjczdqaucg',
  password: process.env.SUPABASE_DB_PASSWORD, ssl: { rejectUnauthorized: false },
});
await pgClient.connect();

// Clean up all related data via direct SQL (bypasses RLS)
const cleanups = [
  'DELETE FROM account_audit_events WHERE owner_user_id = $1 OR actor_user_id = $1',
  'DELETE FROM account_member_companies WHERE owner_user_id = $1',
  'DELETE FROM account_members WHERE owner_user_id = $1 OR member_user_id = $1',
  'DELETE FROM account_users WHERE user_id = $1',
  'DELETE FROM subscriptions WHERE user_id = $1',
  'DELETE FROM account_profiles WHERE user_id = $1',
  'DELETE FROM receipts WHERE user_id = $1',
  'DELETE FROM expenses WHERE user_id = $1',
  'DELETE FROM customer_subfolders WHERE user_id = $1',
  'DELETE FROM category_mappings WHERE user_id = $1',
  'DELETE FROM folders WHERE user_id = $1',
  'DELETE FROM companies WHERE user_id = $1',
];

// Delete owned accounts (and their account_users)
const { rows: ownedAccounts } = await pgClient.query('SELECT id FROM accounts WHERE created_by_user_id = $1', [userId]);
for (const acct of ownedAccounts) {
  await pgClient.query('DELETE FROM account_users WHERE account_id = $1', [acct.id]);
  await pgClient.query('DELETE FROM subscriptions WHERE account_id = $1', [acct.id]);
  await pgClient.query('DELETE FROM accounts WHERE id = $1', [acct.id]);
  console.log(`  Deleted account: ${acct.id}`);
}

for (const sql of cleanups) {
  try {
    const res = await pgClient.query(sql, [userId]);
    if (res.rowCount && res.rowCount > 0) {
      console.log(`  ${sql.split(' FROM ')[1].split(' WHERE')[0]}: ${res.rowCount} row(s)`);
    }
  } catch (e) {
    // Table may not exist — skip
  }
}

await pgClient.end();

// Now delete the auth user
const { error } = await admin.auth.admin.deleteUser(userId);
if (error) {
  console.error(`Failed to delete ${email}:`, error.message);
  process.exit(1);
}

console.log(`\nDeleted user: ${email} (${userId})`);
