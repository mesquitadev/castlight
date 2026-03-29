import { useState } from "react";
import { useCreateSongMutation, useLazySearchOnlineLyricsQuery, useLazyGetOnlineLyricsTextQuery } from "../store/api";
import { SectionType } from "@castlight/shared";

interface Props {
  onClose: () => void;
  onCreated: (songId: string) => void;
}

const SECTION_TYPES = [
  { value: SectionType.Verse, label: "Verso" },
  { value: SectionType.Chorus, label: "Refrao" },
  { value: SectionType.Bridge, label: "Ponte" },
  { value: SectionType.PreChorus, label: "Pre-Refrao" },
  { value: SectionType.Intro, label: "Intro" },
  { value: SectionType.Outro, label: "Outro" },
];

function parseLyricsText(text: string): Array<{ type: string; label: string; text: string; order: number }> {
  // Split by double newlines into sections
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
  return blocks.map((block, i) => ({
    type: i === 0 ? SectionType.Verse : (i % 2 === 1 ? SectionType.Chorus : SectionType.Verse),
    label: i === 0 ? "Verso 1" : (i % 2 === 1 ? `Refrao` : `Verso ${Math.ceil((i + 1) / 2)}`),
    text: block.trim(),
    order: i,
  }));
}

export function LyricsEditor({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("");
  const [lyricsText, setLyricsText] = useState("");
  const [sections, setSections] = useState<Array<{ type: string; label: string; text: string; order: number }>>([]);

  const [createSong, { isLoading: creating }] = useCreateSongMutation();

  // Online search
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerSearch, { data: searchResults = [], isFetching: searching }] = useLazySearchOnlineLyricsQuery();
  const [triggerGetText, { isFetching: loadingText }] = useLazyGetOnlineLyricsTextQuery();

  const handleSearch = () => {
    if (searchQuery.trim()) triggerSearch(searchQuery);
  };

  const handleSelectOnline = async (result: { title: string; artist: string }) => {
    setTitle(result.title);
    setArtist(result.artist);
    setTab("create");

    const { data } = await triggerGetText({ artist: result.artist, title: result.title });
    if (data?.text) {
      setLyricsText(data.text);
      setSections(parseLyricsText(data.text));
    }
  };

  const handleTextChange = (text: string) => {
    setLyricsText(text);
    setSections(parseLyricsText(text));
  };

  const updateSection = (index: number, field: "type" | "label" | "text", value: string) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    setSections((prev) => [...prev, {
      type: SectionType.Verse,
      label: `Verso ${prev.filter((s) => s.type === SectionType.Verse).length + 1}`,
      text: "",
      order: prev.length,
    }]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    if (!title.trim() || sections.length === 0) return;
    const result = await createSong({
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim() || undefined,
      sections: sections.map((s, i) => ({ type: s.type, label: s.label, text: s.text, order: i })),
    }).unwrap();
    onCreated(result.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Nova Musica</h2>
        <button onClick={onClose} className="text-sm" style={{ color: "var(--color-text-muted)" }}>Cancelar</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--color-surface-300)" }}>
        <button
          onClick={() => setTab("create")}
          className="px-4 py-2 text-sm font-medium"
          style={tab === "create" ? { color: "var(--color-text-primary)", borderBottom: "2px solid var(--color-accent)" } : { color: "var(--color-text-muted)" }}
        >
          Criar manualmente
        </button>
        <button
          onClick={() => setTab("search")}
          className="px-4 py-2 text-sm font-medium"
          style={tab === "search" ? { color: "var(--color-text-primary)", borderBottom: "2px solid var(--color-accent)" } : { color: "var(--color-text-muted)" }}
        >
          Buscar online
        </button>
      </div>

      {tab === "search" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar musica ou artista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="input-field flex-1"
            />
            <button onClick={handleSearch} disabled={searching} className="btn btn-primary disabled:opacity-50">
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {searchResults.map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelectOnline(result)}
              disabled={loadingText}
              className="card w-full text-left p-3 transition-colors"
              style={{ display: "block" }}
            >
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{result.title}</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{result.artist}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div className="space-y-4">
          {/* Song info */}
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Titulo *" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field col-span-1" />
            <input type="text" placeholder="Artista" value={artist} onChange={(e) => setArtist(e.target.value)} className="input-field col-span-1" />
            <input type="text" placeholder="Tom (ex: G, Am)" value={key} onChange={(e) => setKey(e.target.value)} className="input-field col-span-1" />
          </div>

          {/* Quick paste area */}
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Cole a letra inteira (separe secoes com linha em branco):</p>
            <textarea
              value={lyricsText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={6}
              className="input-field w-full resize-none"
              style={{ fontFamily: "var(--font-mono)" }}
              placeholder={"Verso 1 aqui\nSegunda linha\n\nRefrao aqui\nSegunda linha do refrao\n\nVerso 2 aqui"}
            />
          </div>

          {/* Sections editor */}
          {sections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase" style={{ color: "var(--color-text-secondary)" }}>Secoes ({sections.length})</p>
                <button onClick={addSection} className="text-xs hover:underline" style={{ color: "var(--color-accent)" }}>+ Adicionar secao</button>
              </div>
              {sections.map((section, i) => (
                <div key={i} className="card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(i, "type", e.target.value)}
                      className="input-field px-2 py-1 text-xs"
                    >
                      {SECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={section.label}
                      onChange={(e) => updateSection(i, "label", e.target.value)}
                      className="input-field flex-1 px-2 py-1 text-xs"
                    />
                    <button onClick={() => removeSection(i)} className="text-xs" style={{ color: "var(--color-danger)" }}>Remover</button>
                  </div>
                  <textarea
                    value={section.text}
                    onChange={(e) => updateSection(i, "text", e.target.value)}
                    rows={3}
                    className="input-field w-full px-2 py-1.5 text-sm resize-none"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={creating || !title.trim() || sections.length === 0}
            className="btn btn-primary disabled:opacity-50"
          >
            {creating ? "Salvando..." : "Salvar Musica"}
          </button>
        </div>
      )}
    </div>
  );
}
