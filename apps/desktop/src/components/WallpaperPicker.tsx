import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { useGetMediaFilesQuery, useUploadMediaMutation, useGetSettingQuery, useSaveSettingMutation } from "../store/api";
import { setBackground } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { BackgroundConfig, BackgroundFit } from "@castlight/shared";

const FIT_OPTIONS: { value: BackgroundFit; label: string; desc: string }[] = [
  { value: "cover", label: "Preencher", desc: "Preenche toda a tela, pode cortar" },
  { value: "contain", label: "Ajustar", desc: "Mostra toda a imagem, pode ter barras" },
  { value: "stretch", label: "Esticar", desc: "Estica pra caber, pode distorcer" },
  { value: "center", label: "Centralizar", desc: "Tamanho original, centralizado" },
];

function broadcastBackground(config: BackgroundConfig) {
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

export function WallpaperPicker() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const currentBg = useSelector((s: RootState) => s.presentation.background);
  const { data: backgrounds = [] } = useGetMediaFilesQuery("background");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const { data: savedWallpaper } = useGetSettingQuery("default_wallpaper");
  const [saveSetting] = useSaveSettingMutation();
  const [applied, setApplied] = useState(false);
  const [fit, setFit] = useState<BackgroundFit>("cover");

  // On load, apply saved wallpaper
  useEffect(() => {
    if (savedWallpaper && !applied) {
      const config = savedWallpaper as BackgroundConfig;
      dispatch(setBackground(config));
      broadcastBackground(config);
      if (config.fit) setFit(config.fit);
      setApplied(true);
    }
  }, [savedWallpaper, applied, dispatch]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "background" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyWallpaper = (config: BackgroundConfig) => {
    const withFit = { ...config, fit };
    dispatch(setBackground(withFit));
    broadcastBackground(withFit);
    saveSetting({ key: "default_wallpaper", value: withFit });
  };

  const changeFit = (newFit: BackgroundFit) => {
    setFit(newFit);
    if (currentBg && currentBg.type === "image") {
      const updated = { ...currentBg, fit: newFit };
      dispatch(setBackground(updated));
      broadcastBackground(updated);
      saveSetting({ key: "default_wallpaper", value: updated });
    }
  };

  const clearWallpaper = () => {
    dispatch(setBackground(null));
    broadcastBackground({ type: "color", value: "#000000" });
    saveSetting({ key: "default_wallpaper", value: { type: "color", value: "#000000" } });
  };

  const fitCssMap: Record<BackgroundFit, string> = {
    cover: "object-cover",
    contain: "object-contain",
    stretch: "object-fill",
    center: "object-none",
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Papel de parede do culto</p>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs hover:underline disabled:opacity-50"
            style={{ color: "var(--color-accent)" }}
          >
            {uploading ? "Enviando..." : "Importar"}
          </button>
          <button onClick={clearWallpaper} className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Limpar
          </button>
        </div>
      </div>

      {/* Current wallpaper preview */}
      <div className="aspect-video rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "var(--color-surface-900)" }}>
        {currentBg?.type === "image" ? (
          <img
            src={`http://localhost:${SIDECAR_PORT}${currentBg.value}`}
            alt="Papel de parede"
            className={`w-full h-full ${fitCssMap[currentBg.fit ?? "cover"]}`}
          />
        ) : currentBg?.type === "color" && currentBg.value !== "#000000" ? (
          <div className="w-full h-full" style={{ backgroundColor: currentBg.value }} />
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhum papel de parede definido</p>
        )}
      </div>

      {/* Fit options */}
      <div className="flex gap-2">
        {FIT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => changeFit(opt.value)}
            title={opt.desc}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${fit === opt.value ? "btn btn-primary" : "btn btn-secondary"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Available backgrounds */}
      {backgrounds.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {backgrounds.map((bg) => {
            const isActive = currentBg?.type === "image" && currentBg.value === `/api/media/file/${bg.id}`;
            return (
              <button
                key={bg.id}
                onClick={() => applyWallpaper({ type: "image", value: `/api/media/file/${bg.id}` })}
                className="aspect-video rounded overflow-hidden"
                style={{ outline: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-surface-400)", outlineOffset: "1px" }}
              >
                <img
                  src={`http://localhost:${SIDECAR_PORT}/api/media/file/${bg.id}`}
                  alt={bg.originalFilename}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
