import type { FeedbackItem } from "../../core/feedback.ts";

// ============================================================================
// Lovable-side types — the subset of bac-voyage's bac-types.ts relevant to
// grading. These mirror the real data model; they are NOT re-exports of
// bac-voyage's own types (this package has no persistent access to that
// repo — content shapes were confirmed by reading src/lib/bac-types.ts
// directly during the Phase 1 migration-plan investigation and again for
// the 6 Phase-6 types below), so keep them in sync manually if the source
// schema changes.
// ============================================================================

export type BacQuestionType =
  | "richtig_falsch_zitat"
  | "fragen_zum_text"
  | "kombinieren"
  | "ergaenzen"
  | "titel"
  | "synonym"
  | "gegenteil"
  | "uebersetzung"
  | "kompositum_bilden"
  | "kompositum_loesen"
  | "wortableitung"
  | "grammatik_tempus"
  | "grammatik_aktiv_passiv"
  | "grammatik_satzbau"
  | "grammatik_modalverb"
  | "grammatik_konnektoren"
  | "grammatik_deklination"
  | "grammatik_fragen_stellen";

/**
 * NOT part of the original bac-voyage content schema. An OPTIONAL,
 * forward-compatible field this adapter reads if present on a grammar
 * question's bac_content, to supply the engine's answerKey directly.
 *
 * Several engine skills have no derivation fallback (VerbLemma, Infinitive,
 * QuestionWord always require an explicit expected value; Conjugation has no
 * fallback for a lexical main verb, only for auxiliaries/modals). Without
 * this field, grading for the affected exercise (sub-)types fails fast and
 * this adapter converts that into a `manual: true` result — see mappers.ts
 * for exactly which ones are affected today.
 */
export interface GrammarAnswerKeyInput {
  auxiliary?: string;
  auxiliaryLemma?: string;
  finite?: string;
  partizip?: string;
  verbLemma?: string;
  subject?: string;
  subordinateFinal?: string;
  relativePronoun?: string;
  questionWord?: string;
}

export interface RichtigFalschContent {
  bac_type: "richtig_falsch_zitat";
  statements: Array<{ text: string; is_richtig: boolean; zitat: string; points: number }>;
}

export interface FragenZumTextContent {
  bac_type: "fragen_zum_text";
  question: string;
  reference_answer: string;
}

export interface KombinierenContent {
  bac_type: "kombinieren";
  left_items: Array<{ label: string; text: string }>;
  right_items: Array<{ label: string; text: string }>;
  answer_key: Record<string, string>;
}

export interface SynonymContent {
  bac_type: "synonym";
  sentence: string;
  target_word: string;
  accepted_answers: string[];
}

export interface UebersetzungContent {
  bac_type: "uebersetzung";
  german_sentence: string;
  accepted_translations: string[];
}

export interface GrammatikTempusContent {
  bac_type: "grammatik_tempus";
  tense: "Präsens" | "Präteritum" | "Perfekt" | "Futur";
  original_sentence: string;
  correct_answer: string;
  alternative_answers?: string[];
  answer_key?: GrammarAnswerKeyInput;
}

export interface GrammatikAktivPassivContent {
  bac_type: "grammatik_aktiv_passiv";
  direction: "aktiv" | "passiv"; // "aktiv" = Passiv→Aktiv, "passiv" = Aktiv→Passiv
  original_sentence: string;
  correct_answer: string;
  alternative_answers?: string[];
  answer_key?: GrammarAnswerKeyInput;
}

export interface GrammatikSatzbauContent {
  bac_type: "grammatik_satzbau";
  clause_type: "Finalsatz" | "Konditionalsatz" | "Konzessivsatz" | "Temporalsatz" | "Relativsatz" | "Kausalsatz";
  sentence1: string;
  sentence2: string;
  correct_answer: string;
  alternative_answers?: string[];
  answer_key?: GrammarAnswerKeyInput;
}

export interface GrammatikModalverbContent {
  bac_type: "grammatik_modalverb";
  sentence: string;
  underlined_words: string[];
  correct_answer: string;
  alternative_answers?: string[];
  answer_key?: GrammarAnswerKeyInput;
}

