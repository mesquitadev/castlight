import type { Database } from "bun:sqlite";
import type { SlideSet } from "@castlight/shared";
import type { MediaService } from "./media";
import { randomUUID } from "crypto";
import { join } from "path";
import { mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from "fs";

export class SlidesService {
  constructor(private db: Database, private mediaService: MediaService, private mediaDir: string) {}

  async importPptx(pptxPath: string, originalFilename: string): Promise<SlideSet> {
    const slideSetId = randomUUID();
    const outputDir = join(this.mediaDir, "slides", slideSetId);
    mkdirSync(outputDir, { recursive: true });

    const proc = Bun.spawn(["libreoffice", "--headless", "--convert-to", "png", "--outdir", outputDir, pptxPath]);
    await proc.exited;

    if (proc.exitCode !== 0) {
      rmSync(outputDir, { recursive: true, force: true });
      throw new Error("LibreOffice conversion failed. Is LibreOffice installed?");
    }

    const pngFiles = readdirSync(outputDir).filter((f) => f.endsWith(".png")).sort();
    const pngs = pngFiles.map((f) => readFileSync(join(outputDir, f)));
    rmSync(outputDir, { recursive: true, force: true });

    return this.createFromPngs(originalFilename, pngs);
  }

  createFromPngs(originalFilename: string, pngs: Buffer[]): SlideSet {
    const id = randomUUID();
    const name = originalFilename.replace(/\.[^.]+$/, "");
    const now = new Date().toISOString();

    this.db.prepare(`INSERT INTO slide_sets (id, name, original_filename, slide_count, created_at) VALUES (?, ?, ?, ?, ?)`).run(id, name, originalFilename, pngs.length, now);

    const slideUrls: string[] = [];
    const slidesDir = join(this.mediaDir, "slides", id);
    mkdirSync(slidesDir, { recursive: true });

    for (let i = 0; i < pngs.length; i++) {
      const mediaFileId = randomUUID();
      const filename = `${mediaFileId}.png`;

      writeFileSync(join(slidesDir, filename), pngs[i]);

      this.db.prepare(`INSERT INTO media_files (id, type, filename, original_filename, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(mediaFileId, "image", filename, `slide-${i + 1}.png`, "image/png", pngs[i].length, now);

      this.db.prepare(`INSERT INTO slide_set_slides (id, slide_set_id, media_file_id, "order") VALUES (?, ?, ?, ?)`).run(randomUUID(), id, mediaFileId, i);

      slideUrls.push(`/api/media/file/${mediaFileId}`);
    }

    return { id, name, originalFilename, slideCount: pngs.length, slides: slideUrls, createdAt: now };
  }

  list(): SlideSet[] {
    const rows = this.db.prepare("SELECT * FROM slide_sets ORDER BY created_at DESC").all() as any[];
    return rows.map((row) => this.hydrate(row));
  }

  getById(id: string): SlideSet | null {
    const row = this.db.prepare("SELECT * FROM slide_sets WHERE id = ?").get(id) as any;
    if (!row) return null;
    return this.hydrate(row);
  }

  delete(id: string): void {
    const slides = this.db.prepare(`SELECT media_file_id FROM slide_set_slides WHERE slide_set_id = ?`).all(id) as any[];
    for (const slide of slides) {
      this.db.prepare("DELETE FROM media_files WHERE id = ?").run(slide.media_file_id);
    }
    this.db.prepare("DELETE FROM slide_sets WHERE id = ?").run(id);
    rmSync(join(this.mediaDir, "slides", id), { recursive: true, force: true });
  }

  private hydrate(row: any): SlideSet {
    const slides = this.db.prepare(`SELECT media_file_id FROM slide_set_slides WHERE slide_set_id = ? ORDER BY "order" ASC`).all(row.id) as any[];
    return {
      id: row.id,
      name: row.name,
      originalFilename: row.original_filename,
      slideCount: row.slide_count,
      slides: slides.map((s: any) => `/api/media/file/${s.media_file_id}`),
      createdAt: row.created_at,
    };
  }
}
