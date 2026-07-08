// =============================================================================
// german-morphology.ts
// Bundled, dependency-free German morphology helpers for offline grading.
//
// Provides:
//   - GERMAN_IRREGULAR_VERBS  : conjugated-form -> infinitive lookup map
//   - getVerbRoot(form)       : returns the infinitive for any known form
//   - stemDE(word)            : German Snowball-style stemmer (no npm dep)
//   - normalizeDE(text)       : lowercase / trim / collapse / de-punctuate / stem
//   - isGermanWord(word, set) : membership check against a frequency list
//
// Everything here runs entirely in the browser with zero external packages.
// =============================================================================

// ---------------------------------------------------------------------------
// Irregular verb conjugation tables
// ---------------------------------------------------------------------------
// Each entry maps a fully conjugated (irregular) form back to its infinitive.
// Coverage focuses on the ~100 most common strong / irregular verbs a student
// meets in the Bac: present (du/er stem changes), Präteritum, Perfekt participle
// and common subjunctive II forms. Regular verbs are handled by stemDE().
//
// NOTE: keys are lowercase so lookups should lowercase the input first.
export const GERMAN_IRREGULAR_VERBS: Record<string, string> = {
  // --- sein ---
  bin: "sein", bist: "sein", ist: "sein", sind: "sein", seid: "sein",
  war: "sein", warst: "sein", waren: "sein", wart: "sein",
  gewesen: "sein", sei: "sein", seien: "sein", wäre: "sein", wären: "sein",
  waer: "sein", waere: "sein", waeren: "sein",

  // --- haben ---
  habe: "haben", hast: "haben", hat: "haben", habt: "haben",
  hatte: "haben", hattest: "haben", hatten: "haben", hattet: "haben",
  gehabt: "haben", hätte: "haben", hätten: "haben", haette: "haben", haetten: "haben",

  // --- werden ---
  werde: "werden", wirst: "werden", wird: "werden", werdet: "werden",
  wurde: "werden", wurdest: "werden", wurden: "werden", wurdet: "werden",
  ward: "werden", geworden: "werden", worden: "werden",
  würde: "werden", würden: "werden", wuerde: "werden", wuerden: "werden",

  // --- gehen ---
  gehe: "gehen", gehst: "gehen", geht: "gehen",
  ging: "gehen", gingst: "gehen", gingen: "gehen", gingt: "gehen",
  gegangen: "gehen", ginge: "gehen",

  // --- kommen ---
  komme: "kommen", kommst: "kommen", kommt: "kommen",
  kam: "kommen", kamst: "kommen", kamen: "kommen", kamt: "kommen",
  gekommen: "kommen", käme: "kommen", kaeme: "kommen",

  // --- laufen ---
  laufe: "laufen", läufst: "laufen", läuft: "laufen", laeufst: "laufen", laeuft: "laufen",
  lief: "laufen", liefst: "laufen", liefen: "laufen", lieft: "laufen",
  gelaufen: "laufen", liefe: "laufen",

  // --- fahren ---
  fahre: "fahren", fährst: "fahren", fährt: "fahren", faehrst: "fahren", faehrt: "fahren",
  fuhr: "fahren", fuhrst: "fahren", fuhren: "fahren", fuhrt: "fahren",
  gefahren: "fahren", führe: "fahren", fuehre: "fahren",

  // --- sehen ---
  sehe: "sehen", siehst: "sehen", sieht: "sehen",
  sah: "sehen", sahst: "sehen", sahen: "sehen", saht: "sehen",
  gesehen: "sehen", sähe: "sehen", saehe: "sehen",

  // --- geben ---
  gebe: "geben", gibst: "geben", gibt: "geben",
  gab: "geben", gabst: "geben", gaben: "geben", gabt: "geben",
  gegeben: "geben", gäbe: "geben", gaebe: "geben",

  // --- nehmen ---
  nehme: "nehmen", nimmst: "nehmen", nimmt: "nehmen",
  nahm: "nehmen", nahmst: "nehmen", nahmen: "nehmen", nahmt: "nehmen",
  genommen: "nehmen", nähme: "nehmen", naehme: "nehmen",

  // --- essen ---
  esse: "essen", isst: "essen", esst: "essen",
  aß: "essen", ass: "essen", aßen: "essen", assen: "essen", aßt: "essen",
  gegessen: "essen", äße: "essen",

  // --- trinken ---
  trinke: "trinken", trinkst: "trinken", trinkt: "trinken",
  trank: "trinken", trankst: "trinken", tranken: "trinken", trankt: "trinken",
  getrunken: "trinken", tränke: "trinken",

  // --- sprechen ---
  spreche: "sprechen", sprichst: "sprechen", spricht: "sprechen",
  sprach: "sprechen", sprachst: "sprechen", sprachen: "sprechen", spracht: "sprechen",
  gesprochen: "sprechen", spräche: "sprechen", spraeche: "sprechen",

  // --- treffen ---
  treffe: "treffen", triffst: "treffen", trifft: "treffen",
  traf: "treffen", trafst: "treffen", trafen: "treffen", traft: "treffen",
  getroffen: "treffen", träfe: "treffen",

  // --- helfen ---
  helfe: "helfen", hilfst: "helfen", hilft: "helfen",
  half: "helfen", halfst: "helfen", halfen: "helfen", halft: "helfen",
  geholfen: "helfen", hülfe: "helfen",

  // --- nehmen/geben covered; --- lesen ---
  lese: "lesen", liest: "lesen", lest: "lesen",
  las: "lesen", lasen: "lesen",
  gelesen: "lesen", läse: "lesen",

  // --- schreiben ---
  schreibe: "schreiben", schreibst: "schreiben", schreibt: "schreiben",
  schrieb: "schreiben", schriebst: "schreiben", schrieben: "schreiben", schriebt: "schreiben",
  geschrieben: "schreiben", schriebe: "schreiben",

  // --- bleiben ---
  bleibe: "bleiben", bleibst: "bleiben", bleibt: "bleiben",
  blieb: "bleiben", bliebst: "bleiben", blieben: "bleiben", bliebt: "bleiben",
  geblieben: "bleiben", bliebe: "bleiben",

  // --- steigen ---
  steige: "steigen", steigst: "steigen", steigt: "steigen",
  stieg: "steigen", stiegst: "steigen", stiegen: "steigen", stiegt: "steigen",
  gestiegen: "steigen", stiege: "steigen",

  // --- fliegen ---
  fliege: "fliegen", fliegst: "fliegen", fliegt: "fliegen",
  flog: "fliegen", flogst: "fliegen", flogen: "fliegen", flogt: "fliegen",
  geflogen: "fliegen", flöge: "fliegen", floege: "fliegen",

  // --- ziehen ---
  ziehe: "ziehen", ziehst: "ziehen", zieht: "ziehen",
  zog: "ziehen", zogst: "ziehen", zogen: "ziehen", zogt: "ziehen",
  gezogen: "ziehen", zöge: "ziehen", zoege: "ziehen",

  // --- schließen ---
  schließe: "schließen", schließt: "schließen", schliesse: "schließen", schliesst: "schließen",
  schloss: "schließen", schloß: "schließen", schlossen: "schließen",
  geschlossen: "schließen", schlösse: "schließen",

  // --- verlieren ---
  verliere: "verlieren", verlierst: "verlieren", verliert: "verlieren",
  verlor: "verlieren", verlorst: "verlieren", verloren: "verlieren", verlort: "verlieren",
  verlöre: "verlieren", verloere: "verlieren",

  // --- finden ---
  finde: "finden", findest: "finden", findet: "finden",
  fand: "finden", fandst: "finden", fanden: "finden", fandet: "finden",
  gefunden: "finden", fände: "finden", faende: "finden",

  // --- binden / singen / trinken family (ng/nd verbs) ---
  binde: "binden", bindet: "binden", band: "binden", banden: "binden", gebunden: "binden",
  singe: "singen", singt: "singen", sang: "singen", sangen: "singen", gesungen: "singen",
  springe: "springen", springt: "springen", sprang: "springen", sprangen: "springen", gesprungen: "springen",
  gewinne: "gewinnen", gewinnt: "gewinnen", gewann: "gewinnen", gewannen: "gewinnen", gewonnen: "gewinnen",
  beginne: "beginnen", beginnt: "beginnen", begann: "beginnen", begannen: "beginnen", begonnen: "beginnen",
  schwimme: "schwimmen", schwimmt: "schwimmen", schwamm: "schwimmen", schwammen: "schwimmen", geschwommen: "schwimmen",

  // --- stehen ---
  stehe: "stehen", stehst: "stehen", steht: "stehen",
  stand: "stehen", standst: "stehen", standen: "stehen", standet: "stehen",
  gestanden: "stehen", stünde: "stehen", stuende: "stehen", stände: "stehen",

  // --- verstehen ---
  verstehe: "verstehen", verstehst: "verstehen", versteht: "verstehen",
  verstand: "verstehen", verstanden: "verstehen",

  // --- tun ---
  tue: "tun", tust: "tun", tut: "tun",
  tat: "tun", tatst: "tun", taten: "tun", tatet: "tun", getan: "tun", täte: "tun",

  // --- bringen ---
  bringe: "bringen", bringst: "bringen", bringt: "bringen",
  brachte: "bringen", brachtest: "bringen", brachten: "bringen", gebracht: "bringen", brächte: "bringen",

  // --- denken ---
  denke: "denken", denkst: "denken", denkt: "denken",
  dachte: "denken", dachtest: "denken", dachten: "denken", gedacht: "denken", dächte: "denken", daechte: "denken",

  // --- kennen ---
  kenne: "kennen", kennst: "kennen", kennt: "kennen",
  kannte: "kennen", kanntest: "kennen", kannten: "kennen", gekannt: "kennen",

  // --- nennen ---
  nenne: "nennen", nennt: "nennen", nannte: "nennen", nannten: "nennen", genannt: "nennen",

  // --- rennen ---
  renne: "rennen", rennt: "rennen", rannte: "rennen", rannten: "rennen", gerannt: "rennen",

  // --- wissen ---
  weiß: "wissen", weiss: "wissen", weißt: "wissen", weisst: "wissen", wisst: "wissen",
  wusste: "wissen", wusstest: "wissen", wussten: "wissen", gewusst: "wissen", wüsste: "wissen", wuesste: "wissen",

  // --- modal verbs: können ---
  kann: "können", kannst: "können", könnt: "können", koennt: "können",
  konnte: "können", konntest: "können", konnten: "können", gekonnt: "können",
  könne: "können", könnte: "können", könnten: "können", koennte: "können", koennten: "können",

  // --- müssen ---
  muss: "müssen", muß: "müssen", musst: "müssen", müsst: "müssen", muesst: "müssen",
  musste: "müssen", musstest: "müssen", mussten: "müssen", gemusst: "müssen",
  müsse: "müssen", müsste: "müssen", müssten: "müssen", muesste: "müssen",

  // --- dürfen ---
  darf: "dürfen", darfst: "dürfen", dürft: "dürfen", duerft: "dürfen",
  durfte: "dürfen", durftest: "dürfen", durften: "dürfen", gedurft: "dürfen",
  dürfe: "dürfen", dürfte: "dürfen", dürften: "dürfen", duerfte: "dürfen",

  // --- sollen ---
  soll: "sollen", sollst: "sollen", sollt: "sollen",
  sollte: "sollen", solltest: "sollen", sollten: "sollen", gesollt: "sollen",

  // --- wollen ---
  will: "wollen", willst: "wollen", wollt: "wollen",
  wollte: "wollen", wolltest: "wollen", wollten: "wollen", gewollt: "wollen",

  // --- mögen ---
  mag: "mögen", magst: "mögen", mögt: "mögen", moegt: "mögen",
  mochte: "mögen", mochtest: "mögen", mochten: "mögen", gemocht: "mögen",
  möge: "mögen", möchte: "mögen", möchten: "mögen", moechte: "mögen", moechten: "mögen",

  // --- schlafen ---
  schlafe: "schlafen", schläfst: "schlafen", schläft: "schlafen", schlaeft: "schlafen",
  schlief: "schlafen", schliefst: "schlafen", schliefen: "schlafen", geschlafen: "schlafen",

  // --- tragen ---
  trage: "tragen", trägst: "tragen", trägt: "tragen", traegt: "tragen",
  trug: "tragen", trugst: "tragen", trugen: "tragen", getragen: "tragen", trüge: "tragen",

  // --- schlagen ---
  schlage: "schlagen", schlägst: "schlagen", schlägt: "schlagen", schlaegt: "schlagen",
  schlug: "schlagen", schlugst: "schlagen", schlugen: "schlagen", geschlagen: "schlagen",

  // --- wachsen ---
  wachse: "wachsen", wächst: "wachsen", waechst: "wachsen",
  wuchs: "wachsen", wuchsen: "wachsen", gewachsen: "wachsen",

  // --- waschen ---
  wasche: "waschen", wäschst: "waschen", wäscht: "waschen", waescht: "waschen",
  wusch: "waschen", wuschen: "waschen", gewaschen: "waschen",

  // --- halten ---
  halte: "halten", hältst: "halten", hält: "halten", haelt: "halten",
  hielt: "halten", hieltst: "halten", hielten: "halten", gehalten: "halten", hielte: "halten",

  // --- fallen ---
  falle: "fallen", fällst: "fallen", fällt: "fallen", faellt: "fallen",
  fiel: "fallen", fielst: "fallen", fielen: "fallen", gefallen: "fallen", fiele: "fallen",

  // --- gefallen ---
  gefällt: "gefallen", gefaellt: "gefallen", gefiel: "gefallen", gefielen: "gefallen",

  // --- lassen ---
  lasse: "lassen", lässt: "lassen", laesst: "lassen", lasst: "lassen",
  ließ: "lassen", liess: "lassen", ließen: "lassen", liessen: "lassen",
  gelassen: "lassen", ließe: "lassen",

  // --- fangen / anfangen ---
  fange: "fangen", fängst: "fangen", fängt: "fangen", faengt: "fangen",
  fing: "fangen", fingst: "fangen", fingen: "fangen", gefangen: "fangen",
  "fängt an": "anfangen", "fing an": "anfangen", angefangen: "anfangen",

  // --- rufen ---
  rufe: "rufen", rufst: "rufen", ruft: "rufen",
  rief: "rufen", riefst: "rufen", riefen: "rufen", gerufen: "rufen", riefe: "rufen",

  // --- schneiden ---
  schneide: "schneiden", schneidet: "schneiden",
  schnitt: "schneiden", schnitten: "schneiden", geschnitten: "schneiden",

  // --- greifen ---
  greife: "greifen", greift: "greifen", griff: "greifen", griffen: "greifen", gegriffen: "greifen",

  // --- pfeifen ---
  pfeife: "pfeifen", pfiff: "pfeifen", pfiffen: "pfeifen", gepfiffen: "pfeifen",

  // --- leiden ---
  leide: "leiden", litt: "leiden", litten: "leiden", gelitten: "leiden",

  // --- reiten ---
  reite: "reiten", ritt: "reiten", ritten: "reiten", geritten: "reiten",

  // --- streiten ---
  streite: "streiten", stritt: "streiten", stritten: "streiten", gestritten: "streiten",

  // --- bitten ---
  bitte: "bitten", bat: "bitten", baten: "bitten", gebeten: "bitten", bäte: "bitten",

  // --- liegen ---
  liege: "liegen", liegst: "liegen", liegt: "liegen",
  lag: "liegen", lagst: "liegen", lagen: "liegen", gelegen: "liegen", läge: "liegen",

  // --- sitzen ---
  sitze: "sitzen", sitzt: "sitzen",
  saß: "sitzen", sass: "sitzen", saßen: "sitzen", sassen: "sitzen", gesessen: "sitzen", säße: "sitzen",

  // --- werfen ---
  werfe: "werfen", wirfst: "werfen", wirft: "werfen",
  warf: "werfen", warfst: "werfen", warfen: "werfen", geworfen: "werfen", würfe: "werfen",

  // --- sterben ---
  sterbe: "sterben", stirbst: "sterben", stirbt: "sterben",
  starb: "sterben", starben: "sterben", gestorben: "sterben", stürbe: "sterben",

  // --- brechen ---
  breche: "brechen", brichst: "brechen", bricht: "brechen",
  brach: "brechen", brachen: "brechen", gebrochen: "brechen",

  // --- empfehlen ---
  empfehle: "empfehlen", empfiehlst: "empfehlen", empfiehlt: "empfehlen",
  empfahl: "empfehlen", empfahlen: "empfehlen", empfohlen: "empfehlen",

  // --- vergessen ---
  vergesse: "vergessen", vergisst: "vergessen", vergißt: "vergessen",
  vergaß: "vergessen", vergass: "vergessen", vergaßen: "vergessen", vergessen_pp: "vergessen",

  // --- geschehen ---
  geschieht: "geschehen", geschah: "geschehen", geschahen: "geschehen", geschehen_pp: "geschehen",

  // --- heißen ---
  heiße: "heißen", heiss: "heißen", heißt: "heißen", heisst: "heißen",
  hieß: "heißen", hiess: "heißen", hießen: "heißen", geheißen: "heißen",

  // --- rufen/schreien ---
  schreie: "schreien", schreit: "schreien", schrie: "schreien", schrien: "schreien", geschrien: "schreien",

  // --- fließen ---
  fließe: "fließen", fließt: "fließen", floss: "fließen", floß: "fließen", flossen: "fließen", geflossen: "fließen",

  // --- genießen ---
  genieße: "genießen", genießt: "genießen", genoss: "genießen", genossen: "genießen",

  // --- schießen ---
  schieße: "schießen", schießt: "schießen", schoss: "schießen", schossen: "schießen", geschossen: "schießen",

  // --- biegen ---
  biege: "biegen", biegt: "biegen", bog: "biegen", bogen: "biegen", gebogen: "biegen",

  // --- bieten ---
  biete: "bieten", bietet: "bieten", bot: "bieten", boten: "bieten", geboten: "bieten",

  // --- wiegen ---
  wiege: "wiegen", wiegt: "wiegen", wog: "wiegen", wogen: "wiegen", gewogen: "wiegen",

  // --- riechen ---
  rieche: "riechen", riecht: "riechen", roch: "riechen", rochen: "riechen", gerochen: "riechen",
};

