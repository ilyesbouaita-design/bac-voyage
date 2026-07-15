/**
 * The generalized, transport-agnostic answer model.
 *
 * The engine operates ONLY on these typed objects — never on JSON strings or
 * any wire format. Adapters (e.g. the Lovable frontend) are responsible for
 * parsing/serializing their transport into/out of this model. This lets one
 * model represent simple answers (a single text) and compound answers (named
 * parts) — and future shapes like matching pairs or multi-part writing —
 * without ever touching the Engine, Strategy, or registry machinery.
 */

/** A primitive answer value. */
export type AnswerScalar = string | number | boolean;

/** Any structured answer value: a scalar, a list, or a nested object of values. */
export type AnswerValue = AnswerScalar | readonly AnswerValue[] | { readonly [key: string]: AnswerValue };

/** A simple, single-text answer (e.g. a translation, a transformed sentence). */
export interface TextAnswer {
  readonly kind: "text";
  readonly text: string;
}

/** A compound answer with named parts (e.g. { choice, zitat } or { pairs }). */
export interface CompoundAnswer {
  readonly kind: "compound";
  readonly parts: { readonly [key: string]: AnswerValue };
}

/** A learner answer: either a single text or named parts. */
export type Answer = TextAnswer | CompoundAnswer;

/**
 * What callers may hand to the engine: a bare string (a convenience treated as
 * a TextAnswer) or a fully typed Answer. The pipeline normalizes it to Answer
 * before any skill sees it, so skills always receive the typed model.
 */
export type AnswerInput = string | Answer;

/** Construct a simple text answer. */
export function textAnswer(text: string): TextAnswer {
  return { kind: "text", text };
}

/** Construct a compound answer from named parts. */
export function compoundAnswer(parts: { readonly [key: string]: AnswerValue }): CompoundAnswer {
  return { kind: "compound", parts };
}

/** Normalize any AnswerInput into a canonical Answer. */
export function toAnswer(input: AnswerInput): Answer {
  return typeof input === "string" ? { kind: "text", text: input } : input;
}

/**
 * The primary text of an answer: the text of a TextAnswer, or the "text" part
 * of a CompoundAnswer when present, else "". Text-oriented skills use this and
 * stay oblivious to whether the answer arrived simple or compound.
 */
export function answerText(answer: Answer): string {
  if (answer.kind === "text") return answer.text;
  const value = answer.parts["text"];
  return typeof value === "string" ? value : "";
}

/** Read a named part of an answer, or undefined. */
export function answerField(answer: Answer, name: string): AnswerValue | undefined {
  if (answer.kind === "text") return name === "text" ? answer.text : undefined;
  return answer.parts[name];
}

/** Read a named part as a string ("" if absent or not a string). */
export function answerString(answer: Answer, name: string): string {
  const value = answerField(answer, name);
  return typeof value === "string" ? value : "";
}
