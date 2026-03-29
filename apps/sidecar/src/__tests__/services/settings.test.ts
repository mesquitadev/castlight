import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { SettingsService } from "../../services/settings";

describe("SettingsService", () => {
  let db: Database;
  let service: SettingsService;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    service = new SettingsService(db);
  });
  afterEach(() => { db.close(); });

  it("sets and gets a string value", () => {
    service.set("theme", "dark");
    expect(service.get("theme")).toBe("dark");
  });
  it("returns null for non-existent key", () => {
    expect(service.get("nonexistent")).toBeNull();
  });
  it("sets and gets a JSON value", () => {
    const config = { host: "localhost", port: 4455 };
    service.setJSON("obs_config", config);
    expect(service.getJSON("obs_config")).toEqual(config);
  });
  it("overwrites existing value", () => {
    service.set("key", "old");
    service.set("key", "new");
    expect(service.get("key")).toBe("new");
  });
  it("returns default for missing JSON key", () => {
    const def = { host: "localhost", port: 4455 };
    expect(service.getJSON("missing", def)).toEqual(def);
  });
});
