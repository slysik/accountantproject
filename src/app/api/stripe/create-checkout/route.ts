import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  individual: process.env.STRIPE_PRICE_INDIVIDUAL!,
  business:   process.env.STRIPE_PRICE_BUSINESS!,
  elite:      process.env.STRIPE_PRICE_ELITE!,
  vps:        process.env.STRIPE_PRICE_VPS!,
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json() as { plan: string };

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get the authenticated user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = req.headers.get('authorization') ?? req.headers.get('cookie') ?? '';
    const accessToken = req.headers.get('x-access-token');

    let userId: string | undefined;
    let userEmail: string | undefined;

    if (accessToken) {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      userId = user?.id;
      userEmail = user?.email ?? undefined;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accountantsbestfriend.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?payment=success`,
      cancel_url: `${siteUrl}/subscribe?payment=cancelled`,
      customer_email: userEmail,
      metadata: {
        plan,
        user_id: userId ?? '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
