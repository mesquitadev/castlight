# Castlight Phase 3 — OBS Integration, Streaming, Audio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OBS WebSocket integration (scene switching, recording), a stream-optimized screen output with lower thirds, and hybrid audio (stream screen plays video audio for OBS capture).

**Architecture:** New OBS service in the sidecar connects to OBS via `obs-websocket-js`, auto-detecting on localhost:4455 with manual fallback. Stream config and OBS config stored in existing `settings` table. Desktop gets a new Settings page. The `/stream` client screen plays video with audio enabled for OBS Browser Source capture.

**Tech Stack:** Existing stack + `obs-websocket-js` v5

---

## File Structure

```
packages/shared/src/
├── types/
│   ├── obs.ts                        # NEW: OBSConfig, OBSStatus, StreamConfig, LowerThirdData
│   └── events.ts                     # Modify: add stream/obs events
└── index.ts                          # Modify: re-export obs types

apps/sidecar/src/
├── services/
│   ├── obs.ts                        # NEW: OBSService — connect, scenes, record, scene switch
│   └── settings.ts                   # NEW: SettingsService — generic key-value get/set
├── routes/
│   ├── obs.ts                        # NEW: /api/obs routes
│   └── settings.ts                   # NEW: /api/settings routes
├── server.ts                         # Modify: register new routes + services
└── __tests__/
    └── services/
        └── settings.test.ts          # NEW

apps/desktop/src/
├── store/
│   ├── api.ts                        # Modify: add OBS + settings endpoints
│   └── slices/
│       ├── obs.ts                    # NEW: OBS connection state
│       └── ui.ts                     # Modify: add "settings" panel
├── pages/
│   ├── Settings.tsx                  # NEW: Settings page with OBS + Stream tabs
│   └── Dashboard.tsx                 # Modify: add OBS status card
├── components/
│   ├── settings/
│   │   ├── OBSTab.tsx               # NEW: OBS connection + scene mapping + controls
│   │   └── StreamTab.tsx            # NEW: Stream config (elements, lower third)
│   ├── Sidebar.tsx                   # Modify: add Settings nav item
│   └── OBSStatusCard.tsx            # NEW: Dashboard OBS indicator
└── App.tsx                           # Modify: add Settings page
```

---

### Task 1: Shared Types — OBS, Stream, Lower Thirds

**Files:**
- Create: `packages/shared/src/types/obs.ts`
- Modify: `packages/shared/src/types/events.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create OBS types**

```typescript
// packages/shared/src/types/obs.ts
export interface OBSConfig {
  host: string;
  port: number;
  password: string;
  autoConnect: boolean;
  sceneMapping: Record<string, string>;
}

export interface OBSStatus {
  connected: boolean;
  currentScene: string | null;
  recording: boolean;
  streaming: boolean;
}

export interface StreamConfig {
  showLyrics: boolean;
  showBible: boolean;
  showLowerThird: boolean;
  showLogo: boolean;
  lowerThirdColor: string;
  lowerThirdPosition: "bottom" | "top";
}

export interface LowerThirdData {
  text: string;
  subtext: string;
  visible: boolean;
}
```

- [ ] **Step 2: Add new events to events.ts**

Add import at top of `packages/shared/src/types/events.ts`:

```typescript
import type { StreamConfig, LowerThirdData, OBSStatus } from "./obs";
```

Add to `ServerToClientEvents`:

```typescript
  "stream:config": (config: StreamConfig) => void;
  "stream:lower-third": (data: LowerThirdData) => void;
  "obs:status": (status: OBSStatus) => void;
```

- [ ] **Step 3: Update index.ts**

Add to `packages/shared/src/index.ts`:

```typescript
export type * from "./types/obs";
```

- [ ] **Step 4: Verify**

Run: `cd packages/shared && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add OBS, stream config, and lower third types"
```

---

### Task 2: Sidecar — Settings Service

**Files:**
- Create: `apps/sidecar/src/services/settings.ts`
- Create: `apps/sidecar/src/__tests__/services/settings.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/services/settings.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { SettingsService } from "../../services/settings";

