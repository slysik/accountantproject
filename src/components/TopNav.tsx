'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { decodeCompanySlug, decodeFolderSlug, isMonthSegment, isYearSegment } from '@/lib/company';
import { useTheme } from '@/lib/theme';
import { LuChevronRight, LuWand, LuSun, LuMoon } from 'react-icons/lu';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'Dashboard', href: '/dashboard' });
  }

  if (segments[1] === 'wizard' || segments[1] === 'trash') {
    crumbs.push({
      label: segments[1] === 'wizard' ? 'Import Wizard' : 'Trash',
      href: `/dashboard/${segments[1]}`,
    });
  } else if (segments.length >= 2) {
    crumbs.push({
      label: decodeCompanySlug(segments[1]),
      href: `/dashboard/${segments[1]}`,
    });
  }

  if (segments.length >= 3 && segments[1] !== 'wizard' && segments[1] !== 'trash') {
    const year = segments[2];
    if (isYearSegment(year)) {
      crumbs.push({ label: year, href: `/dashboard/${segments[1]}/${year}` });
    }
  }

  if (segments.length >= 4 && segments[1] !== 'wizard' && segments[1] !== 'trash') {
    const year = segments[2];
    const month = segments[3];
    if (isYearSegment(year) && isMonthSegment(month)) {
      crumbs.push({
        label: MONTH_NAMES[month] ?? month,
        href: `/dashboard/${segments[1]}/${year}/${month}`,
      });
    }
  }

  if (segments.length >= 5 && segments[1] !== 'wizard' && segments[1] !== 'trash') {
    const year = segments[2];
    if (isYearSegment(year) && segments[3] === 'subfolder') {
      crumbs.push({
        label: 'Subfolder',
        href: `/dashboard/${segments[1]}/${year}/subfolder`,
      });
      crumbs.push({
        label: decodeFolderSlug(segments[4]),
        href: `/dashboard/${segments[1]}/${year}/subfolder/${segments[4]}`,
      });
    }
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index > 0 && <LuChevronRight className="h-3 w-3 text-text-muted" />}
          {index === crumbs.length - 1 ? (
            <span className="text-xs font-medium text-text-primary">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-xs text-text-muted transition-colors hover:text-text-secondary">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function TopNav() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between border-b px-4"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Left: breadcrumbs */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Import wizard */}
        <Link
          href="/dashboard/wizard"
          className="flex items-center gap-1.5 rounded-md bg-accent-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
        >
          <LuWand className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Import</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
        >
          {theme === 'dark' ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />}
        </button>

        {/* User */}
        {user?.email && (
          <span className="hidden text-[11px] text-text-muted lg:block">{user.email}</span>
        )}
      </div>
    </header>
  );
}
