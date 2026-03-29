import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  useGetBibleVersionsQuery,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
  useGetMediaFilesQuery,
  useGetSettingQuery,
  useSaveSettingMutation,
} from "../store/api";
import { presentBible, clearPresentation } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { BackgroundConfig } from "@castlight/shared";

const BOOK_CATEGORIES: Record<string, { color: string; bg: string }> = {
  // Pentateuco
  "Gênesis": { color: "#fff", bg: "#b45309" }, Genesis: { color: "#fff", bg: "#b45309" },
  "Êxodo": { color: "#fff", bg: "#b45309" }, Exodo: { color: "#fff", bg: "#b45309" },
  "Levítico": { color: "#fff", bg: "#b45309" }, Levitico: { color: "#fff", bg: "#b45309" },
  "Números": { color: "#fff", bg: "#b45309" }, Numeros: { color: "#fff", bg: "#b45309" },
  "Deuteronômio": { color: "#fff", bg: "#b45309" }, Deuteronomio: { color: "#fff", bg: "#b45309" },
  // Historicos
  "Josué": { color: "#fff", bg: "#059669" }, Josue: { color: "#fff", bg: "#059669" },
  "Juízes": { color: "#fff", bg: "#059669" }, Juizes: { color: "#fff", bg: "#059669" },
  Rute: { color: "#fff", bg: "#059669" },
  "1 Samuel": { color: "#fff", bg: "#059669" }, "1Samuel": { color: "#fff", bg: "#059669" },
  "2 Samuel": { color: "#fff", bg: "#059669" }, "2Samuel": { color: "#fff", bg: "#059669" },
  "1 Reis": { color: "#fff", bg: "#059669" }, "1Reis": { color: "#fff", bg: "#059669" },
  "2 Reis": { color: "#fff", bg: "#dc2626" }, "2Reis": { color: "#fff", bg: "#dc2626" },
  "1 Crônicas": { color: "#fff", bg: "#dc2626" }, "1Cronicas": { color: "#fff", bg: "#dc2626" }, "1 Cronicas": { color: "#fff", bg: "#dc2626" },
  "2 Crônicas": { color: "#fff", bg: "#dc2626" }, "2Cronicas": { color: "#fff", bg: "#dc2626" }, "2 Cronicas": { color: "#fff", bg: "#dc2626" },
  Esdras: { color: "#fff", bg: "#dc2626" },
  Neemias: { color: "#fff", bg: "#dc2626" },
  Ester: { color: "#fff", bg: "#dc2626" },
  // Poeticos
  "Jó": { color: "#fff", bg: "#7c3aed" }, Jo: { color: "#fff", bg: "#7c3aed" },
  Salmos: { color: "#fff", bg: "#7c3aed" },
  "Provérbios": { color: "#fff", bg: "#7c3aed" }, Proverbios: { color: "#fff", bg: "#7c3aed" },
  Eclesiastes: { color: "#fff", bg: "#7c3aed" },
  "Cânticos": { color: "#fff", bg: "#7c3aed" }, Cantares: { color: "#fff", bg: "#7c3aed" }, "Cântico dos Cânticos": { color: "#fff", bg: "#7c3aed" },
  // Profetas Maiores
  "Isaías": { color: "#fff", bg: "#2563eb" }, Isaias: { color: "#fff", bg: "#2563eb" },
  Jeremias: { color: "#fff", bg: "#2563eb" },
  "Lamentações": { color: "#fff", bg: "#2563eb" }, Lamentacoes: { color: "#fff", bg: "#2563eb" },
  Ezequiel: { color: "#fff", bg: "#2563eb" },
  Daniel: { color: "#fff", bg: "#2563eb" },
  // Profetas Menores
  "Oséias": { color: "#fff", bg: "#0891b2" }, Oseias: { color: "#fff", bg: "#0891b2" },
  Joel: { color: "#fff", bg: "#0891b2" },
  "Amós": { color: "#fff", bg: "#0891b2" }, Amos: { color: "#fff", bg: "#0891b2" },
  Obadias: { color: "#fff", bg: "#0891b2" },
  Jonas: { color: "#fff", bg: "#0891b2" },
  "Miquéias": { color: "#fff", bg: "#0891b2" }, Miqueias: { color: "#fff", bg: "#0891b2" },
  Naum: { color: "#fff", bg: "#0891b2" },
  Habacuque: { color: "#fff", bg: "#0891b2" },
  Sofonias: { color: "#fff", bg: "#0891b2" },
  Ageu: { color: "#fff", bg: "#0891b2" },
  Zacarias: { color: "#fff", bg: "#0891b2" },
  Malaquias: { color: "#fff", bg: "#0891b2" },
  // Evangelhos
  Mateus: { color: "#fff", bg: "#16a34a" },
  Marcos: { color: "#fff", bg: "#16a34a" },
  Lucas: { color: "#fff", bg: "#16a34a" },
  "João": { color: "#fff", bg: "#16a34a" }, Joao: { color: "#fff", bg: "#16a34a" },
  // Historico NT
  Atos: { color: "#fff", bg: "#ea580c" },
  // Cartas Paulinas
  Romanos: { color: "#fff", bg: "#9333ea" },
  "1 Coríntios": { color: "#fff", bg: "#9333ea" }, "1Corintios": { color: "#fff", bg: "#9333ea" }, "1 Corintios": { color: "#fff", bg: "#9333ea" },
  "2 Coríntios": { color: "#fff", bg: "#9333ea" }, "2Corintios": { color: "#fff", bg: "#9333ea" }, "2 Corintios": { color: "#fff", bg: "#9333ea" },
  "Gálatas": { color: "#fff", bg: "#9333ea" }, Galatas: { color: "#fff", bg: "#9333ea" },
  "Efésios": { color: "#fff", bg: "#9333ea" }, Efesios: { color: "#fff", bg: "#9333ea" },
  Filipenses: { color: "#fff", bg: "#9333ea" },
  Colossenses: { color: "#fff", bg: "#9333ea" },
  "1 Tessalonicenses": { color: "#fff", bg: "#9333ea" },
  "2 Tessalonicenses": { color: "#fff", bg: "#9333ea" },
  "1 Timóteo": { color: "#fff", bg: "#9333ea" }, "1Timoteo": { color: "#fff", bg: "#9333ea" }, "1 Timoteo": { color: "#fff", bg: "#9333ea" },
  "2 Timóteo": { color: "#fff", bg: "#9333ea" }, "2Timoteo": { color: "#fff", bg: "#9333ea" }, "2 Timoteo": { color: "#fff", bg: "#9333ea" },
  Tito: { color: "#fff", bg: "#9333ea" },
  Filemom: { color: "#fff", bg: "#9333ea" }, "Filemon": { color: "#fff", bg: "#9333ea" },
  Hebreus: { color: "#fff", bg: "#9333ea" },
  // Cartas Gerais
  Tiago: { color: "#fff", bg: "#e11d48" },
  "1 Pedro": { color: "#fff", bg: "#e11d48" },
  "2 Pedro": { color: "#fff", bg: "#e11d48" },
  "1 João": { color: "#fff", bg: "#e11d48" }, "1Joao": { color: "#fff", bg: "#e11d48" }, "1 Joao": { color: "#fff", bg: "#e11d48" },
  "2 João": { color: "#fff", bg: "#e11d48" }, "2Joao": { color: "#fff", bg: "#e11d48" }, "2 Joao": { color: "#fff", bg: "#e11d48" },
  "3 João": { color: "#fff", bg: "#e11d48" }, "3Joao": { color: "#fff", bg: "#e11d48" }, "3 Joao": { color: "#fff", bg: "#e11d48" },
  Judas: { color: "#fff", bg: "#e11d48" },
  Apocalipse: { color: "#fff", bg: "#e11d48" },
};

