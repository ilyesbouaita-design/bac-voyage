// =============================================================================
// grading-orchestrator.ts
// Orchestrates grading for an entire exam attempt using the V2 offline engine.
// Loads data from Supabase, delegates per-question grading to grading-engine-v2,
// persists results back, and returns a summary.
// =============================================================================

import { supabase } from "./supabase";
import { gradeAnswerV2 } from "./grading-engine-v2";
import type { GradeResultV2, Locale } from "./grading-engine-v2";

// ---------------------------------------------------------------------------
// Re-export for backward compatibility with code that imports GradeResult
// ---------------------------------------------------------------------------
export type GradeResult = GradeResultV2;

export interface ExamGradingResult {
  attemptId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  questionResults: Record<string, GradeResultV2>;
  gradedAt: string;
}

// ---------------------------------------------------------------------------
// Internal Supabase row shapes (only the columns we need)
// ---------------------------------------------------------------------------

interface ExamAttemptRow {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  score: number | null;
  max_score: number | null;
}

interface ExamRow {
  id: string;
  title_fr: string;
  slug?: string; // used to infer locale if stored
}

interface SectionRow {
  id: string;
  exam_id: string;
  order_index: number;
  passage_de?: string;
  kind?: string;
}

interface QuestionRow {
  id: string;
  section_id: string;
  type: string;          // exercise_type enum from DB
  content: any;          // JSON — bac_content with bac_type field inside
  points: number;
  order_index: number;
  prompt_fr?: string;
  grade_method?: string;
}

interface AnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  response: any;
  score: number | null;
  is_correct: boolean | null;
  feedback_fr: string | null;
  feedback_ar: string | null;
  graded_at: string | null;
  graded_method: string | null;
}

// ---------------------------------------------------------------------------
// Helper: extract bac_type and grading params from a question row
// ---------------------------------------------------------------------------

interface GradingParams {
  questionType: string;
  referenceAnswer: string;
  acceptedVariants: string[];
  requiredKeywords: string[];
  // Grammatik-specific metadata
  targetTense?: string;
  direction?: "aktiv" | "passiv";
  clauseType?: string;
  correctModal?: string;
}

