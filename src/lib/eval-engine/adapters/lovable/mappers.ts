import { compoundAnswer, textAnswer } from "../../core/answer.ts";
import type { EvaluationInput } from "../../core/input.ts";
import type {
  BacExamQuestion,
  ErgaenzenContent,
  FragenZumTextContent,
  GegenteilContent,
  GrammatikAktivPassivContent,
  GrammatikDeklinationContent,
  GrammatikFragenStellenContent,
  GrammatikKonnektorenContent,
  GrammatikModalverbContent,
  GrammatikSatzbauContent,
  GrammatikTempusContent,
  KombinierenContent,
  KompositumBildenContent,
  KompositumLoesenContent,
  RichtigFalschContent,
  SynonymContent,
  TitelContent,
  UebersetzungContent,
  WortableitungContent,
} from "./types.ts";

/**
 * Maps one Lovable question + its raw student response into one or more
 * EvaluationInput objects (more than one only for multi-item exercises:
 * richtig_falsch_zitat's statements, grammatik_konnektoren's sentences).
 * Pure structural mapping — no grading decisions are made here; every
 * mapper just relocates fields from the Lovable shape into the engine's.
 */
export type InputMapper = (question: BacExamQuestion, response: unknown) => EvaluationInput[];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// --- Sprachfähigkeit (fixed-answer, ExactStrategy) -------------------------

const mapSynonym: InputMapper = (question, response) => {
  const content = question.bac_content as SynonymContent;
  return [
    {
      exerciseType: "synonym",
      answer: textAnswer(asString(response)),
      reference: { accepted_answers: content.accepted_answers },
    },
  ];
};

const mapUebersetzung: InputMapper = (question, response) => {
  const content = question.bac_content as UebersetzungContent;
  return [
    {
      exerciseType: "uebersetzung",
      answer: textAnswer(asString(response)),
      reference: { german_sentence: content.german_sentence, accepted_translations: content.accepted_translations },
    },
  ];
};

const mapKombinieren: InputMapper = (question, response) => {
  const content = question.bac_content as KombinierenContent;
  const mapping = (response ?? {}) as Record<string, string>;
  return [
    {
      exerciseType: "kombinieren",
      answer: compoundAnswer(mapping),
      reference: { answer_key: content.answer_key, left_items: content.left_items, right_items: content.right_items },
    },
  ];
};

/** Mirror image of synonym — same shape, same grading, opposite word relation. gap_sentence is display-only, not read here. */
const mapGegenteil: InputMapper = (question, response) => {
  const content = question.bac_content as GegenteilContent;
  return [
    {
      exerciseType: "gegenteil",
      answer: textAnswer(asString(response)),
      reference: { accepted_answers: content.accepted_answers },
    },
  ];
};

const mapTitel: InputMapper = (question, response) => {
  const content = question.bac_content as TitelContent;
  return [
    {
      exerciseType: "titel",
      answer: textAnswer(asString(response)),
      reference: { accepted_titles: content.accepted_titles },
    },
  ];
};

/** The real content has exactly ONE correct compound (`result`), not a list — synthesized into a one-element accepted_answers array so this reuses ExactMatch unmodified. */
const mapKompositumBilden: InputMapper = (question, response) => {
  const content = question.bac_content as KompositumBildenContent;
  return [
    {
      exerciseType: "kompositum_bilden",
      answer: textAnswer(asString(response)),
      reference: { accepted_answers: [content.result] },
    },
  ];
};

/** Expected response shape: { word1, word2 } — confirmed directly against bac-voyage's real WortbildungCard (kompositum_loesen variant). */
const mapKompositumLoesen: InputMapper = (question, response) => {
  const content = question.bac_content as KompositumLoesenContent;
  const answer = (response ?? {}) as { word1?: string; word2?: string };
  return [
    {
      exerciseType: "kompositum_loesen",
      answer: compoundAnswer({ word1: answer.word1 ?? "", word2: answer.word2 ?? "" }),
      reference: { word1: content.word1, word2: content.word2 },
    },
  ];
};

