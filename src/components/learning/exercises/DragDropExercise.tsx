"use client";

import React, { useState, useEffect } from "react";

interface Sentence {
  words_correct_order: string[];
  hint_fr?: string;
}

interface DragDropExerciseProps {
  sentences: Sentence[];
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

type WordItem = { id: string; word: string };

function buildWordItems(words: string[]): WordItem[] {
  return words.map((w, i) => ({ id: `${w}-${i}`, word: w }));
}

export default function DragDropExercise({
  sentences,
  instruction_fr,
  onComplete,
}: DragDropExerciseProps) {
  // For each sentence: bank (shuffled), slots (placed words)
  const [banks, setBanks] = useState<WordItem[][]>([]);
  const [slots, setSlots] = useState<(WordItem | null)[][]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<{
    sentenceIdx: number;
    wordId: string;
    source: "bank" | "slot";
    slotIdx?: number;
  } | null>(null);

  useEffect(() => {
    const newBanks = sentences.map((s) =>
      shuffleArray(buildWordItems(s.words_correct_order))
    );
    const newSlots = sentences.map((s) =>
      new Array<WordItem | null>(s.words_correct_order.length).fill(null)
    );
    setBanks(newBanks);
    setSlots(newSlots);
    setShowResults(false);
    setScore(null);
    setSelectedWord(null);
  }, [sentences]);

  const handleBankClick = (sentenceIdx: number, wordId: string) => {
    if (showResults) return;

    if (
      selectedWord?.source === "bank" &&
      selectedWord.sentenceIdx === sentenceIdx &&
      selectedWord.wordId === wordId
    ) {
      setSelectedWord(null);
      return;
    }

    // If a slot was previously selected, swap into bank? No — just set selection to this bank word
    setSelectedWord({ sentenceIdx, wordId, source: "bank" });
  };

  const handleSlotClick = (sentenceIdx: number, slotIdx: number) => {
    if (showResults) return;

    const currentSlotWord = slots[sentenceIdx][slotIdx];

    if (selectedWord && selectedWord.sentenceIdx === sentenceIdx) {
      if (selectedWord.source === "bank") {
        // Move bank word → slot
        const bankWord = banks[sentenceIdx].find(
          (w) => w.id === selectedWord.wordId
        );
        if (!bankWord) { setSelectedWord(null); return; }

        const newBanks = banks.map((b, i) =>
          i === sentenceIdx ? b.filter((w) => w.id !== selectedWord.wordId) : b
        );
        const newSlots = slots.map((row, i) => {
          if (i !== sentenceIdx) return row;
          const newRow = [...row];
          // If slot already occupied, push displaced word back to bank
          if (newRow[slotIdx]) {
            newBanks[sentenceIdx] = [...newBanks[sentenceIdx], newRow[slotIdx]!];
          }
          newRow[slotIdx] = bankWord;
          return newRow;
        });
        setBanks(newBanks);
        setSlots(newSlots);
        setSelectedWord(null);
      } else if (
        selectedWord.source === "slot" &&
        selectedWord.slotIdx !== undefined
      ) {
        // Move slot word → another slot (swap)
        const fromIdx = selectedWord.slotIdx;
        if (fromIdx === slotIdx) { setSelectedWord(null); return; }
        const newSlots = slots.map((row, i) => {
          if (i !== sentenceIdx) return row;
          const newRow = [...row];
          const temp = newRow[fromIdx];
          newRow[fromIdx] = newRow[slotIdx];
          newRow[slotIdx] = temp;
          return newRow;
        });
        setSlots(newSlots);
        setSelectedWord(null);
      }
    } else {
      // Select this slot word (to move back to bank or swap)
      if (currentSlotWord) {
        setSelectedWord({
          sentenceIdx,
          wordId: currentSlotWord.id,
          source: "slot",
          slotIdx,
        });
      }
    }
  };

  const handleReturnToBank = (sentenceIdx: number, slotIdx: number) => {
    if (showResults) return;
    const word = slots[sentenceIdx][slotIdx];
    if (!word) return;

    const newSlots = slots.map((row, i) => {
      if (i !== sentenceIdx) return row;
      const newRow = [...row];
      newRow[slotIdx] = null;
      return newRow;
    });
    const newBanks = banks.map((b, i) =>
      i === sentenceIdx ? [...b, word] : b
    );
    setSlots(newSlots);
    setBanks(newBanks);
    setSelectedWord(null);
  };

  const handleVerify = () => {
    let correct = 0;
    sentences.forEach((s, i) => {
      const placed = slots[i].map((w) => w?.word ?? "");
      const isCorrect = s.words_correct_order.every(
        (w, j) => placed[j] === w
      );
      if (isCorrect) correct++;
    });
    const pct = Math.round((correct / sentences.length) * 100);
    setScore(pct);
    setShowResults(true);
    onComplete(pct);
  };

  const handleReset = () => {
    const newBanks = sentences.map((s) =>
      shuffleArray(buildWordItems(s.words_correct_order))
    );
    const newSlots = sentences.map((s) =>
      new Array<WordItem | null>(s.words_correct_order.length).fill(null)
    );
    setBanks(newBanks);
    setSlots(newSlots);
    setShowResults(false);
    setScore(null);
    setSelectedWord(null);
  };

  const isSlotCorrect = (sentenceIdx: number, slotIdx: number): boolean => {
    const word = slots[sentenceIdx][slotIdx];
    if (!word) return false;
    return sentences[sentenceIdx].words_correct_order[slotIdx] === word.word;
  };

  if (banks.length === 0) return null;

  return (
    <div
      style={{ ...BASE_STYLE, background: "#F9F7FF" }}
      className="rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-md"
    >
      {/* Header */}
      <div className="mb-5">
        <div
          className="inline-block px-3 py-1 rounded-full mb-2"
          style={{ background: "#6C4CE0", color: "#fff" }}
        >
          <span style={BASE_STYLE}>Remets les mots dans l'ordre</span>
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
            {sentences.filter((s, i) =>
              s.words_correct_order.every((w, j) => slots[i][j]?.word === w)
            ).length}{" "}
            / {sentences.length} phrases correctes
          </span>
        </div>
      )}

