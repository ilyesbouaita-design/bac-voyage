import { useState } from "react";

interface QuestionResult {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartial: boolean;
  feedback_fr: string;
  referenceAnswer?: string;
  studentAnswer?: string;
}

interface SectionResult {
  title: string;
  color: string;
  questions: QuestionResult[];
}

interface ExamResultsProps {
  totalScore: number;
  maxScore: number;
  percentage: number;
  sectionResults: SectionResult[];
  onRetry?: () => void;
  onBack?: () => void;
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

function getScoreColor(percentage: number): string {
  if (percentage >= 70) return "#0FB6A3"; // teal/green
  if (percentage >= 50) return "#FFB200"; // gold
  return "#FF5A5F"; // coral
}

function getScoreLabel(percentage: number): string {
  if (percentage >= 70) return "Gut gemacht!";
  if (percentage >= 50) return "Weiter üben!";
  return "Mehr Übung nötig";
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/\.?0+$/, "");
}

function QuestionRow({ question }: { question: QuestionResult }) {
  const [expanded, setExpanded] = useState(false);

  const canExpand = !question.isCorrect || question.feedback_fr;

  let icon: string;
  let iconColor: string;
  let bgTint: string;

  if (question.isCorrect) {
    icon = "✅";
    iconColor = "#0FB6A3";
    bgTint = "rgba(15, 182, 163, 0.06)";
  } else if (question.isPartial) {
    icon = "⚠️";
    iconColor = "#FFB200";
    bgTint = "rgba(255, 178, 0, 0.08)";
  } else {
    icon = "❌";
    iconColor = "#FF5A5F";
    bgTint = "rgba(255, 90, 95, 0.07)";
  }

  const scoreColor = question.isCorrect
    ? "#0FB6A3"
    : question.isPartial
    ? "#FFB200"
    : "#FF5A5F";

  return (
    <div
      style={{
        ...FONT_STYLE,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        backgroundColor: expanded && canExpand ? bgTint : "transparent",
        transition: "background-color 0.2s ease",
      }}
    >
      {/* Row header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          cursor: canExpand ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={() => canExpand && setExpanded((v) => !v)}
      >
        <span style={{ fontSize: "14px", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
        <span
          style={{
            ...FONT_STYLE,
            flex: 1,
            color: "#1a1a2e",
          }}
        >
          {question.label}
        </span>
        <span
          style={{
            ...FONT_STYLE,
            fontWeight: 700,
            color: scoreColor,
            whiteSpace: "nowrap",
            marginRight: canExpand ? "6px" : 0,
          }}
        >
          {formatScore(question.score)}/{formatScore(question.maxScore)}
        </span>
        {canExpand && (
          <span
            style={{
              display: "inline-block",
              color: "#999",
              fontSize: "10px",
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ▼
          </span>
        )}
      </div>

      {/* Expanded feedback area */}
      <div
        style={{
          maxHeight: expanded && canExpand ? "400px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div style={{ padding: "0 12px 12px 36px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {question.studentAnswer !== undefined && (
            <div
              style={{
                ...FONT_STYLE,
                backgroundColor:
                  question.isCorrect
                    ? "rgba(15,182,163,0.08)"
                    : question.isPartial
                    ? "rgba(255,178,0,0.10)"
                    : "rgba(255,90,95,0.08)",
                borderRadius: "6px",
                padding: "6px 10px",
                borderLeft: `3px solid ${
                  question.isCorrect ? "#0FB6A3" : question.isPartial ? "#FFB200" : "#FF5A5F"
                }`,
              }}
            >
              <span style={{ ...FONT_STYLE, fontWeight: 700, color: "#555" }}>Votre réponse : </span>
              <span style={{ ...FONT_STYLE, color: "#222" }}>
                {question.studentAnswer || <em style={{ color: "#aaa" }}>—</em>}
              </span>
            </div>
          )}

          {question.referenceAnswer && !question.isCorrect && (
            <div
              style={{
                ...FONT_STYLE,
                backgroundColor: "rgba(15,182,163,0.08)",
                borderRadius: "6px",
                padding: "6px 10px",
                borderLeft: "3px solid #0FB6A3",
              }}
            >
              <span style={{ ...FONT_STYLE, fontWeight: 700, color: "#555" }}>Réponse correcte : </span>
              <span style={{ ...FONT_STYLE, color: "#222" }}>{question.referenceAnswer}</span>
            </div>
          )}

          {question.feedback_fr && (
            <div
              style={{
                ...FONT_STYLE,
                backgroundColor: "rgba(108,76,224,0.06)",
                borderRadius: "6px",
                padding: "6px 10px",
                borderLeft: "3px solid #6C4CE0",
                color: "#444",
                fontStyle: "italic",
              }}
            >
              {question.feedback_fr}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: SectionResult }) {
  const [expanded, setExpanded] = useState(true);

  const sectionScore = section.questions.reduce((sum, q) => sum + q.score, 0);
  const sectionMax = section.questions.reduce((sum, q) => sum + q.maxScore, 0);

  return (
    <div
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
        borderLeft: `4px solid ${section.color}`,
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          cursor: "pointer",
          userSelect: "none",
          gap: "10px",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          style={{
            ...FONT_STYLE,
            flex: 1,
            fontWeight: 700,
            color: "#1a1a2e",
            fontSize: "13px",
          }}
        >
          {section.title}
        </span>
        <span
          style={{
            ...FONT_STYLE,
            fontWeight: 700,
            color: section.color,
            backgroundColor: `${section.color}18`,
            borderRadius: "20px",
            padding: "2px 10px",
          }}
        >
          {formatScore(sectionScore)}/{formatScore(sectionMax)}
        </span>
        <span
          style={{
            display: "inline-block",
            color: "#999",
            fontSize: "10px",
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            lineHeight: 1,
          }}
        >
          ▼
        </span>
      </div>

      {/* Questions list */}
      <div
        style={{
          maxHeight: expanded ? "2000px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <div style={{ borderTop: `1px solid ${section.color}30` }}>
          {section.questions.map((q) => (
            <QuestionRow key={q.id} question={q} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExamResults({
  totalScore,
  maxScore,
  percentage,
  sectionResults,
  onRetry,
  onBack,
}: ExamResultsProps) {
  const scoreColor = getScoreColor(percentage);
  const scoreLabel = getScoreLabel(percentage);

  return (
    <div
      style={{
        ...FONT_STYLE,
        minHeight: "100vh",
        backgroundColor: "#f5f4fc",
        padding: "24px 16px 100px",
        maxWidth: "760px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Overall score card */}
      <div
        style={{
          borderRadius: "20px",
          background: "#fff",
          boxShadow: "0 4px 20px rgba(108,76,224,0.10)",
          padding: "28px 24px 20px",
          marginBottom: "24px",
          textAlign: "center",
          border: "1px solid rgba(108,76,224,0.1)",
        }}
      >
        {/* Score label */}
        <div
          style={{
            ...FONT_STYLE,
            fontWeight: 700,
            fontSize: "24px",
            color: scoreColor,
            letterSpacing: "-0.5px",
            marginBottom: "6px",
          }}
        >
          {formatScore(totalScore)} / {formatScore(maxScore)}
        </div>

        {/* Motivational text */}
        <div
          style={{
            ...FONT_STYLE,
            color: "#555",
            fontWeight: 600,
            marginBottom: "10px",
          }}
        >
          {scoreLabel}
        </div>

        {/* Percentage pill */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <span
            style={{
              ...FONT_STYLE,
              backgroundColor: `${scoreColor}18`,
              color: scoreColor,
              borderRadius: "20px",
              padding: "3px 14px",
              fontWeight: 700,
              border: `1px solid ${scoreColor}40`,
            }}
          >
            {percentage % 1 === 0 ? percentage : percentage.toFixed(1)}%
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: "10px",
            borderRadius: "6px",
            backgroundColor: "rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, percentage)}%`,
              borderRadius: "6px",
              background:
                percentage >= 70
                  ? "linear-gradient(90deg, #0FB6A3, #6C4CE0)"
                  : percentage >= 50
                  ? "linear-gradient(90deg, #FFB200, #FF8C42)"
                  : "linear-gradient(90deg, #FF5A5F, #FF8C42)",
              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* Section cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sectionResults.map((section, idx) => (
          <SectionCard key={idx} section={section} />
        ))}
      </div>

      {/* Bottom action bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          padding: "12px 16px",
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          zIndex: 50,
        }}
      >
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              ...FONT_STYLE,
              padding: "10px 24px",
              borderRadius: "10px",
              border: "2px solid #6C4CE0",
              backgroundColor: "transparent",
              color: "#6C4CE0",
              fontWeight: 700,
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "rgba(108,76,224,0.06)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "transparent")
            }
          >
            Recommencer
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              ...FONT_STYLE,
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #6C4CE0, #8B6FE8)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(108,76,224,0.30)",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = "1")}
          >
            Retour aux examens
          </button>
        )}
      </div>
    </div>
  );
}

export default ExamResults;
