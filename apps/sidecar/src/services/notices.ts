import type { Database } from "bun:sqlite";
import type { Notice, CreateNoticeInput } from "@castlight/shared";
import { randomUUID } from "crypto";

export class NoticesService {
  constructor(private db: Database) {}

  create(input: CreateNoticeInput): Notice {
    const id = randomUUID();
    const now = new Date().toISOString();
    const save = input.save ?? false;
    if (save) {
      this.db.prepare(`INSERT INTO notices (id, title, body, created_at) VALUES (?, ?, ?, ?)`).run(id, input.title, input.body, now);
    }
    return { id, title: input.title, body: input.body, saved: save, createdAt: now };
  }

  listSaved(): Notice[] {
    const rows = this.db.prepare("SELECT * FROM notices ORDER BY created_at DESC").all() as any[];
    return rows.map((row) => ({ id: row.id, title: row.title, body: row.body, saved: true, createdAt: row.created_at }));
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM notices WHERE id = ?").run(id);
  }
}
