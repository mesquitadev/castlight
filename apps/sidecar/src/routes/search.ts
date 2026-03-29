import { Hono } from "hono";
import type { LyricsSearchService } from "../services/lyrics-search";

export function searchRoutes(service: LyricsSearchService): Hono {
  const app = new Hono();

  app.get("/lyrics", async (c) => {
    const q = c.req.query("q") ?? "";
    if (!q) return c.json([]);
    return c.json(await service.search(q));
  });

  return app;
}
