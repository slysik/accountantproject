import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type AdminAccountStateRow = {
  user_id: string;
  email: string;
  account_name: string | null;
  first_name: string | null;
  business_name: string | null;
  contact_email: string | null;
  phone: string | null;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
  account_created_at: string;
  last_sign_in_at: string | null;
  company_count: number;
  active_team_members: number;
};

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminAllowed, error: adminError } = await supabase.rpc('is_site_admin', {
      p_user_id: user.id,
      p_email: user.email?.toLowerCase() ?? '',
    });

    if (adminError) {
      console.error('Admin check failed:', adminError);
      return NextResponse.json({ error: 'Unable to verify admin access' }, { status: 500 });
    }

    if (!adminAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase.rpc('get_admin_account_states');

    if (error) {
      console.error('Admin account state fetch failed:', error);
      return NextResponse.json({ error: 'Failed to load account states' }, { status: 500 });
    }

    return NextResponse.json({ accounts: (data ?? []) as AdminAccountStateRow[] });
  } catch (error) {
    console.error('Admin accounts route error:', error);
    return NextResponse.json({ error: 'Failed to load admin dashboard' }, { status: 500 });
  }
}
