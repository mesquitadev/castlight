import type { Database } from "bun:sqlite";

export const migration003 = {
  version: 3,
  up(db: Database) {
    db.exec(`
      CREATE TABLE themes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        background_type TEXT NOT NULL DEFAULT 'color',
        background_value TEXT NOT NULL DEFAULT '#000000',
        background_fit TEXT NOT NULL DEFAULT 'cover',
        font_family TEXT NOT NULL DEFAULT 'system-ui',
        font_size TEXT NOT NULL DEFAULT 'clamp(2rem, 5vw, 5rem)',
        font_color TEXT NOT NULL DEFAULT '#ffffff',
        font_weight TEXT NOT NULL DEFAULT '400',
        text_shadow TEXT NOT NULL DEFAULT '2px 2px 8px rgba(0,0,0,0.8)',
        text_align TEXT NOT NULL DEFAULT 'center',
        transition TEXT NOT NULL DEFAULT 'fade',
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },
};
