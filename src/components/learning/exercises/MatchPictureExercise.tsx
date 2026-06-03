"use client";

import React, { useState, useMemo } from "react";

interface MatchPictureExerciseProps {
  pairs: Array<{ image_url: string; word: string }>;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchPictureExercise({
  pairs,
  instruction_fr,
  onComplete,
}: MatchPictureExerciseProps) {
  // shuffledWords: array of word strings in shuffled order
  const shuffledWords = useMemo(() => shuffleArray(pairs.map((p) => p.word)), []);

  // imageMatch[i] = word string matched to image i, or null
  const [imageMatch, setImageMatch] = useState<(string | null)[]>(
    pairs.map(() => null)
  );
  // selectedImage: index of currently selected image, or null
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  // usedWords: set of words already matched
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [verified, setVerified] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleImageClick = (imgIndex: number) => {
    if (verified) return;
    // If image already matched, clicking deselects/unmatches
    if (imageMatch[imgIndex] !== null) {
      const word = imageMatch[imgIndex]!;
      const next = [...imageMatch];
      next[imgIndex] = null;
      setImageMatch(next);
      const nextUsed = new Set(usedWords);
      nextUsed.delete(word);
      setUsedWords(nextUsed);
      setSelectedImage(null);
      return;
    }
    setSelectedImage((prev) => (prev === imgIndex ? null : imgIndex));
  };

  const handleWordClick = (word: string) => {
    if (verified) return;
    if (usedWords.has(word)) return;
    if (selectedImage === null) return;

    const next = [...imageMatch];
    next[selectedImage] = word;
    setImageMatch(next);

    const nextUsed = new Set(usedWords);
    nextUsed.add(word);
    setUsedWords(nextUsed);
    setSelectedImage(null);
  };

  const handleVerify = () => {
    if (verified) return;
    let correct = 0;
    pairs.forEach((pair, i) => {
      if (imageMatch[i] === pair.word) correct++;
    });
    setVerified(true);
    const s = Math.round((correct / pairs.length) * 100);
    setScore(s);
    onComplete(s);
  };

  const isCorrect = (imgIndex: number) =>
    imageMatch[imgIndex] === pairs[imgIndex].word;

  const colCount = pairs.length <= 4 ? 2 : 3;

  return (
    <div style={{ ...BASE_FONT, padding: "16px" }}>
      {/* Instruction */}
      <p style={{ ...BASE_FONT, color: "#6B7280", fontStyle: "italic", marginBottom: "12px" }}>
        {instruction_fr}
      </p>

      {/* Images grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {pairs.map((pair, i) => {
          const matched = imageMatch[i];
          const isSelected = selectedImage === i;
          let borderColor = "#D1D5DB";
          let borderWidth = "2px";

          if (isSelected) {
            borderColor = "#6C4CE0";
            borderWidth = "3px";
          } else if (verified) {
            borderColor = isCorrect(i) ? "#10B981" : "#FF5A5F";
            borderWidth = "3px";
          } else if (matched) {
            borderColor = "#FFB200";
            borderWidth = "2px";
          }

          return (
            <div
              key={i}
              onClick={() => handleImageClick(i)}
              style={{
                border: `${borderWidth} solid ${borderColor}`,
                borderRadius: "12px",
                overflow: "hidden",
                cursor: verified ? "default" : "pointer",
                background: "#F9FAFB",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: isSelected
                  ? "0 0 0 4px rgba(108,76,224,0.2)"
                  : verified && isCorrect(i)
                  ? "0 0 0 3px rgba(16,185,129,0.2)"
                  : "none",
              }}
            >
              {/* Square thumbnail */}
              <div style={{ position: "relative", paddingTop: "100%" }}>
                <img
                  src={pair.image_url}
                  alt={pair.word}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Matched word badge */}
              <div style={{ padding: "6px 8px", minHeight: "26px", textAlign: "center" }}>
                {matched ? (
                  <span
                    style={{
                      ...BASE_FONT,
                      background: verified
                        ? isCorrect(i)
                          ? "#D1FAE5"
                          : "#FEE2E2"
                        : "#EDE9FC",
                      color: verified
                        ? isCorrect(i)
                          ? "#065F46"
                          : "#991B1B"
                        : "#6C4CE0",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontWeight: "bold",
                      display: "inline-block",
                    }}
                  >
                    {verified && !isCorrect(i)
                      ? `✗ ${matched} → ${pair.word}`
                      : matched}
                  </span>
                ) : (
                  <span style={{ ...BASE_FONT, color: "#D1D5DB" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Word pills */}
      <div
        style={{
          background: "#F3F4F6",
          borderRadius: "10px",
          padding: "10px 12px",
          marginBottom: "14px",
        }}
      >
        <p style={{ ...BASE_FONT, color: "#6B7280", marginBottom: "6px", fontWeight: "bold" }}>
          Mots :
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {shuffledWords.map((word) => {
            const used = usedWords.has(word);
            return (
              <button
                key={word}
                onClick={() => handleWordClick(word)}
                disabled={used || verified}
                style={{
                  ...BASE_FONT,
                  padding: "4px 10px",
                  borderRadius: "999px",
                  border: "2px solid",
                  borderColor: used ? "#E5E7EB" : "#6C4CE0",
                  background: used ? "#F9FAFB" : "#EDE9FC",
                  color: used ? "#D1D5DB" : "#6C4CE0",
                  cursor: used || verified ? "default" : "pointer",
                  textDecoration: used ? "line-through" : "none",
                  fontWeight: "bold",
                  transition: "all 0.15s",
                }}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      {!verified && selectedImage !== null && (
        <p style={{ ...BASE_FONT, color: "#6C4CE0", fontStyle: "italic", marginBottom: "8px" }}>
          Image sélectionnée. Cliquez sur un mot pour l'associer.
        </p>
      )}

      {/* Verify / Score */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {!verified ? (
          <button
            onClick={handleVerify}
            style={{
              ...BASE_FONT,
              background: "#6C4CE0",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Vérifier
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                ...BASE_FONT,
                fontWeight: "bold",
                fontSize: "14px",
                color: score! >= 70 ? "#0FB6A3" : "#FF5A5F",
              }}
            >
              Score : {score} / 100
            </span>
            <span style={{ ...BASE_FONT, color: "#6B7280" }}>
              {score! >= 70 ? "Excellent !" : "Bon courage !"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
