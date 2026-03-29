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
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>Letras</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Gerencie e apresente letras de musicas</p>
        </div>
        <button
          onClick={() => setView("create")}
          className="btn btn-primary"
        >
          + Nova Musica
        </button>
      </div>
      <input
        type="text"
        placeholder="Buscar musica..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field w-full"
      />
      {isLoading && <p style={{ color: "var(--color-text-muted)" }}>Carregando...</p>}
      {songs.length === 0 && !isLoading && (
        <div className="card p-8 text-center space-y-3">
          <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>Nenhuma musica encontrada</p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Clique em "+ Nova Musica" para criar ou buscar online.</p>
        </div>
      )}
      <ul className="space-y-2">
        {songs.map((song) => (
          <li
            key={song.id}
            className="card p-4 flex items-center justify-between transition-colors"
            style={{ cursor: "pointer" }}
          >
            <button
              onClick={() => { setSelectedSongId(song.id); setView("present"); }}
              className="flex-1 text-left"
            >
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{song.title}</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{song.artist}{song.key ? ` • Tom: ${song.key}` : ""}</p>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSong(song.id); }}
              className="btn btn-danger text-xs ml-3"
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
