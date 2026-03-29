import { useState, useEffect } from "react";
import { useGetSettingQuery, useSaveSettingMutation } from "../../store/api";
import type { StreamConfig } from "@castlight/shared";

const DEFAULT_CONFIG: StreamConfig = { showLyrics: true, showBible: true, showLowerThird: true, showLogo: false, lowerThirdColor: "#1e40af", lowerThirdPosition: "bottom" };

export function StreamTab() {
  const { data: saved } = useGetSettingQuery("stream_config");
  const [saveSetting] = useSaveSettingMutation();
  const [config, setConfig] = useState<StreamConfig>(DEFAULT_CONFIG);

  useEffect(() => { if (saved) setConfig({ ...DEFAULT_CONFIG, ...saved }); }, [saved]);

  const update = <K extends keyof StreamConfig>(key: K, value: StreamConfig[K]) => setConfig((prev) => ({ ...prev, [key]: value }));
  const handleSave = () => saveSetting({ key: "stream_config", value: config });

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Elementos visiveis no stream</h3>
        {([["showLyrics", "Letras"], ["showBible", "Versiculos"], ["showLowerThird", "Lower Third"], ["showLogo", "Logo da igreja"]] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config[key]} onChange={(e) => update(key, e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-white text-sm">{label}</span>
          </label>
        ))}
      </div>
      <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Lower Third</h3>
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">Cor:</span>
          <input type="color" value={config.lowerThirdColor} onChange={(e) => update("lowerThirdColor", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
          <span className="text-zinc-400 text-sm font-mono">{config.lowerThirdColor}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white text-sm">Posicao:</span>
          <select value={config.lowerThirdPosition} onChange={(e) => update("lowerThirdPosition", e.target.value as any)} className="bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-white text-sm">
            <option value="bottom">Inferior</option>
            <option value="top">Superior</option>
          </select>
        </div>
      </div>
      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">Salvar Configuracoes</button>
    </div>
  );
}
