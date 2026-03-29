# Castlight Phase 2 — Media, Slides, Videos, Notices, Backgrounds

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add media support to Castlight — PPTX slides, images, videos, notices, and backgrounds, with synchronized playback and broadcast to screens.

**Architecture:** Extends the existing sidecar with new services (media, slides, notices), a file upload system storing to `~/.castlight/media/`, and LibreOffice-based PPTX conversion. The desktop app gets a new Media page with tabs for each content type. Video playback is synchronized via WebSocket timestamp commands.

**Tech Stack:** Existing stack + LibreOffice CLI (PPTX conversion), Hono multipart upload, static file serving.

---

## File Structure

```
# New files only — existing files listed with "Modify:"

packages/shared/src/
├── enums.ts                          # Modify: add Slide, Image, Video, Notice to ContentType
├── types/
│   ├── media.ts                      # NEW: MediaFile, SlideSet, Notice, VideoCommand, BackgroundConfig
│   └── events.ts                     # Modify: add new content events
└── index.ts                          # Modify: re-export new types

apps/sidecar/src/
├── db/
│   ├── migrate.ts                    # Modify: register migration002
│   └── migrations/
│       └── 002-media.ts              # NEW: media_files, slide_sets, slide_set_slides, notices tables
├── services/
│   ├── media.ts                      # NEW: MediaService — file upload, list, delete, serve path
│   ├── slides.ts                     # NEW: SlidesService — PPTX import, conversion, listing
│   └── notices.ts                    # NEW: NoticesService — CRUD for notices
├── routes/
│   ├── media.ts                      # NEW: /api/media routes
│   ├── slides.ts                     # NEW: /api/slides routes
│   └── notices.ts                    # NEW: /api/notices routes
├── server.ts                         # Modify: register new routes + static file serving
├── __tests__/
│   └── services/
│       ├── media.test.ts             # NEW
│       ├── slides.test.ts            # NEW
│       └── notices.test.ts           # NEW

apps/desktop/src/
├── store/
│   ├── api.ts                        # Modify: add media/slides/notices endpoints
│   └── slices/
│       ├── presentation.ts           # Modify: add slide, image, video, notice, background state
│       └── ui.ts                     # Modify: add "media" to ActivePanel
├── pages/
│   └── Media.tsx                     # NEW: Media page with tabs
├── components/
│   ├── Sidebar.tsx                   # Modify: add Media nav item
│   ├── media/
│   │   ├── SlidesTab.tsx             # NEW: Slides tab with import + grid + presenter
│   │   ├── ImagesTab.tsx             # NEW: Images tab with import + grid
│   │   ├── VideosTab.tsx             # NEW: Videos tab with import + player
│   │   ├── NoticesTab.tsx            # NEW: Notices tab with form + list
│   │   └── BackgroundsTab.tsx        # NEW: Backgrounds tab with grid + color picker
│   └── SlidePresenter.tsx            # NEW: Slide navigation presenter
└── App.tsx                           # Modify: add Media page
```

---

### Task 1: Shared Types — Media, Slides, Video, Notices

**Files:**
- Modify: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/types/media.ts`
- Modify: `packages/shared/src/types/events.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add new ContentType enums**

Add to `packages/shared/src/enums.ts` after `Black = "black"`:

```typescript
  Slide = "slide",
  Image = "image",
  Video = "video",
  Notice = "notice",
```

- [ ] **Step 2: Create media types**

```typescript
// packages/shared/src/types/media.ts

export interface MediaFile {
  id: string;
  type: "image" | "video" | "background";
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface SlideSet {
  id: string;
  name: string;
  originalFilename: string;
  slideCount: number;
  slides: string[];
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  saved: boolean;
  createdAt: string;
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  save?: boolean;
}

export interface VideoCommand {
  action: "play" | "pause" | "seek";
  url: string;
  timestamp: number;
}

export interface BackgroundConfig {
  type: "image" | "video" | "color" | "gradient";
  value: string;
}
```

- [ ] **Step 3: Add new WebSocket events to events.ts**

Add to `ServerToClientEvents` in `packages/shared/src/types/events.ts`:

```typescript
  "content:slide": (data: { slideSetId: string; slides: string[]; currentIndex: number; name: string }) => void;
  "content:image": (data: { url: string; filename: string }) => void;
  "content:video": (data: VideoCommand) => void;
  "content:notice": (data: { title: string; body: string }) => void;
  "background:change": (data: BackgroundConfig) => void;
```

Add the necessary imports at the top of events.ts:

```typescript
import type { VideoCommand, BackgroundConfig } from "./media";
```

- [ ] **Step 4: Update index.ts re-exports**

