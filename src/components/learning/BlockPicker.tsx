import { useEffect, useRef } from "react";
import { BLOCK_TYPES, BlockTypeInfo, ContentBlockType } from "../../lib/learning-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockPickerProps {
  onSelect: (type: ContentBlockType) => void;
  onClose: () => void;
  locale: "fr" | "ar";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const exerciseTypes: BlockTypeInfo[] = BLOCK_TYPES.filter(
  (b) => b.category === "exercise",
);
const mediaTypes: BlockTypeInfo[] = BLOCK_TYPES.filter(
  (b) => b.category === "media",
);

// ---------------------------------------------------------------------------
// Single block type card
// ---------------------------------------------------------------------------

interface BlockCardProps {
  info: BlockTypeInfo;
  locale: "fr" | "ar";
  onClick: () => void;
}

function BlockCard({ info, locale, onClick }: BlockCardProps) {
  const label = locale === "ar" ? info.label_ar : info.label_fr;
  const isRtl = locale === "ar";

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
        padding: "10px 12px",
        background: "#fff",
        border: `1px solid #e5e7eb`,
        borderLeft: `4px solid ${info.color}`,
        borderRadius: 8,
        cursor: "pointer",
        textAlign: isRtl ? "right" : "left",
        direction: isRtl ? "rtl" : "ltr",
        transition: "box-shadow 0.15s, border-color 0.15s, transform 0.1s",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.1)`;
        el.style.borderColor = info.color;
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = "none";
        el.style.borderLeftColor = info.color;
        el.style.borderTopColor = "#e5e7eb";
        el.style.borderRightColor = "#e5e7eb";
        el.style.borderBottomColor = "#e5e7eb";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 22, lineHeight: 1 }}>{info.icon}</span>

      {/* Label */}
      <span
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          color: "#374151",
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}
      >
        {label}
      </span>

      {/* Color dot */}
      <span
        style={{
          position: "absolute",
          top: 6,
          right: isRtl ? "auto" : 6,
          left: isRtl ? 6 : "auto",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: info.color,
          opacity: 0.6,
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section header inside the modal
// ---------------------------------------------------------------------------

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          fontWeight: 700,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          background: "#f3f4f6",
          color: "#6b7280",
          borderRadius: 999,
          padding: "1px 8px",
        }}
      >
        {count}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockPicker modal
// ---------------------------------------------------------------------------

export default function BlockPicker({ onSelect, onClose, locale }: BlockPickerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";

  // Trap focus + close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    // Focus first focusable element
    const first = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Click-outside to close
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const exerciseLabel = locale === "ar" ? "التمارين" : "Exercices";
  const mediaLabel = locale === "ar" ? "الوسائط" : "Médias";
  const titleLabel =
    locale === "ar" ? "اختر نوع الكتلة" : "Choisir un type de bloc";

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={titleLabel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Modal panel */}
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #f3f4f6",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              {titleLabel}
            </h2>
            <p
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                color: "#6b7280",
                margin: "3px 0 0",
              }}
            >
              {locale === "ar"
                ? "اختر نوع المحتوى لإضافته إلى الوحدة"
                : "Sélectionnez le type de contenu à ajouter à l'unité"}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={locale === "ar" ? "إغلاق" : "Fermer"}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 16,
              color: "#374151",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "#f3f4f6";
            }}
          >
            ✕
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Scrollable body                                                  */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            overflowY: "auto",
            padding: "20px 20px 24px",
            flex: 1,
          }}
        >
          {/* Exercises section */}
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label={exerciseLabel} count={exerciseTypes.length} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {exerciseTypes.map((info) => (
                <BlockCard
                  key={info.type}
                  info={info}
                  locale={locale}
                  onClick={() => onSelect(info.type)}
                />
              ))}
            </div>
          </section>

          {/* Media section */}
          <section>
            <SectionHeader label={mediaLabel} count={mediaTypes.length} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
            >
              {mediaTypes.map((info) => (
                <BlockCard
                  key={info.type}
                  info={info}
                  locale={locale}
                  onClick={() => onSelect(info.type)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#6b7280",
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "6px 16px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "none";
            }}
          >
            {locale === "ar" ? "إلغاء" : "Annuler"}
          </button>
        </div>
      </div>

      {/* Responsive grid adjustment */}
      <style>{`
        @media (max-width: 600px) {
          .block-picker-exercise-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .block-picker-media-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
