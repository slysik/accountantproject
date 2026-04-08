import { NextRequest, NextResponse } from 'next/server';

const smtp2goApiKey = process.env.SMTP2GO_API_KEY;
const fromEmail = process.env.SIGNUP_NOTIFY_FROM ?? 'it-team@amvean.com';
const toEmail = 'vic@alpina.net';
const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY ?? '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, recaptchaToken } = await req.json() as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      recaptchaToken?: string;
    };

    // Validate fields
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
    }
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!recaptchaToken) {
      return NextResponse.json({ error: 'Please complete the CAPTCHA.' }, { status: 400 });
    }

    // Verify reCAPTCHA
    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
    });
    const captchaData = await captchaRes.json() as { success: boolean };
    if (!captchaData.success) {
      return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
    }

    // Send email via SMTP2GO
    if (!smtp2goApiKey) {
      return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
    }

    const emailSubject = subject?.trim() ? `Contact: ${subject}` : `Contact form message from ${name}`;
    const textBody = [
      `New contact form submission from accountantsbestfriend.com`,
      '',
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Subject: ${subject || '(none)'}`,
      '',
      `Message:`,
      message,
    ].join('\n');

    const htmlBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject || '(none)'}</p>
      <hr/>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${message}</p>
      <hr/>
      <p style="color:#888;font-size:12px">Sent from accountantsbestfriend.com contact form</p>
    `;

    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: fromEmail,
        to: [toEmail],
        reply_to: [`${name} <${email}>`],
        subject: emailSubject,
        text_body: textBody,
        html_body: htmlBody,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('SMTP2GO contact error:', result);
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