Add to `packages/shared/src/index.ts`:

```typescript
export type * from "./types/media";
```

- [ ] **Step 5: Verify compilation**

Run: `cd packages/shared && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add media, slides, video, notice, and background types"
```

---

### Task 2: Database Migration — Media Tables

**Files:**
- Create: `apps/sidecar/src/db/migrations/002-media.ts`
- Modify: `apps/sidecar/src/db/migrate.ts`

- [ ] **Step 1: Create migration 002**

```typescript
// apps/sidecar/src/db/migrations/002-media.ts
import type { Database } from "bun:sqlite";

export const migration002 = {
  version: 2,
  up(db: Database) {
    db.exec(`
      CREATE TABLE media_files (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE slide_sets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        slide_count INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE slide_set_slides (
        id TEXT PRIMARY KEY,
        slide_set_id TEXT NOT NULL REFERENCES slide_sets(id) ON DELETE CASCADE,
        media_file_id TEXT NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
        "order" INTEGER NOT NULL,
        UNIQUE(slide_set_id, "order")
      );

      CREATE TABLE notices (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  },
};
```

- [ ] **Step 2: Register migration in migrate.ts**

Add import at top of `apps/sidecar/src/db/migrate.ts`:

```typescript
import { migration002 } from "./migrations/002-media";
```

Update the migrations array:

```typescript
const migrations: Migration[] = [migration001, migration002];
```

- [ ] **Step 3: Verify migration runs**

Run: `cd apps/sidecar && bun test src/__tests__/services/lyrics.test.ts`
Expected: All existing tests still pass (migration runs on in-memory DB).

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/src/db/
git commit -m "feat(sidecar): add migration 002 for media_files, slide_sets, and notices tables"
```

---

### Task 3: Sidecar — Media Service

**Files:**
- Create: `apps/sidecar/src/services/media.ts`
- Create: `apps/sidecar/src/__tests__/services/media.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/services/media.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { MediaService } from "../../services/media";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
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

    const images = service.listByType("image");
    expect(images).toHaveLength(2);

    const videos = service.listByType("video");
    expect(videos).toHaveLength(1);
  });

  it("deletes a file from DB and disk", async () => {
    const file = await service.saveFile(Buffer.from("data"), "x.jpg", "image/jpeg", "image");
    service.deleteFile(file.id);

    const list = service.listByType("image");
    expect(list).toHaveLength(0);
  });

  it("returns the disk path for a file", async () => {
    const file = await service.saveFile(Buffer.from("data"), "x.jpg", "image/jpeg", "image");
    const path = service.getFilePath(file.id);

    expect(path).toBeTruthy();
    expect(path).toContain("images");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/services/media.test.ts`
Expected: FAIL — MediaService not found.

- [ ] **Step 3: Implement MediaService**

```typescript
// apps/sidecar/src/services/media.ts
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
  constructor(
    private db: Database,
    private mediaDir: string,
  ) {
    for (const dir of Object.values(TYPE_DIRS)) {
      mkdirSync(join(mediaDir, dir), { recursive: true });
    }
    mkdirSync(join(mediaDir, "slides"), { recursive: true });
  }

  async saveFile(
    data: Buffer,
    originalFilename: string,
    mimeType: string,
    type: "image" | "video" | "background",
  ): Promise<MediaFile> {
    const id = randomUUID();
    const ext = originalFilename.split(".").pop() ?? "";
    const filename = `${id}.${ext}`;
    const subdir = TYPE_DIRS[type];
    const filePath = join(this.mediaDir, subdir, filename);

    writeFileSync(filePath, data);

    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO media_files (id, type, filename, original_filename, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, type, filename, originalFilename, mimeType, data.length, now);

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/services/media.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/src/services/media.ts apps/sidecar/src/__tests__/services/media.test.ts
git commit -m "feat(sidecar): add media service for file upload, listing, and deletion"
```

---

### Task 4: Sidecar — Slides Service

**Files:**
- Create: `apps/sidecar/src/services/slides.ts`
- Create: `apps/sidecar/src/__tests__/services/slides.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/services/slides.test.ts
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

    const sets = slidesService.list();
    expect(sets).toHaveLength(2);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/services/slides.test.ts`
Expected: FAIL — SlidesService not found.

- [ ] **Step 3: Implement SlidesService**

