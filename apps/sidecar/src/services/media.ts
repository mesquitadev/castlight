import type { Database } from "bun:sqlite";
import type { MediaFile } from "@castlight/shared";
import { randomUUID } from "crypto";
import { join } from "path";
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "fs";

const TYPE_DIRS: Record<string, string> = {
  image: "images",
  video: "videos",
  background: "backgrounds",
};

export class MediaService {
  constructor(private db: Database, private mediaDir: string) {
    for (const dir of Object.values(TYPE_DIRS)) {
      mkdirSync(join(mediaDir, dir), { recursive: true });
    }
    mkdirSync(join(mediaDir, "slides"), { recursive: true });
  }

  async saveFile(data: Buffer, originalFilename: string, mimeType: string, type: "image" | "video" | "background"): Promise<MediaFile> {
    const id = randomUUID();
    const ext = originalFilename.split(".").pop() ?? "";
    const filename = `${id}.${ext}`;
    const subdir = TYPE_DIRS[type];
    writeFileSync(join(this.mediaDir, subdir, filename), data);
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO media_files (id, type, filename, original_filename, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, type, filename, originalFilename, mimeType, data.length, now);
    return { id, type, filename, originalFilename, mimeType, size: data.length, createdAt: now };
  }

  listByType(type: string): MediaFile[] {
    return this.db.prepare("SELECT * FROM media_files WHERE type = ? ORDER BY created_at DESC").all(type) as any[];
  }

  listAll(): MediaFile[] {
    return this.db.prepare("SELECT * FROM media_files ORDER BY created_at DESC").all() as any[];
  }

  getById(id: string): MediaFile | null {
    return (this.db.prepare("SELECT * FROM media_files WHERE id = ?").get(id) as any) ?? null;
  }

  getFilePath(id: string): string | null {
    const file = this.getById(id);
    if (!file) return null;
    const subdir = TYPE_DIRS[file.type];
    const path = join(this.mediaDir, subdir, file.filename);
    return existsSync(path) ? path : null;
  }

  deleteFile(id: string): void {
    const path = this.getFilePath(id);
    if (path) unlinkSync(path);
    this.db.prepare("DELETE FROM media_files WHERE id = ?").run(id);
  }
}
