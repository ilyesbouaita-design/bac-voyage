import { buildSkillResult } from "../../core/skill.ts";
import type { SkillResult } from "../../core/skill.ts";

/** Reference for a Kompositum-lösen question: the two expected parts. */
export interface CompoundPartsReference {
  word1: string;
  word2: string;
}

/** Validate the reference; fail fast otherwise. */
export function asCompoundPartsReference(expected: unknown, skill: string): CompoundPartsReference {
  if (
    expected !== null &&
    typeof expected === "object" &&
    typeof (expected as { word1?: unknown }).word1 === "string" &&
    typeof (expected as { word2?: unknown }).word2 === "string"
  ) {
    return expected as CompoundPartsReference;
  }
  throw new Error(`${skill}: the reference must have string "word1" and "word2" fields.`);
}

/** One accepted derivation: a word, and its article when the derivation target is a noun ("" when it isn't). */
export interface DerivationEntry {
  article: string;
  word: string;
}

/** Reference for a Wortableitung question: every accepted derivation, mirroring the real content's own accepted_answers shape. */
export interface DerivationReference {
  accepted: DerivationEntry[];
}

/** Validate the reference; fail fast otherwise. */
export function asDerivationReference(expected: unknown, skill: string): DerivationReference {
  if (
    expected !== null &&
    typeof expected === "object" &&
    Array.isArray((expected as { accepted?: unknown }).accepted) &&
    (expected as { accepted: unknown[] }).accepted.every(
      (entry) =>
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as { article?: unknown }).article === "string" &&
        typeof (entry as { word?: unknown }).word === "string",
    )
  ) {
    return expected as DerivationReference;
  }
  throw new Error(`${skill}: the reference must have an "accepted" array of { article, word } entries.`);
}

/** Build a one-item SkillResult with a single structured feedback entry. */
export function wortbildungResult(
  skill: string,
  awarded: number,
  maxPoints: number,
  key: string,
  params?: Record<string, string | number | boolean>,
): SkillResult {
  return buildSkillResult(skill, awarded, maxPoints, key, params);
}
