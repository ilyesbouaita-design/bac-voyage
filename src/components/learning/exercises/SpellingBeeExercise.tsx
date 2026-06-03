"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface SpellingBeeWord {
  word: string;
  hint_fr: string;
  audio_url?: string;
}

interface SpellingBeeExerciseProps {
  words: SpellingBeeWord[];
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const VIOLET = "#6C4CE0";
const CORAL = "#FF5A5F";
const GOLD = "#FFB200";
const TEAL = "#0FB6A3";

const SPECIAL_CHARS = ["Ä", "Ö", "Ü", "ß"];

type LetterState = "idle" | "correct" | "wrong" | "active";

export default function SpellingBeeExercise({
  words,
  instruction_fr,
  onComplete,
}: SpellingBeeExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState<string[]>([]);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [activeLetter, setActiveLetter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const currentWord = words[currentIndex];
  const wordLength = currentWord?.word.length ?? 0;

  // Init letter states on word change
  useEffect(() => {
    if (!currentWord) return;
    setInput(Array(wordLength).fill(""));
    setLetterStates(Array(wordLength).fill("idle"));
    setFeedback(null);
    setActiveLetter(0);
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, [currentIndex, currentWord, wordLength]);

  const focusIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < wordLength) {
      setActiveLetter(idx);
      setTimeout(() => inputsRef.current[idx]?.focus(), 0);
    }
  }, [wordLength]);

