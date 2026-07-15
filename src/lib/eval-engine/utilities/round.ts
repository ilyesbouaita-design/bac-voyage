/**
 * Round to 2 decimal places, guarding against IEEE754 floating-point drift
 * from repeated addition/subtraction (e.g. 0.1 + 0.2 -> 0.30000000000000004).
 *
 * Shared by every score/confidence computation in this library (scoring
 * policies, multi-item aggregation, and any skill that computes a partial
 * award) so there is exactly one rounding rule to reason about, not nine
 * independent copies.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
