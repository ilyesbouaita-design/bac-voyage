// =============================================================================
// grading-engine.ts
// Core grading logic for BacAllemand exam correction.
// Two paths: deterministic exact-match graders and AI-powered graders.
// Implements the exact Bac scoring rules as specified by the teacher.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GradeResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
  feedback_fr: string;     // French feedback (or Arabic if locale is "ar")
  feedback_de: string;     // German grammar note (always German)
  referenceAnswer?: string;
  lessonSuggestion?: string; // e.g., "Revisez la lecon sur le Prateritum"
  details?: {
    rf_score?: number;        // R/F choice score (for R/F type)
    zitat_score?: number;     // Zitat score (for R/F type)
    info_score?: number;      // Information score (for Fragen)
    method_score?: number;    // Method score (for Fragen)
    error_count?: number;     // Error count (for Uebersetzung, Satzbau)
    verb_correct?: boolean;   // Verb check (for Tempus)
    capital_correct?: boolean; // Capital letter check (for Wortbildung)
    artikel_correct?: boolean; // Article check (for Wortbildung)
    [key: string]: any;
  };
}

export interface AIGradeParams {
  type:
    | "richtig_falsch"
    | "fragen"
    | "uebersetzung"
    | "titel"
    | "modalverb"
    | "fragen_stellen"
    | "tempus"
    | "aktiv_passiv"
    | "satzbau"
    | "wortbildung";
  studentAnswer: string;
  referenceAnswer: string;
  originalText?: string;
  question?: string;
  points: number;
  locale: "fr" | "ar";
  /** Extra data depending on the type (e.g., statement, rfChoice, etc.) */
  extra?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Normalize a string for comparison: trim, collapse whitespace, lowercase. */
function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Round to at most 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Get feedback language label for AI prompts. */
function feedbackLang(locale: "fr" | "ar"): string {
  return locale === "ar" ? "Arabic" : "French";
}

/** Get lesson suggestion prefix by locale. */
function lessonPrefix(locale: "fr" | "ar"): string {
  return locale === "ar" ? "📚 نصيحة: راجع درس" : "📚 Conseil : Revisez la lecon sur";
}

// ---------------------------------------------------------------------------
// 1. Deterministic graders
// ---------------------------------------------------------------------------

// ---- 8. Synonym / Gegenteil ----
// Exact match only (case-insensitive). Correct -> full points, wrong -> 0.

export function gradeSynonymGegenteil(
  studentAnswer: string,
  acceptedAnswers: string[],
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  const normalizedStudent = normalize(studentAnswer);
  const match = acceptedAnswers.some((a) => normalize(a) === normalizedStudent);
  const ref = acceptedAnswers.join(" / ");

  if (match) {
    return {
      score: points,
      maxScore: points,
      isCorrect: true,
      isPartial: false,
      feedback_fr: locale === "ar" ? "!صحيح" : "Correct !",
      feedback_de: "Richtig!",
      referenceAnswer: ref,
    };
  }
  return {
    score: 0,
    maxScore: points,
    isCorrect: false,
    isPartial: false,
    feedback_fr: locale === "ar"
      ? `خطأ. الجواب الصحيح هو: ${ref}`
      : `Faux. La bonne reponse est : ${ref}`,
    feedback_de: `Falsch. Die richtige Antwort ist: ${ref}`,
    referenceAnswer: ref,
  };
}

// ---- 9. Kombinieren (matching) ----
// Per-pair scoring: each correct pair gets proportional points.

export function gradeKombinieren(
  studentAnswers: Record<string, string>,
  answerKey: Record<string, string>,
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  const totalPairs = Object.keys(answerKey).length;
  if (totalPairs === 0) {
    return {
      score: points,
      maxScore: points,
      isCorrect: true,
      isPartial: false,
      feedback_fr: locale === "ar" ? "!صحيح" : "Correct !",
      feedback_de: "Richtig!",
    };
  }

  let correctCount = 0;
  const details: Record<string, { student: string; correct: string; isCorrect: boolean }> = {};

  for (const [key, correctValue] of Object.entries(answerKey)) {
    const studentValue = studentAnswers[key] ?? "";
    const isMatch = normalize(studentValue) === normalize(correctValue);
    if (isMatch) correctCount++;
    details[key] = { student: studentValue, correct: correctValue, isCorrect: isMatch };
  }

  const score = round2((correctCount / totalPairs) * points);
  const isCorrect = correctCount === totalPairs;
  const isPartial = correctCount > 0 && !isCorrect;

  return {
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr: locale === "ar"
      ? `.${correctCount}/${totalPairs} إجابات صحيحة`
      : `${correctCount}/${totalPairs} associations correctes.`,
    feedback_de: `${correctCount}/${totalPairs} richtige Zuordnungen.`,
    details,
  };
}

// ---- 11. Konnektoren ----
// Per-gap exact match, partial scoring.

export function gradeKonnektoren(
  studentGaps: Record<string, string>,
  correctGaps: Record<string, string>,
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  return gradeGapBased(studentGaps, correctGaps, points, "connecteurs", "Konnektoren", locale);
}

// ---- 12. Deklination ----
// Per-gap exact match (case-insensitive), partial scoring.

export function gradeDeklination(
  studentGaps: Record<string, string>,
  correctGaps: Record<string, string>,
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  return gradeGapBased(studentGaps, correctGaps, points, "declinaisons", "Deklinationen", locale);
}

/** Shared implementation for gap-based graders (Konnektoren, Deklination). */
function gradeGapBased(
  studentGaps: Record<string, string>,
  correctGaps: Record<string, string>,
  points: number,
  frLabel: string,
  deLabel: string,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  const gapKeys = Object.keys(correctGaps);
  const totalGaps = gapKeys.length;
  if (totalGaps === 0) {
    return {
      score: points,
      maxScore: points,
      isCorrect: true,
      isPartial: false,
      feedback_fr: locale === "ar" ? "!صحيح" : "Correct !",
      feedback_de: "Richtig!",
    };
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

  const score = round2((correctCount / totalGaps) * points);
  const isCorrect = correctCount === totalGaps;
  const isPartial = correctCount > 0 && !isCorrect;

  return {
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr: locale === "ar"
      ? `.${correctCount}/${totalGaps} إجابات صحيحة`
      : `${correctCount}/${totalGaps} ${frLabel} corrects.`,
    feedback_de: `${correctCount}/${totalGaps} richtige ${deLabel}.`,
    details,
  };
}

// ---- Ergaenzen (fill-in-the-blanks) ----
// Per-gap exact match with partial scoring.

export function gradeErgaenzen(
  studentAnswers: Record<number, string>,
  sentences: Array<{ blank_word: string }>,
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  const totalGaps = sentences.length;
  if (totalGaps === 0) {
    return {
      score: points,
      maxScore: points,
      isCorrect: true,
      isPartial: false,
      feedback_fr: locale === "ar" ? "!صحيح" : "Correct !",
      feedback_de: "Richtig!",
    };
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

  const score = round2((correctCount / totalGaps) * points);
  const isCorrect = correctCount === totalGaps;
  const isPartial = correctCount > 0 && !isCorrect;

  return {
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr: locale === "ar"
      ? `.${correctCount}/${totalGaps} كلمات صحيحة`
      : `${correctCount}/${totalGaps} mots corrects.`,
    feedback_de: `${correctCount}/${totalGaps} richtige Worter.`,
    details,
  };
}

// ---- 4. Wortbildung and Komposita ----
// Deterministic scoring:
//   - Word completely wrong -> 0 pts
//   - Word correct -> 0.5 pts
//   - Correct but no Majuskel (capital) -> -0.25
//   - Correct but wrong Artikel -> -0.25
//   - Possible scores: 0, 0.25, 0.5

export function gradeWortbildung(
  studentAnswer: { article?: string; word: string },
  correctAnswer: { article?: string; word: string },
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  const studentWordNorm = normalize(studentAnswer.word);
  const correctWordNorm = normalize(correctAnswer.word);

  // Check if the word itself is correct (case-insensitive)
  const wordCorrect = studentWordNorm === correctWordNorm;

  if (!wordCorrect) {
    const ref = correctAnswer.article
      ? `${correctAnswer.article} ${correctAnswer.word}`
      : correctAnswer.word;
    return {
      score: 0,
      maxScore: points,
      isCorrect: false,
      isPartial: false,
      feedback_fr: locale === "ar"
        ? `خطأ. الجواب الصحيح هو: ${ref}`
        : `Faux. La bonne reponse est : ${ref}`,
      feedback_de: `Falsch. Die richtige Antwort ist: ${ref}`,
      referenceAnswer: ref,
      details: {
        capital_correct: false,
        artikel_correct: false,
      },
    };
  }

  // Word is correct (case-insensitive). Now check Majuskel and Artikel.
  let score = 0.5;
  let capitalCorrect = true;
  let artikelCorrect = true;
  const feedbackParts_fr: string[] = [];
  const feedbackParts_de: string[] = [];

  // Check Majuskel: the student's word must start with a capital letter if the correct one does
  if (correctAnswer.word.charAt(0) !== correctAnswer.word.charAt(0).toLowerCase()) {
    // The correct word starts with a capital letter
    if (studentAnswer.word.charAt(0) !== studentAnswer.word.charAt(0).toUpperCase() ||
        studentAnswer.word.charAt(0) === studentAnswer.word.charAt(0).toLowerCase()) {
      capitalCorrect = false;
      score -= 0.25;
      if (locale === "ar") {
        feedbackParts_fr.push("ينقصك الحرف الكبير في بداية الكلمة");
      } else {
        feedbackParts_fr.push("Il manque la majuscule (Majuskel)");
      }
      feedbackParts_de.push("Großschreibung fehlt (Majuskel)");
    }
  }

  // Check Artikel if one is expected
  if (correctAnswer.article && correctAnswer.article.trim() !== "") {
    const studentArt = normalize(studentAnswer.article ?? "");
    const correctArt = normalize(correctAnswer.article);
    if (studentArt !== correctArt) {
      artikelCorrect = false;
      score -= 0.25;
      if (locale === "ar") {
        feedbackParts_fr.push(`أداة التعريف خاطئة. الصحيح هو: ${correctAnswer.article}`);
      } else {
        feedbackParts_fr.push(`Mauvais article. Le bon article est : ${correctAnswer.article}`);
      }
      feedbackParts_de.push(`Falscher Artikel. Der richtige Artikel ist: ${correctAnswer.article}`);
    }
  }

  score = Math.max(0, score);

  // Scale score proportionally to points: 0.5 pts base maps to full points
  const scaledScore = round2((score / 0.5) * points);

  const ref = correctAnswer.article
    ? `${correctAnswer.article} ${correctAnswer.word}`
    : correctAnswer.word;

  const isCorrect = capitalCorrect && artikelCorrect;
  const isPartial = !isCorrect && score > 0;

  let feedback_fr: string;
  let feedback_de: string;

  if (isCorrect) {
    feedback_fr = locale === "ar" ? "!صحيح" : "Correct !";
    feedback_de = "Richtig!";
  } else {
    feedback_fr = feedbackParts_fr.join(". ") + ".";
    feedback_de = feedbackParts_de.join(". ") + ".";
  }

  return {
    score: scaledScore,
    maxScore: points,
    isCorrect,
    isPartial,
    feedback_fr,
    feedback_de,
    referenceAnswer: ref,
    details: {
      capital_correct: capitalCorrect,
      artikel_correct: artikelCorrect,
    },
  };
}

// Legacy wrapper for compound-only Wortbildung (no article check)
export function gradeWortbildungKompositum(
  studentAnswer: string,
  correctResult: string,
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  return gradeWortbildung(
    { word: studentAnswer },
    { word: correctResult },
    points,
    locale,
  );
}

// Legacy wrapper: Wortbildung Loesen (splitting compound)
export function gradeWortbildungLoesen(
  studentWords: { word1: string; word2: string },
  correctWords: { word1: string; word2: string },
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  const w1Match = normalize(studentWords.word1) === normalize(correctWords.word1);
  const w2Match = normalize(studentWords.word2) === normalize(correctWords.word2);
  const ref = `${correctWords.word1} + ${correctWords.word2}`;

  if (w1Match && w2Match) {
    return {
      score: points,
      maxScore: points,
      isCorrect: true,
      isPartial: false,
      feedback_fr: locale === "ar" ? "!صحيح" : "Correct !",
      feedback_de: "Richtig!",
      referenceAnswer: ref,
    };
  }

  const correctCount = (w1Match ? 1 : 0) + (w2Match ? 1 : 0);
  const score = round2((correctCount / 2) * points);

  return {
    score,
    maxScore: points,
    isCorrect: false,
    isPartial: correctCount > 0,
    feedback_fr: locale === "ar"
      ? `جزئيا صحيح. الجواب الصحيح هو: ${ref}`
      : `Partiellement correct. La bonne reponse est : ${ref}`,
    feedback_de: `Teilweise richtig. Die richtige Antwort ist: ${ref}`,
    referenceAnswer: ref,
    details: { word1Correct: w1Match, word2Correct: w2Match },
  };
}

// ---- Wortableitung ----
// Uses the Wortbildung logic (article + word with Majuskel/Artikel checks)
export function gradeWortableitung(
  studentAnswer: { article: string; word: string },
  acceptedAnswers: Array<{ article: string; word: string }>,
  points: number,
  locale: "fr" | "ar" = "fr",
): GradeResult {
  // Try each accepted answer and return the best score
  let bestResult: GradeResult | null = null;

  for (const accepted of acceptedAnswers) {
    const result = gradeWortbildung(
      { article: studentAnswer.article, word: studentAnswer.word },
      { article: accepted.article, word: accepted.word },
      points,
      locale,
    );
    if (!bestResult || result.score > bestResult.score) {
      bestResult = result;
    }
    if (result.isCorrect) break; // Perfect match, no need to check more
  }

  if (bestResult) {
    const refDisplay = acceptedAnswers
      .map((a) => (a.article ? `${a.article} ${a.word}` : a.word))
      .join(" / ");
    bestResult.referenceAnswer = refDisplay;
    return bestResult;
  }

  // Fallback (should not happen if acceptedAnswers is non-empty)
  const refDisplay = acceptedAnswers
    .map((a) => (a.article ? `${a.article} ${a.word}` : a.word))
    .join(" / ");
  return {
    score: 0,
    maxScore: points,
    isCorrect: false,
    isPartial: false,
    feedback_fr: locale === "ar"
      ? `خطأ. الجواب الصحيح هو: ${refDisplay}`
      : `Faux. La bonne reponse est : ${refDisplay}`,
    feedback_de: `Falsch. Die richtige Antwort ist: ${refDisplay}`,
    referenceAnswer: refDisplay,
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
      score: 0.75,
      feedback: "Reponse partiellement correcte.",
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


// -- AI Prompt builders per grading type ------------------------------------

// ---- 1. Richtig oder Falsch (0.25 R/F + 0.25 Zitat = 0.5 pt per statement) ----
function buildRichtigFalschPrompt(params: AIGradeParams): { system: string; user: string } {
  const e = params.extra ?? {};
  const lang = feedbackLang(params.locale);
  const rfChoice = e.studentRfChoice ?? "";
  const correctRf = e.correctRfChoice ?? "";
  const statement = e.statement ?? "";
  const refZitat = params.referenceAnswer;
  const studentZitat = params.studentAnswer;

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating a Richtig/Falsch question with a Zitat (citation).",
      "Each statement is worth 0.5 points total: 0.25 for the R/F choice and 0.25 for the Zitat.",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      `The student chose "${rfChoice}" for the statement: "${statement}"`,
      `The correct answer is "${correctRf}".`,
      `The student's Zitat (citation from the text) is: "${studentZitat}"`,
      `The reference Zitat is: "${refZitat}"`,
      params.originalText ? `The original text passage is: "${params.originalText}"` : "",
      "",
      "Scoring rules (0.5 pts total per statement):",
      `- R/F choice: 0.25 if the student's choice "${rfChoice}" matches the correct answer "${correctRf}" (exact match), 0 if wrong.`,
      "- Zitat: 0.25 if the student's Zitat correctly supports the answer (even if not word-for-word identical to the reference), 0 if irrelevant or missing.",
      "- total_score = rf_score + zitat_score (maximum 0.5)",
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      "",
      "Respond in JSON:",
      '{',
      '  "rf_score": 0 or 0.25,',
      '  "zitat_score": 0 or 0.25,',
      '  "total_score": 0, 0.25, or 0.5,',
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(optional, in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 2. Fragen zum Text (1 pt per question; -0.5 if answer too long or contains unnecessary extra info) ----
function buildFragenPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating a reading comprehension answer (Fragen zum Text).",
      "Each question is worth 1 point. Deduct 0.5 if the answer is too long or contains unnecessary extra information.",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      params.originalText ? `Text passage:\n"${params.originalText}"` : "",
      params.question ? `\nQuestion: "${params.question}"` : "",
      `\nReference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      "",
      "Scoring rules (1 pt total per question):",
      "1. info_score (1): Does the answer contain the correct information/facts? 1 if yes, 0 if wrong or missing.",
      "2. length_penalty (-0.5): Deduct 0.5 if the answer is too long or contains unnecessary extra information beyond what is needed.",
      "   - Possible total_score values: 1 (correct, no penalty), 0.5 (correct but too long/extra info), or 0 (wrong answer).",
      "   - Do NOT penalize for length if the answer is simply complete and correct.",
      "   - Only penalize if the student adds irrelevant details or restates information not asked.",
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      "If a length penalty is applied, explain briefly why in the feedback.",
      "",
      "Respond in JSON:",
      '{',
      '  "info_score": 0 or 1,',
      '  "length_penalty": 0 or 0.5,',
      '  "total_score": 0, 0.5, or 1,',
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(optional, in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 3. Uebersetzung (full points minus 0.25 per error) ----
function buildUebersetzungPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating a translation (Uebersetzung) from German to Arabic/French.",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      `German original: "${params.originalText ?? params.question ?? ""}"`,
      `Reference translation: "${params.referenceAnswer}"`,
      `Student translation: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Start with full points.",
      "- Deduct 0.25 for EACH mistake where the student's translation does not match the meaning of the original.",
      "- Count the exact number of meaning mismatches/errors.",
      `- Score = max(0, ${params.points} - (error_count * 0.25))`,
      "- Arabic/French can be expressed many ways -- focus on semantic accuracy, not exact wording.",
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      "List each error briefly in the feedback.",
      "",
      "Respond in JSON:",
      '{',
      '  "error_count": <number of meaning errors>,',
      `  "total_score": <max(0, ${params.points} - error_count * 0.25)>,`,
      `  "feedback": "...(in ${lang}, list each error)...",`,
      '  "feedback_de": "...(German note)...",',
      '  "lesson_suggestion": "...(optional, in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 5. Grammatik -- Tempus ----
function buildTempusPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);
  const e = params.extra ?? {};
  const targetTense = e.targetTense ?? "the target tense";

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating a verb tense transformation (Tempus: Prasens/Prateritum/Perfekt/Futur).",
      "IMPORTANT: Focus ONLY on the verb change. Ignore all other differences (capitalization, word order, minor spelling).",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      params.question ? `Original sentence: "${params.question}"` : "",
      `Target tense: ${targetTense}`,
      `Reference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Extract the verb from the original sentence and compare its form in the student's answer.",
      "- IGNORE all other differences (capitalization, word order, etc.).",
      "- Was the verb correctly conjugated in the target tense?",
      `- If verb correct -> ${params.points} points. If wrong -> 0 points.`,
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      `Include a lesson suggestion about the specific tense (e.g., "${lessonPrefix(params.locale)} ${targetTense}").`,
      "",
      "Respond in JSON:",
      '{',
      '  "verb_correct": true or false,',
      `  "total_score": 0 or ${params.points},`,
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 6. Grammatik -- Aktiv/Passiv ----
function buildAktivPassivPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating an active/passive voice transformation (Aktiv/Passiv).",
      "IMPORTANT: Focus on the verb transformation only (active <-> passive auxiliary + participle).",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      params.question ? `Original sentence: "${params.question}"` : "",
      `Reference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Focus on the verb form only (active <-> passive auxiliary + participle).",
      "- AI checks verb form only. Ignore minor word order or capitalization differences.",
      `- If correct -> ${params.points} points. If wrong -> 0 points.`,
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      `Include a lesson suggestion about Aktiv/Passiv.`,
      "",
      "Respond in JSON:",
      '{',
      '  "verb_correct": true or false,',
      `  "total_score": 0 or ${params.points},`,
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 7. Grammatik -- Satzbau ----
function buildSatzbauPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);
  const e = params.extra ?? {};
  const clauseType = e.clauseType ?? "the target clause type";

  return {
    system: [
      "You are grading a German language exam (Bac).",
      `You are evaluating a sentence construction (Satzbau) for: ${clauseType}.`,
      "Focus on TWO things: verb position and comma placement.",
      "IGNORE Majuskel/Minuskel (capitalization) entirely.",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      params.question ? `Original sentence / task: "${params.question}"` : "",
      `Reference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Start with full points.",
      "- -0.25 for each verb position error.",
      "- -0.25 for each comma error.",
      "- IGNORE Majuskel/Minuskel (capitalization) entirely.",
      `- Score = max(0, ${params.points} - (error_count * 0.25))`,
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      `Include a lesson suggestion about ${clauseType}.`,
      "",
      "Respond in JSON:",
      '{',
      '  "error_count": <number of verb position + comma errors>,',
      `  "total_score": <max(0, ${params.points} - error_count * 0.25)>,`,
      `  "feedback": "...(in ${lang}, list each error)...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 10. Titel ----
function buildTitelPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  let acceptedTitles: string[];
  try {
    const parsed = JSON.parse(params.referenceAnswer);
    acceptedTitles = Array.isArray(parsed) ? parsed : [params.referenceAnswer];
  } catch {
    acceptedTitles = [params.referenceAnswer];
  }

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating whether a student's proposed title for a German text is appropriate.",
      "Use semantic comparison -- the student doesn't need to match exactly, just capture the main theme.",
      "Accept variations (e.g., Elektrofahrzeuge / Elektroautos / E-Autos are all valid).",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      `Accepted titles: ${JSON.stringify(acceptedTitles)}`,
      `Student's title: "${params.studentAnswer}"`,
      params.originalText ? `\nOriginal text for context:\n"${params.originalText}"` : "",
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Does the title capture the main theme of the text?",
      "- Accept reasonable semantic variations.",
      `- If acceptable -> ${params.points} points. If irrelevant -> 0 points.`,
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      "",
      "Respond in JSON:",
      '{',
      `  "total_score": 0 or ${params.points},`,
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German note)..."',
      '}',
    ].join("\n"),
  };
}

// ---- 13. Modalverb ----
function buildModalverbPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating the student's sentence rewrite using a modal verb.",
      "Focus on the modal verb only -- was the correct modal verb used?",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      params.question ? `Original sentence / task: "${params.question}"` : "",
      `Reference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Focus on the modal verb only.",
      "- AI checks if the correct modal verb was used and conjugated correctly.",
      `- If correct -> ${params.points} points. If wrong -> 0 points.`,
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      `Include a lesson suggestion about Modalverben.`,
      "",
      "Respond in JSON:",
      '{',
      '  "verb_correct": true or false,',
      `  "total_score": 0 or ${params.points},`,
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 14. Fragen stellen ----
function buildFragenStellenPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "The student was asked to formulate a question for a given answer (Fragen stellen).",
      "Evaluate whether the student's question is correctly formed for the underlined words.",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      `Expected answer (the answer the question should target): "${params.question ?? ""}"`,
      `Reference question: "${params.referenceAnswer}"`,
      `Student's question: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- Is the question correctly formed for the underlined/target words?",
      "- Is it grammatically correct?",
      `- If correct -> ${params.points}. If wrong -> 0.`,
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      `Include a lesson suggestion about Fragebildung if incorrect.`,
      "",
      "Respond in JSON:",
      '{',
      `  "total_score": 0 or ${params.points},`,
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German grammar note)...",',
      '  "lesson_suggestion": "...(optional, in ' + lang + ')..."',
      '}',
    ].join("\n"),
  };
}

