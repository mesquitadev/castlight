import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
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
import { LyricsSearchService } from "./services/lyrics-search";
import { ThemesService } from "./services/themes";
import { searchRoutes } from "./routes/search";
import { themesRoutes } from "./routes/themes";
import { getLocalIP } from "./mdns/discovery";

export interface AppContext {
  db: Database;
  biblesDir: string;
  mediaDir: string;
  publicDir: string;
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
  const lyricsSearchService = new LyricsSearchService();
  const themesService = new ThemesService(ctx.db);

  app.route("/api/obs", obsRoutes(obsService));
  app.route("/api/settings", settingsRoutes(settingsService));
  app.route("/api/search", searchRoutes(lyricsSearchService));
  app.route("/api/themes", themesRoutes(themesService));

  app.get("/api/health", (c) => c.json({ status: "ok", ip: getLocalIP() }));

  // Serve static assets
  app.use("/css/*", serveStatic({ root: ctx.publicDir }));
  app.use("/js/*", serveStatic({ root: ctx.publicDir }));

  // Serve screen HTML pages
  const screenPages = ["index", "public", "stage", "stream", "monitor", "bible", "tech"];
  for (const page of screenPages) {
    const route = page === "index" ? "/" : `/${page}`;
    app.get(route, (c) => {
      const filePath = join(ctx.publicDir, `${page}.html`);
      if (!existsSync(filePath)) return c.text("Page not found", 404);
      return c.html(readFileSync(filePath, "utf-8"));
    });
  }

  return { app, httpServer, io };
}
