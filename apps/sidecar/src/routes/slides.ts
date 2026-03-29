import { Hono } from "hono";
import type { SlidesService } from "../services/slides";
import { writeFileSync, mkdtempSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export function slidesRoutes(service: SlidesService): Hono {
  const app = new Hono();

  app.get("/", (c) => c.json(service.list()));

  app.get("/:id", (c) => {
    const slideSet = service.getById(c.req.param("id"));
    if (!slideSet) return c.json({ error: "Slide set not found" }, 404);
    return c.json(slideSet);
  });

  app.post("/import", async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!file.name.endsWith(".pptx")) return c.json({ error: "Only .pptx files supported" }, 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = mkdtempSync(join(tmpdir(), "castlight-pptx-"));
    const tempPath = join(tempDir, file.name);
    writeFileSync(tempPath, buffer);
    try {
      const slideSet = await service.importPptx(tempPath, file.name);
      return c.json(slideSet, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    } finally {
      try { unlinkSync(tempPath); } catch {}
    }
  });

  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
