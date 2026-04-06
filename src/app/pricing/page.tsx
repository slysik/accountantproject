'use client';

import Link from 'next/link';
import { LuChartBar, LuCheck, LuArrowRight, LuSun, LuMoon, LuZap } from 'react-icons/lu';
import { useTheme } from '@/lib/theme';
import { PLANS } from '@/lib/subscription';
import PublicFooter from '@/components/PublicFooter';

const plans = [
  {
    key: 'lite' as const,
    badge: null,
    highlight: false,
  },
  {
    key: 'business' as const,
    badge: 'Most Popular',
    highlight: true,
  },
  {
    key: 'elite' as const,
    badge: null,
    highlight: false,
  },
];

export default function PricingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">

      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <LuChartBar className="h-6 w-6 text-accent-primary" />
          <span className="text-base font-semibold">Accountant&apos;s Best Friend</span>
        </Link>
        <div className="flex items-center gap-3">
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
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-4 py-1.5 text-xs font-medium text-accent-primary">
          <LuZap className="h-3 w-3" />
          Start free for 30 days — no credit card required
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-text-primary">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-text-muted">
          Pick the plan that fits your practice. Upgrade or cancel any time.
        </p>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map(({ key, badge, highlight }) => {
            const plan = PLANS[key];
            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  highlight
                    ? 'border-accent-primary bg-accent-primary/5 shadow-[0_0_32px_var(--accent-primary)/20]'
                    : 'border-border-primary bg-bg-secondary'
                }`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-bg-primary">
                      {badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="mb-1 text-lg font-bold text-text-primary">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                </div>

                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Includes
                </div>
                <ul className="mb-8 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <LuCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <div className="mb-2 text-xs text-text-muted">
                    {plan.maxUsers === 1
                      ? '1 user'
                      : `Up to ${plan.maxUsers} users`}
                    {plan.maxTransactions !== null
                      ? ` · ${plan.maxTransactions} transactions/month`
                      : ' · Unlimited transactions'}
                    {plan.maxYears !== null
                      ? ` · ${plan.maxYears} years`
                      : ' · Unlimited years'}
                  </div>
                  <Link
                    href="/login"
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                      highlight
                        ? 'bg-accent-primary text-bg-primary hover:bg-accent-dark'
                        : 'border border-border-primary text-text-primary hover:bg-bg-tertiary'
                    }`}
                  >
                    Start free trial
                    <LuArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ / notes */}
        <div className="mt-16 rounded-2xl border border-border-primary bg-bg-secondary p-8">
          <h3 className="mb-6 text-center text-lg font-semibold text-text-primary">
            Common questions
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                q: 'What happens after my 30-day trial?',
                a: 'After 30 days you\u2019ll be prompted to choose a plan. Your data is safe — you can also export everything before deciding.',
              },
              {
                q: 'Can I switch plans later?',
                a: 'Yes. You can upgrade or downgrade any time from your account settings.',
              },
              {
                q: 'What counts as a transaction?',
                a: 'Each imported expense row counts as one transaction. Lite plan caps at 500 total.',
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No contracts, no lock-in. All plans are month-to-month and you can cancel any time.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="mb-1 text-sm font-semibold text-text-primary">{q}</p>
                <p className="text-sm text-text-muted">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
