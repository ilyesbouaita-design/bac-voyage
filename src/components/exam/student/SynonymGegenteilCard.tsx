import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SynonymGegenteilCardProps {
  type: "synonym" | "gegenteil";
  sentence: string;
  target_word: string;
  gap_sentence?: string;
  accepted_answers: string[];
  points: number;
  onAnswerChange: (answer: string) => void;
  showResults?: boolean;
  result?: { is_correct: boolean; feedback: string; correct_answer: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FONT = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

/** Splits `sentence` around the first occurrence of `targetWord` and returns
 *  three parts: [before, target, after]. Case-sensitive split. */
function splitSentence(
  sentence: string,
  targetWord: string
): [string, string, string] {
  const idx = sentence.indexOf(targetWord);
  if (idx === -1) return [sentence, "", ""];
  return [
    sentence.slice(0, idx),
    sentence.slice(idx, idx + targetWord.length),
    sentence.slice(idx + targetWord.length),
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SynonymGegenteilCard({
  type,
  sentence,
  target_word,
  gap_sentence,
  accepted_answers,
  points,
  onAnswerChange,
  showResults = false,
  result,
}: SynonymGegenteilCardProps) {
  const [answer, setAnswer] = useState("");

  const isSynonym = type === "synonym";

  const handleChange = (val: string) => {
    setAnswer(val);
    onAnswerChange(val);
  };

  // Determine correctness locally if result is not provided but showResults is true
  const isCorrect =
    result?.is_correct ??
    accepted_answers.some(
      (a) => a.toLowerCase() === answer.trim().toLowerCase()
    );

  const [before, target, after] = splitSentence(sentence, target_word);

  // ---------------------------------------------------------------------------
  // Result state styling
  // ---------------------------------------------------------------------------
  const resultBorder = showResults
    ? isCorrect
      ? "border-green-400"
      : "border-[#FF5A5F]"
    : "border-border";

  const resultRing = showResults
    ? isCorrect
      ? "focus:ring-green-300/40 focus:border-green-400"
      : "focus:ring-[#FF5A5F]/20 focus:border-[#FF5A5F]"
    : "focus:border-[#6C4CE0] focus:ring-[#6C4CE0]/15";

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-3"
      style={FONT}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Type badge */}
        {isSynonym ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#6C4CE0]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C4CE0]">
            Synonyme
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5A5F]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF5A5F]">
            Gegenteil
          </span>
        )}
        {/* Points */}
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>

      {/* ── Instruction ── */}
      <p className="text-[12px] italic text-muted-foreground leading-snug">
        {isSynonym
          ? "Suchen Sie im Text ein Synonym für das unterstrichene Wort."
          : "Finden Sie das Gegenteil des unterstrichenen Wortes und setzen Sie es in den Satz ein."}
      </p>

      {/* ── Source sentence ── */}
      <p className="text-[12px] leading-relaxed">
        {before}
        <span className="underline underline-offset-2 font-medium">
          {target}
        </span>
        {after}
      </p>

      {/* ── Gap sentence (Gegenteil): the sentence itself contains "………" so no separate block needed ── */}

      {/* ── Answer input ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          {isSynonym ? "Ihr Synonym:" : "Ihr Gegenteil:"}
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => handleChange(e.target.value)}
          disabled={showResults}
          placeholder={isSynonym ? "Synonym…" : "Gegenteil…"}
          className={`w-full rounded-xl border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:ring-4 ${resultBorder} ${resultRing} disabled:cursor-default disabled:opacity-80`}
          style={FONT}
        />
      </div>

      {/* ── Result feedback ── */}
      {showResults && (
        <div
          className={`rounded-xl px-3 py-2 text-[12px] flex items-start gap-2 ${
            isCorrect
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/25"
          }`}
        >
          <span className="mt-0.5 shrink-0 text-[13px]">
            {isCorrect ? "✓" : "✗"}
          </span>
          <div className="flex flex-col gap-0.5">
            {result?.feedback && (
              <span>{result.feedback}</span>
            )}
            {!isCorrect && (
              <span>
                Richtige Antwort:{" "}
                <strong>
                  {result?.correct_answer ?? accepted_answers[0]}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SynonymGegenteilCard;
