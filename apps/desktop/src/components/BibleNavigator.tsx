import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  useGetBibleVersionsQuery,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
} from "../store/api";
import { presentBible } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

// Book categories with colors (matching Holyrics style)
const BOOK_CATEGORIES: Record<string, { color: string; bg: string }> = {
  // Pentateuco
  Genesis: { color: "#fff", bg: "#b45309" },
  Exodo: { color: "#fff", bg: "#b45309" },
  Levitico: { color: "#fff", bg: "#b45309" },
  Numeros: { color: "#fff", bg: "#b45309" },
  Deuteronomio: { color: "#fff", bg: "#b45309" },
  // Historicos
  Josue: { color: "#fff", bg: "#059669" },
  Juizes: { color: "#fff", bg: "#059669" },
  Rute: { color: "#fff", bg: "#059669" },
  "1 Samuel": { color: "#fff", bg: "#059669" },
  "2 Samuel": { color: "#fff", bg: "#059669" },
  "1 Reis": { color: "#fff", bg: "#059669" },
  "2 Reis": { color: "#fff", bg: "#dc2626" },
  "1 Cronicas": { color: "#fff", bg: "#dc2626" },
  "2 Cronicas": { color: "#fff", bg: "#dc2626" },
  Esdras: { color: "#fff", bg: "#dc2626" },
  Neemias: { color: "#fff", bg: "#dc2626" },
  Ester: { color: "#fff", bg: "#dc2626" },
  // Poeticos
  Jo: { color: "#fff", bg: "#7c3aed" },
  Salmos: { color: "#fff", bg: "#7c3aed" },
  Proverbios: { color: "#fff", bg: "#7c3aed" },
  Eclesiastes: { color: "#fff", bg: "#7c3aed" },
  Cantares: { color: "#fff", bg: "#7c3aed" },
  // Profetas Maiores
  Isaias: { color: "#fff", bg: "#2563eb" },
  Jeremias: { color: "#fff", bg: "#2563eb" },
  Lamentacoes: { color: "#fff", bg: "#2563eb" },
  Ezequiel: { color: "#fff", bg: "#2563eb" },
  Daniel: { color: "#fff", bg: "#2563eb" },
  // Profetas Menores
  Oseias: { color: "#fff", bg: "#0891b2" },
  Joel: { color: "#fff", bg: "#0891b2" },
  Amos: { color: "#fff", bg: "#0891b2" },
  Obadias: { color: "#fff", bg: "#0891b2" },
  Jonas: { color: "#fff", bg: "#0891b2" },
  Miqueias: { color: "#fff", bg: "#0891b2" },
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
  Joao: { color: "#fff", bg: "#16a34a" },
  // Historico NT
  Atos: { color: "#fff", bg: "#ea580c" },
  // Cartas Paulinas
  Romanos: { color: "#fff", bg: "#9333ea" },
  "1 Corintios": { color: "#fff", bg: "#9333ea" },
  "2 Corintios": { color: "#fff", bg: "#9333ea" },
  Galatas: { color: "#fff", bg: "#9333ea" },
  Efesios: { color: "#fff", bg: "#9333ea" },
  Filipenses: { color: "#fff", bg: "#9333ea" },
  Colossenses: { color: "#fff", bg: "#9333ea" },
  "1 Tessalonicenses": { color: "#fff", bg: "#9333ea" },
  "2 Tessalonicenses": { color: "#fff", bg: "#9333ea" },
  "1 Timoteo": { color: "#fff", bg: "#9333ea" },
  "2 Timoteo": { color: "#fff", bg: "#9333ea" },
  Tito: { color: "#fff", bg: "#9333ea" },
  Filemom: { color: "#fff", bg: "#9333ea" },
  Hebreus: { color: "#fff", bg: "#9333ea" },
  // Cartas Gerais
  Tiago: { color: "#fff", bg: "#e11d48" },
  "1 Pedro": { color: "#fff", bg: "#e11d48" },
  "2 Pedro": { color: "#fff", bg: "#e11d48" },
  "1 Joao": { color: "#fff", bg: "#e11d48" },
  "2 Joao": { color: "#fff", bg: "#e11d48" },
  "3 Joao": { color: "#fff", bg: "#e11d48" },
  Judas: { color: "#fff", bg: "#e11d48" },
  Apocalipse: { color: "#fff", bg: "#e11d48" },
};

const DEFAULT_BOOK_STYLE = { color: "#fff", bg: "#525252" };

