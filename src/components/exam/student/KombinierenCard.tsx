"use client";

import { useState, useEffect } from "react";

interface KombinierenCardProps {
  left_items: Array<{ label: string; text: string }>;
  right_items: Array<{ label: string; text: string }>;
  answer_key: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  showResults?: boolean;
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

export default function KombinierenCard({
  left_items,
  right_items,
  answer_key,
  onAnswersChange,
  showResults = false,
}: KombinierenCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(left_items.map((item) => [item.label, ""]))
  );

  useEffect(() => {
    onAnswersChange(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  function handleSelect(leftLabel: string, rightLabel: string) {
    setAnswers((prev) => ({ ...prev, [leftLabel]: rightLabel }));
  }

  function isCorrect(leftLabel: string): boolean {
    return answers[leftLabel] === answer_key[leftLabel];
  }

  function getCellClass(leftLabel: string): string {
    if (!showResults) return "";
    return isCorrect(leftLabel)
      ? "bg-green-50 text-green-800"
      : "bg-[#E85D50]/10 text-[#E85D50]";
  }

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
      style={FONT_STYLE}
    >
      {/* Sub-header */}
      <h3
        className="font-bold text-brand-gold"
        style={{ ...FONT_STYLE, fontSize: "13px" }}
      >
        Was passt zusammen?
      </h3>

      {/* Two-column display */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          <p
            className="font-bold text-muted-foreground uppercase tracking-wide"
            style={{ ...FONT_STYLE, fontSize: "10px" }}
          >
            Linke Spalte
          </p>
          {left_items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-2 rounded-xl border px-3 py-2 bg-brand-gold/5"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-xs">
                {item.label}
              </span>
              <p style={FONT_STYLE}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <p
            className="font-bold text-muted-foreground uppercase tracking-wide"
            style={{ ...FONT_STYLE, fontSize: "10px" }}
          >
            Rechte Spalte
          </p>
          {right_items.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-2 rounded-xl border px-3 py-2 bg-muted/30"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                {item.label}
              </span>
              <p style={FONT_STYLE}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Answer table */}
      <div>
        <p
          className="font-bold text-muted-foreground mb-2"
          style={FONT_STYLE}
        >
          Ihre Zuordnung:
        </p>
        <table className="w-full border-collapse" style={FONT_STYLE}>
          <thead>
            <tr>
              <th
                className="border border-border px-3 py-2 text-left bg-muted/30 font-bold"
                style={FONT_STYLE}
              >
                Buchstabe
              </th>
              <th
                className="border border-border px-3 py-2 text-left bg-muted/30 font-bold"
                style={FONT_STYLE}
              >
                Zugeordnete Nummer
              </th>
              {showResults && (
                <th
                  className="border border-border px-3 py-2 text-left bg-muted/30 font-bold"
                  style={FONT_STYLE}
                >
                  Richtige Antwort
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {left_items.map((item) => (
              <tr key={item.label}>
                {/* Letter cell */}
                <td
                  className="border border-border px-3 py-2 font-bold text-brand-gold"
                  style={FONT_STYLE}
                >
                  {item.label}
                </td>

                {/* Dropdown cell */}
                <td
                  className={`border border-border px-3 py-2 ${getCellClass(item.label)}`}
                >
                  {showResults ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold"
                        style={FONT_STYLE}
                      >
                        {answers[item.label] || "–"}
                      </span>
                      {isCorrect(item.label) ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-[#E85D50] font-bold">✗</span>
                      )}
                    </div>
                  ) : (
                    <select
                      value={answers[item.label] || ""}
                      onChange={(e) => handleSelect(item.label, e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 bg-background"
                      style={FONT_STYLE}
                    >
                      <option value="">– wählen –</option>
                      {right_items.map((r) => (
                        <option key={r.label} value={r.label}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                {/* Correct answer cell (results only) */}
                {showResults && (
                  <td
                    className="border border-border px-3 py-2 text-green-700 font-bold bg-green-50"
                    style={FONT_STYLE}
                  >
                    {answer_key[item.label] || "–"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Results summary */}
      {showResults && (
        <div className="rounded-xl bg-muted/30 border px-3 py-2 flex items-center gap-2">
          <span className="font-bold" style={FONT_STYLE}>
            Ergebnis:
          </span>
          <span style={FONT_STYLE}>
            {
              left_items.filter((item) => isCorrect(item.label)).length
            }{" "}
            von {left_items.length} korrekt
          </span>
        </div>
      )}
    </div>
  );
}
