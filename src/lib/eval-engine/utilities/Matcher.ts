import type { FuzzyMatch, Matcher } from "../core/utilities.ts";

/**
 * Damerau-Levenshtein edit distance: the minimum number of single-character
 * insertions, deletions, substitutions, OR adjacent transpositions needed to
 * turn `a` into `b`. The transposition operation — missing from plain
 * Levenshtein — is what makes this the right measure for typo tolerance:
 * "hte" -> "the" is a single edit here, but two under plain Levenshtein,
 * even though it is one of the most common real typo shapes (an accidental
 * adjacent-key swap while typing).
 *
 * Standard dynamic-programming formulation, O(len(a) * len(b)) time and
 * space — fine for the short strings (single words/short phrases) every
 * caller in this engine compares.
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const d: number[][] = Array.from({ length: al + 1 }, () => new Array<number>(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) d[i]![0] = i;
  for (let j = 0; j <= bl; j++) d[0]![j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        d[i - 1]![j]! + 1, // deletion
        d[i]![j - 1]! + 1, // insertion
        d[i - 1]![j - 1]! + cost, // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, d[i - 2]![j - 2]! + 1); // adjacent transposition
      }
      d[i]![j] = value;
    }
  }
  return d[al]![bl]!;
}

/** 1 - distance / max(len(a), len(b)); 1.0 for two empty strings (identical, vacuously). */
function similarity(a: string, b: string, distance: number): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}

/** Default comparison helper. Plain, case-sensitive string comparison, plus opt-in fuzzy lookup (see Matcher.closestMatch). */
export class DefaultMatcher implements Matcher {
  equals(a: string, b: string): boolean {
    return a === b;
  }

  equalsAny(value: string, candidates: readonly string[]): boolean {
    return candidates.some((candidate) => candidate === value);
  }

  closestMatch(value: string, candidates: readonly string[]): FuzzyMatch | undefined {
    let best: FuzzyMatch | undefined;
    for (const candidate of candidates) {
      const distance = damerauLevenshteinDistance(value, candidate);
      if (!best || distance < best.distance) {
        best = { candidate, distance, similarity: similarity(value, candidate, distance) };
      }
    }
    return best;
  }
}
