import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { SlidesService } from "../../services/slides";
import { MediaService } from "../../services/media";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("SlidesService", () => {
  let db: Database;
  let mediaService: MediaService;
  let slidesService: SlidesService;
  let mediaDir: string;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    mediaDir = mkdtempSync(join(tmpdir(), "castlight-slides-test-"));
    mediaService = new MediaService(db, mediaDir);
    slidesService = new SlidesService(db, mediaService, mediaDir);
  });

  afterEach(() => {
    db.close();
    rmSync(mediaDir, { recursive: true, force: true });
  });

  it("creates a slide set from PNG files", () => {
    const pngs = [Buffer.from("png1"), Buffer.from("png2"), Buffer.from("png3")];
    const slideSet = slidesService.createFromPngs("Presentation.pptx", pngs);
    expect(slideSet.id).toBeDefined();
    expect(slideSet.name).toBe("Presentation");
    expect(slideSet.originalFilename).toBe("Presentation.pptx");
    expect(slideSet.slideCount).toBe(3);
    expect(slideSet.slides).toHaveLength(3);
  });

  it("lists all slide sets", () => {
    slidesService.createFromPngs("A.pptx", [Buffer.from("p1")]);
    slidesService.createFromPngs("B.pptx", [Buffer.from("p1"), Buffer.from("p2")]);
    expect(slidesService.list()).toHaveLength(2);
  });

  it("gets a slide set by id", () => {
    const created = slidesService.createFromPngs("Test.pptx", [Buffer.from("p1")]);
    const found = slidesService.getById(created.id);
    expect(found).toBeTruthy();
    expect(found!.name).toBe("Test");
    expect(found!.slides).toHaveLength(1);
  });

  it("deletes a slide set and its files", () => {
    const created = slidesService.createFromPngs("Delete.pptx", [Buffer.from("p1")]);
    slidesService.delete(created.id);
    expect(slidesService.getById(created.id)).toBeNull();
    expect(slidesService.list()).toHaveLength(0);
  });
});
