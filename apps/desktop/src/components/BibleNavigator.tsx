import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  useGetBibleVersionsQuery,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
} from "../store/api";
import { presentBible, clearPresentation } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

// Book colors by category (Holyrics style)
const CATEGORY_COLORS: Record<string, string> = {};
const assignColor = (names: string[], color: string) => names.forEach((n) => { CATEGORY_COLORS[n] = color; });
// Pentateuco
assignColor(["Gênesis","Genesis","Êxodo","Exodo","Levítico","Levitico","Números","Numeros","Deuteronômio","Deuteronomio"], "#0d9488");
// Históricos 1
assignColor(["Josué","Josue","Juízes","Juizes","Rute","1 Samuel","1Samuel","2 Samuel","2Samuel","1 Reis","1Reis"], "#2563eb");
// Históricos 2
assignColor(["2 Reis","2Reis","1 Crônicas","1 Cronicas","1Cronicas","2 Crônicas","2 Cronicas","2Cronicas","Esdras"], "#dc2626");
// Históricos 3
assignColor(["Neemias","Ester"], "#dc2626");
// Poéticos
assignColor(["Jó","Jo","Salmos","Provérbios","Proverbios","Eclesiastes","Cânticos","Cantares","Cântico dos Cânticos"], "#7c3aed");
// Profetas Maiores
assignColor(["Isaías","Isaias","Jeremias","Lamentações","Lamentacoes","Ezequiel","Daniel"], "#2563eb");
// Profetas Menores
assignColor(["Oséias","Oseias","Joel","Amós","Amos","Obadias","Jonas","Miquéias","Miqueias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias"], "#0891b2");
// Evangelhos
assignColor(["Mateus","Marcos","Lucas","João","Joao"], "#16a34a");
// Atos
assignColor(["Atos"], "#ea580c");
// Cartas Paulinas
assignColor(["Romanos","1 Coríntios","1 Corintios","1Corintios","2 Coríntios","2 Corintios","2Corintios","Gálatas","Galatas","Efésios","Efesios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","1 Timoteo","1Timoteo","2 Timóteo","2 Timoteo","2Timoteo","Tito","Filemom","Filemon","Hebreus"], "#9333ea");
// Cartas Gerais + Apocalipse
assignColor(["Tiago","1 Pedro","2 Pedro","1 João","1 Joao","1Joao","2 João","2 Joao","2Joao","3 João","3 Joao","3Joao","Judas","Apocalipse"], "#e11d48");

function getBookColor(name: string) { return CATEGORY_COLORS[name] ?? "#525252"; }

function broadcast(event: string, data: any) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor], data }),
  });
}

function parseReference(input: string, books: Array<{ name: string; abbr: string }>) {
  const cleaned = input.trim();
  const match = cleaned.match(/^(.+?)\s*(\d+)\s*[:\s.,]\s*(\d+)$/);
  if (match) {
    const q = match[1].trim().toLowerCase();
    const book = books.find((b) => b.name.toLowerCase().startsWith(q) || b.abbr.toLowerCase() === q || b.abbr.toLowerCase().startsWith(q));
    if (book) return { book: book.name, chapter: parseInt(match[2]), verse: parseInt(match[3]) };
  }
  const matchCh = cleaned.match(/^(.+?)\s*(\d+)$/);
  if (matchCh) {
    const q = matchCh[1].trim().toLowerCase();
    const book = books.find((b) => b.name.toLowerCase().startsWith(q) || b.abbr.toLowerCase() === q || b.abbr.toLowerCase().startsWith(q));
    if (book) return { book: book.name, chapter: parseInt(matchCh[2]), verse: null };
  }
  return null;
}

