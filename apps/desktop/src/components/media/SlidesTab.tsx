import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useGetSlideSetsQuery, useImportSlidesMutation, useDeleteSlideSetMutation } from "../../store/api";
import { presentSlide } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function SlidesTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: slideSets = [], isLoading } = useGetSlideSetsQuery();
  const [importSlides, { isLoading: importing }] = useImportSlidesMutation();
  const [deleteSlideSet] = useDeleteSlideSetMutation();

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await importSlides(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleProject = (slideSet: any, index: number) => {
    dispatch(presentSlide({ slideSet, index }));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:slide",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { slideSetId: slideSet.id, slides: slideSet.slides, currentIndex: index, name: slideSet.name },
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept=".pptx" className="hidden" onChange={handleImport} />
        <button onClick={() => fileRef.current?.click()} disabled={importing} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
          {importing ? "Importando..." : "Importar PPTX"}
        </button>
      </div>
      {isLoading && <p className="text-zinc-500">Carregando...</p>}
      <div className="grid grid-cols-3 gap-4">
        {slideSets.map((set) => (
          <div key={set.id} className="bg-zinc-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">{set.name}</p>
              <button onClick={() => deleteSlideSet(set.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
            </div>
            <p className="text-zinc-500 text-xs">{set.slideCount} slides</p>
            <div className="grid grid-cols-4 gap-1">
              {set.slides.map((url, i) => (
                <button key={i} onClick={() => handleProject(set, i)} className="aspect-video bg-zinc-700 rounded overflow-hidden hover:ring-2 hover:ring-blue-500">
                  <img src={`http://localhost:${SIDECAR_PORT}${url}`} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
