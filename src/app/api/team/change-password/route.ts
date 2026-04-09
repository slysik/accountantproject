import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
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

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user: callerUser }, error: callerErr } = await anonClient.auth.getUser();
    if (callerErr || !callerUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, newPassword, ownerUserId } = await req.json() as {
      targetUserId?: string;
      newPassword?: string;
      ownerUserId?: string;
    };

    if (!ownerUserId || !targetUserId || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'ownerUserId, targetUserId, and a password of at least 6 characters are required.' },
        { status: 400 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on this server. Add it to .env.local to enable direct password changes.' },
        { status: 501 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const callerIsOwner = callerUser.id === ownerUserId;
    if (!callerIsOwner) {
      const { data: memberRow, error: memberErr } = await adminClient
        .from('account_members')
        .select('role')
        .eq('owner_user_id', ownerUserId)
        .eq('member_user_id', callerUser.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (!memberRow || memberRow.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required for this account.' }, { status: 403 });
      }
    }

    const { data: targetMember, error: targetErr } = await adminClient
      .from('account_members')
      .select('id, member_user_id')
      .eq('owner_user_id', ownerUserId)
      .eq('member_user_id', targetUserId)
      .maybeSingle();

    if (targetErr) throw targetErr;
    if (!targetMember) {
      return NextResponse.json({ error: 'Target user is not an enrolled member of this account.' }, { status: 404 });
    }

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Team change-password error:', err);
    return NextResponse.json(
      { error: (err as { message?: string }).message ?? 'Failed to update password.' },
      { status: 500 }
    );
  }
}
