'use client';

import Link from 'next/link';
import {
  LuArrowRight,
  LuBot,
  LuChartBar,
  LuCheck,
  LuChevronRight,
  LuFileSpreadsheet,
  LuFolderTree,
  LuLockKeyhole,
  LuMoon,
  LuReceipt,
  LuShield,
  LuSun,
  LuUpload,
  LuUsers,
} from 'react-icons/lu';
import { useTheme } from '@/lib/theme';
import PublicFooter from '@/components/PublicFooter';
import SiteLogo from '@/components/SiteLogo';

const capabilities = [
  {
    icon: LuUpload,
    title: 'Fast bank import',
    description: 'Upload CSV exports from banks and cards, then let the platform organize dates, amounts, and descriptions automatically.',
  },
  {
    icon: LuReceipt,
    title: 'Receipt-backed bookkeeping',
    description: 'Attach receipts, PDFs, and proof-of-purchase documents directly to each transaction for cleaner records.',
  },
  {
    icon: LuChartBar,
    title: 'Live financial visibility',
    description: 'See category totals, monthly trends, and year-over-year activity without building a spreadsheet from scratch.',
  },
  {
    icon: LuFileSpreadsheet,
    title: 'Export-ready output',
    description: 'Download data for Excel, CSV, and QBO workflows so accountants and bookkeepers can keep moving.',
  },
  {
    icon: LuBot,
    title: 'Alladin assistance',
    description: 'Ask the built-in AI bot for summaries, patterns, and data explanations across your accounting records.',
  },
  {
    icon: LuShield,
    title: 'Secure account controls',
    description: 'Use MFA, signup protections, access controls, and account-aware permissions to protect sensitive business data.',
  },
];

const lifecycle = [
  {
    title: 'Collect',
    detail: 'Bring in CSVs, receipts, and supporting files.',
  },
  {
    title: 'Organize',
    detail: 'Group activity by company, year, month, and subfolder.',
  },
  {
    title: 'Review',
    detail: 'Inspect categories, charts, trends, and anomalies.',
  },
  {
    title: 'Deliver',
    detail: 'Export clean reports for tax prep, advisors, and records.',
  },
];

const featureBands = [
  {
    title: 'Designed for real accounting workflows',
    body: 'From one-person shops to multi-user teams, the platform keeps expenses structured by company, year, and month so tax preparation feels controlled instead of chaotic.',
    points: ['Company folders and customer subfolders', 'Team-member access by account', 'Settings for account and business profile details'],
  },
  {
    title: 'Built to answer questions quickly',
    body: 'Alladin stays available inside the product, and exported answers can be saved to files or Excel when the response is tabular.',
    points: ['Persistent in-app chatbot', 'Download assistant output to file', 'Excel export for table-style answers'],
  },
  {
    title: 'Focused on safer access',
    body: 'The app includes stronger signup controls and authentication flows to help reduce abuse while keeping legitimate users moving.',
    points: ['Signup IP tracking and rate limits', 'Two-factor authentication support', 'Short MFA grace period after recent verification'],
  },
];