function extractGradingParams(question: QuestionRow): GradingParams {
  const c = (question.content ?? {}) as any;
  const bacType: string = c.bac_type ?? question.type ?? "";

  // Default values
  const params: GradingParams = {
    questionType: bacType,
    referenceAnswer: "",
    acceptedVariants: [],
    requiredKeywords: [],
  };

  // Extract reference answer and variants depending on question type
  switch (bacType) {
    case "richtig_falsch_zitat": {
      // R/F questions: reference = "richtig::citation" or "falsch::citation"
      const statements = c.statements ?? [];
      // Each statement is graded individually in the student answer object
      // The referenceAnswer encodes the first statement's answer for compatibility
      if (statements.length > 0) {
        const s = statements[0];
        params.referenceAnswer = `${s.is_richtig ? "richtig" : "falsch"}::${s.zitat ?? ""}`;
      }
      break;
    }
    case "synonym":
      params.referenceAnswer = c.accepted_answers?.[0] ?? "";
      params.acceptedVariants = c.accepted_answers ?? [];
      break;
    case "gegenteil":
      params.referenceAnswer = c.accepted_answers?.[0] ?? "";
      params.acceptedVariants = c.accepted_answers ?? [];
      break;
    case "uebersetzung":
      params.referenceAnswer = (c.accepted_translations ?? [])[0] ?? c.german_sentence ?? "";
      params.acceptedVariants = c.accepted_translations ?? [];
      break;
    case "titel":
      params.referenceAnswer = (c.accepted_titles ?? [])[0] ?? "";
      params.acceptedVariants = c.accepted_titles ?? [];
      break;
    case "fragen_zum_text":
      params.referenceAnswer = c.reference_answer ?? c.question ?? "";
      break;
    case "kombinieren": {
      // Answer key: object mapping left_label -> right_label
      params.referenceAnswer = JSON.stringify(c.answer_key ?? {});
      break;
    }
    case "ergaenzen": {
      const sentences = c.sentences ?? [];
      params.referenceAnswer = sentences.map((s: any) => s.blank_word ?? "").join(",");
      break;
    }
    case "kompositum_bilden":
      params.referenceAnswer = c.result ?? "";
      break;
    case "kompositum_loesen":
      params.referenceAnswer = `${c.word1 ?? ""} ${c.word2 ?? ""}`.trim();
      break;
    case "wortableitung": {
      const ans = (c.accepted_answers ?? [{}])[0] ?? {};
      params.referenceAnswer = `${ans.article ?? ""} ${ans.word ?? ""}`.trim();
      params.acceptedVariants = (c.accepted_answers ?? []).map(
        (a: any) => `${a.article ?? ""} ${a.word ?? ""}`.trim()
      );
      break;
    }
    case "grammatik_tempus":
      params.referenceAnswer = c.correct_answer ?? "";
      params.targetTense = c.tense ?? "Präteritum";
      break;
    case "grammatik_aktiv_passiv":
      params.referenceAnswer = c.correct_answer ?? "";
      params.direction = c.direction === "passiv" ? "passiv" : "aktiv";
      break;
    case "grammatik_satzbau":
      params.referenceAnswer = c.correct_answer ?? "";
      params.clauseType = c.clause_type ?? "konzessivsatz";
      break;
    case "grammatik_modalverb":
      params.referenceAnswer = c.correct_answer ?? "";
      // Extract the modal verb from the reference answer
      {
        const modals = ["können", "müssen", "dürfen", "sollen", "wollen", "mögen", "lassen"];
        const refLower = (c.correct_answer ?? "").toLowerCase();
        params.correctModal = modals.find((m) => refLower.includes(m)) ?? "";
      }
      break;
    case "grammatik_konnektoren":
    case "grammatik_deklination":
    case "grammatik_fragen_stellen":
      params.referenceAnswer = c.correct_answer ?? c.correct_question ?? "";
      break;
    default:
      params.referenceAnswer = c.correct_answer ?? c.reference_answer ?? "";
  }

  return params;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function gradeExamAttempt(
  attemptId: string,
  locale: Locale = "fr"
): Promise<ExamGradingResult> {
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

  // -- 2. Load sections (ordered) -------------------------------------------
  const { data: sections, error: sectionsErr } = await supabase
    .from("exam_sections")
    .select("*")
    .eq("exam_id", typedAttempt.exam_id)
    .order("order_index", { ascending: true });

  if (sectionsErr) throw new Error(`Failed to load sections: ${sectionsErr.message}`);
  const typedSections = (sections ?? []) as SectionRow[];

  // -- 3. Load questions for all sections -----------------------------------
  const sectionIds = typedSections.map((s) => s.id);
  if (sectionIds.length === 0) {
    return { attemptId, totalScore: 0, maxScore: 0, percentage: 0, questionResults: {}, gradedAt: new Date().toISOString() };
  }

  const { data: questions, error: questionsErr } = await supabase
    .from("exam_questions")
    .select("*")
    .in("section_id", sectionIds)
    .order("order_index", { ascending: true });

  if (questionsErr) throw new Error(`Failed to load questions: ${questionsErr.message}`);
  const typedQuestions = (questions ?? []) as QuestionRow[];

  // -- 4. Load all answers for this attempt ---------------------------------
  const { data: answers, error: answersErr } = await supabase
    .from("exam_answers")
    .select("*")
    .eq("attempt_id", attemptId);

  if (answersErr) throw new Error(`Failed to load answers: ${answersErr.message}`);
  const typedAnswers = (answers ?? []) as AnswerRow[];

  const answerByQuestion = new Map<string, AnswerRow>();
  for (const a of typedAnswers) answerByQuestion.set(a.question_id, a);

  // -- 5. Grade each answer -------------------------------------------------
  const questionResults: Record<string, GradeResultV2> = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const question of typedQuestions) {
    const answer = answerByQuestion.get(question.id);
    maxScore += question.points;

    // No answer submitted → score 0
    if (!answer) {
      questionResults[question.id] = {
        score: 0, maxScore: question.points, percentage: 0,
        isCorrect: false, isPartial: false, method: "exact",
        confidence: 1, feedback_fr: "Aucune réponse fournie.",
        feedback_de: "Keine Antwort gegeben.",
      };
      continue;
    }

    let result: GradeResultV2;
    let gradedMethod = "auto";

    try {
      const gp = extractGradingParams(question);

      result = await gradeAnswerV2({
        questionType: gp.questionType,
        studentAnswer: answer.response,
        referenceAnswer: gp.referenceAnswer,
        acceptedVariants: gp.acceptedVariants,
        requiredKeywords: gp.requiredKeywords,
        points: question.points,
        locale,
        // Pass grammatik-specific metadata via extra fields (picked up by graders)
        ...(gp.targetTense ? { targetTense: gp.targetTense } : {}),
        ...(gp.direction ? { direction: gp.direction } : {}),
        ...(gp.clauseType ? { clauseType: gp.clauseType } : {}),
        ...(gp.correctModal ? { correctModal: gp.correctModal } : {}),
      } as any);

      gradedMethod = result.method ?? "auto";
    } catch (err) {
      console.error(`[grading-orchestrator] Error grading question ${question.id}:`, err);
      result = {
        score: 0, maxScore: question.points, percentage: 0,
        isCorrect: false, isPartial: false, method: "manual",
        confidence: 0,
        feedback_fr: "Erreur lors de la correction. Cette question sera corrigée manuellement.",
        feedback_de: "Fehler bei der Korrektur. Diese Frage wird manuell korrigiert.",
        needsManualReview: true,
      };
      gradedMethod = "error_manual";
    }

    questionResults[question.id] = result;
    totalScore += result.score;

    // -- 6. Persist per-answer result ---------------------------------------
    const now = new Date().toISOString();
    await supabase.from("exam_answers").update({
      score: result.score,
      is_correct: result.isCorrect,
      feedback_fr: result.feedback_fr || null,
      feedback_ar: locale === "ar" ? result.feedback_fr : result.feedback_de,
      graded_at: now,
      graded_method: gradedMethod,
    }).eq("id", answer.id);
  }

  // -- 7. Persist attempt-level results ------------------------------------
  const gradedAt = new Date().toISOString();
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;

  await supabase.from("exam_attempts").update({
    score: totalScore,
    max_score: maxScore,
    status: "graded",
    graded_at: gradedAt,
  }).eq("id", attemptId);

  return { attemptId, totalScore, maxScore, percentage, questionResults, gradedAt };
}
