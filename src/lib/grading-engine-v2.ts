// =============================================================================
// grading-engine-v2.ts
// Offline, 4-layer German exam grading engine for BacAllemand.
//
// Replaces the OpenAI-based grader. Runs entirely browser-side with no API
// calls. Layers, in order of preference:
//
//   Layer 1  Exact + Fuzzy (Damerau-Levenshtein) match      -> gradeExact()
//   Layer 2  German tolerance rules (caps/comma/umlaut/...)  -> applyToleranceRules()
//   Layer 3  Keyword-presence scoring (stemmed)             -> gradeByKeywords()
//   Layer 4  Semantic similarity (optional embedding model) -> gradeWithEmbedding()
//
// The main router gradeAnswerV2() picks the right sequence per question type
// and returns the best GradeResultV2 with localized feedback.
// =============================================================================

import { normalizeDE, stemDE, GERMAN_IRREGULAR_VERBS } from "./german-morphology";
import { embeddingService } from "./embedding-service";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------
export interface GradeResultV2 {
  score: number; // 0 to points
  maxScore: number;
  percentage: number; // 0-100
  isCorrect: boolean;
  isPartial: boolean;
  method: "exact" | "fuzzy" | "variant" | "semantic" | "keyword" | "rule" | "manual";
  confidence: number; // 0-1, how confident the engine is
  feedback_fr: string;
  feedback_de: string;
  details?: {
    editDistance?: number;
    fuseScore?: number;
    keywordsFound?: string[];
    keywordsMissing?: string[];
    toleranceApplied?: string[]; // e.g. ["kapitalisierung_ignored", "komma_forgiven"]
  };
  needsManualReview?: boolean; // true when confidence < 0.5
}

export type Locale = "fr" | "ar" | "de";

// ---------------------------------------------------------------------------
// Tolerance rule types
// ---------------------------------------------------------------------------
export type ToleranceRuleId =
  | "IGNORE_CAPITALIZATION"
  | "IGNORE_ARTICLE"
  | "FORGIVE_COMMA"
  | "ACCEPT_ABBREVIATED_ARTICLE"
  | "IGNORE_TRAILING_PERIOD"
  | "ACCEPT_UMLAUT_ALTERNATIVE"
  | "ACCEPT_HYPHEN_VARIATION"
  | string; // custom admin-defined rules

export interface ToleranceRule {
  id: ToleranceRuleId;
  /** 0 = no penalty, 0.25 = deduct 25% of points, etc. */
  penalty: number;
  /** Optional custom transform for admin-defined rules (JSON-driven). */
  pattern?: string; // regex source
  replacement?: string;
  /** Human label for the details.toleranceApplied array. */
  label?: string;
}

// Built-in rule catalogue with default penalties. Admins may override penalties
// or add custom rules via Supabase (grading_rules table / profiles.extra JSON)
// and pass them through gradeAnswerV2({ toleranceRules }).
export const DEFAULT_TOLERANCE_RULES: Record<string, ToleranceRule> = {
  IGNORE_CAPITALIZATION: { id: "IGNORE_CAPITALIZATION", penalty: 0, label: "kapitalisierung_ignored" },
  IGNORE_ARTICLE: { id: "IGNORE_ARTICLE", penalty: 0.25, label: "artikel_toleriert" },
  FORGIVE_COMMA: { id: "FORGIVE_COMMA", penalty: 0.2, label: "komma_forgiven" },
  ACCEPT_ABBREVIATED_ARTICLE: { id: "ACCEPT_ABBREVIATED_ARTICLE", penalty: 0, label: "artikel_abgekuerzt" },
  IGNORE_TRAILING_PERIOD: { id: "IGNORE_TRAILING_PERIOD", penalty: 0, label: "punkt_ignoriert" },
  ACCEPT_UMLAUT_ALTERNATIVE: { id: "ACCEPT_UMLAUT_ALTERNATIVE", penalty: 0, label: "umlaut_alternative" },
  ACCEPT_HYPHEN_VARIATION: { id: "ACCEPT_HYPHEN_VARIATION", penalty: 0, label: "bindestrich_variation" },
};

// ---------------------------------------------------------------------------
// German stopwords (hardcoded, ~100 common forms)
// ---------------------------------------------------------------------------
export const GERMAN_STOPWORDS: Set<string> = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "eines", "einer", "und", "oder", "aber", "ist", "sind", "war", "waren",
  "bin", "bist", "seid", "hat", "hatte", "haben", "hatten", "habe", "hast",
  "wird", "werden", "wurde", "wurden", "werde", "wirst",
  "mit", "von", "zu", "zur", "zum", "in", "im", "an", "am", "auf", "bei",
  "beim", "nach", "vor", "über", "unter", "durch", "für", "gegen", "ohne",
  "um", "aus", "als", "wenn", "weil", "dass", "daß", "ob", "wie", "was",
  "wer", "wo", "wann", "warum", "nicht", "kein", "keine", "keinen", "keiner",
  "sich", "mir", "dir", "mich", "dich", "uns", "euch", "wir", "ihr", "sie",
  "er", "es", "ich", "du", "man", "sein", "seine", "ihre", "ihren", "sehr",
  "auch", "noch", "nur", "schon", "so", "doch", "denn", "dann", "hier", "da",
  "dort", "diese", "dieser", "dieses", "jede", "jeder", "jedes", "alle",
  "viel", "viele", "mehr", "immer", "wieder", "etwas", "nichts", "jemand",
  "mein", "dein", "ihr", "unser", "euer",
]);

// ---------------------------------------------------------------------------
// Localized feedback strings
// ---------------------------------------------------------------------------
const FEEDBACK = {
  correct: {
    fr: "Correct ! Votre réponse est juste.",
    ar: "صحيح! إجابتك صحيحة.",
    de: "Richtig! Ihre Antwort ist korrekt.",
  },
  partialTypo: {
    fr: "Presque juste ! Attention à la majuscule / faute de frappe.",
    ar: "قريب من الصواب! انتبه للأحرف الكبيرة / الأخطاء المطبعية.",
    de: "Fast richtig! Kleinschreibung/Tippfehler beachten.",
  },
  partialKeywords: {
    fr: "Partiellement juste. Mots importants manquants : ",
    ar: "صحيح جزئيًا. كلمات مهمة ناقصة: ",
    de: "Teilweise richtig. Wichtige Wörter fehlen: ",
  },
  partialSemantic: {
    fr: "Le sens est proche, mais pas assez précis.",
    ar: "المعنى قريب لكنه ليس دقيقًا بما فيه الكفاية.",
    de: "Die Bedeutung ist ähnlich, aber nicht präzise genug.",
  },
  wrong: {
    fr: "Malheureusement faux. La bonne réponse est : ",
    ar: "للأسف خطأ. الإجابة الصحيحة هي: ",
    de: "Leider falsch. Die richtige Antwort ist: ",
  },
  manual: {
    fr: "Réponse à corriger manuellement.",
    ar: "الإجابة تحتاج إلى تصحيح يدوي.",
    de: "Diese Antwort muss manuell überprüft werden.",
  },
};

