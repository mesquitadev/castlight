import type { Server, Socket } from "socket.io";
import { ScreenRole } from "@castlight/shared";
import type { ScreenService } from "../services/screen";
import type { BibleService } from "../services/bible";
import type { Broadcaster } from "./broadcast";

interface HandlerDeps {
  screenService: ScreenService;
  bibleService: BibleService;
  broadcaster: Broadcaster;
}

export function registerHandlers(io: Server, deps: HandlerDeps): void {
  const { screenService, bibleService, broadcaster } = deps;

  io.on("connection", (socket: Socket) => {
    console.log(`[ws] client connected: ${socket.id}`);

    socket.on("screen:register", (info) => {
      const screen = screenService.register({
        socketId: socket.id,
        userAgent: info.userAgent,
        resolution: info.resolution,
        fingerprint: info.fingerprint,
      });
      if (screen.role) {
        socket.join(`role:${screen.role}`);
      }
      socket.emit("screen:registered", screen);
      broadcaster.toAll("screens:updated", screenService.listConnected());
    });

    socket.on("bible:send", (ref) => {
      const verses = bibleService.getVerses(ref);
      broadcaster.toRoles(
        [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Monitor, ScreenRole.Stream],
        "content:bible",
        { verses, reference: ref },
      );
    });

    socket.on("disconnect", () => {
      console.log(`[ws] client disconnected: ${socket.id}`);
      screenService.unregister(socket.id);
      broadcaster.toAll("screens:updated", screenService.listConnected());
    });
  });
}
