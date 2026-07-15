import { answerString } from "../../core/answer.ts";
import type { Skill, SkillContext, SkillResult } from "../../core/skill.ts";
import { round2 } from "../../utilities/round.ts";
import { asDerivationReference, wortbildungResult } from "./reference.ts";

/** Opt-in typo tolerance for the WORD comparison only — never the article (see the class doc comment for why). */
export interface DerivationFuzzyToleranceConfig {
  /** Minimum Damerau-Levenshtein similarity (0..1) to count as a typo rather than a wrong word. Default 0.75. */
  minSimilarity?: number;
  /** Fraction of the word-correct base (0.5 of maxPoints) awarded for a typo. Default 0.5. */
  creditShare?: number;
}

/** Per-profile configuration for the Derivation skill. */
export interface DerivationConfig {
  /** Case-sensitive comparison for both the word and the article. Default true. Set false to match bac-voyage's own WortbildungCard, which compares case-insensitively. */
  caseSensitive?: boolean;
  /**
   * Treat ä/ö/ü/ß and their ASCII transliterations (ae/oe/ue/ss) as fully
   * equivalent for the WORD and ARTICLE comparisons — native port of
   * grading-engine-v2's ACCEPT_UMLAUT_ALTERNATIVE tolerance rule. Default
   * false. Full credit, not typo-tier partial credit (see GermanLinguistics
   * .normalizeUmlauts's own doc comment for why).
   */
  acceptUmlautAlternative?: boolean;
  /** Opt-in Damerau-Levenshtein typo tolerance on the WORD comparison. Off (undefined) unless a profile sets it. */
  fuzzy?: DerivationFuzzyToleranceConfig;
}

const WORD_CORRECT_BASE = 0.5;
const CAPITALIZATION_PENALTY = 0.25;
const ARTICLE_PENALTY = 0.25;
const DEFAULT_FUZZY_MIN_SIMILARITY = 0.75;
const DEFAULT_FUZZY_CREDIT_SHARE = 0.5;

/** Does this word's first character look like a capital letter? "" and non-letter first characters are not. */
function isUpperCaseFirst(word: string): boolean {
  const first = word.charAt(0);
  return first !== "" && first === first.toUpperCase() && first !== first.toLowerCase();
}

/** The outcome of judging ONE accepted entry against the student's answer. */
interface EntryVerdict {
  readonly score: number;
  readonly key: string;
  readonly params?: Record<string, string | number | boolean>;
  readonly isFullyCorrect: boolean;
}

/**
 * Derivation — judges deriving a word of the target part of speech from a
 * given source word (e.g. Verb "spielen" -> Substantiv "das Spiel"), against
 * EVERY accepted entry, keeping whichever scores highest — mirroring
 * grading-engine-v2's legacy predecessor's own gradeWortableitung, which
 * tries every accepted answer via gradeWortbildung and keeps the best
 * GradeResult.score, breaking early only on a perfect match. This matters
 * for the real, narrow case of two accepted entries sharing the same word
 * with different article requirements (a German homograph, e.g. "das
 * Steuer" vs. "die Steuer") — checking only the FIRST word-match (this
 * skill's earlier behavior) could pick the wrong entry's rule; trying all
 * of them and keeping the best cannot.
 *
 * Ported from grading-engine.ts's gradeWortbildung (confirmed against its
 * literal source, not reimplemented from memory), THREE independent
 * judgments per entry, not two:
 *   1. Word content match (gate — wrong word is always 0, regardless of
 *      article/capitalization).
 *   2. Majuskel (capitalization): if the correct word starts with a
 *      capital letter (every derived Substantiv does; a derived
 *      Verb/Adjektiv never does), the student's word must ALSO start with
 *      one, or lose a quarter of the word-correct base — independent of
 *      and in ADDITION to the article check. This is the specific
 *      capability the standalone engine's Derivation skill did not have
 *      before Migration Plan Phase 2: it treated the whole word comparison
 *      as one case-insensitive gate with no separate capitalization
 *      penalty. German orthography requires noun capitalization — this
 *      matters pedagogically for a French/Arabic-speaking learner, whose
 *      own languages don't capitalize common nouns.
 *   3. Article: only checked when the matched entry actually requires one
 *      (article !== ""), exactly as before.
 * Each of #2/#3 independently costs 25% of the 0.5 base if wrong; both
 * wrong costs the full 50%, i.e. the same net 0 as a wrong word (matching
 * grading-engine.ts's own isPartial=false in that exact case) — but this
 * skill still reports a DISTINCT feedback key for it
 * (wrong_capitalization_and_article) rather than collapsing it into
 * "wrong", since the word itself WAS correctly identified and V1's own
 * feedback text discloses both problems, not a generic "wrong word" message.
 *
 * Beyond what V1 ever did (Migration Plan Phase 2's "preserve V2 tolerance
 * features" goal): opt-in umlaut-alternative and Damerau-Levenshtein typo
 * tolerance, scoped to the WORD comparison only. Never the article: an
 * article is 2-3 letters (der/die/das) — any "typo" tolerance there would
 * just as easily forgive a genuine grammatical confusion between two
 * different, both-real articles, which is not a spelling mistake to excuse.
 * A fuzzy word match short-circuits straight to a flat credit share, with
 * no capitalization/article scrutiny — the same precedent ExactMatchSkill
 * already established (Migration Plan Phase 7): if the word itself wasn't
 * properly formed, judging its declension is secondary.
 */
