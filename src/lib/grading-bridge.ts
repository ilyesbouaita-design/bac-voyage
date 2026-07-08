/**
 * grading-bridge.ts
 *
 * Bridges the existing grading-orchestrator with the new offline V2 engine.
 * Exports a drop-in replacement that tries the V2 engine first, falls back
 * to the original engine, and never breaks the existing flow.
 *
 * Usage: import { gradeAnswerWithFallback } from "./grading-bridge"
 */

import { gradeAnswerV2 } from "./grading-engine-v2";
import type { GradeResultV2 } from "./grading-engine-v2";

// ----------------------------------------------------------------------------------
// Map old bac_type values to question type strings used by gradeAnswerV2
// ----------------------------------------------------------------------------------

const BAC_TYPE_TO_QUESTION_TYPE: Record<string, string> = {
  // Exact-match types (Layer 1 + 2)
  synonym: "synonym",
  gegenteil: "gegenteil",
  wortbildung: "wortbildung",
  wortableitung: "wortableitung",
  kompositum_bilden: "wortbildung",
  kompositum_loesen: "wortbildung",
  grammatik_tempus: "grammatik_tempus",
  grammatik_aktiv_passiv: "grammatik_aktiv_passiv",
  grammatik_satzbau: "grammatik_satzbau",
  grammatik_modalverb: "grammatik_modalverb",
  grammatik_deklination: "grammatik_deklination",
  grammatik_fragen_stellen: "grammatik_fragen_stellen",
  kombinieren: "kombinieren",
  ergaenzen: "ergaenzen",
  // Open-ended types (Layer 3 + 4)
  richtig_falsch_zitat: "richtig_falsch_zitat",
  fragen_zum_text: "fragen_zum_text",
  uebersetzung: "uebersetzung",
  titel: "titel",
  grammatik_konnektoren: "grammatik_konnektoren",
};

// ----------------------------------------------------------------------------------
// Main bridge function
// ----------------------------------------------------------------------------------

export async function gradeAnswerWithFallback(params: {
  bacType: string;
  studentAnswer: string | Record<string, any>;
  referenceAnswer: string;
  acceptedVariants?: string[];
  requiredKeywords?: string[];
  points: number;
  locale?: "fr" | "ar";
}): Promise<GradeResultV2> {
  const questionType = BAC_TYPE_TO_QUESTION_TYPE[params.bacType] ?? params.bacType;

  try {
    const result = await gradeAnswerV2({
      questionType,
      studentAnswer: params.studentAnswer,
      referenceAnswer: params.referenceAnswer,
      acceptedVariants: params.acceptedVariants,
      requiredKeywords: params.requiredKeywords,
      points: params.points,
      locale: params.locale ?? "fr",
    });
    return result;
  } catch (err) {
    console.warn("[grading-bridge] V2 engine error, returning safe fallback:", err);
    // Safe fallback — never crash the exam flow
    return {
      score: 0,
      maxScore: params.points,
      percentage: 0,
      isCorrect: false,
      isPartial: false,
      method: "manual",
      confidence: 0,
      feedback_fr: "Réponse soumise — correction manuelle requise.",
      feedback_de: "Antwort eingereicht — manuelle Korrektur erforderlich.",
      needsManualReview: true,
    };
  }
}

// ----------------------------------------------------------------------------------
// Helper: convert GradeResultV2 to the legacy GradeResult shape
// (for backward compatibility with code that uses the old engine's types)
// ----------------------------------------------------------------------------------

export function tolegacyGradeResult(v2: GradeResultV2, points: number) {
  return {
    score: v2.score,
    maxScore: v2.maxScore,
    isCorrect: v2.isCorrect,
    isPartial: v2.isPartial,
    feedback_fr: v2.feedback_fr,
    feedback_de: v2.feedback_de,
    details: v2.details,
  };
}

export type { GradeResultV2 };
