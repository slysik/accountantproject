'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuChartBar, LuCheck, LuArrowRight, LuClock, LuTriangle } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import {
  getSubscription,
  selectPlan,
  trialDaysRemaining,
  isTrialExpired,
  PLANS,
  type Subscription,
  type Plan,
} from '@/lib/subscription';

const PLAN_ORDER: Exclude<Plan, 'trial'>[] = ['personal', 'lite', 'business', 'elite'];

export default function SubscribePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getSubscription(user.id).then((s) => {
      setSub(s);
      setLoading(false);
    });
  }, [user]);

  const handleSelect = async (plan: Exclude<Plan, 'trial'>) => {
    if (!user) return;
    setSelecting(plan);
    setError('');
    try {
      await selectPlan(user.id, plan);
      router.push('/dashboard');
    } catch {
      setError('Failed to activate plan. Please try again.');
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
      </div>
    );
  }

  const expired = sub ? isTrialExpired(sub) : true;
  const daysLeft = sub ? trialDaysRemaining(sub) : 0;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <div className="flex items-center gap-2">
          <LuChartBar className="h-6 w-6 text-accent-primary" />
          <span className="text-base font-semibold">Accountant&apos;s Best Friend</span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Status banner */}
        {expired ? (
          <div className="mb-10 flex items-start gap-3 rounded-xl border border-error/40 bg-error/10 px-5 py-4">
            <LuTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
            <div>
              <p className="font-semibold text-text-primary">Your free trial has ended</p>
              <p className="mt-1 text-sm text-text-muted">
                Choose a plan below to keep your data and continue. Not ready?{' '}
                <button
                  onClick={() => signOut()}
                  className="underline hover:text-text-primary"
                >
                  Sign out
                </button>{' '}
                — your data will be waiting if you come back within 30 days.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-10 flex items-start gap-3 rounded-xl border border-accent-primary/30 bg-accent-primary/10 px-5 py-4">
            <LuClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-primary" />
            <div>
              <p className="font-semibold text-text-primary">
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Lock in a plan now and keep your data forever. All plans include everything from the trial.
              </p>
            </div>
          </div>
        )}

        <h1 className="mb-2 text-center text-3xl font-bold text-text-primary">
          Choose your plan
        </h1>
        <p className="mb-10 text-center text-text-muted">
          All plans include a 30-day free trial for new accounts.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_ORDER.map((key, idx) => {
            const plan = PLANS[key];
            const isPopular = key === 'business';
            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  isPopular
                    ? 'border-accent-primary bg-accent-primary/5'
                    : 'border-border-primary bg-bg-secondary'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-bg-primary">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h2 className="mb-1 text-base font-bold text-text-primary">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-xs text-text-muted">/mo</span>
                  </div>
                </div>
                <ul className="mb-6 flex flex-col gap-2">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <LuCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(key)}
                  disabled={!!selecting}
                  className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    isPopular
                      ? 'bg-accent-primary text-bg-primary hover:bg-accent-dark'
                      : 'border border-border-primary text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  {selecting === key ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      Select {plan.name}
                      <LuArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          No contracts. Cancel any time.{' '}
          <a href="/pricing" className="underline hover:text-text-primary">
            Compare full plan details
          </a>
        </p>
      </div>
    </div>
  );
}
