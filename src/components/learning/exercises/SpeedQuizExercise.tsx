"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface SpeedQuizExerciseProps {
  questions: Array<{
    question: string;
    correct_answer: string;
    wrong_answers: string[];
  }>;
  seconds_per_question: number;
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

type FlashType = "correct" | "wrong" | null;

export default function SpeedQuizExercise({
  questions,
  seconds_per_question,
  instruction_fr,
  onComplete,
}: SpeedQuizExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(seconds_per_question);
  const [flash, setFlash] = useState<FlashType>(null);
  const [showCorrect, setShowCorrect] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setupAnswers = useCallback(
    (idx: number) => {
      const q = questions[idx];
      const opts = shuffle([q.correct_answer, ...q.wrong_answers.slice(0, 3)]);
      setAnswers(opts);
      setTimeLeft(seconds_per_question);
      setFlash(null);
      setShowCorrect(null);
      setAnswered(false);
    },
    [questions, seconds_per_question]
  );

  useEffect(() => {
    if (questions.length > 0) setupAnswers(0);
  }, [questions, setupAnswers]);

  const advanceQuestion = useCallback(
    (wasCorrect: boolean, idx: number) => {
      const nextStreak = wasCorrect ? streak + 1 : 0;
      setStreak(nextStreak);
      setMaxStreak((ms) => Math.max(ms, nextStreak));

      const nextIdx = idx + 1;
      if (nextIdx >= questions.length) {
        setDone(true);
        const finalCorrect = wasCorrect ? correctCount + 1 : correctCount;
        const score = Math.round((finalCorrect / questions.length) * 100);
        onComplete(score);
      } else {
        setCurrentIndex(nextIdx);
        setupAnswers(nextIdx);
      }
    },
    [streak, correctCount, questions.length, onComplete, setupAnswers]
  );

  // Timer
  useEffect(() => {
    if (done || answered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        setTotalTime((tt) => tt + 1);
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Time's up — treat as wrong
          setAnswered(true);
          setFlash("wrong");
          setShowCorrect(questions[currentIndex]?.correct_answer ?? "");
          advanceRef.current = setTimeout(() => {
            setStreak(0);
            const nextIdx = currentIndex + 1;
            if (nextIdx >= questions.length) {
              setDone(true);
              const score = Math.round((correctCount / questions.length) * 100);
              onComplete(score);
            } else {
              setCurrentIndex(nextIdx);
              setupAnswers(nextIdx);
            }
          }, 1200);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, done, answered, questions, correctCount, onComplete, setupAnswers]);

  const handleAnswer = (choice: string) => {
    if (answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setAnswered(true);

    const correct = questions[currentIndex].correct_answer;
    const isCorrect = choice === correct;

    if (isCorrect) {
      setFlash("correct");
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const ns = s + 1;
        setMaxStreak((ms) => Math.max(ms, ns));
        return ns;
      });
      flashRef.current = setTimeout(() => {
        setFlash(null);
        const nextIdx = currentIndex + 1;
        if (nextIdx >= questions.length) {
          setDone(true);
          onComplete(Math.round(((correctCount + 1) / questions.length) * 100));
        } else {
          setCurrentIndex(nextIdx);
          setupAnswers(nextIdx);
        }
      }, 700);
    } else {
      setFlash("wrong");
      setShowCorrect(correct);
      setStreak(0);
      flashRef.current = setTimeout(() => {
        setFlash(null);
        const nextIdx = currentIndex + 1;
        if (nextIdx >= questions.length) {
          setDone(true);
          onComplete(Math.round((correctCount / questions.length) * 100));
        } else {
          setCurrentIndex(nextIdx);
          setupAnswers(nextIdx);
        }
      }, 1200);
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
      if (advanceRef.current) clearTimeout(advanceRef.current);
    },
    []
  );

  if (done) {
    const score = Math.round((correctCount / questions.length) * 100);
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
          {score >= 80 ? "🏆" : score >= 50 ? "🌟" : "💪"}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#555",
            marginBottom: "6px",
          }}
        >
          Quiz terminé !
        </div>
        <div
          style={{
            fontSize: "40px",
            fontWeight: "bold",
            color: VIOLET,
            marginBottom: "16px",
          }}
        >
          {score}%
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              label: "Correctes",
              value: `${correctCount}/${questions.length}`,
              color: TEAL,
            },
            {
              label: "Meilleure série",
              value: `🔥 ${maxStreak}`,
              color: GOLD,
            },
            {
              label: "Temps total",
              value: `${totalTime}s`,
              color: VIOLET,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#f9fafb",
                borderRadius: "10px",
                padding: "12px 8px",
                border: `1.5px solid ${stat.color}22`,
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontFamily: "Times New Roman, serif",
                  color: "#888",
                  marginTop: "2px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const progress = timeLeft / seconds_per_question;
  const isUrgent = timeLeft <= 3;
  const flashBg =
    flash === "correct"
      ? "#bbf7d0"
      : flash === "wrong"
      ? "#fecdd3"
      : "#ffffff";

  const circumference = 2 * Math.PI * 22;
  const strokeDash = circumference * (1 - progress);

  return (
    <div
      style={{
        fontFamily: "Times New Roman, serif",
        fontSize: "12px",
        padding: "16px",
        maxWidth: "480px",
        margin: "0 auto",
        transition: "background 0.3s",
        background: flashBg,
        borderRadius: "16px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
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
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {streak >= 2 && (
            <div
              style={{
                background: GOLD,
                color: "#fff",
                borderRadius: "12px",
                padding: "2px 8px",
                fontSize: "12px",
                fontFamily: "Times New Roman, serif",
                fontWeight: "bold",
              }}
            >
              🔥 {streak}
            </div>
          )}
          <div
            style={{
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              color: VIOLET,
              fontWeight: "bold",
            }}
          >
            {currentIndex + 1}/{questions.length}
          </div>
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
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
            background: VIOLET,
            borderRadius: "2px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Timer + Question */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Circular timer */}
        <div
          style={{
            flexShrink: 0,
            position: "relative",
            width: "54px",
            height: "54px",
          }}
        >
          <svg
            width="54"
            height="54"
            viewBox="0 0 54 54"
            style={{
              transform: "rotate(-90deg)",
              animation: isUrgent ? "pulse 0.6s ease-in-out infinite" : "none",
            }}
          >
            <circle
              cx="27"
              cy="27"
              r="22"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            <circle
              cx="27"
              cy="27"
              r="22"
              fill="none"
              stroke={isUrgent ? CORAL : VIOLET}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: isUrgent ? CORAL : VIOLET,
              fontFamily: "Times New Roman, serif",
            }}
          >
            {timeLeft}
          </div>
          <style>{`@keyframes pulse { 0%,100%{transform:rotate(-90deg) scale(1)} 50%{transform:rotate(-90deg) scale(1.08)} }`}</style>
        </div>

        {/* Question */}
        <div
          style={{
            flex: 1,
            fontSize: "15px",
            fontFamily: "Times New Roman, serif",
            fontWeight: "bold",
            color: "#222",
            lineHeight: "1.4",
            paddingTop: "4px",
          }}
        >
          {questions[currentIndex]?.question}
        </div>
      </div>

      {/* Answers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {answers.map((ans, i) => {
          const isCorrectAns = ans === questions[currentIndex]?.correct_answer;
          let bg = "#fff";
          let border = "#e5e7eb";
          let color = "#333";

          if (answered && showCorrect) {
            if (isCorrectAns) {
              bg = "#f0fdf4";
              border = TEAL;
              color = TEAL;
            } else {
              bg = "#fff1f2";
              border = "#fca5a5";
              color = "#999";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(ans)}
              disabled={answered}
              style={{
                background: bg,
                color,
                border: `1.5px solid ${border}`,
                borderRadius: "10px",
                padding: "12px 10px",
                fontSize: "12px",
                fontFamily: "Times New Roman, serif",
                cursor: answered ? "default" : "pointer",
                textAlign: "left",
                transition: "background 0.15s, border-color 0.15s",
                lineHeight: "1.3",
              }}
              onMouseEnter={(e) => {
                if (!answered) {
                  e.currentTarget.style.background = "#f3f0ff";
                  e.currentTarget.style.borderColor = VIOLET;
                }
              }}
              onMouseLeave={(e) => {
                if (!answered) {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: VIOLET,
                  color: "#fff",
                  textAlign: "center",
                  lineHeight: "20px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {ans}
            </button>
          );
        })}
      </div>

      {/* Correct answer reveal */}
      {showCorrect && flash === "wrong" && (
        <div
          style={{
            background: "#fff1f2",
            border: `1px solid ${CORAL}`,
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: CORAL,
          }}
        >
          ✗ Réponse correcte :{" "}
          <strong style={{ color: "#333" }}>{showCorrect}</strong>
        </div>
      )}
    </div>
  );
}
