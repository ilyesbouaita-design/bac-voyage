"use client";

import React, { useState, useEffect } from "react";

interface SentenceItem {
  text: string;
  blank_word: string;
}

interface ClickPasteExerciseProps {
  sentences: SentenceItem[];
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "Times New Roman, serif",
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

type WordPill = {
  id: string;
  word: string;
  usedInSlot: number | null; // which sentence slot is using it, or null
};

export default function ClickPasteExercise({
  sentences,
  instruction_fr,
  onComplete,
}: ClickPasteExerciseProps) {
  const [wordPills, setWordPills] = useState<WordPill[]>([]);
  const [slotValues, setSlotValues] = useState<(string | null)[]>([]);
  const [slotPillIds, setSlotPillIds] = useState<(string | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [selectedPillId, setSelectedPillId] = useState<string | null>(null);

  useEffect(() => {
    const pills: WordPill[] = shuffleArray(
      sentences.map((s, i) => ({
        id: `pill-${i}-${s.blank_word}`,
        word: s.blank_word,
        usedInSlot: null,
      }))
    );
    setWordPills(pills);
    setSlotValues(new Array(sentences.length).fill(null));
    setSlotPillIds(new Array(sentences.length).fill(null));
    setShowResults(false);
    setScore(null);
    setSelectedPillId(null);
  }, [sentences]);

  const handlePillClick = (pillId: string) => {
    if (showResults) return;
    const pill = wordPills.find((p) => p.id === pillId);
    if (!pill) return;

    // If pill is used in a slot, clicking it returns it to bank
    if (pill.usedInSlot !== null) {
      returnPillToBank(pillId);
      return;
    }

    // Toggle selection
    setSelectedPillId((prev) => (prev === pillId ? null : pillId));
  };

  const handleSlotClick = (slotIdx: number) => {
    if (showResults) return;

    if (selectedPillId) {
      // Place selected pill into this slot
      const pill = wordPills.find((p) => p.id === selectedPillId);
      if (!pill || pill.usedInSlot !== null) {
        setSelectedPillId(null);
        return;
      }

      // If slot already has a word, return that word to bank first
      const existingPillId = slotPillIds[slotIdx];
      const newPills = wordPills.map((p) => {
        if (p.id === selectedPillId) return { ...p, usedInSlot: slotIdx };
        if (existingPillId && p.id === existingPillId) return { ...p, usedInSlot: null };
        return p;
      });

      const newSlotValues = [...slotValues];
      newSlotValues[slotIdx] = pill.word;

      const newSlotPillIds = [...slotPillIds];
      newSlotPillIds[slotIdx] = selectedPillId;

      setWordPills(newPills);
      setSlotValues(newSlotValues);
      setSlotPillIds(newSlotPillIds);
      setSelectedPillId(null);
    } else {
      // If slot has a word, return it to bank
      const pillId = slotPillIds[slotIdx];
      if (pillId) {
        returnPillToBank(pillId);
      }
    }
  };

  const returnPillToBank = (pillId: string) => {
    const pill = wordPills.find((p) => p.id === pillId);
    if (!pill || pill.usedInSlot === null) return;
    const slotIdx = pill.usedInSlot;

    const newPills = wordPills.map((p) =>
      p.id === pillId ? { ...p, usedInSlot: null } : p
    );
    const newSlotValues = [...slotValues];
    newSlotValues[slotIdx] = null;
    const newSlotPillIds = [...slotPillIds];
    newSlotPillIds[slotIdx] = null;

    setWordPills(newPills);
    setSlotValues(newSlotValues);
    setSlotPillIds(newSlotPillIds);
    setSelectedPillId(null);
  };

  const handleVerify = () => {
    let correct = 0;
    sentences.forEach((s, i) => {
      if (
        slotValues[i]?.toLowerCase().trim() === s.blank_word.toLowerCase().trim()
      ) {
        correct++;
      }
    });
    const pct = Math.round((correct / sentences.length) * 100);
    setScore(pct);
    setShowResults(true);
    onComplete(pct);
  };

  const handleReset = () => {
    const pills: WordPill[] = shuffleArray(
      sentences.map((s, i) => ({
        id: `pill-${i}-${s.blank_word}-r${Date.now()}`,
        word: s.blank_word,
        usedInSlot: null,
      }))
    );
    setWordPills(pills);
    setSlotValues(new Array(sentences.length).fill(null));
    setSlotPillIds(new Array(sentences.length).fill(null));
    setShowResults(false);
    setScore(null);
    setSelectedPillId(null);
  };

  // Split text around the blank_word
  function buildSentenceParts(text: string, blankWord: string): { before: string; after: string } {
    const idx = text.indexOf(blankWord);
    if (idx === -1) return { before: text, after: "" };
    return {
      before: text.slice(0, idx),
      after: text.slice(idx + blankWord.length),
    };
  }

  const allFilled = slotValues.every((v) => v !== null);

  return (
    <div
      style={{ ...BASE_STYLE, background: "#F9F7FF" }}
      className="rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-md"
    >
      {/* Header */}
      <div className="mb-5">
        <div
          className="inline-block px-3 py-1 rounded-full mb-2"
          style={{ background: "#0FB6A3", color: "#fff" }}
        >
          <span style={BASE_STYLE}>Complète les phrases</span>
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
            {sentences.filter(
              (s, i) =>
                slotValues[i]?.toLowerCase().trim() === s.blank_word.toLowerCase().trim()
            ).length}{" "}
            / {sentences.length}
          </span>
        </div>
      )}

      {/* Word bank */}
      <div
        className="rounded-xl p-3 mb-5"
        style={{ background: "#E0FAF7", border: "1.5px solid #0FB6A3" }}
      >
        <p style={{ ...BASE_STYLE, color: "#0A7A72", fontWeight: "bold", marginBottom: "8px" }}>
          Banque de mots :
        </p>
        <div className="flex flex-wrap gap-2">
          {wordPills.map((pill) => {
            const isUsed = pill.usedInSlot !== null;
            const isSelected = selectedPillId === pill.id && !isUsed;
            return (
              <button
                key={pill.id}
                onClick={() => handlePillClick(pill.id)}
                className="px-3 py-1 rounded-lg transition-all"
                style={{
                  background: isUsed
                    ? "#B2EDE8"
                    : isSelected
                    ? "#0FB6A3"
                    : "#0FB6A3",
                  color: isUsed ? "#77C4BC" : "#fff",
                  border: isSelected ? "2px solid #0A7A72" : "2px solid transparent",
                  fontFamily: "Times New Roman, serif",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: isUsed ? "default" : "pointer",
                  textDecoration: isUsed ? "line-through" : "none",
                  opacity: isUsed ? 0.6 : 1,
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                }}
              >
                {pill.word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sentences */}
      <div className="flex flex-col gap-3">
        {sentences.map((sentence, sIdx) => {
          const placed = slotValues[sIdx];
          const isCorrect =
            showResults &&
            placed?.toLowerCase().trim() === sentence.blank_word.toLowerCase().trim();
          const { before, after } = buildSentenceParts(
            sentence.text,
            sentence.blank_word
          );

          return (
            <div
              key={sIdx}
              className="rounded-xl p-3 flex items-center flex-wrap gap-1"
              style={{
                background: "#fff",
                border: showResults
                  ? `2px solid ${isCorrect ? "#0FB6A3" : "#FF5A5F"}`
                  : "2px solid #E8E0FF",
                lineHeight: "2",
              }}
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-1"
                style={{
                  background: "#6C4CE0",
                  color: "#fff",
                  fontFamily: "Times New Roman, serif",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {sIdx + 1}
              </span>

              <span style={{ ...BASE_STYLE, color: "#222" }}>{before}</span>

              {/* The gap / slot */}
              <span
                onClick={() => handleSlotClick(sIdx)}
                className="inline-flex items-center justify-center rounded-lg cursor-pointer transition-all"
                style={{
                  minWidth: `${Math.max(60, sentence.blank_word.length * 9)}px`,
                  height: "26px",
                  padding: "0 8px",
                  border: placed
                    ? showResults
                      ? `2px solid ${isCorrect ? "#0FB6A3" : "#FF5A5F"}`
                      : "2px solid #0FB6A3"
                    : selectedPillId
                    ? "2px dashed #0FB6A3"
                    : "2px dashed #B9A9F5",
                  background: placed
                    ? showResults
                      ? isCorrect
                        ? "#ECFDF5"
                        : "#FFF1F2"
                      : "#E0FAF7"
                    : selectedPillId
                    ? "#E0FAF7"
                    : "transparent",
                  fontFamily: "Times New Roman, serif",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: placed
                    ? showResults
                      ? isCorrect
                        ? "#0A7A72"
                        : "#FF5A5F"
                      : "#0A7A72"
                    : "#B9A9F5",
                  textDecoration: placed && !showResults ? "none" : placed ? "none" : "underline",
                }}
              >
                {placed ?? "___"}
              </span>

              <span style={{ ...BASE_STYLE, color: "#222" }}>{after}</span>

              {/* Show correct answer if wrong */}
              {showResults && !isCorrect && placed && (
                <span
                  className="ml-2 px-2 py-0.5 rounded"
                  style={{ ...BASE_STYLE, background: "#ECFDF5", color: "#0A7A72" }}
                >
                  ✓ {sentence.blank_word}
                </span>
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

      {!showResults && selectedPillId && (
        <p style={{ ...BASE_STYLE, color: "#0FB6A3", marginTop: "8px", fontStyle: "italic" }}>
          Mot sélectionné — clique sur un emplacement pour le placer.
        </p>
      )}
      {!showResults && !selectedPillId && (
        <p style={{ ...BASE_STYLE, color: "#aaa", marginTop: "8px", fontStyle: "italic" }}>
          Clique un mot puis un emplacement souligné — ou clique un emplacement rempli pour le retirer.
        </p>
      )}
    </div>
  );
}
