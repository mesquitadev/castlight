import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { LyricsService } from "../../services/lyrics";

describe("Database", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    runMigrations(db);
  });
  afterEach(() => { db.close(); });

  it("creates songs table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='songs'").get();
    expect(tables).toBeTruthy();
  });
  it("creates song_sections table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='song_sections'").get();
    expect(tables).toBeTruthy();
  });
  it("creates screens table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='screens'").get();
    expect(tables).toBeTruthy();
  });
});

describe("LyricsService", () => {
  let db: Database;
  let service: LyricsService;
  beforeEach(() => {
    db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    runMigrations(db);
    service = new LyricsService(db);
  });
  afterEach(() => { db.close(); });

  it("creates a song with sections", () => {
    const song = service.create({
      title: "Grande e o Senhor",
      artist: "Adhemar de Campos",
      key: "G",
      tags: ["louvor"],
      sections: [
        { type: "verse", label: "Verso 1", text: "Grande e o Senhor\nE mui digno de louvor", order: 0 },
        { type: "chorus", label: "Refrao", text: "Na cidade do nosso Deus\nSeu santo monte", order: 1 },
      ],
    });
    expect(song.id).toBeDefined();
    expect(song.title).toBe("Grande e o Senhor");
    expect(song.sections).toHaveLength(2);
    expect(song.sections[0].type).toBe("verse");
    expect(song.sections[1].type).toBe("chorus");
  });

  it("lists all songs", () => {
    service.create({ title: "Song A", artist: "Artist", sections: [{ type: "verse", label: "V1", text: "text", order: 0 }] });
    service.create({ title: "Song B", artist: "Artist", sections: [{ type: "verse", label: "V1", text: "text", order: 0 }] });
    const songs = service.list();
    expect(songs).toHaveLength(2);
  });

  it("gets a song by id", () => {
    const created = service.create({ title: "Test", artist: "A", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    const found = service.getById(created.id);
    expect(found).toBeTruthy();
    expect(found!.title).toBe("Test");
    expect(found!.sections).toHaveLength(1);
  });

  it("returns null for non-existent song", () => {
    expect(service.getById("non-existent")).toBeNull();
  });

  it("updates a song", () => {
    const created = service.create({ title: "Old", artist: "A", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    const updated = service.update(created.id, { title: "New Title" });
    expect(updated.title).toBe("New Title");
  });

  it("deletes a song and its sections", () => {
    const created = service.create({ title: "Delete Me", artist: "A", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    service.delete(created.id);
    expect(service.getById(created.id)).toBeNull();
  });

  it("searches songs by title", () => {
    service.create({ title: "Grande e o Senhor", artist: "Adhemar", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    service.create({ title: "Quao Grande es Tu", artist: "Outro", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    service.create({ title: "Oceanos", artist: "Hillsong", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    const results = service.search("grande");
    expect(results).toHaveLength(2);
  });
});
