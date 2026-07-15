import type {
  AuxiliaryLemma,
  FiniteVerbHit,
  GermanLinguistics,
} from "../core/utilities.ts";

// Finite auxiliary forms grouped by lemma (Präsens, Präteritum, Konjunktiv).
const AUXILIARY: ReadonlyArray<[AuxiliaryLemma, string[]]> = [
  ["haben", ["habe", "hast", "hat", "haben", "habt", "hatte", "hattest", "hatten", "hattet", "hätte", "hättest", "hätten", "hättet"]],
  ["sein", ["bin", "bist", "ist", "sind", "seid", "war", "warst", "waren", "wart", "wäre", "wärst", "wären", "wärt", "sei", "seist", "seien"]],
  ["werden", ["werde", "wirst", "wird", "werden", "werdet", "wurde", "wurdest", "wurden", "wurdet", "würde", "würdest", "würden", "würdet"]],
];

// Modal verb forms grouped by lemma.
const MODALS: ReadonlyArray<[string, string[]]> = [
  ["können", ["kann", "kannst", "können", "könnt", "konnte", "konntest", "konnten", "konntet", "könnte", "könntest", "könnten", "könntet"]],
  ["müssen", ["muss", "musst", "müssen", "müsst", "musste", "musstest", "mussten", "musstet", "müsste", "müsstest", "müssten", "müsstet"]],
  ["dürfen", ["darf", "darfst", "dürfen", "dürft", "durfte", "durftest", "durften", "durftet", "dürfte", "dürftest", "dürften", "dürftet"]],
  ["sollen", ["soll", "sollst", "sollen", "sollt", "sollte", "solltest", "sollten", "solltet"]],
  ["wollen", ["will", "willst", "wollen", "wollt", "wollte", "wolltest", "wollten", "wolltet"]],
  ["mögen", ["mag", "magst", "mögen", "mögt", "möchte", "möchtest", "möchten", "möchtet", "mochte", "mochten"]],
];

function buildFormMap(pairs: ReadonlyArray<[string, string[]]>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [lemma, forms] of pairs) {
    for (const form of forms) map.set(form, lemma);
  }
  return map;
}

const AUX_FORMS = buildFormMap(AUXILIARY);
const MODAL_FORMS = buildFormMap(MODALS);

// Strong/prefixed participles the ge-…-(t|en) pattern misses. Intentionally
// small; teacher annotation covers the long tail.
const IRREGULAR_PARTIZIP = new Set<string>([
  "verstanden", "bekommen", "begonnen", "empfohlen", "entschieden", "erhalten",
  "vergessen", "verloren", "verbracht", "besucht", "verkauft", "erklärt",
  "entdeckt", "erzählt", "zerstört", "gewesen", "geworden", "gegangen", "gekommen",
]);

const SURROUNDING_PUNCT = /^[.,;:!?"'»«()[\]]+|[.,;:!?"'»«()[\]]+$/gu;

// Case-preserving ASCII transliteration, the standard German convention
// (the same one printed on German passports/keyboards without umlaut keys).
const UMLAUT_TRANSLITERATION: ReadonlyArray<[RegExp, string]> = [
  [/ä/gu, "ae"],
  [/ö/gu, "oe"],
  [/ü/gu, "ue"],
  [/Ä/gu, "Ae"],
  [/Ö/gu, "Oe"],
  [/Ü/gu, "Ue"],
  [/ß/gu, "ss"],
];

export class DefaultGermanLinguistics implements GermanLinguistics {
  tokenize(sentence: string): string[] {
    return sentence
      .split(/\s+/)
      .map((word) => word.replace(SURROUNDING_PUNCT, ""))
      .filter((word) => word.length > 0);
  }

  classifyAuxiliary(token: string): AuxiliaryLemma | undefined {
    return AUX_FORMS.get(token.toLowerCase()) as AuxiliaryLemma | undefined;
  }

  classifyModal(token: string): string | undefined {
    return MODAL_FORMS.get(token.toLowerCase());
  }

  findFiniteVerb(tokens: readonly string[]): FiniteVerbHit | undefined {
    for (const token of tokens) {
      const auxiliary = this.classifyAuxiliary(token);
      if (auxiliary) return { token, lemma: auxiliary, kind: "auxiliary" };
      const modal = this.classifyModal(token);
      if (modal) return { token, lemma: modal, kind: "modal" };
    }
    return undefined;
  }

  isPartizipII(token: string): boolean {
    const t = token.toLowerCase();
    if (/^ge[a-zäöüß]+(t|en)$/u.test(t)) return true;
    if (/^[a-zäöüß]+iert$/u.test(t)) return true;
    return IRREGULAR_PARTIZIP.has(t);
  }

  stem(word: string): string {
    const lower = word.toLowerCase().trim();
    const participle = lower.match(/^ge(.+?)(t|en)$/u);
    if (participle) return participle[1] ?? lower;
    const iert = lower.match(/^(.+?)iert$/u);
    if (iert) return (iert[1] ?? "") + "ier";
    return lower.replace(/(en|st|et|te|t|e|n)$/u, "");
  }

  normalizeUmlauts(word: string): string {
    let result = word;
    for (const [pattern, replacement] of UMLAUT_TRANSLITERATION) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }
}
