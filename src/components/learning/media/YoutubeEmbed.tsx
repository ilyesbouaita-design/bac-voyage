// ---------------------------------------------------------------------------
// YoutubeEmbed
// Extracts the video ID from any YouTube URL format and renders a responsive
// 16:9 iframe embed with rounded corners.
// ---------------------------------------------------------------------------

interface YoutubeEmbedProps {
  videoUrl: string;
  title?: string;
}

// Handles formats:
//   https://www.youtube.com/watch?v=VIDEO_ID
//   https://youtu.be/VIDEO_ID
//   https://www.youtube.com/embed/VIDEO_ID
//   https://youtube.com/shorts/VIDEO_ID
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Already an embed URL
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/embed/")[1].split("?")[0] ?? null;
    }
    // Shorts
    if (parsed.pathname.startsWith("/shorts/")) {
      return parsed.pathname.split("/shorts/")[1].split("?")[0] ?? null;
    }
    // youtu.be short-links
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
    // Standard watch URL
    const v = parsed.searchParams.get("v");
    if (v) return v;
  } catch {
    // Not a valid URL — try a simple regex fallback
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    if (match) return match[1] ?? null;
  }
  return null;
}

export default function YoutubeEmbed({ videoUrl, title }: YoutubeEmbedProps) {
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 16,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          color: "#b91c1c",
        }}
      >
        <span style={{ fontSize: 20 }}>⚠️</span>
        <span>URL YouTube invalide : {videoUrl}</span>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
      }}
    >
      {/* Optional title */}
      {title && (
        <div
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          {title}
        </div>
      )}

      {/* 16:9 responsive wrapper */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 9/16 = 56.25%
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          background: "#000",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <iframe
          src={embedUrl}
          title={title ?? `Vidéo YouTube ${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          loading="lazy"
        />
      </div>

      {/* Footer with link to original */}
      <div
        style={{
          marginTop: 6,
          textAlign: "right",
        }}
      >
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#6b7280",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget).style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.textDecoration = "none";
          }}
        >
          ↗ Ouvrir sur YouTube
        </a>
      </div>
    </div>
  );
}
