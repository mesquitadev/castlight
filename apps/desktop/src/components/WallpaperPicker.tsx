import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { useGetMediaFilesQuery, useUploadMediaMutation, useGetSettingQuery, useSaveSettingMutation } from "../store/api";
import { setBackground } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { BackgroundConfig } from "@castlight/shared";

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

  // On load, apply saved wallpaper
  useEffect(() => {
    if (savedWallpaper && !applied) {
      const config = savedWallpaper as BackgroundConfig;
      dispatch(setBackground(config));
      broadcastBackground(config);
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
    dispatch(setBackground(config));
    broadcastBackground(config);
    saveSetting({ key: "default_wallpaper", value: config });
  };

  const clearWallpaper = () => {
    dispatch(setBackground(null));
    broadcastBackground({ type: "color", value: "#000000" });
    saveSetting({ key: "default_wallpaper", value: { type: "color", value: "#000000" } });
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-zinc-400 text-sm">Papel de parede do culto</p>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs text-blue-400 hover:underline disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "Importar"}
          </button>
          <button onClick={clearWallpaper} className="text-xs text-zinc-500 hover:text-white">
            Limpar
          </button>
        </div>
      </div>

      {/* Current wallpaper preview */}
      <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
        {currentBg?.type === "image" ? (
          <img
            src={`http://localhost:${SIDECAR_PORT}${currentBg.value}`}
            alt="Papel de parede"
            className="w-full h-full object-cover"
          />
        ) : currentBg?.type === "color" && currentBg.value !== "#000000" ? (
          <div className="w-full h-full" style={{ backgroundColor: currentBg.value }} />
        ) : (
          <p className="text-zinc-600 text-sm">Nenhum papel de parede definido</p>
        )}
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
                className={`aspect-video rounded overflow-hidden ${isActive ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-zinc-600"}`}
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
