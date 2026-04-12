import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSignupNotification } from '@/lib/signup-notify';
import { extractEmailDomain, findMatchingTenant, createTenant, addUserToTenant } from '@/lib/tenant';

const SUPABASE_SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SUPABASE_SIGNUP_LIMIT = 20;
const EMAIL_COOLDOWN_MS = 60 * 1000; // 60s per-email cooldown to avoid Supabase email rate limits

type SignupAttemptStore = Map<string, number[]>;
const signupAttemptStoreKey = '__signupAttemptStore';
const emailCooldownStore = new Map<string, number>();

function getAttemptStore() {
  const globalStore = globalThis as typeof globalThis & {
    [signupAttemptStoreKey]?: SignupAttemptStore;
  };

  if (!globalStore[signupAttemptStoreKey]) {
    globalStore[signupAttemptStoreKey] = new Map<string, number[]>();
  }

  return globalStore[signupAttemptStoreKey]!;
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function getAuthRedirectUrl(path: string) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = configuredBaseUrl?.trim().replace(/\/+$/, '');

  if (!baseUrl) {
    return `https://accountantsbestfriend.com${path}`;
  }

  return `${baseUrl}${path}`;
}

/** Simple UUID v4 format check */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Create a Supabase auth user. Uses admin API (service role) when available
 * for instant email confirmation; falls back to the public signup endpoint.
 */