const DEFAULT_BOOK_STYLE = { color: "#fff", bg: "#525252" };

function getBookStyle(name: string) {
  return BOOK_CATEGORIES[name] ?? DEFAULT_BOOK_STYLE;
}

function broadcastClear() {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "content:clear",
      roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
      data: "blank",
    }),
  });
}

function broadcastBackground(config: BackgroundConfig) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "background:change",
      roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
      data: config,
    }),
  });
}

function parseReference(input: string, books: Array<{ name: string; abbr: string }>) {
  // Formats: "Jo 3:16", "Genesis 1:1", "Gn 1 1", "jo3:16", "salmos 23"
  const cleaned = input.trim();

  // Try to match: book chapter:verse or book chapter verse
  const match = cleaned.match(/^(.+?)\s*(\d+)\s*[:\s.,]\s*(\d+)$/);
  if (match) {
    const bookQuery = match[1].trim().toLowerCase();
    const chapter = parseInt(match[2]);
    const verse = parseInt(match[3]);
    const book = books.find((b) =>
      b.name.toLowerCase().startsWith(bookQuery) ||
      b.abbr.toLowerCase() === bookQuery ||
      b.abbr.toLowerCase().startsWith(bookQuery)
    );
    if (book) return { book: book.name, chapter, verse };
  }

  // Try: book chapter (no verse)
  const matchChapter = cleaned.match(/^(.+?)\s*(\d+)$/);
  if (matchChapter) {
    const bookQuery = matchChapter[1].trim().toLowerCase();
    const chapter = parseInt(matchChapter[2]);
    const book = books.find((b) =>
      b.name.toLowerCase().startsWith(bookQuery) ||
      b.abbr.toLowerCase() === bookQuery ||
      b.abbr.toLowerCase().startsWith(bookQuery)
    );
    if (book) return { book: book.name, chapter, verse: null };
  }

  return null;
}

