import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { ContentType } from "@castlight/shared";
import { WallpaperPicker } from "../components/WallpaperPicker";

const contentLabels: Record<string, string> = {
  [ContentType.Lyrics]: "Letra",
  [ContentType.Bible]: "Versiculo",
  [ContentType.Slide]: "Slide",
  [ContentType.Image]: "Imagem",
  [ContentType.Video]: "Video",
  [ContentType.Notice]: "Aviso",
  [ContentType.Blank]: "Papel de parede",
  [ContentType.Black]: "Tela preta",
};

export function Dashboard() {
  const presentation = useSelector((s: RootState) => s.presentation);
  const screenCount = useSelector((s: RootState) => s.screens.connected.length);
  const obs = useSelector((s: RootState) => s.obs.status);

  const contentDetail = (() => {
    if (presentation.contentType === ContentType.Lyrics) return presentation.currentSong?.title ?? "";
    if (presentation.contentType === ContentType.Bible && presentation.currentReference)
      return `${presentation.currentReference.book} ${presentation.currentReference.chapter}:${presentation.currentReference.verseStart}`;
    return "";
  })();

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#fff" }}>Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-surface-700)" }}>Visao geral do culto</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Screens */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-surface-700)" }}>Telas</p>
              <p className="text-3xl font-bold mt-1" style={{ color: screenCount > 0 ? "var(--color-accent)" : "var(--color-surface-600)" }}>
                {screenCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-accent-glow)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--color-surface-600)" }}>
            {screenCount === 0 ? "Nenhuma conectada" : `${screenCount} dispositivo${screenCount > 1 ? "s" : ""} na rede`}
          </p>
        </div>

        {/* OBS */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-surface-700)" }}>OBS Studio</p>
              <p className="text-lg font-semibold mt-1" style={{ color: "#fff" }}>
                {obs.connected ? (obs.currentScene ?? "Conectado") : "Offline"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: obs.connected ? "rgba(52, 211, 153, 0.15)" : "rgba(244, 63, 94, 0.1)" }}>
              <div className="w-3 h-3 rounded-full" style={{
                background: obs.connected ? "var(--color-success)" : "var(--color-danger)",
                boxShadow: obs.connected ? "0 0 8px rgba(52, 211, 153, 0.5)" : "none",
              }} />
            </div>
          </div>
          {obs.recording && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-danger)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--color-danger)" }}>Gravando</span>
            </div>
          )}
        </div>

        {/* Now presenting */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-surface-700)" }}>Exibindo</p>
              <p className="text-lg font-semibold mt-1" style={{ color: "#fff" }}>
                {contentLabels[presentation.contentType] ?? "—"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: presentation.contentType !== ContentType.Blank ? "var(--color-accent-glow)" : "var(--color-surface-300)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={presentation.contentType !== ContentType.Blank ? "var(--color-accent)" : "var(--color-surface-600)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
          {contentDetail && (
            <p className="text-[11px] mt-2 truncate" style={{ color: "var(--color-accent-dim)" }}>{contentDetail}</p>
          )}
        </div>
      </div>

      {/* Wallpaper */}
      <WallpaperPicker />
    </div>
  );
}
