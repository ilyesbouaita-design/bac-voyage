import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WortbildungKompositumProps {
  variant: "kompositum_bilden";
  word1: string;
  word2: string;
  result: string;
  points: number;
  onAnswerChange: (answer: string) => void;
  showResults?: boolean;
}

interface WortbildungLoesenProps {
  variant: "kompositum_loesen";
  compound: string;
  word1: string;
  word2: string;
  points: number;
  onAnswersChange: (answers: { word1: string; word2: string }) => void;
  showResults?: boolean;
}

interface WortableitungProps {
  variant: "wortableitung";
  source_type: string;
  target_type: string;
  word: string;
  hint?: string;
  accepted_answers: Array<{ article: string; word: string }>;
  points: number;
  onAnswerChange: (answer: { article: string; word: string }) => void;
  showResults?: boolean;
}

type WortbildungCardProps =
  | WortbildungKompositumProps
  | WortbildungLoesenProps
  | WortableitungProps;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FONT = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function isMatch(userAnswer: string, accepted: string) {
  return normalize(userAnswer) === normalize(accepted);
}

function checkKompositumBilden(answer: string, correct: string) {
  return isMatch(answer, correct);
}

function checkKompositumLoesen(
  answers: { word1: string; word2: string },
  w1: string,
  w2: string
) {
  return isMatch(answers.word1, w1) && isMatch(answers.word2, w2);
}

function checkWortableitung(
  answer: { article: string; word: string },
  accepted: Array<{ article: string; word: string }>
) {
  return accepted.some((a) => {
    const wordOk = isMatch(answer.word, a.word);
    // If accepted answer has no article, ignore article check
    const articleOk = !a.article || isMatch(answer.article, a.article);
    return wordOk && articleOk;
  });
}

/** Extract hint placeholder from hint string like "d……" → show as placeholder prefix */
function hintToPlaceholder(hint?: string): string | undefined {
  if (!hint) return undefined;
  // If first character is a letter, use it as placeholder prefix indicator
  if (/^[a-zA-ZäöüÄÖÜ]/.test(hint)) return hint;
  return undefined;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Shared input styling */
const inputClass = (correct?: boolean, showResults?: boolean) => {
  const base =
    "rounded-xl border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:ring-4 disabled:cursor-default disabled:opacity-80";
  if (!showResults)
    return `${base} border-border focus:border-[#6C4CE0] focus:ring-[#6C4CE0]/15`;
  if (correct)
    return `${base} border-green-400 focus:ring-green-300/40 focus:border-green-400`;
  return `${base} border-[#FF5A5F] focus:ring-[#FF5A5F]/20 focus:border-[#FF5A5F]`;
};

// ── Kompositum Bilden ──────────────────────────────────────────────────────

function KompositumBilden({
  word1,
  word2,
  result,
  points,
  onAnswerChange,
  showResults,
}: WortbildungKompositumProps) {
  const [answer, setAnswer] = useState("");
  const isCorrect = checkKompositumBilden(answer, result);

  const handleChange = (val: string) => {
    setAnswer(val);
    onAnswerChange(val);
  };

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-3"
      style={FONT}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB200]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#7a5700]">
          Kompositum bilden
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>

      {/* Instruction */}
      <p className="text-[12px] italic text-muted-foreground leading-snug">
        Bilden Sie ein Kompositum aus den folgenden zwei Wörtern!
      </p>

      {/* Equation display */}
      <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-4 py-3 text-[12px]">
        <span className="font-medium text-[#6C4CE0]">{word1}</span>
        <span className="text-muted-foreground">+</span>
        <span className="font-medium text-[#6C4CE0]">{word2}</span>
        <span className="text-muted-foreground">=</span>
        <span className="text-muted-foreground italic">?</span>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Ihre Antwort:
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => handleChange(e.target.value)}
          disabled={showResults}
          placeholder="Kompositum…"
          className={`w-full ${inputClass(isCorrect, showResults)}`}
          style={FONT}
        />
      </div>

      {/* Result */}
      {showResults && (
        <ResultBadge
          isCorrect={isCorrect}
          correctAnswer={result}
          userAnswer={answer}
        />
      )}
    </div>
  );
}

// ── Kompositum Lösen ───────────────────────────────────────────────────────

function KompositumLoesen({
  compound,
  word1,
  word2,
  points,
  onAnswersChange,
  showResults,
}: WortbildungLoesenProps) {
  const [answers, setAnswers] = useState({ word1: "", word2: "" });
  const isCorrect = checkKompositumLoesen(answers, word1, word2);
  const isWord1Correct = showResults && isMatch(answers.word1, word1);
  const isWord2Correct = showResults && isMatch(answers.word2, word2);

  const handleChange = (field: "word1" | "word2", val: string) => {
    const next = { ...answers, [field]: val };
    setAnswers(next);
    onAnswersChange(next);
  };

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-3"
      style={FONT}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB200]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#7a5700]">
          Kompositum lösen
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>

      {/* Instruction */}
      <p className="text-[12px] italic text-muted-foreground leading-snug">
        Zerlegen Sie das Kompositum in seine Bestandteile!
      </p>

      {/* Compound display */}
      <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-4 py-3 text-[12px]">
        <span className="font-medium text-[#6C4CE0]">{compound}</span>
        <span className="text-muted-foreground">=</span>
        <span className="text-muted-foreground italic">? + ?</span>
      </div>

      {/* Two inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">
            1. Wort:
          </label>
          <input
            type="text"
            value={answers.word1}
            onChange={(e) => handleChange("word1", e.target.value)}
            disabled={showResults}
            placeholder="Erstes Wort…"
            className={inputClass(isWord1Correct, showResults)}
            style={FONT}
          />
        </div>
        <span className="text-muted-foreground mt-5 text-[14px] shrink-0">
          +
        </span>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">
            2. Wort:
          </label>
          <input
            type="text"
            value={answers.word2}
            onChange={(e) => handleChange("word2", e.target.value)}
            disabled={showResults}
            placeholder="Zweites Wort…"
            className={inputClass(isWord2Correct, showResults)}
            style={FONT}
          />
        </div>
      </div>

      {/* Result */}
      {showResults && (
        <ResultBadge
          isCorrect={isCorrect}
          correctAnswer={`${word1} + ${word2}`}
          userAnswer={`${answers.word1} + ${answers.word2}`}
        />
      )}
    </div>
  );
}

