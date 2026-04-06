export const DEFAULT_COMPANY_NAME = 'My Company';

export function encodeCompanySlug(name: string): string {
  return encodeURIComponent(name.trim());
}

export function decodeCompanySlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function isYearSegment(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function isMonthSegment(value: string): boolean {
  return /^(0[1-9]|1[0-2])$/.test(value);
}
