"use client";

import React, { useState, useEffect, useRef } from "react";

interface SentenceTemplate {
  template: string; // e.g. "Der Hund [ist] groß"
  hint?: string;
}

interface FillGapsExerciseProps {
  sentences: SentenceTemplate[];
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "Times New Roman, serif",
  fontSize: "12px",
};

type TemplatePart =
  | { type: "text"; value: string }
  | { type: "gap"; answer: string; index: number };

function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIdx = 0;
  let gapIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: "text", value: template.slice(lastIdx, match.index) });
    }
    parts.push({ type: "gap", answer: match[1], index: gapIdx++ });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < template.length) {
    parts.push({ type: "text", value: template.slice(lastIdx) });
  }
  return parts;
}

// Count total gaps across all sentences
function countGaps(sentences: SentenceTemplate[]): number {
  let count = 0;
  sentences.forEach((s) => {
    const matches = s.template.match(/\[([^\]]+)\]/g);
    if (matches) count += matches.length;
  });
  return count;
}

export default function FillGapsExercise({
  sentences,
  instruction_fr,
  onComplete,
}: FillGapsExerciseProps) {
  // Global gap index: each gap across all sentences gets a unique index
  const [gapValues, setGapValues] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [focusedGap, setFocusedGap] = useState<number | null>(null);

  const totalGaps = countGaps(sentences);

  useEffect(() => {
    setGapValues(new Array(totalGaps).fill(""));
    setShowResults(false);
    setScore(null);
    setFocusedGap(null);
  }, [sentences, totalGaps]);

  // Build gap-to-sentence+answer map
  const gapMeta: Array<{ answer: string; hint?: string }> = [];
  sentences.forEach((s) => {
    const parts = parseTemplate(s.template);
    parts.forEach((p) => {
      if (p.type === "gap") {
        gapMeta.push({ answer: p.answer, hint: s.hint });
      }
    });
  });

  const handleGapChange = (globalIdx: number, value: string) => {
    if (showResults) return;
    const newValues = [...gapValues];
    newValues[globalIdx] = value;
    setGapValues(newValues);
  };

  const handleVerify = () => {
    let correct = 0;
    gapMeta.forEach((meta, i) => {
      if (gapValues[i]?.toLowerCase().trim() === meta.answer.toLowerCase().trim()) {
        correct++;
      }
    });
    const pct = Math.round((correct / gapMeta.length) * 100);
    setScore(pct);
    setShowResults(true);
    onComplete(pct);
  };

  const handleReset = () => {
    setGapValues(new Array(totalGaps).fill(""));
    setShowResults(false);
    setScore(null);
    setFocusedGap(null);
  };

  const allFilled = gapValues.every((v) => v.trim() !== "");

  // Render sentences with inline inputs
  let globalGapCounter = 0;

  return (
    <div
      style={{ ...BASE_STYLE, background: "#F9F7FF" }}
      className="rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-md"
    >
      {/* Header */}
      <div className="mb-5">
        <div
          className="inline-block px-3 py-1 rounded-full mb-2"
          style={{ background: "#FFB200", color: "#3B2200" }}
        >
          <span style={BASE_STYLE}>Remplis les blancs</span>
        </div>
        <p style={{ ...BASE_STYLE, color: "#444" }}>{instruction_fr}</p>
      </div>

      {/* Score banner */}
      {showResults && score !== null && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{
            background: score >= 60 ? "#ECFDF5" : "#FFF1F2",
            border: `1.5px solid ${score >= 60 ? "#0FB6A3" : "#FF5A5F"}`,
          }}
        >
          <span style={{ fontSize: "20px" }}>{score >= 60 ? "🎉" : "📚"}</span>
          <span style={{ ...BASE_STYLE, fontWeight: "bold", color: score >= 60 ? "#0FB6A3" : "#FF5A5F" }}>
            Score : {score}%
          </span>
          <span style={{ ...BASE_STYLE, color: "#666", marginLeft: "auto" }}>
            {gapMeta.filter(
              (m, i) => gapValues[i]?.toLowerCase().trim() === m.answer.toLowerCase().trim()
            ).length}{" "}
            / {gapMeta.length} blancs corrects
          </span>
        </div>
      )}

      {/* Sentences */}
      <div className="flex flex-col gap-4">
        {sentences.map((sentence, sIdx) => {
          const parts = parseTemplate(sentence.template);
          const sentenceStartGap = globalGapCounter;
          // Pre-calc gaps in this sentence
          const sentenceGaps = parts.filter((p) => p.type === "gap").length;

          return (
            <div
              key={sIdx}
              className="rounded-xl p-4"
              style={{ background: "#fff", border: "2px solid #E8E0FF" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "#FFB200",
                    color: "#3B2200",
                    fontFamily: "Times New Roman, serif",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {sIdx + 1}
                </span>
                {sentence.hint && (
                  <span style={{ ...BASE_STYLE, color: "#888", fontStyle: "italic" }}>
                    {sentence.hint}
                  </span>
                )}
              </div>

              {/* Inline sentence with gaps */}
              <div
                className="flex flex-wrap items-baseline gap-0"
                style={{ lineHeight: "2.2" }}
              >
                {parts.map((part, pIdx) => {
                  if (part.type === "text") {
                    return (
                      <span key={pIdx} style={{ ...BASE_STYLE, color: "#222", whiteSpace: "pre" }}>
                        {part.value}
                      </span>
                    );
                  }

                  // Gap
                  const gIdx = globalGapCounter++;
                  const value = gapValues[gIdx] ?? "";
                  const isCorrect =
                    showResults &&
                    value.toLowerCase().trim() === part.answer.toLowerCase().trim();
                  const isFocused = focusedGap === gIdx;
                  const inputWidth = Math.max(60, part.answer.length * 9 + 16);

                  return (
                    <span key={pIdx} className="relative inline-flex items-center" style={{ margin: "0 2px" }}>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleGapChange(gIdx, e.target.value)}
                        onFocus={() => setFocusedGap(gIdx)}
                        onBlur={() => setFocusedGap(null)}
                        disabled={showResults}
                        placeholder={sentence.hint ? `(${part.answer.length})` : ""}
                        style={{
                          width: `${inputWidth}px`,
                          height: "26px",
                          fontFamily: "Times New Roman, serif",
                          fontSize: "12px",
                          fontWeight: "bold",
                          textAlign: "center",
                          border: showResults
                            ? `2px solid ${isCorrect ? "#0FB6A3" : "#FF5A5F"}`
                            : isFocused
                            ? "2px solid #6C4CE0"
                            : "2px solid #B9A9F5",
                          borderRadius: "6px",
                          background: showResults
                            ? isCorrect
                              ? "#ECFDF5"
                              : "#FFF1F2"
                            : isFocused
                            ? "#F3EEFF"
                            : "#fff",
                          color: showResults
                            ? isCorrect
                              ? "#0A7A72"
                              : "#FF5A5F"
                            : "#3B1F9E",
                          outline: "none",
                          padding: "0 4px",
                          transition: "border-color 0.15s, background 0.15s",
                          cursor: showResults ? "default" : "text",
                        }}
                      />
                      {/* Show correct answer below when wrong */}
                      {showResults && !isCorrect && (
                        <span
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            fontFamily: "Times New Roman, serif",
                            fontSize: "10px",
                            color: "#0A7A72",
                            background: "#ECFDF5",
                            padding: "0 4px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            marginTop: "2px",
                            zIndex: 10,
                            border: "1px solid #0FB6A3",
                          }}
                        >
                          {part.answer}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Show all gap answers when wrong in results mode */}
              {showResults && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Array.from({ length: sentenceGaps }, (_, i) => {
                    const gIdx = sentenceStartGap + i;
                    const meta = gapMeta[gIdx];
                    const val = gapValues[gIdx] ?? "";
                    const isC = val.toLowerCase().trim() === meta?.answer.toLowerCase().trim();
                    if (isC) return null;
                    return (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded"
                        style={{ ...BASE_STYLE, background: "#ECFDF5", color: "#0A7A72" }}
                      >
                        ✓ {meta?.answer}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        {!showResults ? (
          <button
            onClick={handleVerify}
            className="flex-1 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{
              background: "#6C4CE0",
              color: "#fff",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Vérifier
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{
              background: "#FFB200",
              color: "#3B2200",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Recommencer
          </button>
        )}
      </div>

      {!showResults && (
        <p style={{ ...BASE_STYLE, color: "#aaa", marginTop: "8px", fontStyle: "italic" }}>
          Tape ta réponse directement dans les espaces — la comparaison ne tient pas compte des majuscules.
        </p>
      )}
    </div>
  );
}
