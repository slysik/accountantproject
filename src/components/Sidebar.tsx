'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LuTrash2, LuSettings, LuLayoutDashboard } from 'react-icons/lu';
import FolderTree from './FolderTree';
import { APP_VERSION } from '@/lib/version';
import { useTheme } from '@/lib/theme';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { theme } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className="relative flex h-full w-[240px] flex-col border-r"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="flex h-14 flex-shrink-0 items-center border-b px-3"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="flex items-center gap-2.5">
          <Image
            src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
            alt="Accountant's Best Friend"
            width={200}
            height={200}
            className="h-8 w-8 rounded-md object-contain flex-shrink-0"
            unoptimized
          />
          <span className="text-sm font-semibold text-text-primary truncate">ABF</span>
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
      <div className="flex-shrink-0 border-t px-2 py-3" style={{ borderColor: 'var(--border-primary)' }}>
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

        {/* Version */}
        <p className="mt-3 px-2 text-[10px] text-text-muted">
          v{APP_VERSION}
        </p>
      </div>
    </aside>
  );
}
