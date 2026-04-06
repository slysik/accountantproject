'use client';

import { useEffect, useState } from 'react';
import { getSubscription, type Subscription } from './subscription';

export function useSubscription(userId: string | undefined) {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!userId) return;
    getSubscription(userId).then(setSub);
  }, [userId]);

  return { sub };
}
