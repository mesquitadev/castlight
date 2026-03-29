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
    const url = c.req.query("url") ?? "";
    if (!url) return c.json({ error: "url required" }, 400);
    const text = await service.getLyrics(url);
    return c.json({ text });
  });

  return app;
}
