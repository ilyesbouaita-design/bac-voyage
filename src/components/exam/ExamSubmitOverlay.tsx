import { useEffect, useState } from "react";

interface ExamSubmitOverlayProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  status: "confirm" | "submitting" | "grading" | "done" | "error";
  gradingProgress?: number;
  errorMessage?: string;
}

const FONT_STYLE: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

// Inline keyframe injection — done once at module level
const STYLE_ID = "exam-submit-overlay-styles";
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes esoSpin {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes esoPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.55; transform: scale(1.08); }
    }
    @keyframes esoDot {
      0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
      40%            { opacity: 1;   transform: translateY(-5px); }
    }
    @keyframes esoFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes esoSlideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes esoCheckBounce {
      0%   { transform: scale(0.5); opacity: 0; }
      60%  { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes esoIndeterminate {
      0%   { left: -40%; width: 40%; }
      50%  { left: 20%;  width: 60%; }
      100% { left: 110%; width: 40%; }
    }
    @keyframes esoBrainWave {
      0%, 100% { filter: hue-rotate(0deg) brightness(1); }
      50%       { filter: hue-rotate(30deg) brightness(1.2); }
    }
  `;
  document.head.appendChild(style);
}
injectStyles();

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        border: "4px solid rgba(108,76,224,0.15)",
        borderTopColor: "#6C4CE0",
        animation: "esoSpin 0.8s linear infinite",
        margin: "0 auto",
      }}
    />
  );
}

function BrainIcon() {
  return (
    <div
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6C4CE0 0%, #0FB6A3 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        fontSize: "28px",
        animation: "esoPulse 1.8s ease-in-out infinite, esoBrainWave 2.4s ease-in-out infinite",
        boxShadow: "0 0 0 0 rgba(108,76,224,0.4)",
      }}
    >
      🤖
    </div>
  );
}

function PulsingDots() {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "4px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: "#6C4CE0",
            animation: `esoDot 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function IndeterminateBar() {
  return (
    <div
      style={{
        position: "relative",
        height: "6px",
        borderRadius: "4px",
        backgroundColor: "rgba(108,76,224,0.12)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          borderRadius: "4px",
          background: "linear-gradient(90deg, #6C4CE0, #8B6FE8)",
          animation: "esoIndeterminate 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function DeterminateBar({ value }: { value: number }) {
  return (
    <div
      style={{
        height: "8px",
        borderRadius: "5px",
        backgroundColor: "rgba(108,76,224,0.12)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          borderRadius: "5px",
          background: "linear-gradient(90deg, #6C4CE0, #0FB6A3)",
          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

// ─── State card contents ───────────────────────────────────────────────────────

function ConfirmCard({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ fontSize: "36px", textAlign: "center", marginBottom: "10px" }}>⚠️</div>
      <h2
        style={{
          ...FONT_STYLE,
          fontSize: "16px",
          fontWeight: 700,
          textAlign: "center",
          color: "#1a1a2e",
          margin: "0 0 10px",
        }}
      >
        Soumettre l'examen ?
      </h2>
      <p
        style={{
          ...FONT_STYLE,
          textAlign: "center",
          color: "#555",
          lineHeight: 1.6,
          margin: "0 0 20px",
        }}
      >
        Une fois soumis, vous ne pourrez plus modifier vos réponses. L'IA corrigera automatiquement
        votre examen.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            ...FONT_STYLE,
            padding: "10px 22px",
            borderRadius: "10px",
            border: "2px solid #6C4CE0",
            backgroundColor: "transparent",
            color: "#6C4CE0",
            fontWeight: 700,
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            ...FONT_STYLE,
            padding: "10px 22px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #FF5A5F, #FF8C42)",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 10px rgba(255,90,95,0.30)",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "En cours…" : "Confirmer la soumission"}
        </button>
      </div>
    </>
  );
}

function SubmittingCard() {
  return (
    <>
      <Spinner />
      <p
        style={{
          ...FONT_STYLE,
          textAlign: "center",
          color: "#444",
          fontWeight: 600,
          margin: "16px 0 12px",
        }}
      >
        Enregistrement de vos réponses…
      </p>
      <IndeterminateBar />
    </>
  );
}

function GradingCard({ progress = 0 }: { progress: number }) {
  // Derive display counts — assume maxQuestions is unknown, show percentage-based text
  const rounded = Math.round(progress);

  return (
    <>
      <BrainIcon />
      <p
        style={{
          ...FONT_STYLE,
          textAlign: "center",
          color: "#1a1a2e",
          fontWeight: 700,
          fontSize: "14px",
          margin: "14px 0 4px",
        }}
      >
        🤖 L'IA corrige votre examen…
      </p>
      <p
        style={{
          ...FONT_STYLE,
          textAlign: "center",
          color: "#888",
          margin: "0 0 14px",
        }}
      >
        {rounded}% corrigé
      </p>
      <DeterminateBar value={progress} />
      <PulsingDots />
    </>
  );
}

function DoneCard({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        style={{
          fontSize: "44px",
          textAlign: "center",
          marginBottom: "10px",
          animation: "esoCheckBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        ✅
      </div>
      <p
        style={{
          ...FONT_STYLE,
          textAlign: "center",
          color: "#0FB6A3",
          fontWeight: 700,
          fontSize: "15px",
          margin: "0 0 18px",
        }}
      >
        Correction terminée !
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onClose}
          style={{
            ...FONT_STYLE,
            padding: "11px 28px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #6C4CE0, #8B6FE8)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(108,76,224,0.30)",
          }}
        >
          Voir les résultats
        </button>
      </div>
    </>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <>
      <div style={{ fontSize: "40px", textAlign: "center", marginBottom: "10px" }}>❌</div>
      <p
        style={{
          ...FONT_STYLE,
          textAlign: "center",
          color: "#FF5A5F",
          fontWeight: 700,
          fontSize: "14px",
          margin: "0 0 8px",
        }}
      >
        Une erreur est survenue
      </p>
      {message && (
        <p
          style={{
            ...FONT_STYLE,
            textAlign: "center",
            color: "#666",
            margin: "0 0 18px",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onRetry}
          style={{
            ...FONT_STYLE,
            padding: "10px 26px",
            borderRadius: "10px",
            border: "2px solid #FF5A5F",
            backgroundColor: "transparent",
            color: "#FF5A5F",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    </>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function ExamSubmitOverlay({
  visible,
  onCancel,
  onConfirm,
  status,
  gradingProgress = 0,
  errorMessage,
}: ExamSubmitOverlayProps) {
  // Keep overlay mounted briefly after hide for fade-out
  const [mounted, setMounted] = useState(visible);
  const [opacity, setOpacity] = useState(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Slight delay to allow CSS transition to fire
      const raf = requestAnimationFrame(() => setOpacity(1));
      return () => cancelAnimationFrame(raf);
    } else {
      setOpacity(0);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  // Dismiss overlay clicks only for confirm state
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (status === "confirm" && e.target === e.currentTarget) {
      onCancel();
    }
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: `rgba(0,0,0,${opacity * 0.5})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          borderRadius: "20px",
          padding: "28px 24px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          animation: `esoSlideUp 0.32s cubic-bezier(0.34,1.2,0.64,1) both`,
          // Prevent click propagation so overlay click doesn't fire on card
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {status === "confirm" && (
          <ConfirmCard onCancel={onCancel} onConfirm={onConfirm} />
        )}

        {status === "submitting" && <SubmittingCard />}

        {status === "grading" && <GradingCard progress={gradingProgress} />}

        {status === "done" && <DoneCard onClose={onCancel} />}

        {status === "error" && (
          <ErrorCard
            message={errorMessage}
            onRetry={() => onConfirm().catch(() => {})}
          />
        )}
      </div>
    </div>
  );
}

export default ExamSubmitOverlay;