// ---- 4. Wortbildung AI fallback (for AI-based Wortbildung checks) ----
function buildWortbildungPrompt(params: AIGradeParams): { system: string; user: string } {
  const lang = feedbackLang(params.locale);

  return {
    system: [
      "You are grading a German language exam (Bac).",
      "You are evaluating a word formation answer (Wortbildung / Komposita).",
      "Respond ONLY with valid JSON. No markdown, no extra text.",
    ].join(" "),
    user: [
      `Reference answer: "${params.referenceAnswer}"`,
      `Student answer: "${params.studentAnswer}"`,
      `Maximum points: ${params.points}`,
      "",
      "Scoring rules:",
      "- If the word is completely wrong -> 0 pts",
      "- If the word is correct (case-insensitive match) -> 0.5 pts base",
      '- If correct but no Majuskel (e.g., "verfuegbarkeit" instead of "Verfuegbarkeit") -> -0.25',
      '- If correct but wrong Artikel (e.g., "der" instead of "die") -> -0.25',
      "- Possible scores: 0, 0.25, 0.5",
      "",
      `Provide feedback in ${lang}. Always provide feedback_de in German.`,
      "",
      "Respond in JSON:",
      '{',
      '  "word_correct": true or false,',
      '  "capital_correct": true or false,',
      '  "artikel_correct": true or false,',
      '  "total_score": <0 to 0.5>,',
      `  "feedback": "...(in ${lang})...",`,
      '  "feedback_de": "...(German note)..."',
      '}',
    ].join("\n"),
  };
}


