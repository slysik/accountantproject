import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isMasterAdminEmail } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    // Verify the requesting user is the master admin via their JWT
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    // Verify the caller's identity using their JWT
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: callerUser }, error: callerErr } = await anonClient.auth.getUser();
    if (callerErr || !callerUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isMasterAdminEmail(callerUser.email)) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { targetUserId, newPassword } = await req.json() as {
      targetUserId?: string;
      newPassword?: string;
    };

    if (!targetUserId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'targetUserId and a password of at least 6 characters are required.' }, { status: 400 });
    }

    // Service role key required for admin password change
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on this server. Add it to .env.local to enable direct password changes.' },
        { status: 501 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin change-password error:', err);
    return NextResponse.json({ error: (err as { message?: string }).message ?? 'Failed to update password.' }, { status: 500 });
  }
}