function WorkflowDiagram() {
  return (
    <div className="hero-surface p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-kicker">Workflow Diagram</p>
          <h3 className="mt-2 text-xl font-semibold text-text-primary">From raw files to tax-ready output</h3>
        </div>
        <div className="rounded-full border border-border-primary px-3 py-1 text-[11px] font-medium text-text-secondary">
          End-to-end bookkeeping flow
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {lifecycle.map((item, index) => (
          <div key={item.title} className="relative rounded-2xl border border-border-primary bg-bg-primary/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                0{index + 1}
              </span>
              {index < lifecycle.length - 1 ? (
                <LuChevronRight className="h-4 w-4 text-accent-primary md:block" />
              ) : null}
            </div>
            <h4 className="text-base font-semibold text-text-primary">{item.title}</h4>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-accent-primary/40 bg-accent-primary/10 p-4 text-sm text-text-secondary">
        Import data, sort it into structured folders, review with charts and AI assistance, then export the final output in accountant-friendly formats.
      </div>
    </div>
  );
}

function CapabilityMap() {
  return (
    <div className="hero-surface p-5 md:p-6">
      <p className="section-kicker">Capability Map</p>
      <h3 className="mt-2 text-xl font-semibold text-text-primary">What the platform covers</h3>

      <div className="mt-5 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border-primary bg-bg-primary/80 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <LuFolderTree className="h-4 w-4 text-accent-primary" />
                Organization
              </div>
              <p className="text-sm leading-6 text-text-secondary">Companies, years, months, subfolders, trash recovery, and account details.</p>
            </div>
            <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <LuChartBar className="h-4 w-4 text-accent-primary" />
                Analysis
              </div>
              <p className="text-sm leading-6 text-text-secondary">Dashboards, category totals, monthly breakdowns, and exportable reporting.</p>
            </div>
            <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <LuUsers className="h-4 w-4 text-accent-primary" />
                Collaboration
              </div>
              <p className="text-sm leading-6 text-text-secondary">Team-member access, admin oversight, and shared account structures.</p>
            </div>
            <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <LuLockKeyhole className="h-4 w-4 text-accent-primary" />
                Protection
              </div>
              <p className="text-sm leading-6 text-text-secondary">MFA support, guarded signup flow, IP limits, and account-level access control.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-primary bg-bg-primary/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">Outcome</p>
          <div className="mt-4 space-y-3">
            {[
              'Less manual cleanup before tax season',
              'Cleaner records for accountants and business owners',
              'Faster answers from existing financial data',
              'A more secure workflow for active accounts',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl border border-border-primary bg-bg-secondary p-3 text-sm text-text-secondary">
                <LuCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(212,232,255,0.55),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(218,119,86,0.16),transparent_55%)]" />

      <header className="sticky top-0 z-20 border-b border-border-primary bg-bg-primary/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-14 w-14 md:h-16 md:w-16" size={1600} />
            <div>
              <p className="text-base font-semibold text-text-primary md:text-lg">Accountant&apos;s Best Friend</p>
              <p className="text-xs uppercase tracking-[0.22em] text-text-muted">Expense clarity for modern businesses</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/pricing" className="hidden text-sm font-medium text-text-secondary transition-colors hover:text-text-primary md:inline-flex">
              Pricing
            </Link>
            <Link href="/login" className="hidden text-sm font-medium text-text-secondary transition-colors hover:text-text-primary md:inline-flex">
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
            >
              Start Free
            </Link>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="relative flex h-8 w-16 items-center rounded-full border-2 border-accent-primary bg-bg-tertiary p-1 transition-all hover:scale-105 focus:outline-none"
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
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">
              Features And Capabilities
            </div>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-text-primary md:text-6xl">
              One homepage that explains exactly what your accounting platform can do.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Accountant&apos;s Best Friend helps customers import expenses, organize business records, review trends, secure account access, and export clean financial output without living in spreadsheets.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-primary px-7 py-4 text-base font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
              >
                Open The App
                <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-border-primary px-7 py-4 text-base font-medium text-text-primary transition-colors hover:bg-bg-secondary"
              >
                View Plans
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Imports', 'CSV, receipts, attachments'],
                ['Exports', 'Excel, CSV, QBO'],
                ['Controls', 'MFA, admin, signup protection'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border-primary bg-bg-secondary/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <WorkflowDiagram />
            <CapabilityMap />
          </div>
        </section>

        <section className="border-y border-border-primary bg-bg-secondary py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="section-kicker">Core Features</p>
                <h2 className="mt-2 text-3xl font-bold text-text-primary md:text-4xl">A public homepage that speaks in product terms</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-text-secondary">
                This front page now acts as the main website experience, focusing on capabilities, workflow, outputs, and platform trust instead of a minimal marketing splash.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {capabilities.map((item) => (
                <div key={item.title} className="rounded-3xl border border-border-primary bg-bg-primary p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 lg:grid-cols-3">
            {featureBands.map((band) => (
              <div key={band.title} className="rounded-3xl border border-border-primary bg-bg-secondary p-6">
                <p className="section-kicker">Capability Band</p>
                <h3 className="mt-3 text-2xl font-semibold text-text-primary">{band.title}</h3>
                <p className="mt-4 text-sm leading-7 text-text-secondary">{band.body}</p>
                <div className="mt-5 space-y-3">
                  {band.points.map((point) => (
                    <div key={point} className="flex items-start gap-2 text-sm text-text-secondary">
                      <LuCheck className="mt-1 h-4 w-4 flex-shrink-0 text-success" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border-primary bg-bg-secondary py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="section-kicker">Main Website</p>
            <h2 className="mt-3 text-3xl font-bold text-text-primary md:text-4xl">
              The public site now leads with features, structure, and trust.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-text-secondary">
              Visitors can understand the platform faster, see how their bookkeeping moves through the system, and head straight into the product when they are ready.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-primary px-8 py-4 text-base font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
              >
                Try Accountant&apos;s Best Friend
                <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-border-primary px-8 py-4 text-base font-medium text-text-primary transition-colors hover:bg-bg-primary"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