export function BibleNavigator() {
  const dispatch = useDispatch();
  const [version, setVersion] = useState("acf");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [bibleBg, setBibleBg] = useState<BackgroundConfig | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const quickSearchRef = useRef<HTMLInputElement>(null);
  const verseListRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const { data: versions = [] } = useGetBibleVersionsQuery();
  const { data: books = [] } = useGetBibleBooksQuery(version);
  const { data: backgrounds = [] } = useGetMediaFilesQuery("background");
  const { data: savedBibleBg } = useGetSettingQuery("bible_background");
  const [saveSetting] = useSaveSettingMutation();
  const currentBook = books.find((b) => b.name === selectedBook);

  // Load saved bible background
  useEffect(() => {
    if (savedBibleBg && !bibleBg) {
      setBibleBg(savedBibleBg as BackgroundConfig);
    }
  }, [savedBibleBg, bibleBg]);

  const { data: verses = [] } = useGetBibleVersesQuery(
    selectedBook && selectedChapter
      ? { version, book: selectedBook, chapter: selectedChapter, verseStart: 1, verseEnd: 200 }
      : { version: "", book: "", chapter: 0, verseStart: 0 },
    { skip: !selectedBook || !selectedChapter },
  );

  // Auto-scroll to selected verse
  useEffect(() => {
    if (selectedVerse !== null) {
      const el = verseRefs.current.get(selectedVerse);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedVerse]);

  const sendVerse = useCallback((verseNum: number) => {
    if (!selectedBook || !selectedChapter) return;
    const ref = { version, book: selectedBook, chapter: selectedChapter, verseStart: verseNum };
    const verseData = verses.filter((v) => v.verse === verseNum);
    if (verseData.length === 0) return;
    setSelectedVerse(verseNum);
    dispatch(presentBible({ verses: verseData, reference: ref }));
    // Send bible-specific background first (if set)
    if (bibleBg) broadcastBackground(bibleBg);
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:bible",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { verses: verseData, reference: ref },
      }),
    });
  }, [selectedBook, selectedChapter, version, verses, dispatch, bibleBg]);

  // Quick search handler
  const handleQuickSearchSubmit = useCallback(() => {
    const parsed = parseReference(quickSearch, books);
    if (parsed) {
      setSelectedBook(parsed.book);
      setSelectedChapter(parsed.chapter);
      setSelectedVerse(null);
      if (parsed.verse) {
        // Small delay to let verses load, then send
        setTimeout(() => sendVerse(parsed.verse!), 300);
      }
    }
    setShowQuickSearch(false);
    setQuickSearch("");
  }, [quickSearch, books, sendVerse]);

  // Focus quick search input when shown
  useEffect(() => {
    if (showQuickSearch) {
      setTimeout(() => quickSearchRef.current?.focus(), 50);
    }
  }, [showQuickSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if quick search is open
      if (showQuickSearch) return;

      // Esc — clear presentation (restore worship wallpaper)
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedVerse(null);
        dispatch(clearPresentation());
        broadcastClear();
        fetch(`http://localhost:${SIDECAR_PORT}/api/settings/default_wallpaper`)
          .then((r) => r.json())
          .then((config) => { if (config?.type) broadcastBackground(config); });
        return;
      }

      // Arrow keys — navigate verses
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (selectedBook && selectedChapter && verses.length > 0) {
          e.preventDefault();
          const current = selectedVerse ?? 0;
          const next = Math.min(current + 1, verses.length);
          sendVerse(next);
        }
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (selectedBook && selectedChapter && verses.length > 0) {
          e.preventDefault();
          const current = selectedVerse ?? 2;
          const prev = Math.max(current - 1, 1);
          sendVerse(prev);
        }
        return;
      }

      // Any letter/number key — open quick search
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setQuickSearch(e.key);
        setShowQuickSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVerse, selectedBook, selectedChapter, verses, sendVerse, dispatch, showQuickSearch]);

  return (
    <div className="flex gap-2 h-[calc(100vh-8rem)] relative">
      {/* Quick search modal */}
      {showQuickSearch && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
          <div className="bg-zinc-800 rounded-xl p-6 w-96 shadow-2xl border border-zinc-700">
            <p className="text-zinc-400 text-xs mb-2">Digite uma referencia para localizar o versiculo</p>
            <input
              ref={quickSearchRef}
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleQuickSearchSubmit(); }
                if (e.key === "Escape") { e.preventDefault(); setShowQuickSearch(false); setQuickSearch(""); }
              }}
              placeholder="Ex: Jo 3:16, Genesis 1:1, Sl 23"
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white text-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-3 flex items-center justify-between text-zinc-500 text-xs">
              <span>Enter para ir | Esc para fechar</span>
              {quickSearch && (() => {
                const parsed = parseReference(quickSearch, books);
                return parsed
                  ? <span className="text-green-400">{parsed.book} {parsed.chapter}{parsed.verse ? `:${parsed.verse}` : ""}</span>
                  : <span className="text-red-400">Referencia nao encontrada</span>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Left panel — Verse text (main area, like Holyrics) */}
      <div className="flex-1 flex flex-col bg-zinc-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <h3 className="text-white font-semibold text-sm">
            {selectedBook && selectedChapter
              ? `${selectedBook} ${selectedChapter}`
              : "Selecione um livro"}
          </h3>
          <select
            value={version}
            onChange={(e) => { setVersion(e.target.value); setSelectedBook(null); setSelectedChapter(null); setSelectedVerse(null); }}
            className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.id.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Bible background picker */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-850 border-b border-zinc-700">
          <span className="text-zinc-500 text-xs">Fundo:</span>
          <button
            onClick={() => { setBibleBg(null); saveSetting({ key: "bible_background", value: null }); }}
            className={`w-6 h-6 rounded border ${!bibleBg ? "ring-2 ring-blue-500 border-blue-500" : "border-zinc-600"} bg-zinc-950`}
            title="Sem fundo (usa papel de parede)"
          />
          {backgrounds.map((bg) => {
            const config: BackgroundConfig = { type: "image", value: `/api/media/file/${bg.id}` };
            const isActive = bibleBg?.value === config.value;
            return (
              <button
                key={bg.id}
                onClick={() => { setBibleBg(config); saveSetting({ key: "bible_background", value: config }); }}
                className={`w-6 h-6 rounded overflow-hidden ${isActive ? "ring-2 ring-blue-500" : "border border-zinc-600"}`}
                title={bg.originalFilename}
              >
                <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${bg.id}`} className="w-full h-full object-cover" alt="" />
              </button>
            );
          })}
          <input
            type="color"
            className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            onChange={(e) => { const c: BackgroundConfig = { type: "color", value: e.target.value }; setBibleBg(c); saveSetting({ key: "bible_background", value: c }); }}
            title="Cor solida"
          />
        </div>

        {/* Verse list */}
        <div ref={verseListRef} className="flex-1 overflow-y-auto p-2">
          {selectedBook && selectedChapter ? (
            <div className="space-y-0.5">
              {verses.map((verse) => (
                <button
                  key={verse.verse}
                  ref={(el) => { if (el) verseRefs.current.set(verse.verse, el); }}
                  onClick={() => sendVerse(verse.verse)}
                  className={`w-full text-left px-3 py-2.5 rounded transition-colors ${
                    selectedVerse === verse.verse
                      ? "bg-blue-600 text-white"
                      : "hover:bg-zinc-800 text-zinc-200"
                  }`}
                >
                  <span className={`text-xs font-bold mr-2 ${selectedVerse === verse.verse ? "text-blue-200" : "text-blue-400"}`}>
                    {verse.verse}
                  </span>
                  <span className="text-sm leading-relaxed">{verse.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-zinc-600 text-sm">Selecione um livro e capitulo</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-zinc-800 border-t border-zinc-700 text-zinc-500 text-xs flex items-center justify-between">
          <span>
            {selectedVerse
              ? `${selectedBook} ${selectedChapter}:${selectedVerse} — ${version.toUpperCase()}`
              : "↑↓ Navegar | Esc Limpar | Digite para busca rapida (ex: Jo 3:16)"}
          </span>
          {selectedVerse && (
            <span>{selectedVerse} de {verses.length}</span>
          )}
        </div>
      </div>

      {/* Right panel — Books + Chapters + Verse numbers */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
        {/* Books grid */}
        <div className="flex-1 overflow-y-auto bg-zinc-900 rounded-lg p-2">
          <div className="grid grid-cols-5 gap-1">
            {books.map((book) => {
              const style = getBookStyle(book.name);
              const isSelected = selectedBook === book.name;
              return (
                <button
                  key={book.abbr}
                  onClick={() => { setSelectedBook(book.name); setSelectedChapter(1); setSelectedVerse(null); }}
                  title={book.name}
                  className={`rounded p-1 text-center transition-all text-[10px] font-bold leading-tight ${
                    isSelected ? "ring-2 ring-white scale-105 z-10" : "hover:brightness-125"
                  }`}
                  style={{ backgroundColor: style.bg, color: style.color }}
                >
                  <div className="text-xs">{book.abbr}</div>
                  <div className="text-[8px] font-normal opacity-70 truncate">{book.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chapters */}
        {selectedBook && currentBook && (
          <div className="bg-zinc-900 rounded-lg p-2 max-h-36 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => { setSelectedChapter(ch); setSelectedVerse(null); }}
                  className={`rounded p-1 text-[11px] font-medium transition-colors ${
                    selectedChapter === ch
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Verse numbers */}
        {selectedChapter && verses.length > 0 && (
          <div className="bg-zinc-900 rounded-lg p-2 max-h-36 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1">
              {verses.map((v) => (
                <button
                  key={v.verse}
                  onClick={() => sendVerse(v.verse)}
                  className={`rounded p-1 text-[11px] font-medium transition-colors ${
                    selectedVerse === v.verse
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {v.verse}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
