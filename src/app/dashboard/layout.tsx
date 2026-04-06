'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapse sidebar by default on mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    if (mq.matches) setSidebarCollapsed(true);

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setSidebarCollapsed(true);
        setMobileOpen(false);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-bg-primary">
        {/* Mobile overlay backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar: hidden on mobile unless mobileOpen, always visible on md+ */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 md:relative md:z-auto
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
          />
        </div>

        {/* Right: TopNav + Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav onMobileMenuToggle={toggleMobileSidebar} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
