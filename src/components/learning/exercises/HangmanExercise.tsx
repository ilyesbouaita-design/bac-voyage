"use client";

import React, { useState, useEffect, useCallback } from "react";

interface HangmanExerciseProps {
  words: Array<{ word: string; hint_fr: string; category?: string }>;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
  ["Ä", "Ö", "Ü", "ß"],
];

const MAX_WRONG = 6;

// SVG hangman parts — drawn progressively based on wrongCount
function HangmanSVG({ wrongCount }: { wrongCount: number }) {
  return (
    <svg
      width="120"
      height="130"
      viewBox="0 0 120 130"
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* Gallows */}
      <line x1="10" y1="125" x2="90" y2="125" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="125" x2="30" y2="10" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="10" x2="70" y2="10" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="10" x2="70" y2="25" stroke="#374151" strokeWidth="3" strokeLinecap="round" />

      {/* Head */}
      {wrongCount >= 1 && (
        <circle cx="70" cy="33" r="8" stroke="#FF5A5F" strokeWidth="2.5" fill="none" />
      )}
      {/* Body */}
      {wrongCount >= 2 && (
        <line x1="70" y1="41" x2="70" y2="75" stroke="#FF5A5F" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {/* Left arm */}
      {wrongCount >= 3 && (
        <line x1="70" y1="52" x2="52" y2="65" stroke="#FF5A5F" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {/* Right arm */}
      {wrongCount >= 4 && (
        <line x1="70" y1="52" x2="88" y2="65" stroke="#FF5A5F" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {/* Left leg */}
      {wrongCount >= 5 && (
        <line x1="70" y1="75" x2="52" y2="95" stroke="#FF5A5F" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {/* Right leg */}
      {wrongCount >= 6 && (
        <line x1="70" y1="75" x2="88" y2="95" stroke="#FF5A5F" strokeWidth="2.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function HangmanExercise({
  words,
  instruction_fr,
  onComplete,
}: HangmanExerciseProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wordsWon, setWordsWon] = useState(0);
  const [flashLetter, setFlashLetter] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<"playing" | "won" | "lost" | "done">("playing");
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const currentWord = words[wordIndex];
  const wordUpper = currentWord.word.toUpperCase();

  const wrongGuesses = [...guessed].filter((l) => !wordUpper.includes(l));
  const wrongCount = wrongGuesses.length;

  const isWordRevealed = [...wordUpper].every(
    (ch) => ch === " " || guessed.has(ch)
  );

  useEffect(() => {
    if (gamePhase !== "playing") return;
    if (isWordRevealed) {
      setWordsWon((prev) => prev + 1);
      setGamePhase("won");
    } else if (wrongCount >= MAX_WRONG) {
      setGamePhase("lost");
    }
  }, [guessed, gamePhase, isWordRevealed, wrongCount]);

  const handleGuess = useCallback(
    (letter: string) => {
      if (gamePhase !== "playing") return;
      if (guessed.has(letter)) return;
      const next = new Set(guessed);
      next.add(letter);
      setGuessed(next);
      if (wordUpper.includes(letter)) {
        setFlashLetter(letter);
        setTimeout(() => setFlashLetter(null), 400);
      }
    },
    [gamePhase, guessed, wordUpper]
  );

  const handleNext = () => {
    const nextIndex = wordIndex + 1;
    if (nextIndex >= words.length) {
      const totalWon = wordsWon + (gamePhase === "won" ? 0 : 0); // already counted
      const s = Math.round((wordsWon / words.length) * 100);
      setFinalScore(s);
      setGamePhase("done");
      onComplete(s);
    } else {
      setWordIndex(nextIndex);
      setGuessed(new Set());
      setGamePhase("playing");
    }
  };

  if (gamePhase === "done") {
    return (
      <div style={{ ...BASE_FONT, padding: "16px", textAlign: "center" }}>
        <p style={{ ...BASE_FONT, fontSize: "18px", fontWeight: "bold", color: "#6C4CE0", marginBottom: "8px" }}>
          Terminé !
        </p>
        <p style={{ ...BASE_FONT, color: "#374151", marginBottom: "4px" }}>
          Mots devinés : {wordsWon} / {words.length}
        </p>
        <p style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "14px", color: finalScore! >= 70 ? "#0FB6A3" : "#FF5A5F" }}>
          Score : {finalScore} / 100
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...BASE_FONT, padding: "16px" }}>
      {/* Instruction */}
      <p style={{ ...BASE_FONT, color: "#6B7280", fontStyle: "italic", marginBottom: "10px" }}>
        {instruction_fr}
      </p>

      {/* Progress */}
      <p style={{ ...BASE_FONT, color: "#9CA3AF", marginBottom: "10px" }}>
        Mot {wordIndex + 1} / {words.length}
      </p>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "14px" }}>
        {/* Hangman drawing */}
        <div style={{ flexShrink: 0 }}>
          <HangmanSVG wrongCount={wrongCount} />
          <p style={{ ...BASE_FONT, textAlign: "center", color: "#FF5A5F", marginTop: "4px" }}>
            {wrongCount} / {MAX_WRONG}
          </p>
        </div>

        {/* Word info */}
        <div style={{ flex: 1, minWidth: "180px" }}>
          {/* Category badge */}
          {currentWord.category && (
            <span
              style={{
                ...BASE_FONT,
                background: "#EDE9FC",
                color: "#6C4CE0",
                borderRadius: "999px",
                padding: "2px 8px",
                display: "inline-block",
                marginBottom: "6px",
              }}
            >
              {currentWord.category}
            </span>
          )}

          {/* Hint */}
          <p style={{ ...BASE_FONT, color: "#374151", marginBottom: "10px" }}>
            Indice : <strong>{currentWord.hint_fr}</strong>
          </p>

          {/* Blanks */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {[...wordUpper].map((ch, i) => {
              if (ch === " ") {
                return <span key={i} style={{ width: "14px", display: "inline-block" }} />;
              }
              const revealed = guessed.has(ch) || gamePhase === "lost";
              const isFlashing = flashLetter === ch;
              let color = "#374151";
              if (gamePhase === "won") color = "#10B981";
              if (gamePhase === "lost" && !guessed.has(ch)) color = "#FF5A5F";

              return (
                <div
                  key={i}
                  style={{
                    width: "20px",
                    textAlign: "center",
                    borderBottom: "2px solid #6C4CE0",
                    paddingBottom: "2px",
                    transition: "background 0.3s",
                    background: isFlashing ? "#D1FAE5" : "transparent",
                    borderRadius: "2px",
                  }}
                >
                  <span
                    style={{
                      ...BASE_FONT,
                      fontWeight: "bold",
                      fontSize: "15px",
                      color: revealed ? color : "transparent",
                    }}
                  >
                    {ch}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Result message */}
          {gamePhase === "won" && (
            <p style={{ ...BASE_FONT, color: "#10B981", fontWeight: "bold", marginBottom: "8px" }}>
              Gewonnen! 🎉
            </p>
          )}
          {gamePhase === "lost" && (
            <p style={{ ...BASE_FONT, color: "#FF5A5F", fontWeight: "bold", marginBottom: "8px" }}>
              Verloren! Le mot était : <strong>{currentWord.word}</strong>
            </p>
          )}

          {/* Next button */}
          {(gamePhase === "won" || gamePhase === "lost") && (
            <button
              onClick={handleNext}
              style={{
                ...BASE_FONT,
                background: "#6C4CE0",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "6px 16px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {wordIndex + 1 < words.length ? "Mot suivant →" : "Voir le score"}
            </button>
          )}
        </div>
      </div>

      {/* Wrong guesses */}
      {wrongGuesses.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <span style={{ ...BASE_FONT, color: "#9CA3AF" }}>Mauvaises lettres : </span>
          {wrongGuesses.map((l) => (
            <span
              key={l}
              style={{
                ...BASE_FONT,
                color: "#FF5A5F",
                fontWeight: "bold",
                marginRight: "4px",
              }}
            >
              {l}
            </span>
          ))}
        </div>
      )}

      {/* Keyboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: "4px" }}>
            {row.map((letter) => {
              const used = guessed.has(letter);
              const isWrong = used && !wordUpper.includes(letter);
              const isRight = used && wordUpper.includes(letter);
              const disabled = used || gamePhase !== "playing";

              return (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={disabled}
                  style={{
                    ...BASE_FONT,
                    width: letter === "ß" ? "30px" : "26px",
                    height: "28px",
                    border: "1.5px solid",
                    borderColor: isWrong
                      ? "#FF5A5F"
                      : isRight
                      ? "#10B981"
                      : "#D1D5DB",
                    borderRadius: "5px",
                    background: isWrong
                      ? "#FEE2E2"
                      : isRight
                      ? "#D1FAE5"
                      : disabled
                      ? "#F9FAFB"
                      : "#FFFFFF",
                    color: isWrong
                      ? "#FF5A5F"
                      : isRight
                      ? "#065F46"
                      : "#374151",
                    cursor: disabled ? "default" : "pointer",
                    fontWeight: "bold",
                    opacity: disabled && !used ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
