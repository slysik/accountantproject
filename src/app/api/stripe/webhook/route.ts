import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PLANS, type Plan } from '@/lib/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan as Exclude<Plan, 'trial'> | undefined;
    const userId = session.metadata?.user_id;

    if (!plan || !userId || !(plan in PLANS)) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const planStartsAt = new Date();
    const planExpiresAt = new Date(planStartsAt);
    planExpiresAt.setDate(planExpiresAt.getDate() + 30);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan,
        status: 'active',
        plan_starts_at: planStartsAt.toISOString(),
        plan_expires_at: planExpiresAt.toISOString(),
        allowed_active_users: PLANS[plan].maxUsers,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Webhook: subscription update failed', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
