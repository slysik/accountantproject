import { NextRequest, NextResponse } from 'next/server';

const smtp2goApiKey = process.env.SMTP2GO_API_KEY ?? process.env.smtp2go_api_key;
const signupNotifyTo = process.env.SIGNUP_NOTIFY_TO ?? 'vsawhney@amvean.com';
const signupNotifyFrom = process.env.SIGNUP_NOTIFY_FROM ?? 'it-team@amvean.com';

export async function POST(req: NextRequest) {
  try {
    if (!smtp2goApiKey) {
      return NextResponse.json({ error: 'SMTP2GO API key is not configured' }, { status: 500 });
    }

    const { email, provider } = await req.json() as { email?: string; provider?: string };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const subject = `New user signup: ${email}`;
    const textBody = [
      'A new user account was created in Accountant\'s Best Friend.',
      '',
      `Email: ${email}`,
      `Provider: ${provider ?? 'email/password'}`,
      `Created at: ${new Date().toISOString()}`,
    ].join('\n');

    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: signupNotifyFrom,
        to: [signupNotifyTo],
        subject,
        text_body: textBody,
        html_body: `
          <p>A new user account was created in Accountant's Best Friend.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Provider:</strong> ${provider ?? 'email/password'}</p>
          <p><strong>Created at:</strong> ${new Date().toISOString()}</p>
        `,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      console.error('SMTP2GO signup notification error:', payload);
      return NextResponse.json({ error: 'Failed to send signup notification' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payload });
  } catch (error) {
    console.error('Notify signup error:', error);
    return NextResponse.json({ error: 'Failed to send signup notification' }, { status: 500 });
  }
}
