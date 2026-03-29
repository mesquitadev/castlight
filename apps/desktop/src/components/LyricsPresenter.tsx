import { useDispatch } from "react-redux";
import { presentLyrics, clearPresentation } from "../store/slices/presentation";
import type { Song } from "@castlight/shared";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

interface Props {
  song: Song;
  onClose: () => void;
}

export function LyricsPresenter({ song, onClose }: Props) {
  const dispatch = useDispatch();

  const sendSection = (index: number) => {
    const section = song.sections[index];
    const nextSection = song.sections[index + 1] ?? null;
    const data = {
      section,
      nextSection,
      song: { title: song.title, artist: song.artist, key: song.key },
    };
    dispatch(presentLyrics(data));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:lyrics",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data,
      }),
    });
  };

  const handleClear = () => {
    dispatch(clearPresentation());
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:clear",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: "blank",
      }),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>{song.title}</h3>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{song.artist} {song.key && `• Tom: ${song.key}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="btn btn-secondary">
            Limpar
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Fechar
          </button>
        </div>
      </div>
      {song.sections.map((section, i) => (
        <button
          key={section.id}
          onClick={() => sendSection(i)}
          className="card w-full text-left p-4 transition-colors"
          style={{ display: "block" }}
        >
          <span className="text-xs font-medium uppercase" style={{ color: "var(--color-accent)" }}>{section.label}</span>
          <p className="mt-1 whitespace-pre-line" style={{ color: "var(--color-text-primary)" }}>{section.text}</p>
        </button>
      ))}
    </div>
  );
}