```typescript
// apps/sidecar/src/services/slides.ts
import type { Database } from "bun:sqlite";
import type { SlideSet } from "@castlight/shared";
import type { MediaService } from "./media";
import { randomUUID } from "crypto";
import { join } from "path";
import { mkdirSync, rmSync, readdirSync, readFileSync } from "fs";
import { SIDECAR_PORT } from "@castlight/shared";

export class SlidesService {
  constructor(
    private db: Database,
    private mediaService: MediaService,
    private mediaDir: string,
  ) {}

  async importPptx(pptxPath: string, originalFilename: string): Promise<SlideSet> {
    const slideSetId = randomUUID();
    const outputDir = join(this.mediaDir, "slides", slideSetId);
    mkdirSync(outputDir, { recursive: true });

    const proc = Bun.spawn([
      "libreoffice",
      "--headless",
      "--convert-to",
      "png",
      "--outdir",
      outputDir,
      pptxPath,
    ]);
    await proc.exited;

    if (proc.exitCode !== 0) {
      rmSync(outputDir, { recursive: true, force: true });
      throw new Error("LibreOffice conversion failed. Is LibreOffice installed?");
    }

    const pngFiles = readdirSync(outputDir)
      .filter((f) => f.endsWith(".png"))
      .sort();

    const pngs = pngFiles.map((f) => readFileSync(join(outputDir, f)));
    rmSync(outputDir, { recursive: true, force: true });

    return this.createFromPngs(originalFilename, pngs);
  }

  createFromPngs(originalFilename: string, pngs: Buffer[]): SlideSet {
    const id = randomUUID();
    const name = originalFilename.replace(/\.[^.]+$/, "");
    const now = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO slide_sets (id, name, original_filename, slide_count, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, name, originalFilename, pngs.length, now);

    const slideUrls: string[] = [];

    for (let i = 0; i < pngs.length; i++) {
      const mediaFileId = randomUUID();
      const filename = `${mediaFileId}.png`;
      const slidesDir = join(this.mediaDir, "slides", id);
      mkdirSync(slidesDir, { recursive: true });

      const { writeFileSync } = require("fs");
      writeFileSync(join(slidesDir, filename), pngs[i]);

      this.db.prepare(
        `INSERT INTO media_files (id, type, filename, original_filename, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(mediaFileId, "image", filename, `slide-${i + 1}.png`, "image/png", pngs[i].length, now);

      this.db.prepare(
        `INSERT INTO slide_set_slides (id, slide_set_id, media_file_id, "order") VALUES (?, ?, ?, ?)`,
      ).run(randomUUID(), id, mediaFileId, i);

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
    const slides = this.db.prepare(
      `SELECT media_file_id FROM slide_set_slides WHERE slide_set_id = ?`,
    ).all(id) as any[];

    for (const slide of slides) {
      this.db.prepare("DELETE FROM media_files WHERE id = ?").run(slide.media_file_id);
    }

    this.db.prepare("DELETE FROM slide_sets WHERE id = ?").run(id);

    const slidesDir = join(this.mediaDir, "slides", id);
    rmSync(slidesDir, { recursive: true, force: true });
  }

  private hydrate(row: any): SlideSet {
    const slides = this.db.prepare(
      `SELECT media_file_id FROM slide_set_slides WHERE slide_set_id = ? ORDER BY "order" ASC`,
    ).all(row.id) as any[];

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/services/slides.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/src/services/slides.ts apps/sidecar/src/__tests__/services/slides.test.ts
git commit -m "feat(sidecar): add slides service with PPTX import and PNG slide management"
```

---

### Task 5: Sidecar — Notices Service

**Files:**
- Create: `apps/sidecar/src/services/notices.ts`
- Create: `apps/sidecar/src/__tests__/services/notices.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/services/notices.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { runMigrations } from "../../db/migrate";
import { NoticesService } from "../../services/notices";

describe("NoticesService", () => {
  let db: Database;
  let service: NoticesService;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
    service = new NoticesService(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates a saved notice", () => {
    const notice = service.create({ title: "Culto Especial", body: "Sexta as 19h", save: true });
    expect(notice.id).toBeDefined();
    expect(notice.title).toBe("Culto Especial");
    expect(notice.saved).toBe(true);
  });

  it("creates an ephemeral notice (not saved)", () => {
    const notice = service.create({ title: "Teste", body: "Corpo" });
    expect(notice.saved).toBe(false);

    const saved = service.listSaved();
    expect(saved).toHaveLength(0);
  });

  it("lists saved notices", () => {
    service.create({ title: "A", body: "a", save: true });
    service.create({ title: "B", body: "b", save: true });
    service.create({ title: "C", body: "c" });

    const saved = service.listSaved();
    expect(saved).toHaveLength(2);
  });

  it("deletes a saved notice", () => {
    const notice = service.create({ title: "Del", body: "me", save: true });
    service.delete(notice.id);

    expect(service.listSaved()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/services/notices.test.ts`
Expected: FAIL — NoticesService not found.

- [ ] **Step 3: Implement NoticesService**

```typescript
// apps/sidecar/src/services/notices.ts
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
      this.db.prepare(
        `INSERT INTO notices (id, title, body, created_at) VALUES (?, ?, ?, ?)`,
      ).run(id, input.title, input.body, now);
    }

    return { id, title: input.title, body: input.body, saved: save, createdAt: now };
  }

  listSaved(): Notice[] {
    const rows = this.db.prepare("SELECT * FROM notices ORDER BY created_at DESC").all() as any[];
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      saved: true,
      createdAt: row.created_at,
    }));
  }

  delete(id: string): void {
    this.db.prepare("DELETE FROM notices WHERE id = ?").run(id);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/services/notices.test.ts`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/src/services/notices.ts apps/sidecar/src/__tests__/services/notices.test.ts
git commit -m "feat(sidecar): add notices service with ephemeral and saved notices"
```

---

### Task 6: Sidecar — HTTP Routes (Media, Slides, Notices)

**Files:**
- Create: `apps/sidecar/src/routes/media.ts`
- Create: `apps/sidecar/src/routes/slides.ts`
- Create: `apps/sidecar/src/routes/notices.ts`
- Modify: `apps/sidecar/src/server.ts`

- [ ] **Step 1: Create media routes**

```typescript
// apps/sidecar/src/routes/media.ts
import { Hono } from "hono";
import type { MediaService } from "../services/media";
import { readFileSync } from "fs";

export function mediaRoutes(service: MediaService): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    const type = c.req.query("type");
    if (type) return c.json(service.listByType(type));
    return c.json(service.listAll());
  });

  app.post("/upload", async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "image";

    if (!file) return c.json({ error: "No file provided" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await service.saveFile(buffer, file.name, file.type, type as any);
    return c.json(result, 201);
  });

  app.get("/file/:id", (c) => {
    const filePath = service.getFilePath(c.req.param("id"));
    if (!filePath) return c.json({ error: "File not found" }, 404);

    const file = service.getById(c.req.param("id"));
    const data = readFileSync(filePath);
    return new Response(data, {
      headers: { "Content-Type": file?.mimeType ?? "application/octet-stream" },
    });
  });

  app.delete("/:id", (c) => {
    service.deleteFile(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 2: Create slides routes**

```typescript
// apps/sidecar/src/routes/slides.ts
import { Hono } from "hono";
import type { SlidesService } from "../services/slides";
import { writeFileSync, mkdtempSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export function slidesRoutes(service: SlidesService): Hono {
  const app = new Hono();

  app.get("/", (c) => c.json(service.list()));

  app.get("/:id", (c) => {
    const slideSet = service.getById(c.req.param("id"));
    if (!slideSet) return c.json({ error: "Slide set not found" }, 404);
    return c.json(slideSet);
  });

  app.post("/import", async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return c.json({ error: "No file provided" }, 400);
    if (!file.name.endsWith(".pptx")) return c.json({ error: "Only .pptx files supported" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = mkdtempSync(join(tmpdir(), "castlight-pptx-"));
    const tempPath = join(tempDir, file.name);
    writeFileSync(tempPath, buffer);

    try {
      const slideSet = await service.importPptx(tempPath, file.name);
      return c.json(slideSet, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    } finally {
      try { unlinkSync(tempPath); } catch {}
    }
  });

  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 3: Create notices routes**

```typescript
// apps/sidecar/src/routes/notices.ts
import { Hono } from "hono";
import type { NoticesService } from "../services/notices";

export function noticesRoutes(service: NoticesService): Hono {
  const app = new Hono();

  app.get("/", (c) => c.json(service.listSaved()));

  app.post("/", async (c) => {
    const body = await c.req.json();
    const notice = service.create(body);
    return c.json(notice, 201);
  });

  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 4: Wire routes into server.ts**

Add imports at top of `apps/sidecar/src/server.ts`:

```typescript
import { MediaService } from "./services/media";
import { SlidesService } from "./services/slides";
import { NoticesService } from "./services/notices";
import { mediaRoutes } from "./routes/media";
import { slidesRoutes } from "./routes/slides";
import { noticesRoutes } from "./routes/notices";
```

Update `AppContext`:

```typescript
export interface AppContext {
  db: Database;
  biblesDir: string;
  mediaDir: string;
}
```

Add services and routes inside `createApp`, after existing services:

```typescript
  const mediaService = new MediaService(ctx.db, ctx.mediaDir);
  const slidesService = new SlidesService(ctx.db, mediaService, ctx.mediaDir);
  const noticesService = new NoticesService(ctx.db);
```

Add routes after existing route registrations:

```typescript
  app.route("/api/media", mediaRoutes(mediaService));
  app.route("/api/slides", slidesRoutes(slidesService));
  app.route("/api/notices", noticesRoutes(noticesService));
```

- [ ] **Step 5: Update index.ts to pass mediaDir**

In `apps/sidecar/src/index.ts`, add `mediaDir` to context. Add after `biblesDir` definition:

```typescript
const mediaDir = join(dataDir, "media");
```

Update `createApp` call:

```typescript
const { app, httpServer } = createApp({ db, biblesDir, mediaDir });
```

- [ ] **Step 6: Verify sidecar starts**

Run: `cd apps/sidecar && bun run src/index.ts`
Expected: `[castlight] sidecar running on http://localhost:3100`

- [ ] **Step 7: Commit**

```bash
git add apps/sidecar/src/routes/ apps/sidecar/src/server.ts apps/sidecar/src/index.ts
git commit -m "feat(sidecar): add HTTP routes for media upload, slides import, and notices"
```

---

### Task 7: Desktop — Update Redux Store for Media

**Files:**
- Modify: `apps/desktop/src/store/api.ts`
- Modify: `apps/desktop/src/store/slices/presentation.ts`
- Modify: `apps/desktop/src/store/slices/ui.ts`

- [ ] **Step 1: Add media endpoints to api.ts**

Add imports at top of `apps/desktop/src/store/api.ts`:

```typescript
import type { Song, CreateSongInput, BibleVersion, BibleBook, BibleVerse, MediaFile, SlideSet, Notice, CreateNoticeInput } from "@castlight/shared";
```

Add new endpoints inside the `endpoints` builder, after existing endpoints:

```typescript
    // Media
    getMediaFiles: builder.query<MediaFile[], string | void>({
      query: (type) => type ? `/media?type=${type}` : "/media",
      providesTags: ["Media"],
    }),
    uploadMedia: builder.mutation<MediaFile, { file: File; type: string }>({
      query: ({ file, type }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        return { url: "/media/upload", method: "POST", body: formData };
      },
      invalidatesTags: ["Media"],
    }),
    deleteMedia: builder.mutation<void, string>({
      query: (id) => ({ url: `/media/${id}`, method: "DELETE" }),
      invalidatesTags: ["Media"],
    }),

    // Slides
    getSlideSets: builder.query<SlideSet[], void>({
      query: () => "/slides",
      providesTags: ["Slides"],
    }),
    getSlideSet: builder.query<SlideSet, string>({
      query: (id) => `/slides/${id}`,
    }),
    importSlides: builder.mutation<SlideSet, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: "/slides/import", method: "POST", body: formData };
      },
      invalidatesTags: ["Slides"],
    }),
    deleteSlideSet: builder.mutation<void, string>({
      query: (id) => ({ url: `/slides/${id}`, method: "DELETE" }),
      invalidatesTags: ["Slides"],
    }),

    // Notices
    getSavedNotices: builder.query<Notice[], void>({
      query: () => "/notices",
      providesTags: ["Notices"],
    }),
    createNotice: builder.mutation<Notice, CreateNoticeInput>({
      query: (body) => ({ url: "/notices", method: "POST", body }),
      invalidatesTags: ["Notices"],
    }),
    deleteNotice: builder.mutation<void, string>({
      query: (id) => ({ url: `/notices/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notices"],
    }),
```

Add `"Media", "Slides", "Notices"` to the `tagTypes` array.

Export the new hooks:

```typescript
export const {
  // existing...
  useGetMediaFilesQuery,
  useUploadMediaMutation,
  useDeleteMediaMutation,
  useGetSlideSetsQuery,
  useGetSlideSetQuery,
  useImportSlidesMutation,
  useDeleteSlideSetMutation,
  useGetSavedNoticesQuery,
  useCreateNoticeMutation,
  useDeleteNoticeMutation,
} = api;
```

- [ ] **Step 2: Update presentation slice**

Replace `apps/desktop/src/store/slices/presentation.ts` with:

```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SongSection, BibleVerse, BibleReference, SlideSet, Notice, VideoCommand, BackgroundConfig } from "@castlight/shared";
import { ContentType } from "@castlight/shared";

interface PresentationState {
  contentType: ContentType;
  currentSection: SongSection | null;
  nextSection: SongSection | null;
  currentSong: { title: string; artist: string; key: string | null } | null;
  currentVerses: BibleVerse[] | null;
  currentReference: BibleReference | null;
  currentSlideSet: SlideSet | null;
  currentSlideIndex: number;
  currentImage: string | null;
  currentVideo: VideoCommand | null;
  currentNotice: Notice | null;
  background: BackgroundConfig | null;
}

const initialState: PresentationState = {
  contentType: ContentType.Blank,
  currentSection: null,
  nextSection: null,
  currentSong: null,
  currentVerses: null,
  currentReference: null,
  currentSlideSet: null,
  currentSlideIndex: 0,
  currentImage: null,
  currentVideo: null,
  currentNotice: null,
  background: null,
};

export const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    presentLyrics(state, action: PayloadAction<{ section: SongSection; nextSection: SongSection | null; song: { title: string; artist: string; key: string | null } }>) {
      state.contentType = ContentType.Lyrics;
      state.currentSection = action.payload.section;
      state.nextSection = action.payload.nextSection;
      state.currentSong = action.payload.song;
    },
    presentBible(state, action: PayloadAction<{ verses: BibleVerse[]; reference: BibleReference }>) {
      state.contentType = ContentType.Bible;
      state.currentVerses = action.payload.verses;
      state.currentReference = action.payload.reference;
    },
    presentSlide(state, action: PayloadAction<{ slideSet: SlideSet; index: number }>) {
      state.contentType = ContentType.Slide;
      state.currentSlideSet = action.payload.slideSet;
      state.currentSlideIndex = action.payload.index;
    },
    presentImage(state, action: PayloadAction<string>) {
      state.contentType = ContentType.Image;
      state.currentImage = action.payload;
    },
    presentVideo(state, action: PayloadAction<VideoCommand>) {
      state.contentType = ContentType.Video;
      state.currentVideo = action.payload;
    },
    presentNotice(state, action: PayloadAction<Notice>) {
      state.contentType = ContentType.Notice;
      state.currentNotice = action.payload;
    },
    setBackground(state, action: PayloadAction<BackgroundConfig | null>) {
      state.background = action.payload;
    },
    clearPresentation(state) {
      state.contentType = ContentType.Blank;
      state.currentSection = null;
      state.nextSection = null;
      state.currentSong = null;
      state.currentVerses = null;
      state.currentReference = null;
      state.currentSlideSet = null;
      state.currentSlideIndex = 0;
      state.currentImage = null;
      state.currentVideo = null;
      state.currentNotice = null;
    },
    blackout(state) {
      state.contentType = ContentType.Black;
    },
  },
});

