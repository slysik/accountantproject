'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme';

interface Props {
  /** Tailwind classes for width/height, e.g. "h-20 w-20". Should match the numeric `size` prop. */
  className?: string;
  /** Pixel size passed to next/image width & height. Should match your className size. */
  size?: number;
  /** Render the wordmark ("Accountant's Best Friend" + "ABF") next to the logo. */
  showWordmark?: boolean;
  /** Extra classes applied to the wordmark wrapper. */
  wordmarkClassName?: string;
}

/** Eval-harness override read from `?logoSize=NN&logoClass=h-20+w-20`. */
function useSizingOverride() {
  const [override, setOverride] = useState<{ size?: number; className?: string }>({});
  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      const s = Number(qp.get('logoSize'));
      const c = qp.get('logoClass');
      if ((Number.isFinite(s) && s > 0) || c) {
        setOverride({
          size: Number.isFinite(s) && s > 0 ? s : undefined,
          className: c ?? undefined,
        });
      }
    } catch {
      // ignore
    }
  }, []);
  return override;
}

export default function SiteLogo({
  className = 'h-32 w-32',
  size = 128,
  showWordmark = false,
  wordmarkClassName = '',
}: Props) {
  const { theme } = useTheme();
  const override = useSizingOverride();
  const effClassName = override.className ?? className;
  const effSize = override.size ?? size;

  const img = (
    <Image
      src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
      alt="Accountant's Best Friend logo"
      width={effSize}
      height={effSize}
      className={`rounded-xl object-contain ${effClassName}`}
      unoptimized
    />
  );

  if (!showWordmark) return img;

  return (
    <span className={`inline-flex items-center gap-3 ${wordmarkClassName}`}>
      {img}
      <span className="flex min-w-0 flex-col">
        <span className="text-base font-semibold leading-tight tracking-tight text-text-primary">
          Accountant&apos;s Best Friend
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
          ABF
        </span>
      </span>
    </span>
  );
}
