import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { presentLyrics, clearPresentation } from "../store/slices/presentation";
import { useUpdateSongMutation } from "../store/api";
import type { Song, SongSection } from "@castlight/shared";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

interface Props {
  song: Song;
  onClose: () => void;
}

function broadcast(event: string, data: any) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor], data }),
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
  const [editing, setEditing] = useState(false);
  const [editSections, setEditSections] = useState(song.sections.map((s) => ({ ...s })));
  const [updateSong] = useUpdateSongMutation();
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const total = song.sections.length;

  // Auto-scroll in list view
  useEffect(() => {
    if (activeSlide !== null && viewMode === "list") {
      const el = sectionRefs.current.get(activeSlide);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSlide, viewMode]);

  const sendSlide = useCallback((index: number) => {
    if (index < 0 || index >= total) return;
    setActiveSlide(index);
    const section = song.sections[index];
    const nextSection = song.sections[index + 1] ?? null;
    dispatch(presentLyrics({ section, nextSection, song: { title: song.title, artist: song.artist, key: song.key } }));
    broadcast("content:lyrics", { section, nextSection, song: { title: song.title, artist: song.artist, key: song.key } });
  }, [song, total, dispatch]);

  const handleClear = useCallback(() => {
    setActiveSlide(null);
    dispatch(clearPresentation());
    restoreWallpaper();
  }, [dispatch]);

  const handleSaveEdit = async () => {
    // TODO: update sections via API when endpoint supports it
    setEditing(false);
  };

  // Keyboard (only when not editing)
  useEffect(() => {
    if (editing) return;
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
  }, [activeSlide, total, sendSlide, handleClear, editing]);

  return (
    <div className="h-full" style={{ display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ background: "var(--color-surface-100)", borderBottom: "1px solid var(--color-surface-300)" }}>
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="flex-shrink-0" style={{ color: "var(--color-surface-600)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="min-w-0">
            <span className="text-[13px] font-bold truncate block" style={{ color: "#fff" }}>{song.title}</span>
            <span className="text-[11px] truncate block" style={{ color: "var(--color-surface-600)" }}>{song.artist}{song.key ? ` · ${song.key}` : ""}</span>
          </div>
        </div>

        {/* Center: transport */}
        <div className="flex items-center gap-1">
          <button onClick={() => activeSlide !== null && activeSlide > 0 && sendSlide(activeSlide - 1)} disabled={activeSlide === null || activeSlide === 0} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20" style={{ color: "var(--color-surface-800)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8z"/><rect x="5" y="5" width="2" height="14"/></svg>
          </button>
          {activeSlide === null ? (
            <button onClick={() => sendSlide(0)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-accent)", color: "var(--color-surface-50)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
            </button>
          ) : (
            <button onClick={handleClear} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-danger)", color: "#fff" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            </button>
          )}
          <button onClick={() => { if (activeSlide === null) sendSlide(0); else if (activeSlide < total - 1) sendSlide(activeSlide + 1); }} disabled={activeSlide === total - 1} className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-20" style={{ color: "var(--color-surface-800)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8z"/><rect x="17" y="5" width="2" height="14"/></svg>
          </button>
          <span className="text-[10px] ml-1 w-10 text-center" style={{ color: "var(--color-surface-600)", fontFamily: "var(--font-mono)" }}>
            {activeSlide !== null ? `${activeSlide + 1}/${total}` : `${total}`}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(!editing)} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: editing ? "var(--color-accent)" : "var(--color-surface-600)" }} title="Editar letra">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <span className="w-px h-4" style={{ background: "var(--color-surface-400)" }} />
          <button onClick={() => setViewMode("list")} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: viewMode === "list" ? "var(--color-accent)" : "var(--color-surface-600)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
          </button>
          <button onClick={() => setViewMode("grid")} className="w-7 h-7 rounded flex items-center justify-center" style={{ color: viewMode === "grid" ? "var(--color-accent)" : "var(--color-surface-600)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sections list with scroll */}
          <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
            {song.sections.map((section, i) => {
              const isActive = activeSlide === i;
              return (
                <div
                  key={section.id}
                  ref={(el) => { if (el) sectionRefs.current.set(i, el); }}
                >
                  {editing ? (
                    <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--color-surface-200)", borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent", background: isActive ? "rgba(34,211,238,0.08)" : "transparent" }}>
                      <textarea
                        value={editSections[i]?.text ?? section.text}
                        onChange={(e) => {
                          const next = [...editSections];
                          next[i] = { ...next[i], text: e.target.value };
                          setEditSections(next);
                        }}
                        className="w-full bg-transparent border-none resize-none text-[13px] leading-relaxed focus:outline-none"
                        style={{ color: "#fff", fontFamily: "var(--font-mono)", minHeight: "60px" }}
                        rows={Math.max(3, section.text.split("\n").length)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => sendSlide(i)}
                      className="w-full text-left px-4 py-3 transition-all"
                      style={{
                        background: isActive ? "rgba(34,211,238,0.1)" : "transparent",
                        borderBottom: "1px solid var(--color-surface-200)",
                        borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
                      }}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: isActive ? "#fff" : "var(--color-surface-800)" }}>
                        {section.text}
                      </p>
                    </button>
                  )}
                </div>
              );
            })}
            {/* Clear slide */}
            <button onClick={handleClear} className="w-full text-left px-4 py-4" style={{ borderLeft: activeSlide === null ? "3px solid var(--color-surface-500)" : "3px solid transparent" }}>
              <p className="text-[11px] italic" style={{ color: "var(--color-surface-600)" }}>&nbsp;</p>
            </button>
          </div>

          {/* Preview */}
          <div className="w-72 flex-shrink-0 flex flex-col min-h-0" style={{ borderLeft: "1px solid var(--color-surface-300)" }}>
            <div className="flex-1 flex items-center justify-center p-3">
              <div className="w-full aspect-video rounded flex items-center justify-center p-4" style={{ background: "#111", border: "1px solid var(--color-surface-300)" }}>
                {activeSlide !== null ? (
                  <p className="text-[11px] text-center leading-relaxed whitespace-pre-line" style={{ color: "#fff", textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}>
                    {song.sections[activeSlide].text}
                  </p>
                ) : (
                  <p className="text-[10px]" style={{ color: "var(--color-surface-600)" }}>Preview</p>
                )}
              </div>
            </div>
            {/* Info */}
            <div className="px-3 py-2 text-center" style={{ borderTop: "1px solid var(--color-surface-300)" }}>
              <p className="text-[10px]" style={{ color: "var(--color-surface-600)", fontFamily: "var(--font-mono)" }}>
                ← → Navegar · Espaco Proximo · Esc Parar
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Title card */}
            <button onClick={handleClear} className="aspect-video rounded-lg flex flex-col items-center justify-center transition-all" style={{ background: "var(--color-surface-100)", border: activeSlide === null ? "2px solid var(--color-surface-500)" : "1px solid var(--color-surface-300)" }}>
              <p className="text-[12px] font-bold" style={{ color: "#fff" }}>{song.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-surface-700)" }}>{song.artist}</p>
            </button>

            {song.sections.map((section, i) => {
              const isActive = activeSlide === i;
              return (
                <button key={section.id} onClick={() => sendSlide(i)} className="aspect-video rounded-lg p-3 flex items-center justify-center text-center transition-all overflow-hidden relative" style={{ background: "var(--color-surface-100)", border: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-surface-300)", boxShadow: isActive ? "0 0 10px var(--color-accent-glow)" : "none" }}>
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold rounded px-1 py-0.5" style={{ background: isActive ? "var(--color-accent)" : "var(--color-surface-400)", color: isActive ? "var(--color-surface-50)" : "var(--color-surface-800)" }}>{i + 1}</span>
                  <p className="text-[10px] leading-relaxed whitespace-pre-line line-clamp-5" style={{ color: isActive ? "#fff" : "var(--color-surface-800)" }}>{section.text}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
