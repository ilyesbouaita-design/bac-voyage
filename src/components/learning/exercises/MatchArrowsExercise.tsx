"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface Pair {
  left: string;
  right: string;
}

interface MatchArrowsExerciseProps {
  pairs: Pair[];
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "Times New Roman, serif",
  fontSize: "12px",
};

// Distinct pair colors
const PAIR_COLORS = [
  "#6C4CE0",
  "#FF5A5F",
  "#FFB200",
  "#0FB6A3",
  "#E040FB",
  "#FF7043",
  "#26C6DA",
  "#66BB6A",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Connection = {
  leftIdx: number;
  rightIdx: number; // index in shuffledRight
  colorIdx: number;
};

export default function MatchArrowsExercise({
  pairs,
  instruction_fr,
  onComplete,
}: MatchArrowsExerciseProps) {
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [colorCounter, setColorCounter] = useState(0);

  // Refs for measuring item positions
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lineCoords, setLineCoords] = useState<
    Array<{ x1: number; y1: number; x2: number; y2: number; colorIdx: number; connIdx: number }>
  >([]);

  useEffect(() => {
    setShuffledRight(shuffleArray(pairs.map((p) => p.right)));
    setConnections([]);
    setSelectedLeft(null);
    setShowResults(false);
    setScore(null);
    setColorCounter(0);
  }, [pairs]);

  // Recalculate line coords
  const updateLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newCoords = connections.map((conn, i) => {
      const lEl = leftRefs.current[conn.leftIdx];
      const rEl = rightRefs.current[conn.rightIdx];
      if (!lEl || !rEl) return null;

      const lRect = lEl.getBoundingClientRect();
      const rRect = rEl.getBoundingClientRect();

      return {
        x1: lRect.right - containerRect.left,
        y1: lRect.top + lRect.height / 2 - containerRect.top,
        x2: rRect.left - containerRect.left,
        y2: rRect.top + rRect.height / 2 - containerRect.top,
        colorIdx: conn.colorIdx,
        connIdx: i,
      };
    }).filter(Boolean) as typeof lineCoords;

    setLineCoords(newCoords);
  }, [connections]);

  useEffect(() => {
    // Small delay to let DOM settle
    const t = setTimeout(updateLines, 30);
    return () => clearTimeout(t);
  }, [connections, updateLines]);

  useEffect(() => {
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [updateLines]);

  const handleLeftClick = (leftIdx: number) => {
    if (showResults) return;

    // If already connected, disconnect
    const existingConn = connections.findIndex((c) => c.leftIdx === leftIdx);
    if (existingConn !== -1) {
      removeConnection(existingConn);
      return;
    }

    if (selectedLeft === leftIdx) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftIdx);
    }
  };

  const handleRightClick = (rightIdx: number) => {
    if (showResults) return;
    if (selectedLeft === null) return;

    // If this right is already connected to selectedLeft, do nothing
    const existingByLeft = connections.findIndex((c) => c.leftIdx === selectedLeft);
    const existingByRight = connections.findIndex((c) => c.rightIdx === rightIdx);

    const newConns = [...connections];

    // Remove previous connection from selectedLeft if it exists
    const filteredConns = newConns.filter((c) => c.leftIdx !== selectedLeft && c.rightIdx !== rightIdx);

    // Add new connection
    const newColorIdx = colorCounter % PAIR_COLORS.length;
    filteredConns.push({
      leftIdx: selectedLeft,
      rightIdx,
      colorIdx: newColorIdx,
    });

    setConnections(filteredConns);
    setColorCounter((c) => c + 1);
    setSelectedLeft(null);
  };

  const removeConnection = (connIdx: number) => {
    if (showResults) return;
    setConnections((prev) => prev.filter((_, i) => i !== connIdx));
    setSelectedLeft(null);
  };

  const handleLineClick = (connIdx: number) => {
    if (showResults) return;
    removeConnection(connIdx);
  };

  const handleVerify = () => {
    let correct = 0;
    connections.forEach((conn) => {
      const leftWord = pairs[conn.leftIdx].left;
      const rightWord = shuffledRight[conn.rightIdx];
      const expectedRight = pairs[conn.leftIdx].right;
      if (rightWord === expectedRight) correct++;
    });
    const pct = Math.round((correct / pairs.length) * 100);
    setScore(pct);
    setShowResults(true);
    onComplete(pct);
  };

  const handleReset = () => {
    setShuffledRight(shuffleArray(pairs.map((p) => p.right)));
    setConnections([]);
    setSelectedLeft(null);
    setShowResults(false);
    setScore(null);
    setColorCounter(0);
    setLineCoords([]);
  };

  // Connection lookups
  const getConnectionForLeft = (leftIdx: number) =>
    connections.find((c) => c.leftIdx === leftIdx);
  const getConnectionForRight = (rightIdx: number) =>
    connections.find((c) => c.rightIdx === rightIdx);

  // Verify connection correctness
  const isConnectionCorrect = (conn: Connection): boolean => {
    return shuffledRight[conn.rightIdx] === pairs[conn.leftIdx].right;
  };

  const allConnected = connections.length === pairs.length;

  return (
    <div
      style={{ ...BASE_STYLE, background: "#F9F7FF" }}
      className="rounded-2xl p-6 w-full max-w-2xl mx-auto shadow-md"
    >
      {/* Header */}
      <div className="mb-5">
        <div
          className="inline-block px-3 py-1 rounded-full mb-2"
          style={{ background: "#FF5A5F", color: "#fff" }}
        >
          <span style={BASE_STYLE}>Relie les paires</span>
        </div>
        <p style={{ ...BASE_STYLE, color: "#444" }}>{instruction_fr}</p>
      </div>

      {/* Score banner */}
      {showResults && score !== null && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{
            background: score >= 60 ? "#ECFDF5" : "#FFF1F2",
            border: `1.5px solid ${score >= 60 ? "#0FB6A3" : "#FF5A5F"}`,
          }}
        >
          <span style={{ fontSize: "20px" }}>{score >= 60 ? "🎉" : "📚"}</span>
          <span style={{ ...BASE_STYLE, fontWeight: "bold", color: score >= 60 ? "#0FB6A3" : "#FF5A5F" }}>
            Score : {score}%
          </span>
          <span style={{ ...BASE_STYLE, color: "#666", marginLeft: "auto" }}>
            {connections.filter(isConnectionCorrect).length} / {pairs.length} paires correctes
          </span>
        </div>
      )}

      {/* Main matching area */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "2px solid #E8E0FF", minHeight: `${pairs.length * 56 + 32}px` }}
      >
        {/* SVG overlay for lines */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <defs>
            {PAIR_COLORS.map((color, i) => (
              <marker
                key={i}
                id={`arrowhead-${i}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={color} />
              </marker>
            ))}
            {/* Results markers */}
            <marker id="arrowhead-correct" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#0FB6A3" />
            </marker>
            <marker id="arrowhead-wrong" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#FF5A5F" />
            </marker>
          </defs>

          {lineCoords.map((line, i) => {
            if (!line) return null;
            const conn = connections[line.connIdx];
            if (!conn) return null;
            const correct = showResults ? isConnectionCorrect(conn) : null;
            const color = showResults
              ? correct ? "#0FB6A3" : "#FF5A5F"
              : PAIR_COLORS[line.colorIdx];
            const markerId = showResults
              ? correct ? "arrowhead-correct" : "arrowhead-wrong"
              : `arrowhead-${line.colorIdx}`;

            // Curved bezier
            const dx = line.x2 - line.x1;
            const cx1 = line.x1 + dx * 0.4;
            const cx2 = line.x2 - dx * 0.4;

            return (
              <g key={i} style={{ pointerEvents: "all", cursor: showResults ? "default" : "pointer" }}
                onClick={() => handleLineClick(line.connIdx)}
              >
                {/* Wider invisible hit area */}
                <path
                  d={`M ${line.x1} ${line.y1} C ${cx1} ${line.y1}, ${cx2} ${line.y2}, ${line.x2} ${line.y2}`}
                  stroke="transparent"
                  strokeWidth="16"
                  fill="none"
                />
                <path
                  d={`M ${line.x1} ${line.y1} C ${cx1} ${line.y1}, ${cx2} ${line.y2}, ${line.x2} ${line.y2}`}
                  stroke={color}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={showResults ? "none" : "none"}
                  markerEnd={`url(#${markerId})`}
                  style={{ transition: "stroke 0.3s" }}
                />
              </g>
            );
          })}

          {/* Show unmatched correct answers in results mode */}
          {showResults && pairs.map((pair, leftIdx) => {
            const conn = getConnectionForLeft(leftIdx);
            if (conn && isConnectionCorrect(conn)) return null; // already correct
            // Find where correct right should be
            const correctRightShuffledIdx = shuffledRight.indexOf(pair.right);
            const lEl = leftRefs.current[leftIdx];
            const rEl = rightRefs.current[correctRightShuffledIdx];
            if (!lEl || !rEl || !containerRef.current) return null;
            const containerRect = containerRef.current.getBoundingClientRect();
            const lRect = lEl.getBoundingClientRect();
            const rRect = rEl.getBoundingClientRect();
            const x1 = lRect.right - containerRect.left;
            const y1 = lRect.top + lRect.height / 2 - containerRect.top;
            const x2 = rRect.left - containerRect.left;
            const y2 = rRect.top + rRect.height / 2 - containerRect.top;
            const dx = x2 - x1;
            const cx1p = x1 + dx * 0.4;
            const cx2p = x2 - dx * 0.4;
            return (
              <path
                key={`hint-${leftIdx}`}
                d={`M ${x1} ${y1} C ${cx1p} ${y1}, ${cx2p} ${y2}, ${x2} ${y2}`}
                stroke="#0FB6A3"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="5 3"
                opacity="0.6"
                markerEnd="url(#arrowhead-correct)"
              />
            );
          })}
        </svg>

        {/* Columns */}
        <div className="flex" style={{ padding: "16px", gap: "0px", position: "relative", zIndex: 1 }}>
          {/* Left column */}
          <div className="flex flex-col gap-3" style={{ width: "42%", paddingRight: "8%" }}>
            {pairs.map((pair, leftIdx) => {
              const conn = getConnectionForLeft(leftIdx);
              const isSelected = selectedLeft === leftIdx;
              const color = conn ? PAIR_COLORS[conn.colorIdx] : null;
              const correct = showResults && conn ? isConnectionCorrect(conn) : null;
              const displayColor = showResults && conn
                ? correct ? "#0FB6A3" : "#FF5A5F"
                : isSelected
                ? "#6C4CE0"
                : color;

              return (
                <div
                  key={leftIdx}
                  ref={(el) => { leftRefs.current[leftIdx] = el; }}
                  onClick={() => handleLeftClick(leftIdx)}
                  className="rounded-xl flex items-center justify-between cursor-pointer transition-all select-none"
                  style={{
                    height: "44px",
                    padding: "0 12px",
                    background: displayColor
                      ? `${displayColor}18`
                      : "#F9F7FF",
                    border: `2px solid ${displayColor ?? "#E8E0FF"}`,
                    fontFamily: "Times New Roman, serif",
                    fontSize: "12px",
                    fontWeight: isSelected || conn ? "bold" : "normal",
                    color: displayColor ?? "#333",
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.15s",
                    cursor: showResults ? "default" : "pointer",
                  }}
                >
                  <span>{pair.left}</span>
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>
                    {isSelected ? "→" : conn ? "✓" : ""}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3 ml-auto" style={{ width: "42%", paddingLeft: "8%" }}>
            {shuffledRight.map((word, rightIdx) => {
              const conn = getConnectionForRight(rightIdx);
              const color = conn ? PAIR_COLORS[conn.colorIdx] : null;
              const correct = showResults && conn ? isConnectionCorrect(conn) : null;
              const displayColor = showResults && conn
                ? correct ? "#0FB6A3" : "#FF5A5F"
                : selectedLeft !== null
                ? color ?? "#0FB6A3"
                : color;
              const isHighlighted = selectedLeft !== null && !conn;

              return (
                <div
                  key={rightIdx}
                  ref={(el) => { rightRefs.current[rightIdx] = el; }}
                  onClick={() => handleRightClick(rightIdx)}
                  className="rounded-xl flex items-center transition-all select-none"
                  style={{
                    height: "44px",
                    padding: "0 12px",
                    background: conn
                      ? `${displayColor}18`
                      : isHighlighted
                      ? "#F3EEFF"
                      : "#F9F7FF",
                    border: `2px solid ${conn ? displayColor! : isHighlighted ? "#6C4CE0" : "#E8E0FF"}`,
                    fontFamily: "Times New Roman, serif",
                    fontSize: "12px",
                    fontWeight: conn ? "bold" : "normal",
                    color: conn ? displayColor! : isHighlighted ? "#6C4CE0" : "#333",
                    transition: "all 0.15s",
                    cursor: showResults ? "default" : selectedLeft !== null && !conn ? "pointer" : conn ? "pointer" : "default",
                  }}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend / instructions */}
      {!showResults && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedLeft !== null ? (
            <span style={{ ...BASE_STYLE, color: "#6C4CE0" }}>
              « {pairs[selectedLeft].left} » sélectionné — clique un élément à droite pour relier.
            </span>
          ) : (
            <span style={{ ...BASE_STYLE, color: "#aaa", fontStyle: "italic" }}>
              Clique un élément à gauche, puis un à droite pour les relier. Clique une ligne pour la supprimer.
            </span>
          )}
        </div>
      )}

      {/* Results: show correct answers for wrong ones */}
      {showResults && (
        <div className="mt-4 flex flex-col gap-2">
          {pairs.map((pair, i) => {
            const conn = getConnectionForLeft(i);
            if (conn && isConnectionCorrect(conn)) return null;
            return (
              <div
                key={i}
                className="rounded-lg px-3 py-2 flex items-center gap-2"
                style={{ background: "#ECFDF5", border: "1px solid #0FB6A3" }}
              >
                <span style={{ fontSize: "12px" }}>✅</span>
                <span style={{ ...BASE_STYLE, color: "#0A7A72" }}>
                  <strong>{pair.left}</strong> → {pair.right}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        {!showResults ? (
          <button
            onClick={handleVerify}
            disabled={!allConnected}
            className="flex-1 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{
              background: allConnected ? "#6C4CE0" : "#ccc",
              color: allConnected ? "#fff" : "#888",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: allConnected ? "pointer" : "not-allowed",
            }}
          >
            Vérifier ({connections.length} / {pairs.length} relié{connections.length > 1 ? "s" : ""})
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{
              background: "#FFB200",
              color: "#3B2200",
              fontFamily: "Times New Roman, serif",
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}