const PROMPT_BUILDERS: Record<
  AIGradeParams["type"],
  (params: AIGradeParams) => { system: string; user: string }
> = {
  richtig_falsch: buildRichtigFalschPrompt,
  fragen: buildFragenPrompt,
  uebersetzung: buildUebersetzungPrompt,
  tempus: buildTempusPrompt,
  aktiv_passiv: buildAktivPassivPrompt,
  satzbau: buildSatzbauPrompt,
  titel: buildTitelPrompt,
  modalverb: buildModalverbPrompt,
  fragen_stellen: buildFragenStellenPrompt,
  wortbildung: buildWortbildungPrompt,
};


/**
 * Grade a question using an AI model.
 * Builds a type-specific prompt, calls the LLM, parses the JSON response.
 * Each prompt specifies the exact scoring criteria and expected JSON schema.
 */
export async function gradeWithAI(params: AIGradeParams): Promise<GradeResult> {
  const builder = PROMPT_BUILDERS[params.type];
  if (!builder) {
    throw new Error(`Unknown AI grading type: ${params.type}`);
  }

  const { system, user } = builder(params);
  const raw = await callAI(system, user);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${raw}`);
  }

  // Extract scores based on the type
  const totalScore = Math.max(0, Math.min(params.points, round2(Number(parsed.total_score) || 0)));
  const feedback_locale = parsed.feedback || "";
  const feedback_de = parsed.feedback_de || "";
  const lessonSuggestion = parsed.lesson_suggestion || undefined;

  // Build details object based on type
  const details: GradeResult["details"] = {};

  switch (params.type) {
    case "richtig_falsch":
      details.rf_score = Number(parsed.rf_score) || 0;
      details.zitat_score = Number(parsed.zitat_score) || 0;
      break;
    case "fragen":
      details.info_score = Number(parsed.info_score) || 0;
      details.method_score = Number(parsed.length_penalty ?? parsed.method_score) || 0;
      break;
    case "uebersetzung":
      details.error_count = Number(parsed.error_count) || 0;
      break;
    case "tempus":
    case "aktiv_passiv":
    case "modalverb":
      details.verb_correct = !!parsed.verb_correct;
      break;
    case "satzbau":
      details.error_count = Number(parsed.error_count) || 0;
      break;
    case "wortbildung":
      details.capital_correct = !!parsed.capital_correct;
      details.artikel_correct = !!parsed.artikel_correct;
      break;
  }

  return {
    score: totalScore,
    maxScore: params.points,
    isCorrect: totalScore === params.points,
    isPartial: totalScore > 0 && totalScore < params.points,
    feedback_fr: feedback_locale,
    feedback_de,
    referenceAnswer: params.referenceAnswer,
    lessonSuggestion,
    details,
  };
}


// ---------------------------------------------------------------------------
// 3. Main orchestrator: route to the correct grader by bacType
// ---------------------------------------------------------------------------

/**
 * Grade a single question.
 *
 * @param bacType        The question's bac exercise type identifier.
 * @param content        The question's `bac_content` object (shape varies by type).
 * @param studentResponse  The student's response (shape varies by type).
 * @param points         Maximum points for this question.
 * @param passageText    The German text passage (used as AI context).
 * @param locale         The student's UI locale ("fr" or "ar").
 */
export async function gradeQuestion(
  bacType: string,
  content: any,
  studentResponse: any,
  points: number,
  passageText?: string,
  locale?: "fr" | "ar",
): Promise<GradeResult> {
  const loc = locale ?? "fr";

  switch (bacType) {
    // ==================================================================
    // 1. Richtig oder Falsch (AI: 0.25 R/F + 0.25 Zitat = 0.5 per statement)
    // ==================================================================
    case "richtig_falsch_zitat":
    case "richtig_falsch":
    case "zitat": {
      // studentResponse can be { rfChoice: "richtig"|"falsch", zitat: "..." }
      // or just a string (legacy Zitat-only grading)
      const studentRfChoice =
        typeof studentResponse === "object"
          ? (studentResponse?.rfChoice ?? studentResponse?.rf_choice ?? "")
          : "";
      const studentZitat =
        typeof studentResponse === "object"
          ? (studentResponse?.zitat ?? studentResponse?.citation ?? "")
          : String(studentResponse ?? "");
      const correctRfChoice =
        content.correct_rf ?? content.correctRf ?? content.correct_choice ?? "";
      const statement = content.statement ?? content.question ?? "";

      return gradeWithAI({
        type: "richtig_falsch",
        studentAnswer: studentZitat,
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? content.reference_zitat ?? "",
        originalText: passageText,
        question: statement,
        points,
        locale: loc,
        extra: {
          studentRfChoice,
          correctRfChoice,
          statement,
        },
      });
    }

    // ==================================================================
    // 2. Fragen zum Text (AI: 1 pt; -0.5 if too long or unnecessary extra info)
    // ==================================================================
    case "fragen":
    case "fragen_zum_text":
      return gradeWithAI({
        type: "fragen",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question,
        points,
        locale: loc,
      });

    // ==================================================================
    // 3. Uebersetzung (AI: full points minus 0.25 per error)
    // ==================================================================
    case "uebersetzung":
      return gradeWithAI({
        type: "uebersetzung",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: content.german_sentence ?? content.germanSentence ?? passageText ?? "",
        question: content.question,
        points,
        locale: loc === "fr" ? loc : "ar", // Uebersetzung defaults to ar
      });

    // ==================================================================
    // 4. Wortbildung and Komposita (deterministic)
    // ==================================================================
    case "wortbildung":
    case "wortbildung_kompositum": {
      // If studentResponse is an object with article+word, use the full check
      if (typeof studentResponse === "object" && studentResponse?.word) {
        return gradeWortbildung(
          { article: studentResponse.article ?? "", word: studentResponse.word },
          {
            article: content.correct_article ?? content.correctArticle ?? "",
            word: content.correct_result ?? content.correctResult ?? content.correct_answer ?? "",
          },
          points,
          loc,
        );
      }
      // Legacy: just a string answer
      return gradeWortbildungKompositum(
        String(studentResponse ?? ""),
        content.correct_result ?? content.correctResult ?? "",
        points,
        loc,
      );
    }

    case "wortbildung_loesen":
      return gradeWortbildungLoesen(
        studentResponse ?? { word1: "", word2: "" },
        content.correct ?? { word1: "", word2: "" },
        points,
        loc,
      );

    case "wortableitung":
      return gradeWortableitung(
        studentResponse ?? { article: "", word: "" },
        content.accepted_answers ?? content.acceptedAnswers ?? [],
        points,
        loc,
      );

    // ==================================================================
    // 5. Grammatik -- Tempus (AI: verb check only)
    // ==================================================================
    case "tempus":
      return gradeWithAI({
        type: "tempus",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.correct_answer ?? content.correctAnswer ?? "",
        originalText: passageText,
        question: content.question ?? content.original_sentence ?? content.originalSentence ?? "",
        points,
        locale: loc,
        extra: {
          targetTense: content.target_tense ?? content.targetTense ?? content.tense ?? "",
        },
      });

    // ==================================================================
    // 6. Grammatik -- Aktiv/Passiv (AI: verb form only)
    // ==================================================================
    case "aktiv_passiv":
      return gradeWithAI({
        type: "aktiv_passiv",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.correct_answer ?? content.correctAnswer ?? "",
        originalText: passageText,
        question: content.question ?? content.original_sentence ?? content.originalSentence ?? "",
        points,
        locale: loc,
      });

    // ==================================================================
    // 7. Grammatik -- Satzbau (AI: verb position + comma, -0.25 each)
    // ==================================================================
    case "satzbau":
      return gradeWithAI({
        type: "satzbau",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.correct_answer ?? content.correctAnswer ?? "",
        originalText: passageText,
        question: content.question ?? content.original_sentence ?? content.originalSentence ?? "",
        points,
        locale: loc,
        extra: {
          clauseType: content.clause_type ?? content.clauseType ?? content.satztyp ??
            "Finalsatz/Konditionalsatz/Konzessivsatz/Temporalsatz/Relativsatz",
        },
      });

    // ==================================================================
    // 8. Synonym / Gegenteil (exact match, no partial)
    // ==================================================================
    case "synonym":
    case "gegenteil":
    case "synonym_gegenteil":
      return gradeSynonymGegenteil(
        String(studentResponse ?? ""),
        content.accepted_answers ?? content.acceptedAnswers ?? [],
        points,
        loc,
      );

    // ==================================================================
    // 9. Kombinieren (per-pair proportional scoring)
    // ==================================================================
    case "kombinieren":
      return gradeKombinieren(
        studentResponse ?? {},
        content.answer_key ?? content.answerKey ?? {},
        points,
        loc,
      );

    // ==================================================================
    // 10. Titel (AI semantic comparison)
    // ==================================================================
    case "titel":
      return gradeWithAI({
        type: "titel",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: JSON.stringify(
          content.accepted_titles ?? content.acceptedTitles ?? [content.reference_answer ?? ""],
        ),
        originalText: passageText,
        points,
        locale: loc,
      });

    // ==================================================================
    // 11. Konnektoren (per-gap exact match, partial scoring)
    // ==================================================================
    case "konnektoren":
      return gradeKonnektoren(
        studentResponse ?? {},
        content.correct_gaps ?? content.correctGaps ?? {},
        points,
        loc,
      );

    // ==================================================================
    // 12. Deklination (per-gap exact match, case-insensitive, partial)
    // ==================================================================
    case "deklination":
      return gradeDeklination(
        studentResponse ?? {},
        content.correct_gaps ?? content.correctGaps ?? {},
        points,
        loc,
      );

    // ==================================================================
    // 13. Modalverb (AI: modal verb check only)
    // ==================================================================
    case "modalverb":
      return gradeWithAI({
        type: "modalverb",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question ?? content.original_sentence ?? "",
        points,
        locale: loc,
      });

    // ==================================================================
    // 14. Fragen stellen (AI: question formation check)
    // ==================================================================
    case "fragen_stellen":
      return gradeWithAI({
        type: "fragen_stellen",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.target_answer ?? content.targetAnswer ?? content.question ?? "",
        points,
        locale: loc,
      });

    // ==================================================================
    // Ergaenzen (fill-in-the-blanks, deterministic)
    // ==================================================================
    case "ergaenzen":
      return gradeErgaenzen(
        studentResponse ?? {},
        content.sentences ?? [],
        points,
        loc,
      );

    // ==================================================================
    // Fallback: unknown type -> AI-based fragen grading
    // ==================================================================
    default:
      console.warn(`[grading-engine] Unknown bacType "${bacType}", falling back to AI grading.`);
      return gradeWithAI({
        type: "fragen",
        studentAnswer: String(studentResponse ?? ""),
        referenceAnswer: content.reference_answer ?? content.referenceAnswer ?? "",
        originalText: passageText,
        question: content.question ?? "",
        points,
        locale: loc,
      });
  }
}
