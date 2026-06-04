"use client";

import { useState, useEffect } from "react";

interface RichtigFalschCardProps {
  statements: Array<{
    text: string;
    is_richtig: boolean;
    zitat: string;
    points: number;
  }>;
  onAnswersChange: (
    answers: Array<{
      choice: "richtig" | "falsch" | null;
      zitat: string;
      confirmed: boolean;
    }>
  ) => void;
  showResults?: boolean;
  results?: Array<{
    is_correct: boolean;
    is_partial: boolean;
    feedback: string;
    reference_zitat: string;
    score: number;
  }>;
}

interface AnswerState {
  choice: "richtig" | "falsch" | null;
  zitat: string;
  confirmed: boolean;
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

export function RichtigFalschCard({
  statements,
  onAnswersChange,
  showResults = false,
  results,
}: RichtigFalschCardProps) {
  const [answers, setAnswers] = useState<AnswerState[]>(
    statements.map(() => ({ choice: null, zitat: "", confirmed: false }))
  );
  // Track which cards are in "expanded" (zitat input visible) mode
  const [expanded, setExpanded] = useState<boolean[]>(
    statements.map(() => false)
  );

  const totalPoints = statements.reduce((sum, s) => sum + s.points, 0);

  useEffect(() => {
    onAnswersChange(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  function handleChoice(idx: number, choice: "richtig" | "falsch") {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], choice, confirmed: false };
      return next;
    });
    setExpanded((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  }

  function handleZitatChange(idx: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], zitat: value };
      return next;
    });
  }

  function handleConfirm(idx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], confirmed: true };
      return next;
    });
    setExpanded((prev) => {
      const next = [...prev];
      next[idx] = false;
      return next;
    });
  }

  function handleReopen(idx: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], confirmed: false };
      return next;
    });
    setExpanded((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  }

  function getResultBorderClass(idx: number): string {
    if (!showResults || !results || !results[idx]) return "border-border";
    const r = results[idx];
    if (r.is_correct) return "border-green-500";
    if (r.is_partial) return "border-yellow-400";
    return "border-[#E85D50]";
  }

  function getResultBgClass(idx: number): string {
    if (!showResults || !results || !results[idx]) return "";
    const r = results[idx];
    if (r.is_correct) return "bg-green-50";
    if (r.is_partial) return "bg-yellow-50";
    return "bg-[#E85D50]/5";
  }

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
      style={FONT_STYLE}
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2
          className="font-bold text-brand-violet"
          style={{ ...FONT_STYLE, fontSize: "14px" }}
        >
          Richtig oder Falsch
        </h2>
        <span className="rounded-full bg-brand-violet/10 text-brand-violet px-2 py-0.5 text-xs font-semibold">
          {totalPoints} Pt{totalPoints !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Instructions */}
      <p className="italic text-muted-foreground" style={FONT_STYLE}>
        Sind die folgenden Aussagen richtig oder falsch? Wählen Sie und
        begründen Sie mit einem Zitat aus dem Text.
      </p>

      {/* Statement cards */}
      <div className="space-y-3">
        {statements.map((statement, idx) => {
          const answer = answers[idx];
          const isExpanded = expanded[idx];
          const result = results?.[idx];

          return (
            <div
              key={idx}
              className={`rounded-xl border-2 p-3 transition-colors ${getResultBorderClass(idx)} ${getResultBgClass(idx)}`}
            >
              {/* Statement row */}
              <div className="flex items-start gap-3">
                {/* Number badge */}
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-violet/10 text-brand-violet flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>

                {/* Statement text */}
                <p className="flex-1 font-bold leading-snug" style={FONT_STYLE}>
                  {statement.text}
                </p>

                {/* Points badge */}
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  ({statement.points} Pt)
                </span>
              </div>

              {/* Confirmed compact preview */}
              {answer.confirmed && !isExpanded && !showResults && (
                <button
                  onClick={() => handleReopen(idx)}
                  className="mt-2 ml-9 flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 hover:bg-muted/50 transition-colors w-full text-left"
                  style={FONT_STYLE}
                >
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      answer.choice === "richtig"
                        ? "bg-green-100 text-green-700"
                        : "bg-[#E85D50]/10 text-[#E85D50]"
                    }`}
                  >
                    {answer.choice === "richtig" ? "R" : "F"}
                  </span>
                  <span className="text-muted-foreground truncate" style={FONT_STYLE}>
                    {answer.zitat || "(kein Zitat)"}
                  </span>
                  <span className="ml-auto text-green-600 font-bold">✓</span>
                </button>
              )}

              {/* R/F toggle + zitat section (not confirmed) */}
              {(!answer.confirmed || isExpanded) && !showResults && (
                <div className="mt-2 ml-9 space-y-2">
                  {/* R/F buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChoice(idx, "richtig")}
                      className="transition-colors rounded-xl border font-bold text-xs px-4"
                      style={{
                        height: "40px",
                        backgroundColor:
                          answer.choice === "richtig" ? "#16a34a" : undefined,
                        color:
                          answer.choice === "richtig" ? "#fff" : undefined,
                        borderColor:
                          answer.choice === "richtig" ? "#16a34a" : undefined,
                        ...FONT_STYLE,
                      }}
                    >
                      Richtig
                    </button>
                    <button
                      onClick={() => handleChoice(idx, "falsch")}
                      className="transition-colors rounded-xl border font-bold text-xs px-4"
                      style={{
                        height: "40px",
                        backgroundColor:
                          answer.choice === "falsch" ? "#E85D50" : undefined,
                        color:
                          answer.choice === "falsch" ? "#fff" : undefined,
                        borderColor:
                          answer.choice === "falsch" ? "#E85D50" : undefined,
                        ...FONT_STYLE,
                      }}
                    >
                      Falsch
                    </button>
                  </div>

                  {/* Zitat textarea — slides down when a choice is made */}
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: answer.choice ? "200px" : "0px",
                      opacity: answer.choice ? 1 : 0,
                    }}
                  >
                    <div className="space-y-2 pt-1">
                      <label
                        className="text-muted-foreground"
                        style={FONT_STYLE}
                      >
                        Zitat aus dem Text:
                      </label>
                      <textarea
                        value={answer.zitat}
                        onChange={(e) =>
                          handleZitatChange(idx, e.target.value)
                        }
                        placeholder="Kopieren Sie das passende Zitat hier..."
                        rows={3}
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 resize-none"
                        style={FONT_STYLE}
                      />
                      <button
                        onClick={() => handleConfirm(idx)}
                        disabled={!answer.choice}
                        className="rounded-xl bg-brand-violet text-white px-4 py-1.5 font-bold text-xs hover:opacity-90 transition disabled:opacity-40"
                        style={FONT_STYLE}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results display */}
              {showResults && result && (
                <div className="mt-2 ml-9 space-y-1.5">
                  {/* Chosen answer */}
                  {answer.choice && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          answer.choice === "richtig"
                            ? "bg-green-100 text-green-700"
                            : "bg-[#E85D50]/10 text-[#E85D50]"
                        }`}
                      >
                        {answer.choice === "richtig" ? "Richtig" : "Falsch"}
                      </span>
                      {result.is_correct ? (
                        <span className="text-green-600 font-bold">✓ Korrekt</span>
                      ) : (
                        <span className="text-[#E85D50] font-bold">✗ Falsch</span>
                      )}
                      <span className="ml-auto font-bold text-xs">
                        {result.score}/{statement.points} Pt
                      </span>
                    </div>
                  )}
                  {/* Feedback */}
                  <p className="text-muted-foreground italic" style={FONT_STYLE}>
                    {result.feedback}
                  </p>
                  {/* Reference zitat */}
                  {result.reference_zitat && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <span className="font-bold text-green-700" style={FONT_STYLE}>
                        Musterzitat:{" "}
                      </span>
                      <span className="text-green-800 italic" style={FONT_STYLE}>
                        „{result.reference_zitat}"
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RichtigFalschCard;
