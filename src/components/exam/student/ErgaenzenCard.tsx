"use client";

import { useState, useEffect, useMemo } from "react";

interface ErgaenzenCardProps {
  sentences: Array<{ text: string; blank_word: string }>;
  onAnswersChange: (answers: Record<number, string>) => void;
  showResults?: boolean;
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

/** Fisher-Yates shuffle — pure, deterministic given the seed array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ErgaenzenCard({
  sentences,
  onAnswersChange,
  showResults = false,
}: ErgaenzenCardProps) {
  // gaps[idx] = word placed in gap idx, or ""
  const [gaps, setGaps] = useState<Record<number, string>>(
    Object.fromEntries(sentences.map((_, i) => [i, ""]))
  );
  // Which gap is "selected" (next to receive a click from the word bank)
  const [selectedGap, setSelectedGap] = useState<number | null>(null);

  // Randomized word order — computed once on mount
  const wordBank = useMemo(
    () => shuffle(sentences.map((s) => s.blank_word)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    onAnswersChange(gaps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaps]);

  /** Set of words currently placed in a gap */
  const usedWords = new Set(Object.values(gaps).filter(Boolean));

  function handleWordClick(word: string) {
    if (showResults) return;

    // If word is already placed, remove it
    if (usedWords.has(word)) {
      const gapIdx = Object.entries(gaps).find(([, v]) => v === word)?.[0];
      if (gapIdx !== undefined) {
        const idx = Number(gapIdx);
        setGaps((prev) => ({ ...prev, [idx]: "" }));
        setSelectedGap(idx); // re-select that gap
      }
      return;
    }

    // Find the target gap: selectedGap if set and empty, else first empty gap
    let target: number | null = null;
    if (selectedGap !== null && !gaps[selectedGap]) {
      target = selectedGap;
    } else {
      // first empty gap
      for (let i = 0; i < sentences.length; i++) {
        if (!gaps[i]) {
          target = i;
          break;
        }
      }
    }

    if (target === null) return;

    setGaps((prev) => ({ ...prev, [target!]: word }));
    setSelectedGap(null);
  }

  function handleGapClick(idx: number) {
    if (showResults) return;
    if (gaps[idx]) {
      // Clear the gap — return word to bank
      setGaps((prev) => ({ ...prev, [idx]: "" }));
      setSelectedGap(idx);
    } else {
      // Select this gap as the target
      setSelectedGap(idx);
    }
  }

  function gapBorderColor(idx: number): string {
    if (selectedGap === idx) return "#6C4CE0";
    return "#d1d5db";
  }

  function gapBgColor(idx: number): string {
    if (!showResults) {
      if (selectedGap === idx) return "#ede9fe";
      return gaps[idx] ? "#f0fdf4" : "#f9fafb";
    }
    const correct = sentences[idx].blank_word;
    const placed = gaps[idx];
    if (!placed) return "#fef2f2";
    return placed.toLowerCase() === correct.toLowerCase()
      ? "#f0fdf4"
      : "#fef2f2";
  }

  function gapTextColor(idx: number): string {
    if (!showResults) return gaps[idx] ? "#166534" : "#9ca3af";
    const correct = sentences[idx].blank_word;
    const placed = gaps[idx];
    if (!placed) return "#dc2626";
    return placed.toLowerCase() === correct.toLowerCase()
      ? "#166534"
      : "#dc2626";
  }

  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
      style={FONT_STYLE}
    >
      {/* Sub-header */}
      <h3
        className="font-bold text-brand-teal"
        style={{ ...FONT_STYLE, fontSize: "13px" }}
      >
        Ergänzen Sie mit dem passenden Wort!
      </h3>

      {/* Word bank */}
      <div className="space-y-1.5">
        <p className="text-muted-foreground" style={FONT_STYLE}>
          Wortbank — klicken Sie auf ein Wort, um es einzusetzen:
        </p>
        <div className="flex flex-wrap gap-2">
          {wordBank.map((word) => {
            const isUsed = usedWords.has(word);
            return (
              <button
                key={word}
                onClick={() => handleWordClick(word)}
                disabled={showResults}
                className="rounded-xl px-3 py-1 text-xs font-semibold transition-all border"
                style={{
                  ...FONT_STYLE,
                  backgroundColor: isUsed ? "#f3f4f6" : "#ccfbf1",
                  color: isUsed ? "#9ca3af" : "#0f766e",
                  borderColor: isUsed ? "#e5e7eb" : "#5eead4",
                  textDecoration: isUsed ? "line-through" : "none",
                  cursor: showResults ? "default" : "pointer",
                  opacity: showResults ? 0.7 : 1,
                }}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-border" />

      {/* Sentences with gaps */}
      <div className="space-y-3">
        {sentences.map((sentence, idx) => {
          // Split the sentence text to insert the blank inline
          // We mark blanks with ___ or by replacing the blank_word occurrence
          // The sentence.text is the full sentence with the blank_word present.
          // We split on the blank_word (case-insensitive, first occurrence).
          const regex = new RegExp(`(${escapeRegex(sentence.blank_word)})`, "i");
          const parts = sentence.text.split(regex);

          const placed = gaps[idx];
          const correct = sentence.blank_word;
          const isAnswerCorrect =
            placed && placed.toLowerCase() === correct.toLowerCase();

          return (
            <div key={idx} className="flex items-start gap-2">
              {/* Number badge */}
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-xs mt-0.5">
                {idx + 1}
              </span>

              {/* Sentence with inline gap */}
              <p
                className="leading-relaxed flex-1 flex flex-wrap items-baseline gap-x-0.5"
                style={FONT_STYLE}
              >
                {parts.map((part, partIdx) => {
                  // The part that matched the blank_word
                  if (regex.test(part)) {
                    return (
                      <span
                        key={partIdx}
                        onClick={() => handleGapClick(idx)}
                        className="inline-flex items-center justify-center rounded-lg px-2 py-0.5 min-w-[80px] border-2 transition-all cursor-pointer select-none"
                        style={{
                          ...FONT_STYLE,
                          borderColor: gapBorderColor(idx),
                          backgroundColor: gapBgColor(idx),
                          color: gapTextColor(idx),
                          fontWeight: placed ? "bold" : "normal",
                          fontStyle: placed ? "normal" : "italic",
                          textDecoration:
                            selectedGap === idx ? "underline" : "none",
                        }}
                      >
                        {showResults ? (
                          <>
                            {placed || (
                              <span className="text-[#dc2626]">???</span>
                            )}
                            {!isAnswerCorrect && (
                              <span className="ml-1 text-[#dc2626] font-bold">
                                ({correct})
                              </span>
                            )}
                          </>
                        ) : (
                          placed || "_____"
                        )}
                      </span>
                    );
                  }
                  return <span key={partIdx}>{part}</span>;
                })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Results summary */}
      {showResults && (
        <div className="rounded-xl bg-muted/30 border px-3 py-2 flex items-center gap-2">
          <span className="font-bold" style={FONT_STYLE}>
            Ergebnis:
          </span>
          <span style={FONT_STYLE}>
            {
              sentences.filter((s, i) =>
                gaps[i]?.toLowerCase() === s.blank_word.toLowerCase()
              ).length
            }{" "}
            von {sentences.length} korrekt
          </span>
        </div>
      )}
    </div>
  );
}

export default ErgaenzenCard;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
