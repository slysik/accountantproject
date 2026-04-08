import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API =
  process.env.PAYPAL_SANDBOX !== 'false'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

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
    const { orderID } = await req.json() as { orderID?: string };
    if (!orderID) {
      return NextResponse.json({ error: 'Missing orderID.' }, { status: 400 });
    }

    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json() as { status?: string };
    if (data.status !== 'COMPLETED') {
      console.error('PayPal capture error:', data);
      return NextResponse.json({ error: 'Payment was not completed.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PayPal capture exception:', err);
    return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 500 });
  }
}
