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
        <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn btn-primary disabled:opacity-50">
          {importing ? "Importando..." : "Importar PPTX"}
        </button>
      </div>
      {isLoading && <p style={{ color: "var(--color-text-muted)" }}>Carregando...</p>}
      <div className="grid grid-cols-3 gap-4">
        {slideSets.map((set) => (
          <div key={set.id} className="card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{set.name}</p>
              <button onClick={() => deleteSlideSet(set.id)} className="text-xs" style={{ color: "var(--color-danger)" }}>Excluir</button>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{set.slideCount} slides</p>
            <div className="grid grid-cols-4 gap-1">
              {set.slides.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleProject(set, i)}
                  className="aspect-video rounded overflow-hidden"
                  style={{ background: "var(--color-surface-400)" }}
                >
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