describe("SettingsService", () => {
  let db: Database;
  let service: SettingsService;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    service = new SettingsService(db);
  });

  afterEach(() => { db.close(); });

  it("sets and gets a string value", () => {
    service.set("theme", "dark");
    expect(service.get("theme")).toBe("dark");
  });

  it("returns null for non-existent key", () => {
    expect(service.get("nonexistent")).toBeNull();
  });

  it("sets and gets a JSON value", () => {
    const config = { host: "localhost", port: 4455 };
    service.setJSON("obs_config", config);
    expect(service.getJSON("obs_config")).toEqual(config);
  });

  it("overwrites existing value", () => {
    service.set("key", "old");
    service.set("key", "new");
    expect(service.get("key")).toBe("new");
  });

  it("returns default for missing JSON key", () => {
    const def = { host: "localhost", port: 4455 };
    expect(service.getJSON("missing", def)).toEqual(def);
  });
});
```

- [ ] **Step 2: Implement SettingsService**

```typescript
// apps/sidecar/src/services/settings.ts
import type { Database } from "bun:sqlite";

export class SettingsService {
  constructor(private db: Database) {}

  get(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | null;
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(key, value);
  }

  getJSON<T>(key: string, defaultValue?: T): T | null {
    const raw = this.get(key);
    if (raw === null) return defaultValue ?? null;
    return JSON.parse(raw) as T;
  }

  setJSON<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  }
}
```

- [ ] **Step 3: Run tests**

Run: `cd apps/sidecar && bun test src/__tests__/services/settings.test.ts`
Expected: All 5 pass.

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/src/services/settings.ts apps/sidecar/src/__tests__/services/settings.test.ts
git commit -m "feat(sidecar): add settings service with key-value and JSON storage"
```

---

### Task 3: Sidecar — OBS Service

**Files:**
- Create: `apps/sidecar/src/services/obs.ts`

- [ ] **Step 1: Install obs-websocket-js**

Run: `cd apps/sidecar && pnpm add obs-websocket-js`

- [ ] **Step 2: Implement OBSService**

```typescript
// apps/sidecar/src/services/obs.ts
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

  get status(): OBSStatus {
    return { ...this._status };
  }

  setStatusCallback(cb: (status: OBSStatus) => void): void {
    this.onStatusChange = cb;
  }

  getConfig(): OBSConfig {
    return this.settings.getJSON<OBSConfig>("obs_config", DEFAULT_CONFIG) ?? DEFAULT_CONFIG;
  }

  saveConfig(config: OBSConfig): void {
    this.settings.setJSON("obs_config", config);
  }

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

      this.obs.on("CurrentProgramSceneChanged", (data) => {
        this._status.currentScene = data.sceneName;
        this.emitStatus();
      });

      this.obs.on("RecordStateChanged", (data) => {
        this._status.recording = data.outputActive;
        this.emitStatus();
      });

      this.obs.on("ConnectionClosed", () => {
        this._status = { connected: false, currentScene: null, recording: false, streaming: false };
        this.emitStatus();
      });

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

  async startRecording(): Promise<void> {
    if (!this._status.connected) return;
    await this.obs.call("StartRecord");
  }

  async stopRecording(): Promise<void> {
    if (!this._status.connected) return;
    await this.obs.call("StopRecord");
  }

  async switchSceneForContent(contentType: string): Promise<void> {
    const config = this.getConfig();
    const sceneName = config.sceneMapping[contentType];
    if (sceneName && this._status.connected) {
      await this.setScene(sceneName);
    }
  }

  async tryAutoConnect(): Promise<void> {
    const config = this.getConfig();
    if (!config.autoConnect) return;
    try {
      await this.connect();
    } catch {
      // Auto-connect failed silently — user can connect manually
    }
  }

  private emitStatus(): void {
    this.onStatusChange?.(this.status);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/sidecar/src/services/obs.ts apps/sidecar/package.json pnpm-lock.yaml
git commit -m "feat(sidecar): add OBS service with WebSocket connection, scene switching, and recording"
```

---

### Task 4: Sidecar — OBS + Settings Routes + Wiring

**Files:**
- Create: `apps/sidecar/src/routes/obs.ts`
- Create: `apps/sidecar/src/routes/settings.ts`
- Modify: `apps/sidecar/src/server.ts`

- [ ] **Step 1: Create OBS routes**

