import { Hono } from "hono";
import type { LyricsSearchService } from "../services/lyrics-search";

export function searchRoutes(service: LyricsSearchService): Hono {
  const app = new Hono();

  app.get("/lyrics", async (c) => {
    const q = c.req.query("q") ?? "";
    if (!q) return c.json([]);
    return c.json(await service.search(q));
  });

  app.get("/lyrics/text", async (c) => {
    const artist = c.req.query("artist") ?? "";
    const title = c.req.query("title") ?? "";
    if (!artist || !title) return c.json({ error: "artist and title required" }, 400);
    const text = await service.getLyrics(artist, title);
    return c.json({ text });
  });

  return app;
}
