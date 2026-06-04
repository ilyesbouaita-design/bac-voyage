"use client";

import { useState, useEffect } from "react";
import type { KombinierenContent } from "@/lib/bac-types";

interface AdminKombinierenEditorProps {
  value: KombinierenContent;
  onChange: (value: KombinierenContent) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const LEFT_LABELS = ["a", "b", "c", "d", "e", "f"];
const RIGHT_LABELS = ["1", "2", "3", "4", "5", "6"];

const defaultContent = (): KombinierenContent => ({
  bac_type: "kombinieren",
  left_items: LEFT_LABELS.slice(0, 4).map((label) => ({ label, text: "" })),
  right_items: RIGHT_LABELS.slice(0, 4).map((label) => ({ label, text: "" })),
  answer_key: { a: "1", b: "2", c: "3", d: "4" },
});

export function AdminKombinierenEditor({
  value,
  onChange,
}: AdminKombinierenEditorProps) {
  const initial =
    value.left_items.length > 0 ? value : defaultContent();

  const [leftItems, setLeftItems] = useState(initial.left_items);
  const [rightItems, setRightItems] = useState(initial.right_items);
  const [answerKey, setAnswerKey] = useState<Record<string, string>>(initial.answer_key);

  const rowCount = leftItems.length;

  useEffect(() => {
    onChange({
      bac_type: "kombinieren",
      left_items: leftItems,
      right_items: rightItems,
      answer_key: answerKey,
    });
  }, [leftItems, rightItems, answerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLeft = (index: number, text: string) => {
    setLeftItems((prev) => prev.map((item, i) => (i === index ? { ...item, text } : item)));
  };

  const updateRight = (index: number, text: string) => {
    setRightItems((prev) => prev.map((item, i) => (i === index ? { ...item, text } : item)));
  };

  const updateAnswer = (leftLabel: string, rightLabel: string) => {
    setAnswerKey((prev) => ({ ...prev, [leftLabel]: rightLabel }));
  };

  const addRow = () => {
    if (rowCount >= 6) return;
    const nextLeftLabel = LEFT_LABELS[rowCount];
    const nextRightLabel = RIGHT_LABELS[rowCount];
    setLeftItems((prev) => [...prev, { label: nextLeftLabel, text: "" }]);
    setRightItems((prev) => [...prev, { label: nextRightLabel, text: "" }]);
    setAnswerKey((prev) => ({ ...prev, [nextLeftLabel]: nextRightLabel }));
  };

  const badgeStyle = (bg: string) => ({
    ...FONT,
    width: 24,
    height: 24,
    minWidth: 24,
    background: bg,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    color: "#fff",
    fontWeight: 700,
    fontSize: "11px",
  } as React.CSSProperties);

  return (
    <div style={FONT} className="space-y-4">
      {/* Two-column matching grid */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div>
            <p className="font-semibold text-foreground/80 mb-2" style={FONT}>
              Colonne gauche
            </p>
            <div className="space-y-2">
              {leftItems.map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span style={badgeStyle("#6C4CE0")}>{item.label}</span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateLeft(i, e.target.value)}
                    placeholder={`Élément ${item.label}…`}
                    className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
                    style={FONT}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div>
            <p className="font-semibold text-foreground/80 mb-2" style={FONT}>
              Colonne droite
            </p>
            <div className="space-y-2">
              {rightItems.map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span style={badgeStyle("#0FB6A3")}>{item.label}</span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateRight(i, e.target.value)}
                    placeholder={`Élément ${item.label}…`}
                    className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
                    style={FONT}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add row button */}
        <button
          type="button"
          onClick={addRow}
          disabled={rowCount >= 6}
          className="mt-4 w-full rounded-xl border-2 border-dashed border-border py-2 font-semibold text-foreground/50 hover:border-[#6C4CE0] hover:text-[#6C4CE0] transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={FONT}
        >
          + Ajouter une ligne {rowCount >= 6 && "(max 6)"}
        </button>
      </div>

      {/* Answer key */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
        <p className="font-semibold text-foreground/80 mb-3" style={FONT}>
          Réponses correctes (corrigé)
        </p>

        <div className="space-y-2">
          {leftItems.map((leftItem) => (
            <div key={leftItem.label} className="flex items-center gap-3">
              <span style={badgeStyle("#6C4CE0")}>{leftItem.label}</span>
              <span className="text-foreground/50 mx-1" style={FONT}>
                →
              </span>
              <select
                value={answerKey[leftItem.label] ?? ""}
                onChange={(e) => updateAnswer(leftItem.label, e.target.value)}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
                style={FONT}
              >
                {rightItems.map((rightItem) => (
                  <option key={rightItem.label} value={rightItem.label}>
                    {rightItem.label}
                    {rightItem.text ? ` — ${rightItem.text.slice(0, 30)}` : ""}
                  </option>
                ))}
              </select>

              {/* Preview of selected right item text */}
              {answerKey[leftItem.label] && (
                <span className="text-foreground/40 italic" style={FONT}>
                  {rightItems.find((r) => r.label === answerKey[leftItem.label])?.text?.slice(0, 40) || ""}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminKombinierenEditor;
