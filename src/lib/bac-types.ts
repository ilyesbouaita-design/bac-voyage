// Bac question sub-types (stored in content.bac_type)
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

// Content JSON structures per type
export interface RichtigFalschContent {
  bac_type: "richtig_falsch_zitat";
  statements: Array<{
    text: string;
    is_richtig: boolean;
    zitat: string;
    points: number;
  }>;
}

export interface FragenZumTextContent {
  bac_type: "fragen_zum_text";
  question: string;
  reference_answer: string;
}

export interface KombinierenContent {
  bac_type: "kombinieren";
  left_items: Array<{ label: string; text: string }>; // label: a,b,c,d
  right_items: Array<{ label: string; text: string }>; // label: 1,2,3,4
  answer_key: Record<string, string>; // e.g. { a: "2", b: "3" }
}

export interface ErgaenzenContent {
  bac_type: "ergaenzen";
  sentences: Array<{
    text: string; // full sentence with the word present
    blank_word: string; // the word to blank out
  }>;
}

export interface TitelContent {
  bac_type: "titel";
  accepted_titles: string[];
}

export interface SynonymContent {
  bac_type: "synonym";
  sentence: string;
  target_word: string;
  accepted_answers: string[];
}

export interface GegenteilContent {
  bac_type: "gegenteil";
  sentence: string;
  target_word: string;
  gap_sentence: string; // sentence with "………" gap
  accepted_answers: string[];
}

export interface UebersetzungContent {
  bac_type: "uebersetzung";
  german_sentence: string;
  accepted_translations: string[];
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
  hint?: string; // e.g. "d……"
  accepted_answers: Array<{ article: string; word: string }>; // article can be empty
}

export interface GrammatikTempusContent {
  bac_type: "grammatik_tempus";
  tense: "Präsens" | "Präteritum" | "Perfekt" | "Futur";
  original_sentence: string;
  correct_answer: string;
}

export interface GrammatikAktivPassivContent {
  bac_type: "grammatik_aktiv_passiv";
  direction: "aktiv" | "passiv"; // "aktiv" = Passiv→Aktiv, "passiv" = Aktiv→Passiv
  original_sentence: string;
  correct_answer: string;
}

export interface GrammatikSatzbauContent {
  bac_type: "grammatik_satzbau";
  clause_type: "Finalsatz" | "Konditionalsatz" | "Konzessivsatz" | "Temporalsatz" | "Relativsatz";
  sentence1: string;
  sentence2: string;
  correct_answer: string;
}

export interface GrammatikModalverbContent {
  bac_type: "grammatik_modalverb";
  sentence: string;
  underlined_words: string[]; // the words to underline
  correct_answer: string;
}

export interface GrammatikKonnektorenContent {
  bac_type: "grammatik_konnektoren";
  sentences: Array<{
    text_with_gaps: string; // text with "___" markers
    connectors: string[]; // the connector parts for this sentence (e.g. ["um", "zu"] or ["anstatt"])
    connector_display: string; // how to show in word bank: "um...zu" or "anstatt"
  }>;
}

export interface GrammatikDeklinationContent {
  bac_type: "grammatik_deklination";
  template: string; // e.g. "D[er] groß[e] Hund"
  // Brackets mark the gaps — system parses them
}

export interface GrammatikFragenStellenContent {
  bac_type: "grammatik_fragen_stellen";
  sentence: string;
  underlined_words: string[];
  correct_question: string;
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

// Student answer structures
export interface StudentAnswer {
  question_id: string;
  bac_type: BacQuestionType;
  response: any; // varies by type
}

// Exam section structure for rendering
export interface BacExamSection {
  id: string;
  title_fr: string;
  title_ar: string;
  kind: string; // "textverstaendnis" | "sprachfaehigkeit"
  instructions_fr: string;
  passage_de: string;
  order_index: number;
  questions: BacExamQuestion[];
}

export interface BacExamQuestion {
  id: string;
  type: string; // from DB enum
  bac_content: BacContent;
  prompt_fr: string;
  prompt_de: string;
  points: number;
  grade_method: "auto" | "ai" | "manual";
  order_index: number;
}

// Vocabulary entry for the text passage
export interface VocabEntry {
  german: string;
  arabic: string;
  french: string;
}

// Correction result from AI
export interface CorrectionResult {
  is_correct: boolean;
  is_partial: boolean;
  score: number;
  max_score: number;
  feedback_fr: string;
  feedback_ar?: string;
  reference_answer?: string;
}

// Helper to parse Deklination template
export function parseDeklinationTemplate(template: string): Array<{ type: "text" | "gap"; value: string }> {
  const parts: Array<{ type: "text" | "gap"; value: string }> = [];
  let current = "";
  let inBracket = false;
  for (const char of template) {
    if (char === "[") {
      if (current) parts.push({ type: "text", value: current });
      current = "";
      inBracket = true;
    } else if (char === "]") {
      parts.push({ type: "gap", value: current });
      current = "";
      inBracket = false;
    } else {
      current += char;
    }
  }
  if (current) parts.push({ type: "text", value: current });
  return parts;
}
