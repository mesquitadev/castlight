import { useState, useEffect } from "react";
import { useGetSettingQuery, useSaveSettingMutation } from "../../store/api";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { ProjectionArea } from "@castlight/shared";

const PRESETS = [
  { label: "Desativado", width: 0, height: 0, enabled: false },
  { label: "Full HD (1920x1080)", width: 1920, height: 1080, enabled: true },
  { label: "HD (1280x720)", width: 1280, height: 720, enabled: true },
  { label: "4K (3840x2160)", width: 3840, height: 2160, enabled: true },
  { label: "Widescreen (1920x800)", width: 1920, height: 800, enabled: true },
  { label: "Quadrado (1080x1080)", width: 1080, height: 1080, enabled: true },
  { label: "4:3 (1024x768)", width: 1024, height: 768, enabled: true },
  { label: "Personalizado", width: -1, height: -1, enabled: true },
];

function broadcastProjectionArea(area: ProjectionArea) {
  fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "projection:area",
      roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
      data: area,
    }),
  });
}

export function ProjectionTab() {
  const { data: saved } = useGetSettingQuery("projection_area");
  const [saveSetting] = useSaveSettingMutation();
  const [area, setArea] = useState<ProjectionArea>({ width: 1920, height: 1080, enabled: false });
  const [preset, setPreset] = useState("Desativado");

  useEffect(() => {
    if (saved) {
      const s = saved as ProjectionArea;
      setArea(s);
      if (!s.enabled) {
        setPreset("Desativado");
      } else {
        const match = PRESETS.find((p) => p.width === s.width && p.height === s.height && p.enabled);
        setPreset(match ? match.label : "Personalizado");
      }
    }
  }, [saved]);

  const handlePreset = (p: typeof PRESETS[number]) => {
    setPreset(p.label);
    if (!p.enabled) {
      const newArea = { width: 0, height: 0, enabled: false };
      setArea(newArea);
      saveSetting({ key: "projection_area", value: newArea });
      broadcastProjectionArea(newArea);
    } else if (p.width > 0) {
      const newArea = { width: p.width, height: p.height, enabled: true };
      setArea(newArea);
      saveSetting({ key: "projection_area", value: newArea });
      broadcastProjectionArea(newArea);
    }
  };

  const handleCustomApply = () => {
    if (area.width > 0 && area.height > 0) {
      const newArea = { ...area, enabled: true };
      setArea(newArea);
      saveSetting({ key: "projection_area", value: newArea });
      broadcastProjectionArea(newArea);
    }
  };

  // Aspect ratio display
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const ratio = area.width > 0 && area.height > 0
    ? `${area.width / gcd(area.width, area.height)}:${area.height / gcd(area.width, area.height)}`
    : "—";

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Area de projecao</h3>
        <p className="text-zinc-500 text-xs">
          Define o tamanho da area de apresentacao. Util quando o projetor tem resolucao diferente da area visivel da tela.
        </p>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                preset === p.label
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom dimensions */}
        {preset === "Personalizado" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-zinc-400 text-xs">Largura:</label>
              <input
                type="number"
                value={area.width || ""}
                onChange={(e) => setArea({ ...area, width: parseInt(e.target.value) || 0 })}
                className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm"
                placeholder="1920"
              />
            </div>
            <span className="text-zinc-500">x</span>
            <div className="flex items-center gap-2">
              <label className="text-zinc-400 text-xs">Altura:</label>
              <input
                type="number"
                value={area.height || ""}
                onChange={(e) => setArea({ ...area, height: parseInt(e.target.value) || 0 })}
                className="w-24 bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm"
                placeholder="1080"
              />
            </div>
            <button
              onClick={handleCustomApply}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
            >
              Aplicar
            </button>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-4 text-xs">
          <span className={`px-2 py-1 rounded ${area.enabled ? "bg-green-900/50 text-green-300" : "bg-zinc-700 text-zinc-400"}`}>
            {area.enabled ? `${area.width}x${area.height} (${ratio})` : "Usando tela inteira"}
          </span>
        </div>

        {/* Preview */}
        {area.enabled && (
          <div className="flex items-center justify-center">
            <div
              className="border-2 border-dashed border-zinc-600 rounded flex items-center justify-center"
              style={{
                width: Math.min(300, 300 * (area.width / Math.max(area.width, area.height))),
                height: Math.min(300, 300 * (area.height / Math.max(area.width, area.height))),
              }}
            >
              <span className="text-zinc-500 text-xs">{area.width} x {area.height}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