// German note that always accompanies feedback (feedback_de).
function deNote(key: keyof typeof FEEDBACK, extra = ""): string {
  return FEEDBACK[key].de + extra;
}
function locNote(key: keyof typeof FEEDBACK, locale: Locale, extra = ""): string {
  const l: "fr" | "ar" | "de" = locale === "ar" ? "ar" : locale === "de" ? "de" : "fr";
  return FEEDBACK[key][l] + extra;
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Comparison-only normalization: lowercase, trim, collapse ws, umlaut→ae/oe/ue/ss. */
function normForCompare(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

// ---------------------------------------------------------------------------
// Damerau-Levenshtein distance (classic DP + adjacent transpositions)
// ---------------------------------------------------------------------------
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // (m+1) x (n+1) DP grid with adjacent-transposition (Damerau) support.
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
      // transposition of two adjacent characters
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

// Build a fresh result object with sane defaults.
function makeResult(partial: Partial<GradeResultV2> & { maxScore: number }): GradeResultV2 {
  const score = partial.score ?? 0;
  const maxScore = partial.maxScore;
  const pct = maxScore > 0 ? round2((score / maxScore) * 100) : 0;
  const confidence = partial.confidence ?? 0;
  return {
    score: round2(score),
    maxScore,
    percentage: pct,
    isCorrect: partial.isCorrect ?? pct >= 100,
    isPartial: partial.isPartial ?? (pct > 0 && pct < 100),
    method: partial.method ?? "manual",
    confidence,
    feedback_fr: partial.feedback_fr ?? "",
    feedback_de: partial.feedback_de ?? "",
    details: partial.details,
    needsManualReview: partial.needsManualReview ?? confidence < 0.5,
  };
}

// =============================================================================
// LAYER 1 — Exact + Fuzzy match
// =============================================================================
export function gradeExact(
  studentAnswer: string,
  referenceAnswer: string,
  acceptedVariants: string[],
  points: number,
  locale: Locale = "fr"
): GradeResultV2 | null {
  const student = normForCompare(studentAnswer);
  const reference = normForCompare(referenceAnswer);
  if (!student) return null;

  // 2. exact match
  if (student === reference) {
    return makeResult({
      score: points,
      maxScore: points,
      isCorrect: true,
      isPartial: false,
      method: "exact",
      confidence: 1,
      feedback_fr: locNote("correct", locale),
      feedback_de: deNote("correct"),
      details: { editDistance: 0 },
    });
  }

  // 3. accepted variants
  for (const v of acceptedVariants || []) {
    if (normForCompare(v) === student) {
      return makeResult({
        score: points,
        maxScore: points,
        isCorrect: true,
        isPartial: false,
        method: "variant",
        confidence: 0.98,
        feedback_fr: locNote("correct", locale),
        feedback_de: deNote("correct"),
        details: { editDistance: 0 },
      });
    }
  }

  // 4 & 5. fuzzy Damerau-Levenshtein against reference + variants
  const candidates = [reference, ...(acceptedVariants || []).map(normForCompare)];
  let best = Infinity;
  let bestLen = student.length;
  for (const c of candidates) {
    if (!c) continue;
    const dist = levenshteinDistance(student, c);
    if (dist < best) {
      best = dist;
      bestLen = Math.max(student.length, c.length);
    }
  }

  // short answers (<=15 chars): tolerate a single typo -> 90%
  if (bestLen <= 15 && best <= 1) {
    return makeResult({
      score: points * 0.9,
      maxScore: points,
      isCorrect: false,
      isPartial: true,
      method: "fuzzy",
      confidence: 0.85,
      feedback_fr: locNote("partialTypo", locale),
      feedback_de: deNote("partialTypo"),
      details: { editDistance: best },
    });
  }

  // longer answers: tolerate up to 2 edits -> 80%
  if (bestLen > 15 && best <= 2) {
    return makeResult({
      score: points * 0.8,
      maxScore: points,
      isCorrect: false,
      isPartial: true,
      method: "fuzzy",
      confidence: 0.75,
      feedback_fr: locNote("partialTypo", locale),
      feedback_de: deNote("partialTypo"),
      details: { editDistance: best },
    });
  }

  // 6. no match -> pass to next layer
  return null;
}

// =============================================================================
// LAYER 2 — German tolerance rules
// =============================================================================
export function applyToleranceRules(
  studentAnswer: string,
  referenceAnswer: string,
  rules: ToleranceRule[],
  points: number,
  locale: Locale = "fr"
): GradeResultV2 | null {
  const applied: string[] = [];
  let penalty = 0;

  // We progressively transform BOTH strings with each active rule and check
  // whether they become equal. Rules that fire contribute their penalty.
  let s = studentAnswer.trim();
  let r = referenceAnswer.trim();

  const has = (id: string) => rules.some((x) => x.id === id);
  const rule = (id: string) => rules.find((x) => x.id === id);
  const noteFor = (id: string) => rule(id)?.label ?? DEFAULT_TOLERANCE_RULES[id]?.label ?? id;
  const penFor = (id: string) => (rule(id)?.penalty ?? DEFAULT_TOLERANCE_RULES[id]?.penalty ?? 0);

  // ACCEPT_HYPHEN_VARIATION: Deutsch-Unterricht === Deutschunterricht
  if (has("ACCEPT_HYPHEN_VARIATION")) {
    const sh = s.replace(/-/g, "");
    const rh = r.replace(/-/g, "");
    if (sh !== s || rh !== r) {
      if (sh.toLowerCase() === rh.toLowerCase()) {
        applied.push(noteFor("ACCEPT_HYPHEN_VARIATION"));
        penalty += penFor("ACCEPT_HYPHEN_VARIATION");
      }
      s = sh;
      r = rh;
    }
  }

  // ACCEPT_ABBREVIATED_ARTICLE: "d. Baum" -> "der Baum" (treat abbreviated
  // article + period as a wildcard article match).
  if (has("ACCEPT_ABBREVIATED_ARTICLE")) {
    const abbr = /\b([dD])\.\s+/;
    if (abbr.test(s)) {
      // expand "d. " to the reference's leading article if present
      const refArt = r.match(/^(der|die|das)\b/i)?.[1];
      if (refArt) {
        const expanded = s.replace(/^\s*[dD]\.\s+/, refArt + " ");
        if (normForCompare(expanded) === normForCompare(r)) {
          applied.push(noteFor("ACCEPT_ABBREVIATED_ARTICLE"));
          penalty += penFor("ACCEPT_ABBREVIATED_ARTICLE");
          s = expanded;
        }
      }
    }
  }

  // IGNORE_TRAILING_PERIOD: "Berlin." === "Berlin"
  if (has("IGNORE_TRAILING_PERIOD")) {
    const st = s.replace(/[.]+\s*$/, "");
    const rt = r.replace(/[.]+\s*$/, "");
    if (st !== s || rt !== r) {
      applied.push(noteFor("IGNORE_TRAILING_PERIOD"));
      penalty += penFor("IGNORE_TRAILING_PERIOD");
    }
    s = st;
    r = rt;
  }

  // ACCEPT_UMLAUT_ALTERNATIVE: Strasse === Straße, Mueller === Müller
  if (has("ACCEPT_UMLAUT_ALTERNATIVE")) {
    const su = normForCompare(s); // expands umlauts to ae/oe/ue/ss
    const ru = normForCompare(r);
    if (su === ru && normalizeStrict(s) !== normalizeStrict(r)) {
      applied.push(noteFor("ACCEPT_UMLAUT_ALTERNATIVE"));
      penalty += penFor("ACCEPT_UMLAUT_ALTERNATIVE");
      return finalizeTolerance(points, penalty, applied, r, locale);
    }
  }

  // FORGIVE_COMMA: compare ignoring commas
  if (has("FORGIVE_COMMA")) {
    const sc = s.replace(/,/g, "").replace(/\s+/g, " ").trim();
    const rc = r.replace(/,/g, "").replace(/\s+/g, " ").trim();
    if (sc.replace(/\s/g, "") !== s.replace(/\s/g, "") || rc.replace(/\s/g, "") !== r.replace(/\s/g, "")) {
      if (normForCompare(sc) === normForCompare(rc)) {
        applied.push(noteFor("FORGIVE_COMMA"));
        penalty += penFor("FORGIVE_COMMA");
        return finalizeTolerance(points, penalty, applied, r, locale);
      }
    }
  }

  // IGNORE_ARTICLE: "der Baum" vs "die Baum" -> match noun, note article
  if (has("IGNORE_ARTICLE")) {
    const stripArt = (x: string) => x.replace(/^\s*(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\b\s*/i, "").trim();
    const sNoun = stripArt(s);
    const rNoun = stripArt(r);
    const hadArticle = sNoun !== s.trim() || rNoun !== r.trim();
    if (hadArticle && normForCompare(sNoun) === normForCompare(rNoun)) {
      // only penalize if the articles actually differed
      const sArt = s.match(/^\s*(der|die|das)\b/i)?.[1]?.toLowerCase();
      const rArt = r.match(/^\s*(der|die|das)\b/i)?.[1]?.toLowerCase();
      if (sArt && rArt && sArt !== rArt) {
        applied.push(noteFor("IGNORE_ARTICLE"));
        penalty += penFor("IGNORE_ARTICLE");
      }
      return finalizeTolerance(points, penalty, applied, r, locale);
    }
  }

  // IGNORE_CAPITALIZATION: case-insensitive equality (no penalty by default)
  if (has("IGNORE_CAPITALIZATION")) {
    if (s.toLowerCase().trim() === r.toLowerCase().trim() && s.trim() !== r.trim()) {
      applied.push(noteFor("IGNORE_CAPITALIZATION"));
      penalty += penFor("IGNORE_CAPITALIZATION");
      return finalizeTolerance(points, penalty, applied, r, locale);
    }
  }

  // custom regex-driven admin rules (pattern/replacement applied to both sides)
  for (const rl of rules) {
    if (!rl.pattern) continue;
    try {
      const re = new RegExp(rl.pattern, "gi");
      const s2 = s.replace(re, rl.replacement ?? "");
      const r2 = r.replace(re, rl.replacement ?? "");
      if (normForCompare(s2) === normForCompare(r2) && normForCompare(s) !== normForCompare(r)) {
        applied.push(rl.label ?? rl.id);
        penalty += rl.penalty ?? 0;
        return finalizeTolerance(points, penalty, applied, r, locale);
      }
      s = s2;
      r = r2;
    } catch {
      /* invalid admin regex -> ignore */
    }
  }

  // After all transforms, did the two strings converge?
  if (normForCompare(s) === normForCompare(r) && applied.length > 0) {
    return finalizeTolerance(points, penalty, applied, r, locale);
  }

  return null; // no tolerance rule salvaged it -> next layer
}

// strict normalize that keeps umlauts distinct (for detecting umlaut alt).
function normalizeStrict(s: string): string {
  return (s || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function finalizeTolerance(
  points: number,
  penalty: number,
  applied: string[],
  reference: string,
  locale: Locale
): GradeResultV2 {
  const factor = Math.max(0, 1 - penalty);
  const score = points * factor;
  const isFull = penalty === 0;
  return makeResult({
    score,
    maxScore: points,
    isCorrect: isFull,
    isPartial: !isFull && score > 0,
    method: "rule",
    confidence: isFull ? 0.9 : 0.75,
    feedback_fr: isFull ? locNote("correct", locale) : locNote("partialTypo", locale),
    feedback_de: isFull ? deNote("correct") : deNote("partialTypo"),
    details: { toleranceApplied: applied },
  });
}

// =============================================================================
// LAYER 3 — Keyword presence scoring
// =============================================================================
export function gradeByKeywords(
  studentAnswer: string,
  referenceAnswer: string,
  requiredKeywords: string[],
  points: number,
  locale: Locale = "fr"
): GradeResultV2 {
  // 1. determine the keyword set: explicit list wins, else extract from ref.
  let keywords = (requiredKeywords || []).filter(Boolean);
  if (keywords.length === 0) {
    keywords = extractKeywords(referenceAnswer);
  }

  if (keywords.length === 0) {
    // nothing to score against -> hand off for manual review
    return makeResult({
      score: 0,
      maxScore: points,
      method: "manual",
      confidence: 0.3,
      needsManualReview: true,
      feedback_fr: locNote("manual", locale),
      feedback_de: deNote("manual"),
    });
  }

  // 2. stem student tokens for comparison.
  const studentStems = new Set(
    tokenize(studentAnswer).map((t) => stemDE(t))
  );

  const found: string[] = [];
  const missing: string[] = [];
  for (const kw of keywords) {
    const kwStem = stemDE(kw.toLowerCase());
    if (studentStems.has(kwStem)) found.push(kw);
    else missing.push(kw);
  }

  const ratio = found.length / keywords.length;
  const score = points * ratio;

  // 4. partial credit thresholds
  const isCorrect = ratio >= 0.999;
  const isPartial = ratio >= 0.5 && ratio < 0.999;

  let fr: string;
  let de: string;
  if (isCorrect) {
    fr = locNote("correct", locale);
    de = deNote("correct");
  } else if (found.length > 0) {
    fr = locNote("partialKeywords", locale, missing.join(", "));
    de = deNote("partialKeywords", missing.join(", "));
  } else {
    fr = locNote("wrong", locale, referenceAnswer);
    de = deNote("wrong", referenceAnswer);
  }

  // confidence scales with how decisive the keyword ratio is.
  const confidence = ratio >= 0.999 ? 0.8 : ratio >= 0.5 ? 0.6 : 0.5;

  return makeResult({
    score,
    maxScore: points,
    isCorrect,
    isPartial,
    method: "keyword",
    confidence,
    feedback_fr: fr,
    feedback_de: de,
    details: { keywordsFound: found, keywordsMissing: missing },
    needsManualReview: ratio > 0 && ratio < 0.5,
  });
}

/** Split raw text into lowercased alphabetic-ish tokens (keeps umlauts/ß). */
function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[.,;:!?"'«»„“”()\[\]{}<>…\/\\|@#$%^&*+=~`-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Extract content keywords from a reference answer via stopword filtering. */
function extractKeywords(reference: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of tokenize(reference)) {
    if (GERMAN_STOPWORDS.has(tok)) continue;
    if (tok.length < 3) continue;
    if (seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}

// =============================================================================
// LAYER 4 — Semantic similarity (embedding-based, async)
// =============================================================================
export async function gradeWithEmbedding(
  studentAnswer: string,
  referenceAnswer: string,
  points: number,
  locale: Locale = "fr"
): Promise<GradeResultV2> {
  // Ensure the model is (attempted) loaded. If unavailable, degrade to manual.
  if (!embeddingService.isReady()) {
    await embeddingService.load();
  }
  if (!embeddingService.isReady()) {
    return makeResult({
      score: 0,
      maxScore: points,
      method: "manual",
      confidence: 0.3,
      needsManualReview: true,
      feedback_fr: locNote("manual", locale),
      feedback_de: deNote("manual"),
    });
  }

  const sim = await embeddingService.cosineSimilarity(studentAnswer, referenceAnswer);
  if (sim === null) {
    return makeResult({
      score: 0,
      maxScore: points,
      method: "manual",
      confidence: 0.3,
      needsManualReview: true,
      feedback_fr: locNote("manual", locale),
      feedback_de: deNote("manual"),
    });
  }

  let factor: number;
  let isCorrect = false;
  let isPartial = false;
  let fr: string;
  let de: string;

  if (sim >= 0.85) {
    factor = 1;
    isCorrect = true;
    fr = locNote("correct", locale);
    de = deNote("correct");
  } else if (sim >= 0.7) {
    factor = 0.75;
    isPartial = true;
    fr = locNote("partialSemantic", locale);
    de = deNote("partialSemantic");
  } else if (sim >= 0.55) {
    factor = 0.5;
    isPartial = true;
    fr = locNote("partialSemantic", locale);
    de = deNote("partialSemantic");
  } else {
    factor = 0;
    fr = locNote("wrong", locale, referenceAnswer);
    de = deNote("wrong", referenceAnswer);
  }

  // confidence: high near the extremes, lower in the ambiguous mid-band.
  const confidence =
    sim >= 0.85 ? 0.85 : sim < 0.55 ? 0.75 : 0.6;

  return makeResult({
    score: points * factor,
    maxScore: points,
    isCorrect,
    isPartial,
    method: "semantic",
    confidence,
    feedback_fr: fr,
    feedback_de: de,
    details: { fuseScore: round2(sim) },
    needsManualReview: confidence < 0.5,
  });
}

// =============================================================================
// MAIN ROUTER
// =============================================================================
const EXACT_TYPES = new Set([
  "synonym",
  "gegenteil",
  "wortbildung",
  "wortableitung",
  "kompositum_bilden",
  "kompositum_loesen",
  "grammatik_tempus",
  "grammatik_aktiv_passiv",
  "grammatik_satzbau",
  "grammatik_modalverb",
  "deklination",
  "grammatik_deklination",
  "kombinieren",
  "ergaenzen",
  "titel",
]);

const OPEN_TYPES = new Set([
  "fragen_zum_text",
  "grammatik_fragen_stellen",
  "grammatik_konnektoren",
]);

// ============================================================================
// RICHTIG ODER FALSCH — dedicated, precise grader
// ============================================================================

/** Keyword extraction using stemming + stopword filter (shared by R/F, Fragen, Titel). */
function rfExtractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:()"«»„"—–-]/g, " ")
    .split(/\s+/)
    .map((w) => stemDE(w.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")))
    .filter((w) => w.length >= 3 && !GERMAN_STOPWORDS.has(w));
}

function zitatKeywordOverlap(studentZitat: string, referenceZitat: string): number {
  const refKws = new Set(rfExtractKeywords(referenceZitat));
  if (refKws.size === 0) return 0;
  const studKws = rfExtractKeywords(studentZitat);
  const found = studKws.filter((w) => refKws.has(w)).length;
  return found / refKws.size;
}

function zitatTooLong(studentZitat: string, referenceZitat: string): boolean {
  // Word-count based comparison
  const refWords = referenceZitat.trim().split(/\s+/).length;
  const studWords = studentZitat.trim().split(/\s+/).length;
  return studWords > refWords * 1.5;
}

export function gradeRichtigFalsch(params: {
  studentRfChoice: "richtig" | "falsch";   // student's R/F answer
  correctRfChoice: "richtig" | "falsch";   // admin's correct answer
  studentZitat: string;                     // what student wrote as citation
  referenceZitat: string;                   // admin's reference citation
  points: number;                           // total per-statement = 0.5
  locale?: Locale;
}): GradeResultV2 {
  const { studentRfChoice, correctRfChoice, studentZitat, referenceZitat, points, locale = "fr" } = params;
  const rfCorrect = studentRfChoice === correctRfChoice;

  // Zitat scoring — tolerance: ignore case, trailing punct, umlaut variants
  const studZN = studentZitat.trim().replace(/[.!?]+$/, "").toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
  const refZN = referenceZitat.trim().replace(/[.!?]+$/, "").toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");

  let zitatValid = false;
  let zitatNote: string | null = null;
  let zitatNoteDe: string | null = null;

  if (!studZN) {
    // No zitat at all
    zitatValid = false;
    zitatNote = locale === "ar"
      ? "لم يتم تقديم أي زيتات."
      : "Aucun Zitat fourni.";
    zitatNoteDe = "Kein Zitat angegeben.";
  } else {
    const overlap = zitatKeywordOverlap(studZN, refZN);
    const tooLong = zitatTooLong(studentZitat, referenceZitat);

    if (tooLong) {
      // Too long → Zitat invalid, add note
      zitatValid = false;
      zitatNote = locale === "ar"
        ? "الزيتات طويل جداً — استخرج الجزء الضروري فقط."
        : "Le Zitat est trop long — extrayez uniquement la partie pertinente.";
      zitatNoteDe = "Das Zitat ist zu lang — geben Sie nur den relevanten Satzabschnitt an.";
    } else if (overlap >= 0.50) {
      // Good keyword overlap → direct quote, valid
      zitatValid = true;
    } else {
      // Low overlap → paraphrase, not a direct quote
      zitatValid = false;
      zitatNote = locale === "ar"
        ? "يجب نقل الزيتات حرفياً من النص وليس بأسلوبك الخاص."
        : "Le Zitat doit être copié du texte, pas reformulé avec vos propres mots.";
      zitatNoteDe = "Das Zitat muss direkt aus dem Text abgeschrieben werden, nicht in eigenen Worten.";
    }
  }

  // Compute score: points = 0.5 per statement, split evenly: 0.25 R/F + 0.25 Zitat.
  const rfHalf = points / 2;
  const zitatHalf = points / 2;
  const totalScore = (rfCorrect ? rfHalf : 0) + (zitatValid ? zitatHalf : 0);
  const pct = Math.round((totalScore / points) * 100);

  // Build feedback — only when not perfect
  const feedbackParts: string[] = [];
  const feedbackPartsDe: string[] = [];

  if (!rfCorrect && zitatValid) {
    feedbackParts.push(locale === "ar"
      ? "إجابة صح/خطأ غير صحيحة، لكن الزيتات صحيح."
      : "La réponse Richtig/Falsch est incorrecte, mais le Zitat est valide.");
    feedbackPartsDe.push("Die Richtig/Falsch-Antwort ist falsch, das Zitat aber korrekt.");
  }
  if (zitatNote) {
    feedbackParts.push(zitatNote);
    feedbackPartsDe.push(zitatNoteDe ?? zitatNote);
  }

  const feedback_fr = feedbackParts.join(" ") || "";
  const feedback_de = feedbackPartsDe.join(" ") || "";

  return {
    score: totalScore,
    maxScore: points,
    percentage: pct,
    isCorrect: totalScore >= points,
    isPartial: totalScore > 0 && totalScore < points,
    method: "rule",
    confidence: 0.9,
    feedback_fr,
    feedback_de,
    details: {
      toleranceApplied: [
        rfCorrect ? "rf_correct" : "rf_wrong",
        zitatValid ? "zitat_valid" : "zitat_invalid",
      ],
    },
    needsManualReview: false,
  };
}

// ============================================================================
// TITEL DES TEXTES — dedicated grader
//
// Rules (1 pt total):
//   - Ignore capitalization, punctuation, trailing spaces
//   - If any accepted title has keyword overlap >= 60% with student title
//     → 1 pt (full credit)
//   - If closest accepted title has edit distance <= 2 from ANY word in student title
//     → 1 pt (full credit) + typo note: "Avez-vous voulu écrire [word] ?"
//   - Otherwise → 0 pt
//
// Admin provides a list of accepted titles. Semantic similarity is checked
// via keyword overlap + edit distance on individual words.
// ============================================================================

export function gradeTitel(params: {
  studentAnswer: string;
  acceptedTitles: string[];   // list of titles admin considers correct
  points: number;
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, acceptedTitles, points, locale = "fr" } = params;

  if (!studentAnswer.trim()) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "exact", confidence: 1,
      feedback_fr: locale === "ar" ? "لم يتم تقديم عنوان." : "Aucun titre fourni.",
      feedback_de: "Kein Titel angegeben.",
    };
  }

  // Normalize student answer: lowercase, strip punctuation
  const normStudentRaw = studentAnswer.trim().toLowerCase()
    .replace(/[.,!?;:«»„"'"]/g, "").trim();
  const normStudentUml = normStudentRaw
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

  // Student title words (for per-word typo check)
  const studentWords = normStudentUml.split(/\s+/).filter((w) => w.length >= 3);

  let bestOverlap = 0;
  let bestTitleMatch = "";
  let typoWordOriginal: string | null = null;
  let typoWordCorrected: string | null = null;

  for (const title of acceptedTitles) {
    const normTitle = title.trim().toLowerCase()
      .replace(/[.,!?;:«»„"'"]/g, "")
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

    // Keyword overlap
    const studKws = new Set(extractKeywords(normStudentUml));
    const titleKws = extractKeywords(normTitle);
    const titleKwSet = new Set(titleKws);
    const found = [...studKws].filter((w) => titleKwSet.has(w)).length;
    const overlap = titleKwSet.size > 0 ? found / titleKwSet.size : 0;

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestTitleMatch = title;
    }

    // Per-word typo check: any student word within edit distance 2 of any title word?
    const titleWords = normTitle.split(/\s+/).filter((w) => w.length >= 3);
    for (const sw of studentWords) {
      for (const tw of titleWords) {
        if (sw !== tw && levenshteinDistance(sw, tw) <= 2 && tw.length >= 4) {
          // Found a near-match — record the typo
          if (!typoWordOriginal) {
            typoWordOriginal = sw;
            typoWordCorrected = tw;
          }
          // Boost overlap for this title
          if (overlap + 0.3 > bestOverlap) {
            bestOverlap = Math.min(1, overlap + 0.3);
            bestTitleMatch = title;
          }
        }
      }
    }
  }

  // Score decision
  if (bestOverlap >= 0.60) {
    // Accepted — build optional typo note
    let feedback_fr = "";
    let feedback_de = "";
    if (typoWordCorrected) {
      const correctedDisplay = acceptedTitles.find((t) =>
        t.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
          .includes(typoWordCorrected!)
      ) ?? typoWordCorrected;
      feedback_fr = locale === "ar"
        ? `هل تقصد "${correctedDisplay}"؟ انتبه إلى الإملاء.`
        : `Avez-vous voulu écrire « ${correctedDisplay} » ? Attention à l'orthographe.`;
      feedback_de = `Meinten Sie „${correctedDisplay}"? Achten Sie auf die Rechtschreibung.`;
    }
    return {
      score: points, maxScore: points, percentage: 100,
      isCorrect: true, isPartial: false,
      method: "rule", confidence: 0.9,
      feedback_fr, feedback_de,
      details: { toleranceApplied: typoWordCorrected ? ["typo_forgiven"] : [] },
      needsManualReview: false,
    };
  }

  // Not accepted
  return {
    score: 0, maxScore: points, percentage: 0,
    isCorrect: false, isPartial: false,
    method: "keyword", confidence: 0.75,
    feedback_fr: locale === "ar"
      ? "العنوان لا يعكس الفكرة الرئيسية للنص."
      : "Ce titre ne reflète pas l'idée principale du texte.",
    feedback_de: "Dieser Titel spiegelt nicht die Hauptidee des Textes wider.",
    details: { keywordsMissing: extractKeywords(
      (bestTitleMatch || acceptedTitles[0] || "").toLowerCase()
    ).filter((w) => !new Set(studentWords).has(w)) },
    needsManualReview: false,
  };
}

// ============================================================================
// FRAGEN ZUM TEXT — dedicated grader
//
// Each question = 1 pt, split evenly:
//   0.5 pt  Information   — key facts present in student answer
//   0.5 pt  Method        — answer is a complete German sentence
//
// Information scoring:
//   >= 80% keyword overlap with reference answer  → 0.5 pt (full)
//   >= 40% keyword overlap                        → 0.25 pt (partial)
//   < 40%                                         → 0 pt
//
// Method (sentence completeness) scoring:
//   Answer contains verb + subject structure
//   (heuristic: >4 words AND contains a conjugated verb form)
//   → 0.5 pt (full)
//   Answer is >1 word but lacks sentence structure (keyword list)
//   → 0.25 pt
//   Single word or empty → 0 pt
//
// Special case "Nennen Sie N ...": count matching items from a list.
//   For each found item → (1/N) * points.
//
// Tolerance: case, umlaut, trailing punct ignored. Minor typos (edit dist ≤2).
// No feedback for full marks.
// ============================================================================

/** Heuristic: does the text look like a complete German sentence?
 *  Must have > 4 words and contain at least one word that looks like a
 *  conjugated verb (ends in -t, -st, -en, -te, -ten, -et, -est, -ern).
 */
function looksLikeCompleteSentence(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (words.length <= 4) return false;
  const verbEndings = /(?:en|est|et|ern|ten|ste|ten|st|t)$/;
  return words.some((w) => verbEndings.test(w.toLowerCase()));
}

export function gradeFragenZumText(params: {
  studentAnswer: string;
  referenceAnswer: string;
  points: number;
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, referenceAnswer, points, locale = "fr" } = params;
  const half = points / 2;

  // Normalize
  const studN = studentAnswer.trim().toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  const refN = referenceAnswer.trim().toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

  // ── INFORMATION SCORE ────────────────────────────────────────────────────
  const studKws = extractKeywords(studN);
  const refKws = extractKeywords(refN);
  const refKwSet = new Set(refKws);
  const foundKws = studKws.filter((w) => refKwSet.has(w));
  const overlap = refKwSet.size > 0 ? foundKws.length / refKwSet.size : 0;
  const missingKws = refKws.filter((w) => !new Set(studKws).has(w));

  let infoScore: number;
  if (overlap >= 0.80) {
    infoScore = half;        // full information
  } else if (overlap >= 0.40) {
    infoScore = half * 0.5;  // partial information (0.25 of 0.5 = 0.25 pt)
  } else {
    infoScore = 0;
  }

  // ── METHOD SCORE (sentence completeness) ──────────────────────────────────
  const wordCount = studentAnswer.trim().split(/\s+/).filter(Boolean).length;
  let methodScore: number;
  if (wordCount === 0) {
    methodScore = 0;
  } else if (looksLikeCompleteSentence(studentAnswer)) {
    methodScore = half;        // full sentence structure
  } else if (wordCount > 1) {
    methodScore = half * 0.5;  // keywords without full sentence
  } else {
    methodScore = 0;
  }

  const totalScore = infoScore + methodScore;
  const pct = Math.round((totalScore / points) * 100);
  const isCorrect = totalScore >= points * 0.95; // allow tiny rounding error
  const isPartial = totalScore > 0 && !isCorrect;

  // ── FEEDBACK (only when losing points) ──────────────────────────────────
  const feedbackParts: string[] = [];
  const feedbackPartsDe: string[] = [];

  if (infoScore < half) {
    const missingStr = missingKws.slice(0, 3).join(", ");
    if (locale === "ar") {
      feedbackParts.push(`المعلومات ناقصة.${missingStr ? " الكلمات المفتاحية غائبة: " + missingStr : ""}`);
    } else {
      feedbackParts.push(`Informations incomplètes.${missingStr ? " Éléments manquants : " + missingStr : ""}`);
    }
    feedbackPartsDe.push(`Informationen unvollständig.${missingStr ? " Fehlende Schlüsselwörter: " + missingStr : ""}`);
  }

  if (methodScore < half && wordCount > 0) {
    if (locale === "ar") {
      feedbackParts.push("أجب بجملة كاملة باللغة الألمانية.");
    } else {
      feedbackParts.push("Répondez en phrase complète en allemand.");
    }
    feedbackPartsDe.push("Antworten Sie in einem vollständigen deutschen Satz.");
  }

  return {
    score: totalScore,
    maxScore: points,
    percentage: pct,
    isCorrect,
    isPartial,
    method: "keyword",
    confidence: 0.85,
    feedback_fr: feedbackParts.join(" ") || "",
    feedback_de: feedbackPartsDe.join(" ") || "",
    details: {
      keywordsFound: foundKws,
      keywordsMissing: missingKws,
    },
    needsManualReview: false,
  };
}

// ============================================================================
// GRAMMATIK — Satzbau, Modalverb, Tempus, Aktiv/Passiv (dedicated graders)
// ============================================================================

/** Check if a connector word is present in the student answer */
function hasConnector(answer: string, clauseType: string): boolean {
  const connectorMap: Record<string, RegExp> = {
    finalsatz: /\b(damit|um\s+\S+\s+zu)\b/i,
    konzessivsatz: /\b(obwohl|trotzdem)\b/i,
    temporalsatz: /\b(nachdem|bevor|als|wenn)\b/i,
    relativsatz: /\b(der|die|das|den|dem|dessen|deren)\b.*\b(ist|sind|war|waren|hat|hatte|haben|wird|werden|kann|muss|soll)\b/i,
    konditionalsatz: /\b(wenn)\b.*\b(würde|hätte|wäre|könntest|müsstest)\b/i,
  };
  const re = connectorMap[clauseType.toLowerCase()];
  return re ? re.test(answer) : false;
}

/** Extract the specific connector word actually used, per clause type. */
function extractConnectorWord(answer: string, clauseType: string): string | null {
  const wordMap: Record<string, RegExp> = {
    finalsatz: /\b(damit|um)\b/i,
    konzessivsatz: /\b(obwohl|trotzdem)\b/i,
    temporalsatz: /\b(nachdem|bevor|als|wenn)\b/i,
    relativsatz: /\b(der|die|das|den|dem|dessen|deren)\b/i,
    konditionalsatz: /\b(wenn)\b/i,
  };
  const re = wordMap[clauseType.toLowerCase()];
  const m = re ? answer.match(re) : null;
  return m ? m[1] : null;
}

/** Check if a comma separates the two clauses */
function hasClauseComma(answer: string): boolean {
  return /\S,\s|\s,\s/.test(answer);
}

/** Heuristic: check verb position in subordinate clause (verb at end) */
function verbAtEndOfSubclause(answer: string, connector: string): boolean {
  // Split on the connector, get the subordinate clause (after connector)
  const parts = answer.toLowerCase().split(new RegExp('\\b' + connector.toLowerCase() + '\\b'));
  if (parts.length < 2) return false;
  const subclause = parts[parts.length - 1].trim().replace(/[.!?]+$/, '');
  const words = subclause.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  // Last word should be a verb (rough check: ends in verb-like suffix)
  const lastWord = words[words.length - 1];
  return /(?:en|est|et|ern|ten|ste|st|t|bin|ist|sind|hat|hat|haben|war|wurde|worden|werden|können|müssen|soll|will|darf|mag)$/i.test(lastWord);
}

/** Check verb is in 2nd position in main clause */
function verbInSecondPosition(mainClause: string): boolean {
  const words = mainClause.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  // Word at index 1 (second word) should be a conjugated verb
  const second = words[1];
  return /(?:en|est|et|ern|ten|ste|st|t|bin|ist|sind|hat|haben|war|wurde|werden|kann|muss|soll|will|darf|mag|komme|gehe|fahre|laufe)$/i.test(second);
}

/** Split answer into main clause + subordinate clause halves around a connector. */
function splitClauses(answer: string, connector: string): { main: string; sub: string } {
  const idx = answer.toLowerCase().search(new RegExp('\\b' + connector.toLowerCase() + '\\b'));
  if (idx === -1) return { main: answer, sub: "" };
  // Connector at start → subordinate clause first, main clause after comma
  const trimmedStart = answer.trim().toLowerCase();
  if (trimmedStart.startsWith(connector.toLowerCase())) {
    const commaIdx = answer.indexOf(",");
    if (commaIdx !== -1) {
      return { main: answer.slice(commaIdx + 1).trim(), sub: answer.slice(0, commaIdx).trim() };
    }
    return { main: "", sub: answer };
  }
  return { main: answer.slice(0, idx).trim(), sub: answer.slice(idx).trim() };
}

export function gradeSatzbau(params: {
  studentAnswer: string;
  referenceAnswer: string; // admin's correct answer
  clauseType: string; // "finalsatz" | "konzessivsatz" | "temporalsatz" | "relativsatz" | "konditionalsatz"
  points: number;
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, clauseType, points, locale = "fr" } = params;

  const noteMissingComma = {
    fr: "La virgule manque.",
    ar: "الفاصلة ناقصة.",
    de: "Das Komma fehlt.",
  };
  const noteVerbPosition = {
    fr: "La position du verbe est incorrecte.",
    ar: "موضع الفعل غير صحيح.",
    de: "Die Verbstellung ist nicht korrekt.",
  };

  const locText = (obj: { fr: string; ar: string; de: string }) =>
    locale === "ar" ? obj.ar : locale === "de" ? obj.de : obj.fr;

  if (!studentAnswer || !studentAnswer.trim()) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.9,
      feedback_fr: locNote("wrong", locale, params.referenceAnswer),
      feedback_de: deNote("wrong", params.referenceAnswer),
      needsManualReview: false,
    };
  }

  // Step 1: connector present?
  if (!hasConnector(studentAnswer, clauseType)) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.85,
      feedback_fr: locNote("wrong", locale, params.referenceAnswer),
      feedback_de: deNote("wrong", params.referenceAnswer),
      needsManualReview: false,
    };
  }

  // Step 2: comma present?
  if (!hasClauseComma(studentAnswer)) {
    return {
      score: points * 0.75, maxScore: points, percentage: 75,
      isCorrect: false, isPartial: true,
      method: "rule", confidence: 0.85,
      feedback_fr: locText(noteMissingComma),
      feedback_de: noteMissingComma.de,
      needsManualReview: false,
    };
  }

  // Step 3: verb positions correct?
  const connector = extractConnectorWord(studentAnswer, clauseType) ?? "";
  const { main, sub } = splitClauses(studentAnswer, connector);
  const subOk = connector ? verbAtEndOfSubclause(studentAnswer, connector) : true;
  const mainOk = main ? verbInSecondPosition(main) : true;

  if (!subOk || !mainOk) {
    return {
      score: points * 0.5, maxScore: points, percentage: 50,
      isCorrect: false, isPartial: true,
      method: "rule", confidence: 0.8,
      feedback_fr: locText(noteVerbPosition),
      feedback_de: noteVerbPosition.de,
      needsManualReview: false,
    };
  }

  // All good — full score, no feedback
  return {
    score: points, maxScore: points, percentage: 100,
    isCorrect: true, isPartial: false,
    method: "rule", confidence: 0.9,
    feedback_fr: "",
    feedback_de: "",
    needsManualReview: false,
  };
}

