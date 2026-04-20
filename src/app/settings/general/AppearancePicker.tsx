'use client';

import { useCallback } from 'react';
import { useTheme, type Mode } from '@/lib/theme';

// Mini preview tiles matching the reference image aesthetic
function LightPreview() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-sm">
      <div className="flex h-3 items-center gap-1 bg-[#f2ede7] px-1.5">
        <div className="h-1 w-4 rounded-full bg-[#d5c9bd]" />
      </div>
      <div className="flex flex-1">
        <div className="w-4 bg-[#e8e0d6]" />
        <div className="flex flex-1 flex-col gap-1 bg-[#faf8f5] p-1">
          <div className="h-1 w-full rounded-full bg-[#d5c9bd]" />
          <div className="h-1 w-3/4 rounded-full bg-[#e8e0d6]" />
          <div className="mt-auto h-2 w-2 rounded-full bg-[#c4603d]" />
        </div>
      </div>
    </div>
  );
}

function DarkPreview() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-sm">
      <div className="flex h-3 items-center gap-1 bg-[#131110] px-1.5">
        <div className="h-1 w-4 rounded-full bg-[#2e2a25]" />
      </div>
      <div className="flex flex-1">
        <div className="w-4 bg-[#1d1a17]" />
        <div className="flex flex-1 flex-col gap-1 bg-[#0a0907] p-1">
          <div className="h-1 w-full rounded-full bg-[#2e2a25]" />
          <div className="h-1 w-3/4 rounded-full bg-[#1d1a17]" />
          <div className="mt-auto h-2 w-2 rounded-full bg-[#da7756]" />
        </div>
      </div>
    </div>
  );
}

function AutoPreview() {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-sm">
      <div className="flex w-1/2 flex-col">
        <div className="flex h-3 items-center bg-[#f2ede7] px-1">
          <div className="h-1 w-3 rounded-full bg-[#d5c9bd]" />
        </div>
        <div className="flex flex-1">
          <div className="w-2 bg-[#e8e0d6]" />
          <div className="flex flex-1 flex-col gap-1 bg-[#faf8f5] p-0.5">
            <div className="h-1 w-full rounded-full bg-[#d5c9bd]" />
            <div className="mt-auto h-1.5 w-1.5 rounded-full bg-[#c4603d]" />
          </div>
        </div>
      </div>
      <div className="flex w-1/2 flex-col">
        <div className="flex h-3 items-center bg-[#131110] px-1">
          <div className="h-1 w-3 rounded-full bg-[#2e2a25]" />
        </div>
        <div className="flex flex-1">
          <div className="w-2 bg-[#1d1a17]" />
          <div className="flex flex-1 flex-col gap-1 bg-[#0a0907] p-0.5">
            <div className="h-1 w-full rounded-full bg-[#2e2a25]" />
            <div className="mt-auto h-1.5 w-1.5 rounded-full bg-[#da7756]" />
          </div>
        </div>
      </div>
    </div>
  );
}

const OPTIONS: { id: Mode; label: string; Preview: React.FC }[] = [
  { id: 'light', label: 'Light', Preview: LightPreview },
  { id: 'auto',  label: 'Auto',  Preview: AutoPreview  },
  { id: 'dark',  label: 'Dark',  Preview: DarkPreview  },
];

export default function AppearancePicker() {
  const { mode, setMode } = useTheme();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setMode(OPTIONS[(idx + 1) % OPTIONS.length].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setMode(OPTIONS[(idx - 1 + OPTIONS.length) % OPTIONS.length].id);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setMode(OPTIONS[idx].id);
      }
    },
    [setMode]
  );

  return (
    <div
      role="radiogroup"
      aria-label="Color mode"
      className="flex gap-4"
    >
      {OPTIONS.map(({ id, label, Preview }, idx) => {
        const active = mode === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setMode(id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
              'flex flex-col items-center gap-2 rounded-xl border-2 p-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
              active
                ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-bg-primary'
                : 'border-border-primary hover:border-text-muted',
            ].join(' ')}
          >
            <div className="h-20 w-28 overflow-hidden rounded-lg border border-border-primary bg-bg-tertiary">
              <Preview />
            </div>
            <span className={`text-xs font-medium ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
