import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API =
  process.env.PAYPAL_SANDBOX !== 'false'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const PLAN_PRICES: Record<string, string> = {
  individual: '10.00',
  business: '25.00',
  elite: '100.00',
  vps: '250.00',
};

const PLAN_LABELS: Record<string, string> = {
  individual: 'Individual',
  business: 'Business',
  elite: 'Elite',
  vps: 'Virtual Private Server',
};

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error('PayPal credentials not configured.');

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json() as { plan?: string };
    const amount = plan ? PLAN_PRICES[plan] : null;
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `abf-${Date.now()}-${plan}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: `Accountant's Best Friend — ${PLAN_LABELS[plan!]} plan (1 month)`,
            amount: { currency_code: 'USD', value: amount },
          },
        ],
        application_context: {
          brand_name: "Accountant's Best Friend",
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const order = await res.json() as { id?: string };
    if (!order.id) {
      console.error('PayPal create-order error:', order);
      return NextResponse.json({ error: 'Failed to create PayPal order.' }, { status: 500 });
    }

    return NextResponse.json({ id: order.id });
  } catch (err) {
    console.error('PayPal create-order exception:', err);
    return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 500 });
  }
}