export function BibleNavigator() {
  const dispatch = useDispatch();
  const [version, setVersion] = useState("acf");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const quickSearchRef = useRef<HTMLInputElement>(null);
  const verseRefs = useRef<Map<number, HTMLElement>>(new Map());

  const { data: versions = [] } = useGetBibleVersionsQuery();
  const { data: books = [] } = useGetBibleBooksQuery(version);
  const currentBook = books.find((b) => b.name === selectedBook);

  const { data: verses = [] } = useGetBibleVersesQuery(
    selectedBook && selectedChapter
      ? { version, book: selectedBook, chapter: selectedChapter, verseStart: 1, verseEnd: 200 }
      : { version: "", book: "", chapter: 0, verseStart: 0 },
    { skip: !selectedBook || !selectedChapter },
  );

  // Auto-scroll
  useEffect(() => {
    if (selectedVerse !== null) {
      verseRefs.current.get(selectedVerse)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedVerse]);

  const sendVerse = useCallback((verseNum: number) => {
    if (!selectedBook || !selectedChapter) return;
    const ref = { version, book: selectedBook, chapter: selectedChapter, verseStart: verseNum };
    const verseData = verses.filter((v) => v.verse === verseNum);
    if (verseData.length === 0) return;
    setSelectedVerse(verseNum);
    dispatch(presentBible({ verses: verseData, reference: ref }));
    broadcast("content:bible", { verses: verseData, reference: ref });
  }, [selectedBook, selectedChapter, version, verses, dispatch]);

  // Quick search
  const handleQuickSearchSubmit = useCallback(() => {
    const parsed = parseReference(quickSearch, books);
    if (parsed) {
      setSelectedBook(parsed.book);
      setSelectedChapter(parsed.chapter);
      setSelectedVerse(null);
      if (parsed.verse) setTimeout(() => sendVerse(parsed.verse!), 300);
    }
    setShowQuickSearch(false);
    setQuickSearch("");
  }, [quickSearch, books, sendVerse]);

  useEffect(() => {
    if (showQuickSearch) setTimeout(() => quickSearchRef.current?.focus(), 50);
  }, [showQuickSearch]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQuickSearch) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedVerse(null);
        dispatch(clearPresentation());
        broadcast("content:clear", "blank");
        fetch(`http://localhost:${SIDECAR_PORT}/api/settings/default_wallpaper`)
          .then((r) => r.json())
          .then((config) => { if (config?.type) broadcast("background:change", config); });
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (selectedBook && selectedChapter && verses.length > 0) {
          e.preventDefault();
          const next = (selectedVerse ?? 0) + 1;
          if (next <= verses.length) {
            sendVerse(next);
          } else {
            // End of chapter — go to next chapter or next book
            const bookObj = books.find((b) => b.name === selectedBook);
            if (bookObj && selectedChapter < bookObj.chapters) {
              setSelectedChapter(selectedChapter + 1);
              setSelectedVerse(null);
              setTimeout(() => sendVerse(1), 300);
            } else {
              // End of book — go to next book chapter 1
              const bookIndex = books.findIndex((b) => b.name === selectedBook);
              if (bookIndex >= 0 && bookIndex < books.length - 1) {
                const nextBook = books[bookIndex + 1];
                setSelectedBook(nextBook.name);
                setSelectedChapter(1);
                setSelectedVerse(null);
                setTimeout(() => sendVerse(1), 300);
              }
            }
          }
        }
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (selectedBook && selectedChapter && verses.length > 0) {
          e.preventDefault();
          const prev = (selectedVerse ?? 2) - 1;
          if (prev >= 1) {
            sendVerse(prev);
          } else {
            // Start of chapter — go to previous chapter or previous book
            if (selectedChapter > 1) {
              setSelectedChapter(selectedChapter - 1);
              setSelectedVerse(null);
              // Go to last verse of previous chapter (delay for data load)
              setTimeout(() => {
                // We don't know the verse count yet, so go to a high number
                // sendVerse will clamp it
              }, 300);
            } else {
              // Start of book — go to previous book last chapter
              const bookIndex = books.findIndex((b) => b.name === selectedBook);
              if (bookIndex > 0) {
                const prevBook = books[bookIndex - 1];
                setSelectedBook(prevBook.name);
                setSelectedChapter(prevBook.chapters);
                setSelectedVerse(null);
              }
            }
          }
        }
        return;
      }
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
    <div className="flex h-[calc(100vh-8rem)] relative">
      {/* Quick search modal */}
      {showQuickSearch && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-20" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="card p-6 w-96 shadow-2xl">
            <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
              Digite uma referência para localizar
            </p>
            <input
              ref={quickSearchRef}
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleQuickSearchSubmit(); }
                if (e.key === "Escape") { e.preventDefault(); setShowQuickSearch(false); setQuickSearch(""); }
              }}
              placeholder="Ex: Jo 3:16, Gn 1:1, Sl 23"
              className="input-field w-full text-lg py-3"
              autoFocus
            />
            <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span>Enter para ir · Esc para fechar</span>
              {quickSearch && (() => {
                const parsed = parseReference(quickSearch, books);
                return parsed
                  ? <span style={{ color: "var(--color-success)" }}>{parsed.book} {parsed.chapter}{parsed.verse ? `:${parsed.verse}` : ""}</span>
                  : <span style={{ color: "var(--color-danger)" }}>Não encontrada</span>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Verse list (compact reading area) */}
      <div className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="toolbar">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              {selectedBook && selectedChapter ? `${selectedBook} ${selectedChapter}` : "Selecione um livro"}
            </span>
          </div>
          <select
            value={version}
            onChange={(e) => { setVersion(e.target.value); setSelectedBook(null); setSelectedChapter(null); setSelectedVerse(null); }}
            className="input-field text-xs py-1 px-2"
            style={{ width: "auto" }}
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.id.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Verses */}
        <div className="flex-1 overflow-y-auto">
          {selectedBook && selectedChapter && verses.length > 0 ? (
            <div className="py-2">
              {verses.map((verse) => {
                const isActive = selectedVerse === verse.verse;
                return (
                  <button
                    key={verse.verse}
                    ref={(el) => { if (el) verseRefs.current.set(verse.verse, el); }}
                    onClick={() => sendVerse(verse.verse)}
                    className="w-full text-left px-4 py-2 transition-all"
                    style={{
                      background: isActive ? "var(--color-accent-glow)" : "transparent",
                      borderLeft: isActive ? "4px solid var(--color-accent)" : "4px solid transparent",
                    }}
                  >
                    <span className="font-bold mr-1.5" style={{ color: isActive ? "var(--color-accent)" : "var(--color-accent-dim)", fontSize: "0.75rem" }}>
                      {verse.verse}
                    </span>
                    <span className="text-[0.8125rem] leading-snug" style={{ color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                      {verse.text}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface-500)" strokeWidth="1.5" className="mx-auto">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Selecione um livro à direita</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer status bar */}
        <div className="toolbar" style={{ borderBottom: "none", borderTop: "1px solid var(--color-surface-300)" }}>
          <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {selectedVerse
              ? `${selectedBook} ${selectedChapter}:${selectedVerse} — ${version.toUpperCase()}`
              : "↑↓ Navegar · Digite para busca rápida · Esc Limpar"}
          </span>
          {selectedVerse && (
            <span className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              {selectedVerse} de {verses.length}
            </span>
          )}
        </div>
      </div>

      {/* RIGHT: Books grid + Chapters + Verses (main area — Holyrics layout) */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ borderLeft: "1px solid var(--color-surface-300)" }}>
        {/* Books grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-7 gap-1">
            {books.map((book) => {
              const color = getBookColor(book.name);
              const isSelected = selectedBook === book.name;
              return (
                <button
                  key={book.abbr}
                  onClick={() => { setSelectedBook(book.name); setSelectedChapter(1); setSelectedVerse(null); }}
                  title={book.name}
                  className="rounded-lg py-2.5 px-1 text-center transition-all"
                  style={{
                    background: color,
                    opacity: isSelected ? 1 : 0.8,
                    outline: isSelected ? "2px solid #fff" : "none",
                    outlineOffset: "1px",
                    boxShadow: isSelected ? "0 0 8px rgba(255,255,255,0.2)" : "none",
                  }}
                >
                  <div className="text-sm font-extrabold text-white leading-none">{book.abbr}</div>
                  <div className="text-[8px] text-white/50 leading-tight mt-1 truncate">{book.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chapters grid */}
        {selectedBook && currentBook && (
          <div className="p-2 overflow-y-auto" style={{ borderTop: "1px solid var(--color-surface-300)", maxHeight: "160px" }}>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => {
                const isActive = selectedChapter === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => { setSelectedChapter(ch); setSelectedVerse(null); }}
                    className="rounded-md py-2 text-sm font-semibold transition-all text-center"
                    style={{
                      background: isActive ? "var(--color-accent)" : "var(--color-surface-300)",
                      color: isActive ? "var(--color-surface-50)" : "var(--color-text-secondary)",
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Verse numbers grid */}
        {selectedChapter && verses.length > 0 && (
          <div className="p-2 overflow-y-auto" style={{ borderTop: "1px solid var(--color-surface-300)", maxHeight: "160px" }}>
            <div className="grid grid-cols-7 gap-1">
              {verses.map((v) => {
                const isActive = selectedVerse === v.verse;
                return (
                  <button
                    key={v.verse}
                    onClick={() => sendVerse(v.verse)}
                    className="rounded-md py-2 text-sm font-semibold transition-all text-center"
                    style={{
                      background: isActive ? "var(--color-accent)" : "var(--color-surface-300)",
                      color: isActive ? "var(--color-surface-50)" : "var(--color-text-secondary)",
                    }}
                  >
                    {v.verse}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
