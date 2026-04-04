/**
 * Timezone-safe date utilities for the artifact UI layer.
 *
 * All expense dates are stored as DATE (YYYY-MM-DD) strings.
 * We treat them as local calendar dates, never UTC timestamps,
 * to avoid off-by-one-day bugs.
 */

/**
 * Parse a YYYY-MM-DD string into a local Date (noon to avoid DST edge cases).
 */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Format a Date as a YYYY-MM-DD string using local time.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Extract the year ("YYYY") from a Date using local time.
 */
export function getYear(date: Date): string {
  return String(date.getFullYear());
}

/**
 * Extract the zero-padded month ("01"–"12") from a Date using local time.
 */
export function getMonthPadded(date: Date): string {
  return String(date.getMonth() + 1).padStart(2, '0');
}

/**
 * Extract the canonical "YYYY-MM" string from a Date using local time.
 */
export function getYearMonth(date: Date): string {
  return `${getYear(date)}-${getMonthPadded(date)}`;
}

/**
 * Format a "YYYY-MM" string as a display-friendly "Month YYYY" string.
 * e.g. "2024-03" → "March 2024"
 */
export function formatMonthDisplay(yearMonth: string): string {
  const [y, m] = yearMonth.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long'
  }).format(date);
}