const MODAL_VERBS_MAP: Record<string, string[]> = {
  können: ["können", "kann", "kannst", "könnt", "könnte", "könnten", "könntest"],
  müssen: ["müssen", "muss", "musst", "müsst", "müsste", "müssten", "musste", "mussten"],
  dürfen: ["dürfen", "darf", "darfst", "dürft", "dürfte", "dürften"],
  sollen: ["sollen", "soll", "sollst", "sollt", "sollte", "sollten"],
  wollen: ["wollen", "will", "willst", "wollt", "wollte", "wollten"],
  mögen: ["mögen", "mag", "magst", "mögt", "möchte", "möchten"],
  lassen: ["lassen", "lässt", "lasst", "ließ", "ließen"],
};

function findModalForms(correctModal: string): string[] {
  const key = Object.keys(MODAL_VERBS_MAP).find(
    (k) => k === correctModal.toLowerCase() || MODAL_VERBS_MAP[k].includes(correctModal.toLowerCase())
  );
  return key ? MODAL_VERBS_MAP[key] : [correctModal.toLowerCase()];
}

export function gradeModalverb(params: {
  studentAnswer: string;
  referenceAnswer: string;
  correctModal: string; // e.g. "können", "müssen"
  points: number;
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, referenceAnswer, correctModal, points, locale = "fr" } = params;

  const noteWrongModal = {
    fr: "Mauvais verbe modal.",
    ar: "فعل مساعد (Modalverb) خاطئ.",
    de: "Falsches Modalverb.",
  };
  const noteExtra = {
    fr: "Ne pas ajouter de virgule / zu après le verbe modal.",
    ar: "لا تضف فاصلة / zu بعد الفعل المساعد.",
    de: "Kein Komma / zu nach dem Modalverb hinzufügen.",
  };
  const noteConjugation = {
    fr: "La conjugaison du verbe modal est incorrecte.",
    ar: "تصريف الفعل المساعد غير صحيح.",
    de: "Die Konjugation des Modalverbs ist nicht korrekt.",
  };
  const locText = (obj: { fr: string; ar: string; de: string }) =>
    locale === "ar" ? obj.ar : locale === "de" ? obj.de : obj.fr;

  if (!studentAnswer || !studentAnswer.trim()) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.9,
      feedback_fr: locNote("wrong", locale, referenceAnswer),
      feedback_de: deNote("wrong", referenceAnswer),
      needsManualReview: false,
    };
  }

  const forms = findModalForms(correctModal);
  const studentLower = studentAnswer.toLowerCase();

  // Which conjugated form (if any) is present in the student's answer?
  const foundForm = forms.find((f) => new RegExp(`\\b${f}\\b`, "i").test(studentLower));

  if (!foundForm) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.85,
      feedback_fr: locText(noteWrongModal),
      feedback_de: noteWrongModal.de,
      needsManualReview: false,
    };
  }

  // Extra comma or "zu" directly following the modal verb?
  const extraPattern = new RegExp(`\\b${foundForm}\\b\\s*(,|zu\\b)`, "i");
  if (extraPattern.test(studentAnswer)) {
    return {
      score: points * 0.5, maxScore: points, percentage: 50,
      isCorrect: false, isPartial: true,
      method: "rule", confidence: 0.8,
      feedback_fr: locText(noteExtra),
      feedback_de: noteExtra.de,
      needsManualReview: false,
    };
  }

  // Compare the conjugated form used vs. what the reference answer expects.
  const refLower = referenceAnswer.toLowerCase();
  const refForm = forms.find((f) => new RegExp(`\\b${f}\\b`, "i").test(refLower));
  if (refForm && refForm !== foundForm) {
    return {
      score: points * 0.5, maxScore: points, percentage: 50,
      isCorrect: false, isPartial: true,
      method: "rule", confidence: 0.75,
      feedback_fr: locText(noteConjugation),
      feedback_de: noteConjugation.de,
      needsManualReview: false,
    };
  }

  return {
    score: points, maxScore: points, percentage: 100,
    isCorrect: true, isPartial: false,
    method: "rule", confidence: 0.9,
    feedback_fr: "",
    feedback_de: "",
    needsManualReview: false,
  };
}

