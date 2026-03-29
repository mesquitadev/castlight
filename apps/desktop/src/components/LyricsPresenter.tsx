import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { presentLyrics, clearPresentation } from "../store/slices/presentation";
import type { Song } from "@castlight/shared";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

interface Props {
  song: Song;
  onClose: () => void;
}

function broadcastLyrics(data: any) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "content:lyrics",
      roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
      data,
    }),
  });
}

function broadcastClear() {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "content:clear",
      roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
      data: "blank",
    }),
  });
  // Restore wallpaper
  fetch(`http://localhost:${SIDECAR_PORT}/api/settings/default_wallpaper`)
    .then((r) => r.json())
    .then((config) => {
      if (config?.type) {
        fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "background:change",
            roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
            data: config,
          }),
        });
      }
    });
}

export function LyricsPresenter({ song, onClose }: Props) {
  const dispatch = useDispatch();
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const total = song.sections.length;

  const sendSlide = useCallback((index: number) => {
    if (index < 0 || index >= total) return;
    setActiveSlide(index);
    const section = song.sections[index];
    const nextSection = song.sections[index + 1] ?? null;
    const data = { section, nextSection, song: { title: song.title, artist: song.artist, key: song.key } };
    dispatch(presentLyrics(data));
    broadcastLyrics(data);
  }, [song, total, dispatch]);

  const handleClear = useCallback(() => {
    setActiveSlide(null);
    dispatch(clearPresentation());
    broadcastClear();
  }, [dispatch]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        if (activeSlide === null) sendSlide(0);
        else if (activeSlide < total - 1) sendSlide(activeSlide + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (activeSlide !== null && activeSlide > 0) sendSlide(activeSlide - 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, total, sendSlide, handleClear]);

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--color-surface-300)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} style={{ color: "var(--color-surface-700)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#fff" }}>{song.title}</h3>
            <p className="text-[11px]" style={{ color: "var(--color-surface-700)" }}>
              {song.artist}{song.key ? ` · Tom: ${song.key}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSlide === null ? (
            <button onClick={() => sendSlide(0)} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-surface-50)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Iniciar
            </button>
          ) : (
            <button onClick={handleClear} className="btn btn-danger" style={{ padding: "6px 14px", fontSize: "12px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Parar
            </button>
          )}
          <span className="text-[11px] px-2" style={{ color: "var(--color-surface-600)", fontFamily: "var(--font-mono)" }}>
            {activeSlide !== null ? `${activeSlide + 1}/${total}` : `${total} slides`}
          </span>
        </div>
      </div>

      {/* Slides grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-3">
          {/* First slide: Title + Artist */}
          <button
            onClick={() => {
              // Title slide doesn't project content, just clears
              setActiveSlide(-1);
              handleClear();
            }}
            className="aspect-video rounded-lg flex flex-col items-center justify-center transition-all"
            style={{
              background: "var(--color-surface-100)",
              border: activeSlide === -1 ? "2px solid var(--color-accent)" : "1px solid var(--color-surface-300)",
              boxShadow: activeSlide === -1 ? "0 0 12px var(--color-accent-glow)" : "none",
            }}
          >
            <p className="text-sm font-bold" style={{ color: "#fff" }}>{song.title}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-surface-700)" }}>{song.artist}</p>
          </button>

          {/* Section slides */}
          {song.sections.map((section, i) => {
            const isActive = activeSlide === i;
            return (
              <button
                key={section.id}
                onClick={() => sendSlide(i)}
                className="aspect-video rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all overflow-hidden relative"
                style={{
                  background: "var(--color-surface-100)",
                  border: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-surface-300)",
                  boxShadow: isActive ? "0 0 12px var(--color-accent-glow)" : "none",
                }}
              >
                {/* Slide number badge */}
                <span className="absolute top-2 left-2 text-[9px] font-bold rounded px-1.5 py-0.5" style={{
                  background: isActive ? "var(--color-accent)" : "var(--color-surface-400)",
                  color: isActive ? "var(--color-surface-50)" : "var(--color-surface-800)",
                }}>
                  {i + 1}
                </span>

                {/* Section type badge */}
                <span className="absolute top-2 right-2 text-[9px] font-semibold uppercase" style={{
                  color: isActive ? "var(--color-accent)" : "var(--color-surface-600)",
                }}>
                  {section.label}
                </span>

                {/* Text */}
                <p className="text-xs leading-relaxed whitespace-pre-line line-clamp-5" style={{
                  color: isActive ? "#fff" : "var(--color-surface-800)",
                  textShadow: isActive ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
                }}>
                  {section.text}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-5 py-2 flex-shrink-0" style={{ borderTop: "1px solid var(--color-surface-300)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => activeSlide !== null && activeSlide > 0 && sendSlide(activeSlide - 1)}
            disabled={activeSlide === null || activeSlide <= 0}
            className="btn btn-secondary disabled:opacity-30"
            style={{ padding: "5px 12px", fontSize: "11px" }}
          >
            Anterior
          </button>
          <button
            onClick={() => {
              if (activeSlide === null) sendSlide(0);
              else if (activeSlide < total - 1) sendSlide(activeSlide + 1);
            }}
            disabled={activeSlide === total - 1}
            className="btn btn-primary disabled:opacity-30"
            style={{ padding: "5px 12px", fontSize: "11px" }}
          >
            Proximo
          </button>
        </div>
        <span className="text-[10px]" style={{ color: "var(--color-surface-600)", fontFamily: "var(--font-mono)" }}>
          ← → Navegar · Espaco Proximo · Esc Parar
        </span>
      </div>
    </div>
  );
}
