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
  const handleAssignRole = async (role: ScreenRole) => {
    await assignRole(screen.id, role);
  };

  return (
    <li className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[0.9375rem]" style={{ color: "var(--color-text-primary)" }}>{screen.name || "Dispositivo sem nome"}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {screen.resolution.width}x{screen.resolution.height} — {screen.userAgent.slice(0, 40)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => identifyScreen(screen.id)}
            className="btn btn-ghost btn-sm"
            aria-label="Identificar tela"
          >
            Identificar
          </button>
          {screen.role && (
            <span className="badge badge-accent">
              {ROLE_OPTIONS.find((r) => r.value === screen.role)?.label}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleAssignRole(opt.value)}
            className={`btn btn-sm ${
              screen.role === opt.value ? "btn-primary" : "btn-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </li>
  );
}

export function Screens() {
  const screens = useSelector((s: RootState) => s.screens.connected);
  const dispatch = useDispatch();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 className="page-title">Telas Conectadas</h2>
          <p className="page-subtitle">Gerencie dispositivos na rede</p>
        </div>
        <button
          onClick={() => dispatch(toggleQRDialog())}
          className="btn btn-secondary"
        >
          QR Code
        </button>
      </div>

      {screens.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <p className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>Nenhuma tela conectada</p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Dispositivos na rede podem acessar{" "}
            <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
              http://localhost:{SIDECAR_PORT}
            </span>{" "}
            para se conectar.
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