/** Extract the most likely conjugated main verb from a sentence (heuristic). */
function extractMainVerb(text: string): string | null {
  const words = text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return null;

  // Prefer a known irregular verb form.
  for (const w of words) {
    const clean = w.replace(/[.,!?;:]+$/g, "");
    if (GERMAN_IRREGULAR_VERBS[clean]) return clean;
  }

  // Fall back: word at index 1 (2nd position) often is the conjugated verb.
  if (words.length > 1) {
    const second = words[1].replace(/[.,!?;:]+$/g, "");
    if (/(?:e|st|t|en|te|test|ten|tet|end)$/i.test(second)) return second;
  }

  // Fall back: last word (subordinate clause / verb-final position).
  const last = words[words.length - 1].replace(/[.,!?;:]+$/g, "");
  return last || null;
}

/** Resolve a verb form to its infinitive, using the irregular map or a naive strip. */
function verbToInfinitive(form: string): string {
  const lower = form.toLowerCase();
  if (GERMAN_IRREGULAR_VERBS[lower]) return GERMAN_IRREGULAR_VERBS[lower];
  return lower;
}

export function gradeTempus(params: {
  studentAnswer: string;
  referenceAnswer: string; // admin's correct answer with verb in right tense
  targetTense: string; // "Präteritum" | "Präsens" | "Perfekt" | "Futur"
  points: number; // 0.5 pt per question
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, referenceAnswer, targetTense, points, locale = "fr" } = params;

  const wrongTenseNote = (tense: string) => ({
    fr: `Le verbe n'est pas conjugué au ${tense} correct.`,
    ar: `الفعل غير مصرّف بشكل صحيح في زمن ${tense}.`,
    de: `Das Verb ist nicht korrekt im ${tense} konjugiert.`,
  });
  const locText = (obj: { fr: string; ar: string; de: string }) =>
    locale === "ar" ? obj.ar : locale === "de" ? obj.de : obj.fr;

  if (!studentAnswer || !studentAnswer.trim()) {
    const note = wrongTenseNote(targetTense);
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.9,
      feedback_fr: locText(note),
      feedback_de: note.de,
      needsManualReview: false,
    };
  }

  const studentVerb = extractMainVerb(studentAnswer);
  const referenceVerb = extractMainVerb(referenceAnswer);

  let verbMatches = false;
  if (studentVerb && referenceVerb) {
    if (studentVerb === referenceVerb) {
      verbMatches = true;
    } else {
      // Same infinitive root (via irregular map)?
      const studInf = verbToInfinitive(studentVerb);
      const refInf = verbToInfinitive(referenceVerb);
      if (studInf === refInf && studentVerb.length > 0) {
        // same root — check exact conjugated form for tense correctness
        verbMatches = studentVerb === referenceVerb;
        // allow a very close typo (edit distance 1) on longer forms
        if (!verbMatches && Math.max(studentVerb.length, referenceVerb.length) > 4) {
          verbMatches = levenshteinDistance(studentVerb, referenceVerb) <= 1;
        }
      } else {
        // Different roots but still very close spelling -> minor typo tolerance
        verbMatches = levenshteinDistance(studentVerb, referenceVerb) <= 1 && studentVerb.length > 3;
      }
    }
  }

  if (!verbMatches) {
    const note = wrongTenseNote(targetTense);
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.8,
      feedback_fr: locText(note),
      feedback_de: note.de,
      needsManualReview: false,
    };
  }

  // Verb form correct — now check position (2nd position in main clause).
  const posOk = verbInSecondPosition(studentAnswer);
  if (!posOk) {
    return {
      score: round2(points - 0.125), maxScore: points, percentage: round2(((points - 0.125) / points) * 100),
      isCorrect: false, isPartial: true,
      method: "rule", confidence: 0.75,
      feedback_fr: locale === "ar" ? "موضع الفعل غير صحيح في الجملة." : "La position du verbe dans la phrase est incorrecte.",
      feedback_de: "Die Verbstellung im Satz ist nicht korrekt.",
      needsManualReview: false,
    };
  }

  return {
    score: points, maxScore: points, percentage: 100,
    isCorrect: true, isPartial: false,
    method: "rule", confidence: 0.9,
    feedback_fr: "",
    feedback_de: "",
    needsManualReview: false,
  };
}

