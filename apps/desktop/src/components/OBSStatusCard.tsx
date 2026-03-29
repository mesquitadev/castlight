import { useSelector } from "react-redux";
import type { RootState } from "../store";

export function OBSStatusCard() {
  const obs = useSelector((s: RootState) => s.obs.status);
  return (
    <div className="bg-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-sm">OBS Studio</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`w-2 h-2 rounded-full ${obs.connected ? "bg-green-500" : "bg-red-500"}`} />
        <p className="text-white text-sm">{obs.connected ? obs.currentScene ?? "Conectado" : "Desconectado"}</p>
      </div>
      {obs.connected && obs.recording && <p className="text-red-400 text-xs mt-1">Gravando</p>}
    </div>
  );
}
