"use client";

import { useState, useEffect } from "react";
import type { TitelContent } from "@/lib/bac-types";

interface AdminTitelEditorProps {
  value: TitelContent;
  onChange: (value: TitelContent) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

export function AdminTitelEditor({ value, onChange }: AdminTitelEditorProps) {
  const [titles, setTitles] = useState<string[]>(
    value.accepted_titles.length > 0 ? value.accepted_titles : [""]
  );

  useEffect(() => {
    onChange({ bac_type: "titel", accepted_titles: titles.filter((t) => t.trim() !== "") });
  }, [titles]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTitle = (index: number, text: string) => {
    setTitles((prev) => prev.map((t, i) => (i === index ? text : t)));
  };

  const removeTitle = (index: number) => {
    setTitles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [""] : next;
    });
  };

  const addTitle = () => {
    setTitles((prev) => [...prev, ""]);
  };

  return (
    <div style={FONT} className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-foreground mb-0.5" style={FONT}>
          Titres acceptés
        </h3>
        <p className="text-foreground/50 italic" style={FONT}>
          Ajoutez les titres que vous considérez corrects.
        </p>
      </div>

      {/* Title inputs */}
      <div className="space-y-2">
        {titles.map((title, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Number badge */}
            <span
              className="flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
              style={{
                ...FONT,
                width: 24,
                height: 24,
                minWidth: 24,
                background: "#FFB200",
                fontSize: "11px",
              }}
            >
              {i + 1}
            </span>

            <input
              type="text"
              value={title}
              onChange={(e) => updateTitle(i, e.target.value)}
              placeholder={`Titre accepté ${i + 1}…`}
              className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15"
              style={FONT}
            />

            {/* Remove button — only show if more than 1 title */}
            {titles.length > 1 && (
              <button
                type="button"
                onClick={() => removeTitle(i)}
                className="flex items-center justify-center rounded-full border border-border text-foreground/40 hover:text-[#FF5A5F] hover:border-[#FF5A5F] transition flex-shrink-0"
                style={{ width: 24, height: 24, ...FONT }}
                title="Supprimer"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add title button */}
      <button
        type="button"
        onClick={addTitle}
        className="w-full rounded-2xl border-2 border-dashed border-border py-2.5 font-semibold text-foreground/50 hover:border-[#6C4CE0] hover:text-[#6C4CE0] transition"
        style={FONT}
      >
        + Ajouter un titre
      </button>

      {/* Info note */}
      <div
        className="flex items-start gap-2 rounded-xl px-4 py-3"
        style={{ background: "#6C4CE0" + "15", borderLeft: "3px solid #6C4CE0" }}
      >
        <span style={{ color: "#6C4CE0", fontSize: "14px", lineHeight: 1 }}>ℹ</span>
        <p style={{ ...FONT, color: "#6C4CE0" }} className="font-medium">
          L&apos;IA acceptera aussi les titres sémantiquement proches.
        </p>
      </div>
    </div>
  );
}

export default AdminTitelEditor;
