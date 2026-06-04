"use client";

import React from "react";
import type { UebersetzungContent } from "@/lib/bac-types";

interface AdminUebersetzungEditorProps {
  value: UebersetzungContent;
  onChange: (value: UebersetzungContent) => void;
}

const FONT = { fontFamily: "'Times New Roman', Georgia, serif", fontSize: "12px" } as const;

const inputCls =
  "w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[12px] outline-none transition focus:border-[#6C4CE0] focus:ring-4 focus:ring-[#6C4CE0]/15";

export function AdminUebersetzungEditor({
  value,
  onChange,
}: AdminUebersetzungEditorProps) {
  function handleGermanChange(newVal: string) {
    onChange({ ...value, german_sentence: newVal });
  }

  function handleTranslationChange(index: number, newVal: string) {
    const updated = value.accepted_translations.map((t, i) => (i === index ? newVal : t));
    onChange({ ...value, accepted_translations: updated });
  }

  function handleAddTranslation() {
    onChange({ ...value, accepted_translations: [...value.accepted_translations, ""] });
  }

  function handleRemoveTranslation(index: number) {
    onChange({
      ...value,
      accepted_translations: value.accepted_translations.filter((_, i) => i !== index),
    });
  }

  return (
    <div style={FONT} className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#0FB6A3", fontFamily: FONT.fontFamily }}
        >
          Übersetzung
        </span>
        <span className="text-[12px] text-muted-foreground" style={FONT}>
          Traduction DE → AR
        </span>
      </div>

      {/* German sentence */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-medium" style={FONT}>
            Phrase en allemand
          </label>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white tracking-wide"
            style={{ backgroundColor: "#0FB6A3", fontFamily: FONT.fontFamily, fontSize: "10px" }}
          >
            DE
          </span>
        </div>
        <textarea
          className={
            "w-full rounded-xl border border-[#0FB6A3]/40 bg-[#0FB6A3]/5 px-3 py-2 text-[12px] outline-none transition focus:border-[#0FB6A3] focus:ring-4 focus:ring-[#0FB6A3]/15 resize-none"
          }
          rows={3}
          value={value.german_sentence}
          onChange={(e) => handleGermanChange(e.target.value)}
          placeholder="Saisir la phrase allemande…"
          style={{ ...FONT, direction: "ltr" }}
          lang="de"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Arabic translations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-medium" style={FONT}>
            Traductions acceptées
          </label>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white tracking-wide"
            style={{ backgroundColor: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "10px" }}
          >
            العربية
          </span>
        </div>

        <div className="space-y-2">
          {value.accepted_translations.map((translation, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                className={inputCls + " resize-none flex-1"}
                rows={2}
                value={translation}
                onChange={(e) => handleTranslationChange(i, e.target.value)}
                placeholder={`ترجمة ${i + 1}`}
                dir="rtl"
                lang="ar"
                style={{ ...FONT, textAlign: "right" }}
              />
              <button
                type="button"
                onClick={() => handleRemoveTranslation(i)}
                className="mt-1 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddTranslation}
          className="text-[12px] font-medium transition hover:opacity-80"
          style={{ color: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "12px" }}
        >
          + Ajouter une traduction
        </button>
      </div>

      {/* AI correction note */}
      <div
        className="rounded-xl px-4 py-3 space-y-1"
        style={{ backgroundColor: "#6C4CE015", border: "1px solid #6C4CE030" }}
      >
        <p
          className="text-[12px] font-semibold"
          style={{ color: "#6C4CE0", fontFamily: FONT.fontFamily, fontSize: "12px" }}
        >
          🤖 Correction par IA — comparaison sémantique
        </p>
        <p
          className="text-[11px] text-muted-foreground"
          style={{ fontFamily: FONT.fontFamily, fontSize: "11px" }}
        >
          L'IA comparera la traduction de l'étudiant avec vos références. Les réponses
          sémantiquement proches seront acceptées même si la formulation diffère légèrement.
        </p>
      </div>
    </div>
  );
}

export default AdminUebersetzungEditor;
