import type { Database } from "bun:sqlite";

export const migration001 = {
  version: 1,
  up(db: Database) {
    db.exec(`
      CREATE TABLE songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT '',
        key TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE song_sections (
        id TEXT PRIMARY KEY,
        song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        text TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        UNIQUE(song_id, "order")
      );
      CREATE TABLE screens (
        fingerprint TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        role TEXT,
        last_user_agent TEXT,
        last_resolution TEXT,
        last_connected_at TEXT
      );
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  },
};
