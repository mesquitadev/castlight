import { Hono } from "hono";
import type { ScreenService } from "../services/screen";
import type { Server } from "socket.io";
import type { ScreenRole } from "@castlight/shared";

export function screenRoutes(service: ScreenService, io: Server): Hono {
  const app = new Hono();

  app.get("/", (c) => c.json(service.listConnected()));

  app.post("/:socketId/role", async (c) => {
    const { role } = await c.req.json<{ role: ScreenRole }>();
    const socketId = c.req.param("socketId");
    const screen = service.assignRole(socketId, role);
    if (!screen) return c.json({ error: "Screen not found" }, 404);
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      for (const room of socket.rooms) {
        if (room.startsWith("role:")) socket.leave(room);
      }
      socket.join(`role:${role}`);
      socket.emit("screen:role-assigned", role);
    }
    return c.json(screen);
  });

  app.post("/:socketId/identify", (c) => {
    const socketId = c.req.param("socketId");
    const socket = io.sockets.sockets.get(socketId);
    if (socket) socket.emit("screen:identify");
    return c.json({ ok: true });
  });

  app.post("/broadcast", async (c) => {
    const { event, roles, data } = await c.req.json();
    for (const role of roles) {
      io.to(`role:${role}`).emit(event, data);
    }
    return c.json({ ok: true });
  });

  return app;
}
