import { Hono } from "hono";
import type { BibleService } from "../services/bible";

export function bibleRoutes(service: BibleService): Hono {
  const app = new Hono();

  // Installed versions (for use)
  app.get("/versions", (c) => c.json(service.getVersions()));

  // All available versions (installed + downloadable)
  app.get("/available", (c) => c.json(service.getAvailableVersions()));

  // Download a version from GitHub
  app.post("/download/:versionId", async (c) => {
    const versionId = c.req.param("versionId");
    try {
      await service.downloadVersion(versionId);
      return c.json({ ok: true, message: `${versionId.toUpperCase()} baixada com sucesso` });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // Remove an installed version
  app.delete("/versions/:versionId", (c) => {
    service.removeVersion(c.req.param("versionId"));
    return c.json({ ok: true });
  });

  app.get("/versions/:versionId/books", (c) => c.json(service.getBooks(c.req.param("versionId"))));

  app.get("/verses", (c) => {
    const version = c.req.query("version") ?? "acf";
    const book = c.req.query("book") ?? "";
    const chapter = parseInt(c.req.query("chapter") ?? "1", 10);
    const verseStart = parseInt(c.req.query("verseStart") ?? "1", 10);
    const verseEnd = c.req.query("verseEnd") ? parseInt(c.req.query("verseEnd")!, 10) : undefined;
    return c.json(service.getVerses({ version, book, chapter, verseStart, verseEnd }));
  });

  app.get("/search", (c) => {
    const version = c.req.query("version") ?? "acf";
    const q = c.req.query("q") ?? "";
    return c.json(service.searchText(version, q));
  });

  return app;
}
