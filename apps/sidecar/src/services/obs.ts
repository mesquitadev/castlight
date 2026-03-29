import OBSWebSocket from "obs-websocket-js";
import type { OBSConfig, OBSStatus } from "@castlight/shared";
import type { SettingsService } from "./settings";

const DEFAULT_CONFIG: OBSConfig = {
  host: "localhost",
  port: 4455,
  password: "",
  autoConnect: true,
  sceneMapping: {},
};

export class OBSService {
  private obs = new OBSWebSocket();
  private _status: OBSStatus = { connected: false, currentScene: null, recording: false, streaming: false };
  private onStatusChange?: (status: OBSStatus) => void;

  constructor(private settings: SettingsService) {}

  get status(): OBSStatus { return { ...this._status }; }

  setStatusCallback(cb: (status: OBSStatus) => void): void { this.onStatusChange = cb; }

  getConfig(): OBSConfig {
    return this.settings.getJSON<OBSConfig>("obs_config", DEFAULT_CONFIG) ?? DEFAULT_CONFIG;
  }

  saveConfig(config: OBSConfig): void { this.settings.setJSON("obs_config", config); }

  async connect(host?: string, port?: number, password?: string): Promise<void> {
    const config = this.getConfig();
    const h = host ?? config.host;
    const p = port ?? config.port;
    const pw = password ?? config.password;
    try {
      await this.obs.connect(`ws://${h}:${p}`, pw || undefined);
      this._status.connected = true;
      const sceneResp = await this.obs.call("GetCurrentProgramScene");
      this._status.currentScene = sceneResp.sceneName ?? null;
      const recordResp = await this.obs.call("GetRecordStatus");
      this._status.recording = recordResp.outputActive ?? false;
      this.obs.on("CurrentProgramSceneChanged", (data) => { this._status.currentScene = data.sceneName; this.emitStatus(); });
      this.obs.on("RecordStateChanged", (data) => { this._status.recording = data.outputActive; this.emitStatus(); });
      this.obs.on("ConnectionClosed", () => { this._status = { connected: false, currentScene: null, recording: false, streaming: false }; this.emitStatus(); });
      this.emitStatus();
    } catch (err) {
      this._status.connected = false;
      this.emitStatus();
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    await this.obs.disconnect();
    this._status = { connected: false, currentScene: null, recording: false, streaming: false };
    this.emitStatus();
  }

  async getScenes(): Promise<string[]> {
    if (!this._status.connected) return [];
    const resp = await this.obs.call("GetSceneList");
    return (resp.scenes as any[]).map((s) => s.sceneName).reverse();
  }

  async setScene(sceneName: string): Promise<void> {
    if (!this._status.connected) return;
    await this.obs.call("SetCurrentProgramScene", { sceneName });
  }

  async startRecording(): Promise<void> { if (this._status.connected) await this.obs.call("StartRecord"); }
  async stopRecording(): Promise<void> { if (this._status.connected) await this.obs.call("StopRecord"); }

  async switchSceneForContent(contentType: string): Promise<void> {
    const config = this.getConfig();
    const sceneName = config.sceneMapping[contentType];
    if (sceneName && this._status.connected) await this.setScene(sceneName);
  }

  async tryAutoConnect(): Promise<void> {
    const config = this.getConfig();
    if (!config.autoConnect) return;
    try { await this.connect(); } catch { /* silent */ }
  }

  private emitStatus(): void { this.onStatusChange?.(this.status); }
}
