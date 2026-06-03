// =============================================================================
// grading-engine.ts
// Core grading logic for BacAllemand exam correction.
// Two paths: deterministic exact-match graders and AI-powered graders.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GradeResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
  feedback_fr: string;
  feedback_de: string;
  referenceAnswer?: string;
  details?: any;
}

export interface AIGradeParams {
  type: "zitat" | "fragen" | "uebersetzung" | "titel" | "modalverb" | "fragen_stellen";
  studentAnswer: string;
  referenceAnswer: string;
  originalText?: string;
  question?: string;
  points: number;
  locale: "fr" | "ar";
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Normalize a string for comparison: trim, collapse whitespace, lowercase. */
function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Build a "correct" GradeResult. */
function correct(points: number, refAnswer?: string): GradeResult {
  return {
    score: points,
    maxScore: points,
    isCorrect: true,
    isPartial: false,
    feedback_fr: "Correct !",
    feedback_de: "Richtig!",
    referenceAnswer: refAnswer,
  };
}

/** Build an "incorrect" GradeResult with the expected answer shown. */
function incorrect(points: number, refAnswer: string): GradeResult {
  return {
    score: 0,
    maxScore: points,
    isCorrect: false,
    isPartial: false,
    feedback_fr: `Faux. La bonne reponse est : ${refAnswer}`,
    feedback_de: `Falsch. Die richtige Antwort ist: ${refAnswer}`,
    referenceAnswer: refAnswer,
  };
}

// ---------------------------------------------------------------------------
// 1. Exact-match graders
// ---------------------------------------------------------------------------

/**
 * Synonym / Gegenteil grader.
 * Student provides a single word; it must match one of the accepted answers.
 */
export function gradeSynonymGegenteil(
  studentAnswer: string,
  acceptedAnswers: string[],
  points: number,
): GradeResult {
  const normalizedStudent = normalize(studentAnswer);
  const match = acceptedAnswers.some((a) => normalize(a) === normalizedStudent);

  if (match) {
    return correct(points, acceptedAnswers[0]);
  }
  return incorrect(points, acceptedAnswers.join(" / "));
}

/**
 * Kombinieren (matching) grader.
 * Student maps keys to values; each correct pair earns proportional points.
 */
export function gradeKombinieren(
  studentAnswers: Record<string, string>,
  answerKey: Record<string, string>,
  points: number,
): GradeResult {
  const totalPairs = Object.keys(answerKey).length;
  if (totalPairs === 0) {
    return correct(points);
  }

  let correctCount = 0;
  const details: Record<string, { student: string; correct: string; isCorrect: boolean }> = {};

  for (const [key, correctValue] of Object.entries(answerKey)) {
    const studentValue = studentAnswers[key] ?? "";
    const isMatch = normalize(studentValue) === normalize(correctValue);
    if (isMatch) correctCount++;
    details[key] = { student: studentValue, correct: correctValue, isCorrect: isMatch };
  }

  const score = Math.round((correctCount / totalPairs) * points * 100) / 100;
  const isCorrect = correctCount === totalPairs;
  const isPartial = correctCount > 0 && !isCorrect;

  return {
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr: `${correctCount}/${totalPairs} associations correctes.`,
    feedback_de: `${correctCount}/${totalPairs} richtige Zuordnungen.`,
    details,
  };
}

/**
 * Ergaenzen (fill-in-the-blanks) grader.
 * Each gap is checked individually; partial scoring applies.
 */
export function gradeErgaenzen(
  studentAnswers: Record<number, string>,
  sentences: Array<{ blank_word: string }>,
  points: number,
): GradeResult {
  const totalGaps = sentences.length;
  if (totalGaps === 0) {
    return correct(points);
  }

  let correctCount = 0;
  const details: Array<{ index: number; student: string; correct: string; isCorrect: boolean }> = [];

  for (let i = 0; i < totalGaps; i++) {
    const expected = sentences[i].blank_word;
    const studentValue = studentAnswers[i] ?? "";
    const isMatch = normalize(studentValue) === normalize(expected);
    if (isMatch) correctCount++;
    details.push({ index: i, student: studentValue, correct: expected, isCorrect: isMatch });
  }

  const score = Math.round((correctCount / totalGaps) * points * 100) / 100;
  const isCorrect = correctCount === totalGaps;
  const isPartial = correctCount > 0 && !isCorrect;

  return {
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr: `${correctCount}/${totalGaps} mots corrects.`,
    feedback_de: `${correctCount}/${totalGaps} richtige Worter.`,
    details,
  };
}

/**
 * Wortbildung Kompositum grader.
 * Student provides a compound word; exact match (case-insensitive).
 */
export function gradeWortbildungKompositum(
  studentAnswer: string,
  correctResult: string,
  points: number,
): GradeResult {
  if (normalize(studentAnswer) === normalize(correctResult)) {
    return correct(points, correctResult);
  }
  return incorrect(points, correctResult);
}

/**
 * Wortbildung Loesen grader.
 * Student splits a compound into two words; both must match in order.
 */
export function gradeWortbildungLoesen(
  studentWords: { word1: string; word2: string },
  correctWords: { word1: string; word2: string },
  points: number,
): GradeResult {
  const w1Match = normalize(studentWords.word1) === normalize(correctWords.word1);
  const w2Match = normalize(studentWords.word2) === normalize(correctWords.word2);

  if (w1Match && w2Match) {
    return correct(points, `${correctWords.word1} + ${correctWords.word2}`);
  }

  const correctCount = (w1Match ? 1 : 0) + (w2Match ? 1 : 0);
  const score = Math.round((correctCount / 2) * points * 100) / 100;
  const ref = `${correctWords.word1} + ${correctWords.word2}`;

  return {
    score,
    maxScore: points,
    isCorrect: false,
    isPartial: correctCount > 0,
    feedback_fr: `Partiellement correct. La bonne reponse est : ${ref}`,
    feedback_de: `Teilweise richtig. Die richtige Antwort ist: ${ref}`,
    referenceAnswer: ref,
    details: { word1Correct: w1Match, word2Correct: w2Match },
  };
}

/**
 * Wortableitung grader.
 * Student provides article + derived word; checked against accepted answers.
 * Article comparison is case-insensitive, word comparison is case-insensitive.
 */
export function gradeWortableitung(
  studentAnswer: { article: string; word: string },
  acceptedAnswers: Array<{ article: string; word: string }>,
  points: number,
): GradeResult {
  const match = acceptedAnswers.some((accepted) => {
    const articleMatch =
      accepted.article === ""
        ? true
        : normalize(studentAnswer.article) === normalize(accepted.article);
    const wordMatch = normalize(studentAnswer.word) === normalize(accepted.word);
    return articleMatch && wordMatch;
  });

  const refDisplay = acceptedAnswers
    .map((a) => (a.article ? `${a.article} ${a.word}` : a.word))
    .join(" / ");

  if (match) {
    return correct(points, refDisplay);
  }
  return incorrect(points, refDisplay);
}

/**
 * Grammatik exact grader.
 * Used for Tempus, AktivPassiv, Satzbau: full sentence comparison.
 * Trims whitespace, normalizes multiple spaces, case-insensitive.
 */
export function gradeGrammatikExact(
  studentAnswer: string,
  correctAnswer: string,
  points: number,
): GradeResult {
  if (normalize(studentAnswer) === normalize(correctAnswer)) {
    return correct(points, correctAnswer);
  }
  return incorrect(points, correctAnswer);
}

/**
 * Konnektoren grader.
 * Per-gap case-insensitive match with partial scoring.
 */
export function gradeKonnektoren(
  studentGaps: Record<string, string>,
  correctGaps: Record<string, string>,
  points: number,
): GradeResult {
  return gradeGapBased(studentGaps, correctGaps, points, "connecteurs", "Konnektoren");
}

/**
 * Deklination grader.
 * Per-gap case-insensitive match with partial scoring.
 */
export function gradeDeklination(
  studentGaps: Record<string, string>,
  correctGaps: Record<string, string>,
  points: number,
): GradeResult {
  return gradeGapBased(studentGaps, correctGaps, points, "declinaisons", "Deklinationen");
}

/** Shared implementation for gap-based graders (Konnektoren, Deklination). */
function gradeGapBased(
  studentGaps: Record<string, string>,
  correctGaps: Record<string, string>,
  points: number,
  frLabel: string,
  deLabel: string,
): GradeResult {
  const gapKeys = Object.keys(correctGaps);
  const totalGaps = gapKeys.length;
  if (totalGaps === 0) {
    return correct(points);
  }

  let correctCount = 0;
  const details: Record<string, { student: string; correct: string; isCorrect: boolean }> = {};

  for (const key of gapKeys) {
    const expected = correctGaps[key];
    const studentValue = studentGaps[key] ?? "";
    const isMatch = normalize(studentValue) === normalize(expected);
    if (isMatch) correctCount++;
    details[key] = { student: studentValue, correct: expected, isCorrect: isMatch };
  }

  const score = Math.round((correctCount / totalGaps) * points * 100) / 100;
  const isCorrect = correctCount === totalGaps;
  const isPartial = correctCount > 0 && !isCorrect;

  return {
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr: `${correctCount}/${totalGaps} ${frLabel} corrects.`,
    feedback_de: `${correctCount}/${totalGaps} richtige ${deLabel}.`,
    details,
  };
}

// ---------------------------------------------------------------------------
// 2. AI-powered grading
// ---------------------------------------------------------------------------

/**
 * Call an LLM (currently OpenAI) with the given prompts.
 * Falls back to a deterministic mock when no API key is configured.
 */
export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_OPENAI_API_KEY
      : undefined;

