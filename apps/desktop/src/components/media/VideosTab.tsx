import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetMediaFilesQuery, useUploadMediaMutation, useDeleteMediaMutation } from "../../store/api";
import { presentVideo } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function VideosTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: videos = [] } = useGetMediaFilesQuery("video");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "video" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendVideoCommand = (id: string, action: "play" | "pause" | "seek", timestamp = 0) => {
    const url = `/api/media/file/${id}`;
    const cmd = { action, url, timestamp };
    dispatch(presentVideo(cmd));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:video",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: cmd,
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-primary disabled:opacity-50">
          {uploading ? "Enviando..." : "Importar Video"}
        </button>
      </div>
      <div className="space-y-3">
        {videos.map((vid) => (
          <div key={vid.id} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{vid.originalFilename}</p>
              <button onClick={() => deleteMedia(vid.id)} className="text-xs" style={{ color: "var(--color-danger)" }}>Excluir</button>
            </div>
            {activeVideo === vid.id ? (
              <div className="space-y-2">
                <video src={`http://localhost:${SIDECAR_PORT}/api/media/file/${vid.id}`} className="w-full rounded-lg" controls />
                <div className="flex gap-2">
                  <button onClick={() => sendVideoCommand(vid.id, "play")} className="btn btn-primary" style={{ background: "var(--color-success)" }}>Projetar</button>
                  <button onClick={() => sendVideoCommand(vid.id, "pause")} className="btn btn-primary" style={{ background: "var(--color-warning)" }}>Pausar</button>
                  <button onClick={() => setActiveVideo(null)} className="btn btn-secondary">Fechar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setActiveVideo(vid.id)} className="text-sm hover:underline" style={{ color: "var(--color-accent)" }}>Abrir player</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
