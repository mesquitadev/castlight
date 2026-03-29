import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { toggleQRDialog } from "../store/slices/ui";
import { ScreenRole, SIDECAR_PORT } from "@castlight/shared";

const ROLE_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: ScreenRole.Public, label: "Publico" },
  { value: ScreenRole.Stage, label: "Retorno" },
  { value: ScreenRole.Stream, label: "Stream" },
  { value: ScreenRole.Monitor, label: "Monitor" },
  { value: ScreenRole.Bible, label: "Biblia" },
  { value: ScreenRole.Tech, label: "Tecnica" },
];

export function ScreenList() {
  const screens = useSelector((s: RootState) => s.screens.connected);
  const dispatch = useDispatch();

  const assignRole = async (socketId: string, role: string) => {
    await fetch(`http://localhost:${SIDECAR_PORT}/api/screens/${socketId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  };

  const identify = async (socketId: string) => {
    await fetch(`http://localhost:${SIDECAR_PORT}/api/screens/${socketId}/identify`, { method: "POST" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Telas ({screens.length})</h3>
        <button onClick={() => dispatch(toggleQRDialog())} className="text-xs text-blue-400 hover:underline">
          QR Code
        </button>
      </div>
      {screens.map((screen) => (
        <div key={screen.id} className="bg-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm">{screen.name || "Sem nome"}</p>
            <button onClick={() => identify(screen.id)} className="text-xs text-zinc-500 hover:text-white">
              Identificar
            </button>
          </div>
          <p className="text-zinc-500 text-xs">{screen.resolution.width}x{screen.resolution.height}</p>
          <select
            value={screen.role ?? ""}
            onChange={(e) => assignRole(screen.id, e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
