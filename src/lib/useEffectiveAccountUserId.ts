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
    const currentUserId = userId;

    let cancelled = false;

    async function resolveEffectiveUserId() {
      // If this user is enrolled in another active owner's account, prefer that
      // account context even when the user also has their own trial row.
      if (email) {
        const ownerUserId = await findOwnerAccountUserId(email);
        if (ownerUserId && ownerUserId !== currentUserId) {
          if (!cancelled) setEffectiveUserId(ownerUserId);
          return;
        }
      }

      const ownSub = await getSubscription(currentUserId);
      if (!cancelled) {
        setEffectiveUserId(ownSub && isAccessAllowed(ownSub) ? currentUserId : currentUserId);
      }
    }

    void resolveEffectiveUserId();

    return () => {
      cancelled = true;
    };
  }, [email, userId]);

  return effectiveUserId;
}
