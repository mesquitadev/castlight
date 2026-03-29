import type { Database } from "bun:sqlite";

export const migration002 = {
  version: 2,
  up(db: Database) {
    db.exec(`
      CREATE TABLE media_files (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE slide_sets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        slide_count INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE slide_set_slides (
        id TEXT PRIMARY KEY,
        slide_set_id TEXT NOT NULL REFERENCES slide_sets(id) ON DELETE CASCADE,
        media_file_id TEXT NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
        "order" INTEGER NOT NULL,
        UNIQUE(slide_set_id, "order")
      );

      CREATE TABLE notices (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },
};
