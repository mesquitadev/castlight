import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { NoticesService } from "../../services/notices";

describe("NoticesService", () => {
  let db: Database;
  let service: NoticesService;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    service = new NoticesService(db);
  });

  afterEach(() => { db.close(); });

  it("creates a saved notice", () => {
    const notice = service.create({ title: "Culto Especial", body: "Sexta as 19h", save: true });
    expect(notice.id).toBeDefined();
    expect(notice.title).toBe("Culto Especial");
    expect(notice.saved).toBe(true);
  });

  it("creates an ephemeral notice (not saved)", () => {
    const notice = service.create({ title: "Teste", body: "Corpo" });
    expect(notice.saved).toBe(false);
    expect(service.listSaved()).toHaveLength(0);
  });

  it("lists saved notices", () => {
    service.create({ title: "A", body: "a", save: true });
    service.create({ title: "B", body: "b", save: true });
    service.create({ title: "C", body: "c" });
    expect(service.listSaved()).toHaveLength(2);
  });

  it("deletes a saved notice", () => {
    const notice = service.create({ title: "Del", body: "me", save: true });
    service.delete(notice.id);
    expect(service.listSaved()).toHaveLength(0);
  });
});