/** Detect passive voice: "werden" auxiliary + past participle (-t / -en). */
function isPassiveVoice(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const hasWerdenAux = words.some((w) =>
    ["werde", "wirst", "wird", "werdet", "werden", "wurde", "wurdest", "wurden", "wurdet", "worden"].includes(
      w.replace(/[.,!?;:]+$/, "")
    )
  );
  if (!hasWerdenAux) return false;
  const hasParticiple = words.some((w) => {
    const clean = w.replace(/[.,!?;:]+$/, "");
    return /^ge.*(t|en)$/.test(clean) || /(t|en)$/.test(clean) && clean.length > 3;
  });
  return hasWerdenAux && hasParticiple;
}

export function gradeAktivPassiv(params: {
  studentAnswer: string;
  referenceAnswer: string;
  direction: "aktiv" | "passiv";
  points: number; // 1 pt
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, referenceAnswer, direction, points, locale = "fr" } = params;

  const noteWrongVoice = {
    fr: "La voix (actif/passif) n'est pas correcte.",
    ar: "الصيغة (فعل مبني للمعلوم/فعل مبني للمجهول) غير صحيحة.",
    de: "Die Stimme (Aktiv/Passiv) ist nicht korrekt.",
  };
  const locText = (obj: { fr: string; ar: string; de: string }) =>
    locale === "ar" ? obj.ar : locale === "de" ? obj.de : obj.fr;

  if (!studentAnswer || !studentAnswer.trim()) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.9,
      feedback_fr: locText(noteWrongVoice),
      feedback_de: noteWrongVoice.de,
      needsManualReview: false,
    };
  }

  const studentIsPassive = isPassiveVoice(studentAnswer);
  const voiceCorrect = direction === "passiv" ? studentIsPassive : !studentIsPassive;

  if (!voiceCorrect) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "rule", confidence: 0.85,
      feedback_fr: locText(noteWrongVoice),
      feedback_de: noteWrongVoice.de,
      needsManualReview: false,
    };
  }

  // Voice structure is correct — now check verb correctness vs reference.
  const studentVerb = extractMainVerb(studentAnswer);
  const referenceVerb = extractMainVerb(referenceAnswer);
  const verbOk =
    !!studentVerb &&
    !!referenceVerb &&
    (studentVerb === referenceVerb ||
      verbToInfinitive(studentVerb) === verbToInfinitive(referenceVerb));

  if (!verbOk) {
    return {
      score: points * 0.5, maxScore: points, percentage: 50,
      isCorrect: false, isPartial: true,
      method: "rule", confidence: 0.75,
      feedback_fr: locale === "ar" ? "الفعل غير صحيح لكن البنية صحيحة." : "Le verbe est incorrect mais la structure est correcte.",
      feedback_de: "Das Verb ist falsch, aber die Struktur ist korrekt.",
      needsManualReview: false,
    };
  }

  return {
    score: points, maxScore: points, percentage: 100,
    isCorrect: true, isPartial: false,
    method: "rule", confidence: 0.9,
    feedback_fr: "",
    feedback_de: "",
    needsManualReview: false,
  };
}

