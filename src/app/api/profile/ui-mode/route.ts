import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Mode = 'light' | 'dark' | 'auto';
const VALID_MODES: Mode[] = ['light', 'dark', 'auto'];

function isMode(v: unknown): v is Mode {
  return typeof v === 'string' && (VALID_MODES as string[]).includes(v);
}

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('x-access-token') ?? '';
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = makeAdmin();
  const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('account_profiles')
    .select('ui_mode')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ mode: (data as { ui_mode?: string } | null)?.ui_mode ?? 'light' });
}

export async function PATCH(req: NextRequest) {
  const accessToken = req.headers.get('x-access-token') ?? '';
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { mode?: unknown } | null;
  if (!body || !isMode(body.mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  const supabase = makeAdmin();
  const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('account_profiles')
    .upsert({ user_id: user.id, ui_mode: body.mode }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json({ mode: body.mode });
}
