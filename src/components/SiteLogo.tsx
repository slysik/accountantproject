'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme';

interface Props {
  /** Tailwind classes for width/height, e.g. "h-8 w-8" */
  className?: string;
  /** Pixel size passed to next/image width & height (should match your className size) */
  size?: number;
}

export default function SiteLogo({ className = 'h-10 w-10', size = 40 }: Props) {
  const { theme } = useTheme();
  return (
    <Image
      src={theme === 'dark' ? '/logo-dark.jpeg' : '/logo-light.jpeg'}
      alt="Accountant's Best Friend logo"
      width={size}
      height={size}
      className={`rounded-xl object-contain ${className}`}
      unoptimized
    />
  );
}
