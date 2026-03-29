import type { Database } from "bun:sqlite";
import { migration001 } from "./migrations/001-initial";
import { migration002 } from "./migrations/002-media";
import { migration003 } from "./migrations/003-themes";

interface Migration {
  version: number;
  up: (db: Database) => void;
}

const migrations: Migration[] = [migration001, migration002, migration003];

export function runMigrations(db: Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`);
  const currentVersion = db.prepare("SELECT MAX(version) as v FROM schema_version").get() as { v: number | null } | null;
  const current = currentVersion?.v ?? 0;
  for (const migration of migrations) {
    if (migration.version > current) {
      migration.up(db);
      db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(migration.version);
    }
  }
}
