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
        <h2 className="text-xl font-semibold text-white">Nova Musica</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">Cancelar</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        <button onClick={() => setTab("create")} className={`px-4 py-2 text-sm font-medium ${tab === "create" ? "text-white border-b-2 border-blue-500" : "text-zinc-400"}`}>
          Criar manualmente
        </button>
        <button onClick={() => setTab("search")} className={`px-4 py-2 text-sm font-medium ${tab === "search" ? "text-white border-b-2 border-blue-500" : "text-zinc-400"}`}>
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
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
            />
            <button onClick={handleSearch} disabled={searching} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {searchResults.map((result, i) => (
            <button
              key={i}
              onClick={() => handleSelectOnline(result)}
              disabled={loadingText}
              className="w-full text-left bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors"
            >
              <p className="text-white font-medium">{result.title}</p>
              <p className="text-zinc-400 text-sm">{result.artist}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div className="space-y-4">
          {/* Song info */}
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Titulo *" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500" />
            <input type="text" placeholder="Artista" value={artist} onChange={(e) => setArtist(e.target.value)} className="col-span-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500" />
            <input type="text" placeholder="Tom (ex: G, Am)" value={key} onChange={(e) => setKey(e.target.value)} className="col-span-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500" />
          </div>

          {/* Quick paste area */}
          <div>
            <p className="text-zinc-400 text-xs mb-1">Cole a letra inteira (separe secoes com linha em branco):</p>
            <textarea
              value={lyricsText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={6}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 resize-none font-mono"
              placeholder={"Verso 1 aqui\nSegunda linha\n\nRefrao aqui\nSegunda linha do refrao\n\nVerso 2 aqui"}
            />
          </div>

          {/* Sections editor */}
          {sections.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-xs uppercase">Secoes ({sections.length})</p>
                <button onClick={addSection} className="text-xs text-blue-400 hover:underline">+ Adicionar secao</button>
              </div>
              {sections.map((section, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(i, "type", e.target.value)}
                      className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs"
                    >
                      {SECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={section.label}
                      onChange={(e) => updateSection(i, "label", e.target.value)}
                      className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs"
                    />
                    <button onClick={() => removeSection(i)} className="text-red-400 text-xs hover:text-red-300">Remover</button>
                  </div>
                  <textarea
                    value={section.text}
                    onChange={(e) => updateSection(i, "text", e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm resize-none font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={creating || !title.trim() || sections.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {creating ? "Salvando..." : "Salvar Musica"}
          </button>
        </div>
      )}
    </div>
  );
}
