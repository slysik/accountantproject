import { NextRequest, NextResponse } from 'next/server';
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

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase environment is not configured' }, { status: 500 });
    }

    const { email, password } = await req.json() as { email?: string; password?: string };

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