export const {
  presentLyrics, presentBible, presentSlide, presentImage,
  presentVideo, presentNotice, setBackground, clearPresentation, blackout,
} = presentationSlice.actions;
```

- [ ] **Step 3: Update UI slice — add "media" panel**

In `apps/desktop/src/store/slices/ui.ts`, change the type:

```typescript
type ActivePanel = "lyrics" | "bible" | "media" | "screens" | "dashboard";
```

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/store/
git commit -m "feat(desktop): update Redux store with media, slides, notices endpoints and presentation state"
```

---

### Task 8: Desktop — Media Page + Tabs

**Files:**
- Create: `apps/desktop/src/pages/Media.tsx`
- Create: `apps/desktop/src/components/media/SlidesTab.tsx`
- Create: `apps/desktop/src/components/media/ImagesTab.tsx`
- Create: `apps/desktop/src/components/media/VideosTab.tsx`
- Create: `apps/desktop/src/components/media/NoticesTab.tsx`
- Create: `apps/desktop/src/components/media/BackgroundsTab.tsx`
- Modify: `apps/desktop/src/components/Sidebar.tsx`
- Modify: `apps/desktop/src/App.tsx`

- [ ] **Step 1: Create Media page with tabs**

```tsx
// apps/desktop/src/pages/Media.tsx
import { useState } from "react";
import { SlidesTab } from "../components/media/SlidesTab";
import { ImagesTab } from "../components/media/ImagesTab";
import { VideosTab } from "../components/media/VideosTab";
import { NoticesTab } from "../components/media/NoticesTab";
import { BackgroundsTab } from "../components/media/BackgroundsTab";

const TABS = [
  { id: "slides", label: "Slides" },
  { id: "images", label: "Imagens" },
  { id: "videos", label: "Videos" },
  { id: "notices", label: "Avisos" },
  { id: "backgrounds", label: "Backgrounds" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_COMPONENTS: Record<TabId, React.FC> = {
  slides: SlidesTab,
  images: ImagesTab,
  videos: VideosTab,
  notices: NoticesTab,
  backgrounds: BackgroundsTab,
};

export function Media() {
  const [activeTab, setActiveTab] = useState<TabId>("slides");
  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Midia</h2>
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-white border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TabContent />
    </div>
  );
}
```

