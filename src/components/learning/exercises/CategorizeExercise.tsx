"use client";

import React, { useState } from "react";

interface CategorizeExerciseProps {
  categories: Array<{ name_fr: string; color: string }>;
  items: Array<{ text: string; correct_category: number }>;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

export default function CategorizeExercise({
  categories,
  items,
  instruction_fr,
  onComplete,
}: CategorizeExerciseProps) {
  // placement[i] = category index (0-based), or -1 for bank
  const [placement, setPlacement] = useState<number[]>(
    items.map(() => -1)
  );
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null
  );
  const [verified, setVerified] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const bankItems = items
    .map((item, i) => ({ ...item, index: i }))
    .filter((_, i) => placement[i] === -1);

  const handleBankItemClick = (itemIndex: number) => {
    if (verified) return;
    setSelectedItemIndex((prev) => (prev === itemIndex ? null : itemIndex));
  };

  const handleCategoryClick = (catIndex: number) => {
    if (verified) return;
    if (selectedItemIndex === null) return;
    const next = [...placement];
    next[selectedItemIndex] = catIndex;
    setPlacement(next);
    setSelectedItemIndex(null);
  };

  const handleCategoryItemClick = (itemIndex: number) => {
    if (verified) return;
    const next = [...placement];
    next[itemIndex] = -1;
    setPlacement(next);
    setSelectedItemIndex(null);
  };

  const handleVerify = () => {
    if (verified) return;
    let correct = 0;
    const next = [...placement];
    items.forEach((item, i) => {
      if (next[i] === item.correct_category) {
        correct++;
      } else {
        // Move wrong items to correct category
        next[i] = item.correct_category;
      }
    });
    setPlacement(next);
    setVerified(true);
    const s = Math.round((correct / items.length) * 100);
    setScore(s);
    onComplete(s);
  };

  const isCorrect = (itemIndex: number) =>
    placement[itemIndex] === items[itemIndex].correct_category;

  const colCount = categories.length >= 4 ? 3 : categories.length === 1 ? 1 : 2;

  return (
    <div style={{ ...BASE_FONT, padding: "16px" }}>
      {/* Instruction */}
      <p
        style={{
          ...BASE_FONT,
          marginBottom: "12px",
          color: "#374151",
          fontStyle: "italic",
        }}
      >
        {instruction_fr}
      </p>

      {/* Item bank */}
      <div
        style={{
          background: "#F3F4F6",
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "16px",
          minHeight: "52px",
        }}
      >
        <p
          style={{
            ...BASE_FONT,
            color: "#6B7280",
            marginBottom: "8px",
            fontWeight: "bold",
          }}
        >
          Éléments à classer :
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {bankItems.length === 0 && !verified && (
            <span style={{ ...BASE_FONT, color: "#9CA3AF", fontStyle: "italic" }}>
              Tous les éléments ont été placés.
            </span>
          )}
          {bankItems.map(({ text, index }) => {
            const isSelected = selectedItemIndex === index;
            return (
              <button
                key={index}
                onClick={() => handleBankItemClick(index)}
                style={{
                  ...BASE_FONT,
                  padding: "4px 10px",
                  borderRadius: "999px",
                  border: isSelected
                    ? "2px solid #6C4CE0"
                    : "2px solid #D1D5DB",
                  background: isSelected ? "#EDE9FC" : "#FFFFFF",
                  color: isSelected ? "#6C4CE0" : "#374151",
                  cursor: "pointer",
                  fontWeight: isSelected ? "bold" : "normal",
                  transition: "all 0.15s",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(108,76,224,0.2)"
                    : "none",
                }}
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category zones */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {categories.map((cat, catIndex) => {
          const catItems = items
            .map((item, i) => ({ ...item, index: i }))
            .filter((_, i) => placement[i] === catIndex);

          const isTargetable =
            !verified && selectedItemIndex !== null;

          return (
            <div
              key={catIndex}
              onClick={() => handleCategoryClick(catIndex)}
              style={{
                border: `2px solid ${cat.color}`,
                borderRadius: "10px",
                padding: "10px",
                minHeight: "90px",
                cursor: isTargetable ? "pointer" : "default",
                background: isTargetable
                  ? `${cat.color}14`
                  : "#FAFAFA",
                transition: "background 0.15s",
              }}
            >
              <p
                style={{
                  ...BASE_FONT,
                  fontWeight: "bold",
                  color: cat.color,
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                {cat.name_fr}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {catItems.map(({ text, index }) => {
                  let bg = cat.color + "22";
                  let borderColor = cat.color;
                  let textColor = cat.color;

                  if (verified) {
                    if (isCorrect(index)) {
                      bg = "#D1FAE5";
                      borderColor = "#10B981";
                      textColor = "#065F46";
                    } else {
                      bg = "#FEE2E2";
                      borderColor = "#FF5A5F";
                      textColor = "#991B1B";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryItemClick(index);
                      }}
                      style={{
                        ...BASE_FONT,
                        padding: "3px 9px",
                        borderRadius: "999px",
                        border: `2px solid ${borderColor}`,
                        background: bg,
                        color: textColor,
                        cursor: verified ? "default" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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
              {score! >= 70
                ? "Bien joué !"
                : "Continuez à pratiquer !"}
            </span>
          </div>
        )}
      </div>

      {/* Hint while selecting */}
      {!verified && selectedItemIndex !== null && (
        <p
          style={{
            ...BASE_FONT,
            color: "#6C4CE0",
            marginTop: "8px",
            fontStyle: "italic",
          }}
        >
          Cliquez sur une catégorie pour y placer «{" "}
          {items[selectedItemIndex].text} ».
        </p>
      )}
    </div>
  );
}
