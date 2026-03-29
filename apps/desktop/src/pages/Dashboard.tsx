import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { ContentType, SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import { clearPresentation } from "../store/slices/presentation";

const contentLabels: Record<string, string> = {
  [ContentType.Lyrics]: "Letra",
  [ContentType.Bible]: "Versículo",
  [ContentType.Slide]: "Slide",
  [ContentType.Image]: "Imagem",
  [ContentType.Video]: "Vídeo",
  [ContentType.Notice]: "Aviso",
  [ContentType.Blank]: "Papel de parede",
  [ContentType.Black]: "Tela preta",
};

function broadcastAction(event: string, data: any) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor], data }),
  });
}

export function Dashboard() {
  const dispatch = useDispatch();
  const presentation = useSelector((s: RootState) => s.presentation);
  const screens = useSelector((s: RootState) => s.screens.connected);
  const obs = useSelector((s: RootState) => s.obs.status);

  const isPresenting = presentation.contentType !== ContentType.Blank && presentation.contentType !== ContentType.Black;

  const contentDetail = (() => {
    if (presentation.contentType === ContentType.Lyrics) return presentation.currentSong?.title ?? "";
    if (presentation.contentType === ContentType.Bible && presentation.currentReference)
      return `${presentation.currentReference.book} ${presentation.currentReference.chapter}:${presentation.currentReference.verseStart}`;
    return "";
  })();

  const handleClearScreens = () => {
    dispatch(clearPresentation());
    broadcastAction("content:clear", "blank");
    fetch(`http://localhost:${SIDECAR_PORT}/api/settings/default_wallpaper`)
      .then((r) => r.json())
      .then((config) => { if (config?.type) broadcastAction("background:change", config); });
  };

  const handleBlackout = () => {
    broadcastAction("background:change", { type: "color", value: "#000000" });
    broadcastAction("content:clear", "blank");
  };

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Visão geral do culto</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClearScreens} className="btn btn-secondary btn-sm" aria-label="Limpar todas as telas">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            Limpar telas
          </button>
          <button onClick={handleBlackout} className="btn btn-sm" style={{ background: "#000", color: "var(--color-surface-800)", border: "1px solid var(--color-surface-400)" }} aria-label="Tela preta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Tela preta
          </button>
        </div>
      </div>

      {/* Main grid: left (live preview + now playing) + right (stats) */}
      <div className="grid grid-cols-5 gap-5">
        {/* Live preview — takes 3 columns */}
        <div className="col-span-3 space-y-4">
          {/* Preview monitor */}
          <div className="card overflow-hidden" style={{ padding: 0 }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid var(--color-surface-300)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: isPresenting ? "var(--color-success)" : "var(--color-surface-600)", boxShadow: isPresenting ? "0 0 6px rgba(52,211,153,0.5)" : "none" }} />
                <span className="section-label">Preview da projeção</span>
              </div>
              {isPresenting && (
                <span className="badge badge-accent">{contentLabels[presentation.contentType]}</span>
              )}
            </div>
            <div className="aspect-video flex items-center justify-center p-8" style={{ background: "#0a0a0a" }}>
              {presentation.contentType === ContentType.Lyrics && presentation.currentSection ? (
                <p className="text-xl text-center leading-relaxed whitespace-pre-line" style={{ color: "#fff", textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}>
                  {presentation.currentSection.text}
                </p>
              ) : presentation.contentType === ContentType.Bible && presentation.currentVerses ? (
                <div className="text-center">
                  <p className="text-lg leading-relaxed" style={{ color: "#fff", textShadow: "1px 1px 4px rgba(0,0,0,0.8)" }}>
                    {presentation.currentVerses.map((v) => v.text).join(" ")}
                  </p>
                  <p className="text-sm mt-3" style={{ color: "var(--color-surface-800)" }}>
                    {contentDetail}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface-500)" strokeWidth="1.5" className="mx-auto"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  <p className="text-sm" style={{ color: "var(--color-surface-600)" }}>Nenhum conteúdo sendo projetado</p>
                </div>
              )}
            </div>
            {/* Now playing bar */}
            {isPresenting && (
              <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--color-surface-200)", borderTop: "1px solid var(--color-surface-300)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" className="flex-shrink-0"><polygon points="5 3 19 12 5 21"/></svg>
                  <span className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {contentDetail || contentLabels[presentation.contentType]}
                  </span>
                </div>
                <button onClick={handleClearScreens} className="btn btn-ghost btn-sm" style={{ color: "var(--color-danger)" }}>
                  Parar
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right column — Stats + Connected screens */}
        <div className="col-span-2 space-y-4">
          {/* Screens stat */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="stat-label">Telas conectadas</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--color-accent-glow)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
            </div>
            <p className="stat-value" style={{ color: screens.length > 0 ? "var(--color-accent)" : "var(--color-surface-600)" }}>
              {screens.length}
            </p>
            {screens.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {screens.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--color-text-secondary)" }}>{s.name || s.userAgent.slice(0, 25)}</span>
                    {s.role && <span className="badge badge-accent">{s.role}</span>}
                  </div>
                ))}
                {screens.length > 5 && (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>+{screens.length - 5} mais</p>
                )}
              </div>
            ) : (
              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Nenhum dispositivo na rede</p>
            )}
          </div>

          {/* OBS Status */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="stat-label">OBS Studio</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: obs.connected ? "rgba(52,211,153,0.1)" : "rgba(244,63,94,0.08)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: obs.connected ? "var(--color-success)" : "var(--color-danger)", boxShadow: obs.connected ? "0 0 8px rgba(52,211,153,0.5)" : "none" }} />
              </div>
            </div>
            <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {obs.connected ? (obs.currentScene ?? "Conectado") : "Desconectado"}
            </p>
            {obs.recording && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-danger)" }} />
                <span className="badge badge-danger">REC</span>
              </div>
            )}
            {!obs.connected && (
              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Configure em Config → OBS</p>
            )}
          </div>

          {/* Quick info */}
          <div className="card p-4">
            <p className="section-label mb-3">Atalhos do teclado</p>
            <div className="space-y-2">
              {[
                ["← →", "Navegar slides/versículos"],
                ["Espaço", "Próximo slide"],
                ["Esc", "Limpar projeção"],
                ["Digitar", "Busca rápida (Bíblia)"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-3">
                  <kbd className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: "var(--color-surface-300)", color: "var(--color-text-secondary)", border: "1px solid var(--color-surface-400)" }}>
                    {key}
                  </kbd>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