- [ ] **Step 2: Create SlidesTab**

```tsx
// apps/desktop/src/components/media/SlidesTab.tsx
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useGetSlideSetsQuery, useImportSlidesMutation, useDeleteSlideSetMutation } from "../../store/api";
import { presentSlide } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function SlidesTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: slideSets = [], isLoading } = useGetSlideSetsQuery();
  const [importSlides, { isLoading: importing }] = useImportSlidesMutation();
  const [deleteSlideSet] = useDeleteSlideSetMutation();

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await importSlides(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleProject = (slideSet: any, index: number) => {
    dispatch(presentSlide({ slideSet, index }));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:slide",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { slideSetId: slideSet.id, slides: slideSet.slides, currentIndex: index, name: slideSet.name },
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept=".pptx" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {importing ? "Importando..." : "Importar PPTX"}
        </button>
      </div>
      {isLoading && <p className="text-zinc-500">Carregando...</p>}
      <div className="grid grid-cols-3 gap-4">
        {slideSets.map((set) => (
          <div key={set.id} className="bg-zinc-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">{set.name}</p>
              <button onClick={() => deleteSlideSet(set.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
            </div>
            <p className="text-zinc-500 text-xs">{set.slideCount} slides</p>
            <div className="grid grid-cols-4 gap-1">
              {set.slides.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleProject(set, i)}
                  className="aspect-video bg-zinc-700 rounded overflow-hidden hover:ring-2 hover:ring-blue-500"
                >
                  <img src={`http://localhost:${SIDECAR_PORT}${url}`} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ImagesTab**

