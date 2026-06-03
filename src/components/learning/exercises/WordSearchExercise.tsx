"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";

interface WordSearchExerciseProps {
  words: string[];
  grid_size: number;
  instruction_fr: string;
  onComplete: (score: number) => void;
}

const VIOLET = "#6C4CE0";
const CORAL = "#FF5A5F";
const GOLD = "#FFB200";
const TEAL = "#0FB6A3";

const GERMAN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ";

function randomLetter() {
  return GERMAN_LETTERS[Math.floor(Math.random() * GERMAN_LETTERS.length)];
}

type Direction = "horizontal" | "vertical" | "diagonal";

interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: Direction;
  cells: Array<[number, number]>;
}

function generateGrid(
  words: string[],
  size: number
): { grid: string[][]; placed: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill("")
  );
  const placed: PlacedWord[] = [];

  const directions: Direction[] = ["horizontal", "vertical", "diagonal"];

  for (const rawWord of words) {
    const word = rawWord.toUpperCase();
    let success = false;
    const attempts = 100;

    for (let attempt = 0; attempt < attempts && !success; attempt++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      let maxRow = size - 1;
      let maxCol = size - 1;

      if (dir === "horizontal") maxCol = size - word.length;
      if (dir === "vertical") maxRow = size - word.length;
      if (dir === "diagonal") {
        maxRow = size - word.length;
        maxCol = size - word.length;
      }

      if (maxRow < 0 || maxCol < 0) continue;

      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      // Check if placement is valid
      const cells: Array<[number, number]> = [];
      let valid = true;

      for (let i = 0; i < word.length; i++) {
        const r = dir === "horizontal" ? row : row + i;
        const c = dir === "vertical" ? col : col + i;
        cells.push([r, c]);
        const existing = grid[r][c];
        if (existing !== "" && existing !== word[i]) {
          valid = false;
          break;
        }
      }

      if (valid) {
        for (let i = 0; i < word.length; i++) {
          const [r, c] = cells[i];
          grid[r][c] = word[i];
        }
        placed.push({ word, row, col, direction: dir, cells });
        success = true;
      }
    }
  }

  // Fill empty cells with random letters
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") grid[r][c] = randomLetter();
    }
  }

  return { grid, placed };
}

function cellsMatch(a: Array<[number, number]>, b: Array<[number, number]>) {
  if (a.length !== b.length) return false;
  return a.every(([r, c], i) => b[i][0] === r && b[i][1] === c);
}

function getCellsBetween(
  start: [number, number],
  end: [number, number]
): Array<[number, number]> | null {
  const [sr, sc] = start;
  const [er, ec] = end;
  const dr = er - sr;
  const dc = ec - sc;

  // horizontal
  if (dr === 0 && dc !== 0) {
    const step = dc > 0 ? 1 : -1;
    const cells: Array<[number, number]> = [];
    for (let c = sc; c !== ec + step; c += step) cells.push([sr, c]);
    return cells;
  }
  // vertical
  if (dc === 0 && dr !== 0) {
    const step = dr > 0 ? 1 : -1;
    const cells: Array<[number, number]> = [];
    for (let r = sr; r !== er + step; r += step) cells.push([r, sc]);
    return cells;
  }
  // diagonal
  if (Math.abs(dr) === Math.abs(dc)) {
    const stepR = dr > 0 ? 1 : -1;
    const stepC = dc > 0 ? 1 : -1;
    const cells: Array<[number, number]> = [];
    for (let i = 0; i <= Math.abs(dr); i++)
      cells.push([sr + i * stepR, sc + i * stepC]);
    return cells;
  }
  return null;
}

