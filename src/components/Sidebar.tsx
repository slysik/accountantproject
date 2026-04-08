'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  LuChevronLeft,
  LuChevronRight,
  LuTrash2,
} from 'react-icons/lu';
import FolderTree from './FolderTree';
import { APP_VERSION } from '@/lib/version';
import { useTheme } from '@/lib/theme';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { theme } = useTheme();
  return (
    <aside
      className={`relative flex h-full flex-col overflow-hidden border-r border-border-primary/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg-secondary)_92%,transparent),color-mix(in_srgb,var(--bg-primary)_92%,transparent))] shadow-[24px_0_60px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[60px]' : 'w-[280px]'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_68%)]" />

      {/* Top: Toggle Button */}
      <div className={`relative flex items-center border-b border-border-primary/80 p-3 ${collapsed ? 'flex-col gap-2 justify-center' : 'justify-between'}`}>
        {collapsed && (
          <Image
            src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
            alt="Accountant's Best Friend"
            width={200}
            height={200}
            className="h-14 w-14 rounded-lg object-cover"
            unoptimized
          />
        )}
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Image
              src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
              alt="Accountant's Best Friend"
              width={200}
              height={200}
              className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
              unoptimized
            />
            <div>
              <p className="font-display text-sm font-bold text-text-primary">Navigator</p>
              <p className="text-[11px] text-text-muted">Companies and folders</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded-xl border border-border-primary/70 bg-bg-primary/55 p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <LuChevronRight className="h-4 w-4" />
          ) : (
            <LuChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Middle: Folder Tree */}
      <div className="relative flex-1 overflow-y-auto p-3">
        <FolderTree collapsed={collapsed} />
      </div>

      {/* Bottom: Trash Link + Version */}
      <div className="border-t border-border-primary/80 p-3">
        <Link
          href="/dashboard/trash"
          className={`flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-text-muted transition-all hover:border-border-primary/70 hover:bg-bg-tertiary/70 hover:text-text-secondary ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Trash' : undefined}
        >
          <LuTrash2 className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Trash</span>}
        </Link>
        <div
          className={`mt-3 rounded-2xl border border-border-primary/70 bg-bg-primary/55 px-3 py-2 text-xs text-text-muted ${
            collapsed ? 'text-center' : ''
          }`}
          title={`Version ${APP_VERSION}`}
        >
          {collapsed ? APP_VERSION : `Release ${APP_VERSION}`}
        </div>
      </div>
    </aside>
  );
}
