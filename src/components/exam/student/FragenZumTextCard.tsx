"use client";

import { useState, useEffect, useRef } from "react";

interface FragenZumTextCardProps {
  questions: Array<{
    id: string;
    question: string;
    points: number;
    reference_answer: string;
  }>;
  onAnswersChange: (answers: Record<string, string>) => void;
  showResults?: boolean;
  results?: Record<
    string,
    {
      is_correct: boolean;
      is_partial: boolean;
      feedback: string;
      score: number;
    }
  >;
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.max(60, ref.current.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={3}
      className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 resize-none overflow-hidden disabled:bg-muted/30 disabled:text-muted-foreground"
      style={{ minHeight: "60px", ...FONT_STYLE }}
    />
  );
}

export function FragenZumTextCard({
  questions,
  onAnswersChange,
  showResults = false,
  results,
}: FragenZumTextCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((q) => [q.id, ""]))
  );

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  useEffect(() => {
    onAnswersChange(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  function handleChange(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function getResultBorderClass(id: string): string {
    if (!showResults || !results || !results[id]) return "border-border";
    const r = results[id];
    if (r.is_correct) return "border-green-500";
    if (r.is_partial) return "border-yellow-400";
    return "border-[#E85D50]";
  }

  function getResultBgClass(id: string): string {
    if (!showResults || !results || !results[id]) return "";
    const r = results[id];
    if (r.is_correct) return "bg-green-50";
    if (r.is_partial) return "bg-yellow-50";
    return "bg-[#E85D50]/5";
  }

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
      style={FONT_STYLE}
    >
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <h3
          className="font-bold text-brand-coral"
          style={{ ...FONT_STYLE, fontSize: "13px" }}
        >
          Fragen zum Text
        </h3>
        <span className="rounded-full bg-brand-coral/10 text-brand-coral px-2 py-0.5 text-xs font-semibold">
          {totalPoints} Pt{totalPoints !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const result = results?.[q.id];
          const wordCount = countWords(answers[q.id] || "");

          return (
            <div
              key={q.id}
              className={`rounded-xl border-2 p-3 transition-colors space-y-2 ${getResultBorderClass(q.id)} ${getResultBgClass(q.id)}`}
            >
              {/* Question header */}
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-coral/10 text-brand-coral flex items-center justify-center font-bold text-xs mt-0.5">
                  {idx + 1}
                </span>
                <p className="flex-1 font-bold leading-snug" style={FONT_STYLE}>
                  {q.question}
                </p>
                <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  ({q.points} Pt)
                </span>
              </div>

              {/* Answer textarea */}
              <div className="ml-8 space-y-1">
                <AutoGrowTextarea
                  value={answers[q.id] || ""}
                  onChange={(v) => handleChange(q.id, v)}
                  placeholder="Ihre Antwort..."
                  disabled={showResults}
                />
                {/* Word counter */}
                <p
                  className="text-right text-muted-foreground"
                  style={FONT_STYLE}
                >
                  {wordCount} {wordCount === 1 ? "Wort" : "Wörter"}
                </p>
              </div>

              {/* Results feedback */}
              {showResults && result && (
                <div className="ml-8 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {result.is_correct ? (
                      <span className="text-green-600 font-bold text-xs">
                        ✓ Korrekt
                      </span>
                    ) : result.is_partial ? (
                      <span className="text-yellow-600 font-bold text-xs">
                        ~ Teilweise korrekt
                      </span>
                    ) : (
                      <span className="text-[#E85D50] font-bold text-xs">
                        ✗ Nicht korrekt
                      </span>
                    )}
                    <span className="ml-auto font-bold text-xs">
                      {result.score}/{q.points} Pt
                    </span>
                  </div>

                  {result.feedback && (
                    <p
                      className="text-muted-foreground italic"
                      style={FONT_STYLE}
                    >
                      {result.feedback}
                    </p>
                  )}

                  {/* Reference answer */}
                  <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                    <p
                      className="font-bold text-green-700 mb-0.5"
                      style={FONT_STYLE}
                    >
                      Musterlösung:
                    </p>
                    <p className="text-green-800" style={FONT_STYLE}>
                      {q.reference_answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FragenZumTextCard;
