import type { Database } from "bun:sqlite";
import type { Song, CreateSongInput } from "@castlight/shared";
import { randomUUID } from "crypto";

export class LyricsService {
  constructor(private db: Database) {}

  create(input: CreateSongInput): Song {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO songs (id, title, artist, key, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, input.title, input.artist ?? "", input.key ?? null, JSON.stringify(input.tags ?? []), now, now);
    for (const section of input.sections) {
      this.db.prepare(
        `INSERT INTO song_sections (id, song_id, type, label, text, "order") VALUES (?, ?, ?, ?, ?, ?)`
      ).run(randomUUID(), id, section.type, section.label, section.text, section.order);
    }
    return this.getById(id)!;
  }

  list(): Song[] {
    const rows = this.db.prepare("SELECT * FROM songs ORDER BY updated_at DESC").all() as any[];
    return rows.map((row) => this.hydrate(row));
  }

  getById(id: string): Song | null {
    const row = this.db.prepare("SELECT * FROM songs WHERE id = ?").get(id) as any;
    if (!row) return null;
    return this.hydrate(row);
  }

  update(id: string, input: Partial<Pick<Song, "title" | "artist" | "key" | "tags">>): Song {
    const fields: string[] = [];
    const values: any[] = [];
    if (input.title !== undefined) { fields.push("title = ?"); values.push(input.title); }
    if (input.artist !== undefined) { fields.push("artist = ?"); values.push(input.artist); }
    if (input.key !== undefined) { fields.push("key = ?"); values.push(input.key); }
    if (input.tags !== undefined) { fields.push("tags = ?"); values.push(JSON.stringify(input.tags)); }
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);
    this.db.prepare(`UPDATE songs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.getById(id)!;
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM songs WHERE id = ?").run(id);
  }

  search(query: string): Song[] {
    const rows = this.db.prepare(
      "SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? ORDER BY updated_at DESC"
    ).all(`%${query}%`, `%${query}%`) as any[];
    return rows.map((row) => this.hydrate(row));
  }

  private hydrate(row: any): Song {
    const sections = this.db.prepare(
      `SELECT * FROM song_sections WHERE song_id = ? ORDER BY "order" ASC`
    ).all(row.id) as any[];
    return {
      id: row.id,
      title: row.title,
      artist: row.artist,
      key: row.key ?? null,
      tags: JSON.parse(row.tags),
      sections: sections.map((s: any) => ({ id: s.id, type: s.type, label: s.label, text: s.text, order: s.order })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
