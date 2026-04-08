import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';
import PublicFooter from '@/components/PublicFooter';

export const metadata = { title: "Privacy Policy — Accountant's Best Friend" };

const EFFECTIVE_DATE = 'April 7, 2026';
const CONTACT_EMAIL = 'vic@alpina.net';
const SITE_URL = 'accountantsbestfriend.com';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/login"
          className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          Sign In
        </Link>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-text-primary">Privacy Policy</h1>
          <p className="text-sm text-text-muted">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-text-secondary">

          <section>
            <p>
              Accountant&apos;s Best Friend (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              operates {SITE_URL}. This Privacy Policy explains what information we collect, how we use
              it, and the choices you have. By using the service you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Account information</h3>
                <p>
                  When you sign up we collect your email address and a hashed password. We do not store
                  plain-text passwords.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Financial / expense data</h3>
                <p>
                  You upload CSV files and enter expense records. This data — dates, amounts, descriptions,
                  IRS categories, and any notes — is stored in your account and is only accessible to you
                  and any team members you explicitly invite.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Receipt files</h3>
                <p>
                  Images, PDFs, and documents you attach to expenses are stored in encrypted cloud storage
                  (Supabase Storage). Files are linked to your account and are not shared with other users.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Usage and technical data</h3>
                <p>
                  We collect standard server logs including IP addresses, browser type, and pages visited.
                  This data is used solely for security monitoring, abuse prevention, and debugging.
                  We do not use it for advertising.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Payment information</h3>
                <p>
                  Payments are processed by PayPal. We do not receive or store your credit card number
                  or bank account details. PayPal may collect and process payment data under their own
                  privacy policy.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">2. How We Use Your Information</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To provide, maintain, and improve the service.</li>
              <li>To authenticate you and keep your account secure (including 2FA).</li>
              <li>To send transactional emails — account confirmation, password reset, and signup alerts.</li>
              <li>To enforce rate limits and prevent abuse (e.g., signup attempt limiting by IP).</li>
              <li>To respond to support requests sent through the contact form.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">3. Data Storage and Security</h2>
            <p className="mb-3">
              Your data is stored on Supabase (PostgreSQL), hosted on infrastructure within the United States.
              We apply the following safeguards:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Passwords are hashed — we cannot recover them.</li>
              <li>All traffic between your browser and our servers is encrypted via HTTPS/TLS.</li>
              <li>Database access is controlled by Row Level Security (RLS) — you can only query your own data.</li>
              <li>Receipt files are stored in private, access-controlled cloud buckets.</li>
              <li>Two-factor authentication (TOTP) is available and required for new accounts.</li>
            </ul>
            <p className="mt-3">
              No system is 100% secure. If we become aware of a breach affecting your data we will notify you
              by email within a reasonable timeframe.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">4. Cookies and Tracking</h2>
            <p>
              We use session cookies to keep you signed in. We do not use third-party advertising trackers,
              analytics beacons, or fingerprinting scripts. The only third-party scripts loaded are the
              PayPal JS SDK (on checkout pages) and Google reCAPTCHA (on the contact form), each governed
              by their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">5. Data Retention</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Active accounts: your data is retained as long as your account is active or as needed to
                provide the service.
              </li>
              <li>
                Deleted expenses: soft-deleted expenses are moved to a trash bin and permanently removed
                when you empty the trash or after 30 days of inactivity on the account.
              </li>
              <li>
                Account closure: if you close your account, your data will be deleted within 30 days
                unless we are required to retain it by law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">6. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via your account settings.</li>
              <li>Export your expense data at any time using the built-in export tools (CSV, Excel, QBO).</li>
              <li>Request deletion of your account and all associated data.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-primary underline hover:text-accent-dark">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the effective
              date at the top of this page. For material changes we will notify active users by email.
              Continued use of the service after changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">8. Contact</h2>
            <p>
              Questions or concerns about this policy? Reach us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-primary underline hover:text-accent-dark">
                {CONTACT_EMAIL}
              </a>{' '}
              or use the{' '}
              <Link href="/contact" className="text-accent-primary underline hover:text-accent-dark">
                contact form
              </Link>.
            </p>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
