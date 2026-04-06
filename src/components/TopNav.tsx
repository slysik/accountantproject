'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { decodeCompanySlug, isMonthSegment, isYearSegment } from '@/lib/company';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/useSubscription';
import { LuChartBar, LuChevronRight, LuWand, LuMenu, LuShield, LuSun, LuMoon, LuClock } from 'react-icons/lu';
import { PLANS } from '@/lib/subscription';

const MONTH_NAMES: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
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
      label: segments[1] === 'wizard' ? 'Wizard' : 'Trash',
      href: `/dashboard/${segments[1]}`,
    });
  } else if (segments.length >= 2) {
    const companySlug = segments[1];
    crumbs.push({
      label: decodeCompanySlug(companySlug),
      href: `/dashboard/${companySlug}`,
    });
  }

  if (segments.length >= 3 && segments[1] !== 'wizard' && segments[1] !== 'trash') {
    const companySlug = segments[1];
    const year = segments[2];
    if (isYearSegment(year)) {
      crumbs.push({ label: year, href: `/dashboard/${companySlug}/${year}` });
    }
  }

  if (segments.length >= 4 && segments[1] !== 'wizard' && segments[1] !== 'trash') {
    const companySlug = segments[1];
    const year = segments[2];
    const month = segments[3];
    if (isYearSegment(year) && isMonthSegment(month)) {
      const monthName = MONTH_NAMES[month] ?? month;
      crumbs.push({ label: monthName, href: `/dashboard/${companySlug}/${year}/${month}` });
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {index > 0 && (
            <LuChevronRight className="h-3.5 w-3.5 text-text-muted" />
          )}
          {index === crumbs.length - 1 ? (
            <span className="text-text-primary font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

interface TopNavProps {
  onMobileMenuToggle?: () => void;
}

export default function TopNav({ onMobileMenuToggle }: TopNavProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { sub } = useSubscription(user?.id);
  const planLabel = sub?.plan === 'trial'
    ? 'Trial'
    : sub?.plan
      ? PLANS[sub.plan]?.name ?? sub.plan
      : 'Account';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-primary bg-bg-secondary px-4 md:px-6">
      {/* Left: Hamburger (mobile) + Logo / App Name */}
      <div className="flex items-center gap-2">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary md:hidden"
            aria-label="Toggle sidebar"
          >
            <LuMenu className="h-5 w-5" />
          </button>
        )}
        <LuChartBar className="h-5 w-5 text-accent-primary" />
        <span className="text-sm font-semibold text-text-primary hidden md:inline">
          Accountant&apos;s Best Friend
        </span>
      </div>

      {/* Center: Breadcrumbs */}
      <div className="flex-1 flex justify-center">
        <Breadcrumbs />
      </div>

      {/* Right: User info + Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={sub?.plan === 'trial' ? '/subscribe' : '/settings/account'}
          className="hidden items-center gap-1 rounded-lg border border-accent-primary/40 bg-accent-primary/10 px-2.5 py-1 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/20 sm:flex"
          title="Account type"
        >
          <LuClock className="h-3 w-3" />
          {planLabel}
        </Link>
        <Link
          href="/dashboard/wizard"
          className="flex items-center gap-1.5 rounded-lg bg-accent-primary px-3 py-1.5 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
        >
          <LuWand className="h-3.5 w-3.5" />
          Start Wizard
        </Link>
        <Link
          href="/settings/security"
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
          title="Security Settings"
        >
          <LuShield className="h-4 w-4" />
        </Link>

        {/* ☀️ / 🌙 Theme toggle — quirky pill button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex h-8 w-16 items-center rounded-full border-2 border-accent-primary bg-bg-tertiary p-1 transition-all hover:scale-105 hover:shadow-[0_0_12px_var(--accent-primary)] focus:outline-none"
        >
          {/* sliding pill */}
          <span
            className={`absolute h-5 w-5 rounded-full bg-accent-primary shadow transition-all duration-300 ${
              theme === 'light' ? 'translate-x-8' : 'translate-x-0'
            }`}
          />
          <LuMoon className="absolute left-1.5 h-3 w-3 text-text-muted" />
          <LuSun className="absolute right-1.5 h-3 w-3 text-text-muted" />
        </button>
        {user?.email && (
          <span className="text-xs text-text-muted hidden lg:inline">
            {user.email}
          </span>
        )}
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
