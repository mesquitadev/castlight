import { Hono } from "hono";
import type { NoticesService } from "../services/notices";

export function noticesRoutes(service: NoticesService): Hono {
  const app = new Hono();
  app.get("/", (c) => c.json(service.listSaved()));
  app.post("/", async (c) => {
    const body = await c.req.json();
    return c.json(service.create(body), 201);
  });
  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });
  return app;
}
