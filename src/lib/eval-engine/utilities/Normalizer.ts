import type { NormalizeOptions, Normalizer } from "../core/utilities.ts";

/**
 * Default text normalizer. Generic and language-independent — it applies only
 * the transformations a caller explicitly asks for, so a skill can normalize
 * exactly as much as its educational objective allows (and no more).
 */
export class DefaultNormalizer implements Normalizer {
  normalize(input: string, options: NormalizeOptions = {}): string {
    const trim = options.trim ?? true;
    const collapseWhitespace = options.collapseWhitespace ?? true;
    const toLowerCase = options.toLowerCase ?? false;
    const stripTrailingPunctuation = options.stripTrailingPunctuation ?? false;

    let value = input;
    if (trim) value = value.trim();
    if (collapseWhitespace) value = value.replace(/\s+/g, " ");
    if (stripTrailingPunctuation) value = value.replace(/[.!?;:,]+$/u, "").trimEnd();
    if (toLowerCase) value = value.toLowerCase();
    return value;
  }
}
