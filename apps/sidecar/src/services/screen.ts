import type { Database } from "bun:sqlite";
import type { ScreenInfo } from "@castlight/shared";
import { ScreenRole } from "@castlight/shared";

interface RegisterInput {
  socketId: string;
  userAgent: string;
  resolution: { width: number; height: number };
  fingerprint: string;
}

export class ScreenService {
  private connected = new Map<string, ScreenInfo>();

  constructor(private db: Database) {}

  register(input: RegisterInput): ScreenInfo {
    const remembered = this.db.prepare("SELECT role, name FROM screens WHERE fingerprint = ?").get(input.fingerprint) as { role: string | null; name: string } | null;

    const screen: ScreenInfo = {
      id: input.socketId,
      name: remembered?.name || "",
      role: (remembered?.role as ScreenRole) ?? null,
      userAgent: input.userAgent,
      resolution: input.resolution,
      connectedAt: new Date().toISOString(),
      fingerprint: input.fingerprint,
    };

    this.connected.set(input.socketId, screen);

    this.db.prepare(`
      INSERT INTO screens (fingerprint, name, role, last_user_agent, last_resolution, last_connected_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(fingerprint) DO UPDATE SET
        last_user_agent = excluded.last_user_agent,
        last_resolution = excluded.last_resolution,
        last_connected_at = excluded.last_connected_at
    `).run(
      input.fingerprint,
      screen.name,
      screen.role,
      input.userAgent,
      JSON.stringify(input.resolution),
      screen.connectedAt,
    );

    return screen;
  }

  assignRole(socketId: string, role: ScreenRole): ScreenInfo | null {
    const screen = this.connected.get(socketId);
    if (!screen) return null;
    screen.role = role;
    this.db.prepare("UPDATE screens SET role = ? WHERE fingerprint = ?").run(role, screen.fingerprint);
    return screen;
  }

  unregister(socketId: string): void {
    this.connected.delete(socketId);
  }

  listConnected(): ScreenInfo[] {
    return Array.from(this.connected.values());
  }

  getByRole(role: ScreenRole): ScreenInfo[] {
    return this.listConnected().filter((s) => s.role === role);
  }

  getBySocketId(socketId: string): ScreenInfo | null {
    return this.connected.get(socketId) ?? null;
  }
}
