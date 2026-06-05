import React, { useState, useEffect, useCallback } from "react";

/**
 * LandscapeLock — forces fullscreen + landscape on mobile.
 *
 * Flow:
 * 1. On mobile portrait: shows a "Start fullscreen" button (required by browser — can't auto-fullscreen)
 * 2. User taps the button → requests fullscreen → locks landscape orientation
 * 3. Exam content is shown in fullscreen landscape
 * 4. If user exits fullscreen → shows the button again
 */

interface LandscapeLockProps {
  children: React.ReactNode;
}

const FONT: React.CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, serif",
  fontSize: "12px",
};

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function LandscapeLock({ children }: LandscapeLockProps) {
  const [mobile] = useState(isMobile);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    if (!mobile) return;

    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);

      // If we entered fullscreen, try to lock landscape
      if (fs) {
        try {
          const orientation = screen?.orientation;
          if (orientation && typeof (orientation as any).lock === "function") {
            (orientation as any).lock("landscape").catch(() => {});
          }
        } catch {}
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [mobile]);

  // Request fullscreen + landscape
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      }
      // Landscape lock happens in the fullscreenchange handler
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
      // If fullscreen fails, just dismiss and show content anyway
      setDismissed(true);
    }
  }, []);

  // Skip on mobile if already dismissed
  const skipOverlay = useCallback(() => {
    setDismissed(true);
  }, []);

  // Not mobile → just render children
  if (!mobile) {
    return <>{children}</>;
  }

  // Mobile + fullscreen → render children (we're in landscape fullscreen)
  if (isFullscreen || dismissed) {
    return <>{children}</>;
  }

  // Mobile + not fullscreen → show the fullscreen prompt
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "linear-gradient(135deg, #1a1035 0%, #2a1f4e 50%, #1a1035 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "32px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #6C4CE0, #FF5A5F)",
            color: "#fff",
            fontSize: "24px",
            fontWeight: "bold",
            display: "grid",
            placeItems: "center",
          }}
        >
          B
        </div>

        {/* Title */}
        <h1
          style={{
            ...FONT,
            fontSize: "16px",
            fontWeight: "bold",
            color: "#ffffff",
            textAlign: "center",
            margin: 0,
          }}
        >
          BacAllemand
        </h1>

        {/* Phone rotation animation */}
        <div
          style={{
            fontSize: "48px",
            lineHeight: 1,
            animation: "rotate-phone 2s ease-in-out infinite",
          }}
        >
          📱
        </div>

        {/* Instructions */}
        <p
          style={{
            ...FONT,
            fontSize: "13px",
            color: "#e0d8f0",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.7,
            maxWidth: "280px",
          }}
        >
          Pour une meilleure expérience d'examen, passez en mode plein écran paysage.
        </p>
        <p
          style={{
            ...FONT,
            fontSize: "12px",
            color: "#b0a8c8",
            textAlign: "center",
            direction: "rtl",
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          للحصول على تجربة أفضل، انتقل إلى وضع ملء الشاشة الأفقي.
        </p>

        {/* Fullscreen button */}
        <button
          onClick={enterFullscreen}
          style={{
            ...FONT,
            fontSize: "14px",
            fontWeight: "bold",
            color: "#ffffff",
            background: "linear-gradient(90deg, #6C4CE0, #FF5A5F)",
            border: "none",
            borderRadius: "16px",
            padding: "16px 40px",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(108, 76, 224, 0.4)",
            marginTop: "8px",
          }}
        >
          🔲 Plein écran paysage
        </button>

        {/* Skip link */}
        <button
          onClick={skipOverlay}
          style={{
            ...FONT,
            fontSize: "11px",
            color: "#8078a0",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            marginTop: "4px",
          }}
        >
          Continuer sans plein écran
        </button>
      </div>

      <style>{`
        @keyframes rotate-phone {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(0deg); }
          50%  { transform: rotate(90deg); }
          75%  { transform: rotate(90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  );
}

export default LandscapeLock;
