'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { runContrastGuard } from './contrast-guard';

export type Mode = 'light' | 'dark' | 'auto';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: Mode;
  effective: EffectiveTheme;
  setMode: (m: Mode) => void;
  /** @deprecated use setMode */
  toggleTheme: () => void;
  /** @deprecated use effective */
  theme: EffectiveTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LS_KEY = 'theme-mode';
const LS_LEGACY_KEY = 'theme';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveCookieMode(): Mode | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|; )theme-mode=(light|dark|auto)/);
  return m ? (m[1] as Mode) : null;
}

function getInitialMode(): Mode {
  if (typeof window === 'undefined') return 'light';
  // migrate legacy key
  const legacy = localStorage.getItem(LS_LEGACY_KEY);
  if (legacy && !localStorage.getItem(LS_KEY)) {
    const migrated: Mode = legacy === 'dark' ? 'dark' : 'light';
    localStorage.setItem(LS_KEY, migrated);
    localStorage.removeItem(LS_LEGACY_KEY);
    return migrated;
  }
  const cookie = resolveCookieMode();
  if (cookie) return cookie;
  const saved = localStorage.getItem(LS_KEY) as Mode | null;
  if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
  return 'light';
}

function deriveEffective(mode: Mode): EffectiveTheme {
  if (mode === 'auto') return getSystemTheme();
  return mode;
}

function applyToDOM(effective: EffectiveTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', effective === 'dark');
  root.classList.toggle('light', effective === 'light');
}

function persistMode(mode: Mode) {
  localStorage.setItem(LS_KEY, mode);
  document.cookie = `theme-mode=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

let patchTimer: ReturnType<typeof setTimeout> | null = null;

async function patchProfileMode(mode: Mode) {
  if (patchTimer) clearTimeout(patchTimer);
  patchTimer = setTimeout(async () => {
    try {
      await fetch('/api/profile/ui-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
    } catch {
      // non-critical
    }
  }, 800);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light');
  const [effective, setEffective] = useState<EffectiveTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialMode();
    setModeState(initial);
    setEffective(deriveEffective(initial));
    setMounted(true);
  }, []);

  // Re-derive when system preference changes (only relevant for 'auto')
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      setModeState((prev) => {
        if (prev === 'auto') setEffective(getSystemTheme());
        return prev;
      });
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    applyToDOM(effective);
    // dev-only contrast audit runs 200ms after paint settles
    if (process.env.NODE_ENV !== 'production') {
      const t = setTimeout(runContrastGuard, 200);
      return () => clearTimeout(t);
    }
  }, [effective, mounted]);

  const setMode = useCallback((m: Mode) => {
    const eff = deriveEffective(m);
    setModeState(m);
    setEffective(eff);
    persistMode(m);
    patchProfileMode(m);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(effective === 'dark' ? 'light' : 'dark');
  }, [effective, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, effective, setMode, toggleTheme, theme: effective }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
