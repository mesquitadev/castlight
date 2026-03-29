import { Database } from "bun:sqlite";
import { runMigrations } from "./migrate";
import { join } from "path";
import { homedir } from "os";
import { mkdirSync } from "fs";

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;
  const dataDir = join(homedir(), ".castlight");
  mkdirSync(dataDir, { recursive: true });
  db = new Database(join(dataDir, "castlight.db"));
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
  return db;
}

export function createTestDb(): Database {
  const testDb = new Database(":memory:");
  testDb.exec("PRAGMA foreign_keys = ON");
  runMigrations(testDb);
  return testDb;
}
