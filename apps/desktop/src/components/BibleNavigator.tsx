import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  useGetBibleVersionsQuery,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
} from "../store/api";
import { presentBible } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function BibleNavigator() {
  const dispatch = useDispatch();
  const [version, setVersion] = useState("acf");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const { data: versions = [] } = useGetBibleVersionsQuery();
  const { data: books = [] } = useGetBibleBooksQuery(version);

  const currentBook = books.find((b) => b.name === selectedBook);

  const { data: verses = [] } = useGetBibleVersesQuery(
    selectedBook && selectedChapter
      ? { version, book: selectedBook, chapter: selectedChapter, verseStart: 1, verseEnd: 200 }
      : { version: "", book: "", chapter: 0, verseStart: 0 },
    { skip: !selectedBook || !selectedChapter },
  );

  const sendVerse = (verseNum: number) => {
    if (!selectedBook || !selectedChapter) return;
    const ref = { version, book: selectedBook, chapter: selectedChapter, verseStart: verseNum };
    const verseData = verses.filter((v) => v.verse === verseNum);
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
  };

  if (!selectedBook) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {books.map((book) => (
            <button
              key={book.abbr}
              onClick={() => setSelectedBook(book.name)}
              className="bg-zinc-800 rounded-lg p-3 text-left hover:bg-zinc-700 transition-colors"
            >
              <p className="text-white text-sm font-medium">{book.name}</p>
              <p className="text-zinc-500 text-xs">{book.chapters} cap.</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedBook(null)} className="text-blue-400 text-sm hover:underline">
          ← Livros
        </button>
        <h3 className="text-lg font-semibold text-white">{selectedBook}</h3>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: currentBook?.chapters ?? 0 }, (_, i) => i + 1).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChapter(ch)}
              className="bg-zinc-800 rounded-lg p-3 text-white text-center hover:bg-zinc-700 transition-colors"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setSelectedChapter(null)} className="text-blue-400 text-sm hover:underline">
          ← {selectedBook}
        </button>
        <span className="text-zinc-500 text-sm">Capitulo {selectedChapter}</span>
      </div>
      <div className="space-y-1">
        {verses.map((verse) => (
          <button
            key={verse.verse}
            onClick={() => sendVerse(verse.verse)}
            className="w-full text-left p-3 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <span className="text-blue-400 text-xs font-bold mr-2">{verse.verse}</span>
            <span className="text-white">{verse.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
