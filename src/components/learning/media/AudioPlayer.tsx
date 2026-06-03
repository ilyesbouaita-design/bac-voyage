import { useState, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  transcript?: string;
}

// ---------------------------------------------------------------------------
// Time formatting helper
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// AudioPlayer
// ---------------------------------------------------------------------------

export default function AudioPlayer({ audioUrl, title, transcript }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Sync audio element state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => { setIsLoading(false); setHasError(false); };
    const onError = () => { setHasError(true); setIsLoading(false); };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch {
        setHasError(true);
      }
    }
  }, [isPlaying]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changeVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      if (v === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const skipSeconds = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  }, [duration]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const volumeIcon = isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊";

  // ---------------------------------------------------------------------------
  // Waveform visualizer (static decorative bars)
  // ---------------------------------------------------------------------------
  const barHeights = [30, 55, 40, 70, 45, 85, 50, 65, 35, 75, 60, 50, 80, 45, 55];

  return (
    <div
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 12,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* ------------------------------------------------------------------ */}
      {/* Header / decorative section                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          background: "linear-gradient(135deg, #6C4CE0 0%, #8B5CF6 100%)",
          padding: "20px 20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 24 }}>🔊</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title ?? "Fichier audio"}
            </p>
            <p
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                margin: "2px 0 0",
              }}
            >
              {hasError ? "Erreur de chargement" : formatTime(duration)}
            </p>
          </div>
        </div>

        {/* Decorative waveform */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            height: 40,
            opacity: isPlaying ? 1 : 0.5,
            transition: "opacity 0.3s",
          }}
          aria-hidden="true"
        >
          {barHeights.map((h, i) => {
            const barPct = (i / barHeights.length) * 100;
            const isPast = barPct <= progressPct;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: isPast
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  transition: "background 0.1s",
                  animation: isPlaying
                    ? `wave-bar-${i % 5} ${0.8 + (i % 3) * 0.15}s ease-in-out infinite alternate`
                    : "none",
                }}
              />
            );
          })}
          <style>{`
            @keyframes wave-bar-0 { from { transform: scaleY(1); } to { transform: scaleY(1.3); } }
            @keyframes wave-bar-1 { from { transform: scaleY(0.9); } to { transform: scaleY(1.4); } }
            @keyframes wave-bar-2 { from { transform: scaleY(1.1); } to { transform: scaleY(0.7); } }
            @keyframes wave-bar-3 { from { transform: scaleY(1); } to { transform: scaleY(1.5); } }
            @keyframes wave-bar-4 { from { transform: scaleY(0.8); } to { transform: scaleY(1.2); } }
          `}</style>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Progress bar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ padding: "12px 20px 0" }}>
        {/* Clickable progress track */}
        <div
          ref={progressBarRef}
          onClick={seek}
          role="slider"
          aria-label="Position de lecture"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") skipSeconds(-5);
            if (e.key === "ArrowRight") skipSeconds(5);
          }}
          style={{
            height: 6,
            background: "#e5e7eb",
            borderRadius: 999,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Filled part */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #6C4CE0, #8B5CF6)",
              borderRadius: 999,
              transition: "width 0.1s linear",
            }}
          />
        </div>

        {/* Time labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Controls                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px 16px",
          gap: 8,
        }}
      >
        {/* Left: skip back + play/pause + skip forward */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Skip back 10s */}
          <button
            type="button"
            onClick={() => skipSeconds(-10)}
            aria-label="Reculer de 10 secondes"
            title="-10s"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 14,
              color: "#374151",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "#f3f4f6"; }}
          >
            ⏮
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={hasError}
            aria-label={isPlaying ? "Pause" : "Lecture"}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "none",
              background: hasError ? "#fee2e2" : "linear-gradient(135deg, #6C4CE0, #8B5CF6)",
              cursor: hasError ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "#fff",
              boxShadow: hasError ? "none" : "0 4px 12px rgba(108,76,224,0.35)",
              transition: "transform 0.1s, box-shadow 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!hasError) {
                (e.currentTarget).style.transform = "scale(1.05)";
                (e.currentTarget).style.boxShadow = "0 6px 16px rgba(108,76,224,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.transform = "scale(1)";
              (e.currentTarget).style.boxShadow = "0 4px 12px rgba(108,76,224,0.35)";
            }}
          >
            {hasError ? "⚠️" : isLoading ? "⏳" : isPlaying ? "⏸" : "▶"}
          </button>

          {/* Skip forward 10s */}
          <button
            type="button"
            onClick={() => skipSeconds(10)}
            aria-label="Avancer de 10 secondes"
            title="+10s"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "#f3f4f6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 14,
              color: "#374151",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = "#f3f4f6"; }}
          >
            ⏭
          </button>
        </div>

        {/* Right: volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Activer le son" : "Couper le son"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: 2,
              lineHeight: 1,
            }}
          >
            {volumeIcon}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={changeVolume}
            aria-label="Volume"
            style={{
              width: 72,
              accentColor: "#6C4CE0",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Transcript (collapsible)                                             */}
      {/* ------------------------------------------------------------------ */}
      {transcript && (
        <div
          style={{
            borderTop: "1px solid #f3f4f6",
            margin: "0 16px",
          }}
        >
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setTranscriptOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "10px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#374151",
              textAlign: "left",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>📃</span>
              <span>Transcription / Transkript</span>
            </span>
            <span style={{ color: "#6C4CE0", fontSize: 10 }}>
              {transcriptOpen ? "▲ Réduire" : "▼ Afficher"}
            </span>
          </button>

          {/* Collapsible body */}
          {transcriptOpen && (
            <div
              style={{
                paddingBottom: 16,
                paddingLeft: 4,
                paddingRight: 4,
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 12,
                color: "#374151",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                background: "#f9fafb",
                borderRadius: 8,
                padding: "12px",
                marginBottom: 8,
              }}
            >
              {transcript}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div
          style={{
            margin: "0 16px 12px",
            padding: "8px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 12,
            color: "#b91c1c",
          }}
        >
          Impossible de charger le fichier audio. Vérifiez l'URL.
        </div>
      )}
    </div>
  );
}
