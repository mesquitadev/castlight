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