export async function gradeAnswerV2(params: {
  questionType: string;
  studentAnswer: string | Record<string, any>;
  referenceAnswer: string;
  acceptedVariants?: string[];
  requiredKeywords?: string[];
  points: number;
  locale?: Locale;
  toleranceRules?: string[];
}): Promise<GradeResultV2> {
  const {
    questionType,
    referenceAnswer,
    acceptedVariants = [],
    requiredKeywords = [],
    points,
    locale = "fr",
    toleranceRules,
  } = params;

  // Coerce object answers (e.g. kombinieren answer_key) to a stable string.
  const studentAnswer =
    typeof params.studentAnswer === "string"
      ? params.studentAnswer
      : stringifyStructured(params.studentAnswer);

  // Resolve tolerance rule ids -> rule objects (default set unless overridden).
  const activeRules: ToleranceRule[] = (toleranceRules && toleranceRules.length
    ? toleranceRules
    : ["IGNORE_CAPITALIZATION", "IGNORE_TRAILING_PERIOD", "ACCEPT_UMLAUT_ALTERNATIVE", "ACCEPT_HYPHEN_VARIATION"]
  ).map((id) => DEFAULT_TOLERANCE_RULES[id] ?? { id, penalty: 0, label: id });

  // ── RICHTIG ODER FALSCH: special dedicated grader ──────────────────────────
  if (questionType === "richtig_falsch_zitat") {
    // studentAnswer is expected to be: { choice: "richtig"|"falsch", zitat: string }
    // referenceAnswer encodes: "richtig::Die Rhein-Main-Region..." or just the zitat
    const raw = params.studentAnswer;
    const structuredAnswer = typeof raw === "object" && raw !== null ? raw as Record<string,any> : {};
    const studentRfChoice = (structuredAnswer.choice ?? structuredAnswer.rf_choice ?? "falsch") as "richtig" | "falsch";
    const studentZitat = String(structuredAnswer.zitat ?? structuredAnswer.zitat_text ?? studentAnswer ?? "");

    // Reference format: "richtig::citation text" or "falsch::citation text"
    const refParts = referenceAnswer.split("::");
    const correctRfChoice = (refParts[0]?.toLowerCase().trim() === "richtig" ? "richtig" : "falsch") as "richtig" | "falsch";
    const referenceZitat = refParts.slice(1).join("::").trim() || referenceAnswer;

    return gradeRichtigFalsch({
      studentRfChoice,
      correctRfChoice,
      studentZitat,
      referenceZitat,
      points,
      locale,
    });
  }

  // ── TITEL DES TEXTES: dedicated grader ──────────────────────────────────────
  if (questionType === "titel") {
    return gradeTitel({
      studentAnswer,
      acceptedTitles: [referenceAnswer, ...acceptedVariants].filter(Boolean),
      points,
      locale,
    });
  }

  // ── ÜBERSETZUNG (Arabic): dedicated grader ──────────────────────────────────
  if (questionType === "uebersetzung") {
    return gradeUebersetzung({
      studentAnswer,
      referenceAnswer,
      points,
      locale,
    });
  }

  // ── FRAGEN ZUM TEXT: dedicated grader ───────────────────────────────────────
  if (questionType === "fragen_zum_text") {
    return gradeFragenZumText({
      studentAnswer,
      referenceAnswer,
      points,
      locale,
    });
  }

  // ── GRAMMATIK: Tempus (dedicated grader) ────────────────────────────────────
  if (questionType === "grammatik_tempus") {
    const meta = typeof params.studentAnswer === "object" && params.studentAnswer !== null
      ? (params.studentAnswer as Record<string, any>)
      : {};
    return gradeTempus({
      studentAnswer,
      referenceAnswer,
      targetTense: meta.targetTense ?? meta.tense ?? "Präteritum",
      points,
      locale,
    });
  }

  // ── GRAMMATIK: Aktiv/Passiv (dedicated grader) ──────────────────────────────
  if (questionType === "grammatik_aktiv_passiv") {
    const meta = typeof params.studentAnswer === "object" && params.studentAnswer !== null
      ? (params.studentAnswer as Record<string, any>)
      : {};
    return gradeAktivPassiv({
      studentAnswer,
      referenceAnswer,
      direction: meta.direction ?? "passiv",
      points,
      locale,
    });
  }

  // ── GRAMMATIK: Satzbau / Satzverbindung (dedicated grader) ──────────────────
  if (questionType === "grammatik_satzbau") {
    const meta = typeof params.studentAnswer === "object" && params.studentAnswer !== null
      ? (params.studentAnswer as Record<string, any>)
      : {};
    return gradeSatzbau({
      studentAnswer,
      referenceAnswer,
      clauseType: meta.clauseType ?? "temporalsatz",
      points,
      locale,
    });
  }

  // ── GRAMMATIK: Modalverb (dedicated grader) ─────────────────────────────────
  if (questionType === "grammatik_modalverb") {
    const meta = typeof params.studentAnswer === "object" && params.studentAnswer !== null
      ? (params.studentAnswer as Record<string, any>)
      : {};
    return gradeModalverb({
      studentAnswer,
      referenceAnswer,
      correctModal: meta.correctModal ?? meta.modal ?? "können",
      points,
      locale,
    });
  }

  // Empty student answer -> immediate wrong, no manual review needed.
  if (!studentAnswer || !studentAnswer.trim()) {
    return makeResult({
      score: 0,
      maxScore: points,
      method: "exact",
      confidence: 1,
      isCorrect: false,
      isPartial: false,
      feedback_fr: locNote("wrong", locale, referenceAnswer),
      feedback_de: deNote("wrong", referenceAnswer),
      needsManualReview: false,
    });
  }

  const isExactType = EXACT_TYPES.has(questionType);
  const isOpenType = OPEN_TYPES.has(questionType);

  // ---- exact-match family: Layer 1 -> Layer 2 ----
  if (isExactType || (!isOpenType)) {
    const l1 = gradeExact(studentAnswer, referenceAnswer, acceptedVariants, points, locale);
    if (l1) return l1;

    const l2 = applyToleranceRules(studentAnswer, referenceAnswer, activeRules, points, locale);
    if (l2) return l2;

    // For pure exact types with no keyword expectation, a miss is simply wrong.
    if (isExactType && requiredKeywords.length === 0) {
      return makeResult({
        score: 0,
        maxScore: points,
        method: "exact",
        confidence: 0.85,
        isCorrect: false,
        isPartial: false,
        feedback_fr: locNote("wrong", locale, referenceAnswer),
        feedback_de: deNote("wrong", referenceAnswer),
        needsManualReview: false,
      });
    }
    // otherwise fall through to keyword/semantic below
  }

  // ---- open-ended family: Layer 3 (keywords) -> Layer 4 (semantic) ----
  // Try tolerance-adjusted exact first (cheap) for the rare verbatim case.
  const quickExact = gradeExact(studentAnswer, referenceAnswer, acceptedVariants, points, locale);
  if (quickExact && quickExact.isCorrect) return quickExact;

  const kw = gradeByKeywords(studentAnswer, referenceAnswer, requiredKeywords, points, locale);

  // If keywords are decisive (full marks) return immediately.
  if (kw.isCorrect) return kw;

  // Otherwise consult the semantic layer and keep whichever scores higher /
  // is more confident. Semantic is async and may be unavailable offline.
  let sem: GradeResultV2 | null = null;
  try {
    sem = await gradeWithEmbedding(studentAnswer, referenceAnswer, points, locale);
  } catch {
    sem = null;
  }

  const best = pickBest(kw, sem);
  return best;
}

