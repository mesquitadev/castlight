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
    const data = {
      section,
      nextSection,
      song: { title: song.title, artist: song.artist, key: song.key },
    };
    dispatch(presentLyrics(data));
    broadcastLyrics(data);
  }, [song, total, dispatch]);

  const handleClear = useCallback(() => {
    setActiveSlide(null);
    dispatch(clearPresentation());
    broadcastClear();
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
  }, [dispatch]);

  // Keyboard navigation
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
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      {/* Top bar — song info + controls */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid var(--color-surface-300)" }}>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-sm" style={{ color: "var(--color-surface-700)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#fff" }}>{song.title}</h3>
            <p className="text-xs" style={{ color: "var(--color-surface-700)" }}>
              {song.artist}{song.key ? ` · Tom: ${song.key}` : ""} · {total} slides
            </p>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {/* Previous */}
          <button
            onClick={() => activeSlide !== null && activeSlide > 0 && sendSlide(activeSlide - 1)}
            disabled={activeSlide === null || activeSlide === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: "var(--color-surface-300)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* Play / Stop */}
          {activeSlide === null ? (
            <button
              onClick={() => sendSlide(0)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--color-accent-dim), var(--color-accent))", boxShadow: "0 2px 10px rgba(34, 211, 238, 0.3)" }}
              title="Iniciar apresentacao (Espaco)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-surface-50)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          ) : (
            <button
              onClick={handleClear}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--color-danger)", boxShadow: "0 2px 10px rgba(244, 63, 94, 0.3)" }}
              title="Parar apresentacao (Esc)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
          )}

          {/* Next */}
          <button
            onClick={() => {
              if (activeSlide === null) sendSlide(0);
              else if (activeSlide < total - 1) sendSlide(activeSlide + 1);
            }}
            disabled={activeSlide === total - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: "var(--color-surface-300)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {/* Slide counter */}
          <span className="text-xs px-2 ml-1" style={{ color: "var(--color-surface-700)", fontFamily: "var(--font-mono)" }}>
            {activeSlide !== null ? `${activeSlide + 1}/${total}` : `—/${total}`}
          </span>
        </div>
      </div>

      {/* Main area — two columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Slide list */}
        <div className="w-72 flex-shrink-0 overflow-y-auto p-3 space-y-2" style={{ borderRight: "1px solid var(--color-surface-300)" }}>
          {song.sections.map((section, i) => {
            const isActive = activeSlide === i;
            return (
              <button
                key={section.id}
                onClick={() => sendSlide(i)}
                className="w-full text-left rounded-lg p-3 transition-all"
                style={{
                  background: isActive ? "var(--color-accent-glow)" : "var(--color-surface-200)",
                  border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-surface-300)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold rounded px-1.5 py-0.5" style={{
                    background: isActive ? "var(--color-accent)" : "var(--color-surface-400)",
                    color: isActive ? "var(--color-surface-50)" : "var(--color-surface-800)",
                  }}>
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-semibold uppercase" style={{ color: isActive ? "var(--color-accent)" : "var(--color-surface-700)" }}>
                    {section.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-line line-clamp-3" style={{ color: isActive ? "#fff" : "var(--color-surface-800)" }}>
                  {section.text}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right — Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ background: "var(--color-surface-50)" }}>
          {activeSlide !== null ? (
            <div className="w-full max-w-2xl">
              {/* Preview screen */}
              <div className="aspect-video rounded-xl overflow-hidden flex items-center justify-center p-8" style={{ background: "#000", boxShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
                <div className="text-center">
                  <p className="text-2xl leading-relaxed whitespace-pre-line" style={{ color: "#fff", textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}>
                    {song.sections[activeSlide].text}
                  </p>
                </div>
              </div>
              {/* Info below preview */}
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-xs font-semibold uppercase" style={{ color: "var(--color-accent)" }}>
                  {song.sections[activeSlide].label}
                </span>
                <span className="text-xs" style={{ color: "var(--color-surface-600)" }}>
                  Slide {activeSlide + 1} de {total} · {activeSlide < total - 1 ? `Proximo: ${song.sections[activeSlide + 1].label}` : "Ultimo slide"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "var(--color-surface-200)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface-600)" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-surface-700)" }}>Pronto para apresentar</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-surface-600)" }}>
                  Clique em Play, pressione Espaco ou clique num slide para iniciar
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px]" style={{ color: "var(--color-surface-600)", fontFamily: "var(--font-mono)" }}>
                <span>← → Navegar</span>
                <span>Espaco Proximo</span>
                <span>Esc Parar</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
