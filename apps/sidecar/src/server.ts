import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Database } from "bun:sqlite";
import { LyricsService } from "./services/lyrics";
import { BibleService } from "./services/bible";
import { ScreenService } from "./services/screen";
import { Broadcaster } from "./ws/broadcast";
import { registerHandlers } from "./ws/handlers";
import { lyricsRoutes } from "./routes/lyrics";
import { bibleRoutes } from "./routes/bible";
import { screenRoutes } from "./routes/screens";
import { SIDECAR_WS_PATH } from "@castlight/shared";
import { getLocalIP } from "./mdns/discovery";

export interface AppContext {
  db: Database;
  biblesDir: string;
}

export function createApp(ctx: AppContext) {
  const app = new Hono();
  app.use("*", cors());

  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    path: SIDECAR_WS_PATH,
    cors: { origin: "*" },
  });

  const lyricsService = new LyricsService(ctx.db);
  const bibleService = new BibleService(ctx.biblesDir);
  const screenService = new ScreenService(ctx.db);
  const broadcaster = new Broadcaster(io);

  registerHandlers(io, { screenService, bibleService, broadcaster });

  app.route("/api/lyrics", lyricsRoutes(lyricsService));
  app.route("/api/bible", bibleRoutes(bibleService));
  app.route("/api/screens", screenRoutes(screenService, io));

  app.get("/api/health", (c) => c.json({ status: "ok", ip: getLocalIP() }));

  return { app, httpServer, io };
}