/** Choose the better of two candidate results (higher score, then confidence). */
function pickBest(a: GradeResultV2, b: GradeResultV2 | null): GradeResultV2 {
  if (!b) return a;
  // Prefer a usable (non-manual) result over a manual-review one.
  const aManual = a.needsManualReview || a.method === "manual";
  const bManual = b.needsManualReview || b.method === "manual";
  if (aManual && !bManual) return b;
  if (bManual && !aManual) return a;
  if (b.score > a.score) return b;
  if (b.score === a.score && b.confidence > a.confidence) return b;
  return a;
}

/** Deterministically stringify a structured answer (e.g. matching keys). */
function stringifyStructured(obj: Record<string, any> | undefined | null): string {
  if (!obj) return "";
  if (Array.isArray(obj)) return obj.map((x) => String(x)).join(" ");
  return Object.keys(obj)
    .sort()
    .map((k) => `${k}:${obj[k]}`)
    .join(" ");
}

// ============================================================================
// ÜBERSETZUNG (German → Arabic) — dedicated grader
//
// Scoring (1 pt total):
//   >= 70% key-word overlap with admin's reference Arabic translation → 1.0 pt
//   >= 40%                                                            → 0.5 pt
//   < 40%                                                             → 0 pt
//
// Arabic-aware normalization:
//   - Strip common prefixes: ال، ب، ل، و، ف، ك، م
//   - Strip common suffixes: ة، ات، ون، ين، ان، تان، ين، ها، هم، هن
//   - Remove tashkeel (harakat): ً ٌ ٍ َ ُ ِ ّ ْ
//   - Compare word roots after stripping (not exact strings)
//
// Comparison: student Arabic answer vs admin's reference Arabic translation.
// Admin provides the reference in the exam builder.
// No external library needed — pure string manipulation.
// ============================================================================

