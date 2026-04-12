/**
 * Pure TypeScript fuzzy matching utility for company name matching.
 * No external dependencies.
 */

const COMPANY_SUFFIXES =
  /\b(inc\.?|incorporated|llc|l\.l\.c\.?|ltd\.?|limited|corp\.?|corporation|co\.?|company|plc|p\.l\.c\.?|lp|l\.p\.?|llp|l\.l\.p\.?|pllc|p\.l\.l\.c\.?|gmbh|ag|sa|s\.a\.?|srl|s\.r\.l\.?)\s*$/i;

/**
 * Normalize a company name for comparison:
 * - Lowercase
 * - Strip common legal suffixes (and their dotted variants)
 * - Collapse whitespace, trim
 */
export function normalizeCompanyName(name: string): string {
  let n = name.toLowerCase().trim();
  // Remove trailing punctuation that might follow a suffix (commas, periods)
  n = n.replace(/[,.\s]+$/, '');
  // Strip legal suffixes (may need multiple passes for e.g. "Foo Co. Inc.")
  let prev = '';
  while (prev !== n) {
    prev = n;
    n = n.replace(COMPANY_SUFFIXES, '').trim().replace(/[,.\s]+$/, '');
  }
  // Collapse whitespace
  n = n.replace(/\s+/g, ' ').trim();
  return n;
}

/**
 * Standard Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimise trivial cases
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row DP (O(min(m,n)) space)
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Find the best fuzzy match for `input` among `candidates`.
 *
 * Both input and candidates are normalized before comparison.
 * Similarity is calculated as `1 - (distance / max(len_a, len_b))`.
 *
 * @param threshold - Minimum similarity score to accept (default 0.8)
 * @returns The original (un-normalized) candidate string that matched, or null.
 */
export function fuzzyCompanyMatch(
  input: string,
  candidates: string[],
  threshold = 0.8
): string | null {
  const normalizedInput = normalizeCompanyName(input);
  if (!normalizedInput) return null;

  let bestScore = -1;
  let bestCandidate: string | null = null;

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeCompanyName(candidate);
    if (!normalizedCandidate) continue;

    const maxLen = Math.max(normalizedInput.length, normalizedCandidate.length);
    if (maxLen === 0) continue;

    const distance = levenshteinDistance(normalizedInput, normalizedCandidate);
    const similarity = 1 - distance / maxLen;

    if (similarity >= threshold && similarity > bestScore) {
      bestScore = similarity;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}
