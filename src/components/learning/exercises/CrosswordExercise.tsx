"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";

interface CrosswordEntry {
  word: string;
  clue_fr: string;
  direction: "across" | "down";
  row: number;
  col: number;
}

interface CrosswordExerciseProps {
  entries: CrosswordEntry[];
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const VIOLET = "#6C4CE0";
const CORAL = "#FF5A5F";
const TEAL = "#0FB6A3";
const GOLD = "#FFB200";

interface CellState {
  letter: string;
  verified: boolean;
  correct: boolean | null;
}

interface GridCell {
  active: boolean;
  correctLetter: string;
  entryIds: number[];
  clueNumber?: number;
}

export default function CrosswordExercise({
  entries,
  instruction_fr,
  onComplete,
}: CrosswordExerciseProps) {
  // Compute grid dimensions
  const { rows, cols } = useMemo(() => {
    let maxRow = 0;
    let maxCol = 0;
    for (const e of entries) {
      const len = e.word.length;
      if (e.direction === "across") {
        maxRow = Math.max(maxRow, e.row);
        maxCol = Math.max(maxCol, e.col + len - 1);
      } else {
        maxRow = Math.max(maxRow, e.row + len - 1);
        maxCol = Math.max(maxCol, e.col);
      }
    }
    return { rows: maxRow + 1, cols: maxCol + 1 };
  }, [entries]);

  // Build grid structure
  const gridStructure = useMemo<GridCell[][]>(() => {
    const g: GridCell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        active: false,
        correctLetter: "",
        entryIds: [],
      }))
    );

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const word = e.word.toUpperCase();
      for (let j = 0; j < word.length; j++) {
        const r = e.direction === "across" ? e.row : e.row + j;
        const c = e.direction === "across" ? e.col + j : e.col;
        if (r < rows && c < cols) {
          g[r][c].active = true;
          g[r][c].correctLetter = word[j];
          g[r][c].entryIds.push(i);
        }
      }
    }

    // Assign clue numbers: sort entries by row then col
    const sorted = entries
      .map((e, i) => ({ e, i }))
      .sort((a, b) => a.e.row - b.e.row || a.e.col - b.e.col);

    let num = 1;
    const numbered = new Set<string>();
    for (const { e, i } of sorted) {
      const key = `${e.row},${e.col}`;
      if (!numbered.has(key)) {
        numbered.add(key);
        g[e.row][e.col].clueNumber = num;
        // assign num to all entries starting at this cell
        // (we'll track separately)
        num++;
      }
    }
    return g;
  }, [entries, rows, cols]);

  // Assign clue numbers to entries
  const entryNumbers = useMemo(() => {
    const map: number[] = new Array(entries.length).fill(0);
    const sorted = entries
      .map((e, i) => ({ e, i }))
      .sort((a, b) => a.e.row - b.e.row || a.e.col - b.e.col);

    let num = 1;
    const numbered = new Map<string, number>();
    for (const { e, i } of sorted) {
      const key = `${e.row},${e.col}`;
      if (!numbered.has(key)) {
        numbered.set(key, num++);
      }
      map[i] = numbered.get(key)!;
    }
    return map;
  }, [entries]);

  // Cell state (letters typed)
  const [cells, setCells] = useState<CellState[][]>(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        letter: "",
        verified: false,
        correct: null,
      }))
    )
  );

  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [activeEntry, setActiveEntry] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getEntryForCell = useCallback(
    (r: number, c: number, preferDirection?: "across" | "down") => {
      const cell = gridStructure[r]?.[c];
      if (!cell?.active) return null;
      const ids = cell.entryIds;
      if (ids.length === 0) return null;
      if (ids.length === 1) return ids[0];

      // Multiple entries share this cell
      if (preferDirection) {
        const preferred = ids.find(
          (id) => entries[id].direction === preferDirection
        );
        if (preferred !== undefined) return preferred;
      }
      // Return currently active entry if it contains this cell
      if (activeEntry !== null && ids.includes(activeEntry)) return activeEntry;
      return ids[0];
    },
    [gridStructure, entries, activeEntry]
  );

  const getEntireCellsForEntry = useCallback(
    (entryId: number): Array<[number, number]> => {
      const e = entries[entryId];
      return e.word
        .split("")
        .map((_, j) => [
          e.direction === "across" ? e.row : e.row + j,
          e.direction === "across" ? e.col + j : e.col,
        ] as [number, number]);
    },
    [entries]
  );

  const handleCellClick = (r: number, c: number) => {
    const cell = gridStructure[r]?.[c];
    if (!cell?.active) return;

    let newEntry = getEntryForCell(r, c);
    if (activeCell?.[0] === r && activeCell?.[1] === c && activeEntry !== null) {
      // Toggle direction on double-click same cell
      const ids = cell.entryIds;
      if (ids.length > 1) {
        const idx = ids.indexOf(activeEntry);
        newEntry = ids[(idx + 1) % ids.length];
      }
    }
    setActiveCell([r, c]);
    setActiveEntry(newEntry);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClueClick = (entryId: number) => {
    const e = entries[entryId];
    setActiveEntry(entryId);
    setActiveCell([e.row, e.col]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const advanceCursor = useCallback(
    (r: number, c: number, entryId: number) => {
      const e = entries[entryId];
      const cells_in_entry = getEntireCellsForEntry(entryId);
      const idx = cells_in_entry.findIndex(([er, ec]) => er === r && ec === c);
      if (idx < cells_in_entry.length - 1) {
        setActiveCell(cells_in_entry[idx + 1]);
      }
    },
    [entries, getEntireCellsForEntry]
  );

  const retreatCursor = useCallback(
    (r: number, c: number, entryId: number) => {
      const cells_in_entry = getEntireCellsForEntry(entryId);
      const idx = cells_in_entry.findIndex(([er, ec]) => er === r && ec === c);
      if (idx > 0) {
        setActiveCell(cells_in_entry[idx - 1]);
      }
    },
    [getEntireCellsForEntry]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeCell || activeEntry === null) return;
      const [r, c] = activeCell;
      const entry = entries[activeEntry];

      if (e.key === "Backspace") {
        e.preventDefault();
        if (cells[r][c].letter === "") {
          retreatCursor(r, c, activeEntry);
        } else {
          setCells((prev) => {
            const n = prev.map((row) => row.map((cell) => ({ ...cell })));
            n[r][c].letter = "";
            return n;
          });
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        // Find horizontal entry in this cell
        const cell = gridStructure[r]?.[c];
        const hEntry = cell?.entryIds.find(
          (id) => entries[id].direction === "across"
        );
        if (hEntry !== undefined) {
          setActiveEntry(hEntry);
          const cells_in_entry = getEntireCellsForEntry(hEntry);
          const idx = cells_in_entry.findIndex(
            ([er, ec]) => er === r && ec === c
          );
          const nextIdx =
            e.key === "ArrowRight"
              ? Math.min(idx + 1, cells_in_entry.length - 1)
              : Math.max(idx - 1, 0);
          setActiveCell(cells_in_entry[nextIdx]);
        }
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cell = gridStructure[r]?.[c];
        const vEntry = cell?.entryIds.find(
          (id) => entries[id].direction === "down"
        );
        if (vEntry !== undefined) {
          setActiveEntry(vEntry);
          const cells_in_entry = getEntireCellsForEntry(vEntry);
          const idx = cells_in_entry.findIndex(
            ([er, ec]) => er === r && ec === c
          );
          const nextIdx =
            e.key === "ArrowDown"
              ? Math.min(idx + 1, cells_in_entry.length - 1)
              : Math.max(idx - 1, 0);
          setActiveCell(cells_in_entry[nextIdx]);
        }
        return;
      }

      if (/^[a-zA-ZäöüÄÖÜß]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();
        setCells((prev) => {
          const n = prev.map((row) => row.map((cell) => ({ ...cell })));
          n[r][c].letter = letter;
          return n;
        });
        advanceCursor(r, c, activeEntry);
      }
    },
    [activeCell, activeEntry, cells, entries, gridStructure, advanceCursor, retreatCursor, getEntireCellsForEntry]
  );

  const verify = () => {
    let correct = 0;
    let total = 0;

    const newCells = cells.map((row, r) =>
      row.map((cell, c) => {
        const gCell = gridStructure[r][c];
        if (!gCell.active) return cell;
        total++;
        const isCorrect =
          cell.letter.toUpperCase() === gCell.correctLetter.toUpperCase();
        if (isCorrect) correct++;
        return { ...cell, verified: true, correct: isCorrect };
      })
    );
    setCells(newCells);
    setVerified(true);
    setDone(true);
    onComplete(Math.round((correct / total) * 100));
  };

  const activeCellsSet = useMemo(() => {
    if (activeEntry === null) return new Set<string>();
    return new Set(
      getEntireCellsForEntry(activeEntry).map(([r, c]) => `${r},${c}`)
    );
  }, [activeEntry, getEntireCellsForEntry]);

  const acrossEntries = entries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.direction === "across")
    .sort((a, b) => entryNumbers[a.i] - entryNumbers[b.i]);

  const downEntries = entries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.direction === "down")
    .sort((a, b) => entryNumbers[a.i] - entryNumbers[b.i]);

  if (done && verified) {
    let correct = 0, total = 0;
    cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (gridStructure[r][c].active) {
          total++;
          if (cell.correct) correct++;
        }
      })
    );
    const score = Math.round((correct / total) * 100);
    return (
      <div style={{ fontFamily: "Times New Roman, serif", fontSize: "12px", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>
          {score >= 80 ? "🏆" : score >= 50 ? "👍" : "💪"}
        </div>
        <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: "#555", marginBottom: "6px" }}>
          Mots croisés terminés !
        </div>
        <div style={{ fontSize: "40px", fontWeight: "bold", color: VIOLET, marginBottom: "8px" }}>{score}%</div>
        <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: "#888" }}>
          {correct} / {total} cases correctes
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Times New Roman, serif",
        fontSize: "12px",
        padding: "16px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: "#666" }}>
          {instruction_fr}
        </div>
        <button
          onClick={verify}
          style={{
            background: VIOLET,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "7px 16px",
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Vérifier
        </button>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* Grid */}
        <div style={{ flexShrink: 0 }}>
          {/* Hidden input for keyboard capture */}
          <input
            ref={inputRef}
            onKeyDown={handleKeyDown}
            style={{
              position: "absolute",
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}
            readOnly
          />

          <div
            style={{
              display: "inline-block",
              border: "2px solid #333",
            }}
          >
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} style={{ display: "flex" }}>
                {Array.from({ length: cols }, (_, c) => {
                  const gCell = gridStructure[r][c];
                  const cellState = cells[r][c];
                  const isActive =
                    activeCell?.[0] === r && activeCell?.[1] === c;
                  const isInEntry = activeCellsSet.has(`${r},${c}`);

                  if (!gCell.active) {
                    return (
                      <div
                        key={c}
                        style={{
                          width: "32px",
                          height: "32px",
                          background: "#222",
                          borderRight:
                            c < cols - 1 ? "1px solid #444" : "none",
                          borderBottom:
                            r < rows - 1 ? "1px solid #444" : "none",
                        }}
                      />
                    );
                  }

                  let bg = "#fff";
                  let textColor = "#222";
                  let borderColor = "#ccc";

                  if (isActive) {
                    borderColor = VIOLET;
                    bg = "#f0ebff";
                  } else if (isInEntry) {
                    bg = "#e8e2ff";
                  }

                  if (verified && cellState.correct === true) {
                    bg = "#dcfce7";
                    textColor = "#15803d";
                  } else if (verified && cellState.correct === false) {
                    bg = "#ffe4e6";
                    textColor = CORAL;
                  }

                  return (
                    <div
                      key={c}
                      onClick={() => handleCellClick(r, c)}
                      style={{
                        width: "32px",
                        height: "32px",
                        background: bg,
                        border: isActive
                          ? `2px solid ${VIOLET}`
                          : `1px solid ${borderColor}`,
                        position: "relative",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.15s",
                        boxSizing: "border-box",
                      }}
                    >
                      {gCell.clueNumber && (
                        <span
                          style={{
                            position: "absolute",
                            top: "1px",
                            left: "2px",
                            fontSize: "8px",
                            fontFamily: "Times New Roman, serif",
                            color: "#777",
                            lineHeight: 1,
                            fontWeight: "bold",
                          }}
                        >
                          {gCell.clueNumber}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "14px",
                          fontFamily: "Times New Roman, serif",
                          fontWeight: "bold",
                          color: textColor,
                          lineHeight: 1,
                        }}
                      >
                        {verified && cellState.correct === false && !cellState.letter
                          ? gCell.correctLetter
                          : cellState.letter}
                      </span>
                      {verified && cellState.correct === false && cellState.letter && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: "1px",
                            right: "2px",
                            fontSize: "7px",
                            color: TEAL,
                            fontFamily: "Times New Roman, serif",
                          }}
                        >
                          {gCell.correctLetter}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Clues */}
        <div style={{ flex: 1, minWidth: "180px", maxWidth: "320px" }}>
          {/* Across */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                fontFamily: "Times New Roman, serif",
                fontWeight: "bold",
                color: VIOLET,
                marginBottom: "6px",
                borderBottom: `2px solid ${VIOLET}`,
                paddingBottom: "4px",
              }}
            >
              ➡ Horizontal
            </div>
            {acrossEntries.map(({ e, i }) => (
              <div
                key={i}
                onClick={() => handleClueClick(i)}
                style={{
                  fontSize: "12px",
                  fontFamily: "Times New Roman, serif",
                  padding: "4px 6px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: activeEntry === i ? "#f0ebff" : "transparent",
                  color: activeEntry === i ? VIOLET : "#333",
                  marginBottom: "2px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(el) => {
                  if (activeEntry !== i)
                    el.currentTarget.style.background = "#f9f7ff";
                }}
                onMouseLeave={(el) => {
                  if (activeEntry !== i)
                    el.currentTarget.style.background = "transparent";
                }}
              >
                <strong>{entryNumbers[i]}.</strong> {e.clue_fr}
              </div>
            ))}
          </div>

          {/* Down */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontFamily: "Times New Roman, serif",
                fontWeight: "bold",
                color: TEAL,
                marginBottom: "6px",
                borderBottom: `2px solid ${TEAL}`,
                paddingBottom: "4px",
              }}
            >
              ↓ Vertical
            </div>
            {downEntries.map(({ e, i }) => (
              <div
                key={i}
                onClick={() => handleClueClick(i)}
                style={{
                  fontSize: "12px",
                  fontFamily: "Times New Roman, serif",
                  padding: "4px 6px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: activeEntry === i ? "#e6faf8" : "transparent",
                  color: activeEntry === i ? TEAL : "#333",
                  marginBottom: "2px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(el) => {
                  if (activeEntry !== i)
                    el.currentTarget.style.background = "#f0fdfb";
                }}
                onMouseLeave={(el) => {
                  if (activeEntry !== i)
                    el.currentTarget.style.background = "transparent";
                }}
              >
                <strong>{entryNumbers[i]}.</strong> {e.clue_fr}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active clue hint */}
      {activeEntry !== null && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            background: "#f9f7ff",
            borderLeft: `3px solid ${VIOLET}`,
            borderRadius: "0 8px 8px 0",
            fontSize: "12px",
            fontFamily: "Times New Roman, serif",
            color: "#333",
          }}
        >
          <strong style={{ color: VIOLET }}>
            {entryNumbers[activeEntry]}{" "}
            {entries[activeEntry].direction === "across" ? "→" : "↓"}
          </strong>{" "}
          {entries[activeEntry].clue_fr}
        </div>
      )}
    </div>
  );
}
