// Dev-only: warns when text contrast drops below WCAG AA (4.5:1) after theme change.
// Never runs in production.

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function parseRGB(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(...fg);
  const l2 = relativeLuminance(...bg);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function runContrastGuard() {
  if (process.env.NODE_ENV === 'production') return;
  if (typeof document === 'undefined') return;

  let violations = 0;
  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (!el.textContent?.trim()) return;
    const style = window.getComputedStyle(el);
    const fg = parseRGB(style.color);
    const bg = parseRGB(style.backgroundColor);
    if (!fg || !bg) return;
    if (bg[0] === 0 && bg[1] === 0 && bg[2] === 0 && style.backgroundColor.includes('rgba(0, 0, 0, 0')) return;
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      console.warn(`[contrast-guard] Low contrast ${ratio.toFixed(2)}:1 on`, el);
      violations++;
    }
  });
  if (violations === 0) console.info('[contrast-guard] All text passes WCAG AA');
}
