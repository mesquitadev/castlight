import { Hono } from "hono";
import type { OBSService } from "../services/obs";

export function obsRoutes(service: OBSService): Hono {
  const app = new Hono();
  app.get("/status", (c) => c.json(service.status));
  app.post("/connect", async (c) => {
    const { host, port, password } = await c.req.json();
    try { await service.connect(host, port, password); return c.json({ ok: true }); }
    catch (err: any) { return c.json({ error: err.message }, 500); }
  });
  app.post("/disconnect", async (c) => { await service.disconnect(); return c.json({ ok: true }); });
  app.get("/scenes", async (c) => c.json(await service.getScenes()));
  app.post("/scene", async (c) => { const { sceneName } = await c.req.json(); await service.setScene(sceneName); return c.json({ ok: true }); });
  app.post("/record/start", async (c) => { await service.startRecording(); return c.json({ ok: true }); });
  app.post("/record/stop", async (c) => { await service.stopRecording(); return c.json({ ok: true }); });
  return app;
}
