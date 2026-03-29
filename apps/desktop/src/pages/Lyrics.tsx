import { useState } from "react";
import { useGetSongsQuery } from "../store/api";

export function Lyrics() {
  const [search, setSearch] = useState("");
  const { data: songs = [], isLoading } = useGetSongsQuery(search || undefined);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Letras</h2>
      </div>
      <input
        type="text"
        placeholder="Buscar musica..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <p className="text-zinc-500">Carregando...</p>}
      <ul className="space-y-2">
        {songs.map((song) => (
          <li key={song.id} className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 cursor-pointer transition-colors">
            <p className="text-white font-medium">{song.title}</p>
            <p className="text-zinc-400 text-sm">{song.artist}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
