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
import { supabase } from '@/lib/supabase';

// Pages accessible even when trial/subscription has expired
const SUBSCRIPTION_EXEMPT = ['/subscribe', '/settings/security', '/settings/admin', '/mfa/verify', '/mfa/setup', '/onboard', '/setup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, mfaRequired, mfaSetupRequired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [subLoading, setSubLoading] = useState(true);
  const [subBlocked, setSubBlocked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
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
    if (mfaSetupRequired && pathname !== '/mfa/setup') {
      router.push('/mfa/setup');
      return;
    }
    if (mfaSetupRequired) {
      setSubLoading(false);
      return;
    }

    const checkSub = async () => {
      try {
        // Resolve user's account via account_users table (graceful if table doesn't exist yet)
        let resolvedAccountId: string | undefined;
        try {
          const { data: accountUser } = await supabase
            .from('account_users')
            .select('account_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();
          resolvedAccountId = accountUser?.account_id as string | undefined;
        } catch {
          // account_users table may not exist yet (pre-migration) — fall through to legacy flow
        }

        // Check if account needs onboarding (name is a fallback value)
        if (resolvedAccountId && !SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p))) {
          try {
            const { data: account } = await supabase
              .from('accounts')
              .select('name, domain')
              .eq('id', resolvedAccountId)
              .single();

            if (account) {
              const name = (account.name as string) ?? '';
              const domain = (account.domain as string) ?? '';
              if (!name || name === 'Unknown' || name === domain) {
                const setupSeenKey = resolvedAccountId
                  ? `abf-setup-wizard-seen:${resolvedAccountId}`
                  : null;
                const setupAlreadyShown = setupSeenKey
                  ? window.localStorage.getItem(setupSeenKey) === 'true'
                  : false;

                if (!setupAlreadyShown && pathname !== '/setup' && pathname !== '/onboard') {
                  if (setupSeenKey) window.localStorage.setItem(setupSeenKey, 'true');
                  router.push('/setup');
                  setSubLoading(false);
                  return;
                }
              }
            }
          } catch {
            // accounts table may not exist yet — skip onboard check
          }
        }

        let sub = resolvedAccountId
          ? await getSubscription(user.id, resolvedAccountId)
          : await getSubscription(user.id);
        let shouldSeedSampleData = false;

        // Team members can inherit access from the account owner without creating
        // their own subscription row first. Run enrollment first so member_user_id
        // is set before the expiry check in findOwnerSubscription runs.
        if (!sub) {
          try { await supabase.rpc('mark_team_member_enrolled'); } catch { /* ignore */ }
          const ownerSub = await findOwnerSubscription(user.id);
          if (ownerSub && isAccessAllowed(ownerSub)) {
            setSubBlocked(false);
            setSubLoading(false);
            return;
          }
        }

        // New user — create trial (defensive edge case for users with no account)
        if (!sub) {
          sub = await createTrialSubscription(user.id, resolvedAccountId);
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
        {
          try { await supabase.rpc('mark_team_member_enrolled'); } catch { /* ignore */ }
          const ownerSub = await findOwnerSubscription(user.id);
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
  }, [user, loading, mfaRequired, mfaSetupRequired, pathname, router]);

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

  if (!user || mfaRequired || mfaSetupRequired) return null;

  if (subBlocked && !SUBSCRIPTION_EXEMPT.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return <>{children}</>;
}
