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
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Conexao OBS</h3>
          <span className={`badge ${obsStatus.connected ? "badge-success" : "badge-danger"}`}>
            {obsStatus.connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input type="text" placeholder="Host" value={host} onChange={(e) => setHost(e.target.value)} className="input-field" />
          <input type="text" placeholder="Porta" value={port} onChange={(e) => setPort(e.target.value)} className="input-field" />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
        </div>
        <div className="flex gap-2">
          {obsStatus.connected ? (
            <button onClick={() => disconnectOBS()} className="btn btn-danger">Desconectar</button>
          ) : (
            <button onClick={handleConnect} disabled={connecting} className="btn btn-primary disabled:opacity-50">
              {connecting ? "Conectando..." : "Conectar"}
            </button>
          )}
          <button onClick={handleSaveConfig} className="btn btn-secondary">Salvar Config</button>
        </div>
      </div>
      {obsStatus.connected && (
        <>
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Controles</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>Cena: {obsStatus.currentScene ?? "—"}</span>
              <select onChange={(e) => setScene(e.target.value)} value={obsStatus.currentScene ?? ""} className="input-field px-3 py-1.5 text-sm">
                {scenes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              {obsStatus.recording ? (
                <button onClick={() => stopRecording()} className="btn btn-danger">Parar Gravacao</button>
              ) : (
                <button onClick={() => startRecording()} className="btn btn-primary" style={{ background: "var(--color-success)" }}>Iniciar Gravacao</button>
              )}
            </div>
          </div>
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-medium uppercase" style={{ color: "var(--color-text-secondary)" }}>Mapeamento de Cenas</h3>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Associe cada tipo de conteudo a uma cena do OBS</p>
            {CONTENT_TYPES.map((ct) => (
              <div key={ct.value} className="flex items-center gap-3">
                <span className="text-sm w-24" style={{ color: "var(--color-text-primary)" }}>{ct.label}</span>
                <select value={sceneMapping[ct.value] ?? ""} onChange={(e) => updateMapping(ct.value, e.target.value)} className="input-field flex-1 px-3 py-1.5 text-sm">
                  <option value="">Nenhuma</option>
                  {scenes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
            <button onClick={handleSaveConfig} className="btn btn-secondary">Salvar Mapeamento</button>
          </div>
        </>
      )}
    </div>
  );
}
