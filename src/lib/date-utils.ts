/**
 * Timezone-safe date utilities.
 *
 * All expense dates are stored as DATE (YYYY-MM-DD) in Supabase.
 * We treat them as **local calendar dates**, never UTC timestamps,
 * to avoid the off-by-one-day bug where `new Date('2024-03-01')`
 * becomes Feb 29 in US timezones.
 */

/**
 * Parse a YYYY-MM-DD string into a local Date (noon to avoid DST edge cases).
 * This is the ONLY way DB date strings should be converted to Date objects.
 */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Format a Date as a YYYY-MM-DD string using local time.
 * This is the ONLY way Date objects should be serialized for the DB.
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