      {/* Sentences */}
      <div className="flex flex-col gap-6">
        {sentences.map((sentence, sIdx) => {
          const allPlaced = slots[sIdx].every((w) => w !== null);
          const isSentenceCorrect =
            showResults &&
            sentence.words_correct_order.every(
              (w, j) => slots[sIdx][j]?.word === w
            );

          return (
            <div
              key={sIdx}
              className="rounded-xl p-4"
              style={{
                background: "#fff",
                border: showResults
                  ? `2px solid ${isSentenceCorrect ? "#0FB6A3" : "#FF5A5F"}`
                  : "2px solid #E8E0FF",
              }}
            >
              {/* Sentence header */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="rounded-full w-6 h-6 flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: "#6C4CE0", fontSize: "11px", fontFamily: "Times New Roman, serif" }}
                >
                  {sIdx + 1}
                </span>
                {sentence.hint_fr && (
                  <span style={{ ...BASE_STYLE, color: "#888", fontStyle: "italic" }}>
                    {sentence.hint_fr}
                  </span>
                )}
                {showResults && (
                  <span
                    className="ml-auto"
                    style={{ fontSize: "16px" }}
                  >
                    {isSentenceCorrect ? "✅" : "❌"}
                  </span>
                )}
              </div>

              {/* Slots */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 rounded-lg" style={{ background: "#F3EEFF" }}>
                {slots[sIdx].map((word, slotIdx) => {
                  const isSelected =
                    selectedWord?.source === "slot" &&
                    selectedWord.sentenceIdx === sIdx &&
                    selectedWord.slotIdx === slotIdx;
                  const correct = showResults ? isSlotCorrect(sIdx, slotIdx) : null;

                  return (
                    <div
                      key={slotIdx}
                      onClick={() => {
                        if (word) {
                          if (isSelected) {
                            handleReturnToBank(sIdx, slotIdx);
                          } else {
                            handleSlotClick(sIdx, slotIdx);
                          }
                        } else {
                          handleSlotClick(sIdx, slotIdx);
                        }
                      }}
                      className="flex items-center justify-center rounded-lg cursor-pointer transition-all"
                      style={{
                        minWidth: "60px",
                        height: "34px",
                        padding: "0 10px",
                        border: isSelected
                          ? "2px solid #6C4CE0"
                          : word
                          ? showResults
                            ? `2px solid ${correct ? "#0FB6A3" : "#FF5A5F"}`
                            : "2px solid #6C4CE0"
                          : "2px dashed #B9A9F5",
                        background: isSelected
                          ? "#E8E0FF"
                          : word
                          ? showResults
                            ? correct
                              ? "#ECFDF5"
                              : "#FFF1F2"
                            : "#EDE8FF"
                          : "transparent",
                        fontFamily: "Times New Roman, serif",
                        fontSize: "12px",
                        color: word
                          ? showResults
                            ? correct
                              ? "#0FB6A3"
                              : "#FF5A5F"
                            : "#3B1F9E"
                          : "#B9A9F5",
                        fontWeight: word ? "600" : "normal",
                      }}
                    >
                      {word ? word.word : `${slotIdx + 1}`}
                    </div>
                  );
                })}
              </div>

              {/* Show correct order on wrong */}
              {showResults && !isSentenceCorrect && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span style={{ ...BASE_STYLE, color: "#888", marginRight: "4px" }}>Correct :</span>
                  {sentence.words_correct_order.map((w, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded"
                      style={{ background: "#ECFDF5", color: "#0FB6A3", ...BASE_STYLE }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}

              {/* Word bank */}
              {!showResults && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span style={{ ...BASE_STYLE, color: "#888", marginRight: "2px" }}>Banque :</span>
                  {banks[sIdx].map((wordItem) => {
                    const isSelected =
                      selectedWord?.source === "bank" &&
                      selectedWord.sentenceIdx === sIdx &&
                      selectedWord.wordId === wordItem.id;
                    return (
                      <button
                        key={wordItem.id}
                        onClick={() => handleBankClick(sIdx, wordItem.id)}
                        className="px-3 py-1 rounded-lg transition-all"
                        style={{
                          background: isSelected ? "#6C4CE0" : "#FFB200",
                          color: isSelected ? "#fff" : "#3B2200",
                          border: isSelected ? "2px solid #3B1F9E" : "2px solid transparent",
                          fontFamily: "Times New Roman, serif",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transform: isSelected ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        {wordItem.word}
                      </button>
                    );
                  })}
                  {banks[sIdx].length === 0 && (
                    <span style={{ ...BASE_STYLE, color: "#aaa", fontStyle: "italic" }}>
                      Tous les mots sont placés
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
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

      {/* Tip */}
      {!showResults && (
        <p style={{ ...BASE_STYLE, color: "#aaa", marginTop: "10px", fontStyle: "italic" }}>
          Clique un mot (banque) puis un emplacement numéroté — ou clique un emplacement rempli pour le retirer.
        </p>
      )}
    </div>
  );
}
