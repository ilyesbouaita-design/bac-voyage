import React from "react";

// ---------------------------------------------------------------------------
// SectionNav
// A pill-bar for switching between exam sections (Textverständnis / Sprachfähigkeit).
// Active pill: filled with section color. Inactive: outlined.
// ---------------------------------------------------------------------------

interface SectionNavProps {
  sections: Array<{ id: string; label: string; color: string }>;
  activeSection: string;
  onSectionClick: (id: string) => void;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

export function SectionNav({ sections, activeSection, onSectionClick }: SectionNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Sections de l'examen"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "8px 0",
        alignItems: "center",
      }}
    >
      {sections.map((section) => {
        const isActive = section.id === activeSection;
        return (
          <button
            key={section.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSectionClick(section.id)}
            style={{
              ...BASE_FONT,
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 14px",
              borderRadius: "999px",
              border: `1.5px solid ${section.color}`,
              cursor: "pointer",
              // Active: filled; inactive: outlined
              backgroundColor: isActive ? section.color : "transparent",
              color: isActive ? "#ffffff" : section.color,
              fontWeight: isActive ? "bold" : "normal",
              transition: "background-color 0.18s ease, color 0.18s ease",
              outline: "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  section.color + "1a"; // ~10% opacity tint
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }
            }}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}

export default SectionNav;
