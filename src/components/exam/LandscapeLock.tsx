import React, { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// LandscapeLock
// Forces landscape orientation on mobile devices.
// Wraps children; shows a rotation prompt when in portrait mode on small screens.
// ---------------------------------------------------------------------------

interface LandscapeLockProps {
  children: React.ReactNode;
}

const BASE_FONT: React.CSSProperties = {
  fontFamily: "Times New Roman, Times, serif",
  fontSize: "12px",
};

function isPortraitMobile(): boolean {
  if (typeof window === "undefined") return false;
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  const mobile = window.innerWidth < 768;
  return portrait && mobile;
}

export function LandscapeLock({ children }: LandscapeLockProps) {
  const [needsRotation, setNeedsRotation] = useState<boolean>(isPortraitMobile);

  useEffect(() => {
    // Attempt to lock orientation via Screen Orientation API
    if (
      typeof screen !== "undefined" &&
      screen.orientation &&
      typeof (screen.orientation as any).lock === "function"
    ) {
      (screen.orientation as any).lock("landscape").catch(() => {
        // API may be rejected (e.g. not in fullscreen) — fall back to overlay
      });
    }

    const mql = window.matchMedia("(orientation: portrait)");

    const handleChange = () => {
      setNeedsRotation(isPortraitMobile());
    };

    // Modern API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
    } else {
      // Legacy
      mql.addListener(handleChange);
    }

    // Also listen for resize (covers cases where matchMedia alone isn't enough)
    window.addEventListener("resize", handleChange);

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handleChange);
      } else {
        mql.removeListener(handleChange);
      }
      window.removeEventListener("resize", handleChange);
    };
  }, []);

  // Inject portrait body overflow hidden via a <style> tag
  useEffect(() => {
    const styleId = "landscape-lock-style";
    let el = document.getElementById(styleId) as HTMLStyleElement | null;

    if (needsRotation) {
      if (!el) {
        el = document.createElement("style");
        el.id = styleId;
        document.head.appendChild(el);
      }
      el.textContent = `@media (max-width: 768px) { body { overflow: hidden !important; } }`;
    } else {
      if (el) {
        el.remove();
      }
    }

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
    };
  }, [needsRotation]);

  if (!needsRotation) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "rgba(15, 10, 40, 0.93)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "24px",
        }}
      >
        {/* Animated phone rotation icon */}
        <div
          style={{
            animation: "rotate-phone 1.8s ease-in-out infinite",
            color: "#6c4fc5",
            fontSize: "56px",
            lineHeight: 1,
          }}
        >
          &#128241;
        </div>

        {/* French message */}
        <p
          style={{
            ...BASE_FONT,
            color: "#ffffff",
            textAlign: "center",
            margin: 0,
            lineHeight: "1.7",
          }}
        >
          Veuillez tourner votre appareil en mode paysage
        </p>

        {/* Arabic message */}
        <p
          style={{
            ...BASE_FONT,
            color: "#c4b8e8",
            textAlign: "center",
            direction: "rtl",
            margin: 0,
            lineHeight: "1.7",
          }}
        >
          يرجى تدوير جهازك إلى الوضع الأفقي
        </p>
      </div>

      {/* Keyframe animation injected inline */}
      <style>{`
        @keyframes rotate-phone {
          0%   { transform: rotate(0deg);   }
          30%  { transform: rotate(0deg);   }
          60%  { transform: rotate(90deg);  }
          90%  { transform: rotate(90deg);  }
          100% { transform: rotate(0deg);   }
        }
      `}</style>
    </>
  );
}

export default LandscapeLock;
