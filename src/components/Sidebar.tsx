'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LuTrash2, LuSettings, LuLayoutDashboard, LuLogOut } from 'react-icons/lu';
import FolderTree from './FolderTree';
import { APP_VERSION } from '@/lib/version';
import { useTheme } from '@/lib/theme';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/useSubscription';
import { PLANS } from '@/lib/subscription';

export default function Sidebar() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { sub } = useSubscription(user?.id, user?.email);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const planLabel = sub?.plan === 'trial'
    ? 'Trial'
    : sub?.plan
      ? PLANS[sub.plan]?.name ?? sub.plan
      : 'Account';

  return (
    <aside
      className="relative flex h-full w-[260px] flex-col border-r"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="flex h-32 flex-shrink-0 items-center justify-center border-b px-4 py-4"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="flex w-full max-w-[176px] flex-col items-center gap-3 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border p-2"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-primary) 26%, var(--border-primary))',
              backgroundColor: 'color-mix(in srgb, var(--accent-primary) 10%, var(--bg-primary))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <Image
              src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
              alt="Accountant's Best Friend"
              width={800}
              height={800}
              className="h-12 w-12 rounded-xl object-contain flex-shrink-0 opacity-95"
              style={{
                filter: theme === 'dark'
                  ? 'saturate(0.9) contrast(1.02)'
                  : 'saturate(0.82) contrast(0.96)',
              }}
              unoptimized
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none text-text-primary">Accountant&apos;s Best Friend</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">ABF</p>
          </div>
        </div>
      </div>

      {/* Nav: Dashboard */}
      <div className="flex-shrink-0 px-2 pt-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Overview
        </p>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
            pathname === '/dashboard'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuLayoutDashboard className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Nav: Folders */}
      <div className="flex-1 overflow-y-auto px-2 pt-4">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Companies
        </p>
        <FolderTree />
      </div>

      {/* Bottom: Manage section */}
      <div className="flex flex-shrink-0 flex-col border-t px-2 py-3" style={{ borderColor: 'var(--border-primary)' }}>
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Manage
        </p>
        <Link
          href="/dashboard/trash"
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
            isActive('/dashboard/trash')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuTrash2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Trash</span>
        </Link>
        <Link
          href="/settings/account"
          className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
            isActive('/settings')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuSettings className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Settings</span>
        </Link>

        <div className="mt-1 px-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-text-muted">Plan</span>
            <span className="text-xs font-medium text-text-primary">{planLabel}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-text-muted">Version</span>
            <span className="text-xs font-medium text-text-primary">v{APP_VERSION}</span>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-error"
        >
          <LuLogOut className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