export interface GrammatikKonnektorenContent {
  bac_type: "grammatik_konnektoren";
  sentences: Array<{
    text_with_gaps: string;
    connectors: string[];
    connector_display: string;
    alternative_connectors?: string[][];
  }>;
}

export interface GrammatikDeklinationContent {
  bac_type: "grammatik_deklination";
  template: string;
}

export interface GrammatikFragenStellenContent {
  bac_type: "grammatik_fragen_stellen";
  sentence: string;
  underlined_words: string[];
  correct_question: string;
  alternative_answers?: string[];
  answer_key?: GrammarAnswerKeyInput;
}

/**
 * Migration Plan Phase 6: these 6 shapes previously had no engine profile
 * and were represented only by an opaque UnsupportedContent placeholder.
 * Confirmed directly against bac-voyage's real src/lib/bac-types.ts during
 * the Phase 1 investigation, then used to build the profiles below —
 * replacing the placeholder now that every field is known precisely.
 */
export interface ErgaenzenContent {
  bac_type: "ergaenzen";
  sentences: Array<{ text: string; blank_word: string }>;
}

export interface TitelContent {
  bac_type: "titel";
  accepted_titles: string[];
}

export interface GegenteilContent {
  bac_type: "gegenteil";
  sentence: string;
  target_word: string;
  /** Display-only (the sentence with a "………" gap); not read by gegenteilProfile's grading. */
  gap_sentence: string;
  accepted_answers: string[];
}

export interface KompositumBildenContent {
  bac_type: "kompositum_bilden";
  word1: string;
  word2: string;
  result: string;
}

export interface KompositumLoesenContent {
  bac_type: "kompositum_loesen";
  compound: string;
  word1: string;
  word2: string;
}

export interface WortableitungContent {
  bac_type: "wortableitung";
  source_type: "Substantiv" | "Verb" | "Adjektiv";
  target_type: "Substantiv" | "Verb" | "Adjektiv";
  word: string;
  hint?: string;
  /** article is "" when target_type takes no article (Verb/Adjektiv). */
  accepted_answers: Array<{ article: string; word: string }>;
}

export type BacContent =
  | RichtigFalschContent
  | FragenZumTextContent
  | KombinierenContent
  | ErgaenzenContent
  | TitelContent
  | SynonymContent
  | GegenteilContent
  | UebersetzungContent
  | KompositumBildenContent
  | KompositumLoesenContent
  | WortableitungContent
  | GrammatikTempusContent
  | GrammatikAktivPassivContent
  | GrammatikSatzbauContent
  | GrammatikModalverbContent
  | GrammatikKonnektorenContent
  | GrammatikDeklinationContent
  | GrammatikFragenStellenContent;

export interface BacExamQuestion {
  id: string;
  type: string;
  bac_content: BacContent;
  prompt_fr: string;
  prompt_de: string;
  points: number;
  grade_method: "auto" | "ai" | "manual";
  order_index: number;
}

// ============================================================================
// Adapter output — deliberately NOT the old CorrectionResult shape (which
// expected pre-translated feedback_fr/feedback_ar/feedback_de strings).
// correctAnswer() itself never translates: `feedback` carries the engine's
// own structured FeedbackItem[] (key + points + skill + params). A consumer
// can map keys to French/Arabic/German text directly, OR — for a zero-
// frontend-change migration — pass this result through legacy.ts's
// toLegacyResult(), which DOES produce the old feedback_fr/ar/de string
// shape via translations.ts's dictionary. Both paths are available; neither
// is required by the other.
// ============================================================================

export interface LovableCorrectionResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
  /** True if this needs human review — either the engine flagged it (semantic strategy, low confidence) or the adapter could not grade it automatically (see feedback for "adapter.grading.*" keys). */
  manual: boolean;
  /** Which strategy graded this question. Omitted for multi-item exercises (mixed per item). */
  strategy?: string;
  /** Structured, language-independent feedback — never translated text. */
  feedback: FeedbackItem[];
  /** Present only for multi-item exercises (richtig_falsch_zitat, grammatik_konnektoren): one entry per statement/sentence. */
  perItem?: Array<{ score: number; maxScore: number; manual?: boolean; feedback: FeedbackItem[] }>;
}