```tsx
// apps/desktop/src/components/media/ImagesTab.tsx
import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useGetMediaFilesQuery, useUploadMediaMutation, useDeleteMediaMutation } from "../../store/api";
import { presentImage } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function ImagesTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: images = [] } = useGetMediaFilesQuery("image");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "image" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleProject = (id: string, filename: string) => {
    const url = `/api/media/file/${id}`;
    dispatch(presentImage(url));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:image",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { url, filename },
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
          {uploading ? "Enviando..." : "Importar Imagem"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-zinc-800 rounded-lg overflow-hidden">
            <button onClick={() => handleProject(img.id, img.originalFilename)} className="w-full">
              <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${img.id}`} alt={img.originalFilename} className="w-full aspect-video object-cover" />
            </button>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteMedia(img.id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">X</button>
            </div>
            <p className="text-zinc-400 text-xs p-2 truncate">{img.originalFilename}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create VideosTab**

```tsx
// apps/desktop/src/components/media/VideosTab.tsx
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetMediaFilesQuery, useUploadMediaMutation, useDeleteMediaMutation } from "../../store/api";
import { presentVideo } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function VideosTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: videos = [] } = useGetMediaFilesQuery("video");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "video" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendVideoCommand = (id: string, action: "play" | "pause" | "seek", timestamp = 0) => {
    const url = `/api/media/file/${id}`;
    const cmd = { action, url, timestamp };
    dispatch(presentVideo(cmd));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:video",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: cmd,
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
          {uploading ? "Enviando..." : "Importar Video"}
        </button>
      </div>
      <div className="space-y-3">
        {videos.map((vid) => (
          <div key={vid.id} className="bg-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-medium">{vid.originalFilename}</p>
              <div className="flex gap-2">
                <button onClick={() => deleteMedia(vid.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
              </div>
            </div>
            {activeVideo === vid.id ? (
              <div className="space-y-2">
                <video
                  src={`http://localhost:${SIDECAR_PORT}/api/media/file/${vid.id}`}
                  className="w-full rounded-lg"
                  controls
                />
                <div className="flex gap-2">
                  <button onClick={() => sendVideoCommand(vid.id, "play")} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Projetar</button>
                  <button onClick={() => sendVideoCommand(vid.id, "pause")} className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm">Pausar</button>
                  <button onClick={() => setActiveVideo(null)} className="px-3 py-1.5 bg-zinc-700 text-white rounded text-sm">Fechar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setActiveVideo(vid.id)} className="text-blue-400 text-sm hover:underline">Abrir player</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create NoticesTab**