```typescript
// apps/sidecar/src/routes/obs.ts
import { Hono } from "hono";
import type { OBSService } from "../services/obs";

export function obsRoutes(service: OBSService): Hono {
  const app = new Hono();

  app.get("/status", (c) => c.json(service.status));

  app.post("/connect", async (c) => {
    const { host, port, password } = await c.req.json();
    try {
      await service.connect(host, port, password);
      return c.json({ ok: true });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  app.post("/disconnect", async (c) => {
    await service.disconnect();
    return c.json({ ok: true });
  });

  app.get("/scenes", async (c) => {
    const scenes = await service.getScenes();
    return c.json(scenes);
  });

  app.post("/scene", async (c) => {
    const { sceneName } = await c.req.json();
    await service.setScene(sceneName);
    return c.json({ ok: true });
  });

  app.post("/record/start", async (c) => {
    await service.startRecording();
    return c.json({ ok: true });
  });

  app.post("/record/stop", async (c) => {
    await service.stopRecording();
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 2: Create settings routes**

```typescript
// apps/sidecar/src/routes/settings.ts
import { Hono } from "hono";
import type { SettingsService } from "../services/settings";

export function settingsRoutes(service: SettingsService): Hono {
  const app = new Hono();

  app.get("/:key", (c) => {
    const value = service.getJSON(c.req.param("key"));
    if (value === null) return c.json(null);
    return c.json(value);
  });

  app.put("/:key", async (c) => {
    const body = await c.req.json();
    service.setJSON(c.req.param("key"), body);
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 3: Wire into server.ts**

Read existing `apps/sidecar/src/server.ts` first. Add imports:

```typescript
import { SettingsService } from "./services/settings";
import { OBSService } from "./services/obs";
import { obsRoutes } from "./routes/obs";
import { settingsRoutes } from "./routes/settings";
```

Add services inside `createApp` after existing services:

```typescript
  const settingsService = new SettingsService(ctx.db);
  const obsService = new OBSService(settingsService);

  // Broadcast OBS status changes to all clients
  obsService.setStatusCallback((status) => {
    io.emit("obs:status", status);
  });

  // Try auto-connect to OBS
  obsService.tryAutoConnect();
```

Add routes:

```typescript
  app.route("/api/obs", obsRoutes(obsService));
  app.route("/api/settings", settingsRoutes(settingsService));
```

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/src/routes/obs.ts apps/sidecar/src/routes/settings.ts apps/sidecar/src/server.ts
git commit -m "feat(sidecar): add OBS and settings routes with auto-connect wiring"
```

---

### Task 5: Desktop — OBS Redux Slice + API Endpoints

**Files:**
- Create: `apps/desktop/src/store/slices/obs.ts`
- Modify: `apps/desktop/src/store/api.ts`
- Modify: `apps/desktop/src/store/index.ts`
- Modify: `apps/desktop/src/store/slices/ui.ts`
- Modify: `apps/desktop/src/hooks/useSocket.ts`

- [ ] **Step 1: Create OBS slice**

```typescript
// apps/desktop/src/store/slices/obs.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OBSStatus } from "@castlight/shared";

interface OBSState {
  status: OBSStatus;
}

const initialState: OBSState = {
  status: { connected: false, currentScene: null, recording: false, streaming: false },
};

export const obsSlice = createSlice({
  name: "obs",
  initialState,
  reducers: {
    setOBSStatus(state, action: PayloadAction<OBSStatus>) {
      state.status = action.payload;
    },
  },
});

export const { setOBSStatus } = obsSlice.actions;
```

- [ ] **Step 2: Add API endpoints to api.ts**

Read existing `apps/desktop/src/store/api.ts`. Add imports for `OBSConfig, OBSStatus, StreamConfig`. Add to `tagTypes`: `"OBS"`.

Add endpoints:

```typescript
    // OBS
    getOBSStatus: builder.query<OBSStatus, void>({
      query: () => "/obs/status",
      providesTags: ["OBS"],
    }),
    connectOBS: builder.mutation<void, { host?: string; port?: number; password?: string }>({
      query: (body) => ({ url: "/obs/connect", method: "POST", body }),
      invalidatesTags: ["OBS"],
    }),
    disconnectOBS: builder.mutation<void, void>({
      query: () => ({ url: "/obs/disconnect", method: "POST" }),
      invalidatesTags: ["OBS"],
    }),
    getOBSScenes: builder.query<string[], void>({
      query: () => "/obs/scenes",
    }),
    setOBSScene: builder.mutation<void, string>({
      query: (sceneName) => ({ url: "/obs/scene", method: "POST", body: { sceneName } }),
    }),
    startRecording: builder.mutation<void, void>({
      query: () => ({ url: "/obs/record/start", method: "POST" }),
    }),
    stopRecording: builder.mutation<void, void>({
      query: () => ({ url: "/obs/record/stop", method: "POST" }),
    }),
    // Settings
    getSetting: builder.query<any, string>({
      query: (key) => `/settings/${key}`,
    }),
    saveSetting: builder.mutation<void, { key: string; value: any }>({
      query: ({ key, value }) => ({ url: `/settings/${key}`, method: "PUT", body: value }),
    }),
```

Export the hooks.

- [ ] **Step 3: Register OBS slice in store**

Add import and reducer to `apps/desktop/src/store/index.ts`:

```typescript
import { obsSlice } from "./slices/obs";
```

Add `obs: obsSlice.reducer` to the reducer object.

- [ ] **Step 4: Add "settings" to UI slice**

In `apps/desktop/src/store/slices/ui.ts`, update:

```typescript
type ActivePanel = "lyrics" | "bible" | "media" | "screens" | "settings" | "dashboard";
```

- [ ] **Step 5: Listen for OBS status in useSocket.ts**

Read existing `apps/desktop/src/hooks/useSocket.ts`. Add import:

```typescript
import { setOBSStatus } from "../store/slices/obs";
```

Add listener after `screens:updated`:

```typescript
    socket.on("obs:status", (status) => {
      dispatch(setOBSStatus(status));
    });
```

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/store/ apps/desktop/src/hooks/
git commit -m "feat(desktop): add OBS Redux slice, API endpoints, and WebSocket status listener"
```

---

### Task 6: Desktop — Settings Page + OBS/Stream Tabs

**Files:**
- Create: `apps/desktop/src/pages/Settings.tsx`
- Create: `apps/desktop/src/components/settings/OBSTab.tsx`
- Create: `apps/desktop/src/components/settings/StreamTab.tsx`
- Create: `apps/desktop/src/components/OBSStatusCard.tsx`
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create Settings page**

```tsx
// apps/desktop/src/pages/Settings.tsx
import { useState } from "react";
import { OBSTab } from "../components/settings/OBSTab";
import { StreamTab } from "../components/settings/StreamTab";

const TABS = [
  { id: "obs", label: "OBS" },
  { id: "stream", label: "Stream" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_COMPONENTS: Record<TabId, React.FC> = { obs: OBSTab, stream: StreamTab };

export function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>("obs");
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Configuracoes</h2>
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "text-white border-b-2 border-blue-500" : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TabContent />
    </div>
  );
}
```

- [ ] **Step 2: Create OBSTab**

```tsx
// apps/desktop/src/components/settings/OBSTab.tsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  useConnectOBSMutation,
  useDisconnectOBSMutation,
  useGetOBSScenesQuery,
  useSetOBSSceneMutation,
  useStartRecordingMutation,
  useStopRecordingMutation,
  useGetSettingQuery,
  useSaveSettingMutation,
} from "../../store/api";
import { ContentType } from "@castlight/shared";

const CONTENT_TYPES = [
  { value: ContentType.Lyrics, label: "Letras" },
  { value: ContentType.Bible, label: "Biblia" },
  { value: ContentType.Video, label: "Video" },
  { value: ContentType.Notice, label: "Aviso" },
  { value: ContentType.Slide, label: "Slide" },
  { value: ContentType.Image, label: "Imagem" },
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
    if (savedConfig) {
      setHost(savedConfig.host ?? "localhost");
      setPort(String(savedConfig.port ?? 4455));
      setPassword(savedConfig.password ?? "");
      setSceneMapping(savedConfig.sceneMapping ?? {});
    }
  }, [savedConfig]);

  const handleConnect = async () => {
    await connectOBS({ host, port: parseInt(port), password });
  };

  const handleSaveConfig = () => {
    saveSetting({
      key: "obs_config",
      value: { host, port: parseInt(port), password, autoConnect: true, sceneMapping },
    });
  };

  const updateMapping = (contentType: string, sceneName: string) => {
    setSceneMapping((prev) => ({ ...prev, [contentType]: sceneName }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400 uppercase">Conexao OBS</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${obsStatus.connected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
            {obsStatus.connected ? "Conectado" : "Desconectado"}
          </span>
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
            <button onClick={handleConnect} disabled={connecting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
              {connecting ? "Conectando..." : "Conectar"}
            </button>
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
                <select
                  value={sceneMapping[ct.value] ?? ""}
                  onChange={(e) => updateMapping(ct.value, e.target.value)}
                  className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-white text-sm"
                >
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
```

- [ ] **Step 3: Create StreamTab**

```tsx
// apps/desktop/src/components/settings/StreamTab.tsx
import { useState, useEffect } from "react";
import { useGetSettingQuery, useSaveSettingMutation } from "../../store/api";
import type { StreamConfig } from "@castlight/shared";

const DEFAULT_CONFIG: StreamConfig = {
  showLyrics: true,
  showBible: true,
  showLowerThird: true,
  showLogo: false,
  lowerThirdColor: "#1e40af",
  lowerThirdPosition: "bottom",
};

export function StreamTab() {
  const { data: saved } = useGetSettingQuery("stream_config");
  const [saveSetting] = useSaveSettingMutation();
  const [config, setConfig] = useState<StreamConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (saved) setConfig({ ...DEFAULT_CONFIG, ...saved });
  }, [saved]);

  const update = <K extends keyof StreamConfig>(key: K, value: StreamConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSetting({ key: "stream_config", value: config });
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Elementos visiveis no stream</h3>
        {([
          ["showLyrics", "Letras"],
          ["showBible", "Versiculos"],
          ["showLowerThird", "Lower Third"],
          ["showLogo", "Logo da igreja"],
        ] as const).map(([key, label]) => (
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
```

- [ ] **Step 4: Create OBSStatusCard**

```tsx
// apps/desktop/src/components/OBSStatusCard.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../store";

export function OBSStatusCard() {
  const obs = useSelector((s: RootState) => s.obs.status);

  return (
    <div className="bg-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400 text-sm">OBS Studio</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`w-2 h-2 rounded-full ${obs.connected ? "bg-green-500" : "bg-red-500"}`} />
        <p className="text-white text-sm">{obs.connected ? obs.currentScene ?? "Conectado" : "Desconectado"}</p>
      </div>
      {obs.connected && obs.recording && (
        <p className="text-red-400 text-xs mt-1">Gravando</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Update Sidebar — add Settings nav item**

In `apps/desktop/src/components/Sidebar.tsx`, add to NAV_ITEMS as last item:

```typescript
  { id: "settings" as const, label: "Config", icon: "⚙️" },
```

- [ ] **Step 6: Update App.tsx — add Settings page**

Add import:
```typescript
import { Settings } from "./pages/Settings";
```

Add to PAGES:
```typescript
  settings: Settings,
```

- [ ] **Step 7: Update Dashboard — add OBS status card**

Read existing `apps/desktop/src/pages/Dashboard.tsx`. Add import:
```typescript
import { OBSStatusCard } from "../components/OBSStatusCard";
```

Add `<OBSStatusCard />` as a third card in the grid (inside the `grid grid-cols-3` div).

- [ ] **Step 8: Commit**

```bash
git add apps/desktop/src/
git commit -m "feat(desktop): add Settings page with OBS connection, scene mapping, stream config, and dashboard status"
```

---

### Task 7: Integration Verification

- [ ] **Step 1: Run all sidecar tests**

Run: `cd apps/sidecar && bun test`
Expected: All tests pass.

- [ ] **Step 2: Start sidecar and test settings API**

```bash
curl -X PUT http://localhost:3100/api/settings/obs_config -H "Content-Type: application/json" -d '{"host":"localhost","port":4455,"password":"","autoConnect":true,"sceneMapping":{}}'
curl http://localhost:3100/api/settings/obs_config
curl http://localhost:3100/api/obs/status
```

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "chore: verify Phase 3 full stack integration"
git push
```
