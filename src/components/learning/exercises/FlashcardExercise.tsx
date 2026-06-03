"use client";

import React, { useState, useRef } from "react";

interface FlashcardExerciseProps {
  cards: Array<{
    front: string;
    back: string;
    image_url?: string;
    example_de?: string;
  }>;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

type CardResult = "known" | "unknown" | null;
type SwipeDir = "left" | "right" | null;
type Phase = "study" | "summary" | "review";

export default function FlashcardExercise({
  cards,
  instruction_fr,
  onComplete,
}: FlashcardExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<CardResult[]>(cards.map(() => null));
  const [swipeDir, setSwipeDir] = useState<SwipeDir>(null);
  const [phase, setPhase] = useState<Phase>("study");
  const [reviewCards, setReviewCards] = useState<number[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const activeCards = phase === "review" ? reviewCards : cards.map((_, i) => i);
  const activeIndex = phase === "review" ? reviewIndex : currentIndex;
  const activeCardOrigIndex = activeCards[activeIndex] ?? 0;
  const card = cards[activeCardOrigIndex];
  const flipped = phase === "review" ? reviewFlipped : isFlipped;
  const totalActive = activeCards.length;

  const handleFlip = () => {
    if (animating) return;
    if (phase === "review") {
      setReviewFlipped((f) => !f);
    } else {
      setIsFlipped((f) => !f);
    }
  };

  const triggerSwipe = (dir: SwipeDir) => {
    if (animating) return;
    setAnimating(true);
    setSwipeDir(dir);

    setTimeout(() => {
      if (phase === "study") {
        const nextResults = [...results];
        nextResults[currentIndex] = dir === "right" ? "known" : "unknown";
        setResults(nextResults);

        const nextIndex = currentIndex + 1;
        if (nextIndex >= cards.length) {
          // Done with study phase
          const knownCount = nextResults.filter((r) => r === "known").length;
          const s = Math.round((knownCount / cards.length) * 100);
          setFinalScore(s);
          setPhase("summary");
          onComplete(s);
        } else {
          setCurrentIndex(nextIndex);
          setIsFlipped(false);
        }
      } else if (phase === "review") {
        const nextIdx = reviewIndex + 1;
        if (nextIdx >= reviewCards.length) {
          setPhase("summary");
        } else {
          setReviewIndex(nextIdx);
          setReviewFlipped(false);
        }
      }

      setSwipeDir(null);
      setAnimating(false);
    }, 400);
  };

  const handleStartReview = () => {
    const unknownIndices = results
      .map((r, i) => (r === "unknown" ? i : -1))
      .filter((i) => i !== -1);
    setReviewCards(unknownIndices);
    setReviewIndex(0);
    setReviewFlipped(false);
    setPhase("review");
  };

  // Swipe animation styles
  const cardWrapperStyle: React.CSSProperties = {
    transition: swipeDir ? "transform 0.35s ease, opacity 0.35s ease" : "none",
    transform:
      swipeDir === "left"
        ? "translateX(-120%) rotate(-15deg)"
        : swipeDir === "right"
        ? "translateX(120%) rotate(15deg)"
        : "translateX(0) rotate(0deg)",
    opacity: swipeDir ? 0 : 1,
  };

  // Summary phase
  if (phase === "summary") {
    const knownCount = results.filter((r) => r === "known").length;
    const unknownCount = results.filter((r) => r === "unknown").length;
    const unknownIndices = results
      .map((r, i) => (r === "unknown" ? i : -1))
      .filter((i) => i !== -1);

    return (
      <div style={{ ...BASE_FONT, padding: "16px" }}>
        <p style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "15px", color: "#6C4CE0", marginBottom: "12px" }}>
          Récapitulatif
        </p>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div
            style={{
              flex: 1,
              background: "#D1FAE5",
              border: "2px solid #10B981",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <p style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "20px", color: "#065F46" }}>
              {knownCount}
            </p>
            <p style={{ ...BASE_FONT, color: "#065F46" }}>Je sais</p>
          </div>
          <div
            style={{
              flex: 1,
              background: "#FEE2E2",
              border: "2px solid #FF5A5F",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <p style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "20px", color: "#991B1B" }}>
              {unknownCount}
            </p>
            <p style={{ ...BASE_FONT, color: "#991B1B" }}>À revoir</p>
          </div>
        </div>

        <p
          style={{
            ...BASE_FONT,
            fontWeight: "bold",
            fontSize: "14px",
            color: finalScore! >= 70 ? "#0FB6A3" : "#FF5A5F",
            marginBottom: "12px",
          }}
        >
          Score : {finalScore ?? Math.round((knownCount / cards.length) * 100)} / 100
        </p>

        {unknownCount > 0 && (
          <>
            <p style={{ ...BASE_FONT, color: "#374151", marginBottom: "8px" }}>
              Cartes à revoir :
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {unknownIndices.map((idx) => (
                <span
                  key={idx}
                  style={{
                    ...BASE_FONT,
                    background: "#FEE2E2",
                    color: "#991B1B",
                    borderRadius: "999px",
                    padding: "3px 9px",
                    border: "1px solid #FF5A5F",
                  }}
                >
                  {cards[idx].front}
                </span>
              ))}
            </div>
            <button
              onClick={handleStartReview}
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
              Revoir les cartes inconnues
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...BASE_FONT, padding: "16px" }}>
      {/* Instruction */}
      <p style={{ ...BASE_FONT, color: "#6B7280", fontStyle: "italic", marginBottom: "8px" }}>
        {instruction_fr}
      </p>

      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <p style={{ ...BASE_FONT, color: "#6B7280" }}>
          {phase === "review" ? "Révision : " : ""}
          {activeIndex + 1} / {totalActive} cartes
        </p>
        {phase === "review" && (
          <span
            style={{
              ...BASE_FONT,
              background: "#FEF3C7",
              color: "#92400E",
              borderRadius: "999px",
              padding: "2px 8px",
              border: "1px solid #FFB200",
            }}
          >
            Mode révision
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "#E5E7EB",
          borderRadius: "999px",
          marginBottom: "14px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((activeIndex + 1) / totalActive) * 100}%`,
            background: "linear-gradient(90deg, #6C4CE0, #0FB6A3)",
            borderRadius: "999px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Card area */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "14px",
          overflow: "hidden",
        }}
      >
        <div style={{ ...cardWrapperStyle, width: "100%", maxWidth: "400px" }}>
          {/* 3D flip container */}
          <div
            onClick={handleFlip}
            style={{
              perspective: "1000px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div
              style={{
                position: "relative",
                minHeight: "250px",
                transformStyle: "preserve-3d",
                transition: "transform 0.4s ease",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                width: "100%",
              }}
            >
              {/* Front */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #EDE9FC 0%, #F5F3FF 100%)",
                  border: "2px solid #6C4CE0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px 20px",
                  boxShadow: "0 4px 16px rgba(108,76,224,0.15)",
                  minHeight: "250px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Times New Roman, Times, serif",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#6C4CE0",
                    textAlign: "center",
                    marginBottom: "12px",
                  }}
                >
                  {card.front}
                </p>
                <p style={{ ...BASE_FONT, color: "#9CA3AF", fontStyle: "italic" }}>
                  Cliquez pour retourner
                </p>
              </div>

              {/* Back */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  border: "2px solid #0FB6A3",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  boxShadow: "0 4px 16px rgba(15,182,163,0.15)",
                  minHeight: "250px",
                  gap: "10px",
                }}
              >
                {card.image_url && (
                  <img
                    src={card.image_url}
                    alt={card.back}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                    }}
                  />
                )}
                <p
                  style={{
                    fontFamily: "Times New Roman, Times, serif",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#0FB6A3",
                    textAlign: "center",
                  }}
                >
                  {card.back}
                </p>
                {card.example_de && (
                  <p
                    style={{
                      ...BASE_FONT,
                      color: "#6B7280",
                      fontStyle: "italic",
                      textAlign: "center",
                      borderTop: "1px solid #E5E7EB",
                      paddingTop: "8px",
                      maxWidth: "90%",
                    }}
                  >
                    {card.example_de}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={() => triggerSwipe("left")}
          disabled={animating}
          style={{
            ...BASE_FONT,
            flex: 1,
            maxWidth: "180px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "2px solid #FF5A5F",
            background: "#FEF2F2",
            color: "#FF5A5F",
            cursor: animating ? "default" : "pointer",
            fontWeight: "bold",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "14px" }}>✗</span>
          Je ne sais pas
        </button>

        <button
          onClick={() => triggerSwipe("right")}
          disabled={animating}
          style={{
            ...BASE_FONT,
            flex: 1,
            maxWidth: "180px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "2px solid #10B981",
            background: "#F0FDF4",
            color: "#10B981",
            cursor: animating ? "default" : "pointer",
            fontWeight: "bold",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "14px" }}>✓</span>
          Je sais
        </button>
      </div>

      {/* Results row for study phase */}
      {phase === "study" && (
        <div style={{ display: "flex", gap: "3px", marginTop: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background:
                  r === "known"
                    ? "#10B981"
                    : r === "unknown"
                    ? "#FF5A5F"
                    : i === currentIndex
                    ? "#6C4CE0"
                    : "#E5E7EB",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
