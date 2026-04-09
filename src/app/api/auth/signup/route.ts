import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSignupNotification } from '@/lib/signup-notify';

const SUPABASE_SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUPABASE_SIGNUP_LIMIT = 5;

type SignupAttemptStore = Map<string, number[]>;
const signupAttemptStoreKey = '__signupAttemptStore';

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
    throw new Error('Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL for auth redirects');
  }

  return `${baseUrl}${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 });
    }

    const { email, password, inviteToken } = await req.json() as {
      email?: string;
      password?: string;
      inviteToken?: string;
    };

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

    if (inviteToken) {
      if (!serviceRoleKey) {
        return NextResponse.json(
          { error: 'Invite enrollment requires SUPABASE_SERVICE_ROLE_KEY on the server.' },
          { status: 501 }
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: inviteRow, error: inviteError } = await adminClient
        .from('account_members')
        .select('id, member_email, invited_at, invite_token_used_at')
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
        session: null,
      });
    }

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