export class DerivationSkill implements Skill<unknown, DerivationConfig> {
  readonly id = "Derivation";

  evaluate(context: SkillContext<unknown, DerivationConfig>): SkillResult {
    const ref = asDerivationReference(context.expected, this.id);
    const caseSensitive = context.config?.caseSensitive ?? true;
    const acceptUmlautAlternative = context.config?.acceptUmlautAlternative ?? false;
    const fuzzy = context.config?.fuzzy;
    const german = context.utils.german;
    const matcher = context.utils.matcher;

    const normalize = (value: string): string => {
      let v = value.trim();
      if (acceptUmlautAlternative) v = german.normalizeUmlauts(v);
      if (!caseSensitive) v = v.toLowerCase();
      return v;
    };

    const studentWord = answerString(context.answer, "word");
    const studentArticle = answerString(context.answer, "article");

    if (studentWord === "") {
      return wortbildungResult(this.id, 0, context.maxPoints, "vocab.derivation.missing");
    }

    const expectedList = () =>
      ref.accepted.map((entry) => (entry.article ? `${entry.article} ${entry.word}` : entry.word)).join(" / ");

    if (ref.accepted.length === 0) {
      return wortbildungResult(this.id, 0, context.maxPoints, "vocab.derivation.wrong", { expected: "" });
    }

    const normalizedStudentWord = normalize(studentWord);

    const judgeEntry = (entry: { article: string; word: string }): EntryVerdict => {
      const normalizedEntryWord = normalize(entry.word);
      const wordMatches = normalizedStudentWord === normalizedEntryWord;

      if (!wordMatches) {
        if (fuzzy) {
          const closest = matcher.closestMatch(normalizedStudentWord, [normalizedEntryWord]);
          const minSimilarity = fuzzy.minSimilarity ?? DEFAULT_FUZZY_MIN_SIMILARITY;
          if (closest && closest.similarity >= minSimilarity) {
            const creditShare = fuzzy.creditShare ?? DEFAULT_FUZZY_CREDIT_SHARE;
            return {
              score: round2(context.maxPoints * creditShare),
              key: "vocab.derivation.typo",
              params: { closest: entry.word, distance: closest.distance },
              isFullyCorrect: false,
            };
          }
        }
        return { score: 0, key: "vocab.derivation.wrong", isFullyCorrect: false };
      }

      const needsCapital = isUpperCaseFirst(entry.word);
      const capitalOk = !needsCapital || isUpperCaseFirst(studentWord);
      const needsArticle = entry.article.trim() !== "";
      const articleOk = !needsArticle || normalize(studentArticle) === normalize(entry.article);

      let base = WORD_CORRECT_BASE;
      if (!capitalOk) base -= CAPITALIZATION_PENALTY;
      if (!articleOk) base -= ARTICLE_PENALTY;
      base = Math.max(0, base);
      const score = round2((base / WORD_CORRECT_BASE) * context.maxPoints);

      if (capitalOk && articleOk) {
        return { score, key: "vocab.derivation.correct", isFullyCorrect: true };
      }
      if (!capitalOk && !articleOk) {
        return {
          score,
          key: "vocab.derivation.wrong_capitalization_and_article",
          params: { expected: entry.word, expectedArticle: entry.article, gotArticle: studentArticle },
          isFullyCorrect: false,
        };
      }
      if (!capitalOk) {
        return {
          score,
          key: "vocab.derivation.wrong_capitalization",
          params: { expected: entry.word },
          isFullyCorrect: false,
        };
      }
      return {
        score,
        key: "vocab.derivation.wrong_article",
        params: { expected: entry.article, got: studentArticle },
        isFullyCorrect: false,
      };
    };

    let best: EntryVerdict | undefined;
    for (const entry of ref.accepted) {
      const verdict = judgeEntry(entry);
      if (!best || verdict.score > best.score) best = verdict;
      if (verdict.isFullyCorrect) break; // perfect match -- V1 parity: stop searching further entries
    }
    const chosen = best as EntryVerdict;

    if (chosen.key === "vocab.derivation.wrong") {
      return wortbildungResult(this.id, 0, context.maxPoints, "vocab.derivation.wrong", { expected: expectedList() });
    }
    return wortbildungResult(this.id, chosen.score, context.maxPoints, chosen.key, chosen.params);
  }
}
