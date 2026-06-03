import { useState, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
}

// ---------------------------------------------------------------------------
// Zoom levels
// ---------------------------------------------------------------------------

const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

function getNextZoom(current: ZoomLevel, direction: "in" | "out"): ZoomLevel {
  const idx = ZOOM_LEVELS.indexOf(current);
  if (direction === "in") {
    return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, idx + 1)] ?? current;
  }
  return ZOOM_LEVELS[Math.max(0, idx - 1)] ?? current;
}

// ---------------------------------------------------------------------------
// Control button
// ---------------------------------------------------------------------------

interface CtrlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon: string;
  label: string;
  variant?: "default" | "primary" | "danger";
}

function CtrlButton({
  onClick,
  disabled,
  title,
  icon,
  label,
  variant = "default",
}: CtrlButtonProps) {
  const [hovered, setHovered] = useState(false);

  const bg =
    variant === "primary"
      ? hovered ? "#5a3ec8" : "#6C4CE0"
      : variant === "danger"
      ? hovered ? "#b91c1c" : "#dc2626"
      : hovered ? "#e5e7eb" : "#f3f4f6";

  const color =
    variant === "primary" || variant === "danger" ? "#fff" : "#374151";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 10px",
        background: disabled ? "#f3f4f6" : bg,
        border: "1px solid",
        borderColor: disabled ? "#e5e7eb" : variant !== "default" ? "transparent" : "#d1d5db",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.15s, border-color 0.15s",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        color: disabled ? "#9ca3af" : color,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// PdfViewer
// ---------------------------------------------------------------------------

export default function PdfViewer({ pdfUrl, title }: PdfViewerProps) {
  const [zoom, setZoom] = useState<ZoomLevel>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const zoomIn = useCallback(() => {
    setZoom((z) => getNextZoom(z, "in"));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => getNextZoom(z, "out"));
  }, []);

  const handlePrint = useCallback(() => {
    // Open PDF in new tab for printing
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }, [pdfUrl]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!isFullscreen) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not supported — fallback to CSS expand
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
      } catch { /* ignore */ }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // The iframe source: use the PDF URL directly.
  // For Google Drive PDFs, append #toolbar=1. For other PDFs use as-is.
  // Browsers that support PDF viewing will render natively.
  const iframeSrc = pdfUrl.includes("docs.google.com")
    ? pdfUrl
    : `${pdfUrl}#toolbar=0&navpanes=0`;

  const canZoomIn = zoom < ZOOM_LEVELS[ZOOM_LEVELS.length - 1]!;
  const canZoomOut = zoom > ZOOM_LEVELS[0]!;

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: isFullscreen ? 0 : 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        position: isFullscreen ? "fixed" : "relative",
        inset: isFullscreen ? 0 : "auto",
        zIndex: isFullscreen ? 3000 : "auto",
        height: isFullscreen ? "100vh" : "auto",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Controls bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* PDF icon + title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
          {title && (
            <span
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          )}
        </div>

        {/* Zoom controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "2px 4px",
          }}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut}
            aria-label="Réduire le zoom"
            title="Zoom -"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "none",
              background: canZoomOut ? "#f3f4f6" : "transparent",
              cursor: canZoomOut ? "pointer" : "not-allowed",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 16,
              color: canZoomOut ? "#374151" : "#d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (canZoomOut) (e.currentTarget).style.background = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              if (canZoomOut) (e.currentTarget).style.background = "#f3f4f6";
            }}
          >
            −
          </button>

          {/* Zoom level display */}
          <span
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#374151",
              minWidth: 36,
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {zoom}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            disabled={!canZoomIn}
            aria-label="Augmenter le zoom"
            title="Zoom +"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "none",
              background: canZoomIn ? "#f3f4f6" : "transparent",
              cursor: canZoomIn ? "pointer" : "not-allowed",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 16,
              color: canZoomIn ? "#374151" : "#d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (canZoomIn) (e.currentTarget).style.background = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              if (canZoomIn) (e.currentTarget).style.background = "#f3f4f6";
            }}
          >
            +
          </button>
        </div>

        {/* Print button */}
        <CtrlButton
          onClick={handlePrint}
          icon="🖨️"
          label="Imprimer"
          title="Ouvrir et imprimer le PDF"
          variant="default"
        />

        {/* Download link */}
        <a
          href={pdfUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            background: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            textDecoration: "none",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#374151",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#e5e7eb";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#f3f4f6";
          }}
          title="Télécharger le PDF"
          aria-label="Télécharger le PDF"
        >
          <span style={{ fontSize: 14 }}>⬇️</span>
          <span>Télécharger</span>
        </a>

        {/* Fullscreen button */}
        <CtrlButton
          onClick={toggleFullscreen}
          icon={isFullscreen ? "⊠" : "⛶"}
          label={isFullscreen ? "Réduire" : "Plein écran"}
          title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          variant={isFullscreen ? "danger" : "primary"}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PDF iframe                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "auto",
          background: "#e5e7eb",
          minHeight: isFullscreen ? "calc(100vh - 56px)" : 480,
        }}
      >
        {/* Loading overlay */}
        {isLoading && !hasError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "#f3f4f6",
              zIndex: 1,
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid #e5e7eb",
                borderTopColor: "#6C4CE0",
                borderRadius: "50%",
                animation: "pdf-spin 0.8s linear infinite",
              }}
            />
            <span>Chargement du document...</span>
            <style>{`
              @keyframes pdf-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "#fef2f2",
              zIndex: 1,
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#b91c1c",
              padding: 24,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 36 }}>⚠️</span>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Impossible d'afficher le PDF dans le navigateur.
            </p>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Essayez de télécharger le fichier directement.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                background: "#6C4CE0",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Ouvrir le PDF ↗
            </a>
          </div>
        )}

        {/* Scaled wrapper */}
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            width: `${(100 * 100) / zoom}%`,
            height: `${(100 * 100) / zoom}%`,
            // When zoomed, we scale up/down and adjust container to fit
          }}
        >
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            title={title ?? "Document PDF"}
            onLoad={() => setIsLoading(false)}
            onError={() => { setIsLoading(false); setHasError(true); }}
            style={{
              width: "100%",
              height: isFullscreen ? "calc(100vh - 56px)" : 480,
              border: "none",
              display: "block",
            }}
            allow="fullscreen"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer status bar                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#9ca3af",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "70%",
          }}
        >
          {pdfUrl}
        </span>
        <span
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {isFullscreen ? "Plein écran" : `Zoom : ${zoom}%`}
        </span>
      </div>
    </div>
  );
}
