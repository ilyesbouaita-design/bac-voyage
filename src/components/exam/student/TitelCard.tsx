"use client";

import { useState, useEffect } from "react";

interface TitelCardProps {
  accepted_titles: string[];
  onAnswerChange: (answer: string) => void;
  showResults?: boolean;
  result?: {
    is_correct: boolean;
    feedback: string;
    score: number;
  };
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

export function TitelCard({
  accepted_titles,
  onAnswerChange,
  showResults = false,
  result,
}: TitelCardProps) {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    onAnswerChange(answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  const isAccepted = result?.is_correct ?? false;

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
      style={FONT_STYLE}
    >
      {/* Sub-header */}
      <h3
        className="font-bold text-brand-violet"
        style={{ ...FONT_STYLE, fontSize: "13px" }}
      >
        Geben Sie dem Text einen Titel!
      </h3>

      {/* Instruction */}
      <p className="italic text-muted-foreground" style={FONT_STYLE}>
        Donnez un titre approprié au texte.
      </p>

      {/* Centered prominent input */}
      <div className="flex flex-col items-center gap-3 py-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={showResults}
          placeholder="Ihr Titel..."
          className="w-full max-w-md text-center rounded-xl border-b-2 border-x-0 border-t-0 px-4 py-2 outline-none transition bg-transparent
            focus:border-[#6C4CE0] focus:ring-0
            disabled:text-muted-foreground disabled:cursor-default"
          style={{
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: "13px",
            borderBottomColor: showResults
              ? isAccepted
                ? "#16a34a"
                : "#E85D50"
              : "#6C4CE0",
            borderBottomWidth: "2px",
          }}
        />
        {!showResults && answer.trim() && (
          <p
            className="text-muted-foreground text-center"
            style={FONT_STYLE}
          >
            {answer.trim().split(/\s+/).length}{" "}
            {answer.trim().split(/\s+/).length === 1 ? "Wort" : "Wörter"}
          </p>
        )}
      </div>

      {/* Results feedback */}
      {showResults && result && (
        <div
          className={`rounded-xl border px-4 py-3 space-y-1.5 ${
            isAccepted
              ? "bg-green-50 border-green-300"
              : "bg-[#E85D50]/5 border-[#E85D50]/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {isAccepted ? (
              <span className="font-bold text-green-700" style={FONT_STYLE}>
                ✓ Akzeptiert
              </span>
            ) : (
              <span className="font-bold text-[#E85D50]" style={FONT_STYLE}>
                ✗ Nicht akzeptiert
              </span>
            )}
            <span
              className={`ml-auto font-bold text-xs ${
                isAccepted ? "text-green-700" : "text-[#E85D50]"
              }`}
            >
              {result.score} Pt
            </span>
          </div>

          {result.feedback && (
            <p className="italic text-muted-foreground" style={FONT_STYLE}>
              {result.feedback}
            </p>
          )}

          {/* Show accepted title examples if wrong */}
          {!isAccepted && accepted_titles.length > 0 && (
            <div className="pt-1">
              <p className="font-bold text-green-700 mb-1" style={FONT_STYLE}>
                Mögliche Titel:
              </p>
              <ul className="space-y-0.5">
                {accepted_titles.slice(0, 3).map((t, i) => (
                  <li
                    key={i}
                    className="text-green-800 italic"
                    style={FONT_STYLE}
                  >
                    • {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TitelCard;
