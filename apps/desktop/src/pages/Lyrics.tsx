import { useState } from "react";
import { useGetSongsQuery, useGetSongQuery, useDeleteSongMutation } from "../store/api";
import { LyricsPresenter } from "../components/LyricsPresenter";
import { LyricsEditor } from "../components/LyricsEditor";

type View = "list" | "present" | "create";

export function Lyrics() {
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const { data: songs = [], isLoading } = useGetSongsQuery(search || undefined);
  const { data: selectedSong } = useGetSongQuery(selectedSongId!, { skip: !selectedSongId });
  const [deleteSong] = useDeleteSongMutation();

  if (view === "create") {
    return (
      <div className="p-6">
        <LyricsEditor
          onClose={() => setView("list")}
          onCreated={(id) => { setSelectedSongId(id); setView("present"); }}
        />
      </div>
    );
  }

  if (view === "present" && selectedSong) {
    return (
      <div className="p-6">
        <LyricsPresenter song={selectedSong} onClose={() => { setView("list"); setSelectedSongId(null); }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Letras</h2>
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500"
        >
          + Nova Musica
        </button>
      </div>
      <input
        type="text"
        placeholder="Buscar musica..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <p className="text-zinc-500">Carregando...</p>}
      {songs.length === 0 && !isLoading && (
        <div className="bg-zinc-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-zinc-400 text-lg">Nenhuma musica encontrada</p>
          <p className="text-zinc-500 text-sm">Clique em "+ Nova Musica" para criar ou buscar online.</p>
        </div>
      )}
      <ul className="space-y-2">
        {songs.map((song) => (
          <li
            key={song.id}
            className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-700 transition-colors"
          >
            <button
              onClick={() => { setSelectedSongId(song.id); setView("present"); }}
              className="flex-1 text-left"
            >
              <p className="text-white font-medium">{song.title}</p>
              <p className="text-zinc-400 text-sm">{song.artist}{song.key ? ` • Tom: ${song.key}` : ""}</p>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSong(song.id); }}
              className="text-xs text-red-400 hover:text-red-300 ml-3"
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
