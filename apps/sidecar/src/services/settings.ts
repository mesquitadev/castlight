import type { Database } from "bun:sqlite";

export class SettingsService {
  constructor(private db: Database) {}

  get(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | null;
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  }

  getJSON<T>(key: string, defaultValue?: T): T | null {
    const raw = this.get(key);
    if (raw === null) return defaultValue ?? null;
    return JSON.parse(raw) as T;
  }

  setJSON<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  }
}
