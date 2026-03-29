import { useState } from "react";
import {
  useGetThemesQuery,
  useCreateThemeMutation,
  useUpdateThemeMutation,
  useSetDefaultThemeMutation,
  useDeleteThemeMutation,
  useGetMediaFilesQuery,
} from "../../store/api";
import { SIDECAR_PORT } from "@castlight/shared";

const FONT_OPTIONS = [
  "system-ui", "Arial", "Georgia", "Times New Roman", "Verdana",
  "Trebuchet MS", "Impact", "Comic Sans MS",
];

const TRANSITIONS = [
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "none", label: "Nenhuma" },
];

export function ThemesTab() {
  const { data: themes = [] } = useGetThemesQuery();
  const { data: backgrounds = [] } = useGetMediaFilesQuery("background");
  const [createTheme] = useCreateThemeMutation();
  const [updateTheme] = useUpdateThemeMutation();
  const [setDefaultTheme] = useSetDefaultThemeMutation();
  const [deleteTheme] = useDeleteThemeMutation();

  const [editing, setEditing] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    backgroundType: "color",
    backgroundValue: "#000000",
    backgroundFit: "cover",
    fontFamily: "system-ui",
    fontSize: "clamp(2rem, 5vw, 5rem)",
    fontColor: "#ffffff",
    fontWeight: "400",
    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
    textAlign: "center",
    transition: "fade",
  });

  const resetForm = () => {
    setForm({
      name: "", backgroundType: "color", backgroundValue: "#000000", backgroundFit: "cover",
      fontFamily: "system-ui", fontSize: "clamp(2rem, 5vw, 5rem)", fontColor: "#ffffff",
      fontWeight: "400", textShadow: "2px 2px 8px rgba(0,0,0,0.8)", textAlign: "center", transition: "fade",
    });
  };

  const startEdit = (theme: any) => {
    setEditing(theme);
    setForm({
      name: theme.name,
      backgroundType: theme.backgroundType,
      backgroundValue: theme.backgroundValue,
      backgroundFit: theme.backgroundFit,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      fontColor: theme.fontColor,
      fontWeight: theme.fontWeight,
      textShadow: theme.textShadow,
      textAlign: theme.textAlign,
      transition: theme.transition,
    });
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await updateTheme({ id: editing.id, body: form });
      setEditing(null);
    } else {
      await createTheme(form);
    }
    setShowCreate(false);
    resetForm();
  };

  const selectBgImage = (id: string) => {
    setForm({ ...form, backgroundType: "image", backgroundValue: `/api/media/file/${id}` });
  };

  if (showCreate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{editing ? "Editar Tema" : "Novo Tema"}</h3>
          <button onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }} className="text-zinc-400 text-sm hover:text-white">Cancelar</button>
        </div>

        {/* Preview */}
        <div
          className="aspect-video rounded-lg overflow-hidden flex items-center justify-center relative"
          style={{
            backgroundColor: form.backgroundType === "color" ? form.backgroundValue : "#000",
            backgroundImage: form.backgroundType === "image" ? `url(http://localhost:${SIDECAR_PORT}${form.backgroundValue})` : undefined,
            backgroundSize: form.backgroundFit === "stretch" ? "100% 100%" : form.backgroundFit,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <p style={{
            fontFamily: form.fontFamily,
            fontSize: "2rem",
            color: form.fontColor,
            fontWeight: form.fontWeight,
            textShadow: form.textShadow,
            textAlign: form.textAlign as any,
          }}>
            Texto de exemplo
          </p>
        </div>

        <input type="text" placeholder="Nome do tema *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm" />

        {/* Background */}
        <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
          <p className="text-zinc-400 text-xs uppercase">Fundo</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setForm({ ...form, backgroundType: "color" })} className={`px-3 py-1 rounded text-xs ${form.backgroundType === "color" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>Cor</button>
            <button onClick={() => setForm({ ...form, backgroundType: "image" })} className={`px-3 py-1 rounded text-xs ${form.backgroundType === "image" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>Imagem</button>
            <button onClick={() => setForm({ ...form, backgroundType: "video" })} className={`px-3 py-1 rounded text-xs ${form.backgroundType === "video" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>Video</button>
          </div>
          {form.backgroundType === "color" && (
            <input type="color" value={form.backgroundValue} onChange={(e) => setForm({ ...form, backgroundValue: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
          )}
          {(form.backgroundType === "image" || form.backgroundType === "video") && (
            <div className="grid grid-cols-6 gap-1">
              {backgrounds.map((bg) => (
                <button key={bg.id} onClick={() => selectBgImage(bg.id)} className={`aspect-video rounded overflow-hidden ${form.backgroundValue.includes(bg.id) ? "ring-2 ring-blue-500" : ""}`}>
                  <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${bg.id}`} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {(["cover", "contain", "stretch", "center"] as const).map((f) => (
              <button key={f} onClick={() => setForm({ ...form, backgroundFit: f })} className={`px-2 py-1 rounded text-xs ${form.backgroundFit === f ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
                {f === "cover" ? "Preencher" : f === "contain" ? "Ajustar" : f === "stretch" ? "Esticar" : "Centralizar"}
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
          <p className="text-zinc-400 text-xs uppercase">Tipografia</p>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.fontFamily} onChange={(e) => setForm({ ...form, fontFamily: e.target.value })} className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs">
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={form.fontWeight} onChange={(e) => setForm({ ...form, fontWeight: e.target.value })} className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs">
              <option value="300">Light</option>
              <option value="400">Normal</option>
              <option value="600">Semi-Bold</option>
              <option value="700">Bold</option>
              <option value="900">Extra-Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs">Cor:</span>
            <input type="color" value={form.fontColor} onChange={(e) => setForm({ ...form, fontColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            <span className="text-zinc-500 text-xs">Alinhamento:</span>
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} onClick={() => setForm({ ...form, textAlign: a })} className={`px-2 py-1 rounded text-xs ${form.textAlign === a ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>
                {a === "left" ? "Esq" : a === "center" ? "Centro" : "Dir"}
              </button>
            ))}
          </div>
        </div>

        {/* Transition */}
        <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
          <p className="text-zinc-400 text-xs uppercase">Transicao</p>
          <div className="flex gap-2">
            {TRANSITIONS.map((t) => (
              <button key={t.value} onClick={() => setForm({ ...form, transition: t.value })} className={`px-3 py-1 rounded text-xs ${form.transition === t.value ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={!form.name.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50">
          {editing ? "Salvar Alteracoes" : "Criar Tema"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Temas ({themes.length})</h3>
        <button onClick={() => { resetForm(); setShowCreate(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-500">
          + Novo Tema
        </button>
      </div>

      {themes.length === 0 && (
        <p className="text-zinc-500 text-sm">Nenhum tema criado. Crie um tema para personalizar a aparencia da projecao.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme: any) => (
          <div key={theme.id} className="bg-zinc-800 rounded-lg overflow-hidden">
            {/* Mini preview */}
            <div
              className="aspect-video flex items-center justify-center"
              style={{
                backgroundColor: theme.backgroundType === "color" ? theme.backgroundValue : "#000",
                backgroundImage: theme.backgroundType === "image" ? `url(http://localhost:${SIDECAR_PORT}${theme.backgroundValue})` : undefined,
                backgroundSize: theme.backgroundFit === "stretch" ? "100% 100%" : theme.backgroundFit,
                backgroundPosition: "center",
              }}
            >
              <p style={{ fontFamily: theme.fontFamily, color: theme.fontColor, fontWeight: theme.fontWeight, textShadow: theme.textShadow, fontSize: "1rem" }}>
                Exemplo
              </p>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium">{theme.name}</p>
                {theme.isDefault && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Padrao</span>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setDefaultTheme(theme.id)} className="text-xs text-blue-400 hover:underline">Definir padrao</button>
                <button onClick={() => startEdit(theme)} className="text-xs text-zinc-400 hover:text-white">Editar</button>
                <button onClick={() => deleteTheme(theme.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
