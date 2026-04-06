'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ensureSampleCompanyForFirstLogin } from '@/lib/database';
import {
  getSubscription,
  createTrialSubscription,
  isAccessAllowed,
  findOwnerSubscription,
} from '@/lib/subscription';

// Pages accessible even when trial/subscription has expired
const SUBSCRIPTION_EXEMPT = ['/subscribe', '/settings/security', '/mfa/verify'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, mfaRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [subLoading, setSubLoading] = useState(true);
  const [subBlocked, setSubBlocked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (mfaRequired && pathname !== '/mfa/verify') {
      router.push('/mfa/verify');
      return;
    }
    if (mfaRequired) {
      setSubLoading(false);
      return;
    }

    const checkSub = async () => {
      try {
        let sub = await getSubscription(user.id);
        let shouldSeedSampleData = false;

        // Team members can inherit access from the account owner without creating
        // their own subscription row first.
        if (!sub && user.email) {
          const ownerSub = await findOwnerSubscription(user.email);
          if (ownerSub && isAccessAllowed(ownerSub)) {
            setSubBlocked(false);
            setSubLoading(false);
            return;
          }
        }

        // New user — create trial
        if (!sub) {
          sub = await createTrialSubscription(user.id);
          shouldSeedSampleData = true;
        }

        if (shouldSeedSampleData) {
          try {
            await ensureSampleCompanyForFirstLogin(user.id);
          } catch (seedError) {
            console.error('Failed to seed first-login sample company:', seedError);
          }
        }

        if (isAccessAllowed(sub)) {
          setSubBlocked(false);
          setSubLoading(false);
          return;
        }

        // Own subscription expired — check if they're a member of another active account
        if (user.email) {
          const ownerSub = await findOwnerSubscription(user.email);
          if (ownerSub && isAccessAllowed(ownerSub)) {
            setSubBlocked(false);
            setSubLoading(false);
            return;
          }
        }

        // Truly blocked
        setSubBlocked(true);
        if (!SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p))) {
          router.push('/subscribe');
        }
      } catch {
        // Fail open — don't lock out users if subscription check errors
        setSubBlocked(false);
      } finally {
        setSubLoading(false);
      }
    };

    checkSub();
  }, [user, loading, mfaRequired, pathname, router]);

  if (loading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || mfaRequired) return null;

  if (subBlocked && !SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return <>{children}</>;
}
