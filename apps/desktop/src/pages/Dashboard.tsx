import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { ContentType } from "@castlight/shared";
import { OBSStatusCard } from "../components/OBSStatusCard";

export function Dashboard() {
  const presentation = useSelector((s: RootState) => s.presentation);
  const screenCount = useSelector((s: RootState) => s.screens.connected.length);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Telas conectadas</p>
          <p className="text-3xl font-bold text-white mt-1">{screenCount}</p>
        </div>
        <OBSStatusCard />
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Exibindo</p>
          <p className="text-lg font-medium text-white mt-1">
            {presentation.contentType === ContentType.Lyrics && presentation.currentSong?.title}
            {presentation.contentType === ContentType.Bible && presentation.currentReference && `${presentation.currentReference.book} ${presentation.currentReference.chapter}:${presentation.currentReference.verseStart}`}
            {presentation.contentType === ContentType.Blank && "Nada"}
            {presentation.contentType === ContentType.Black && "Tela preta"}
          </p>
        </div>
      </div>
      <div className="bg-zinc-800 rounded-xl aspect-video flex items-center justify-center">
        <p className="text-zinc-500">Preview da tela publica</p>
      </div>
    </div>
  );
}
