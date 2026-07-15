import type { EvaluationProfile } from "../core/profile.ts";

/**
 * BAC "grammatik_satzbau" / Temporalsatz: combine two sentences into one using
 * a temporal subordinate clause (als/wenn/während/...). This is the first
 * Satzbau profile migrated to the finalized profileKey convention — mirroring
 * exactly how grammatik_tempus became tempus.perfekt, grammatik_aktiv_passiv
 * became passiv.präsens, and grammatik_modalverb became modalverb.standard:
 * the exam's outer type stays "grammatik_satzbau" (see BacQuestionType), but
 * each CLAUSE TYPE is its own profile, resolved via
 * EvaluationInput.profileKey.
 *
 * Usage from a caller (e.g. the Lovable adapter):
 *   engine.evaluate({
 *     exerciseType: "grammatik_satzbau",   // the exam's outer bac_type
 *     profileKey: "satzbau.temporal",      // selects THIS profile (derived
 *                                          // from the question's clause_type)
 *     answer, reference,
 *   });
 *
 * The profile itself is registered under exerciseType "satzbau.temporal" —
 * the ProfileRegistry key is always profile.exerciseType, and calling with
 * exerciseType "grammatik_satzbau" alone (no profileKey) now fails fast
 * rather than guessing which clause type applies (see
 * test/satzbauTemporal.test.ts). Sibling profiles for the other clause types
 * (satzbau.final, satzbau.kausal, satzbau.konditional, satzbau.konzessiv,
 * satzbau.relativ) follow the same convention, each in its own file.
 *
 * Evaluation logic, skills, and scoring are UNCHANGED from the prior
 * grammatik_satzbau profile — this migration is structural only (profile
 * identity/registration).
 *
 * The objective is sentence structure, so the profile enables VerbPosition
 * (finite verb at the end of the subordinate clause) and Comma (the
 * clause-boundary comma). Per the BAC rule, Satzbau deducts per error, so the
 * scoring policy is "deduction": each failed aspect costs its 0.25 points
 * (0.5 -> 0.25 -> 0). VerbPosition compares the subordinate clause's final
 * word to the expected verb, so a misplaced OR wrong subordinate verb both
 * fail there — verb correctness for the subordinate clause is embedded in
 * the position check.
 *
 * The reference is a GrammarReference, e.g.
 * { correctAnswer: "Als ich jung war, spielte ich Fußball.", answerKey: { subordinateFinal: "war" } }.
 */
export const satzbauTemporalProfile: EvaluationProfile = {
  exerciseType: "satzbau.temporal",
  objective: "grammar.clause.combine",
  strategy: "structural",
  examSystem: "bac",
  scoring: "deduction",
  skills: [
    { skill: "VerbPosition", points: 0.25 },
    { skill: "Comma", points: 0.25 },
  ],
};
