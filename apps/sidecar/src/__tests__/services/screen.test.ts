import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { ScreenService } from "../../services/screen";
import { ScreenRole } from "@castlight/shared";

describe("ScreenService", () => {
  let db: Database;
  let service: ScreenService;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    service = new ScreenService(db);
  });

  afterEach(() => {
    db.close();
  });

  it("registers a new screen", () => {
    const screen = service.register({
      socketId: "sock1",
      userAgent: "Mozilla/5.0",
      resolution: { width: 1920, height: 1080 },
      fingerprint: "fp-abc",
    });
    expect(screen.id).toBe("sock1");
    expect(screen.fingerprint).toBe("fp-abc");
    expect(screen.role).toBeNull();
  });

  it("remembers role from previous connection (same fingerprint)", () => {
    service.register({ socketId: "sock1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp-abc" });
    service.assignRole("sock1", ScreenRole.Public);
    service.unregister("sock1");

    const screen = service.register({ socketId: "sock2", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp-abc" });
    expect(screen.role).toBe(ScreenRole.Public);
  });

  it("lists connected screens", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.register({ socketId: "s2", userAgent: "M", resolution: { width: 1280, height: 720 }, fingerprint: "fp2" });
    expect(service.listConnected()).toHaveLength(2);
  });

  it("assigns role to a screen", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.assignRole("s1", ScreenRole.Stage);
    const screens = service.listConnected();
    expect(screens[0].role).toBe(ScreenRole.Stage);
  });

  it("unregisters a screen", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.unregister("s1");
    expect(service.listConnected()).toHaveLength(0);
  });

  it("gets screens by role", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.register({ socketId: "s2", userAgent: "M", resolution: { width: 1280, height: 720 }, fingerprint: "fp2" });
    service.assignRole("s1", ScreenRole.Public);
    service.assignRole("s2", ScreenRole.Stage);
    const publicScreens = service.getByRole(ScreenRole.Public);
    expect(publicScreens).toHaveLength(1);
    expect(publicScreens[0].id).toBe("s1");
  });
});