/** Expected response shape: { article, word } — confirmed directly against bac-voyage's real WortbildungCard (wortableitung variant); NOT a plain string despite the singular onAnswerChange name. */
const mapWortableitung: InputMapper = (question, response) => {
  const content = question.bac_content as WortableitungContent;
  const answer = (response ?? {}) as { article?: string; word?: string };
  return [
    {
      exerciseType: "wortableitung",
      answer: compoundAnswer({ article: answer.article ?? "", word: answer.word ?? "" }),
      reference: { accepted: content.accepted_answers },
    },
  ];
};

/**
 * Expected response shape: Record<number, string>, one entry per sentence
 * index — confirmed directly against bac-voyage's real ErgaenzenCard
 * (its own `gaps` state, keyed by index). Multi-item, same pattern as
 * grammatik_konnektoren: one EvaluationInput per sentence, each graded
 * independently against the ONE ergaenzenProfile and summed by
 * evaluateExercise.
 */
const mapErgaenzen: InputMapper = (question, response) => {
  const content = question.bac_content as ErgaenzenContent;
  const answers = (response ?? {}) as Record<number, string>;
  return content.sentences.map((sentence, index) => ({
    exerciseType: "ergaenzen",
    answer: textAnswer(answers[index] ?? ""),
    reference: { accepted_answers: [sentence.blank_word] },
  }));
};

// --- Textverständnis (SemanticStrategy / ExactStrategy) --------------------

/**
 * Fix (production compatibility review): the real content schema has no
 * per-point breakdown field, only one holistic `reference_answer`. Passing
 * `required_info: []` made InformationExpressedSkill short-circuit to FULL
 * MARKS unconditionally (its very first check is "no points to judge ->
 * award everything") — an unrelated wrong answer scored 1/1. Synthesizing
 * ONE required-info point from `reference_answer` makes the skill actually
 * run its real meaning-comparison logic instead of bypassing it.
 *
 * This is deliberately the single-point version, not a heuristic split into
 * several points: with one point, "proportional" scoring is effectively
 * binary (0 or the full 0.5) for the information half — coarser than a real
 * multi-point breakdown, but a correct, safe grade on every input, unlike
 * the unconditional-full-marks behavior it replaces. If the content schema
 * ever adds a genuine per-point `required_info` field, this mapper should
 * prefer it over this synthesis — not proposed here, since that is a
 * separate, optional, teacher-authoring enhancement (see the compatibility
 * review), not a correctness requirement.
 */
const mapFragenZumText: InputMapper = (question, response) => {
  const content = question.bac_content as FragenZumTextContent;
  return [
    {
      exerciseType: "fragen_zum_text",
      answer: textAnswer(asString(response)),
      reference: {
        question: content.question,
        model_answers: [content.reference_answer],
        required_info: [{ text: content.reference_answer }],
      },
    },
  ];
};

/** Expected response shape: one { choice, zitat } per statement, in order. */
const mapRichtigFalschZitat: InputMapper = (question, response) => {
  const content = question.bac_content as RichtigFalschContent;
  const answers = Array.isArray(response) ? (response as Array<{ choice?: string; zitat?: string }>) : [];
  return content.statements.map((statement, index) => {
    const answer = answers[index] ?? {};
    return {
      exerciseType: "richtig_falsch_zitat",
      answer: compoundAnswer({ choice: answer.choice ?? "", zitat: answer.zitat ?? "" }),
      reference: { is_richtig: statement.is_richtig, zitat: statement.zitat },
    };
  });
};

// --- Grammatik (StructuralStrategy / ExactStrategy) -------------------------

const TENSE_TO_PROFILE_KEY: Record<string, string> = {
  Präsens: "tempus.präsens",
  Präteritum: "tempus.präteritum",
  Perfekt: "tempus.perfekt",
  Futur: "tempus.futur",
};

