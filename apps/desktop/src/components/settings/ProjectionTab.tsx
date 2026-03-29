import { useState, useEffect, useCallback } from "react";
import { useGetSettingQuery, useSaveSettingMutation } from "../../store/api";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { ProjectionArea } from "@castlight/shared";

const DEFAULT_AREA: ProjectionArea = { enabled: false, top: 0, bottom: 0, left: 0, right: 0 };

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
  const [area, setArea] = useState<ProjectionArea>(DEFAULT_AREA);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (saved) setArea({ ...DEFAULT_AREA, ...(saved as ProjectionArea) });
  }, [saved]);

  // Broadcast changes in real-time while adjusting
  const updateAndBroadcast = useCallback((newArea: ProjectionArea) => {
    setArea(newArea);
    broadcastProjectionArea(newArea);
  }, []);

  const updateMargin = (side: "top" | "bottom" | "left" | "right", value: number) => {
    const clamped = Math.max(0, Math.min(50, value));
    updateAndBroadcast({ ...area, enabled: true, [side]: clamped });
  };

  const handleSave = () => {
    saveSetting({ key: "projection_area", value: area });
    setAdjusting(false);
  };

  const handleReset = () => {
    const reset = DEFAULT_AREA;
    setArea(reset);
    saveSetting({ key: "projection_area", value: reset });
    broadcastProjectionArea(reset);
    setAdjusting(false);
  };

  const handleStartAdjust = () => {
    setAdjusting(true);
    // Send a guide pattern to screens so user can see the area
    broadcastProjectionArea({ ...area, enabled: true });
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase">Area de projecao</h3>
            <p className="text-zinc-500 text-xs mt-1">
              Ajuste as margens pra definir a area visivel da projecao. As mudancas aparecem em tempo real nas telas.
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${area.enabled ? "bg-green-900/50 text-green-300" : "bg-zinc-700 text-zinc-400"}`}>
            {area.enabled ? "Ativo" : "Tela inteira"}
          </span>
        </div>

        {/* Visual preview with margin indicators */}
        <div className="relative bg-zinc-950 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
          {/* Margin overlays (darkened areas = cropped) */}
          {/* Top */}
          <div className="absolute top-0 left-0 right-0 bg-red-500/20 border-b border-red-500/50 transition-all" style={{ height: `${area.top}%` }}>
            {area.top > 3 && <span className="absolute inset-0 flex items-center justify-center text-red-300 text-xs">{area.top}%</span>}
          </div>
          {/* Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-red-500/20 border-t border-red-500/50 transition-all" style={{ height: `${area.bottom}%` }}>
            {area.bottom > 3 && <span className="absolute inset-0 flex items-center justify-center text-red-300 text-xs">{area.bottom}%</span>}
          </div>
          {/* Left */}
          <div className="absolute left-0 bg-red-500/20 border-r border-red-500/50 transition-all" style={{ width: `${area.left}%`, top: `${area.top}%`, bottom: `${area.bottom}%` }}>
            {area.left > 5 && <span className="absolute inset-0 flex items-center justify-center text-red-300 text-xs">{area.left}%</span>}
          </div>
          {/* Right */}
          <div className="absolute right-0 bg-red-500/20 border-l border-red-500/50 transition-all" style={{ width: `${area.right}%`, top: `${area.top}%`, bottom: `${area.bottom}%` }}>
            {area.right > 5 && <span className="absolute inset-0 flex items-center justify-center text-red-300 text-xs">{area.right}%</span>}
          </div>
          {/* Active area (green border) */}
          <div className="absolute border-2 border-green-500/50 transition-all" style={{
            top: `${area.top}%`,
            bottom: `${area.bottom}%`,
            left: `${area.left}%`,
            right: `${area.right}%`,
          }}>
            <span className="absolute inset-0 flex items-center justify-center text-green-300/50 text-sm font-medium">
              Area de projecao
            </span>
          </div>
        </div>

        {/* Margin sliders */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 text-xs">Cima</label>
              <span className="text-zinc-500 text-xs font-mono">{area.top}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={area.top}
              onChange={(e) => updateMargin("top", parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 text-xs">Baixo</label>
              <span className="text-zinc-500 text-xs font-mono">{area.bottom}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={area.bottom}
              onChange={(e) => updateMargin("bottom", parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 text-xs">Esquerda</label>
              <span className="text-zinc-500 text-xs font-mono">{area.left}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={area.left}
              onChange={(e) => updateMargin("left", parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 text-xs">Direita</label>
              <span className="text-zinc-500 text-xs font-mono">{area.right}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={area.right}
              onChange={(e) => updateMargin("right", parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Precise inputs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <label className="text-zinc-500 text-xs">C:</label>
            <input type="number" min={0} max={50} value={area.top} onChange={(e) => updateMargin("top", parseInt(e.target.value) || 0)} className="w-14 bg-zinc-700 border border-zinc-600 rounded px-1.5 py-1 text-white text-xs text-center" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-zinc-500 text-xs">B:</label>
            <input type="number" min={0} max={50} value={area.bottom} onChange={(e) => updateMargin("bottom", parseInt(e.target.value) || 0)} className="w-14 bg-zinc-700 border border-zinc-600 rounded px-1.5 py-1 text-white text-xs text-center" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-zinc-500 text-xs">E:</label>
            <input type="number" min={0} max={50} value={area.left} onChange={(e) => updateMargin("left", parseInt(e.target.value) || 0)} className="w-14 bg-zinc-700 border border-zinc-600 rounded px-1.5 py-1 text-white text-xs text-center" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-zinc-500 text-xs">D:</label>
            <input type="number" min={0} max={50} value={area.right} onChange={(e) => updateMargin("right", parseInt(e.target.value) || 0)} className="w-14 bg-zinc-700 border border-zinc-600 rounded px-1.5 py-1 text-white text-xs text-center" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
            Salvar
          </button>
          <button onClick={handleReset} className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">
            Resetar (tela inteira)
          </button>
        </div>
      </div>
    </div>
  );
}