async function createAuthUser(
  supabaseUrl: string,
  supabaseAnonKey: string,
  serviceRoleKey: string | undefined,
  email: string,
  password: string,
  redirectUrl: string,
): Promise<{ userId: string; session: Record<string, unknown> | null; emailConfirmationRequired: boolean }> {
  if (serviceRoleKey) {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      const msg = error.message ?? '';
      if (/already registered|already been registered|duplicate|exists/i.test(msg)) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      if (/rate limit|too many|exceeded/i.test(msg)) {
        throw new Error('Too many requests. Please wait a minute and try again.');
      }
      throw new Error(msg || 'Failed to create account.');
    }
    return { userId: data.user.id, session: null, emailConfirmationRequired: false };
  }

  // Fallback: public signup (requires email confirmation)
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    console.error('Supabase signup error:', response.status, JSON.stringify(payload));
    const raw = payload.msg ?? payload.error_description ?? payload.error ?? '';
    if (/already registered|already been registered|duplicate|exists/i.test(raw)) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (/rate limit|too many|exceeded/i.test(raw)) {
      throw new Error('Please wait a couple of minutes before trying again.');
    }
    throw new Error(raw || 'Signup failed');
  }
  return {
    userId: payload.user?.id ?? '',
    session: payload.session ?? null,
    emailConfirmationRequired: !payload.session,
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 });
    }

    // Admin client for server-side DB writes (bypasses RLS)
    const adminClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : null;

    const {
      email,
      password,
      inviteToken,
      firstName,
      lastName,
      companyName,
      confirmTenantId,
    } = await req.json() as {
      email?: string;
      password?: string;
      inviteToken?: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      confirmTenantId?: string;
    };

    console.log('[signup] fields received:', { email, firstName, lastName, companyName, confirmTenantId, inviteToken: !!inviteToken });

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const ipAddress = getClientIp(req);
    const now = Date.now();
    const attempts = getAttemptStore();
    const recentAttempts = (attempts.get(ipAddress) ?? []).filter(
      (timestamp) => now - timestamp < SUPABASE_SIGNUP_WINDOW_MS
    );

    if (recentAttempts.length >= SUPABASE_SIGNUP_LIMIT) {
      attempts.set(ipAddress, recentAttempts);
      return NextResponse.json(
        { error: 'Too many signup attempts from this IP address. Please try again in 24 hours.' },
        { status: 429 }
      );
    }

    recentAttempts.push(now);
    attempts.set(ipAddress, recentAttempts);

    // Per-email cooldown to avoid Supabase's email rate limit
    const normalizedEmail = email.toLowerCase().trim();
    const lastEmailAttempt = emailCooldownStore.get(normalizedEmail) ?? 0;
    const emailCoolingDown = now - lastEmailAttempt < EMAIL_COOLDOWN_MS;

    const enforceEmailCooldown = () => {
      if (emailCoolingDown) {
        const waitSecs = Math.ceil((EMAIL_COOLDOWN_MS - (now - lastEmailAttempt)) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSecs} seconds before trying again.` },
          { status: 429 }
        );
      }
      emailCooldownStore.set(normalizedEmail, now);
      return null;
    };

    // ─── Invite flow ───────────────────────────────────────────────────
    if (inviteToken) {
      if (!adminClient) {
        return NextResponse.json(
          { error: 'Invite enrollment requires SUPABASE_SERVICE_ROLE_KEY on the server.' },
          { status: 501 }
        );
      }

      const { data: inviteRow, error: inviteError } = await adminClient
        .from('account_members')
        .select('id, member_email, invited_at, invite_token_used_at, account_id')
        .eq('invite_token', inviteToken)
        .maybeSingle();

      if (inviteError || !inviteRow) {
        return NextResponse.json({ error: 'This invite link is invalid.' }, { status: 400 });
      }

      if ((inviteRow.member_email as string).toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ error: 'This invite link does not match that email address.' }, { status: 400 });
      }

      if (inviteRow.invite_token_used_at) {
        return NextResponse.json({ error: 'This invite link has already been used.' }, { status: 400 });
      }

      const invitedAt = new Date((inviteRow.invited_at as string) ?? '').getTime();
      if (!Number.isFinite(invitedAt) || now - invitedAt > 60 * 60 * 1000) {
        return NextResponse.json({ error: 'This invite link has expired. Please request a new invite.' }, { status: 400 });
      }

      const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createUserError) {
        return NextResponse.json(
          { error: createUserError.message ?? 'Failed to create invited account.' },
          { status: 400 }
        );
      }

      const { error: enrollError } = await adminClient
        .from('account_members')
        .update({
          member_user_id: createdUser.user.id,
          invite_token_used_at: new Date().toISOString(),
        })
        .eq('id', inviteRow.id as string);

      if (enrollError) {
        console.error('Failed to mark invite enrollment complete:', enrollError);
      }

      // Link invited user to the account if account_id is present
      if (inviteRow.account_id) {
        try {
          await addUserToTenant(
            inviteRow.account_id as string,
            createdUser.user.id,
            'member',
            adminClient ?? undefined
          );
        } catch (linkError) {
          console.error('Failed to add invited user to tenant:', linkError);
        }
      }

      try {
        await sendSignupNotification({
          email,
          provider: 'email/password',
          ipAddress,
        });
      } catch (notifyError) {
        console.error('Failed to notify admin about signup:', notifyError);
      }

      return NextResponse.json({
        sessionCreated: false,
        emailConfirmationRequired: false,
        inviteActivated: true,
        accountId: (inviteRow.account_id as string) ?? null,
        session: null,
      });
    }

    // ─── Tenant matching flow ──────────────────────────────────────────

    // Second call: user confirmed or declined a tenant match
    if (confirmTenantId) {
      const cooldownResponse = enforceEmailCooldown();
      if (cooldownResponse) return cooldownResponse;

      let authResult;
      try {
        authResult = await createAuthUser(supabaseUrl, supabaseAnonKey, serviceRoleKey, email, password, getAuthRedirectUrl('/login'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create account.';
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      const newUserId = authResult.userId;

      try {
        await sendSignupNotification({ email, provider: 'email/password', ipAddress });
      } catch (notifyError) {
        console.error('Failed to notify admin about signup:', notifyError);
      }

      if (confirmTenantId === 'new') {
        // User declined the match — create a brand-new tenant
        let accountId: string | null = null;
        try {
          accountId = await createTenant({
            companyName: companyName ?? '',
            emailDomain: extractEmailDomain(email),
            userId: newUserId,
            firstName: firstName ?? '',
            lastName: lastName ?? '',
            client: adminClient ?? undefined,
          });
        } catch (tenantErr) {
          console.error('Failed to create tenant (new):', tenantErr);
          // Fallback: create company row so it appears in sidebar pre-migration
          const svc = adminClient ?? createClient(supabaseUrl, supabaseAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          try {
            await svc.from('companies').upsert(
              { user_id: newUserId, name: companyName ?? '', deleted_at: null },
              { onConflict: 'user_id,name' }
            );
          } catch { /* ignore */ }
          try {
            await svc.from('account_profiles').insert({
              user_id: newUserId,
              account_name: companyName ?? '',
              first_name: firstName ?? '',
              last_name: lastName ?? '',
              business_name: companyName ?? '',
            });
          } catch { /* ignore */ }
        }

        return NextResponse.json({
          tenantMatch: false,
          accountId,
          sessionCreated: !!authResult.session,
          emailConfirmationRequired: authResult.emailConfirmationRequired,
          session: authResult.session,
        });
      }

      if (isUuid(confirmTenantId)) {
        // Re-verify server-side that this tenant actually matches the user's
        // email domain / company name. Without this check a client could supply
        // an arbitrary tenant UUID and join any account.
        const emailDomain = extractEmailDomain(email);
        const verifiedMatch = await findMatchingTenant(companyName ?? '', emailDomain);
        if (!verifiedMatch || verifiedMatch.accountId !== confirmTenantId) {
          return NextResponse.json(
            { error: 'The selected account does not match your company. Please try again.' },
            { status: 403 }
          );
        }

        // User confirmed the match — join existing tenant
        await addUserToTenant(confirmTenantId, newUserId, undefined, adminClient ?? undefined);

        // Create account profile for the new member
        const svc = adminClient ?? createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await svc.from('account_profiles').insert({
          user_id: newUserId,
          account_name: companyName ?? '',
          first_name: firstName ?? '',
          last_name: lastName ?? '',
          business_name: companyName ?? '',
        });

        return NextResponse.json({
          tenantMatch: true,
          accountId: confirmTenantId,
          sessionCreated: !!authResult.session,
          emailConfirmationRequired: authResult.emailConfirmationRequired,
          session: authResult.session,
        });
      }

      return NextResponse.json({ error: 'Invalid confirmTenantId value.' }, { status: 400 });
    }

    // First call with companyName: check for matching tenant before creating user
    if (companyName) {
      const emailDomain = extractEmailDomain(email);
      const match = await findMatchingTenant(companyName, emailDomain);

      if (match) {
        // Match found — return it to the client for confirmation (no user created yet)
        return NextResponse.json({
          tenantMatch: true,
          matchedAccountName: match.accountName,
          matchedAccountId: match.accountId,
        });
      }

      // No match — create user and new tenant immediately
      const cooldownResponse = enforceEmailCooldown();
      if (cooldownResponse) return cooldownResponse;

      let authResult;
      try {
        authResult = await createAuthUser(supabaseUrl, supabaseAnonKey, serviceRoleKey, email, password, getAuthRedirectUrl('/login'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create account.';
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      const newUserId = authResult.userId;

      try {
        await sendSignupNotification({ email, provider: 'email/password', ipAddress });
      } catch (notifyError) {
        console.error('Failed to notify admin about signup:', notifyError);
      }

      let accountId: string;
      try {
        accountId = await createTenant({
          companyName,
          emailDomain,
          userId: newUserId,
          firstName: firstName ?? '',
          lastName: lastName ?? '',
          client: adminClient ?? undefined,
        });
      } catch (tenantErr) {
        console.error('Failed to create tenant:', tenantErr);
        // Tenant setup failed (likely pre-migration) — still create company
        // and profile so the company appears in the sidebar
        const svc = adminClient ?? createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        try {
          await svc.from('companies').upsert(
            { user_id: newUserId, name: companyName, deleted_at: null },
            { onConflict: 'user_id,name' }
          );
        } catch (companyErr) {
          console.error('Fallback company creation failed:', companyErr);
        }
        try {
          await svc.from('account_profiles').insert({
            user_id: newUserId,
            account_name: companyName,
            first_name: firstName ?? '',
            last_name: lastName ?? '',
            business_name: companyName,
          });
        } catch (profileErr) {
          console.error('Fallback profile creation failed:', profileErr);
        }
        return NextResponse.json({
          tenantMatch: false,
          accountId: null,
          sessionCreated: !!authResult.session,
          emailConfirmationRequired: authResult.emailConfirmationRequired,
          session: authResult.session,
        });
      }

      return NextResponse.json({
        tenantMatch: false,
        accountId,
        sessionCreated: !!authResult.session,
        emailConfirmationRequired: authResult.emailConfirmationRequired,
        session: authResult.session,
      });
    }

    // ─── Legacy flow (no invite, no company name) ──────────────────────
    const cooldownResponse = enforceEmailCooldown();
    if (cooldownResponse) return cooldownResponse;

    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl('/login'),
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.msg ?? payload.error_description ?? payload.error ?? 'Signup failed' },
        { status: response.status }
      );
    }

    try {
      await sendSignupNotification({
        email,
        provider: 'email/password',
        ipAddress,
      });
    } catch (notifyError) {
      console.error('Failed to notify admin about signup:', notifyError);
    }

    return NextResponse.json({
      sessionCreated: !!payload.session,
      emailConfirmationRequired: !payload.session,
      session: payload.session ?? null,
    });
  } catch (error) {
    console.error('Signup route error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
