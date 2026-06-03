"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface Option {
  text: string;
  is_correct: boolean;
}

interface Question {
  question_fr: string;
  question_de?: string;
  options: Option[];
  explanation_fr?: string;
}

interface QcmExerciseProps {
  questions: Question[];
  timer_seconds?: number;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "Times New Roman, serif",
  fontSize: "12px",
};

const COLORS = ["#6C4CE0", "#FF5A5F", "#FFB200", "#0FB6A3"];
const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function QcmExercise({
  questions,
  timer_seconds,
  instruction_fr,
  onComplete,
}: QcmExerciseProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(timer_seconds ?? 0);
  const [timerActive, setTimerActive] = useState(!!timer_seconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTimer = !!timer_seconds && timer_seconds > 0;

  const advanceQuestion = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setTimeLeft(timer_seconds ?? 0);
    } else {
      // Auto-submit
      setTimerActive(false);
    }
  }, [currentIdx, questions.length, timer_seconds]);

  useEffect(() => {
    if (!hasTimer || !timerActive || showResults) return;
    if (answers[currentIdx] !== null) return; // already answered

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          advanceQuestion();
          return timer_seconds ?? 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIdx, hasTimer, timerActive, showResults, timer_seconds, advanceQuestion, answers]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(timer_seconds ?? 0);
  }, [currentIdx, timer_seconds]);

  const handleSelectOption = (optionIdx: number) => {
    if (showResults) return;
    if (answers[currentIdx] !== null) return; // locked after answer

    const newAnswers = [...answers];
    newAnswers[currentIdx] = optionIdx;
    setAnswers(newAnswers);

    // Pause timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
        setTimeLeft(timer_seconds ?? 0);
      }
    }, 800);
  };

  const handleVerify = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let correct = 0;
    questions.forEach((q, i) => {
      const ansIdx = answers[i];
      if (ansIdx !== null && q.options[ansIdx]?.is_correct) correct++;
    });
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setShowResults(true);
    setTimerActive(false);
    onComplete(pct);
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
    setScore(null);
    setTimeLeft(timer_seconds ?? 0);
    setTimerActive(!!timer_seconds);
  };

  const allAnswered = answers.every((a) => a !== null);
  const circumference = 2 * Math.PI * 20; // r=20
  const timerFraction = hasTimer ? timeLeft / (timer_seconds ?? 1) : 1;

  if (showResults) {
    return (
      <div
        style={{ ...BASE_STYLE, background: "#F9F7FF" }}
        className="rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-md"
      >
        {/* Header */}
        <div className="mb-4">
          <div
            className="inline-block px-3 py-1 rounded-full mb-2"
            style={{ background: "#6C4CE0", color: "#fff" }}
          >
            <span style={BASE_STYLE}>QCM</span>
          </div>
          <p style={{ ...BASE_STYLE, color: "#444" }}>{instruction_fr}</p>
        </div>

        {/* Score */}
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{
            background: (score ?? 0) >= 60 ? "#ECFDF5" : "#FFF1F2",
            border: `1.5px solid ${(score ?? 0) >= 60 ? "#0FB6A3" : "#FF5A5F"}`,
          }}
        >
          <span style={{ fontSize: "20px" }}>{(score ?? 0) >= 60 ? "🎉" : "📚"}</span>
          <span style={{ ...BASE_STYLE, fontWeight: "bold", color: (score ?? 0) >= 60 ? "#0FB6A3" : "#FF5A5F" }}>
            Score : {score}%
          </span>
          <span style={{ ...BASE_STYLE, color: "#666", marginLeft: "auto" }}>
            {questions.filter((q, i) => {
              const a = answers[i];
              return a !== null && q.options[a]?.is_correct;
            }).length}{" "}
            / {questions.length} correctes
          </span>
        </div>

        {/* Per-question results */}
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const ansIdx = answers[i];
            const correct = ansIdx !== null && q.options[ansIdx]?.is_correct;
            const correctOptIdx = q.options.findIndex((o) => o.is_correct);
            return (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{
                  background: "#fff",
                  border: `1.5px solid ${correct ? "#0FB6A3" : "#FF5A5F"}`,
                }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <span style={{ fontSize: "14px" }}>{correct ? "✅" : "❌"}</span>
                  <div>
                    <p style={{ ...BASE_STYLE, fontWeight: "bold", color: "#222" }}>
                      {i + 1}. {q.question_fr}
                    </p>
                    {q.question_de && (
                      <p style={{ ...BASE_STYLE, color: "#888", fontStyle: "italic" }}>
                        {q.question_de}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-6">
                  {ansIdx !== null && (
                    <p style={{ ...BASE_STYLE, color: correct ? "#0FB6A3" : "#FF5A5F" }}>
                      Ta réponse : {OPTION_LETTERS[ansIdx]}. {q.options[ansIdx].text}
                    </p>
                  )}
                  {!correct && correctOptIdx >= 0 && (
                    <p style={{ ...BASE_STYLE, color: "#0FB6A3" }}>
                      Correct : {OPTION_LETTERS[correctOptIdx]}. {q.options[correctOptIdx].text}
                    </p>
                  )}
                  {!correct && q.explanation_fr && (
                    <p
                      className="mt-1 px-2 py-1 rounded"
                      style={{ ...BASE_STYLE, color: "#555", background: "#FFF8E0", fontStyle: "italic" }}
                    >
                      💡 {q.explanation_fr}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleReset}
          className="mt-5 w-full py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{
            background: "#FFB200",
            color: "#3B2200",
            fontFamily: "Times New Roman, serif",
            fontSize: "12px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          Recommencer
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const currentAnswer = answers[currentIdx];

  return (
    <div
      style={{ ...BASE_STYLE, background: "#F9F7FF" }}
      className="rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div
            className="inline-block px-3 py-1 rounded-full mb-1"
            style={{ background: "#6C4CE0", color: "#fff" }}
          >
            <span style={BASE_STYLE}>QCM</span>
          </div>
          <p style={{ ...BASE_STYLE, color: "#444" }}>{instruction_fr}</p>
        </div>
        {/* Timer */}
        {hasTimer && (
          <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
            <svg width="52" height="52" style={{ position: "absolute", top: 0, left: 0 }}>
              <circle cx="26" cy="26" r="20" fill="none" stroke="#E8E0FF" strokeWidth="4" />
              <circle
                cx="26"
                cy="26"
                r="20"
                fill="none"
                stroke={timerFraction > 0.4 ? "#6C4CE0" : timerFraction > 0.2 ? "#FFB200" : "#FF5A5F"}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - timerFraction)}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
              />
            </svg>
            <span
              style={{
                fontFamily: "Times New Roman, serif",
                fontSize: "13px",
                fontWeight: "bold",
                color: timerFraction > 0.4 ? "#6C4CE0" : timerFraction > 0.2 ? "#FFB200" : "#FF5A5F",
                position: "relative",
                zIndex: 1,
              }}
            >
              {timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 flex-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full flex-1"
              style={{
                background:
                  i < currentIdx
                    ? answers[i] !== null && questions[i].options[answers[i]!]?.is_correct
                      ? "#0FB6A3"
                      : "#FF5A5F"
                    : i === currentIdx
                    ? "#6C4CE0"
                    : "#E8E0FF",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
        <span style={{ ...BASE_STYLE, color: "#888", flexShrink: 0 }}>
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "2px solid #E8E0FF" }}>
        <p style={{ ...BASE_STYLE, fontWeight: "bold", color: "#222", marginBottom: "4px" }}>
          {currentQ.question_fr}
        </p>
        {currentQ.question_de && (
          <p style={{ ...BASE_STYLE, color: "#888", fontStyle: "italic" }}>
            {currentQ.question_de}
          </p>
        )}
      </div>

      {/* Options grid 2x2 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {currentQ.options.map((opt, oIdx) => {
          const isSelected = currentAnswer === oIdx;
          const color = COLORS[oIdx % COLORS.length];
          return (
            <button
              key={oIdx}
              onClick={() => handleSelectOption(oIdx)}
              disabled={currentAnswer !== null}
              className="rounded-xl flex items-center gap-2 transition-all"
              style={{
                height: "44px",
                padding: "0 12px",
                background: isSelected ? `${color}18` : "#F9F7FF",
                border: `2px solid ${isSelected ? color : "#E8E0FF"}`,
                cursor: currentAnswer !== null ? "default" : "pointer",
                fontFamily: "Times New Roman, serif",
                fontSize: "12px",
                color: isSelected ? color : "#333",
                fontWeight: isSelected ? "bold" : "normal",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: isSelected ? color : "#E8E0FF",
                  color: isSelected ? "#fff" : "#888",
                  fontFamily: "Times New Roman, serif",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {OPTION_LETTERS[oIdx]}
              </span>
              <span style={{ flex: 1 }}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        {currentIdx > 0 && (
          <button
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="px-4 py-2 rounded-xl transition-all hover:opacity-80"
            style={{
              background: "#E8E0FF",
              color: "#6C4CE0",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Précédent
          </button>
        )}
        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setCurrentIdx((i) => i + 1);
              setTimeLeft(timer_seconds ?? 0);
            }}
            className="ml-auto px-4 py-2 rounded-xl transition-all hover:opacity-80"
            style={{
              background: "#6C4CE0",
              color: "#fff",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Suivant →
          </button>
        ) : (
          <button
            onClick={handleVerify}
            disabled={!allAnswered}
            className="ml-auto px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{
              background: allAnswered ? "#6C4CE0" : "#ccc",
              color: allAnswered ? "#fff" : "#888",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: allAnswered ? "pointer" : "not-allowed",
              fontWeight: "bold",
            }}
          >
            Vérifier
          </button>
        )}
      </div>

      {!allAnswered && (
        <p style={{ ...BASE_STYLE, color: "#aaa", marginTop: "8px", fontStyle: "italic" }}>
          Réponds à toutes les questions pour vérifier.
        </p>
      )}
    </div>
  );
}
