import { Hono } from "hono";
import type { ThemesService } from "../services/themes";

export function themesRoutes(service: ThemesService): Hono {
  const app = new Hono();

  app.get("/", (c) => c.json(service.list()));

  app.get("/default", (c) => {
    const theme = service.getDefault();
    return c.json(theme);
  });

  app.get("/:id", (c) => {
    const theme = service.getById(c.req.param("id"));
    if (!theme) return c.json({ error: "Theme not found" }, 404);
    return c.json(theme);
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    return c.json(service.create(body), 201);
  });

  app.patch("/:id", async (c) => {
    const body = await c.req.json();
    return c.json(service.update(c.req.param("id"), body));
  });

  app.post("/:id/default", (c) => {
    service.setDefault(c.req.param("id"));
    return c.json({ ok: true });
  });

  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