/**
 * Integration caveat: Perfekt (and Aktiv-Passiv, see below) grade reliably
 * via the engine's own derivation from correct_answer alone. Präsens,
 * Präteritum, and Futur do NOT — Conjugation has no derivation path for a
 * lexical main verb, and Infinitive/VerbLemma never derive. Without the
 * optional answer_key field, these three sub-types fail fast; this adapter
 * converts that into a `manual: true` result rather than crashing (see
 * index.ts).
 */
const mapGrammatikTempus: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikTempusContent;
  const profileKey = TENSE_TO_PROFILE_KEY[content.tense];
  if (!profileKey) {
    throw new Error(`grammatik_tempus: unknown tense "${content.tense}".`);
  }
  return [
    {
      exerciseType: "grammatik_tempus",
      profileKey,
      answer: textAnswer(asString(response)),
      reference: {
        correctAnswer: content.correct_answer,
        alternatives: content.alternative_answers,
        answerKey: content.answer_key,
      },
    },
  ];
};

/**
 * Detects whether `correctAnswer` uses a PRÄTERITUM form of "werden" (wurde/
 * wurdest/wurden/wurdet) rather than a PRÄSENS form (werde/wirst/wird/
 * werden/werdet), to route grammatik_aktiv_passiv to the right tense-keyed
 * Passiv profile. Deliberately narrow and adapter-local rather than reusing
 * the engine's GermanLinguistics: findFiniteVerb() collapses every werden
 * form to the same { lemma: "werden" } result — it reports THAT a werden
 * form is present, never WHICH surface form, so it cannot answer this
 * specific question. This is new adapter-only ROUTING logic, not a
 * duplication of any existing engine capability.
 *
 * Deliberately does NOT try to classify Konjunktiv II forms (würde/
 * würdest/würden/würdet) as präteritum — those are a distinct, more
 * advanced grammatical case this exercise type was never built to test.
 * Anything that isn't an unambiguous präteritum indicative form (including
 * a sentence with no werden form at all) falls back to präsens — the exact
 * existing default — rather than guessing.
 */
const PASSIV_PRAETERITUM_PATTERN = /\b(?:wurde|wurdest|wurden|wurdet)\b/i;

function detectPassivProfileKey(correctAnswer: string): "passiv.präsens" | "passiv.präteritum" {
  return PASSIV_PRAETERITUM_PATTERN.test(correctAnswer) ? "passiv.präteritum" : "passiv.präsens";
}

/**
 * Integration note: the real content model tracks DIRECTION (aktiv/passiv)
 * but not TENSE, while the engine's Passiv profiles are tense-keyed
 * (passiv.präsens / passiv.präteritum). direction:"passiv" (Aktiv→Passiv,
 * the only direction the engine has a profile for) is routed by DETECTING
 * the tense from the werden form actually present in correct_answer
 * (detectPassivProfileKey above), rather than always defaulting to
 * präsens — fixed after the production compatibility review found this
 * caused präteritum-intended questions to be graded under präsens's point
 * weights. direction:"aktiv" (Passiv→Aktiv) has NO matching engine profile
 * at all — that transformation was never built — so it throws, which the
 * caller converts to a manual-review result.
 */
const mapGrammatikAktivPassiv: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikAktivPassivContent;
  if (content.direction === "aktiv") {
    throw new Error(
      'grammatik_aktiv_passiv: direction "aktiv" (Passiv -> Aktiv) has no matching engine profile — ' +
        'only Aktiv -> Passiv (direction "passiv") is covered.',
    );
  }
  return [
    {
      exerciseType: "grammatik_aktiv_passiv",
      profileKey: detectPassivProfileKey(content.correct_answer),
      answer: textAnswer(asString(response)),
      reference: {
        correctAnswer: content.correct_answer,
        alternatives: content.alternative_answers,
        answerKey: content.answer_key,
      },
    },
  ];
};

const CLAUSE_TYPE_TO_PROFILE_KEY: Record<string, string> = {
  Temporalsatz: "satzbau.temporal",
  Finalsatz: "satzbau.final",
  Kausalsatz: "satzbau.kausal",
  Konditionalsatz: "satzbau.konditional",
  Konzessivsatz: "satzbau.konzessiv",
  Relativsatz: "satzbau.relativ",
};

