// =============================================================================
// grading-orchestrator.ts
// Orchestrates grading for an entire exam attempt.
// Loads data from Supabase, delegates per-question grading to grading-engine,
// persists results back, and returns a summary.
// =============================================================================

import { supabase } from "./supabase";
import { gradeQuestion } from "./grading-engine";
import type { GradeResult } from "./grading-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { GradeResult };

export interface ExamGradingResult {
  attemptId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  questionResults: Record<string, GradeResult>;
  gradedAt: string;
}

// ---------------------------------------------------------------------------
// Internal Supabase row shapes (only the columns we need)
// ---------------------------------------------------------------------------

interface ExamAttemptRow {
  id: string;
  exam_id: string;
  user_id: string;
  status: string;
  score: number | null;
  max_score: number | null;
}

interface ExamRow {
  id: string;
  title: string;
  locale?: string;
}

interface SectionRow {
  id: string;
  exam_id: string;
  order_index: number;
  passage_text?: string;
}

interface QuestionRow {
  id: string;
  section_id: string;
  bac_type: string;
  bac_content: any;
  points: number;
  order_index: number;
}

interface AnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  student_response: any;
  score: number | null;
  is_correct: boolean | null;
  feedback_fr: string | null;
  feedback_ar: string | null;
  graded_at: string | null;
  graded_method: string | null;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

/**
 * Grade an entire exam attempt.
 *
 * 1. Loads the attempt, exam, sections, questions, and answers from Supabase.
 * 2. Determines the text passage (from the first section) for AI context.
 * 3. Grades every answer via `gradeQuestion()`.
 * 4. Persists per-answer results and the overall attempt score.
 * 5. Returns a complete `ExamGradingResult`.
 *
 * If AI grading fails for a single question the error is caught, the question
 * is marked `graded_method = "error_manual"`, and grading continues for the
 * remaining questions.
 */
export async function gradeExamAttempt(attemptId: string): Promise<ExamGradingResult> {
  // -- 1. Load the attempt --------------------------------------------------
  const { data: attempt, error: attemptErr } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (attemptErr || !attempt) {
    throw new Error(`Failed to load exam attempt ${attemptId}: ${attemptErr?.message ?? "not found"}`);
  }

  const typedAttempt = attempt as ExamAttemptRow;

  // -- 2. Load the exam -----------------------------------------------------
  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("*")
    .eq("id", typedAttempt.exam_id)
    .single();

  if (examErr || !exam) {
    throw new Error(`Failed to load exam ${typedAttempt.exam_id}: ${examErr?.message ?? "not found"}`);
  }

  const typedExam = exam as ExamRow;

  // -- 3. Load sections (ordered) -------------------------------------------
  const { data: sections, error: sectionsErr } = await supabase
    .from("exam_sections")
    .select("*")
    .eq("exam_id", typedExam.id)
    .order("order_index", { ascending: true });

  if (sectionsErr) {
    throw new Error(`Failed to load sections: ${sectionsErr.message}`);
  }

  const typedSections = (sections ?? []) as SectionRow[];

  // -- 4. Load questions for all sections -----------------------------------
  const sectionIds = typedSections.map((s) => s.id);

  const { data: questions, error: questionsErr } = await supabase
    .from("exam_questions")
    .select("*")
    .in("section_id", sectionIds)
    .order("order_index", { ascending: true });

  if (questionsErr) {
    throw new Error(`Failed to load questions: ${questionsErr.message}`);
  }

  const typedQuestions = (questions ?? []) as QuestionRow[];

  // -- 5. Load all answers for this attempt ---------------------------------
  const { data: answers, error: answersErr } = await supabase
    .from("exam_answers")
    .select("*")
    .eq("attempt_id", attemptId);

  if (answersErr) {
    throw new Error(`Failed to load answers: ${answersErr.message}`);
  }

  const typedAnswers = (answers ?? []) as AnswerRow[];

  // Build a lookup: question_id -> answer row
  const answerByQuestion = new Map<string, AnswerRow>();
  for (const a of typedAnswers) {
    answerByQuestion.set(a.question_id, a);
  }

  // -- 6. Determine the passage text (first section with a passage) ---------
  const passageText =
    typedSections.find((s) => s.passage_text)?.passage_text ?? undefined;

  // -- 7. Determine locale --------------------------------------------------
  const locale: "fr" | "ar" = (typedExam.locale === "ar" ? "ar" : "fr");

  // -- 8. Grade each answer -------------------------------------------------
  const questionResults: Record<string, GradeResult> = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const question of typedQuestions) {
    const answer = answerByQuestion.get(question.id);
    maxScore += question.points;

    // If the student never answered this question, score 0.
    if (!answer) {
      questionResults[question.id] = {
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        isPartial: false,
        feedback_fr: "Aucune reponse fournie.",
        feedback_de: "Keine Antwort gegeben.",
      };
      continue;
    }

    let result: GradeResult;
    let gradedMethod = "auto";

    try {
      result = await gradeQuestion(
        question.bac_type,
        question.bac_content,
        answer.student_response,
        question.points,
        passageText,
        locale,
      );
    } catch (err) {
      // AI or unexpected error: mark for manual review and continue.
      console.error(
        `[grading-orchestrator] Error grading question ${question.id}:`,
        err,
      );
      result = {
        score: 0,
        maxScore: question.points,
        isCorrect: false,
        isPartial: false,
        feedback_fr: "Erreur lors de la correction automatique. Cette question sera corrigee manuellement.",
        feedback_de: "Fehler bei der automatischen Korrektur. Diese Frage wird manuell korrigiert.",
      };
      gradedMethod = "error_manual";
    }

    questionResults[question.id] = result;
    totalScore += result.score;

    // Determine graded_method if not already set to error_manual.
    if (gradedMethod !== "error_manual") {
      gradedMethod = isAIType(question.bac_type) ? "ai" : "exact";
    }

    // -- 9. Persist per-answer result ---------------------------------------
    const now = new Date().toISOString();
    const { error: updateAnswerErr } = await supabase
      .from("exam_answers")
      .update({
        score: result.score,
        is_correct: result.isCorrect,
        feedback_fr: result.feedback_fr,
        feedback_ar: result.feedback_de, // feedback_ar column stores the German feedback
        graded_at: now,
        graded_method: gradedMethod,
      })
      .eq("id", answer.id);

    if (updateAnswerErr) {
      console.error(
        `[grading-orchestrator] Failed to update answer ${answer.id}:`,
        updateAnswerErr.message,
      );
    }
  }

  // -- 10. Persist attempt-level results ------------------------------------
  const gradedAt = new Date().toISOString();
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;

  const { error: updateAttemptErr } = await supabase
    .from("exam_attempts")
    .update({
      score: totalScore,
      max_score: maxScore,
      status: "graded",
      graded_at: gradedAt,
    })
    .eq("id", attemptId);

  if (updateAttemptErr) {
    console.error(
      `[grading-orchestrator] Failed to update attempt ${attemptId}:`,
      updateAttemptErr.message,
    );
  }

  // -- 11. Return full results ----------------------------------------------
  return {
    attemptId,
    totalScore,
    maxScore,
    percentage,
    questionResults,
    gradedAt,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set of bac_type values that require AI grading. */
const AI_TYPES = new Set<string>([
  "richtig_falsch_zitat",
  "zitat",
  "fragen",
  "fragen_zum_text",
  "uebersetzung",
  "titel",
  "modalverb",
  "fragen_stellen",
]);

function isAIType(bacType: string): boolean {
  return AI_TYPES.has(bacType);
}
