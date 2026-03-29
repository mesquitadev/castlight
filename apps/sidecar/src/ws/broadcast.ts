import type { Server } from "socket.io";
import type { ScreenRole, ServerToClientEvents } from "@castlight/shared";

export class Broadcaster {
  constructor(private io: Server) {}

  toRole<E extends keyof ServerToClientEvents>(role: ScreenRole, event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    this.io.to(`role:${role}`).emit(event, ...(args as any[]));
  }

  toRoles<E extends keyof ServerToClientEvents>(roles: ScreenRole[], event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    for (const role of roles) {
      this.toRole(role, event, ...args);
    }
  }

  toAll<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    this.io.emit(event, ...(args as any[]));
  }

  toSocket<E extends keyof ServerToClientEvents>(socketId: string, event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    this.io.to(socketId).emit(event, ...(args as any[]));
  }
}