```tsx
// apps/desktop/src/components/media/NoticesTab.tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useGetSavedNoticesQuery, useCreateNoticeMutation, useDeleteNoticeMutation } from "../../store/api";
import { presentNotice } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function NoticesTab() {
  const dispatch = useDispatch();
  const { data: savedNotices = [] } = useGetSavedNoticesQuery();
  const [createNotice] = useCreateNoticeMutation();
  const [deleteNotice] = useDeleteNoticeMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const broadcast = (t: string, b: string) => {
    dispatch(presentNotice({ id: "", title: t, body: b, saved: false, createdAt: "" }));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:notice",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { title: t, body: b },
      }),
    });
  };

  const handleSend = () => {
    if (!title.trim()) return;
    broadcast(title, body);
    setTitle("");
    setBody("");
  };

  const handleSaveAndSend = async () => {
    if (!title.trim()) return;
    await createNotice({ title, body, save: true });
    broadcast(title, body);
    setTitle("");
    setBody("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <input
          type="text"
          placeholder="Titulo do aviso"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
        />
        <textarea
          placeholder="Corpo do aviso"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white placeholder-zinc-500 resize-none"
        />
        <div className="flex gap-2">
          <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">Enviar</button>
          <button onClick={handleSaveAndSend} className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">Salvar e Enviar</button>
        </div>
      </div>
      {savedNotices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400 uppercase">Avisos salvos</h3>
          {savedNotices.map((notice) => (
            <div key={notice.id} className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">{notice.title}</p>
                <p className="text-zinc-400 text-xs">{notice.body}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => broadcast(notice.title, notice.body)} className="text-xs text-blue-400 hover:underline">Enviar</button>
                <button onClick={() => deleteNotice(notice.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create BackgroundsTab**

```tsx
// apps/desktop/src/components/media/BackgroundsTab.tsx
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useGetMediaFilesQuery, useUploadMediaMutation, useDeleteMediaMutation } from "../../store/api";
import { setBackground } from "../../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";
import type { BackgroundConfig } from "@castlight/shared";

