"use client";

import { useState, useEffect } from "react";
import type { RichtigFalschContent } from "@/lib/bac-types";

interface AdminRichtigFalschEditorProps {
  value: RichtigFalschContent;
  onChange: (value: RichtigFalschContent) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const emptyStatement = () => ({
  text: "",
  is_richtig: true,
  zitat: "",
  points: 1.75,
});

export function AdminRichtigFalschEditor({
  value,
  onChange,
}: AdminRichtigFalschEditorProps) {
  const [statements, setStatements] = useState(
    value.statements.length > 0
      ? value.statements
      : [emptyStatement(), emptyStatement(), emptyStatement(), emptyStatement()]
  );

  useEffect(() => {
    onChange({ bac_type: "richtig_falsch_zitat", statements });
  }, [statements]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (index: number, patch: Partial<(typeof statements)[number]>) => {
    setStatements((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const remove = (index: number) => {
    setStatements((prev) => prev.filter((_, i) => i !== index));
  };

  const add = () => {
    if (statements.length >= 4) return;
    setStatements((prev) => [...prev, emptyStatement()]);
  };

  return (
    <div style={FONT} className="space-y-3">
      {statements.map((stmt, i) => {
        const isRichtig = stmt.is_richtig;
        const borderColor = isRichtig ? "#22c55e" : "#FF5A5F";

        return (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card shadow-sm p-5"
            style={{ borderLeftWidth: "4px", borderLeftColor: borderColor }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center rounded-full text-white font-bold"
                  style={{
                    ...FONT,
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    background: borderColor,
                    fontSize: "11px",
                  }}
                >
                  {i + 1}
                </span>
                <span className="font-semibold text-foreground/70" style={FONT}>
                  Aussage {i + 1}
                </span>
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                className="flex items-center justify-center rounded-full border border-border text-foreground/40 hover:text-[#FF5A5F] hover:border-[#FF5A5F] transition"
                style={{ width: 24, height: 24, ...FONT }}
                title="Supprimer"
              >
                ✕
              </button>
            </div>

            {/* Phrase input */}
            <div className="mb-3">
              <label className="block mb-1 font-semibold text-foreground/80" style={FONT}>
                Phrase
              </label>
              <input
                type="text"
                value={stmt.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="Die Aussage auf Deutsch…"
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
                style={FONT}
              />
            </div>

            {/* R / F toggle */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-foreground/80 mr-1" style={FONT}>
                Réponse :
              </span>
              <button
                type="button"
                onClick={() => update(i, { is_richtig: true })}
                className="rounded-lg px-4 py-1 font-bold border transition"
                style={{
                  ...FONT,
                  background: isRichtig ? "#22c55e" : "transparent",
                  color: isRichtig ? "#fff" : "#22c55e",
                  borderColor: "#22c55e",
                }}
              >
                R
              </button>
              <button
                type="button"
                onClick={() => update(i, { is_richtig: false })}
                className="rounded-lg px-4 py-1 font-bold border transition"
                style={{
                  ...FONT,
                  background: !isRichtig ? "#FF5A5F" : "transparent",
                  color: !isRichtig ? "#fff" : "#FF5A5F",
                  borderColor: "#FF5A5F",
                }}
              >
                F
              </button>
            </div>

            {/* Zitat */}
            <div className="mb-3">
              <label className="block mb-1 font-semibold text-foreground/80" style={FONT}>
                Zitat <span className="font-normal text-foreground/50">(référence du texte)</span>
              </label>
              <textarea
                value={stmt.zitat}
                onChange={(e) => update(i, { zitat: e.target.value })}
                placeholder="Passage du texte justifiant la réponse…"
                rows={2}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 resize-none"
                style={FONT}
              />
            </div>

            {/* Points */}
            <div className="flex items-center gap-2">
              <label className="font-semibold text-foreground/80" style={FONT}>
                Points :
              </label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={stmt.points}
                onChange={(e) => update(i, { points: parseFloat(e.target.value) || 0 })}
                className="w-20 rounded-xl border border-border bg-secondary/40 px-3 py-1 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 text-center"
                style={FONT}
              />
            </div>
          </div>
        );
      })}

      {/* Add button */}
      <button
        type="button"
        onClick={add}
        disabled={statements.length >= 4}
        className="w-full rounded-2xl border-2 border-dashed border-border py-3 font-semibold text-foreground/50 hover:border-[#6C4CE0] hover:text-[#6C4CE0] transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={FONT}
      >
        + Ajouter une phrase
      </button>
    </div>
  );
}

export default AdminRichtigFalschEditor;