/** Strip Arabic diacritics (tashkeel) for comparison */
function stripArabicDiacritics(text: string): string {
  // Unicode range for Arabic tashkeel: U+064B to U+0652, U+0670
  return text.replace(/[ً-ْٰ]/g, "");
}

/** Normalize an Arabic word to its approximate root/stem for comparison */
function normalizeArabicWord(word: string): string {
  let w = stripArabicDiacritics(word.trim().toLowerCase());

  // Strip definite article ال at beginning
  if (w.startsWith("ال")) w = w.slice(2);
  else if (w.startsWith("ٱل")) w = w.slice(2);

  // Strip common prefixes (single letter connectors)
  if (w.length > 3 && /^[بلوفكم]/.test(w)) w = w.slice(1);

  // Strip common feminine marker
  if (w.endsWith("ة") && w.length > 3) w = w.slice(0, -1);

  // Strip common plural suffixes
  if (w.endsWith("ون") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("ين") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("ات") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("ان") && w.length > 4) w = w.slice(0, -2);

  // Strip possessive/pronoun suffixes
  if (w.endsWith("ها") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("هم") && w.length > 4) w = w.slice(0, -2);
  if (w.endsWith("هن") && w.length > 4) w = w.slice(0, -2);

  return w;
}

/** Arabic stopwords to ignore in comparison */
const ARABIC_STOPWORDS = new Set([
  "في", "من", "إلى", "على", "عن", "مع", "أن", "إن", "لا", "ما", "هو", "هي",
  "هم", "هن", "أنا", "أنت", "نحن", "أنتم", "هذا", "هذه", "ذلك", "تلك",
  "التي", "الذي", "الذين", "اللواتي", "كان", "كانت", "يكون", "تكون",
  "و", "أو", "ثم", "لكن", "بل", "حتى", "إذا", "لو", "كي", "لأن",
  "قد", "لم", "لن", "هل", "ل", "ب", "ك", "م",
]);

/** Extract meaningful Arabic content words from text */
function extractArabicKeywords(text: string): string[] {
  return stripArabicDiacritics(text)
    .split(/[\s،,؛;.!?؟\-–—()\[\]{}«»"']+/)
    .map((w) => normalizeArabicWord(w))
    .filter((w) => w.length >= 2 && !ARABIC_STOPWORDS.has(w));
}

export function gradeUebersetzung(params: {
  studentAnswer: string;      // student's Arabic translation
  referenceAnswer: string;    // admin's Arabic reference translation
  points: number;             // 1 pt per the barème
  locale?: Locale;
}): GradeResultV2 {
  const { studentAnswer, referenceAnswer, points, locale = "fr" } = params;

  if (!studentAnswer.trim()) {
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "exact", confidence: 1,
      feedback_fr: locale === "ar" ? "لم يتم تقديم أي ترجمة." : "Aucune traduction fournie.",
      feedback_de: "Keine Übersetzung angegeben.",
    };
  }

  // Extract normalized keyword sets from both
  const refKws = extractArabicKeywords(referenceAnswer);
  const studKws = extractArabicKeywords(studentAnswer);

  if (refKws.length === 0) {
    // No reference to compare against — needs manual review
    return {
      score: 0, maxScore: points, percentage: 0,
      isCorrect: false, isPartial: false,
      method: "manual", confidence: 0,
      feedback_fr: "Traduction à corriger manuellement.",
      feedback_de: "Übersetzung muss manuell überprüft werden.",
      needsManualReview: true,
    };
  }

  // Match: for each reference keyword, check if student has it (or a close form)
  const refSet = new Set(refKws);
  const studSet = new Set(studKws);

  // Direct root match
  let matched = 0;
  const missingKws: string[] = [];

  for (const rw of refSet) {
    if (studSet.has(rw)) {
      matched++;
    } else {
      // Fuzzy match: edit distance ≤ 2 for longer words (handles spelling variants)
      const fuzzyMatch = [...studSet].some(
        (sw) => rw.length >= 4 && levenshteinDistance(rw, sw) <= 2
      );
      if (fuzzyMatch) {
        matched++;
      } else {
        missingKws.push(rw);
      }
    }
  }

  const overlap = matched / refSet.size;

  // Score thresholds
  let score: number;
  let isCorrect: boolean;
  let isPartial: boolean;
  let feedback_fr: string;
  let feedback_de: string;

  if (overlap >= 0.70) {
    score = points;
    isCorrect = true;
    isPartial = false;
    feedback_fr = ""; // no feedback for full score
    feedback_de = "";
  } else if (overlap >= 0.40) {
    score = points * 0.5;
    isCorrect = false;
    isPartial = true;
    feedback_fr = locale === "ar"
      ? "الترجمة ناقصة. معلومات أساسية غائبة."
      : "Traduction incomplète. Des informations essentielles manquent.";
    feedback_de = "Die Übersetzung ist unvollständig. Wesentliche Informationen fehlen.";
  } else {
    score = 0;
    isCorrect = false;
    isPartial = false;
    feedback_fr = locale === "ar"
      ? "الترجمة تحتوي على أخطاء كثيرة جداً."
      : "La traduction contient trop d'erreurs.";
    feedback_de = "Die Übersetzung enthält zu viele Fehler.";
  }

  return {
    score,
    maxScore: points,
    percentage: Math.round((score / points) * 100),
    isCorrect,
    isPartial,
    method: "keyword",
    confidence: 0.80,
    feedback_fr,
    feedback_de,
    details: {
      keywordsFound: [...refSet].filter((w) => !missingKws.includes(w)),
      keywordsMissing: missingKws,
    },
    needsManualReview: false,
  };
}

// ---------------------------------------------------------------------------
export default gradeAnswerV2;
