'use client';

import { useEffect, useState } from 'react';
import { findOwnerAccountUserId, getSubscription, isAccessAllowed } from './subscription';

export function useEffectiveAccountUserId(userId: string | undefined, email?: string) {
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(userId ?? null);

  useEffect(() => {
    if (!userId) {
      setEffectiveUserId(null);
      return;
    }

    let cancelled = false;

    async function resolveEffectiveUserId() {
      // If the user has their own active subscription, always use their own ID.
      // Only fall back to looking up an owner when the user is a pure team member
      // with no subscription of their own (e.g. an invited collaborator).
      const ownSub = await getSubscription(userId!);
      if (ownSub && isAccessAllowed(ownSub)) {
        if (!cancelled) setEffectiveUserId(userId ?? null);
        return;
      }

      if (!email) {
        if (!cancelled) setEffectiveUserId(userId ?? null);
        return;
      }

      const ownerUserId = await findOwnerAccountUserId(email);
      if (!cancelled) {
        setEffectiveUserId(ownerUserId ?? userId ?? null);
      }
    }

    void resolveEffectiveUserId();

    return () => {
      cancelled = true;
    };
  }, [email, userId]);

  return effectiveUserId;
}
