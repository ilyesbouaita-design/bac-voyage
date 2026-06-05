"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";

/* ─────────────────────────────────────────────────────────────
   Types & constants
───────────────────────────────────────────────────────────── */

interface KombinierenCardProps {
  left_items: Array<{ label: string; text: string }>;
  right_items: Array<{ label: string; text: string }>;
  answer_key: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  showResults?: boolean;
}

const FONT_STYLE: CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

const PAIR_COLORS = [
  "#6C4CE0",
  "#0FB6A3",
  "#FFB200",
  "#FF5A5F",
  "#8B5CF6",
  "#16a34a",
];

/** Compute a hex color with reduced opacity as an rgba string */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ─────────────────────────────────────────────────────────────
   Arrow coordinate shape
───────────────────────────────────────────────────────────── */

interface ArrowCoords {
  leftLabel: string;
  rightLabel: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  colorId: string; // safe id for marker
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */

export function KombinierenCard({
  left_items,
  right_items,
  answer_key,
  onAnswersChange,
  showResults = false,
}: KombinierenCardProps) {
  // connections: left label → right label
  const [connections, setConnections] = useState<Record<string, string>>({});
  // which left item is currently selected (awaiting a right-item click)
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  // computed SVG arrow coordinates
  const [arrows, setArrows] = useState<ArrowCoords[]>([]);

  // Refs for measuring DOM positions
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ── notify parent whenever connections change ── */
  useEffect(() => {
    onAnswersChange(connections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  /* ── assign a stable color to each left label (ordered by insertion) ── */
  const colorMap = useRef<Record<string, string>>({});

  function getOrAssignColor(leftLabel: string): string {
    if (!colorMap.current[leftLabel]) {
      const usedCount = Object.keys(colorMap.current).length;
      colorMap.current[leftLabel] =
        PAIR_COLORS[usedCount % PAIR_COLORS.length];
    }
    return colorMap.current[leftLabel];
  }

  /* ── recompute arrow coordinates ── */
  const recalcArrows = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newArrows: ArrowCoords[] = [];

    Object.entries(connections).forEach(([leftLabel, rightLabel]) => {
      const leftIdx = left_items.findIndex((i) => i.label === leftLabel);
      const rightIdx = right_items.findIndex((i) => i.label === rightLabel);

      if (leftIdx === -1 || rightIdx === -1) return;

      const leftEl = leftRefs.current[leftIdx];
      const rightEl = rightRefs.current[rightIdx];

      if (!leftEl || !rightEl) return;

      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();

      const x1 = lr.right - containerRect.left;
      const y1 = lr.top + lr.height / 2 - containerRect.top;
      const x2 = rr.left - containerRect.left;
      const y2 = rr.top + rr.height / 2 - containerRect.top;

      let color = getOrAssignColor(leftLabel);

      if (showResults) {
        color =
          answer_key[leftLabel] === rightLabel ? "#16a34a" : "#E85D50";
      }

      newArrows.push({
        leftLabel,
        rightLabel,
        x1,
        y1,
        x2,
        y2,
        color,
        colorId: color.replace("#", "c"),
      });
    });

    setArrows(newArrows);
  }, [connections, left_items, right_items, showResults, answer_key]);

  useEffect(() => {
    recalcArrows();
    window.addEventListener("resize", recalcArrows);
    return () => window.removeEventListener("resize", recalcArrows);
  }, [recalcArrows]);

  /* ── click handlers ── */
  const handleLeftClick = useCallback(
    (label: string) => {
      if (showResults) return;

      // clicking a connected left item → remove that connection
      if (connections[label]) {
        setConnections((prev) => {
          const next = { ...prev };
          delete next[label];
          return next;
        });
        delete colorMap.current[label];
        setSelectedLeft(null);
        return;
      }

      // toggle selection
      setSelectedLeft((prev) => (prev === label ? null : label));
    },
    [connections, showResults]
  );

  const handleRightClick = useCallback(
    (label: string) => {
      if (showResults) return;

      // clicking a right item that's already connected → remove that connection
      const existingLeft = Object.entries(connections).find(
        ([, r]) => r === label
      )?.[0];
      if (existingLeft) {
        setConnections((prev) => {
          const next = { ...prev };
          delete next[existingLeft];
          return next;
        });
        delete colorMap.current[existingLeft];
        setSelectedLeft(null);
        return;
      }

      // only act if a left item is selected
      if (!selectedLeft) return;

      // create the connection
      getOrAssignColor(selectedLeft);
      setConnections((prev) => ({ ...prev, [selectedLeft]: label }));
      setSelectedLeft(null);
    },
    [connections, selectedLeft, showResults]
  );

  /* ── helpers for styling ── */
  function getLeftColor(label: string): string | undefined {
    return connections[label] ? colorMap.current[label] : undefined;
  }

  function getRightConnectedLeftLabel(rightLabel: string): string | undefined {
    return Object.entries(connections).find(([, r]) => r === rightLabel)?.[0];
  }

  function getRightColor(rightLabel: string): string | undefined {
    const ll = getRightConnectedLeftLabel(rightLabel);
    return ll ? colorMap.current[ll] : undefined;
  }

  /* ── showResults helpers ── */
  function resultColorLeft(label: string): string | undefined {
    if (!showResults) return undefined;
    if (!connections[label]) return undefined;
    return answer_key[label] === connections[label] ? "#16a34a" : "#E85D50";
  }

  function resultColorRight(rightLabel: string): string | undefined {
    if (!showResults) return undefined;
    const ll = getRightConnectedLeftLabel(rightLabel);
    if (!ll) return undefined;
    return answer_key[ll] === rightLabel ? "#16a34a" : "#E85D50";
  }

  /* ── missing connections for showResults ── */
  const missingArrows: ArrowCoords[] = [];

  if (showResults) {
    Object.entries(answer_key).forEach(([leftLabel, correctRight]) => {
      if (!connections[leftLabel]) {
        const leftIdx = left_items.findIndex((i) => i.label === leftLabel);
        const rightIdx = right_items.findIndex(
          (i) => i.label === correctRight
        );
        if (leftIdx === -1 || rightIdx === -1) return;
        const leftEl = leftRefs.current[leftIdx];
        const rightEl = rightRefs.current[rightIdx];
        if (!leftEl || !rightEl || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const lr = leftEl.getBoundingClientRect();
        const rr = rightEl.getBoundingClientRect();
        missingArrows.push({
          leftLabel,
          rightLabel: correctRight,
          x1: lr.right - containerRect.left,
          y1: lr.top + lr.height / 2 - containerRect.top,
          x2: rr.left - containerRect.left,
          y2: rr.top + rr.height / 2 - containerRect.top,
          color: "#9ca3af",
          colorId: "cgray",
        });
      }
    });
  }

  const allArrows = showResults ? [...arrows, ...missingArrows] : arrows;

  /* ── unique marker colors needed ── */
  const markerColors = Array.from(
    new Set(allArrows.map((a) => a.color))
  );

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    <div
      className="rounded-2xl border bg-card shadow-sm p-5 space-y-4"
      style={FONT_STYLE}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3
          className="font-bold"
          style={{ ...FONT_STYLE, fontSize: "13px", color: "#6C4CE0" }}
        >
          Kombinieren Sie!
        </h3>
        <span
          className="rounded-full px-2 py-0.5 font-bold"
          style={{
            ...FONT_STYLE,
            fontSize: "10px",
            background: "#6C4CE0",
            color: "#fff",
          }}
        >
          1 Pt
        </span>
      </div>

      <p
        className="text-muted-foreground"
        style={{ ...FONT_STYLE, fontSize: "11px" }}
      >
        Klicken Sie auf ein Element links, dann auf das passende Element rechts.
      </p>

      {/* Two-column + SVG overlay wrapper */}
      <div
        ref={containerRef}
        style={{ position: "relative" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 1fr",
            gap: "0px",
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {left_items.map((item, idx) => {
              const color = getLeftColor(item.label);
              const resColor = resultColorLeft(item.label);
              const effectiveColor = showResults ? resColor : color;
              const isSelected = selectedLeft === item.label;
              const isConnected = !!color;

              const borderStyle: CSSProperties = effectiveColor
                ? {
                    borderLeft: `4px solid ${effectiveColor}`,
                    background: withAlpha(effectiveColor, 0.06),
                    borderRadius: "12px",
                  }
                : isSelected
                ? {
                    border: "2px solid #6C4CE0",
                    boxShadow: "0 0 0 4px rgba(108,76,224,0.15)",
                    background: withAlpha("#6C4CE0", 0.04),
                    borderRadius: "12px",
                    transform: "scale(1.02)",
                  }
                : {
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  };

              return (
                <div
                  key={item.label}
                  ref={(el) => {
                    leftRefs.current[idx] = el;
                  }}
                  onClick={() => handleLeftClick(item.label)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "8px 12px",
                    cursor: showResults ? "default" : "pointer",
                    transition:
                      "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
                    userSelect: "none",
                    ...borderStyle,
                  }}
                  className={
                    !showResults && !isConnected && !isSelected
                      ? "hover:shadow-sm hover:-translate-y-px"
                      : ""
                  }
                >
                  {/* Badge */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "11px",
                      background: effectiveColor
                        ? withAlpha(effectiveColor, 0.2)
                        : "#ede9fe",
                      color: effectiveColor ?? "#6C4CE0",
                      fontFamily: "'Times New Roman', Georgia, serif",
                    }}
                  >
                    {item.label}
                  </span>
                  <p style={FONT_STYLE}>{item.text}</p>
                </div>
              );
            })}
          </div>

          {/* ── MIDDLE SPACER (arrows go here via SVG overlay) ── */}
          <div />

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {right_items.map((item, idx) => {
              const color = getRightColor(item.label);
              const resColor = resultColorRight(item.label);
              const effectiveColor = showResults ? resColor : color;
              const isConnected = !!color;

              const borderStyle: CSSProperties = effectiveColor
                ? {
                    borderLeft: `4px solid ${effectiveColor}`,
                    background: withAlpha(effectiveColor, 0.06),
                    borderRadius: "12px",
                  }
                : {
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  };

              return (
                <div
                  key={item.label}
                  ref={(el) => {
                    rightRefs.current[idx] = el;
                  }}
                  onClick={() => handleRightClick(item.label)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "8px 12px",
                    cursor: showResults ? "default" : "pointer",
                    transition:
                      "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
                    userSelect: "none",
                    ...borderStyle,
                  }}
                  className={
                    !showResults && !isConnected
                      ? "hover:shadow-sm hover:-translate-y-px"
                      : ""
                  }
                >
                  {/* Badge */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "11px",
                      background: effectiveColor
                        ? withAlpha(effectiveColor, 0.2)
                        : "#ccfbf1",
                      color: effectiveColor ?? "#0FB6A3",
                      fontFamily: "'Times New Roman', Georgia, serif",
                    }}
                  >
                    {item.label}
                  </span>
                  <p style={FONT_STYLE}>{item.text}</p>

                  {/* Show correct match hint when wrong in results mode */}
                  {showResults && resColor === "#E85D50" && (() => {
                    const ll = getRightConnectedLeftLabel(item.label);
                    return ll ? (
                      <p
                        style={{
                          ...FONT_STYLE,
                          fontSize: "10px",
                          color: "#16a34a",
                          marginTop: "2px",
                          display: "block",
                        }}
                      >
                        ✓ {answer_key[ll] === item.label ? "" : ""}
                      </p>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SVG overlay for arrows ── */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 5,
            overflow: "visible",
          }}
        >
          <defs>
            {markerColors.map((color) => {
              const id = `arrowhead-${color.replace("#", "c")}`;
              return (
                <marker
                  key={id}
                  id={id}
                  viewBox="0 0 10 7"
                  refX="9"
                  refY="3.5"
                  markerWidth="8"
                  markerHeight="6"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              );
            })}
            {/* Dashed gray marker for missing connections */}
            <marker
              id="arrowhead-cgray"
              viewBox="0 0 10 7"
              refX="9"
              refY="3.5"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
            </marker>
          </defs>

          {allArrows.map((conn, i) => {
            const midX = (conn.x1 + conn.x2) / 2;
            const isMissing =
              showResults && !connections[conn.leftLabel];
            const markerId = `arrowhead-${conn.colorId}`;

            return (
              <path
                key={`${conn.leftLabel}-${conn.rightLabel}-${i}`}
                d={`M ${conn.x1} ${conn.y1} C ${midX} ${conn.y1}, ${midX} ${conn.y2}, ${conn.x2} ${conn.y2}`}
                stroke={conn.color}
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={isMissing ? "6 4" : undefined}
                markerEnd={`url(#${markerId})`}
                opacity="0.85"
              />
            );
          })}
        </svg>
      </div>

      {/* showResults: score summary */}
      {showResults && (
        <div
          className="rounded-xl border px-3 py-2 flex items-center gap-2"
          style={{ background: "rgba(0,0,0,0.03)" }}
        >
          <span className="font-bold" style={FONT_STYLE}>
            Ergebnis:
          </span>
          <span style={FONT_STYLE}>
            {
              left_items.filter(
                (item) => connections[item.label] === answer_key[item.label]
              ).length
            }{" "}
            von {left_items.length} korrekt
          </span>
        </div>
      )}

      {/* showResults: detail table */}
      {showResults && (
        <table className="w-full border-collapse" style={FONT_STYLE}>
          <thead>
            <tr>
              <th
                className="border border-border px-3 py-2 text-left bg-muted/30 font-bold"
                style={FONT_STYLE}
              >
                Buchstabe
              </th>
              <th
                className="border border-border px-3 py-2 text-left bg-muted/30 font-bold"
                style={FONT_STYLE}
              >
                Ihre Antwort
              </th>
              <th
                className="border border-border px-3 py-2 text-left bg-muted/30 font-bold"
                style={FONT_STYLE}
              >
                Richtige Antwort
              </th>
            </tr>
          </thead>
          <tbody>
            {left_items.map((item) => {
              const correct =
                connections[item.label] === answer_key[item.label];
              return (
                <tr key={item.label}>
                  <td
                    className="border border-border px-3 py-2 font-bold"
                    style={{ ...FONT_STYLE, color: "#6C4CE0" }}
                  >
                    {item.label}
                  </td>
                  <td
                    className="border border-border px-3 py-2"
                    style={{
                      ...FONT_STYLE,
                      background: correct
                        ? "rgba(22,163,74,0.07)"
                        : "rgba(232,93,80,0.07)",
                      color: correct ? "#15803d" : "#E85D50",
                    }}
                  >
                    <span className="font-bold">
                      {connections[item.label] || "–"}
                    </span>{" "}
                    {correct ? "✓" : "✗"}
                  </td>
                  <td
                    className="border border-border px-3 py-2 font-bold"
                    style={{
                      ...FONT_STYLE,
                      background: "rgba(22,163,74,0.05)",
                      color: "#15803d",
                    }}
                  >
                    {answer_key[item.label] || "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default KombinierenCard;
