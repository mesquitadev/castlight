import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useConnectOBSMutation, useDisconnectOBSMutation, useGetOBSScenesQuery, useSetOBSSceneMutation, useStartRecordingMutation, useStopRecordingMutation, useGetSettingQuery, useSaveSettingMutation } from "../../store/api";
import { ContentType } from "@castlight/shared";

const CONTENT_TYPES = [
  { value: ContentType.Lyrics, label: "Letras" }, { value: ContentType.Bible, label: "Biblia" },
  { value: ContentType.Video, label: "Video" }, { value: ContentType.Notice, label: "Aviso" },
  { value: ContentType.Slide, label: "Slide" }, { value: ContentType.Image, label: "Imagem" },
];

export function OBSTab() {
  const obsStatus = useSelector((s: RootState) => s.obs.status);
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("4455");
  const [password, setPassword] = useState("");
  const [sceneMapping, setSceneMapping] = useState<Record<string, string>>({});
  const [connectOBS, { isLoading: connecting }] = useConnectOBSMutation();
  const [disconnectOBS] = useDisconnectOBSMutation();
  const { data: scenes = [] } = useGetOBSScenesQuery(undefined, { skip: !obsStatus.connected });
  const [setScene] = useSetOBSSceneMutation();
  const [startRecording] = useStartRecordingMutation();
  const [stopRecording] = useStopRecordingMutation();
  const { data: savedConfig } = useGetSettingQuery("obs_config");
  const [saveSetting] = useSaveSettingMutation();

  useEffect(() => {
    if (savedConfig) { setHost(savedConfig.host ?? "localhost"); setPort(String(savedConfig.port ?? 4455)); setPassword(savedConfig.password ?? ""); setSceneMapping(savedConfig.sceneMapping ?? {}); }
  }, [savedConfig]);

  const handleConnect = () => connectOBS({ host, port: parseInt(port), password });
  const handleSaveConfig = () => saveSetting({ key: "obs_config", value: { host, port: parseInt(port), password, autoConnect: true, sceneMapping } });
  const updateMapping = (ct: string, scene: string) => setSceneMapping((prev) => ({ ...prev, [ct]: scene }));

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400 uppercase">Conexao OBS</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${obsStatus.connected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{obsStatus.connected ? "Conectado" : "Desconectado"}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input type="text" placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm" />
          <input type="text" placeholder="Porta" value={port} onChange={(e) => setPort(e.target.value)} className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm" />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div className="flex gap-2">
          {obsStatus.connected ? (
            <button onClick={() => disconnectOBS()} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Desconectar</button>
          ) : (
            <button onClick={handleConnect} disabled={connecting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">{connecting ? "Conectando..." : "Conectar"}</button>
          )}
          <button onClick={handleSaveConfig} className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">Salvar Config</button>
        </div>
      </div>
      {obsStatus.connected && (
        <>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase">Controles</h3>
            <div className="flex items-center gap-3">
              <span className="text-white text-sm">Cena: {obsStatus.currentScene ?? "—"}</span>
              <select onChange={(e) => setScene(e.target.value)} value={obsStatus.currentScene ?? ""} className="bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-white text-sm">
                {scenes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              {obsStatus.recording ? (
                <button onClick={() => stopRecording()} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">Parar Gravacao</button>
              ) : (
                <button onClick={() => startRecording()} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Iniciar Gravacao</button>
              )}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-zinc-400 uppercase">Mapeamento de Cenas</h3>
            <p className="text-zinc-500 text-xs">Associe cada tipo de conteudo a uma cena do OBS</p>
            {CONTENT_TYPES.map((ct) => (
              <div key={ct.value} className="flex items-center gap-3">
                <span className="text-white text-sm w-24">{ct.label}</span>
                <select value={sceneMapping[ct.value] ?? ""} onChange={(e) => updateMapping(ct.value, e.target.value)} className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-white text-sm">
                  <option value="">Nenhuma</option>
                  {scenes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
            <button onClick={handleSaveConfig} className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">Salvar Mapeamento</button>
          </div>
        </>
      )}
    </div>
  );
}
