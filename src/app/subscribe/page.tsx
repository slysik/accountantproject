'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { LuCheck, LuClock, LuTriangle, LuCircleAlert } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';
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

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';
const PLAN_ORDER: Exclude<Plan, 'trial'>[] = ['individual', 'business', 'elite', 'vps'];

const PLAN_COLORS: Record<Exclude<Plan, 'trial'>, { bg: string; border: string; btn: string }> = {
  individual: { bg: '#edfaf4', border: '#b6ead0', btn: '#16a34a' },
  business:   { bg: '#fff4ed', border: '#f5cba7', btn: '#d97706' },
  elite:      { bg: '#f3f0ff', border: '#ccc0f5', btn: '#7c3aed' },
  vps:        { bg: '#edf5ff', border: '#a8cdfa', btn: '#2563eb' },
};

export default function SubscribePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getSubscription(user.id).then((s) => {
      setSub(s);
      setLoading(false);
    });
  }, [user]);

  const activatePlan = async (plan: Exclude<Plan, 'trial'>) => {
    if (!user) return;
    setActivating(plan);
    setError('');
    try {
      await selectPlan(user.id, plan);
      router.push('/dashboard');
    } catch {
      setError('Failed to activate plan. Please contact support.');
      setActivating(null);
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
  const paypalConfigured = !!PAYPAL_CLIENT_ID;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <div className="flex items-center gap-2">
          <SiteLogo className="h-14 w-14" size={56} />
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
                <button onClick={() => signOut()} className="underline hover:text-text-primary">
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
                Lock in a plan now and keep your data forever. Payment is processed securely via PayPal.
              </p>
            </div>
          </div>
        )}

        <h1 className="mb-2 text-center text-3xl font-bold text-text-primary">Choose your plan</h1>
        <p className="mb-10 text-center text-text-muted">
          All plans are month-to-month. Cancel any time.
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
            <LuCircleAlert className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Plan cards */}
        <PayPalScriptProvider
          options={paypalConfigured ? { clientId: PAYPAL_CLIENT_ID, currency: 'USD' } : { clientId: 'disabled' }}
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((key) => {
              const plan = PLANS[key];
              const isPopular = key === 'business';
              const isActivating = activating === key;

              const colors = PLAN_COLORS[key];
              return (
                <div
                  key={key}
                  className="relative flex flex-col rounded-2xl border p-7"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: colors.btn }}>
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h2 className="mb-1 text-base font-bold text-text-primary">{plan.name}</h2>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: colors.btn }}>${plan.price}</span>
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

                  {key === 'vps' && (
                    <div className="mb-6 rounded-xl border border-accent-primary/25 bg-accent-primary/10 px-3 py-3 text-xs text-text-secondary">
                      Includes the full Elite capability set, but deployed as your own secured Accountant&apos;s Best Friend instance on your own server.
                    </div>
                  )}

                  <div className="mt-auto space-y-3">
                    {/* PayPal button */}
                    {paypalConfigured ? (
                      <div className={activating && activating !== key ? 'pointer-events-none opacity-50' : ''}>
                        <PayPalButtons
                          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'buynow', height: 40 }}
                          disabled={!!activating}
                          createOrder={async () => {
                            const res = await fetch('/api/paypal/create-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plan: key }),
                            });
                            const data = await res.json() as { id?: string; error?: string };
                            if (!data.id) throw new Error(data.error ?? 'Failed to create order');
                            return data.id;
                          }}
                          onApprove={async (data) => {
                            setActivating(key);
                            setError('');
                            const res = await fetch('/api/paypal/capture-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderID: data.orderID }),
                            });
                            const result = await res.json() as { ok?: boolean; error?: string };
                            if (!result.ok) {
                              setError(result.error ?? 'Payment capture failed. Please contact support.');
                              setActivating(null);
                              return;
                            }
                            await activatePlan(key);
                          }}
                          onError={() => {
                            setError('PayPal encountered an error. Please try again.');
                          }}
                        />
                      </div>
                    ) : (
                      /* Fallback: direct activation when PayPal not configured */
                      <button
                        onClick={() => activatePlan(key)}
                        disabled={!!activating}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60 hover:opacity-90"
                        style={{ backgroundColor: colors.btn }}
                      >
                        {isActivating ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          `Select ${plan.name}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PayPalScriptProvider>

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
