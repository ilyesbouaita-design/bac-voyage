"use client";

import React, { useState, useEffect, useCallback } from "react";

interface SentenceBuilderExerciseProps {
  sentences: Array<{ correct_sentence: string; extra_words?: string[] }>;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const VIOLET = "#6C4CE0";
const CORAL = "#FF5A5F";
const GOLD = "#FFB200";
const TEAL = "#0FB6A3";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface WordToken {
  id: string;
  text: string;
}

export default function SentenceBuilderExercise({
  sentences,
  instruction_fr,
  onComplete,
}: SentenceBuilderExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pool, setPool] = useState<WordToken[]>([]);
  const [built, setBuilt] = useState<WordToken[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  const initSentence = useCallback(
    (idx: number) => {
      const s = sentences[idx];
      const words = s.correct_sentence.split(" ");
      const extras = s.extra_words ?? [];
      const all = [...words, ...extras].map((w, i) => ({
        id: `${idx}-${i}-${w}`,
        text: w,
      }));
      setPool(shuffle(all));
      setBuilt([]);
      setFeedback(null);
      setShowCorrect(false);
    },
    [sentences]
  );

  useEffect(() => {
    if (sentences.length > 0) initSentence(0);
  }, [sentences, initSentence]);

  const moveToBuilt = (token: WordToken) => {
    if (feedback !== null) return;
    setPool((p) => p.filter((w) => w.id !== token.id));
    setBuilt((b) => [...b, token]);
  };

  const moveToPool = (token: WordToken) => {
    if (feedback !== null) return;
    setBuilt((b) => b.filter((w) => w.id !== token.id));
    setPool((p) => [...p, token]);
  };

  const verify = () => {
    const built_sentence = built.map((w) => w.text).join(" ");
    const correct = sentences[currentIndex].correct_sentence;
    if (built_sentence.trim() === correct.trim()) {
      setFeedback("correct");
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback("wrong");
      setShowCorrect(true);
    }
  };

  const next = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= sentences.length) {
      setDone(true);
      // React state batches: correctCount is pre-increment value here
      const finalCorrect =
        feedback === "correct" ? correctCount + 1 : correctCount;
      const computedScore = Math.round((finalCorrect / sentences.length) * 100);
      setFinalScore(computedScore);
      onComplete(computedScore);
    } else {
      setCurrentIndex(nextIdx);
      initSentence(nextIdx);
    }
  };

  if (done) {
    const score = finalScore;
    return (
      <div
        style={{
          fontFamily: "Times New Roman, serif",
          fontSize: "12px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>
          {score >= 80 ? "🎉" : score >= 50 ? "👍" : "💪"}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#333",
            marginBottom: "8px",
          }}
        >
          Exercice terminé !
        </div>
        <div
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: VIOLET,
            marginBottom: "8px",
          }}
        >
          {score}%
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#666",
          }}
        >
          {correctCount} / {sentences.length} phrases correctes
        </div>
      </div>
    );
  }

  const s = sentences[currentIndex];
  const bgColor =
    feedback === "correct"
      ? "#f0fdf4"
      : feedback === "wrong"
      ? "#fff1f2"
      : "#fafafa";
  const borderColor =
    feedback === "correct"
      ? TEAL
      : feedback === "wrong"
      ? CORAL
      : "#e5e7eb";

  return (
    <div
      style={{
        fontFamily: "Times New Roman, serif",
        fontSize: "12px",
        padding: "16px",
        maxWidth: "640px",
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
          {currentIndex + 1} / {sentences.length}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "#e5e7eb",
          borderRadius: "2px",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((currentIndex + 1) / sentences.length) * 100}%`,
            background: VIOLET,
            borderRadius: "2px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Sentence zone */}
      <div
        style={{
          minHeight: "56px",
          border: `2px dashed ${borderColor}`,
          borderRadius: "10px",
          padding: "10px",
          background: bgColor,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
          marginBottom: "16px",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {built.length === 0 && (
          <span
            style={{
              color: "#bbb",
              fontStyle: "italic",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
            }}
          >
            Tapez les mots dans l'ordre...
          </span>
        )}
        {built.map((token) => (
          <button
            key={token.id}
            onClick={() => moveToPool(token)}
            style={{
              background: VIOLET,
              color: "#fff",
              border: "none",
              borderRadius: "20px",
              padding: "5px 12px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: "pointer",
              transition: "opacity 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.opacity = "0.8")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.opacity = "1")
            }
          >
            {token.text}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback === "correct" && (
        <div
          style={{
            color: TEAL,
            fontWeight: "bold",
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            marginBottom: "10px",
          }}
        >
          ✓ Richtig! Sehr gut!
        </div>
      )}
      {feedback === "wrong" && showCorrect && (
        <div
          style={{
            color: CORAL,
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            marginBottom: "10px",
          }}
        >
          ✗ Falsch. Correct :{" "}
          <strong>{s.correct_sentence}</strong>
        </div>
      )}

      {/* Word pool */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          minHeight: "48px",
          padding: "10px",
          background: "#f3f4f6",
          borderRadius: "10px",
          marginBottom: "16px",
        }}
      >
        {pool.map((token) => (
          <button
            key={token.id}
            onClick={() => moveToBuilt(token)}
            disabled={feedback !== null}
            style={{
              background: "#fff",
              color: "#333",
              border: `1.5px solid ${VIOLET}`,
              borderRadius: "20px",
              padding: "5px 12px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: feedback !== null ? "default" : "pointer",
              opacity: feedback !== null ? 0.6 : 1,
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
            {token.text}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        {feedback === null ? (
          <button
            onClick={verify}
            disabled={built.length === 0}
            style={{
              background: built.length === 0 ? "#ccc" : VIOLET,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: built.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              transition: "opacity 0.15s",
            }}
          >
            Vérifier
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              background: VIOLET,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {currentIndex + 1 >= sentences.length ? "Terminer" : "Suivant →"}
          </button>
        )}
      </div>
    </div>
  );
}
