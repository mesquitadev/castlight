import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetMediaFilesQuery, useUploadMediaMutation, useDeleteMediaMutation } from "../../store/api";
import { setBackground } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { BackgroundConfig } from "@castlight/shared";

export function BackgroundsTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: backgrounds = [] } = useGetMediaFilesQuery("background");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [color, setColor] = useState("#000000");

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "background" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyBackground = (config: BackgroundConfig) => {
    dispatch(setBackground(config));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "background:change",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: config,
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
          {uploading ? "Enviando..." : "Importar Background"}
        </button>
      </div>
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Cor solida</h3>
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
          <span className="text-zinc-400 text-sm font-mono">{color}</span>
          <button onClick={() => applyBackground({ type: "color", value: color })} className="px-3 py-1.5 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600">Aplicar</button>
          <button onClick={() => { dispatch(setBackground(null)); }} className="px-3 py-1.5 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600">Limpar</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {backgrounds.map((bg) => (
          <div key={bg.id} className="group relative bg-zinc-800 rounded-lg overflow-hidden">
            <button onClick={() => applyBackground({ type: "image", value: `/api/media/file/${bg.id}` })} className="w-full">
              <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${bg.id}`} alt={bg.originalFilename} className="w-full aspect-video object-cover" />
            </button>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteMedia(bg.id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
