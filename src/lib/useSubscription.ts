'use client';

import { useEffect, useState } from 'react';
import { findOwnerSubscription, getSubscription, type Subscription } from './subscription';

export function useSubscription(userId: string | undefined, email?: string) {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;

    let cancelled = false;

    async function loadSubscription() {
      const directSub = await getSubscription(currentUserId);
      if (cancelled) return;

      if (directSub) {
        setSub(directSub);
        return;
      }

      if (email) {
        const ownerSub = await findOwnerSubscription(email);
        if (!cancelled) {
          setSub(ownerSub);
        }
        return;
      }

      setSub(null);
    }

    loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  return { sub };
}
