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
          <h3 className="font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>{editing ? "Editar Tema" : "Novo Tema"}</h3>
          <button onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }} className="text-sm" style={{ color: "var(--color-text-muted)" }}>Cancelar</button>
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

        <input type="text" placeholder="Nome do tema *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field w-full" />

        {/* Background */}
        <div className="card p-3 space-y-2">
          <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Fundo</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setForm({ ...form, backgroundType: "color" })}
              className={`px-3 py-1 rounded text-xs ${form.backgroundType === "color" ? "btn btn-primary" : "btn btn-secondary"}`}
            >
              Cor
            </button>
            <button
              onClick={() => setForm({ ...form, backgroundType: "image" })}
              className={`px-3 py-1 rounded text-xs ${form.backgroundType === "image" ? "btn btn-primary" : "btn btn-secondary"}`}
            >
              Imagem
            </button>
            <button
              onClick={() => setForm({ ...form, backgroundType: "video" })}
              className={`px-3 py-1 rounded text-xs ${form.backgroundType === "video" ? "btn btn-primary" : "btn btn-secondary"}`}
            >
              Video
            </button>
          </div>
          {form.backgroundType === "color" && (
            <input type="color" value={form.backgroundValue} onChange={(e) => setForm({ ...form, backgroundValue: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
          )}
          {(form.backgroundType === "image" || form.backgroundType === "video") && (
            <div className="grid grid-cols-6 gap-1">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => selectBgImage(bg.id)}
                  className="aspect-video rounded overflow-hidden"
                  style={form.backgroundValue.includes(bg.id) ? { outline: `2px solid var(--color-accent)` } : {}}
                >
                  <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${bg.id}`} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {(["cover", "contain", "stretch", "center"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setForm({ ...form, backgroundFit: f })}
                className={`px-2 py-1 rounded text-xs ${form.backgroundFit === f ? "btn btn-primary" : "btn btn-secondary"}`}
              >
                {f === "cover" ? "Preencher" : f === "contain" ? "Ajustar" : f === "stretch" ? "Esticar" : "Centralizar"}
              </button>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="card p-3 space-y-2">
          <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Tipografia</p>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.fontFamily} onChange={(e) => setForm({ ...form, fontFamily: e.target.value })} className="input-field px-2 py-1 text-xs">
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={form.fontWeight} onChange={(e) => setForm({ ...form, fontWeight: e.target.value })} className="input-field px-2 py-1 text-xs">
              <option value="300">Light</option>
              <option value="400">Normal</option>
              <option value="600">Semi-Bold</option>
              <option value="700">Bold</option>
              <option value="900">Extra-Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Cor:</span>
            <input type="color" value={form.fontColor} onChange={(e) => setForm({ ...form, fontColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Alinhamento:</span>
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setForm({ ...form, textAlign: a })}
                className={`px-2 py-1 rounded text-xs ${form.textAlign === a ? "btn btn-primary" : "btn btn-secondary"}`}
              >
                {a === "left" ? "Esq" : a === "center" ? "Centro" : "Dir"}
              </button>
            ))}
          </div>
        </div>

        {/* Transition */}
        <div className="card p-3 space-y-2">
          <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Transicao</p>
          <div className="flex gap-2">
            {TRANSITIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, transition: t.value })}
                className={`px-3 py-1 rounded text-xs ${form.transition === t.value ? "btn btn-primary" : "btn btn-secondary"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={!form.name.trim()} className="btn btn-primary disabled:opacity-50">
          {editing ? "Salvar Alteracoes" : "Criar Tema"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Temas ({themes.length})</h3>
        <button onClick={() => { resetForm(); setShowCreate(true); }} className="btn btn-primary text-xs">
          + Novo Tema
        </button>
      </div>

      {themes.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Nenhum tema criado. Crie um tema para personalizar a aparencia da projecao.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme: any) => (
          <div key={theme.id} className="card overflow-hidden" style={{ padding: 0 }}>
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
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{theme.name}</p>
                {theme.isDefault && <span className="badge badge-success">Padrao</span>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setDefaultTheme(theme.id)} className="text-xs hover:underline" style={{ color: "var(--color-accent)" }}>Definir padrao</button>
                <button onClick={() => startEdit(theme)} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Editar</button>
                <button onClick={() => deleteTheme(theme.id)} className="text-xs" style={{ color: "var(--color-danger)" }}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
