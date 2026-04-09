import { NextRequest, NextResponse } from 'next/server';

const smtp2goApiKey = process.env.SMTP2GO_API_KEY ?? process.env.smtp2go_api_key;
const fromEmail = process.env.SIGNUP_NOTIFY_FROM ?? 'it-team@amvean.com';

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  return url.replace(/\/+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const { memberEmail, ownerEmail } = await req.json() as {
      memberEmail?: string;
      ownerEmail?: string;
    };

    if (!memberEmail || !ownerEmail) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!smtp2goApiKey) {
      // Non-fatal — log and return success so member is still added
      console.warn('SMTP2GO not configured — invite email not sent');
      return NextResponse.json({ ok: true, skipped: true });
    }

    const siteUrl = getSiteUrl();
    const loginUrl = `${siteUrl}/login`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; margin:0; padding:32px 16px; }
    .card { background:#fff; max-width:520px; margin:0 auto; border-radius:12px; padding:40px; border:1px solid #e4e4e7; }
    h1 { font-size:20px; color:#18181b; margin:0 0 8px; }
    p { color:#52525b; line-height:1.6; margin:12px 0; }
    .btn { display:inline-block; background:#da7756; color:#fff !important; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px; margin:16px 0; }
    .note { font-size:12px; color:#a1a1aa; margin-top:24px; border-top:1px solid #f4f4f5; padding-top:16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>You've been added to a team</h1>
    <p>
      <strong>${ownerEmail}</strong> has added you as a team member on
      <strong>Accountant's Best Friend</strong>.
    </p>
    <p>
      Sign in (or create a free account) with this email address to access
      the shared dashboard:
    </p>
    <a href="${loginUrl}" class="btn">Accept Invitation →</a>
    <p>
      If you already have an account, just sign in normally at
      <a href="${loginUrl}">${loginUrl}</a>.
    </p>
    <div class="note">
      This invitation expires in <strong>24 hours</strong>. If you did not expect
      this email you can safely ignore it.
    </div>
  </div>
</body>
</html>`;

    const textBody = [
      `${ownerEmail} has added you as a team member on Accountant's Best Friend.`,
      '',
      `Sign in or create an account with this email address to accept the invitation:`,
      loginUrl,
      '',
      'This invitation expires in 24 hours.',
    ].join('\n');

    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: `Accountant's Best Friend <${fromEmail}>`,
        to: [memberEmail],
        subject: `${ownerEmail} invited you to their team`,
        text_body: textBody,
        html_body: htmlBody,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error('SMTP2GO invite email error:', payload);
      // Non-fatal — member was already added
      return NextResponse.json({ ok: true, skipped: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Invite email error:', err);
    return NextResponse.json({ ok: true, skipped: true });
  }
}
