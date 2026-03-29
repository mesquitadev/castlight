import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { MediaService } from "../../services/media";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("MediaService", () => {
  let db: Database;
  let service: MediaService;
  let mediaDir: string;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    mediaDir = mkdtempSync(join(tmpdir(), "castlight-test-"));
    service = new MediaService(db, mediaDir);
  });

  afterEach(() => {
    db.close();
    rmSync(mediaDir, { recursive: true, force: true });
  });

  it("saves an uploaded file and returns MediaFile", async () => {
    const buffer = Buffer.from("fake image data");
    const result = await service.saveFile(buffer, "photo.jpg", "image/jpeg", "image");
    expect(result.id).toBeDefined();
    expect(result.originalFilename).toBe("photo.jpg");
    expect(result.type).toBe("image");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.size).toBe(buffer.length);
  });

  it("lists files by type", async () => {
    await service.saveFile(Buffer.from("img1"), "a.jpg", "image/jpeg", "image");
    await service.saveFile(Buffer.from("img2"), "b.jpg", "image/jpeg", "image");
    await service.saveFile(Buffer.from("vid1"), "c.mp4", "video/mp4", "video");
    expect(service.listByType("image")).toHaveLength(2);
    expect(service.listByType("video")).toHaveLength(1);
  });

  it("deletes a file from DB and disk", async () => {
    const file = await service.saveFile(Buffer.from("data"), "x.jpg", "image/jpeg", "image");
    service.deleteFile(file.id);
    expect(service.listByType("image")).toHaveLength(0);
  });

  it("returns the disk path for a file", async () => {
    const file = await service.saveFile(Buffer.from("data"), "x.jpg", "image/jpeg", "image");
    const path = service.getFilePath(file.id);
    expect(path).toBeTruthy();
    expect(path).toContain("images");
  });
});
