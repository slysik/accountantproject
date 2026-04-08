import Link from 'next/link';
import { LuChartBar } from 'react-icons/lu';

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-primary bg-bg-secondary py-10">
      <div className="mx-auto max-w-5xl px-6">
        {/* Top row */}
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <LuChartBar className="h-4 w-4 text-accent-primary" />
            <span className="text-sm font-semibold text-text-primary">
              Accountant&apos;s Best Friend
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-text-muted">
            <Link href="/pricing" className="transition-colors hover:text-text-primary">
              Pricing
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">
              Terms of Service
            </Link>
            <Link href="/contact" className="transition-colors hover:text-text-primary">
              Contact
            </Link>
            <Link href="/login" className="transition-colors hover:text-text-primary">
              Sign In
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-border-primary" />

        {/* Legal copy */}
        <div className="flex flex-col items-center gap-2 text-center text-xs text-text-muted">
          <p>
            &copy; {year} Accountant&apos;s Best Friend. All rights reserved.
          </p>
          <p className="max-w-2xl leading-relaxed">
            Accountant&apos;s Best Friend is an expense-tracking tool for self-employed individuals.
            It does not provide tax, legal, or financial advice. Always consult a qualified tax
            professional before filing. IRS category suggestions are provided for organizational
            convenience only and do not constitute tax guidance.
          </p>
        </div>
      </div>
    </footer>
  );
}
