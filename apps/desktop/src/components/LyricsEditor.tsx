import { useState } from "react";
import { useCreateSongMutation, useLazySearchOnlineLyricsQuery, useLazyGetOnlineLyricsTextQuery, useGetThemesQuery } from "../store/api";
import { SectionType, SIDECAR_PORT } from "@castlight/shared";

interface Props {
  onClose: () => void;
  onCreated: (songId: string) => void;
}

const SECTION_TYPES = [
  { value: SectionType.Verse, label: "Verso" },
  { value: SectionType.Chorus, label: "Refrão" },
  { value: SectionType.Bridge, label: "Ponte" },
  { value: SectionType.PreChorus, label: "Pré-Refrão" },
  { value: SectionType.Intro, label: "Intro" },
  { value: SectionType.Outro, label: "Outro" },
];

const SECTION_MARKERS: Record<string, { type: string; label: string }> = {
  "verso": { type: SectionType.Verse, label: "Verso" },
  "verse": { type: SectionType.Verse, label: "Verso" },
  "refrão": { type: SectionType.Chorus, label: "Refrão" },
  "refrao": { type: SectionType.Chorus, label: "Refrão" },
  "chorus": { type: SectionType.Chorus, label: "Refrão" },
  "ponte": { type: SectionType.Bridge, label: "Ponte" },
  "bridge": { type: SectionType.Bridge, label: "Ponte" },
  "pré-refrão": { type: SectionType.PreChorus, label: "Pré-Refrão" },
  "pre-chorus": { type: SectionType.PreChorus, label: "Pré-Refrão" },
  "intro": { type: SectionType.Intro, label: "Intro" },
  "outro": { type: SectionType.Outro, label: "Outro" },
};

function parseLyricsText(text: string): Array<{ type: string; label: string; text: string; order: number }> {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
  let verseCount = 0;

  return blocks.map((block, i) => {
    const trimmed = block.trim();
    // Check for [Section] markers like [Chorus], [Verso 1], [Bridge]
    const markerMatch = trimmed.match(/^\[([^\]]+)\]\s*/);
    if (markerMatch) {
      const markerText = markerMatch[1].toLowerCase().replace(/\s*\d+$/, "");
      const known = SECTION_MARKERS[markerText];
      const cleanText = trimmed.replace(/^\[[^\]]+\]\s*\n?/, "").trim();
      if (known) {
        if (known.type === SectionType.Verse) verseCount++;
        return { type: known.type, label: markerMatch[1], text: cleanText, order: i };
      }
      return { type: SectionType.Verse, label: markerMatch[1], text: cleanText, order: i };
    }

    // Default: everything is a verse (user can change type manually)
    verseCount++;
    return { type: SectionType.Verse, label: `Verso ${verseCount}`, text: trimmed, order: i };
  });
}

export function LyricsEditor({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [lyricsText, setLyricsText] = useState("");
  const [sections, setSections] = useState<Array<{ type: string; label: string; text: string; order: number }>>([]);

  const [createSong, { isLoading: creating }] = useCreateSongMutation();
  const { data: themes = [] } = useGetThemesQuery();

  // Online search
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerSearch, { data: searchResults = [], isFetching: searching }] = useLazySearchOnlineLyricsQuery();
  const [triggerGetText, { isFetching: loadingText }] = useLazyGetOnlineLyricsTextQuery();
  const [loadingLyricsFor, setLoadingLyricsFor] = useState<string | null>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) triggerSearch(searchQuery);
  };

  const handleSelectOnline = async (result: { title: string; artist: string; lyricsUrl: string }) => {
    setTitle(result.title);
    setArtist(result.artist);
    setLoadingLyricsFor(result.title);

    const { data } = await triggerGetText(result.lyricsUrl);
    if (data?.text) {
      setLyricsText(data.text);
      setSections(parseLyricsText(data.text));
    }

    setLoadingLyricsFor(null);
    setTab("create");
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
      tags: selectedThemeId ? [`theme:${selectedThemeId}`] : undefined,
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
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Clique num resultado pra importar titulo, artista e a letra completa.
          </p>
          {loadingLyricsFor && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-surface-500)", borderTopColor: "var(--color-accent)" }} />
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Buscando letra de "{loadingLyricsFor}"...</span>
            </div>
          )}
          {searchResults.map((result: any, i: number) => (
            <button
              key={i}
              onClick={() => handleSelectOnline(result)}
              disabled={!!loadingLyricsFor}
              className="card w-full text-left p-3 flex items-center gap-3 transition-colors disabled:opacity-50"
            >
              {result.thumbnail && (
                <img src={result.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{result.title}</p>
                <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>{result.artist}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-400)", color: "var(--color-text-muted)" }}>
                Genius
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div className="space-y-4">
          {/* Song info */}
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Titulo *" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
            <input type="text" placeholder="Artista" value={artist} onChange={(e) => setArtist(e.target.value)} className="input-field" />
            <input type="text" placeholder="Tom (ex: G, Am)" value={key} onChange={(e) => setKey(e.target.value)} className="input-field" />
          </div>

          {/* Theme selector */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase font-semibold" style={{ color: "var(--color-text-secondary)" }}>Tema visual</p>
              {selectedThemeId && (
                <button onClick={() => setSelectedThemeId("")} className="text-xs" style={{ color: "var(--color-text-muted)" }}>Limpar</button>
              )}
            </div>
            {themes.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Nenhum tema criado. Va em Config → Temas para criar.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {themes.map((theme: any) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className="rounded-lg overflow-hidden transition-all"
                    style={selectedThemeId === theme.id ? { outline: "2px solid var(--color-accent)", outlineOffset: "2px" } : {}}
                  >
                    <div
                      className="aspect-video flex items-center justify-center"
                      style={{
                        backgroundColor: theme.backgroundType === "color" ? theme.backgroundValue : "#000",
                        backgroundImage: theme.backgroundType === "image" ? `url(http://localhost:${SIDECAR_PORT}${theme.backgroundValue})` : undefined,
                        backgroundSize: theme.backgroundFit === "stretch" ? "100% 100%" : theme.backgroundFit,
                        backgroundPosition: "center",
                      }}
                    >
                      <p style={{ color: theme.fontColor, fontFamily: theme.fontFamily, fontWeight: theme.fontWeight, textShadow: theme.textShadow, fontSize: "0.6rem" }}>
                        {theme.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick paste area */}
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>Cole a letra inteira (separe secoes com linha em branco):</p>
            <textarea
              value={lyricsText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={8}
              className="input-field w-full resize-none"
              style={{ fontFamily: "var(--font-mono)" }}
              placeholder={"Verso 1 aqui\nSegunda linha\n\nRefrao aqui\nSegunda linha do refrao\n\nVerso 2 aqui"}
            />
          </div>

          {/* Sections editor */}
          {sections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-semibold" style={{ color: "var(--color-text-secondary)" }}>Secoes ({sections.length})</p>
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
