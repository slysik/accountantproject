'use client';

import { useEffect, useState } from 'react';
import { findOwnerAccountUserId } from './subscription';

export function useEffectiveAccountUserId(userId: string | undefined, email?: string) {
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(userId ?? null);

  useEffect(() => {
    if (!userId) {
      setEffectiveUserId(null);
      return;
    }

    let cancelled = false;

    async function resolveEffectiveUserId() {
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