// ---------------------------------------------------------------------------
// Umlaut normalization used internally by the stemmer / lookups.
// (This one expands umlauts to their letter form: ä→a, not ä→ae.)
// ---------------------------------------------------------------------------
function collapseUmlauts(word: string): string {
  return word
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

// ---------------------------------------------------------------------------
// getVerbRoot: conjugated form -> infinitive
// ---------------------------------------------------------------------------
/**
 * Return the infinitive of a (possibly) conjugated German verb form.
 * Looks up the irregular table first; if not found, applies light regular
 * de-conjugation heuristics. Falls back to the original (lowercased) form.
 */
export function getVerbRoot(form: string): string {
  if (!form) return "";
  const raw = form.trim().toLowerCase();

  // 1. direct irregular lookup
  if (GERMAN_IRREGULAR_VERBS[raw]) return GERMAN_IRREGULAR_VERBS[raw];

  // 2. strip a leading "ge-" ... "-t/-en" participle wrapper for regular verbs
  //    gemacht -> mach -> machen ; gespielt -> spiel -> spielen
  const ppMatch = raw.match(/^ge(.+?)(t|et|en)$/);
  if (ppMatch) {
    const core = ppMatch[1];
    if (core.length >= 3) return core + "en";
  }

  // 3. regular present/preterite endings -> infinitive stem + "en"
  //    machst/macht/machte/machten/mache -> mach -> machen
  const regEnd = raw.match(/^(.*?)(est|test|test|ten|tet|te|st|et|en|t|e)$/);
  if (regEnd && regEnd[1].length >= 3) {
    const stem = regEnd[1];
    // already an infinitive?
    if (raw.endsWith("en")) return raw;
    return stem + "en";
  }

  // 4. give up: return as-is
  return raw;
}

// ---------------------------------------------------------------------------
// stemDE: German Snowball-style stemmer (direct implementation)
// ---------------------------------------------------------------------------
const MIN_STEM = 3;

/**
 * Lightweight German stemmer implementing the core of the Snowball "german"
 * algorithm without any npm dependency.
 *
 *   1. umlaut / ß substitution
 *   2. remove derivational suffixes (-heit, -keit, -igkeit, -lich, -isch, -ung, -est)
 *   3. remove inflectional suffixes (-em, -ern, -er, -en, -es, -e, -s) in order,
 *      each only when the resulting stem stays >= MIN_STEM chars.
 */
export function stemDE(word: string): string {
  if (!word) return "";
  let w = word.toLowerCase().trim();
  if (w.length <= MIN_STEM) return collapseUmlauts(w);

  // 1. umlaut substitution (Snowball step: ä→a, ö→o, ü→u, ß→ss)
  w = collapseUmlauts(w);

  // 2. derivational suffixes (longest first). Snowball step 3 subset.
  //    -igkeit before -keit/-heit; -lich / -isch; -ung; -est.
  const derivational = ["igkeit", "lichkeit", "keit", "heit", "lich", "isch", "ung", "est"];
  for (const suf of derivational) {
    if (w.endsWith(suf) && w.length - suf.length >= MIN_STEM) {
      w = w.slice(0, w.length - suf.length);
      break; // one derivational strip per pass, mirroring Snowball
    }
  }

  // 3. inflectional suffixes in the prescribed order.
  //    order matters: try the longer/rarer forms before shorter ones.
  const inflectional = ["ern", "em", "er", "en", "es", "e", "s"];
  for (const suf of inflectional) {
    if (w.endsWith(suf) && w.length - suf.length >= MIN_STEM) {
      // -s only valid after s-,t-,... (Snowball: valid s-ending). We keep it
      // simple: allow -s removal generally but guard min length.
      w = w.slice(0, w.length - suf.length);
      break;
    }
  }

  return w;
}

// ---------------------------------------------------------------------------
// normalizeDE
// ---------------------------------------------------------------------------
/**
 * Full normalization pipeline for token-level comparison:
 *   lowercase -> trim -> collapse whitespace -> strip punctuation -> stem each token
 * Returns a space-joined string of stemmed tokens.
 */
export function normalizeDE(text: string): string {
  if (!text) return "";
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    // strip punctuation but keep umlauts, ß and letters/digits
    .replace(/[.,;:!?"'«»„“”()\[\]{}<>…\/\\|@#$%^&*+=~`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((tok) => stemDE(tok))
    .join(" ")
    .trim();
}

// ---------------------------------------------------------------------------
// isGermanWord
// ---------------------------------------------------------------------------
/**
 * Check whether a word is a plausible German word by testing it (and its stem
 * / verb root) against a supplied frequency list.
 */
export function isGermanWord(word: string, frequencyList: Set<string>): boolean {
  if (!word) return false;
  const lower = word.toLowerCase().trim();
  if (frequencyList.has(lower)) return true;
  const stem = stemDE(lower);
  if (frequencyList.has(stem)) return true;
  const root = getVerbRoot(lower);
  if (frequencyList.has(root)) return true;
  return false;
}

// ---------------------------------------------------------------------------
export default {
  GERMAN_IRREGULAR_VERBS,
  getVerbRoot,
  stemDE,
  normalizeDE,
  isGermanWord,
};