  const handleLetterInput = useCallback(
    (idx: number, value: string) => {
      if (feedback !== null) return;
      const char = value.slice(-1).toUpperCase();
      if (!char || !/^[A-ZÄÖÜß]$/i.test(char)) return;

      setInput((prev) => {
        const n = [...prev];
        n[idx] = char;
        return n;
      });
      setLetterStates((prev) => {
        const n = [...prev];
        n[idx] = "idle";
        return n;
      });

      if (idx < wordLength - 1) focusIndex(idx + 1);
    },
    [feedback, wordLength, focusIndex]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
      if (feedback !== null) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        if (input[idx] !== "") {
          setInput((prev) => {
            const n = [...prev];
            n[idx] = "";
            return n;
          });
        } else if (idx > 0) {
          focusIndex(idx - 1);
          setInput((prev) => {
            const n = [...prev];
            n[idx - 1] = "";
            return n;
          });
        }
        return;
      }

      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        focusIndex(idx - 1);
        return;
      }

      if (e.key === "ArrowRight" && idx < wordLength - 1) {
        e.preventDefault();
        focusIndex(idx + 1);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        verify();
        return;
      }
    },
    [feedback, input, wordLength, focusIndex]
  );

  const insertSpecial = (char: string) => {
    if (feedback !== null) return;
    handleLetterInput(activeLetter, char);
  };

  const verify = useCallback(() => {
    if (!currentWord || feedback !== null) return;
    const target = currentWord.word.toUpperCase();
    const built = input.join("").toUpperCase();

    const newStates: LetterState[] = target.split("").map((ch, i) => {
      if (!input[i]) return "wrong";
      return input[i].toUpperCase() === ch ? "correct" : "wrong";
    });

    setLetterStates(newStates);

    if (built === target) {
      setFeedback("correct");
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
    }
  }, [currentWord, feedback, input]);

  const next = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= words.length) {
      setDone(true);
      // correctCount is pre-increment; account for current question result
      const actualCorrect = feedback === "correct" ? correctCount + 1 : correctCount;
      onComplete(Math.round((actualCorrect / words.length) * 100));
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const playAudio = () => {
    if (!currentWord?.audio_url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(currentWord.audio_url);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  };

  if (done) {
    const actualCorrect =
      feedback === "correct" ? correctCount + 1 : correctCount;
    const score = Math.round((actualCorrect / words.length) * 100);
    return (
      <div
        style={{
          fontFamily: "Times New Roman, serif",
          fontSize: "12px",
          padding: "32px 24px",
          textAlign: "center",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: "52px", marginBottom: "8px" }}>
          {score >= 80 ? "🐝" : score >= 50 ? "🌸" : "💡"}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#555",
            marginBottom: "6px",
          }}
        >
          Dictée terminée !
        </div>
        <div
          style={{
            fontSize: "40px",
            fontWeight: "bold",
            color: VIOLET,
            marginBottom: "12px",
          }}
        >
          {score}%
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#888",
          }}
        >
          {actualCorrect} / {words.length} mots corrects
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div
      style={{
        fontFamily: "Times New Roman, serif",
        fontSize: "12px",
        padding: "16px",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#666",
          }}
        >
          {instruction_fr}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: VIOLET,
            fontWeight: "bold",
          }}
        >
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "#e5e7eb",
          borderRadius: "2px",
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((currentIndex + 1) / words.length) * 100}%`,
            background: VIOLET,
            borderRadius: "2px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Hint card */}
      <div
        style={{
          background: "#f9f7ff",
          border: `1.5px solid ${VIOLET}22`,
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "20px", marginBottom: "8px" }}>💡</div>
        <div
          style={{
            fontSize: "14px",
            fontFamily: "Times New Roman, serif",
            color: "#333",
            fontStyle: "italic",
            marginBottom: currentWord.audio_url ? "12px" : "0",
          }}
        >
          {currentWord.hint_fr}
        </div>

        {currentWord.audio_url && (
          <button
            onClick={playAudio}
            style={{
              background: isPlaying ? TEAL : VIOLET,
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              padding: "6px 16px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: "pointer",
              transition: "background 0.2s",
              marginTop: "4px",
            }}
          >
            {isPlaying ? "⏸ En cours..." : "🔊 Écouter"}
          </button>
        )}
      </div>

      {/* Input boxes */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        {Array.from({ length: wordLength }, (_, i) => {
          const state = letterStates[i];
          const isActiveBox = activeLetter === i && feedback === null;

          let bg = "#fff";
          let border = isActiveBox ? `2px solid ${VIOLET}` : "1.5px solid #d1d5db";
          let textColor = "#222";
          let boxShadow = isActiveBox ? `0 0 0 3px ${VIOLET}22` : "none";

          if (state === "correct") {
            bg = "#dcfce7";
            border = `2px solid ${TEAL}`;
            textColor = TEAL;
            boxShadow = "none";
          } else if (state === "wrong") {
            bg = "#ffe4e6";
            border = `2px solid ${CORAL}`;
            textColor = CORAL;
            boxShadow = "none";
          }

          return (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              maxLength={2}
              value={input[i] ?? ""}
              onChange={(e) => handleLetterInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onFocus={() => setActiveLetter(i)}
              disabled={feedback !== null}
              style={{
                width: "36px",
                height: "44px",
                textAlign: "center",
                fontSize: "18px",
                fontFamily: "Times New Roman, serif",
                fontWeight: "bold",
                color: textColor,
                background: bg,
                border,
                borderRadius: "8px",
                boxShadow,
                outline: "none",
                cursor: feedback !== null ? "default" : "text",
                transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                caretColor: "transparent",
              }}
            />
          );
        })}
      </div>

      {/* Virtual keyboard for special chars */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {SPECIAL_CHARS.map((ch) => (
          <button
            key={ch}
            onClick={() => insertSpecial(ch)}
            disabled={feedback !== null}
            style={{
              width: "40px",
              height: "36px",
              background: "#fff",
              border: `1.5px solid ${VIOLET}`,
              borderRadius: "8px",
              fontSize: "13px",
              fontFamily: "Times New Roman, serif",
              fontWeight: "bold",
              color: VIOLET,
              cursor: feedback !== null ? "not-allowed" : "pointer",
              opacity: feedback !== null ? 0.5 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (feedback === null)
                e.currentTarget.style.background = "#f3f0ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback === "correct" && (
        <div
          style={{
            textAlign: "center",
            padding: "10px",
            background: "#dcfce7",
            borderRadius: "10px",
            marginBottom: "12px",
            fontSize: "13px",
            fontFamily: "Times New Roman, serif",
            color: TEAL,
            fontWeight: "bold",
          }}
        >
          Richtig! 🎉 <span style={{ color: "#333" }}>{currentWord.word}</span>
        </div>
      )}
      {feedback === "wrong" && (
        <div
          style={{
            textAlign: "center",
            padding: "10px",
            background: "#ffe4e6",
            borderRadius: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontFamily: "Times New Roman, serif",
              color: CORAL,
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Nicht ganz richtig...
          </div>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              color: "#555",
            }}
          >
            Correct :{" "}
            <strong style={{ color: "#333", letterSpacing: "0.1em" }}>
              {currentWord.word}
            </strong>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {feedback === null ? (
          <button
            onClick={verify}
            style={{
              background: VIOLET,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 28px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: "pointer",
              fontWeight: "bold",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = "1")
            }
          >
            Valider ✓
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              background: VIOLET,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 28px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {currentIndex + 1 >= words.length ? "Terminer 🎓" : "Suivant →"}
          </button>
        )}
      </div>

      {/* Score tracker */}
      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "12px",
          fontFamily: "Times New Roman, serif",
          color: "#aaa",
        }}
      >
        {correctCount} correct{correctCount !== 1 ? "s" : ""} sur{" "}
        {currentIndex} mot{currentIndex !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
