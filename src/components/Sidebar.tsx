'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LuTrash2, LuSettings, LuLayoutDashboard, LuTags, LuCircleHelp, LuClipboardList } from 'react-icons/lu';
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
  const { user } = useAuth();
  const { sub } = useSubscription(user?.id, user?.email);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const planLabel = sub?.plan === 'trial'
    ? 'Trial'
    : sub?.plan
      ? PLANS[sub.plan]?.name ?? sub.plan
      : 'Account';
  const licenseExpiry = sub?.plan_expires_at ?? sub?.trial_ends_at ?? null;
  const formattedLicenseExpiry = licenseExpiry
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(licenseExpiry))
    : 'N/A';

  return (
    <aside
      className="relative flex h-full w-[260px] flex-col border-r"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 py-2"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="flex w-full max-w-[208px] items-center justify-center gap-3 text-left">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border p-1.5"
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
              className="h-7 w-7 rounded-lg object-contain opacity-95"
              style={{
                filter: theme === 'dark'
                  ? 'saturate(0.9) contrast(1.02)'
                  : 'saturate(0.82) contrast(0.96)',
              }}
              unoptimized
            />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-semibold leading-none text-text-primary">Accountant&apos;s Best Friend</p>
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
      <div className="flex-1 overflow-y-auto px-2 pt-2">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Companies
        </p>
        <FolderTree />
      </div>

      {/* Bottom: Manage section */}
      <div className="flex flex-shrink-0 flex-col border-t px-2 py-3" style={{ borderColor: 'var(--border-primary)' }}>
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
          Manage
        </p>
        <Link
          href="/dashboard/trash"
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            isActive('/dashboard/trash')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuTrash2 className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Trash</span>
        </Link>
        <Link
          href="/settings/account"
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            isActive('/settings')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuSettings className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Settings</span>
        </Link>
        <Link
          href="/settings/categories"
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            isActive('/settings/categories')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuTags className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Categories</span>
        </Link>
        <Link
          href="/settings/audit"
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            isActive('/settings/audit')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuClipboardList className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Audit</span>
        </Link>
        <Link
          href="/settings/help"
          className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            isActive('/settings/help')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <LuCircleHelp className="h-4.5 w-4.5 flex-shrink-0" />
          <span>Help</span>
        </Link>

        <div className="mt-2 rounded-lg bg-bg-tertiary/40 px-3 py-2">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-muted">Plan</span>
            <span className="text-sm font-medium text-text-primary">{planLabel}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-muted">Version</span>
            <span className="text-sm font-medium text-text-primary">v{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-muted">License Expiry</span>
            <span className="text-sm font-medium text-text-primary">{formattedLicenseExpiry}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
