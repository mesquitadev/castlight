import { Hono } from "hono";
import type { MediaService } from "../services/media";
import { readFileSync } from "fs";

export function mediaRoutes(service: MediaService): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    const type = c.req.query("type");
    if (type) return c.json(service.listByType(type));
    return c.json(service.listAll());
  });

  app.post("/upload", async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "image";
    if (!file) return c.json({ error: "No file provided" }, 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await service.saveFile(buffer, file.name, file.type, type as any);
    return c.json(result, 201);
  });

  app.get("/file/:id", (c) => {
    const filePath = service.getFilePath(c.req.param("id"));
    if (!filePath) return c.json({ error: "File not found" }, 404);
    const file = service.getById(c.req.param("id"));
    const data = readFileSync(filePath);
    return new Response(data, {
      headers: { "Content-Type": file?.mimeType ?? "application/octet-stream" },
    });
  });

  app.delete("/:id", (c) => {
    service.deleteFile(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
