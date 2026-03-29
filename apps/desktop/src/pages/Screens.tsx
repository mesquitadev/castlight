import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { ScreenRole } from "@castlight/shared";

const ROLE_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: ScreenRole.Public, label: "Publico" },
  { value: ScreenRole.Stage, label: "Retorno" },
  { value: ScreenRole.Stream, label: "Stream" },
  { value: ScreenRole.Monitor, label: "Monitor" },
  { value: ScreenRole.Bible, label: "Biblia" },
  { value: ScreenRole.Tech, label: "Tecnica" },
];

export function Screens() {
  const screens = useSelector((s: RootState) => s.screens.connected);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Telas Conectadas</h2>
      {screens.length === 0 && (
        <p className="text-zinc-500">Nenhuma tela conectada. Dispositivos na rede podem acessar o Castlight automaticamente.</p>
      )}
      <ul className="space-y-3">
        {screens.map((screen) => (
          <li key={screen.id} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{screen.name || screen.userAgent.slice(0, 30)}</p>
              <p className="text-zinc-500 text-xs">{screen.resolution.width}x{screen.resolution.height}</p>
            </div>
            <select
              value={screen.role ?? ""}
              onChange={() => {}}
              className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
