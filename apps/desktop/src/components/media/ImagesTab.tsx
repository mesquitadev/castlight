import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useGetMediaFilesQuery, useUploadMediaMutation, useDeleteMediaMutation } from "../../store/api";
import { presentImage } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function ImagesTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: images = [] } = useGetMediaFilesQuery("image");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "image" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleProject = (id: string, filename: string) => {
    const url = `/api/media/file/${id}`;
    dispatch(presentImage(url));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:image",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { url, filename },
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
          {uploading ? "Enviando..." : "Importar Imagem"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-zinc-800 rounded-lg overflow-hidden">
            <button onClick={() => handleProject(img.id, img.originalFilename)} className="w-full">
              <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${img.id}`} alt={img.originalFilename} className="w-full aspect-video object-cover" />
            </button>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteMedia(img.id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">X</button>
            </div>
            <p className="text-zinc-400 text-xs p-2 truncate">{img.originalFilename}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
