'use client';

import Link from 'next/link';
import {
  LuChevronLeft,
  LuChevronRight,
  LuTrash2,
} from 'react-icons/lu';
import FolderTree from './FolderTree';
import { APP_VERSION } from '@/lib/version';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex h-full flex-col border-r border-border-primary bg-bg-secondary transition-all duration-300 ${
        collapsed ? 'w-[60px]' : 'w-[280px]'
      }`}
    >
      {/* Top: Toggle Button */}
      <div className="flex items-center justify-end border-b border-border-primary p-2">
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
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
      <div className="flex-1 overflow-y-auto p-2">
        <FolderTree collapsed={collapsed} />
      </div>

      {/* Bottom: Trash Link + Version */}
      <div className="border-t border-border-primary p-2">
        <Link
          href="/dashboard/trash"
          className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Trash' : undefined}
        >
          <LuTrash2 className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Trash</span>}
        </Link>
        <div
          className={`mt-2 rounded-md px-2 py-2 text-xs text-text-muted ${
            collapsed ? 'text-center' : ''
          }`}
          title={`Version ${APP_VERSION}`}
        >
          {collapsed ? APP_VERSION : `Version ${APP_VERSION}`}
        </div>
      </div>
    </aside>
  );
}
