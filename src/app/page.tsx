'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LuUpload, LuTag, LuDownload, LuShield, LuArrowRight, LuCheck, LuSun, LuMoon, LuChartBar } from 'react-icons/lu';
import { useTheme } from '@/lib/theme';
import PublicFooter from '@/components/PublicFooter';

const features = [
  {
    icon: LuUpload,
    title: 'Smart CSV Import',
    description: 'Drag and drop any bank export. We auto-detect columns, parse dates, and handle every format.',
  },
  {
    icon: LuTag,
    title: 'IRS Auto-Categorization',
    description: '27 Schedule C categories, 200+ keywords. Expenses are categorized the moment they land.',
  },
  {
    icon: LuChartBar,
    title: 'Visual Spending Insights',
    description: 'Monthly charts, category breakdowns, and KPI cards give you a clear picture at a glance.',
  },
  {
    icon: LuDownload,
    title: 'Export Anywhere',
    description: 'Download as Excel, CSV, or QBO — compatible with QuickBooks and any accounting software.',
  },
  {
    icon: LuUpload,
    title: 'Receipt Attachments',
    description: 'Attach images, PDFs, or documents directly to any expense. Everything in one place.',
  },
  {
    icon: LuShield,
    title: 'Secure by Default',
    description: 'Two-factor authentication, row-level security, and encrypted storage protect your data.',
  },
];

const steps = [
  { number: '01', title: 'Sign up free', description: 'Create your account in seconds — email or Google.' },
  { number: '02', title: 'Import your CSV', description: 'Drop in your bank or credit card export. We handle the rest.' },
  { number: '03', title: 'Review & categorize', description: 'Expenses are auto-categorized. Tweak any you disagree with.' },
  { number: '04', title: 'Export for your accountant', description: 'Download a clean Excel report or QBO file ready for tax time.' },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">

      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <div className="flex items-center gap-2">
          <Image
            src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
            alt="Accountant's Best Friend"
            width={40}
            height={40}
            className="rounded-xl"
            unoptimized
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
          >
            Try it free
          </Link>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative flex h-8 w-16 items-center rounded-full border-2 border-accent-primary bg-bg-tertiary p-1 transition-all hover:scale-105 hover:shadow-[0_0_12px_var(--accent-primary)] focus:outline-none"
          >
            <span
              className={`absolute h-5 w-5 rounded-full bg-accent-primary shadow transition-all duration-300 ${
                theme === 'light' ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
            <LuMoon className="absolute left-1.5 h-3 w-3 text-text-muted" />
            <LuSun className="absolute right-1.5 h-3 w-3 text-text-muted" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-4 py-1.5 text-xs font-medium text-accent-primary">
          Built for self-employed professionals &amp; freelancers
        </div>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-text-primary md:text-5xl">
          Stop dreading tax season.
          <br />
          <span className="text-accent-primary">Start the year organized.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-text-muted">
          Import your bank CSV, get expenses automatically categorized by IRS Schedule C,
          attach receipts, and export a clean report — all in minutes.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-accent-primary px-8 py-3.5 text-base font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
          >
            Try it now — it&apos;s free
            <LuArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-border-primary px-8 py-3.5 text-base font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border-primary bg-bg-secondary py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-text-primary">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border-primary bg-bg-primary p-6 transition-colors hover:border-accent-primary/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
                  <f.icon className="h-5 w-5 text-accent-primary" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-text-primary">{f.title}</h3>
                <p className="text-xs leading-relaxed text-text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-text-primary">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-3">
                <span className="text-3xl font-bold text-accent-primary/40">{step.number}</span>
                <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
                <p className="text-xs leading-relaxed text-text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / benefits */}
      <section className="border-t border-border-primary bg-bg-secondary py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-8 text-2xl font-bold text-text-primary">
            Tax-ready in an afternoon
          </h2>
          <ul className="mb-10 flex flex-col gap-3 text-left">
            {[
              'No more manual spreadsheets or shoeboxes of receipts',
              'IRS Schedule C categories applied automatically',
              'Your accountant gets a clean Excel file — not a mess of PDFs',
              'Secure: 2FA, encrypted storage, nobody else sees your data',
              'Works with any bank CSV export — Chase, BofA, Amex, and more',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                <LuCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-8 py-3.5 text-base font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
          >
            Get started free
            <LuArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
