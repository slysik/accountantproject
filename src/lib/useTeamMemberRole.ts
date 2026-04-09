'use client';

import { useEffect, useState } from 'react';
import { getMyTeamRole, getSubscription, isAccessAllowed, type TeamRole } from './subscription';

/**
 * Returns the current user's effective role:
 * - 'owner'       — user has their own active subscription
 * - 'admin'       — team member with admin role
 * - 'contributor' — team member with contributor role
 * - 'viewer'      — team member with viewer role
 * - null          — still loading
 */
export type EffectiveRole = 'owner' | TeamRole;

export function useTeamMemberRole(userId: string | undefined, email: string | undefined): EffectiveRole | null {
  const [role, setRole] = useState<EffectiveRole | null>(null);

  useEffect(() => {
    if (!userId || !email) return;

    let cancelled = false;

    async function resolve() {
      const ownSub = await getSubscription(userId!);
      if (!cancelled && ownSub && isAccessAllowed(ownSub)) {
        setRole('owner');
        return;
      }
      const teamRole = await getMyTeamRole(email!);
      if (!cancelled) setRole(teamRole ?? 'viewer');
    }

    void resolve();
    return () => { cancelled = true; };
  }, [userId, email]);

  return role;
}
