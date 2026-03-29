import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { presentLyrics, clearPresentation } from "../store/slices/presentation";
import type { Song } from "@castlight/shared";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

interface Props {
  song: Song;
  onClose: () => void;
}

function broadcast(event: string, data: any) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
      data,
    }),
  });
}

function restoreWallpaper() {
  broadcast("content:clear", "blank");
  fetch(`http://localhost:${SIDECAR_PORT}/api/settings/default_wallpaper`)
    .then((r) => r.json())
    .then((config) => { if (config?.type) broadcast("background:change", config); });
}

type ViewMode = "list" | "grid";

export function LyricsPresenter({ song, onClose }: Props) {
  const dispatch = useDispatch();
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const total = song.sections.length;

  const sendSlide = useCallback((index: number) => {
    if (index < 0 || index >= total) return;
    setActiveSlide(index);
    const section = song.sections[index];
    const nextSection = song.sections[index + 1] ?? null;
    const data = { section, nextSection, song: { title: song.title, artist: song.artist, key: song.key } };
    dispatch(presentLyrics(data));
    broadcast("content:lyrics", data);
  }, [song, total, dispatch]);

  const handleClear = useCallback(() => {
    setActiveSlide(null);
    dispatch(clearPresentation());
    restoreWallpaper();
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

  // Icons
  const ListIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
  );
  const GridIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top bar — like Holyrics: Title (Artist) centered + controls */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ background: "var(--color-surface-100)", borderBottom: "1px solid var(--color-surface-300)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} style={{ color: "var(--color-surface-700)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm font-bold" style={{ color: "#fff" }}>{song.title}</span>
          <span className="text-sm ml-2" style={{ color: "var(--color-surface-700)" }}>({song.artist})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Play controls */}
          <button onClick={() => activeSlide !== null && activeSlide > 0 ? sendSlide(activeSlide - 1) : null} disabled={activeSlide === null || activeSlide <= 0} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20" style={{ color: "var(--color-surface-800)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 20L9 12l10-8z"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>
          {activeSlide === null ? (
            <button onClick={() => sendSlide(0)} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: "var(--color-accent)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          ) : (
            <button onClick={handleClear} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: "var(--color-danger)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            </button>
          )}
          <button onClick={() => { if (activeSlide === null) sendSlide(0); else if (activeSlide < total - 1) sendSlide(activeSlide + 1); }} disabled={activeSlide === total - 1} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20" style={{ color: "var(--color-surface-800)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4l10 8-10 8z"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>

          <span className="w-px h-5 mx-1" style={{ background: "var(--color-surface-400)" }} />

          {/* View mode toggle */}
          <button onClick={() => setViewMode("list")} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: viewMode === "list" ? "var(--color-accent)" : "var(--color-surface-600)" }}><ListIcon /></button>
          <button onClick={() => setViewMode("grid")} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: viewMode === "grid" ? "var(--color-accent)" : "var(--color-surface-600)" }}><GridIcon /></button>
        </div>
      </div>

      {/* Content area */}
      {viewMode === "list" ? (
        /* LIST VIEW — sections as clickable text blocks + preview */
        <div className="flex-1 flex overflow-hidden">
          {/* Left — section list (like Holyrics) */}
          <div className="flex-1 overflow-y-auto" style={{ borderRight: "1px solid var(--color-surface-300)" }}>
            {song.sections.map((section, i) => {
              const isActive = activeSlide === i;
              return (
                <button
                  key={section.id}
                  onClick={() => sendSlide(i)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    background: isActive ? "rgba(34, 211, 238, 0.12)" : "transparent",
                    borderBottom: "1px solid var(--color-surface-200)",
                    borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
                  }}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{
                    color: isActive ? "#fff" : "var(--color-surface-800)",
                  }}>
                    {section.text}
                  </p>
                </button>
              );
            })}
            {/* Empty slide at bottom to clear */}
            <button
              onClick={handleClear}
              className="w-full text-left px-4 py-6 transition-all"
              style={{
                background: activeSlide === null ? "rgba(34, 211, 238, 0.05)" : "transparent",
                borderLeft: activeSlide === null ? "3px solid var(--color-surface-500)" : "3px solid transparent",
              }}
            >
              <p className="text-xs italic" style={{ color: "var(--color-surface-600)" }}>Slide vazio (limpar tela)</p>
            </button>
          </div>

          {/* Right — preview (like Holyrics) */}
          <div className="w-80 flex-shrink-0 flex flex-col">
            {/* Preview screen */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full aspect-video rounded-lg flex items-center justify-center p-6" style={{ background: "#1a1a1a", border: "1px solid var(--color-surface-300)" }}>
                {activeSlide !== null ? (
                  <p className="text-sm text-center leading-relaxed whitespace-pre-line" style={{ color: "#fff", textShadow: "1px 1px 4px rgba(0,0,0,0.8)" }}>
                    {song.sections[activeSlide].text}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: "var(--color-surface-600)" }}>Preview</p>
                )}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--color-surface-300)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold" style={{ color: "var(--color-surface-600)" }}>Tema</span>
                <select className="input-field text-[10px] px-2 py-0.5" style={{ width: "auto" }}>
                  <option>Padrao</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <button className="btn btn-secondary" style={{ padding: "3px 8px", fontSize: "10px" }}>Todos</button>
                <button className="btn btn-primary" style={{ padding: "3px 8px", fontSize: "10px" }}>Selecionadas</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW — slides as cards side by side */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Title slide */}
            <button
              onClick={handleClear}
              className="aspect-video rounded-lg flex flex-col items-center justify-center transition-all"
              style={{
                background: "var(--color-surface-100)",
                border: activeSlide === null ? "2px solid var(--color-surface-500)" : "1px solid var(--color-surface-300)",
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
                  className="aspect-video rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all overflow-hidden relative"
                  style={{
                    background: "var(--color-surface-100)",
                    border: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-surface-300)",
                    boxShadow: isActive ? "0 0 12px var(--color-accent-glow)" : "none",
                  }}
                >
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold rounded px-1 py-0.5" style={{
                    background: isActive ? "var(--color-accent)" : "var(--color-surface-400)",
                    color: isActive ? "var(--color-surface-50)" : "var(--color-surface-800)",
                  }}>{i + 1}</span>
                  <p className="text-[11px] leading-relaxed whitespace-pre-line line-clamp-5" style={{
                    color: isActive ? "#fff" : "var(--color-surface-800)",
                  }}>
                    {section.text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
