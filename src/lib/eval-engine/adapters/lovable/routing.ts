import type { BacQuestionType } from "./types.ts";

// ============================================================================
// Migration bridge — routing (Migration Plan, Phase 1)
//
// Decides, per bac_type, which engine(s) run for a submission:
//
//   "v2"     grade with bac-voyage's existing grading-engine-v2.ts only.
//            Nothing about today's behavior changes. THE DEFAULT for every
//            bac_type (see DEFAULT_ROUTING_CONFIG) — with every entry left
//            at "v2", wiring this module into the real orchestrator changes
//            NOTHING a student sees or that gets persisted.
//   "shadow" grade with v2 (its result is what's shown/persisted), AND ALSO
//            run the new engine on the SAME input purely for comparison —
//            see shadowMode.ts. Never visible to the student. This is how
//            the migration plan proves the new engine agrees with v2 on
//            real traffic before a single flag flips to "new".
//   "new"    grade with the new engine only (correctAnswer() +
//            toLegacyResult()). v2 is no longer invoked for this bac_type.
//
// This module makes ZERO grading decisions itself — it only decides WHICH
// engine(s) run for a given bac_type. All the actual grading logic lives
// where it already does: correctAnswer() for the new engine, and
// bac-voyage's own grading-engine-v2.ts for v2 (this project has no access
// to, and does not reproduce, that file).
//
// Deliberately NOT wired into the real bac-voyage repository by this change.
// This is a standalone, tested module, ready to be imported by
// grading-orchestrator.ts — exactly like every other file under
// src/adapters/lovable mirrors bac-voyage's contracts without ever touching
// bac-voyage's own source. See the "Wiring this in" note below for exactly
// what that edit would look like, and the migration plan document (Phase 1)
// for the full rationale.
//
// ---------------------------------------------------------------------------
// Wiring this in (illustrative only — no file in the real repo is changed
// by this comment; this is what a future, separately-authorized edit to
// bac-voyage's grading-orchestrator.ts would look like):
//
//   import {
//     resolveRoutingMode, shouldCallV2, shouldCallNewEngine, shouldUseNewEngineResult,
//     runShadowComparison, type GradingOutcome,
//   } from "german-evaluation-engine";
//
//   const mode = resolveRoutingMode(question.bac_content.bac_type, routingConfig);
//   const v2Result = shouldCallV2(mode) ? await gradeAnswerV2({ ... }) : undefined;
//
//   let finalResult = v2Result; // v2 remains authoritative unless "new" below
//
//   if (shouldCallNewEngine(mode) && v2Result) {
//     const v2Outcome: GradingOutcome = {
//       score: v2Result.score, maxScore: v2Result.maxScore,
//       isCorrect: v2Result.isCorrect, isPartial: v2Result.isPartial,
//       manual: v2Result.needsManualReview,
//     };
//     const { diff, newEngineResult } = runShadowComparison(
//       engine, question, response, v2Outcome, logShadowDiff, // logShadowDiff: caller-supplied sink
//     );
//     if (shouldUseNewEngineResult(mode)) {
//       finalResult = toLegacyResult(newEngineResult); // cutover for this bac_type
//     }
//   }
//   // ... persist finalResult exactly as exam_answers is written today.
// ---------------------------------------------------------------------------
// ============================================================================

export type RoutingMode = "v2" | "shadow" | "new";

/**
 * One entry per real bac_type. A key that is absent from a *partial* config
 * resolves to "v2" (see resolveRoutingMode) — so a config that simply hasn't
 * been told about a bac_type yet (e.g. one added to the schema after this
 * config was written) is safe by construction, not just by convention.
 */
export type RoutingConfig = Partial<Record<BacQuestionType, RoutingMode>>;

/**
 * Every real bac_type explicitly set to "v2". Written out in full (not as an
 * empty object) so that adding a new bac_type to BacQuestionType forces a
 * type error here until it's given a conscious entry, rather than silently
 * relying on the "absent key defaults to v2" fallback. Phase 1 ships with
 * every value at "v2" — see the migration plan's Phase 2 onward for exactly
 * when and in what order specific entries move to "shadow" then "new".
 */
export const DEFAULT_ROUTING_CONFIG: Readonly<Record<BacQuestionType, RoutingMode>> = {
  richtig_falsch_zitat: "v2",
  fragen_zum_text: "v2",
  kombinieren: "v2",
  ergaenzen: "v2",
  titel: "v2",
  synonym: "v2",
  gegenteil: "v2",
  uebersetzung: "v2",
  kompositum_bilden: "v2",
  kompositum_loesen: "v2",
  wortableitung: "v2",
  grammatik_tempus: "v2",
  grammatik_aktiv_passiv: "v2",
  grammatik_satzbau: "v2",
  grammatik_modalverb: "v2",
  grammatik_konnektoren: "v2",
  grammatik_deklination: "v2",
  grammatik_fragen_stellen: "v2",
};

/**
 * Resolve one bac_type's mode. Defaults to DEFAULT_ROUTING_CONFIG so callers
 * that don't maintain their own config get the safe, zero-behavior-change
 * default automatically. An absent key in a *supplied* partial config also
 * resolves to "v2" — never to "shadow" or "new" by omission.
 */
export function resolveRoutingMode(
  bacType: BacQuestionType,
  config: RoutingConfig = DEFAULT_ROUTING_CONFIG,
): RoutingMode {
  return config[bacType] ?? "v2";
}

/** True for "v2" and "shadow" — v2 must run to produce either the shown result or the shadow-mode comparison baseline. */
export function shouldCallV2(mode: RoutingMode): boolean {
  return mode === "v2" || mode === "shadow";
}

/** True for "shadow" and "new" — the new engine must run to produce either a comparison result or the shown result. */
export function shouldCallNewEngine(mode: RoutingMode): boolean {
  return mode === "shadow" || mode === "new";
}

/** True only for "new" — the new engine's result is what gets shown to the student and persisted. In every other mode v2's result is authoritative. */
export function shouldUseNewEngineResult(mode: RoutingMode): boolean {
  return mode === "new";
}
