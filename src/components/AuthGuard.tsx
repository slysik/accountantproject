'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  getSubscription,
  createTrialSubscription,
  isAccessAllowed,
} from '@/lib/subscription';

// Pages that are accessible even when the trial/subscription has expired
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
    // Check subscription (skip for exempt pages)
    if (mfaRequired) {
      setSubLoading(false);
      return;
    }
    const checkSub = async () => {
      try {
        let sub = await getSubscription(user.id);
        if (!sub) {
          sub = await createTrialSubscription(user.id);
        }
        const allowed = isAccessAllowed(sub);
        setSubBlocked(!allowed);
        if (!allowed && !SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p))) {
          router.push('/subscribe');
        }
      } catch {
        // If subscription check fails, allow access (fail open)
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

  if (!user || mfaRequired) {
    return null;
  }

  // If subscription is blocked but we're on an exempt page, still render
  if (subBlocked && !SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return <>{children}</>;
}
