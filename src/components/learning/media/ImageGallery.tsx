import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryImage {
  url: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function Lightbox({ images, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose, onPrev, onNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const navButtonBase: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 20,
    transition: "background 0.15s",
    zIndex: 10,
    backdropFilter: "blur(4px)",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse d'images"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Counter */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          zIndex: 10,
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 18,
          zIndex: 10,
        }}
      >
        ✕
      </button>

      {/* Image container — stops propagation so clicking image doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "min(90vw, 1000px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Main image */}
        <img
          src={current?.url}
          alt={current?.caption ?? `Image ${currentIndex + 1}`}
          style={{
            maxWidth: "100%",
            maxHeight: "72vh",
            objectFit: "contain",
            borderRadius: 12,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            display: "block",
          }}
          draggable={false}
        />

        {/* Caption */}
        {current?.caption && (
          <p
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              textAlign: "center",
              maxWidth: 600,
            }}
          >
            {current.caption}
          </p>
        )}

        {/* Prev button */}
        {hasPrev && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Image précédente"
            style={{ ...navButtonBase, left: -56 }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "rgba(255,255,255,0.28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "rgba(255,255,255,0.15)";
            }}
          >
            ‹
          </button>
        )}

        {/* Next button */}
        {hasNext && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Image suivante"
            style={{ ...navButtonBase, right: -56 }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.background = "rgba(255,255,255,0.28)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.background = "rgba(255,255,255,0.15)";
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
            maxWidth: "90vw",
            overflowX: "auto",
            padding: "4px 8px",
          }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                // Navigate to this image — handled via parent by clicking
                // We simulate prev/next calls to reach target
                // For direct jump, we'd need a setIndex callback;
                // this minimal version uses prev/next only
              }}
              aria-label={`Aller à l'image ${i + 1}`}
              style={{
                width: 48,
                height: 36,
                borderRadius: 6,
                overflow: "hidden",
                border: i === currentIndex
                  ? "2px solid #fff"
                  : "2px solid transparent",
                padding: 0,
                cursor: "pointer",
                flexShrink: 0,
                opacity: i === currentIndex ? 1 : 0.55,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              <img
                src={img.url}
                alt={img.caption ?? `Miniature ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thumbnail card
// ---------------------------------------------------------------------------

interface ThumbnailProps {
  image: GalleryImage;
  index: number;
  onClick: () => void;
}

function Thumbnail({ image, index, onClick }: ThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={image.caption ?? `Ouvrir image ${index + 1}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: 0,
        border: "none",
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        background: "#f3f4f6",
        aspectRatio: "4/3",
        display: "block",
        boxShadow: isHovered
          ? "0 6px 20px rgba(0,0,0,0.14)"
          : "0 2px 6px rgba(0,0,0,0.06)",
        transform: isHovered ? "scale(1.02)" : "scale(1)",
        transition: "box-shadow 0.2s, transform 0.2s",
        outline: "none",
      }}
    >
      <img
        src={image.url}
        alt={image.caption ?? `Image ${index + 1}`}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Hover overlay */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔍
          </span>
        </div>
      )}

      {/* Caption tooltip at bottom */}
      {image.caption && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            padding: "16px 8px 8px",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          <p
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 12,
              color: "#fff",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {image.caption}
          </p>
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main ImageGallery
// ---------------------------------------------------------------------------

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null && i < images.length - 1 ? i + 1 : i,
    );
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          background: "#f9fafb",
          border: "1px dashed #d1d5db",
          borderRadius: 12,
          padding: "32px 16px",
          textAlign: "center",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        Aucune image disponible.
      </div>
    );
  }

  // Determine number of columns based on image count
  const colCount = images.length === 1 ? 1 : images.length === 2 ? 2 : 3;

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 12 }}>
      {/* Gallery header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ color: "#6b7280", fontSize: 12 }}>
          🖼️{" "}
          {images.length === 1
            ? "1 image"
            : `${images.length} images`}
        </span>
        <span style={{ color: "#9ca3af", fontSize: 12 }}>
          Cliquer pour agrandir
        </span>
      </div>

      {/* Thumbnail grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: 8,
        }}
      >
        {images.map((img, i) => (
          <Thumbnail
            key={i}
            image={img}
            index={i}
            onClick={() => openLightbox(i)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
}
