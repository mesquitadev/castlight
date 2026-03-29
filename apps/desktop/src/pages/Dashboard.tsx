import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { ContentType } from "@castlight/shared";
import { OBSStatusCard } from "../components/OBSStatusCard";
import { WallpaperPicker } from "../components/WallpaperPicker";

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
            {presentation.contentType === ContentType.Slide && "Slide"}
            {presentation.contentType === ContentType.Image && "Imagem"}
            {presentation.contentType === ContentType.Video && "Video"}
            {presentation.contentType === ContentType.Notice && "Aviso"}
            {presentation.contentType === ContentType.Blank && "Papel de parede"}
            {presentation.contentType === ContentType.Black && "Tela preta"}
          </p>
        </div>
      </div>

      {/* Wallpaper picker */}
      <WallpaperPicker />
    </div>
  );
}
