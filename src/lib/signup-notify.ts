const smtp2goApiKey = process.env.SMTP2GO_API_KEY ?? process.env.smtp2go_api_key;
const signupNotifyTo = process.env.SIGNUP_NOTIFY_TO ?? 'vsawhney@amvean.com';
const signupNotifyFrom = process.env.SIGNUP_NOTIFY_FROM ?? 'it-team@amvean.com';

interface SignupNotificationInput {
  email: string;
  provider?: string;
  ipAddress?: string;
}

export async function sendSignupNotification({
  email,
  provider = 'email/password',
  ipAddress = 'unknown',
}: SignupNotificationInput) {
  if (!smtp2goApiKey) {
    throw new Error('SMTP2GO API key is not configured');
  }

  const createdAt = new Date().toISOString();
  const subject = `New user signup: ${email}`;
  const textBody = [
    'A new user account was created in Accountant\'s Best Friend.',
    '',
    `Email: ${email}`,
    `Provider: ${provider}`,
    `IP address: ${ipAddress}`,
    `Created at: ${createdAt}`,
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
        <p><strong>Provider:</strong> ${provider}</p>
        <p><strong>IP address:</strong> ${ipAddress}</p>
        <p><strong>Created at:</strong> ${createdAt}</p>
      `,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error('SMTP2GO signup notification error:', payload);
    throw new Error('Failed to send signup notification');
  }

  return payload;
}
