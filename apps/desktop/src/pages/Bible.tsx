import { useState } from "react";
import { useGetBibleVersionsQuery, useGetBibleBooksQuery } from "../store/api";

export function Bible() {
  const { data: versions = [] } = useGetBibleVersionsQuery();
  const [selectedVersion, setSelectedVersion] = useState("acf");
  const { data: books = [] } = useGetBibleBooksQuery(selectedVersion);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Biblia</h2>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {books.map((book) => (
          <button key={book.abbr} className="bg-zinc-800 rounded-lg p-3 text-left hover:bg-zinc-750 transition-colors">
            <p className="text-white text-sm font-medium">{book.name}</p>
            <p className="text-zinc-500 text-xs">{book.chapters} cap.</p>
          </button>
        ))}
      </div>
    </div>
  );
}
