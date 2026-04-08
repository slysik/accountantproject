import Link from 'next/link';
import { LuArrowLeft } from 'react-icons/lu';
import PublicFooter from '@/components/PublicFooter';

export const metadata = { title: "Terms of Service — Accountant's Best Friend" };

const EFFECTIVE_DATE = 'April 7, 2026';
const CONTACT_EMAIL = 'vic@alpina.net';
const SITE_URL = 'accountantsbestfriend.com';

export default function TermsPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-text-primary">Terms of Service</h1>
          <p className="text-sm text-text-muted">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-text-secondary">

          <section>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Accountant&apos;s Best Friend,
              operated at {SITE_URL} (&ldquo;the Service&rdquo;). By creating an account or using the Service
              you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">1. Description of Service</h2>
            <p>
              Accountant&apos;s Best Friend is an expense-tracking and reporting tool designed for
              self-employed individuals. It allows you to import expense data from CSV files, categorize
              expenses using IRS Schedule C categories, attach receipts, generate reports, and export
              data in multiple formats. The Service does not provide tax, legal, or financial advice.
              Always consult a qualified tax professional before filing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">2. Eligibility and Accounts</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>You must be at least 18 years old and legally able to enter into a contract.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>
                You are responsible for all activity that occurs under your account, including actions
                taken by team members you invite.
              </li>
              <li>
                You must provide accurate information when signing up. Accounts created with false
                information may be terminated.
              </li>
              <li>One account per person. You may not share login credentials across multiple individuals.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">3. Subscriptions and Payments</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Free trial</h3>
                <p>
                  New accounts receive a 30-day free trial with no credit card required. At the end of
                  the trial you must select a paid plan to continue using the Service. Your data is
                  preserved for 30 days after trial expiration before automatic deletion.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Paid plans</h3>
                <p>
                  Plans are billed monthly. Current plan pricing is displayed on the{' '}
                  <Link href="/pricing" className="text-accent-primary underline hover:text-accent-dark">
                    pricing page
                  </Link>.
                  Prices may change with 30 days&apos; advance notice by email.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Payment processing</h3>
                <p>
                  Payments are processed by PayPal. By completing a purchase you also agree to
                  PayPal&apos;s terms of service. We do not store your payment method details.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Refunds</h3>
                <p>
                  Payments are non-refundable unless required by applicable law. If you believe a
                  charge was made in error, contact us at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-primary underline hover:text-accent-dark">
                    {CONTACT_EMAIL}
                  </a>{' '}
                  within 7 days and we will review your request.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-text-primary">Cancellation</h3>
                <p>
                  You may cancel at any time. Cancellation takes effect at the end of the current
                  billing period. You retain access until the period ends.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
              <li>Attempt to gain unauthorized access to other accounts or our infrastructure.</li>
              <li>Upload malicious files, malware, or content designed to disrupt the Service.</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service.</li>
              <li>Resell, sublicense, or provide the Service to third parties without our written consent.</li>
              <li>
                Use the Service to store data that does not belong to you or for which you lack
                appropriate authorization.
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these rules without refund.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">5. Your Data</h2>
            <p className="mb-3">
              You retain ownership of all expense data, receipts, and files you upload to the Service.
              By using the Service you grant us a limited license to store and process your data solely
              to provide the features you use.
            </p>
            <p>
              We will not access, read, or share your financial data except to provide the Service,
              to comply with legal obligations, or with your explicit consent. See our{' '}
              <Link href="/privacy" className="text-accent-primary underline hover:text-accent-dark">
                Privacy Policy
              </Link>{' '}
              for full details.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">6. No Tax or Financial Advice</h2>
            <p>
              IRS category suggestions provided by the Service are for organizational convenience only
              and do not constitute tax advice or guidance. The Service is a data management tool, not
              a tax preparation service. We are not responsible for any tax filings, penalties, or
              financial decisions you make based on data managed in the Service. You should always
              consult a licensed tax professional or CPA for tax guidance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">7. Service Availability</h2>
            <p>
              We aim to maintain high availability but do not guarantee uninterrupted access. We may
              perform maintenance, upgrades, or emergency repairs that temporarily affect the Service.
              We will endeavor to provide advance notice of planned downtime where possible. We are
              not liable for losses caused by temporary unavailability.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">8. Limitation of Liability</h2>
            <p className="mb-3">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied,
                including fitness for a particular purpose or accuracy of IRS categorizations.
              </li>
              <li>
                We are not liable for any indirect, incidental, special, or consequential damages,
                including lost profits or data loss, arising from your use of the Service.
              </li>
              <li>
                Our total liability to you for any claim arising from use of the Service shall not
                exceed the total amount you paid us in the 3 months preceding the claim.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">9. Termination</h2>
            <p>
              Either party may terminate the agreement at any time. You may close your account from
              settings or by contacting us. We may suspend or terminate your account immediately if you
              violate these Terms or if required by law. Upon termination, your data will be deleted in
              accordance with our data retention policy (see Privacy Policy, Section 5).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by
              email at least 14 days before they take effect. Continued use of the Service after changes
              take effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United States. Any disputes arising from
              these Terms or your use of the Service shall be resolved through good-faith negotiation
              first. If a dispute cannot be resolved informally, it will be subject to binding arbitration
              under the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-text-primary">12. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
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
