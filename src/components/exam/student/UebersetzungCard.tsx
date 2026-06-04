import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UebersetzungCardProps {
  german_sentence: string;
  accepted_translations: string[];
  points: number;
  onAnswerChange: (answer: string) => void;
  showResults?: boolean;
  result?: {
    is_correct: boolean;
    is_partial: boolean;
    feedback: string;
    score: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FONT = { fontFamily: "'Times New Roman', Georgia, serif" } as const;

type FeedbackLevel = "correct" | "partial" | "incorrect";

function getFeedbackLevel(
  result: UebersetzungCardProps["result"]
): FeedbackLevel {
  if (!result) return "incorrect";
  if (result.is_correct) return "correct";
  if (result.is_partial) return "partial";
  return "incorrect";
}

const FEEDBACK_STYLES: Record<
  FeedbackLevel,
  { container: string; icon: string; label: string }
> = {
  correct: {
    container: "bg-green-50 border-green-200 text-green-700",
    icon: "✓",
    label: "Richtig",
  },
  partial: {
    container: "bg-[#FFB200]/10 border-[#FFB200]/30 text-[#7a5700]",
    icon: "◑",
    label: "Teilweise richtig",
  },
  incorrect: {
    container: "bg-[#FF5A5F]/10 border-[#FF5A5F]/25 text-[#FF5A5F]",
    icon: "✗",
    label: "Falsch",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UebersetzungCard({
  german_sentence,
  accepted_translations,
  points,
  onAnswerChange,
  showResults = false,
  result,
}: UebersetzungCardProps) {
  const [answer, setAnswer] = useState("");

  const handleChange = (val: string) => {
    setAnswer(val);
    onAnswerChange(val);
  };

  const level = getFeedbackLevel(result);
  const fb = FEEDBACK_STYLES[level];

  // Input border/ring states
  const inputBorder = showResults
    ? level === "correct"
      ? "border-green-400"
      : level === "partial"
      ? "border-[#FFB200]"
      : "border-[#FF5A5F]"
    : "border-border";

  const inputRing = showResults
    ? level === "correct"
      ? "focus:ring-green-300/40 focus:border-green-400"
      : level === "partial"
      ? "focus:ring-[#FFB200]/30 focus:border-[#FFB200]"
      : "focus:ring-[#FF5A5F]/20 focus:border-[#FF5A5F]"
    : "focus:border-[#0FB6A3] focus:ring-[#0FB6A3]/15";

  return (
    <div
      className="rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col gap-3"
      style={FONT}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Type badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0FB6A3]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0FB6A3]">
          Traduction → العربية
        </span>
        {/* Points */}
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {points} {points === 1 ? "Punkt" : "Punkte"}
        </span>
      </div>

      {/* ── Instruction ── */}
      <p className="text-[12px] italic text-muted-foreground leading-snug">
        Übersetzen Sie ins Arabische!
      </p>

      {/* ── German sentence box ── */}
      <div className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-border">
        {/* Left teal accent bar + DE badge */}
        <div className="flex flex-col items-center justify-start gap-1 bg-[#0FB6A3]/10 border-r border-[#0FB6A3]/20 px-2 py-2.5 shrink-0">
          <span className="text-[10px] font-bold text-[#0FB6A3] tracking-wider uppercase">
            DE
          </span>
        </div>
        {/* Sentence */}
        <p className="flex-1 px-3 py-2.5 text-[12px] leading-relaxed text-foreground bg-[#0FB6A3]/5">
          {german_sentence}
        </p>
      </div>

      {/* ── RTL Arabic textarea ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Ihre Übersetzung على العربية:
        </label>
        <textarea
          dir="rtl"
          value={answer}
          onChange={(e) => handleChange(e.target.value)}
          disabled={showResults}
          rows={3}
          placeholder="اكتب ترجمتك هنا…"
          className={`w-full rounded-xl border bg-secondary/40 px-3 py-2 text-[12px] text-right outline-none transition focus:ring-4 resize-none leading-relaxed ${inputBorder} ${inputRing} disabled:cursor-default disabled:opacity-80`}
          style={{ ...FONT, direction: "rtl" }}
        />
      </div>

      {/* ── AI correction label ── */}
      <div className="flex items-center gap-1.5 text-[11px] text-[#0FB6A3]">
        <span>🤖</span>
        <span className="font-medium">Correction par IA</span>
        <span className="text-muted-foreground">
          — la réponse sera évaluée automatiquement
        </span>
      </div>

      {/* ── Result feedback ── */}
      {showResults && result && (
        <div
          className={`rounded-xl px-3 py-2.5 text-[12px] border flex flex-col gap-2 ${fb.container}`}
        >
          {/* Status line */}
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-[14px]">{fb.icon}</span>
            <span>{fb.label}</span>
            {result.score !== undefined && (
              <span className="ml-auto tabular-nums text-[11px] font-normal opacity-80">
                {result.score} / {points}
              </span>
            )}
          </div>

          {/* AI feedback */}
          {result.feedback && (
            <p className="leading-relaxed text-[12px] opacity-90">
              {result.feedback}
            </p>
          )}

          {/* Accepted translation comparison */}
          {!result.is_correct && accepted_translations.length > 0 && (
            <div className="border-t border-current/20 pt-2 mt-0.5">
              <p className="text-[11px] opacity-70 mb-1">
                Beispielübersetzung:
              </p>
              <p
                dir="rtl"
                className="text-[12px] text-right leading-relaxed"
                style={{ direction: "rtl" }}
              >
                {accepted_translations[0]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UebersetzungCard;