  if (!apiKey) {
    // Development fallback: return a mock grading result.
    return JSON.stringify({
      score_ratio: 0.75,
      feedback_fr: "Reponse partiellement correcte.",
      feedback_de: "Teilweise richtige Antwort.",
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// -- Prompt builders per AI grading type ------------------------------------

function buildZitatPrompt(params: AIGradeParams): { system: string; user: string } {
  return {
    system: [
      "You are a German language exam corrector for the Moroccan Baccalaureate.",
      "Compare the student's citation (Zitat) from a text with the reference citation.",
      "The student must have found a relevant passage from the text that justifies their R/F answer.",
      "Respond ONLY with valid JSON.",
    ].join(" "),
    user: [
      `Reference Zitat: "${params.referenceAnswer}"`,
      `Student Zitat: "${params.studentAnswer}"`,
      params.originalText ? `\nOriginal text for context:\n"${params.originalText}"` : "",
      "",
      "Evaluate: Is the student's citation relevant and sufficient?",
      "Score 0 (wrong), 0.5 (partial - relevant but incomplete), or 1 (correct).",
      'Respond in JSON: { "score_ratio": 0|0.5|1, "feedback_fr": "...", "feedback_de": "..." }',
    ].join("\n"),
  };
}

function buildFragenPrompt(params: AIGradeParams): { system: string; user: string } {
  return {
    system: [
      "You are a German language exam corrector for the Moroccan Baccalaureate.",
      "Evaluate the student's answer to a reading comprehension question based on the provided text.",
      "Respond ONLY with valid JSON.",
    ].join(" "),
    user: [
      params.originalText ? `Text passage:\n"${params.originalText}"` : "",
      params.question ? `\nQuestion: "${params.question}"` : "",
      `\nReference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      "",
      "Evaluate completeness and accuracy.",
      "Score 0 (wrong), 0.25, 0.5 (partial), 0.75, or 1 (complete).",
      'Respond in JSON: { "score_ratio": 0|0.25|0.5|0.75|1, "feedback_fr": "...", "feedback_de": "..." }',
    ].join("\n"),
  };
}

function buildUebersetzungPrompt(params: AIGradeParams): { system: string; user: string } {
  return {
    system: [
      "You are a German-Arabic translation corrector for the Moroccan Baccalaureate.",
      "Compare the student's Arabic translation with the reference translation of a German sentence.",
      "Arabic can be expressed many ways - focus on semantic accuracy, not exact wording.",
      "Respond ONLY with valid JSON.",
    ].join(" "),
    user: [
      `German original: "${params.originalText ?? ""}"`,
      `Reference translation: "${params.referenceAnswer}"`,
      `Student translation: "${params.studentAnswer}"`,
      "",
      "Score 0 (wrong meaning), 0.5 (partial/imprecise), 0.75 (mostly correct), 1 (fully correct).",
      'Respond in JSON: { "score_ratio": 0|0.5|0.75|1, "feedback_fr": "...", "feedback_de": "..." }',
    ].join("\n"),
  };
}

function buildTitelPrompt(params: AIGradeParams): { system: string; user: string } {
  // referenceAnswer may be a JSON-encoded array of accepted titles, or a single string.
  let acceptedTitles: string[];
  try {
    const parsed = JSON.parse(params.referenceAnswer);
    acceptedTitles = Array.isArray(parsed) ? parsed : [params.referenceAnswer];
  } catch {
    acceptedTitles = [params.referenceAnswer];
  }

  return {
    system: [
      "You are evaluating whether a student's proposed title for a German text is appropriate.",
      "Compare with the accepted titles semantically - the student doesn't need to match exactly,",
      "just capture the main theme.",
      "Respond ONLY with valid JSON.",
    ].join(" "),
    user: [
      `Accepted titles: ${JSON.stringify(acceptedTitles)}`,
      `Student's title: "${params.studentAnswer}"`,
      params.originalText ? `\nOriginal text for context:\n"${params.originalText}"` : "",
      "",
      "Score 0 (irrelevant) or 1 (acceptable).",
      'Respond in JSON: { "score_ratio": 0|1, "feedback_fr": "...", "feedback_de": "..." }',
    ].join("\n"),
  };
}

function buildModalverbPrompt(params: AIGradeParams): { system: string; user: string } {
  return {
    system: [
      "You are a German language exam corrector for the Moroccan Baccalaureate.",
      "Evaluate the student's sentence rewrite using a modal verb.",
      "Check that the modal verb is used correctly and the meaning is preserved.",
      "Respond ONLY with valid JSON.",
    ].join(" "),
    user: [
      params.question ? `Original sentence / task: "${params.question}"` : "",
      `Reference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      "",
      "Score 0 (wrong), 0.5 (partial - correct modal but grammatical errors), 0.75 (minor issues), or 1 (correct).",
      'Respond in JSON: { "score_ratio": 0|0.5|0.75|1, "feedback_fr": "...", "feedback_de": "..." }',
    ].join("\n"),
  };
}

function buildFragenStellenPrompt(params: AIGradeParams): { system: string; user: string } {
  return {
    system: [
      "You are a German language exam corrector for the Moroccan Baccalaureate.",
      "The student was asked to formulate a question for a given answer (Fragen stellen).",
      "Evaluate whether the student's question is grammatically correct and semantically appropriate",
      "for the given answer.",
      "Respond ONLY with valid JSON.",
    ].join(" "),
    user: [
      `Expected answer (the answer the question should target): "${params.question ?? ""}"`,
      `Reference question: "${params.referenceAnswer}"`,
      `Student's question: "${params.studentAnswer}"`,
      "",
      "Score 0 (wrong), 0.5 (partially correct), 0.75 (minor issues), or 1 (correct).",
      'Respond in JSON: { "score_ratio": 0|0.5|0.75|1, "feedback_fr": "...", "feedback_de": "..." }',
    ].join("\n"),
  };
}

const PROMPT_BUILDERS: Record<
  AIGradeParams["type"],
  (params: AIGradeParams) => { system: string; user: string }
> = {
  zitat: buildZitatPrompt,
  fragen: buildFragenPrompt,
  uebersetzung: buildUebersetzungPrompt,
  titel: buildTitelPrompt,
  modalverb: buildModalverbPrompt,
  fragen_stellen: buildFragenStellenPrompt,
};

/**
 * Grade a question using an AI model.
 * Builds a type-specific prompt, calls the LLM, parses the JSON response.
 */
export async function gradeWithAI(params: AIGradeParams): Promise<GradeResult> {
  const builder = PROMPT_BUILDERS[params.type];
  if (!builder) {
    throw new Error(`Unknown AI grading type: ${params.type}`);
  }

  const { system, user } = builder(params);
  const raw = await callAI(system, user);

  let parsed: { score_ratio: number; feedback_fr: string; feedback_de: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${raw}`);
  }

  const scoreRatio = Math.max(0, Math.min(1, Number(parsed.score_ratio) || 0));
  const score = Math.round(scoreRatio * params.points * 100) / 100;

  return {
    score,
    maxScore: params.points,
    isCorrect: scoreRatio === 1,
    isPartial: scoreRatio > 0 && scoreRatio < 1,
    feedback_fr: parsed.feedback_fr || "",
    feedback_de: parsed.feedback_de || "",
    referenceAnswer: params.referenceAnswer,
  };
}

// ---------------------------------------------------------------------------
// 3. Main orchestrator: route to the correct grader by bacType
// ---------------------------------------------------------------------------

/**
 * Grade a single question.
 *
 * @param bacType      The question's bac exercise type identifier.
 * @param content      The question's `bac_content` object (shape varies by type).
 * @param studentResponse  The student's response (shape varies by type).
 * @param points       Maximum points for this question.
 * @param passageText  The German text passage (used as AI context).
 * @param locale       The student's UI locale ("fr" or "ar").
 */
export async function gradeQuestion(
  bacType: string,
  content: any,
  studentResponse: any,
  points: number,
  passageText?: string,
  locale?: "fr" | "ar",
): Promise<GradeResult> {
  switch (bacType) {
    // -- Exact-match types --------------------------------------------------

    case "synonym":
    case "gegenteil":
    case "synonym_gegenteil":
      return gradeSynonymGegenteil(
        String(studentResponse ?? ""),
        content.accepted_answers ?? content.acceptedAnswers ?? [],
        points,
      );

    case "kombinieren":
      return gradeKombinieren(
        studentResponse ?? {},
        content.answer_key ?? content.answerKey ?? {},
        points,
      );

    case "ergaenzen":
      return gradeErgaenzen(
        studentResponse ?? {},
        content.sentences ?? [],
        points,
      );

    case "wortbildung_kompositum":
      return gradeWortbildungKompositum(
        String(studentResponse ?? ""),
        content.correct_result ?? content.correctResult ?? "",
        points,
      );

    case "wortbildung_loesen":
      return gradeWortbildungLoesen(
        studentResponse ?? { word1: "", word2: "" },
        content.correct ?? { word1: "", word2: "" },
        points,
      );

    case "wortableitung":
      return gradeWortableitung(
        studentResponse ?? { article: "", word: "" },
        content.accepted_answers ?? content.acceptedAnswers ?? [],
        points,
      );

    case "tempus":
    case "aktiv_passiv":
    case "satzbau":
    case "grammatik_exact":
      return gradeGrammatikExact(
        String(studentResponse ?? ""),
        content.correct_answer ?? content.correctAnswer ?? "",
        points,
      );

    case "konnektoren":
      return gradeKonnektoren(
        studentResponse ?? {},
        content.correct_gaps ?? content.correctGaps ?? {},
        points,
      );

    case "deklination":
      return gradeDeklination(
        studentResponse ?? {},
        content.correct_gaps ?? content.correctGaps ?? {},
        points,
      );

    // -- AI-powered types ---------------------------------------------------

    case "richtig_falsch_zitat":
    case "zitat":
      return gradeWithAI({
        type: "zitat",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question,
        points,
        locale: locale ?? "fr",
      });

    case "fragen":
    case "fragen_zum_text":
      return gradeWithAI({
        type: "fragen",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question,
        points,
        locale: locale ?? "fr",
      });

    case "uebersetzung":
      return gradeWithAI({
        type: "uebersetzung",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: content.german_sentence ?? content.germanSentence ?? passageText ?? "",
        question: content.question,
        points,
        locale: locale ?? "ar",
      });

    case "titel":
      return gradeWithAI({
        type: "titel",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: JSON.stringify(
          content.accepted_titles ?? content.acceptedTitles ?? [content.reference_answer ?? ""],
        ),
        originalText: passageText,
        points,
        locale: locale ?? "fr",
      });

    case "modalverb":
      return gradeWithAI({
        type: "modalverb",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question ?? content.original_sentence ?? "",
        points,
        locale: locale ?? "fr",
      });

    case "fragen_stellen":
      return gradeWithAI({
        type: "fragen_stellen",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.target_answer ?? content.targetAnswer ?? content.question ?? "",
        points,
        locale: locale ?? "fr",
      });

    // -- Fallback -----------------------------------------------------------

    default:
      console.warn(`[grading-engine] Unknown bacType "${bacType}", falling back to AI grading.`);
      return gradeWithAI({
        type: "fragen",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question ?? "",
        points,
        locale: locale ?? "fr",
      });
  }
}
