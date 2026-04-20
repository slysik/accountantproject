'use client';

import Link from 'next/link';
import { LuCheck, LuArrowRight, LuSun, LuMoon, LuZap, LuCreditCard } from 'react-icons/lu';
import { useTheme } from '@/lib/theme';
import { PLANS } from '@/lib/subscription';
import PublicFooter from '@/components/PublicFooter';
import SiteLogo from '@/components/SiteLogo';

const plans = [
  {
    key: 'individual' as const,
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
  {
    key: 'vps' as const,
    badge: 'Private Server',
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
          <SiteLogo className="h-14 w-14" size={56} />
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
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-5 py-2 text-sm font-semibold text-accent-primary">
          <LuZap className="h-4 w-4" />
          Start FREE for 30 days – no credit card required
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-text-primary">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-text-muted">
          Pick the plan that fits your practice. Upgrade or cancel any time.
        </p>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
                    <span className="whitespace-nowrap rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-bg-primary">
                      {badge}
                    </span>
                  </div>
                )}

                <div className="mb-6 h-20">
                  <h2 className="mb-1 text-lg font-bold text-text-primary">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-sm text-text-muted">/month</span>
                  </div>
                </div>

                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
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
                  <div className="mb-3 text-xs text-text-muted">
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
                  {key === 'vps' && (
                    <div className="mb-3 rounded-xl border border-accent-primary/25 bg-accent-primary/10 px-3 py-2 text-xs text-text-secondary">
                      Run Accountant&apos;s Best Friend on your own secured server with isolated infrastructure and the highest plan capabilities.
                    </div>
                  )}
                  {/* Buy it now — signup then straight to Stripe checkout */}
                  <Link
                    href={`/login?mode=signup&plan=${key}`}
                    className={`mb-2 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
                      highlight
                        ? 'bg-accent-primary text-bg-primary hover:bg-accent-dark'
                        : 'bg-accent-primary text-bg-primary hover:bg-accent-dark'
                    }`}
                  >
                    <LuCreditCard className="h-4 w-4" />
                    Buy it now
                  </Link>
                  {/* Free trial secondary option */}
                  <Link
                    href="/login?mode=signup"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-primary px-6 py-2.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                  >
                    Start free trial
                    <LuArrowRight className="h-3.5 w-3.5" />
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
                a: 'Each imported expense row counts as one transaction. Individual includes unlimited transactions.',
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No contracts, no lock-in. All plans are month-to-month and you can cancel any time.',
              },
              {
                q: 'What is the Virtual Private Server plan?',
                a: 'The VPS plan includes everything in Elite, plus your own secured copy of Accountant\'s Best Friend running on your own server environment.',
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
