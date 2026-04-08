import { NextRequest, NextResponse } from 'next/server';
import { sendSignupNotification } from '@/lib/signup-notify';

export async function POST(req: NextRequest) {
  try {
    const { email, provider, ipAddress } = await req.json() as {
      email?: string;
      provider?: string;
      ipAddress?: string;
    };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const payload = await sendSignupNotification({
      email,
      provider,
      ipAddress,
    });

    return NextResponse.json({ ok: true, payload });
  } catch (error) {
    console.error('Notify signup error:', error);
    return NextResponse.json({ error: 'Failed to send signup notification' }, { status: 500 });
  }
}