const mapGrammatikSatzbau: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikSatzbauContent;
  const profileKey = CLAUSE_TYPE_TO_PROFILE_KEY[content.clause_type];
  if (!profileKey) {
    throw new Error(`grammatik_satzbau: unknown clause_type "${content.clause_type}".`);
  }
  return [
    {
      exerciseType: "grammatik_satzbau",
      profileKey,
      answer: textAnswer(asString(response)),
      reference: {
        correctAnswer: content.correct_answer,
        alternatives: content.alternative_answers,
        answerKey: content.answer_key,
      },
    },
  ];
};

/** Integration caveat: VerbLemma always requires answer_key.verbLemma (no derivation exists). */
const mapGrammatikModalverb: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikModalverbContent;
  return [
    {
      exerciseType: "grammatik_modalverb",
      profileKey: "modalverb.standard",
      answer: textAnswer(asString(response)),
      reference: {
        correctAnswer: content.correct_answer,
        alternatives: content.alternative_answers,
        answerKey: content.answer_key,
      },
    },
  ];
};

/** Expected response shape: string[] endings, one per gap in the template. */
const mapGrammatikDeklination: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikDeklinationContent;
  const endings = Array.isArray(response) ? (response as string[]) : [];
  return [
    {
      exerciseType: "grammatik_deklination",
      answer: compoundAnswer({ endings }),
      reference: { template: content.template },
    },
  ];
};

/** Expected response shape: one string[] of gap-fills per sentence, in order. */
const mapGrammatikKonnektoren: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikKonnektorenContent;
  const answers = Array.isArray(response) ? (response as string[][]) : [];
  return content.sentences.map((sentence, index) => ({
    exerciseType: "grammatik_konnektoren",
    answer: compoundAnswer({ connectors: answers[index] ?? [] }),
    reference: { connectors: sentence.connectors, alternative_connectors: sentence.alternative_connectors },
  }));
};

/** Integration caveat: QuestionWord always requires answer_key.questionWord (no derivation exists). */
const mapGrammatikFragenStellen: InputMapper = (question, response) => {
  const content = question.bac_content as GrammatikFragenStellenContent;
  return [
    {
      exerciseType: "grammatik_fragen_stellen",
      answer: textAnswer(asString(response)),
      reference: {
        correctAnswer: content.correct_question,
        alternatives: content.alternative_answers,
        answerKey: content.answer_key,
      },
    },
  ];
};

/**
 * The full registry: one mapper per SUPPORTED bac_type. Deliberately a Map,
 * not a switch — resolving an unregistered bac_type is a lookup miss
 * (handled by the caller), never a code branch to add to.
 *
 * As of Migration Plan Phase 6, all 18 real bac_types have a mapper — the
 * previous gap (ergaenzen, titel, gegenteil, kompositum_bilden,
 * kompositum_loesen, wortableitung had no engine profile at all) is closed.
 */
export const inputMappers = new Map<string, InputMapper>([
  ["synonym", mapSynonym],
  ["gegenteil", mapGegenteil],
  ["titel", mapTitel],
  ["uebersetzung", mapUebersetzung],
  ["kombinieren", mapKombinieren],
  ["kompositum_bilden", mapKompositumBilden],
  ["kompositum_loesen", mapKompositumLoesen],
  ["wortableitung", mapWortableitung],
  ["ergaenzen", mapErgaenzen],
  ["fragen_zum_text", mapFragenZumText],
  ["richtig_falsch_zitat", mapRichtigFalschZitat],
  ["grammatik_tempus", mapGrammatikTempus],
  ["grammatik_aktiv_passiv", mapGrammatikAktivPassiv],
  ["grammatik_satzbau", mapGrammatikSatzbau],
  ["grammatik_modalverb", mapGrammatikModalverb],
  ["grammatik_deklination", mapGrammatikDeklination],
  ["grammatik_konnektoren", mapGrammatikKonnektoren],
  ["grammatik_fragen_stellen", mapGrammatikFragenStellen],
]);