// ── Wortableitung ──────────────────────────────────────────────────────────

function Wortableitung({
  source_type,
  target_type,
  word,
  hint,
  accepted_answers,
  points,
  onAnswerChange,
  showResults,
}: WortableitungProps) {
  const [answer, setAnswer] = useState({ article: "", word: "" });
  const isCorrect = checkWortableitung(answer, accepted_answers);

  const handleChange = (field: "article" | "word", val: string) => {
    const next = { ...answer, [field]: val };
    setAnswer(next);
    onAnswerChange(next);
  };

  const hintPlaceholder = hintToPlaceholder(hint);
  // Does the accepted answer require an article?
  const needsArticle = accepted_answers.some((a) => a.article !== "");

  const inputBorder = showResults
    ? isCorrect
      ? "border-green-400"
      : "border-[#FF5A5F]"
    : "border-border focus:border-[#6C4CE0] focus:ring-[#6C4CE0]/15";

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-3"
      style={FONT}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#6C4CE0]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#6C4CE0]">
          Wortableitung
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>

      {/* Instruction */}
      <p className="text-[12px] italic text-muted-foreground leading-snug">
        Bilden Sie aus diesem{" "}
        <span className="not-italic font-medium text-foreground">
          {source_type}
        </span>{" "}
        das passende{" "}
        <span className="not-italic font-medium text-foreground">
          {target_type}
        </span>
        !
      </p>

      {/* Source word */}
      <div className="rounded-xl bg-[#6C4CE0]/10 px-4 py-2.5 text-[12px] font-medium text-[#6C4CE0] inline-self">
        {word}
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-[12px] text-muted-foreground">
          Hilfe:{" "}
          <span className="font-medium text-foreground italic">{hint}</span>
        </p>
      )}

      {/* Article + Word inputs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Ihre Ableitung {needsArticle && "(Artikel + Wort)"}:
        </label>
        <div className="flex items-center gap-2">
          {/* Article input – only shown if answer requires article */}
          {needsArticle && (
            <input
              type="text"
              value={answer.article}
              onChange={(e) => handleChange("article", e.target.value)}
              disabled={showResults}
              placeholder="Art."
              className={`rounded-xl border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:ring-4 disabled:cursor-default disabled:opacity-80 ${inputBorder}`}
              style={{ ...FONT, width: 60 }}
            />
          )}
          {/* Word input */}
          <input
            type="text"
            value={answer.word}
            onChange={(e) => handleChange("word", e.target.value)}
            disabled={showResults}
            placeholder={
              hintPlaceholder ? `${hintPlaceholder}…` : `${target_type}…`
            }
            className={`flex-1 rounded-xl border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:ring-4 disabled:cursor-default disabled:opacity-80 ${inputBorder}`}
            style={FONT}
          />
        </div>
      </div>

      {/* Result */}
      {showResults && (
        <ResultBadge
          isCorrect={isCorrect}
          correctAnswer={accepted_answers
            .map((a) => (a.article ? `${a.article} ${a.word}` : a.word))
            .join(" / ")}
          userAnswer={[answer.article, answer.word].filter(Boolean).join(" ")}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared result badge
// ---------------------------------------------------------------------------

function ResultBadge({
  isCorrect,
  correctAnswer,
  userAnswer,
}: {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-[12px] flex items-start gap-2 border ${
        isCorrect
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-[#FF5A5F]/10 text-[#FF5A5F] border-[#FF5A5F]/25"
      }`}
    >
      <span className="mt-0.5 shrink-0 text-[13px]">
        {isCorrect ? "✓" : "✗"}
      </span>
      <div className="flex flex-col gap-0.5">
        {isCorrect ? (
          <span>Richtig!</span>
        ) : (
          <>
            <span>
              Falsch. Richtige Antwort:{" "}
              <strong>{correctAnswer}</strong>
            </span>
            {userAnswer && (
              <span className="opacity-70">
                Ihre Antwort: {userAnswer}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export – routes to correct variant
// ---------------------------------------------------------------------------

export function WortbildungCard(props: WortbildungCardProps) {
  if (props.variant === "kompositum_bilden") {
    return <KompositumBilden {...props} />;
  }
  if (props.variant === "kompositum_loesen") {
    return <KompositumLoesen {...props} />;
  }
  return <Wortableitung {...props} />;
}

export default WortbildungCard;
