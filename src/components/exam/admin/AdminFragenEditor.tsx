"use client";

import { useState, useEffect } from "react";
import type { FragenZumTextContent } from "@/lib/bac-types";

interface QuestionEntry {
  id: string;
  content: FragenZumTextContent;
  points: number;
}

interface AdminFragenEditorProps {
  questions: QuestionEntry[];
  onChange: (questions: QuestionEntry[]) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const newEntry = (): QuestionEntry => ({
  id: crypto.randomUUID(),
  content: {
    bac_type: "fragen_zum_text",
    question: "",
    reference_answer: "",
  },
  points: 2,
});

export function AdminFragenEditor({ questions, onChange }: AdminFragenEditorProps) {
  const [entries, setEntries] = useState<QuestionEntry[]>(
    questions.length > 0 ? questions : [newEntry()]
  );

  useEffect(() => {
    onChange(entries);
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateEntry = (id: string, patch: Partial<QuestionEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const updateContent = (
    id: string,
    patch: Partial<FragenZumTextContent>
  ) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, content: { ...e.content, ...patch } } : e
      )
    );
  };

  const remove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const add = () => {
    setEntries((prev) => [...prev, newEntry()]);
  };

  return (
    <div style={FONT} className="space-y-3">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="rounded-2xl border border-border bg-card shadow-sm p-5"
          style={{ borderLeftWidth: "4px", borderLeftColor: "#6C4CE0" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  ...FONT,
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  background: "#6C4CE0",
                  fontSize: "11px",
                }}
              >
                {i + 1}
              </span>
              <span className="font-semibold text-foreground/70" style={FONT}>
                Question {i + 1}
              </span>
            </div>

            <button
              type="button"
              onClick={() => remove(entry.id)}
              className="flex items-center justify-center rounded-full border border-border text-foreground/40 hover:text-[#FF5A5F] hover:border-[#FF5A5F] transition"
              style={{ width: 24, height: 24, ...FONT }}
              title="Supprimer"
            >
              ✕
            </button>
          </div>

          {/* Frage */}
          <div className="mb-3">
            <label className="block mb-1 font-semibold text-foreground/80" style={FONT}>
              Frage <span className="font-normal text-foreground/50">(DE)</span>
            </label>
            <input
              type="text"
              value={entry.content.question}
              onChange={(e) => updateContent(entry.id, { question: e.target.value })}
              placeholder="Die Frage auf Deutsch…"
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
              style={FONT}
            />
          </div>

          {/* Reference answer */}
          <div className="mb-3">
            <label className="block mb-1 font-semibold text-foreground/80" style={FONT}>
              Musterantwort{" "}
              <span className="font-normal text-foreground/50">(référence)</span>
            </label>
            <textarea
              value={entry.content.reference_answer}
              onChange={(e) =>
                updateContent(entry.id, { reference_answer: e.target.value })
              }
              placeholder="Réponse modèle ou éléments attendus…"
              rows={3}
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
              step={0.5}
              value={entry.points}
              onChange={(e) =>
                updateEntry(entry.id, { points: parseFloat(e.target.value) || 0 })
              }
              className="w-20 rounded-xl border border-border bg-secondary/40 px-3 py-1 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15 text-center"
              style={FONT}
            />
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-2xl border-2 border-dashed border-border py-3 font-semibold text-foreground/50 hover:border-[#6C4CE0] hover:text-[#6C4CE0] transition"
        style={FONT}
      >
        + Ajouter une question
      </button>
    </div>
  );
}

export default AdminFragenEditor;
