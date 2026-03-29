import { Hono } from "hono";
import type { LyricsService } from "../services/lyrics";

export function lyricsRoutes(service: LyricsService): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    const query = c.req.query("q");
    if (query) return c.json(service.search(query));
    return c.json(service.list());
  });

  app.get("/:id", (c) => {
    const song = service.getById(c.req.param("id"));
    if (!song) return c.json({ error: "Song not found" }, 404);
    return c.json(song);
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const song = service.create(body);
    return c.json(song, 201);
  });

  app.patch("/:id", async (c) => {
    const body = await c.req.json();
    const song = service.update(c.req.param("id"), body);
    return c.json(song);
  });

  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