export function BackgroundsTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const { data: backgrounds = [] } = useGetMediaFilesQuery("background");
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();
  const [deleteMedia] = useDeleteMediaMutation();
  const [color, setColor] = useState("#000000");

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadMedia({ file, type: "background" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyBackground = (config: BackgroundConfig) => {
    dispatch(setBackground(config));
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "background:change",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: config,
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50">
          {uploading ? "Enviando..." : "Importar Background"}
        </button>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Cor solida</h3>
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
          <span className="text-zinc-400 text-sm font-mono">{color}</span>
          <button onClick={() => applyBackground({ type: "color", value: color })} className="px-3 py-1.5 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600">Aplicar</button>
          <button onClick={() => { dispatch(setBackground(null)); applyBackground({ type: "color", value: "transparent" }); }} className="px-3 py-1.5 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600">Limpar</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {backgrounds.map((bg) => (
          <div key={bg.id} className="group relative bg-zinc-800 rounded-lg overflow-hidden">
            <button onClick={() => applyBackground({ type: "image", value: `/api/media/file/${bg.id}` })} className="w-full">
              <img src={`http://localhost:${SIDECAR_PORT}/api/media/file/${bg.id}`} alt={bg.originalFilename} className="w-full aspect-video object-cover" />
            </button>
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteMedia(bg.id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update Sidebar — add Media nav item**

In `apps/desktop/src/components/Sidebar.tsx`, add to NAV_ITEMS after bible:

```typescript
  { id: "media" as const, label: "Midia", icon: "🎬" },
```

- [ ] **Step 8: Update App.tsx — add Media page**

In `apps/desktop/src/App.tsx`, add import:

```typescript
import { Media } from "./pages/Media";
```

Add to PAGES:

```typescript
const PAGES = {
  dashboard: Dashboard,
  lyrics: Lyrics,
  bible: Bible,
  media: Media,
  screens: Screens,
} as const;
```

- [ ] **Step 9: Commit**

```bash
git add apps/desktop/src/
git commit -m "feat(desktop): add Media page with slides, images, videos, notices, and backgrounds tabs"
```

---

### Task 9: Integration Verification

- [ ] **Step 1: Run all sidecar tests**

Run: `cd apps/sidecar && bun test`
Expected: All tests pass (previous + new).

- [ ] **Step 2: Start sidecar and test media upload**

Run: `bun run apps/sidecar/src/index.ts`

Test image upload:
```bash
echo "fake" > /tmp/test.jpg
curl -X POST http://localhost:3100/api/media/upload -F "file=@/tmp/test.jpg" -F "type=image"
```
Expected: 201 with MediaFile JSON.

Test media listing:
```bash
curl http://localhost:3100/api/media?type=image
```
Expected: Array with uploaded file.

- [ ] **Step 3: Test notices API**

```bash
curl -X POST http://localhost:3100/api/notices -H "Content-Type: application/json" -d '{"title":"Teste","body":"Corpo","save":true}'
curl http://localhost:3100/api/notices
```
Expected: Notice created and listed.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: verify Phase 2 full stack integration"
git push
```
