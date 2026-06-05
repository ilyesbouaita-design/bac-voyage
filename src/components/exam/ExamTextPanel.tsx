import React, { useState, useRef, useCallback, useEffect } from "react";
import type { VocabEntry } from "../../lib/bac-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExamTextPanelProps {
  passage: string;
  vocab: VocabEntry[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  mode: "docked" | "floating";
  onToggleMode: () => void;
}

interface FloatPosition {
  x: number;
  y: number;
}

interface FloatSize {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

// ---------------------------------------------------------------------------
// Text Content (shared between docked and floating)
// ---------------------------------------------------------------------------

function TextContent({
  passage,
  vocab,
  fontSize,
}: {
  passage: string;
  vocab: VocabEntry[];
  fontSize?: number;
}) {
  return (
    <div
      style={{
        ...BASE_FONT,
        overflowY: "auto",
        flex: 1,
        padding: "0 12px 12px 12px",
        minHeight: 0,
      }}
    >
      {/* Passage */}
      <p
        style={{
          ...BASE_FONT,
          fontSize: fontSize ? fontSize + "px" : BASE_FONT.fontSize,
          lineHeight: "1.75",
          whiteSpace: "pre-wrap",
          margin: 0,
          color: "#1a1a2e",
        }}
      >
        {passage}
      </p>

      {/* Vocabulary section */}
      {vocab.length > 0 && (
        <div style={{ marginTop: "16px", borderTop: "1px solid #e2e0f0", paddingTop: "10px" }}>
          <p
            style={{
              ...BASE_FONT,
              fontWeight: "bold",
              margin: "0 0 6px 0",
              color: "#6c4fc5",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Vocabulaire / المفردات
          </p>
          <table style={{ ...BASE_FONT, width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Deutsch", "Français", "العربية"].map((h) => (
                  <th
                    key={h}
                    style={{
                      ...BASE_FONT,
                      textAlign: "left",
                      paddingBottom: "4px",
                      borderBottom: "1px solid #e2e0f0",
                      fontWeight: "bold",
                      color: "#555",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vocab.map((v, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0eef8" }}>
                  <td style={{ ...BASE_FONT, padding: "3px 4px 3px 0", fontStyle: "italic" }}>
                    {v.german}
                  </td>
                  <td style={{ ...BASE_FONT, padding: "3px 4px" }}>{v.french}</td>
                  <td
                    style={{
                      ...BASE_FONT,
                      padding: "3px 0 3px 4px",
                      direction: "rtl",
                      textAlign: "right",
                    }}
                  >
                    {v.arabic}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel Header (docked variant)
// ---------------------------------------------------------------------------

function DockedHeader({
  collapsed,
  onToggleCollapse,
  onToggleMode,
  fontSize,
  setFontSize,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMode: () => void;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: collapsed ? "none" : "1px solid #e2e0f0",
        backgroundColor: "#f8f7fd",
        flexShrink: 0,
      }}
    >
      {/* Left: label + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            ...BASE_FONT,
            fontWeight: "bold",
            color: "#6c4fc5",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Text
        </span>
        <span
          style={{
            ...BASE_FONT,
            backgroundColor: "#6c4fc5",
            color: "#fff",
            borderRadius: "3px",
            padding: "1px 5px",
            fontWeight: "bold",
          }}
        >
          DE
        </span>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {/* Zoom out button */}
        <button
          onClick={() => setFontSize((s) => Math.max(10, s - 1))}
          title="Réduire la taille du texte"
          disabled={fontSize <= 10}
          style={{
            ...BASE_FONT,
            border: "1px solid #c4b8e8",
            borderRadius: "4px",
            background: "#fff",
            cursor: fontSize <= 10 ? "not-allowed" : "pointer",
            padding: "0 6px",
            color: fontSize <= 10 ? "#c4b8e8" : "#6c4fc5",
            height: "24px",
            lineHeight: 1,
            opacity: fontSize <= 10 ? 0.5 : 1,
          }}
        >
          A-
        </button>

        {/* Zoom in button */}
        <button
          onClick={() => setFontSize((s) => Math.min(22, s + 1))}
          title="Augmenter la taille du texte"
          disabled={fontSize >= 22}
          style={{
            ...BASE_FONT,
            border: "1px solid #c4b8e8",
            borderRadius: "4px",
            background: "#fff",
            cursor: fontSize >= 22 ? "not-allowed" : "pointer",
            padding: "0 6px",
            color: fontSize >= 22 ? "#c4b8e8" : "#6c4fc5",
            height: "24px",
            lineHeight: 1,
            opacity: fontSize >= 22 ? 0.5 : 1,
          }}
        >
          A+
        </button>

        {/* Float button */}
        <button
          onClick={onToggleMode}
          title="Mode fenêtre flottante"
          style={{
            ...BASE_FONT,
            border: "1px solid #c4b8e8",
            borderRadius: "4px",
            background: "#fff",
            cursor: "pointer",
            padding: "2px 6px",
            color: "#6c4fc5",
            lineHeight: 1,
          }}
        >
          &#x2750;
        </button>

        {/* Collapse / expand button */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Afficher le texte" : "Masquer le texte"}
          style={{
            ...BASE_FONT,
            border: "1px solid #c4b8e8",
            borderRadius: "4px",
            background: "#fff",
            cursor: "pointer",
            padding: "2px 8px",
            color: "#6c4fc5",
          }}
        >
          {collapsed ? "Afficher" : "Masquer"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Docked panel
// ---------------------------------------------------------------------------

function DockedPanel({
  passage,
  vocab,
  collapsed,
  onToggleCollapse,
  onToggleMode,
}: {
  passage: string;
  vocab: VocabEntry[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMode: () => void;
}) {
  const [fontSize, setFontSize] = useState(12);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "var(--card, #ffffff)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {collapsed ? (
        /* Collapsed: vertical "Text" label strip */
        <div
          style={{
            width: "36px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backgroundColor: "#f8f7fd",
          }}
          onClick={onToggleCollapse}
          title="Afficher le texte"
        >
          <span
            style={{
              ...BASE_FONT,
              fontWeight: "bold",
              color: "#6c4fc5",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            Text DE
          </span>
        </div>
      ) : (
        <>
          <DockedHeader
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            onToggleMode={onToggleMode}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
          <TextContent passage={passage} vocab={vocab} fontSize={fontSize} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating panel
// ---------------------------------------------------------------------------

function FloatingPanel({
  passage,
  vocab,
  onToggleMode,
}: {
  passage: string;
  vocab: VocabEntry[];
  onToggleMode: () => void;
}) {
  const [position, setPosition] = useState<FloatPosition>({ x: 24, y: 24 });
  const [size, setSize] = useState<FloatSize>({ width: 350, height: 400 });
  const [minimized, setMinimized] = useState(false);

  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 350, h: 400 });
  const panelRef = useRef<HTMLDivElement>(null);

  // ---------- Drag (title bar) ----------
  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  const onTitleTouchStart = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    const touch = e.touches[0];
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.current.x),
          y: Math.max(0, e.clientY - dragOffset.current.y),
        });
      }
      if (resizing.current) {
        setSize({
          width: Math.max(220, resizeStart.current.w + (e.clientX - resizeStart.current.x)),
          height: Math.max(160, resizeStart.current.h + (e.clientY - resizeStart.current.y)),
        });
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (dragging.current) {
        setPosition({
          x: Math.max(0, touch.clientX - dragOffset.current.x),
          y: Math.max(0, touch.clientY - dragOffset.current.y),
        });
      }
      if (resizing.current) {
        setSize({
          width: Math.max(220, resizeStart.current.w + (touch.clientX - resizeStart.current.x)),
          height: Math.max(160, resizeStart.current.h + (touch.clientY - resizeStart.current.y)),
        });
      }
    };
    const onUp = () => {
      dragging.current = false;
      resizing.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  // ---------- Resize handle ----------
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
  }, [size]);

  // ---------- Render ----------
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 300,
          ...BASE_FONT,
          backgroundColor: "#6c4fc5",
          color: "#fff",
          border: "none",
          borderRadius: "20px",
          padding: "6px 14px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(108,79,197,0.35)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
        title="Afficher le texte"
      >
        <span>&#128196;</span>
        <span>Text</span>
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 250,
        backgroundColor: "#ffffff",
        border: "1.5px solid #c4b8e8",
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(108,79,197,0.18)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Title bar — drag handle */}
      <div
        onMouseDown={onTitleMouseDown}
        onTouchStart={onTitleTouchStart}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          backgroundColor: "#6c4fc5",
          cursor: "grab",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ ...BASE_FONT, color: "#fff", fontWeight: "bold" }}>Text</span>
          <span style={{ ...BASE_FONT, color: "#d4c8f8" }}>&#127465;&#127466;</span>
        </div>

        {/* Controls */}
        <div
          style={{ display: "flex", gap: "4px" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Minimize */}
          <button
            onClick={() => setMinimized(true)}
            title="Réduire"
            style={floatBtnStyle}
          >
            &#8212;
          </button>
          {/* Dock */}
          <button
            onClick={onToggleMode}
            title="Ancrer le panneau"
            style={floatBtnStyle}
          >
            &#x2750;
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <TextContent passage={passage} vocab={vocab} />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "16px",
          height: "16px",
          cursor: "se-resize",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "2px",
          color: "#c4b8e8",
          fontSize: "10px",
          userSelect: "none",
        }}
        title="Redimensionner"
      >
        &#8689;
      </div>
    </div>
  );
}

const floatBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  borderRadius: "3px",
  color: "#fff",
  cursor: "pointer",
  padding: "1px 6px",
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
  lineHeight: 1.4,
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ExamTextPanel({
  passage,
  vocab,
  collapsed,
  onToggleCollapse,
  mode,
  onToggleMode,
}: ExamTextPanelProps) {
  if (mode === "floating") {
    return (
      <FloatingPanel
        passage={passage}
        vocab={vocab}
        onToggleMode={onToggleMode}
      />
    );
  }

  return (
    <DockedPanel
      passage={passage}
      vocab={vocab}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onToggleMode={onToggleMode}
    />
  );
}

export default ExamTextPanel;
