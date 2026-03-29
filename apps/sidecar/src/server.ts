import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Database } from "bun:sqlite";
import { LyricsService } from "./services/lyrics";
import { BibleService } from "./services/bible";
import { ScreenService } from "./services/screen";
import { MediaService } from "./services/media";
import { SlidesService } from "./services/slides";
import { NoticesService } from "./services/notices";
import { SettingsService } from "./services/settings";
import { OBSService } from "./services/obs";
import { Broadcaster } from "./ws/broadcast";
import { registerHandlers } from "./ws/handlers";
import { lyricsRoutes } from "./routes/lyrics";
import { bibleRoutes } from "./routes/bible";
import { screenRoutes } from "./routes/screens";
import { mediaRoutes } from "./routes/media";
import { slidesRoutes } from "./routes/slides";
import { noticesRoutes } from "./routes/notices";
import { obsRoutes } from "./routes/obs";
import { settingsRoutes } from "./routes/settings";
import { SIDECAR_WS_PATH } from "@castlight/shared";
import { getLocalIP } from "./mdns/discovery";

export interface AppContext {
  db: Database;
  biblesDir: string;
  mediaDir: string;
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
  const mediaService = new MediaService(ctx.db, ctx.mediaDir);
  const slidesService = new SlidesService(ctx.db, mediaService, ctx.mediaDir);
  const noticesService = new NoticesService(ctx.db);
  const settingsService = new SettingsService(ctx.db);
  const obsService = new OBSService(settingsService);
  obsService.setStatusCallback((status) => { io.emit("obs:status", status); });
  obsService.tryAutoConnect();
  const broadcaster = new Broadcaster(io);

  registerHandlers(io, { screenService, bibleService, broadcaster });

  app.route("/api/lyrics", lyricsRoutes(lyricsService));
  app.route("/api/bible", bibleRoutes(bibleService));
  app.route("/api/screens", screenRoutes(screenService, io));
  app.route("/api/media", mediaRoutes(mediaService));
  app.route("/api/slides", slidesRoutes(slidesService));
  app.route("/api/notices", noticesRoutes(noticesService));
  app.route("/api/obs", obsRoutes(obsService));
  app.route("/api/settings", settingsRoutes(settingsService));

  app.get("/api/health", (c) => c.json({ status: "ok", ip: getLocalIP() }));

  return { app, httpServer, io };
}
