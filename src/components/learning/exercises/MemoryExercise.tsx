"use client";

import React, { useState, useEffect, useMemo } from "react";

interface MemoryExerciseProps {
  pairs: Array<{ card_a: string; card_b: string }>;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

interface CardState {
  id: number;       // unique card id
  pairIndex: number;
  side: "a" | "b";
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryExercise({
  pairs,
  instruction_fr,
  onComplete,
}: MemoryExerciseProps) {
  const initialCards: CardState[] = useMemo(() => {
    const cards: CardState[] = [];
    pairs.forEach((pair, pairIndex) => {
      cards.push({ id: pairIndex * 2, pairIndex, side: "a", text: pair.card_a, isFlipped: false, isMatched: false });
      cards.push({ id: pairIndex * 2 + 1, pairIndex, side: "b", text: pair.card_b, isFlipped: false, isMatched: false });
    });
    return shuffleArray(cards);
  }, []);

  const [cards, setCards] = useState<CardState[]>(initialCards);
  const [selected, setSelected] = useState<number[]>([]); // indices into cards array
  const [locked, setLocked] = useState(false);
  const [flips, setFlips] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleCardClick = (cardIndex: number) => {
    if (locked) return;
    if (cards[cardIndex].isFlipped || cards[cardIndex].isMatched) return;
    if (selected.length === 2) return;
    if (selected.length === 1 && selected[0] === cardIndex) return;

    const nextCards = cards.map((c, i) =>
      i === cardIndex ? { ...c, isFlipped: true } : c
    );
    setCards(nextCards);

    const nextSelected = [...selected, cardIndex];
    setSelected(nextSelected);
    setFlips((f) => f + 1);

    if (nextSelected.length === 2) {
      setLocked(true);
      const [i1, i2] = nextSelected;
      const c1 = nextCards[i1];
      const c2 = nextCards[i2];

      if (c1.pairIndex === c2.pairIndex) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === i1 || i === i2 ? { ...c, isMatched: true } : c
            )
          );
          const newMatches = matchesFound + 1;
          setMatchesFound(newMatches);
          setSelected([]);
          setLocked(false);

          if (newMatches === pairs.length) {
            // Win
            const totalFlips = flips + 1;
            const minFlips = pairs.length * 2;
            const extraFlips = Math.max(0, totalFlips - minFlips);
            const s = Math.max(0, 100 - extraFlips * 5);
            setFinalScore(s);
            setGameWon(true);
            onComplete(s);
          }
        }, 400);
      } else {
        // No match — flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === i1 || i === i2 ? { ...c, isFlipped: false } : c
            )
          );
          setSelected([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  const colCount = Math.min(4, Math.ceil(Math.sqrt(cards.length)));

  return (
    <div style={{ ...BASE_FONT, padding: "16px" }}>
      {/* Instruction */}
      <p style={{ ...BASE_FONT, color: "#6B7280", fontStyle: "italic", marginBottom: "10px" }}>
        {instruction_fr}
      </p>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ ...BASE_FONT, color: "#6B7280" }}>
          Paires trouvées :{" "}
          <strong style={{ color: "#0FB6A3" }}>
            {matchesFound} / {pairs.length}
          </strong>
        </span>
        <span style={{ ...BASE_FONT, color: "#6B7280" }}>
          Retournements :{" "}
          <strong style={{ color: "#FFB200" }}>{flips}</strong>
        </span>
        <span style={{ ...BASE_FONT, color: "#6B7280" }}>
          Restantes :{" "}
          <strong style={{ color: "#6C4CE0" }}>
            {pairs.length - matchesFound}
          </strong>
        </span>
      </div>

      {/* Win message */}
      {gameWon && (
        <div
          style={{
            background: "#D1FAE5",
            border: "2px solid #10B981",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "14px",
            textAlign: "center",
          }}
        >
          <p style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "16px", color: "#065F46", marginBottom: "4px" }}>
            Bravo ! Toutes les paires trouvées !
          </p>
          <p style={{ ...BASE_FONT, color: "#065F46" }}>
            {flips} retournements pour {pairs.length} paires.
          </p>
          <p style={{ ...BASE_FONT, fontWeight: "bold", fontSize: "14px", color: finalScore! >= 70 ? "#0FB6A3" : "#FF5A5F", marginTop: "4px" }}>
            Score : {finalScore} / 100
          </p>
        </div>
      )}

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: "8px",
        }}
      >
        {cards.map((card, i) => {
          const isFlipped = card.isFlipped || card.isMatched;
          const isInSelected = selected.includes(i) && !card.isMatched;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(i)}
              style={{
                perspective: "600px",
                cursor:
                  card.isMatched || isFlipped
                    ? "default"
                    : "pointer",
                height: "70px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.3s ease",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Back face (face-down) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #6C4CE0, #9B7FF0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #5438B8",
                    boxShadow: "0 2px 6px rgba(108,76,224,0.3)",
                  }}
                >
                  <span style={{ ...BASE_FONT, color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
                    ?
                  </span>
                </div>

                {/* Front face (face-up) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: "8px",
                    background: card.isMatched ? "#F0FDF4" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${
                      card.isMatched
                        ? "#10B981"
                        : isInSelected
                        ? "#FFB200"
                        : "#E5E7EB"
                    }`,
                    boxShadow: card.isMatched
                      ? "0 0 0 3px rgba(16,185,129,0.2), 0 2px 8px rgba(0,0,0,0.08)"
                      : "0 1px 3px rgba(0,0,0,0.08)",
                    transform: card.isMatched
                      ? "rotateY(180deg) scale(1.04)"
                      : "rotateY(180deg) scale(1)",
                    transition: "transform 0.3s, border-color 0.2s",
                    padding: "4px",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      ...BASE_FONT,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: card.isMatched ? "#065F46" : "#374151",
                      wordBreak: "break-word",
                    }}
                  >
                    {card.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