const WORD_COLORS = [VIOLET, TEAL, GOLD, CORAL, "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];

export default function WordSearchExercise({
  words,
  grid_size,
  instruction_fr,
  onComplete,
}: WordSearchExerciseProps) {
  const size = Math.max(grid_size, Math.max(...words.map((w) => w.length)) + 2);
  const { grid, placed } = useMemo(() => generateGrid(words, size), [words, size]);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Map<string, string>>(new Map());
  const [selecting, setSelecting] = useState(false);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [currentCell, setCurrentCell] = useState<[number, number] | null>(null);
  const [flashWrong, setFlashWrong] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const selectionCells = useMemo<Array<[number, number]>>(() => {
    if (!startCell || !currentCell) return [];
    return getCellsBetween(startCell, currentCell) ?? [];
  }, [startCell, currentCell]);

  const checkSelection = useCallback(
    (cells: Array<[number, number]>) => {
      for (const p of placed) {
        if (cellsMatch(cells, p.cells) || cellsMatch(cells, [...p.cells].reverse())) {
          if (!foundWords.includes(p.word)) {
            const color = WORD_COLORS[foundWords.length % WORD_COLORS.length];
            setFoundWords((fw) => {
              const nfw = [...fw, p.word];
              if (nfw.length >= placed.length) {
                setDone(true);
                if (timerRef.current) clearInterval(timerRef.current);
                onComplete(Math.round((nfw.length / words.length) * 100));
              }
              return nfw;
            });
            setFoundCells((fc) => {
              const nfc = new Map(fc);
              for (const [r, c] of p.cells) nfc.set(`${r},${c}`, color);
              return nfc;
            });
            return true;
          }
        }
      }
      return false;
    },
    [placed, foundWords, onComplete, words.length]
  );

  const handleCellMouseDown = (r: number, c: number) => {
    setSelecting(true);
    setStartCell([r, c]);
    setCurrentCell([r, c]);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (selecting) setCurrentCell([r, c]);
  };

  const handleCellMouseUp = useCallback(
    (r: number, c: number) => {
      if (!selecting || !startCell) return;
      setSelecting(false);
      const cells = getCellsBetween(startCell, [r, c]);
      if (!cells || cells.length < 2) {
        setStartCell(null);
        setCurrentCell(null);
        return;
      }
      const found = checkSelection(cells);
      if (!found) {
        setFlashWrong(true);
        flashRef.current = setTimeout(() => setFlashWrong(false), 400);
      }
      setStartCell(null);
      setCurrentCell(null);
    },
    [selecting, startCell, checkSelection]
  );

  useEffect(() => () => { if (flashRef.current) clearTimeout(flashRef.current); }, []);

  const isCellSelected = (r: number, c: number) =>
    selectionCells.some(([sr, sc]) => sr === r && sc === c);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (done) {
    const score = Math.round((foundWords.length / words.length) * 100);
    return (
      <div
        style={{
          fontFamily: "Times New Roman, serif",
          fontSize: "12px",
          padding: "32px 24px",
          textAlign: "center",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: "52px", marginBottom: "8px" }}>🔍</div>
        <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: "#555", marginBottom: "6px" }}>
          Tous les mots trouvés !
        </div>
        <div style={{ fontSize: "40px", fontWeight: "bold", color: VIOLET, marginBottom: "12px" }}>
          {score}%
        </div>
        <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: "#888" }}>
          Temps : {formatTime(elapsed)}
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
        maxWidth: "720px",
        margin: "0 auto",
        userSelect: "none",
      }}
      onMouseLeave={() => {
        if (selecting) {
          setSelecting(false);
          setStartCell(null);
          setCurrentCell(null);
        }
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: "#666" }}>
          {instruction_fr}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: TEAL, fontWeight: "bold" }}>
            ⏱ {formatTime(elapsed)}
          </div>
          <div style={{ fontSize: "12px", fontFamily: "Times New Roman, serif", color: VIOLET, fontWeight: "bold" }}>
            {foundWords.length}/{words.length} mots
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Grid */}
        <div
          style={{
            border: `2px solid ${flashWrong ? CORAL : "#e5e7eb"}`,
            borderRadius: "8px",
            overflow: "hidden",
            transition: "border-color 0.3s",
            cursor: "crosshair",
          }}
        >
          {grid.map((row, r) => (
            <div key={r} style={{ display: "flex" }}>
              {row.map((letter, c) => {
                const foundColor = foundCells.get(`${r},${c}`);
                const isSelected = isCellSelected(r, c);

                let bg = "#fff";
                let color = "#333";
                let fontWeight = "normal";

                if (foundColor) {
                  bg = foundColor + "22";
                  color = foundColor;
                  fontWeight = "bold";
                }
                if (isSelected) {
                  bg = VIOLET + "33";
                  color = VIOLET;
                  fontWeight = "bold";
                }

                return (
                  <div
                    key={c}
                    onMouseDown={() => handleCellMouseDown(r, c)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    onMouseUp={() => handleCellMouseUp(r, c)}
                    style={{
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontFamily: "'Courier New', monospace",
                      fontWeight,
                      color,
                      background: bg,
                      borderRight: c < size - 1 ? "1px solid #f0f0f0" : "none",
                      borderBottom: r < size - 1 ? "1px solid #f0f0f0" : "none",
                      transition: "background 0.1s",
                    }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Word list */}
        <div style={{ flex: 1, minWidth: "120px" }}>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "Times New Roman, serif",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "10px",
            }}
          >
            Mots à trouver :
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {words.map((w) => {
              const upper = w.toUpperCase();
              const isFound = foundWords.includes(upper);
              const color = isFound
                ? WORD_COLORS[foundWords.indexOf(upper) % WORD_COLORS.length]
                : "#333";
              return (
                <div
                  key={w}
                  style={{
                    fontSize: "12px",
                    fontFamily: "Times New Roman, serif",
                    color,
                    textDecoration: isFound ? "line-through" : "none",
                    fontWeight: isFound ? "bold" : "normal",
                    transition: "color 0.3s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {isFound ? "✓" : "○"} {w}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          fontSize: "12px",
          fontFamily: "Times New Roman, serif",
          color: "#aaa",
          fontStyle: "italic",
        }}
      >
        Glissez pour sélectionner un mot (horizontal, vertical ou diagonal)
      </div>
    </div>
  );
}
