import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { toggleQRDialog } from "../store/slices/ui";
import { ScreenRole, SIDECAR_PORT } from "@castlight/shared";
import type { ScreenInfo } from "@castlight/shared";
import { QRCodeDialog } from "../components/QRCodeDialog";

const ROLE_OPTIONS = [
  { value: ScreenRole.Public, label: "Publico" },
  { value: ScreenRole.Stage, label: "Retorno" },
  { value: ScreenRole.Stream, label: "Stream" },
  { value: ScreenRole.Monitor, label: "Monitor" },
  { value: ScreenRole.Bible, label: "Biblia" },
  { value: ScreenRole.Tech, label: "Tecnica" },
];

async function assignRole(socketId: string, role: ScreenRole) {
  await fetch(`http://localhost:${SIDECAR_PORT}/api/screens/${socketId}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

async function identifyScreen(socketId: string) {
  await fetch(`http://localhost:${SIDECAR_PORT}/api/screens/${socketId}/identify`, {
    method: "POST",
  });
}

function ScreenCard({ screen }: { screen: ScreenInfo }) {
  const [adopted, setAdopted] = useState(screen.role !== null);
  const [selectedRole, setSelectedRole] = useState<ScreenRole | null>(screen.role);

  const handleAdopt = () => {
    setAdopted(true);
  };

  const handleAssignRole = async (role: ScreenRole) => {
    setSelectedRole(role);
    await assignRole(screen.id, role);
  };

  return (
    <li className="bg-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{screen.name || "Dispositivo sem nome"}</p>
          <p className="text-zinc-500 text-xs">
            {screen.resolution.width}x{screen.resolution.height} — {screen.userAgent.slice(0, 40)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => identifyScreen(screen.id)}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Identificar
          </button>
          {selectedRole && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}
            </span>
          )}
        </div>
      </div>

      {!adopted ? (
        <button
          onClick={handleAdopt}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
        >
          Adotar esta tela
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-zinc-400 text-xs uppercase">Selecione o papel:</p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAssignRole(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRole === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export function Screens() {
  const screens = useSelector((s: RootState) => s.screens.connected);
  const dispatch = useDispatch();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Telas Conectadas</h2>
        <button
          onClick={() => dispatch(toggleQRDialog())}
          className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600"
        >
          QR Code
        </button>
      </div>

      {screens.length === 0 ? (
        <div className="bg-zinc-800 rounded-xl p-8 text-center space-y-3">
          <p className="text-zinc-400 text-lg">Nenhuma tela conectada</p>
          <p className="text-zinc-500 text-sm">
            Dispositivos na rede podem acessar <span className="text-blue-400 font-mono">http://localhost:{SIDECAR_PORT}</span> para se conectar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {screens.map((screen) => (
            <ScreenCard key={screen.id} screen={screen} />
          ))}
        </ul>
      )}

      <QRCodeDialog />
    </div>
  );
}