function getBookStyle(name: string) {
  return BOOK_CATEGORIES[name] ?? DEFAULT_BOOK_STYLE;
}

export function BibleNavigator() {
  const dispatch = useDispatch();
  const [version, setVersion] = useState("acf");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  const { data: versions = [] } = useGetBibleVersionsQuery();
  const { data: books = [] } = useGetBibleBooksQuery(version);

  const currentBook = books.find((b) => b.name === selectedBook);

  const { data: verses = [] } = useGetBibleVersesQuery(
    selectedBook && selectedChapter
      ? { version, book: selectedBook, chapter: selectedChapter, verseStart: 1, verseEnd: 200 }
      : { version: "", book: "", chapter: 0, verseStart: 0 },
    { skip: !selectedBook || !selectedChapter },
  );

  const sendVerse = useCallback((verseNum: number) => {
    if (!selectedBook || !selectedChapter) return;
    const ref = { version, book: selectedBook, chapter: selectedChapter, verseStart: verseNum };
    const verseData = verses.filter((v) => v.verse === verseNum);
    if (verseData.length === 0) return;
    setSelectedVerse(verseNum);
    dispatch(presentBible({ verses: verseData, reference: ref }));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:bible",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { verses: verseData, reference: ref },
      }),
    });
  }, [selectedBook, selectedChapter, version, verses, dispatch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedBook || !selectedChapter || verses.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const current = selectedVerse ?? 0;
        const next = Math.min(current + 1, verses.length);
        sendVerse(next);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const current = selectedVerse ?? 2;
        const prev = Math.max(current - 1, 1);
        sendVerse(prev);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSelectedVerse(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVerse, selectedBook, selectedChapter, verses, sendVerse]);

  return (
    <div className="flex gap-3 h-[calc(100vh-8rem)]">
      {/* Left panel — Books grid */}
      <div className="w-80 flex-shrink-0 overflow-y-auto rounded-lg bg-zinc-900 p-2">
        <div className="flex items-center gap-2 mb-2 px-1">
          <select
            value={version}
            onChange={(e) => { setVersion(e.target.value); setSelectedBook(null); setSelectedChapter(null); setSelectedVerse(null); }}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs flex-1"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {books.map((book) => {
            const style = getBookStyle(book.name);
            const isSelected = selectedBook === book.name;
            return (
              <button
                key={book.abbr}
                onClick={() => { setSelectedBook(book.name); setSelectedChapter(1); setSelectedVerse(null); }}
                title={book.name}
                className={`rounded p-1.5 text-center transition-all text-xs font-bold leading-tight ${
                  isSelected ? "ring-2 ring-white scale-105" : "hover:brightness-110"
                }`}
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                <div>{book.abbr}</div>
                <div className="text-[9px] font-normal opacity-70 truncate">{book.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle panel — Chapters + Verses numbers */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Chapters */}
        {selectedBook && currentBook && (
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs uppercase mb-2 px-1">Capitulos — {selectedBook}</p>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => { setSelectedChapter(ch); setSelectedVerse(null); }}
                  className={`rounded p-1.5 text-xs font-medium transition-colors ${
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
          <div className="bg-zinc-900 rounded-lg p-2">
            <p className="text-zinc-500 text-xs uppercase mb-2 px-1">Versiculos — Cap. {selectedChapter}</p>
            <div className="grid grid-cols-7 gap-1">
              {verses.map((v) => (
                <button
                  key={v.verse}
                  onClick={() => sendVerse(v.verse)}
                  className={`rounded p-1.5 text-xs font-medium transition-colors ${
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

      {/* Right panel — Verse text list */}
      <div className="flex-1 overflow-y-auto bg-zinc-900 rounded-lg p-3">
        {selectedBook && selectedChapter ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">
                {selectedBook} {selectedChapter}
              </h3>
              <span className="text-zinc-500 text-xs">
                {selectedVerse ? `Versículo ${selectedVerse} selecionado` : "Clique ou use setas ↑↓ para navegar"}
              </span>
            </div>
            <div className="space-y-1">
              {verses.map((verse) => (
                <button
                  key={verse.verse}
                  onClick={() => sendVerse(verse.verse)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedVerse === verse.verse
                      ? "bg-blue-600/20 border border-blue-500"
                      : "hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-blue-400 text-xs font-bold mr-2">{verse.verse}</span>
                  <span className="text-white text-sm">{verse.text}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-zinc-500">Selecione um livro para ver os versiculos</p>
          </div>
        )}
      </div>
    </div>
  );
}
