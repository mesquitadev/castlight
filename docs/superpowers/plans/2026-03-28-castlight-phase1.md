# Castlight Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core Castlight platform — Tauri operator app, Bun sidecar with WebSocket/mDNS, lyrics management, offline bible, and networked screen system.

**Architecture:** Tauri v2 desktop app (React + Rust) spawns a Bun sidecar process that runs an HTTP/WebSocket server. Devices on the LAN discover the server via mDNS and connect as presentation screens. The operator assigns roles to each screen (public, stage, monitor, etc.) and controls content (lyrics, bible verses) in real-time via Socket.IO.

**Tech Stack:** Tauri v2, React 19, TypeScript, Redux Toolkit, TailwindCSS v4, Vite, Bun, Hono, Socket.IO, SQLite (better-sqlite3), @homebridge/ciao (mDNS)

---

## File Structure

```
castlight/
├── package.json                          # Root workspace config
├── pnpm-workspace.yaml                   # pnpm workspace definition
├── turbo.json                            # Turborepo config
├── .gitignore
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                  # Re-exports
│           ├── types/
│           │   ├── screen.ts             # ScreenRole, ScreenInfo, ScreenState
│           │   ├── lyrics.ts             # Song, SongSection, SectionType
│           │   ├── bible.ts              # BibleBook, BibleChapter, BibleVerse, BibleVersion
│           │   └── events.ts             # All Socket.IO event types
│           ├── enums.ts                  # ScreenRole, SectionType, ContentType enums
│           └── constants.ts              # Ports, service names, mDNS config
├── apps/
│   ├── sidecar/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Entry: starts Hono + Socket.IO + mDNS
│   │       ├── server.ts                 # Hono app factory + Socket.IO setup
│   │       ├── db/
│   │       │   ├── connection.ts         # SQLite connection singleton
│   │       │   ├── migrate.ts            # Migration runner
│   │       │   └── migrations/
│   │       │       └── 001-initial.ts    # Songs, sections, screens, settings tables
│   │       ├── mdns/
│   │       │   └── discovery.ts          # mDNS publish/unpublish
│   │       ├── services/
│   │       │   ├── lyrics.ts             # Song CRUD + search
│   │       │   ├── bible.ts              # Bible query (book/chapter/verse)
│   │       │   └── screen.ts             # Screen registry + role assignment
│   │       ├── ws/
│   │       │   ├── handlers.ts           # Socket.IO event handlers
│   │       │   └── broadcast.ts          # Broadcast to screens by role
│   │       ├── routes/
│   │       │   ├── lyrics.ts             # REST: /api/lyrics
│   │       │   ├── bible.ts              # REST: /api/bible
│   │       │   ├── screens.ts            # REST: /api/screens
│   │       │   └── search.ts             # REST: /api/search (online lyrics)
│   │       └── __tests__/
│   │           ├── services/
│   │           │   ├── lyrics.test.ts
│   │           │   ├── bible.test.ts
│   │           │   └── screen.test.ts
│   │           ├── ws/
│   │           │   └── broadcast.test.ts
│   │           └── routes/
│   │               ├── lyrics.test.ts
│   │               └── bible.test.ts
│   └── desktop/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx                  # React entry
│       │   ├── App.tsx                   # Root layout + router
│       │   ├── store/
│       │   │   ├── index.ts              # Redux store config
│       │   │   ├── api.ts                # RTK Query base API
│       │   │   └── slices/
│       │   │       ├── screens.ts        # Connected screens state
│       │   │       ├── presentation.ts   # Current content being presented
│       │   │       └── ui.ts             # UI state (panels, modals)
│       │   ├── hooks/
│       │   │   ├── useSocket.ts          # Socket.IO connection hook
│       │   │   └── useSidecar.ts         # Sidecar health check hook
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx         # Main operator view
│       │   │   ├── Lyrics.tsx            # Lyrics library + search
│       │   │   ├── Bible.tsx             # Bible navigation + send
│       │   │   └── Screens.tsx           # Screen management
│       │   ├── components/
│       │   │   ├── Sidebar.tsx           # Navigation sidebar
│       │   │   ├── ScreenList.tsx        # Connected screens + role dropdown
│       │   │   ├── LyricsEditor.tsx      # Song section editor
│       │   │   ├── LyricsPresenter.tsx   # Live lyrics control (click to send)
│       │   │   ├── BibleNavigator.tsx    # Book > Chapter > Verse picker
│       │   │   ├── PreviewPane.tsx       # Live preview of public screen
│       │   │   └── QRCodeDialog.tsx      # QR code fallback for screen connect
│       │   └── styles/
│       │       └── app.css               # Tailwind imports + base styles
│       ├── src-tauri/
│       │   ├── Cargo.toml
│       │   ├── tauri.conf.json
│       │   ├── capabilities/
│       │   │   └── default.json
│       │   └── src/
│       │       ├── main.rs               # Tauri entry
│       │       └── lib.rs                # Sidecar spawn + Tauri commands
│       └── __tests__/
│           ├── store/
│           │   ├── screens.test.ts
│           │   └── presentation.test.ts
│           └── components/
│               ├── ScreenList.test.tsx
│               └── BibleNavigator.test.tsx
├── assets/
│   └── bibles/
│       └── acf.json                      # Almeida Corrigida Fiel (public domain)
```

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `apps/sidecar/package.json`
- Create: `apps/sidecar/tsconfig.json`
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/vite.config.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "castlight",
  "private": true,
  "scripts": {
    "dev:sidecar": "turbo run dev --filter=@castlight/sidecar",
    "dev:desktop": "turbo run dev --filter=@castlight/desktop",
    "test": "turbo run test",
    "build": "turbo run build"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5.7"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "persistent": true,
      "cache": false
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
target/
.DS_Store
*.db
*.sqlite
```

- [ ] **Step 5: Create packages/shared/package.json**

```json
{
  "name": "@castlight/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7"
  }
}
```

- [ ] **Step 6: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create packages/shared/src/index.ts (empty re-export)**

```typescript
export * from "./enums";
export * from "./constants";
export type * from "./types/screen";
export type * from "./types/lyrics";
export type * from "./types/bible";
export type * from "./types/events";
```

- [ ] **Step 8: Create apps/sidecar/package.json**

```json
{
  "name": "@castlight/sidecar",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "test": "bun test"
  },
  "dependencies": {
    "@castlight/shared": "workspace:*",
    "hono": "^4",
    "socket.io": "^4",
    "better-sqlite3": "^11",
    "@homebridge/ciao": "^1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7",
    "typescript": "^5.7"
  }
}
```

- [ ] **Step 9: Create apps/sidecar/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["bun-types"]
  },
  "include": ["src"]
}
```

- [ ] **Step 10: Create apps/desktop/package.json**

```json
{
  "name": "@castlight/desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "tauri": "tauri"
  },
  "dependencies": {
    "@castlight/shared": "workspace:*",
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "^7",
    "@reduxjs/toolkit": "^2",
    "react-redux": "^9",
    "socket.io-client": "^4",
    "qrcode.react": "^4"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^4",
    "@tailwindcss/vite": "^4",
    "vite": "^6",
    "vitest": "^3",
    "@testing-library/react": "^16",
    "jsdom": "^26",
    "typescript": "^5.7"
  }
}
```

- [ ] **Step 11: Create apps/desktop/vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
});
```

- [ ] **Step 12: Create apps/desktop/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 13: Install dependencies and verify**

Run: `pnpm install`
Expected: All packages resolve, no errors.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with shared, sidecar, and desktop packages"
```

---

### Task 2: Shared Types and Constants

**Files:**
- Create: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/types/screen.ts`
- Create: `packages/shared/src/types/lyrics.ts`
- Create: `packages/shared/src/types/bible.ts`
- Create: `packages/shared/src/types/events.ts`

- [ ] **Step 1: Create enums**

```typescript
// packages/shared/src/enums.ts
export enum ScreenRole {
  Public = "public",
  Stage = "stage",
  Stream = "stream",
  Monitor = "monitor",
  Bible = "bible",
  Tech = "tech",
}

export enum SectionType {
  Verse = "verse",
  Chorus = "chorus",
  Bridge = "bridge",
  PreChorus = "pre-chorus",
  Intro = "intro",
  Outro = "outro",
  Tag = "tag",
}

export enum ContentType {
  Lyrics = "lyrics",
  Bible = "bible",
  Blank = "blank",
  Black = "black",
}
```

- [ ] **Step 2: Create constants**

```typescript
// packages/shared/src/constants.ts
export const SIDECAR_PORT = 3100;
export const SIDECAR_WS_PATH = "/ws";
export const MDNS_SERVICE_TYPE = "_castlight._tcp.local.";
export const MDNS_SERVICE_NAME = "Castlight Server";
```

- [ ] **Step 3: Create screen types**

```typescript
// packages/shared/src/types/screen.ts
import type { ScreenRole } from "../enums";

export interface ScreenInfo {
  id: string;
  name: string;
  role: ScreenRole | null;
  userAgent: string;
  resolution: { width: number; height: number };
  connectedAt: string;
  fingerprint: string;
}

export interface ScreenState {
  screens: ScreenInfo[];
}
```

- [ ] **Step 4: Create lyrics types**

```typescript
// packages/shared/src/types/lyrics.ts
import type { SectionType } from "../enums";

export interface SongSection {
  id: string;
  type: SectionType;
  label: string;
  text: string;
  order: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string | null;
  tags: string[];
  sections: SongSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSongInput {
  title: string;
  artist: string;
  key?: string;
  tags?: string[];
  sections: Omit<SongSection, "id">[];
}
```

- [ ] **Step 5: Create bible types**

```typescript
// packages/shared/src/types/bible.ts
export interface BibleVerse {
  book: string;
  bookAbbr: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleBook {
  name: string;
  abbr: string;
  chapters: number;
}

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
}

export interface BibleReference {
  version: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
}
```

- [ ] **Step 6: Create event types**

```typescript
// packages/shared/src/types/events.ts
import type { ScreenRole, ContentType } from "../enums";
import type { SongSection } from "./lyrics";
import type { BibleVerse, BibleReference } from "./bible";
import type { ScreenInfo } from "./screen";

// Client -> Server
export interface ClientToServerEvents {
  "screen:register": (info: { userAgent: string; resolution: { width: number; height: number }; fingerprint: string }) => void;
  "bible:send": (ref: BibleReference) => void;
}

// Server -> Client
export interface ServerToClientEvents {
  "screen:registered": (screen: ScreenInfo) => void;
  "screen:role-assigned": (role: ScreenRole) => void;
  "screen:identify": () => void;
  "content:lyrics": (data: { section: SongSection; nextSection: SongSection | null; song: { title: string; artist: string; key: string | null } }) => void;
  "content:bible": (data: { verses: BibleVerse[]; reference: BibleReference }) => void;
  "content:clear": (type: ContentType) => void;
  "screens:updated": (screens: ScreenInfo[]) => void;
}

// Server -> Server (inter-service)
export interface InterServerEvents {}

// Socket data
export interface SocketData {
  screenId: string;
  role: ScreenRole | null;
}
```

- [ ] **Step 7: Verify shared package compiles**

Run: `cd packages/shared && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add types, enums, and constants for screens, lyrics, bible, and events"
```

---

### Task 3: Sidecar — SQLite Database + Migrations

**Files:**
- Create: `apps/sidecar/src/db/connection.ts`
- Create: `apps/sidecar/src/db/migrate.ts`
- Create: `apps/sidecar/src/db/migrations/001-initial.ts`
- Create: `apps/sidecar/src/__tests__/services/lyrics.test.ts` (partial — DB setup test)

- [ ] **Step 1: Write failing test for DB connection + migration**

```typescript
// apps/sidecar/src/__tests__/services/lyrics.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import Database from "better-sqlite3";
import { runMigrations } from "../../db/migrate";

describe("Database", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates songs table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='songs'").get();
    expect(tables).toBeTruthy();
  });

  it("creates song_sections table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='song_sections'").get();
    expect(tables).toBeTruthy();
  });

  it("creates screens table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='screens'").get();
    expect(tables).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/sidecar && bun test src/__tests__/services/lyrics.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create DB connection**

```typescript
// apps/sidecar/src/db/connection.ts
import Database from "better-sqlite3";
import { runMigrations } from "./migrate";
import { join } from "path";
import { homedir } from "os";
import { mkdirSync } from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = join(homedir(), ".castlight");
  mkdirSync(dataDir, { recursive: true });

  db = new Database(join(dataDir, "castlight.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);
  return db;
}

export function createTestDb(): Database.Database {
  const testDb = new Database(":memory:");
  testDb.pragma("foreign_keys = ON");
  runMigrations(testDb);
  return testDb;
}
```

- [ ] **Step 4: Create migration runner**

```typescript
// apps/sidecar/src/db/migrate.ts
import type Database from "better-sqlite3";
import { migration001 } from "./migrations/001-initial";

interface Migration {
  version: number;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [migration001];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    )
  `);

  const currentVersion = db.prepare("SELECT MAX(version) as v FROM schema_version").get() as { v: number | null };
  const current = currentVersion?.v ?? 0;

  for (const migration of migrations) {
    if (migration.version > current) {
      migration.up(db);
      db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(migration.version);
    }
  }
}
```

- [ ] **Step 5: Create initial migration**

```typescript
// apps/sidecar/src/db/migrations/001-initial.ts
import type Database from "better-sqlite3";

export const migration001 = {
  version: 1,
  up(db: Database.Database) {
    db.exec(`
      CREATE TABLE songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT '',
        key TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE song_sections (
        id TEXT PRIMARY KEY,
        song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        text TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        UNIQUE(song_id, "order")
      );

      CREATE TABLE screens (
        fingerprint TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        role TEXT,
        last_user_agent TEXT,
        last_resolution TEXT,
        last_connected_at TEXT
      );

      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  },
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/sidecar && bun test src/__tests__/services/lyrics.test.ts`
Expected: PASS — all 3 tests green.

- [ ] **Step 7: Commit**

```bash
git add apps/sidecar/src/db/ apps/sidecar/src/__tests__/
git commit -m "feat(sidecar): add SQLite database connection and initial migration"
```

---

### Task 4: Sidecar — Lyrics Service

**Files:**
- Create: `apps/sidecar/src/services/lyrics.ts`
- Update: `apps/sidecar/src/__tests__/services/lyrics.test.ts`

- [ ] **Step 1: Write failing tests for lyrics CRUD**

```typescript
// apps/sidecar/src/__tests__/services/lyrics.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import Database from "better-sqlite3";
import { runMigrations } from "../../db/migrate";
import { LyricsService } from "../../services/lyrics";

describe("Database", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates songs table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='songs'").get();
    expect(tables).toBeTruthy();
  });

  it("creates song_sections table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='song_sections'").get();
    expect(tables).toBeTruthy();
  });

  it("creates screens table", () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='screens'").get();
    expect(tables).toBeTruthy();
  });
});

describe("LyricsService", () => {
  let db: Database.Database;
  let service: LyricsService;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    service = new LyricsService(db);
  });

  afterEach(() => {
    db.close();
  });

  it("creates a song with sections", () => {
    const song = service.create({
      title: "Grande e o Senhor",
      artist: "Adhemar de Campos",
      key: "G",
      tags: ["louvor"],
      sections: [
        { type: "verse", label: "Verso 1", text: "Grande e o Senhor\nE mui digno de louvor", order: 0 },
        { type: "chorus", label: "Refrao", text: "Na cidade do nosso Deus\nSeu santo monte", order: 1 },
      ],
    });

    expect(song.id).toBeDefined();
    expect(song.title).toBe("Grande e o Senhor");
    expect(song.sections).toHaveLength(2);
    expect(song.sections[0].type).toBe("verse");
    expect(song.sections[1].type).toBe("chorus");
  });

  it("lists all songs", () => {
    service.create({ title: "Song A", artist: "Artist", sections: [{ type: "verse", label: "V1", text: "text", order: 0 }] });
    service.create({ title: "Song B", artist: "Artist", sections: [{ type: "verse", label: "V1", text: "text", order: 0 }] });

    const songs = service.list();
    expect(songs).toHaveLength(2);
  });

  it("gets a song by id", () => {
    const created = service.create({ title: "Test", artist: "A", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    const found = service.getById(created.id);

    expect(found).toBeTruthy();
    expect(found!.title).toBe("Test");
    expect(found!.sections).toHaveLength(1);
  });

  it("returns null for non-existent song", () => {
    const found = service.getById("non-existent");
    expect(found).toBeNull();
  });

  it("updates a song", () => {
    const created = service.create({ title: "Old", artist: "A", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    const updated = service.update(created.id, { title: "New Title" });

    expect(updated.title).toBe("New Title");
  });

  it("deletes a song and its sections", () => {
    const created = service.create({ title: "Delete Me", artist: "A", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    service.delete(created.id);

    expect(service.getById(created.id)).toBeNull();
  });

  it("searches songs by title", () => {
    service.create({ title: "Grande e o Senhor", artist: "Adhemar", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    service.create({ title: "Quao Grande es Tu", artist: "Outro", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });
    service.create({ title: "Oceanos", artist: "Hillsong", sections: [{ type: "verse", label: "V1", text: "t", order: 0 }] });

    const results = service.search("grande");
    expect(results).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/services/lyrics.test.ts`
Expected: FAIL — LyricsService not found.

- [ ] **Step 3: Implement LyricsService**

```typescript
// apps/sidecar/src/services/lyrics.ts
import type Database from "better-sqlite3";
import type { Song, CreateSongInput } from "@castlight/shared";
import { randomUUID } from "crypto";

export class LyricsService {
  constructor(private db: Database.Database) {}

  create(input: CreateSongInput): Song {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO songs (id, title, artist, key, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, input.title, input.artist, input.key ?? null, JSON.stringify(input.tags ?? []), now, now);

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
      key: row.key,
      tags: JSON.parse(row.tags),
      sections: sections.map((s: any) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        text: s.text,
        order: s.order,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/services/lyrics.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/src/services/lyrics.ts apps/sidecar/src/__tests__/services/lyrics.test.ts
git commit -m "feat(sidecar): add lyrics service with CRUD and search"
```

---

### Task 5: Sidecar — Bible Service

**Files:**
- Create: `assets/bibles/acf.json` (sample structure — full data loaded later)
- Create: `apps/sidecar/src/services/bible.ts`
- Create: `apps/sidecar/src/__tests__/services/bible.test.ts`

- [ ] **Step 1: Create sample Bible data file**

```json
// assets/bibles/acf.json (truncated — only Genesis 1:1-3 and John 3:16 for testing)
{
  "version": { "id": "acf", "name": "Almeida Corrigida Fiel", "language": "pt" },
  "books": [
    {
      "name": "Genesis",
      "abbr": "Gn",
      "chapters": [
        {
          "chapter": 1,
          "verses": [
            { "verse": 1, "text": "No principio criou Deus os ceus e a terra." },
            { "verse": 2, "text": "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espirito de Deus se movia sobre a face das aguas." },
            { "verse": 3, "text": "E disse Deus: Haja luz. E houve luz." }
          ]
        }
      ]
    },
    {
      "name": "Joao",
      "abbr": "Jo",
      "chapters": [
        {
          "chapter": 3,
          "verses": [
            { "verse": 16, "text": "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna." }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/services/bible.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { BibleService } from "../../services/bible";
import { join } from "path";

describe("BibleService", () => {
  let service: BibleService;

  beforeEach(() => {
    const biblesDir = join(import.meta.dir, "../../../../assets/bibles");
    service = new BibleService(biblesDir);
  });

  it("lists available versions", () => {
    const versions = service.getVersions();
    expect(versions.length).toBeGreaterThanOrEqual(1);
    expect(versions[0].id).toBe("acf");
  });

  it("lists books for a version", () => {
    const books = service.getBooks("acf");
    expect(books.length).toBeGreaterThanOrEqual(1);
    expect(books[0].name).toBe("Genesis");
    expect(books[0].abbr).toBe("Gn");
  });

  it("gets verses by reference", () => {
    const verses = service.getVerses({ version: "acf", book: "Genesis", chapter: 1, verseStart: 1, verseEnd: 3 });
    expect(verses).toHaveLength(3);
    expect(verses[0].text).toContain("No principio");
    expect(verses[2].text).toContain("Haja luz");
  });

  it("gets a single verse", () => {
    const verses = service.getVerses({ version: "acf", book: "Joao", chapter: 3, verseStart: 16 });
    expect(verses).toHaveLength(1);
    expect(verses[0].text).toContain("Deus amou o mundo");
  });

  it("returns empty for invalid reference", () => {
    const verses = service.getVerses({ version: "acf", book: "Invalid", chapter: 1, verseStart: 1 });
    expect(verses).toHaveLength(0);
  });

  it("searches verses by text", () => {
    const results = service.searchText("acf", "Haja luz");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].text).toContain("Haja luz");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/services/bible.test.ts`
Expected: FAIL — BibleService not found.

- [ ] **Step 4: Implement BibleService**

```typescript
// apps/sidecar/src/services/bible.ts
import type { BibleVerse, BibleBook, BibleVersion, BibleReference } from "@castlight/shared";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

interface BibleData {
  version: BibleVersion;
  books: {
    name: string;
    abbr: string;
    chapters: {
      chapter: number;
      verses: { verse: number; text: string }[];
    }[];
  }[];
}

export class BibleService {
  private bibles = new Map<string, BibleData>();

  constructor(biblesDir: string) {
    const files = readdirSync(biblesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const data: BibleData = JSON.parse(readFileSync(join(biblesDir, file), "utf-8"));
      this.bibles.set(data.version.id, data);
    }
  }

  getVersions(): BibleVersion[] {
    return Array.from(this.bibles.values()).map((b) => b.version);
  }

  getBooks(versionId: string): BibleBook[] {
    const bible = this.bibles.get(versionId);
    if (!bible) return [];
    return bible.books.map((b) => ({
      name: b.name,
      abbr: b.abbr,
      chapters: b.chapters.length,
    }));
  }

  getChapterCount(versionId: string, bookName: string): number {
    const bible = this.bibles.get(versionId);
    if (!bible) return 0;
    const book = bible.books.find((b) => b.name === bookName || b.abbr === bookName);
    return book?.chapters.length ?? 0;
  }

  getVerses(ref: BibleReference): BibleVerse[] {
    const bible = this.bibles.get(ref.version);
    if (!bible) return [];

    const book = bible.books.find((b) => b.name === ref.book || b.abbr === ref.book);
    if (!book) return [];

    const chapter = book.chapters.find((c) => c.chapter === ref.chapter);
    if (!chapter) return [];

    const end = ref.verseEnd ?? ref.verseStart;
    return chapter.verses
      .filter((v) => v.verse >= ref.verseStart && v.verse <= end)
      .map((v) => ({
        book: book.name,
        bookAbbr: book.abbr,
        chapter: ref.chapter,
        verse: v.verse,
        text: v.text,
      }));
  }

  searchText(versionId: string, query: string): BibleVerse[] {
    const bible = this.bibles.get(versionId);
    if (!bible) return [];

    const results: BibleVerse[] = [];
    const lowerQuery = query.toLowerCase();

    for (const book of bible.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(lowerQuery)) {
            results.push({
              book: book.name,
              bookAbbr: book.abbr,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text,
            });
          }
        }
      }
    }

    return results;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/services/bible.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/sidecar/src/services/bible.ts apps/sidecar/src/__tests__/services/bible.test.ts assets/bibles/
git commit -m "feat(sidecar): add bible service with offline JSON lookup and text search"
```

---

### Task 6: Sidecar — Screen Service

**Files:**
- Create: `apps/sidecar/src/services/screen.ts`
- Create: `apps/sidecar/src/__tests__/services/screen.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/services/screen.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import Database from "better-sqlite3";
import { runMigrations } from "../../db/migrate";
import { ScreenService } from "../../services/screen";
import { ScreenRole } from "@castlight/shared";

describe("ScreenService", () => {
  let db: Database.Database;
  let service: ScreenService;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    service = new ScreenService(db);
  });

  afterEach(() => {
    db.close();
  });

  it("registers a new screen", () => {
    const screen = service.register({
      socketId: "sock1",
      userAgent: "Mozilla/5.0",
      resolution: { width: 1920, height: 1080 },
      fingerprint: "fp-abc",
    });

    expect(screen.id).toBe("sock1");
    expect(screen.fingerprint).toBe("fp-abc");
    expect(screen.role).toBeNull();
  });

  it("remembers role from previous connection (same fingerprint)", () => {
    service.register({ socketId: "sock1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp-abc" });
    service.assignRole("sock1", ScreenRole.Public);
    service.unregister("sock1");

    const screen = service.register({ socketId: "sock2", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp-abc" });
    expect(screen.role).toBe(ScreenRole.Public);
  });

  it("lists connected screens", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.register({ socketId: "s2", userAgent: "M", resolution: { width: 1280, height: 720 }, fingerprint: "fp2" });

    const screens = service.listConnected();
    expect(screens).toHaveLength(2);
  });

  it("assigns role to a screen", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.assignRole("s1", ScreenRole.Stage);

    const screens = service.listConnected();
    expect(screens[0].role).toBe(ScreenRole.Stage);
  });

  it("unregisters a screen", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.unregister("s1");

    expect(service.listConnected()).toHaveLength(0);
  });

  it("gets screens by role", () => {
    service.register({ socketId: "s1", userAgent: "M", resolution: { width: 1920, height: 1080 }, fingerprint: "fp1" });
    service.register({ socketId: "s2", userAgent: "M", resolution: { width: 1280, height: 720 }, fingerprint: "fp2" });
    service.assignRole("s1", ScreenRole.Public);
    service.assignRole("s2", ScreenRole.Stage);

    const publicScreens = service.getByRole(ScreenRole.Public);
    expect(publicScreens).toHaveLength(1);
    expect(publicScreens[0].id).toBe("s1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/services/screen.test.ts`
Expected: FAIL — ScreenService not found.

- [ ] **Step 3: Implement ScreenService**

```typescript
// apps/sidecar/src/services/screen.ts
import type Database from "better-sqlite3";
import type { ScreenInfo, ScreenRole } from "@castlight/shared";

interface RegisterInput {
  socketId: string;
  userAgent: string;
  resolution: { width: number; height: number };
  fingerprint: string;
}

export class ScreenService {
  private connected = new Map<string, ScreenInfo>();

  constructor(private db: Database.Database) {}

  register(input: RegisterInput): ScreenInfo {
    // Check if this fingerprint has a remembered role
    const remembered = this.db.prepare("SELECT role, name FROM screens WHERE fingerprint = ?").get(input.fingerprint) as { role: string | null; name: string } | undefined;

    const screen: ScreenInfo = {
      id: input.socketId,
      name: remembered?.name || "",
      role: (remembered?.role as ScreenRole) ?? null,
      userAgent: input.userAgent,
      resolution: input.resolution,
      connectedAt: new Date().toISOString(),
      fingerprint: input.fingerprint,
    };

    this.connected.set(input.socketId, screen);

    // Upsert to DB for persistence
    this.db.prepare(`
      INSERT INTO screens (fingerprint, name, role, last_user_agent, last_resolution, last_connected_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(fingerprint) DO UPDATE SET
        last_user_agent = excluded.last_user_agent,
        last_resolution = excluded.last_resolution,
        last_connected_at = excluded.last_connected_at
    `).run(
      input.fingerprint,
      screen.name,
      screen.role,
      input.userAgent,
      JSON.stringify(input.resolution),
      screen.connectedAt,
    );

    return screen;
  }

  assignRole(socketId: string, role: ScreenRole): ScreenInfo | null {
    const screen = this.connected.get(socketId);
    if (!screen) return null;

    screen.role = role;
    this.db.prepare("UPDATE screens SET role = ? WHERE fingerprint = ?").run(role, screen.fingerprint);
    return screen;
  }

  unregister(socketId: string): void {
    this.connected.delete(socketId);
  }

  listConnected(): ScreenInfo[] {
    return Array.from(this.connected.values());
  }

  getByRole(role: ScreenRole): ScreenInfo[] {
    return this.listConnected().filter((s) => s.role === role);
  }

  getBySocketId(socketId: string): ScreenInfo | null {
    return this.connected.get(socketId) ?? null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/services/screen.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/src/services/screen.ts apps/sidecar/src/__tests__/services/screen.test.ts
git commit -m "feat(sidecar): add screen service with registration, role assignment, and persistence"
```

---

### Task 7: Sidecar — WebSocket Broadcast

**Files:**
- Create: `apps/sidecar/src/ws/broadcast.ts`
- Create: `apps/sidecar/src/__tests__/ws/broadcast.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/sidecar/src/__tests__/ws/broadcast.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Broadcaster } from "../../ws/broadcast";
import { ScreenRole } from "@castlight/shared";

// Minimal mock for Socket.IO server
function createMockIO() {
  const emissions: { room: string; event: string; data: any }[] = [];
  return {
    emissions,
    to(room: string) {
      return {
        emit(event: string, data: any) {
          emissions.push({ room, event, data });
        },
      };
    },
    emit(event: string, data: any) {
      emissions.push({ room: "__all__", event, data });
    },
  };
}

describe("Broadcaster", () => {
  let mockIO: ReturnType<typeof createMockIO>;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    mockIO = createMockIO();
    broadcaster = new Broadcaster(mockIO as any);
  });

  it("broadcasts to a specific role", () => {
    broadcaster.toRole(ScreenRole.Public, "content:lyrics", { section: { text: "Hello" } });

    expect(mockIO.emissions).toHaveLength(1);
    expect(mockIO.emissions[0].room).toBe("role:public");
    expect(mockIO.emissions[0].event).toBe("content:lyrics");
  });

  it("broadcasts to all screens", () => {
    broadcaster.toAll("screens:updated", []);

    expect(mockIO.emissions).toHaveLength(1);
    expect(mockIO.emissions[0].room).toBe("__all__");
  });

  it("broadcasts to multiple roles", () => {
    broadcaster.toRoles([ScreenRole.Public, ScreenRole.Stage], "content:bible", { text: "verse" });

    expect(mockIO.emissions).toHaveLength(2);
    expect(mockIO.emissions[0].room).toBe("role:public");
    expect(mockIO.emissions[1].room).toBe("role:stage");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/sidecar && bun test src/__tests__/ws/broadcast.test.ts`
Expected: FAIL — Broadcaster not found.

- [ ] **Step 3: Implement Broadcaster**

```typescript
// apps/sidecar/src/ws/broadcast.ts
import type { Server } from "socket.io";
import type { ScreenRole, ServerToClientEvents } from "@castlight/shared";

export class Broadcaster {
  constructor(private io: Server) {}

  toRole<E extends keyof ServerToClientEvents>(role: ScreenRole, event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    this.io.to(`role:${role}`).emit(event, ...(args as any[]));
  }

  toRoles<E extends keyof ServerToClientEvents>(roles: ScreenRole[], event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    for (const role of roles) {
      this.toRole(role, event, ...args);
    }
  }

  toAll<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    this.io.emit(event, ...(args as any[]));
  }

  toSocket<E extends keyof ServerToClientEvents>(socketId: string, event: E, ...args: Parameters<ServerToClientEvents[E]>): void {
    this.io.to(socketId).emit(event, ...(args as any[]));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/sidecar && bun test src/__tests__/ws/broadcast.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sidecar/src/ws/ apps/sidecar/src/__tests__/ws/
git commit -m "feat(sidecar): add WebSocket broadcaster with role-based and global emission"
```

---

### Task 8: Sidecar — WebSocket Handlers

**Files:**
- Create: `apps/sidecar/src/ws/handlers.ts`

- [ ] **Step 1: Implement WebSocket handlers**

```typescript
// apps/sidecar/src/ws/handlers.ts
import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@castlight/shared";
import { ScreenRole } from "@castlight/shared";
import type { ScreenService } from "../services/screen";
import type { BibleService } from "../services/bible";
import type { Broadcaster } from "./broadcast";

interface HandlerDeps {
  screenService: ScreenService;
  bibleService: BibleService;
  broadcaster: Broadcaster;
}

export function registerHandlers(io: Server, deps: HandlerDeps): void {
  const { screenService, bibleService, broadcaster } = deps;

  io.on("connection", (socket: Socket) => {
    console.log(`[ws] client connected: ${socket.id}`);

    socket.on("screen:register", (info) => {
      const screen = screenService.register({
        socketId: socket.id,
        userAgent: info.userAgent,
        resolution: info.resolution,
        fingerprint: info.fingerprint,
      });

      // Join role room if previously assigned
      if (screen.role) {
        socket.join(`role:${screen.role}`);
      }

      socket.emit("screen:registered", screen);
      broadcaster.toAll("screens:updated", screenService.listConnected());
    });

    socket.on("bible:send", (ref) => {
      const verses = bibleService.getVerses(ref);
      const data = { verses, reference: ref };

      // Send to public, stage, monitor, and stream screens
      broadcaster.toRoles(
        [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Monitor, ScreenRole.Stream],
        "content:bible",
        data,
      );
    });

    socket.on("disconnect", () => {
      console.log(`[ws] client disconnected: ${socket.id}`);
      screenService.unregister(socket.id);
      broadcaster.toAll("screens:updated", screenService.listConnected());
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/sidecar/src/ws/handlers.ts
git commit -m "feat(sidecar): add WebSocket event handlers for screen registration and bible send"
```

---

### Task 9: Sidecar — HTTP Routes

**Files:**
- Create: `apps/sidecar/src/routes/lyrics.ts`
- Create: `apps/sidecar/src/routes/bible.ts`
- Create: `apps/sidecar/src/routes/screens.ts`

- [ ] **Step 1: Create lyrics routes**

```typescript
// apps/sidecar/src/routes/lyrics.ts
import { Hono } from "hono";
import type { LyricsService } from "../services/lyrics";

export function lyricsRoutes(service: LyricsService): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    const query = c.req.query("q");
    if (query) return c.json(service.search(query));
    return c.json(service.list());
  });

  app.get("/:id", (c) => {
    const song = service.getById(c.req.param("id"));
    if (!song) return c.json({ error: "Song not found" }, 404);
    return c.json(song);
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const song = service.create(body);
    return c.json(song, 201);
  });

  app.patch("/:id", async (c) => {
    const body = await c.req.json();
    const song = service.update(c.req.param("id"), body);
    return c.json(song);
  });

  app.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 2: Create bible routes**

```typescript
// apps/sidecar/src/routes/bible.ts
import { Hono } from "hono";
import type { BibleService } from "../services/bible";

export function bibleRoutes(service: BibleService): Hono {
  const app = new Hono();

  app.get("/versions", (c) => {
    return c.json(service.getVersions());
  });

  app.get("/versions/:versionId/books", (c) => {
    return c.json(service.getBooks(c.req.param("versionId")));
  });

  app.get("/verses", (c) => {
    const version = c.req.query("version") ?? "acf";
    const book = c.req.query("book") ?? "";
    const chapter = parseInt(c.req.query("chapter") ?? "1", 10);
    const verseStart = parseInt(c.req.query("verseStart") ?? "1", 10);
    const verseEnd = c.req.query("verseEnd") ? parseInt(c.req.query("verseEnd")!, 10) : undefined;

    const verses = service.getVerses({ version, book, chapter, verseStart, verseEnd });
    return c.json(verses);
  });

  app.get("/search", (c) => {
    const version = c.req.query("version") ?? "acf";
    const q = c.req.query("q") ?? "";
    return c.json(service.searchText(version, q));
  });

  return app;
}
```

- [ ] **Step 3: Create screens routes**

```typescript
// apps/sidecar/src/routes/screens.ts
import { Hono } from "hono";
import type { ScreenService } from "../services/screen";
import type { Server } from "socket.io";
import type { ScreenRole } from "@castlight/shared";

export function screenRoutes(service: ScreenService, io: Server): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json(service.listConnected());
  });

  app.post("/:socketId/role", async (c) => {
    const { role } = await c.req.json<{ role: ScreenRole }>();
    const socketId = c.req.param("socketId");

    const screen = service.assignRole(socketId, role);
    if (!screen) return c.json({ error: "Screen not found" }, 404);

    // Update socket room
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      // Leave all role rooms first
      for (const room of socket.rooms) {
        if (room.startsWith("role:")) socket.leave(room);
      }
      socket.join(`role:${role}`);
      socket.emit("screen:role-assigned", role);
    }

    return c.json(screen);
  });

  app.post("/:socketId/identify", (c) => {
    const socketId = c.req.param("socketId");
    const socket = io.sockets.sockets.get(socketId);
    if (socket) socket.emit("screen:identify");
    return c.json({ ok: true });
  });

  return app;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/src/routes/
git commit -m "feat(sidecar): add REST routes for lyrics, bible, and screen management"
```

---

### Task 10: Sidecar — mDNS Discovery

**Files:**
- Create: `apps/sidecar/src/mdns/discovery.ts`

- [ ] **Step 1: Implement mDNS service**

```typescript
// apps/sidecar/src/mdns/discovery.ts
import ciao from "@homebridge/ciao";
import { SIDECAR_PORT, MDNS_SERVICE_NAME } from "@castlight/shared";
import { networkInterfaces } from "os";

let responder: ciao.CiaoService | null = null;

export function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

export async function publishService(port: number = SIDECAR_PORT): Promise<void> {
  const ciaoInstance = ciao.getResponder();
  const service = ciaoInstance.createService({
    name: MDNS_SERVICE_NAME,
    type: ciao.Protocol.TCP,
    port,
    txt: {
      version: "0.1.0",
      ip: getLocalIP(),
    },
  });

  responder = service;
  await service.advertise();
  console.log(`[mdns] published ${MDNS_SERVICE_NAME} on port ${port}`);
}

export async function unpublishService(): Promise<void> {
  if (responder) {
    await responder.end();
    responder = null;
    console.log("[mdns] service unpublished");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/sidecar/src/mdns/
git commit -m "feat(sidecar): add mDNS service discovery via @homebridge/ciao"
```

---

### Task 11: Sidecar — Server Entry Point

**Files:**
- Create: `apps/sidecar/src/server.ts`
- Create: `apps/sidecar/src/index.ts`

- [ ] **Step 1: Create server factory**

```typescript
// apps/sidecar/src/server.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type Database from "better-sqlite3";

import { LyricsService } from "./services/lyrics";
import { BibleService } from "./services/bible";
import { ScreenService } from "./services/screen";
import { Broadcaster } from "./ws/broadcast";
import { registerHandlers } from "./ws/handlers";
import { lyricsRoutes } from "./routes/lyrics";
import { bibleRoutes } from "./routes/bible";
import { screenRoutes } from "./routes/screens";
import { SIDECAR_WS_PATH } from "@castlight/shared";

export interface AppContext {
  db: Database.Database;
  biblesDir: string;
}

export function createApp(ctx: AppContext) {
  const app = new Hono();
  app.use("*", cors());

  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    path: SIDECAR_WS_PATH,
    cors: { origin: "*" },
  });

  // Services
  const lyricsService = new LyricsService(ctx.db);
  const bibleService = new BibleService(ctx.biblesDir);
  const screenService = new ScreenService(ctx.db);
  const broadcaster = new Broadcaster(io);

  // WebSocket
  registerHandlers(io, { screenService, bibleService, broadcaster });

  // Routes
  app.route("/api/lyrics", lyricsRoutes(lyricsService));
  app.route("/api/bible", bibleRoutes(bibleService));
  app.route("/api/screens", screenRoutes(screenService, io));

  app.get("/api/health", (c) => c.json({ status: "ok", ip: import("./mdns/discovery").then((m) => m.getLocalIP()) }));

  return { app, httpServer, io };
}
```

- [ ] **Step 2: Create entry point**

```typescript
// apps/sidecar/src/index.ts
import Database from "better-sqlite3";
import { join } from "path";
import { homedir } from "os";
import { mkdirSync } from "fs";
import { SIDECAR_PORT } from "@castlight/shared";
import { runMigrations } from "./db/migrate";
import { createApp } from "./server";
import { publishService } from "./mdns/discovery";

// Data directory
const dataDir = join(homedir(), ".castlight");
mkdirSync(dataDir, { recursive: true });

// Database
const db = new Database(join(dataDir, "castlight.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
runMigrations(db);

// Bible assets path
const biblesDir = join(import.meta.dir, "../../assets/bibles");

// Create and start
const { app, httpServer } = createApp({ db, biblesDir });

// Mount Hono on the HTTP server
httpServer.on("request", (req, res) => {
  app.fetch(
    new Request(`http://localhost:${SIDECAR_PORT}${req.url}`, {
      method: req.method,
      headers: req.headers as any,
      body: req.method !== "GET" && req.method !== "HEAD" ? req : undefined,
    }),
  ).then((response) => {
    res.writeHead(response.status, Object.fromEntries(response.headers));
    response.body?.pipeTo(
      new WritableStream({
        write(chunk) { res.write(chunk); },
        close() { res.end(); },
      }),
    );
  });
});

httpServer.listen(SIDECAR_PORT, () => {
  console.log(`[castlight] sidecar running on http://localhost:${SIDECAR_PORT}`);
  publishService(SIDECAR_PORT);
});

// Graceful shutdown
process.on("SIGINT", () => {
  db.close();
  httpServer.close();
  process.exit(0);
});
```

- [ ] **Step 3: Verify sidecar starts**

Run: `cd apps/sidecar && bun run src/index.ts`
Expected: `[castlight] sidecar running on http://localhost:3100`

- [ ] **Step 4: Commit**

```bash
git add apps/sidecar/src/server.ts apps/sidecar/src/index.ts
git commit -m "feat(sidecar): add server entry point with Hono, Socket.IO, and mDNS startup"
```

---

### Task 12: Tauri App — Shell + Sidecar Lifecycle

**Files:**
- Create: `apps/desktop/src-tauri/Cargo.toml`
- Create: `apps/desktop/src-tauri/tauri.conf.json`
- Create: `apps/desktop/src-tauri/capabilities/default.json`
- Create: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/lib.rs`
- Create: `apps/desktop/index.html`

- [ ] **Step 1: Create Cargo.toml**

```toml
# apps/desktop/src-tauri/Cargo.toml
[package]
name = "castlight"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["shell-open"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 2: Create tauri.conf.json**

```json
{
  "$schema": "https://raw.githubusercontent.com/nicedoc/tauri/dev/.schema/config.schema.json",
  "productName": "Castlight",
  "identifier": "com.castlight.app",
  "version": "0.1.0",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "title": "Castlight",
    "windows": [
      {
        "title": "Castlight",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "externalBin": ["sidecar"]
  }
}
```

- [ ] **Step 3: Create capabilities/default.json**

```json
{
  "$schema": "https://raw.githubusercontent.com/nicedoc/tauri/dev/.schema/capabilities.schema.json",
  "identifier": "default",
  "description": "Default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "shell:allow-execute",
    "shell:allow-spawn"
  ]
}
```

- [ ] **Step 4: Create main.rs**

```rust
// apps/desktop/src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    castlight_lib::run();
}
```

- [ ] **Step 5: Create lib.rs with sidecar management**

```rust
// apps/desktop/src-tauri/src/lib.rs
use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;

struct SidecarState(Mutex<Option<Child>>);

#[tauri::command]
fn get_sidecar_port() -> u16 {
    3100
}

fn start_sidecar() -> Option<Child> {
    // In development, sidecar is started separately
    if cfg!(debug_assertions) {
        println!("[tauri] dev mode — sidecar managed externally");
        return None;
    }

    let child = Command::new("bun")
        .arg("run")
        .arg("sidecar/index.js")
        .spawn()
        .ok();

    if child.is_some() {
        println!("[tauri] sidecar started");
    }
    child
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let child = start_sidecar();
            app.manage(SidecarState(Mutex::new(child)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_sidecar_port])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<SidecarState>();
                if let Ok(mut child) = state.0.lock() {
                    if let Some(ref mut c) = *child {
                        let _ = c.kill();
                        println!("[tauri] sidecar stopped");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running castlight");
}
```

- [ ] **Step 6: Create index.html**

```html
<!-- apps/desktop/index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Castlight</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src-tauri/ apps/desktop/index.html
git commit -m "feat(desktop): add Tauri shell with sidecar lifecycle management"
```

---

### Task 13: Desktop — Redux Store + RTK Query

**Files:**
- Create: `apps/desktop/src/store/index.ts`
- Create: `apps/desktop/src/store/api.ts`
- Create: `apps/desktop/src/store/slices/screens.ts`
- Create: `apps/desktop/src/store/slices/presentation.ts`
- Create: `apps/desktop/src/store/slices/ui.ts`

- [ ] **Step 1: Create RTK Query base API**

```typescript
// apps/desktop/src/store/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Song, CreateSongInput, BibleVersion, BibleBook, BibleVerse } from "@castlight/shared";

const SIDECAR_URL = "http://localhost:3100";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${SIDECAR_URL}/api` }),
  tagTypes: ["Songs", "Screens"],
  endpoints: (builder) => ({
    // Lyrics
    getSongs: builder.query<Song[], string | void>({
      query: (search) => search ? `/lyrics?q=${search}` : "/lyrics",
      providesTags: ["Songs"],
    }),
    getSong: builder.query<Song, string>({
      query: (id) => `/lyrics/${id}`,
    }),
    createSong: builder.mutation<Song, CreateSongInput>({
      query: (body) => ({ url: "/lyrics", method: "POST", body }),
      invalidatesTags: ["Songs"],
    }),
    updateSong: builder.mutation<Song, { id: string; body: Partial<Song> }>({
      query: ({ id, body }) => ({ url: `/lyrics/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Songs"],
    }),
    deleteSong: builder.mutation<void, string>({
      query: (id) => ({ url: `/lyrics/${id}`, method: "DELETE" }),
      invalidatesTags: ["Songs"],
    }),

    // Bible
    getBibleVersions: builder.query<BibleVersion[], void>({
      query: () => "/bible/versions",
    }),
    getBibleBooks: builder.query<BibleBook[], string>({
      query: (versionId) => `/bible/versions/${versionId}/books`,
    }),
    getBibleVerses: builder.query<BibleVerse[], { version: string; book: string; chapter: number; verseStart: number; verseEnd?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams({
          version: params.version,
          book: params.book,
          chapter: String(params.chapter),
          verseStart: String(params.verseStart),
        });
        if (params.verseEnd) searchParams.set("verseEnd", String(params.verseEnd));
        return `/bible/verses?${searchParams}`;
      },
    }),
    searchBible: builder.query<BibleVerse[], { version: string; q: string }>({
      query: ({ version, q }) => `/bible/search?version=${version}&q=${q}`,
    }),
  }),
});

export const {
  useGetSongsQuery,
  useGetSongQuery,
  useCreateSongMutation,
  useUpdateSongMutation,
  useDeleteSongMutation,
  useGetBibleVersionsQuery,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
  useSearchBibleQuery,
} = api;
```

- [ ] **Step 2: Create screens slice**

```typescript
// apps/desktop/src/store/slices/screens.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ScreenInfo } from "@castlight/shared";

interface ScreensState {
  connected: ScreenInfo[];
}

const initialState: ScreensState = {
  connected: [],
};

export const screensSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    setScreens(state, action: PayloadAction<ScreenInfo[]>) {
      state.connected = action.payload;
    },
  },
});

export const { setScreens } = screensSlice.actions;
```

- [ ] **Step 3: Create presentation slice**

```typescript
// apps/desktop/src/store/slices/presentation.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SongSection, BibleVerse, BibleReference } from "@castlight/shared";
import { ContentType } from "@castlight/shared";

interface PresentationState {
  contentType: ContentType;
  currentSection: SongSection | null;
  nextSection: SongSection | null;
  currentSong: { title: string; artist: string; key: string | null } | null;
  currentVerses: BibleVerse[] | null;
  currentReference: BibleReference | null;
}

const initialState: PresentationState = {
  contentType: ContentType.Blank,
  currentSection: null,
  nextSection: null,
  currentSong: null,
  currentVerses: null,
  currentReference: null,
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
    clearPresentation(state) {
      state.contentType = ContentType.Blank;
      state.currentSection = null;
      state.nextSection = null;
      state.currentSong = null;
      state.currentVerses = null;
      state.currentReference = null;
    },
    blackout(state) {
      state.contentType = ContentType.Black;
    },
  },
});

export const { presentLyrics, presentBible, clearPresentation, blackout } = presentationSlice.actions;
```

- [ ] **Step 4: Create UI slice**

```typescript
// apps/desktop/src/store/slices/ui.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ActivePanel = "lyrics" | "bible" | "screens" | "dashboard";

interface UIState {
  activePanel: ActivePanel;
  qrDialogOpen: boolean;
}

const initialState: UIState = {
  activePanel: "dashboard",
  qrDialogOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<ActivePanel>) {
      state.activePanel = action.payload;
    },
    toggleQRDialog(state) {
      state.qrDialogOpen = !state.qrDialogOpen;
    },
  },
});

export const { setActivePanel, toggleQRDialog } = uiSlice.actions;
```

- [ ] **Step 5: Create store config**

```typescript
// apps/desktop/src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import { screensSlice } from "./slices/screens";
import { presentationSlice } from "./slices/presentation";
import { uiSlice } from "./slices/ui";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    screens: screensSlice.reducer,
    presentation: presentationSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/store/
git commit -m "feat(desktop): add Redux store with RTK Query API, screens, presentation, and UI slices"
```

---

### Task 14: Desktop — Socket.IO Hook

**Files:**
- Create: `apps/desktop/src/hooks/useSocket.ts`

- [ ] **Step 1: Implement socket hook**

```typescript
// apps/desktop/src/hooks/useSocket.ts
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { setScreens } from "../store/slices/screens";
import type { ServerToClientEvents, ClientToServerEvents } from "@castlight/shared";
import { SIDECAR_PORT, SIDECAR_WS_PATH } from "@castlight/shared";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SIDECAR_URL = `http://localhost:${SIDECAR_PORT}`;

export function useSocket(): TypedSocket | null {
  const socketRef = useRef<TypedSocket | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const socket: TypedSocket = io(SIDECAR_URL, {
      path: SIDECAR_WS_PATH,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[socket] connected to sidecar");
    });

    socket.on("screens:updated", (screens) => {
      dispatch(setScreens(screens));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  return socketRef.current;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/hooks/
git commit -m "feat(desktop): add Socket.IO hook with screen state sync"
```

---

### Task 15: Desktop — App Shell + Router + Sidebar

**Files:**
- Create: `apps/desktop/src/main.tsx`
- Create: `apps/desktop/src/App.tsx`
- Create: `apps/desktop/src/styles/app.css`
- Create: `apps/desktop/src/components/Sidebar.tsx`
- Create: `apps/desktop/src/pages/Dashboard.tsx`
- Create: `apps/desktop/src/pages/Lyrics.tsx`
- Create: `apps/desktop/src/pages/Bible.tsx`
- Create: `apps/desktop/src/pages/Screens.tsx`

- [ ] **Step 1: Create main.tsx**

```tsx
// apps/desktop/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import { App } from "./App";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
```

- [ ] **Step 2: Create app.css**

```css
/* apps/desktop/src/styles/app.css */
@import "tailwindcss";
```

- [ ] **Step 3: Create Sidebar**

```tsx
// apps/desktop/src/components/Sidebar.tsx
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { setActivePanel } from "../store/slices/ui";

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", icon: "🏠" },
  { id: "lyrics" as const, label: "Letras", icon: "🎵" },
  { id: "bible" as const, label: "Biblia", icon: "📖" },
  { id: "screens" as const, label: "Telas", icon: "🖥️" },
];

export function Sidebar() {
  const activePanel = useSelector((s: RootState) => s.ui.activePanel);
  const screenCount = useSelector((s: RootState) => s.screens.connected.length);
  const dispatch = useDispatch();

  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">Castlight</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch(setActivePanel(item.id))}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activePanel === item.id
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "screens" && screenCount > 0 && (
              <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                {screenCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Create placeholder pages**

```tsx
// apps/desktop/src/pages/Dashboard.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { ContentType } from "@castlight/shared";

export function Dashboard() {
  const presentation = useSelector((s: RootState) => s.presentation);
  const screenCount = useSelector((s: RootState) => s.screens.connected.length);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Telas conectadas</p>
          <p className="text-3xl font-bold text-white mt-1">{screenCount}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">Exibindo</p>
          <p className="text-lg font-medium text-white mt-1">
            {presentation.contentType === ContentType.Lyrics && presentation.currentSong?.title}
            {presentation.contentType === ContentType.Bible && presentation.currentReference && `${presentation.currentReference.book} ${presentation.currentReference.chapter}:${presentation.currentReference.verseStart}`}
            {presentation.contentType === ContentType.Blank && "Nada"}
            {presentation.contentType === ContentType.Black && "Tela preta"}
          </p>
        </div>
      </div>
      {/* Preview pane placeholder */}
      <div className="bg-zinc-800 rounded-xl aspect-video flex items-center justify-center">
        <p className="text-zinc-500">Preview da tela publica</p>
      </div>
    </div>
  );
}
```

```tsx
// apps/desktop/src/pages/Lyrics.tsx
import { useState } from "react";
import { useGetSongsQuery } from "../store/api";

export function Lyrics() {
  const [search, setSearch] = useState("");
  const { data: songs = [], isLoading } = useGetSongsQuery(search || undefined);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Letras</h2>
      </div>
      <input
        type="text"
        placeholder="Buscar musica..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isLoading && <p className="text-zinc-500">Carregando...</p>}
      <ul className="space-y-2">
        {songs.map((song) => (
          <li
            key={song.id}
            className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 cursor-pointer transition-colors"
          >
            <p className="text-white font-medium">{song.title}</p>
            <p className="text-zinc-400 text-sm">{song.artist}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// apps/desktop/src/pages/Bible.tsx
import { useState } from "react";
import { useGetBibleVersionsQuery, useGetBibleBooksQuery } from "../store/api";

export function Bible() {
  const { data: versions = [] } = useGetBibleVersionsQuery();
  const [selectedVersion, setSelectedVersion] = useState("acf");
  const { data: books = [] } = useGetBibleBooksQuery(selectedVersion);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Biblia</h2>
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {books.map((book) => (
          <button
            key={book.abbr}
            className="bg-zinc-800 rounded-lg p-3 text-left hover:bg-zinc-750 transition-colors"
          >
            <p className="text-white text-sm font-medium">{book.name}</p>
            <p className="text-zinc-500 text-xs">{book.chapters} cap.</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// apps/desktop/src/pages/Screens.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { ScreenRole } from "@castlight/shared";

const ROLE_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: ScreenRole.Public, label: "Publico" },
  { value: ScreenRole.Stage, label: "Retorno" },
  { value: ScreenRole.Stream, label: "Stream" },
  { value: ScreenRole.Monitor, label: "Monitor" },
  { value: ScreenRole.Bible, label: "Biblia" },
  { value: ScreenRole.Tech, label: "Tecnica" },
];

export function Screens() {
  const screens = useSelector((s: RootState) => s.screens.connected);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">Telas Conectadas</h2>
      {screens.length === 0 && (
        <p className="text-zinc-500">Nenhuma tela conectada. Dispositivos na rede podem acessar o Castlight automaticamente.</p>
      )}
      <ul className="space-y-3">
        {screens.map((screen) => (
          <li key={screen.id} className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{screen.name || screen.userAgent.slice(0, 30)}</p>
              <p className="text-zinc-500 text-xs">{screen.resolution.width}x{screen.resolution.height}</p>
            </div>
            <select
              value={screen.role ?? ""}
              onChange={() => {/* TODO: assign role via API */}}
              className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Create App.tsx**

```tsx
// apps/desktop/src/App.tsx
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { useSocket } from "./hooks/useSocket";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Lyrics } from "./pages/Lyrics";
import { Bible } from "./pages/Bible";
import { Screens } from "./pages/Screens";

const PAGES = {
  dashboard: Dashboard,
  lyrics: Lyrics,
  bible: Bible,
  screens: Screens,
} as const;

export function App() {
  useSocket();
  const activePanel = useSelector((s: RootState) => s.ui.activePanel);
  const Page = PAGES[activePanel];

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Page />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Verify desktop dev server starts**

Run: `cd apps/desktop && pnpm dev`
Expected: Vite dev server starts on http://localhost:1420

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/
git commit -m "feat(desktop): add app shell with sidebar, router, dashboard, lyrics, bible, and screens pages"
```

---

### Task 16: Desktop — Lyrics Presenter Component

**Files:**
- Create: `apps/desktop/src/components/LyricsPresenter.tsx`

- [ ] **Step 1: Implement lyrics presenter**

```tsx
// apps/desktop/src/components/LyricsPresenter.tsx
import { useDispatch } from "react-redux";
import { presentLyrics, clearPresentation } from "../store/slices/presentation";
import type { Song, SongSection } from "@castlight/shared";
import { io } from "socket.io-client";
import { SIDECAR_PORT, SIDECAR_WS_PATH, ScreenRole } from "@castlight/shared";

interface Props {
  song: Song;
  onClose: () => void;
}

export function LyricsPresenter({ song, onClose }: Props) {
  const dispatch = useDispatch();

  const sendSection = (index: number) => {
    const section = song.sections[index];
    const nextSection = song.sections[index + 1] ?? null;

    const data = {
      section,
      nextSection,
      song: { title: song.title, artist: song.artist, key: song.key },
    };

    dispatch(presentLyrics(data));

    // Broadcast via sidecar REST (simpler than managing socket ref here)
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:lyrics",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data,
      }),
    });
  };

  const handleClear = () => {
    dispatch(clearPresentation());
    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:clear",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: "blank",
      }),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{song.title}</h3>
          <p className="text-zinc-400 text-sm">{song.artist} {song.key && `• Tom: ${song.key}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="px-3 py-1.5 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">
            Limpar
          </button>
          <button onClick={onClose} className="px-3 py-1.5 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600">
            Fechar
          </button>
        </div>
      </div>
      {song.sections.map((section, i) => (
        <button
          key={section.id}
          onClick={() => sendSection(i)}
          className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-4 transition-colors"
        >
          <span className="text-blue-400 text-xs font-medium uppercase">{section.label}</span>
          <p className="text-white mt-1 whitespace-pre-line">{section.text}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add broadcast route to sidecar**

Add to `apps/sidecar/src/routes/screens.ts`:

```typescript
  app.post("/broadcast", async (c) => {
    const { event, roles, data } = await c.req.json();
    for (const role of roles) {
      io.to(`role:${role}`).emit(event, data);
    }
    return c.json({ ok: true });
  });
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/components/LyricsPresenter.tsx apps/sidecar/src/routes/screens.ts
git commit -m "feat(desktop): add lyrics presenter with section-click-to-broadcast"
```

---

### Task 17: Desktop — Bible Navigator Component

**Files:**
- Create: `apps/desktop/src/components/BibleNavigator.tsx`

- [ ] **Step 1: Implement bible navigator**

```tsx
// apps/desktop/src/components/BibleNavigator.tsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  useGetBibleVersionsQuery,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
} from "../store/api";
import { presentBible } from "../store/slices/presentation";
import { SIDECAR_PORT, ScreenRole } from "@castlight/shared";

export function BibleNavigator() {
  const dispatch = useDispatch();
  const [version, setVersion] = useState("acf");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const { data: versions = [] } = useGetBibleVersionsQuery();
  const { data: books = [] } = useGetBibleBooksQuery(version);

  const currentBook = books.find((b) => b.name === selectedBook);

  const { data: verses = [] } = useGetBibleVersesQuery(
    selectedBook && selectedChapter
      ? { version, book: selectedBook, chapter: selectedChapter, verseStart: 1, verseEnd: 200 }
      : { version: "", book: "", chapter: 0, verseStart: 0 },
    { skip: !selectedBook || !selectedChapter },
  );

  const sendVerse = (verseNum: number) => {
    if (!selectedBook || !selectedChapter) return;

    const ref = { version, book: selectedBook, chapter: selectedChapter, verseStart: verseNum };
    const verseData = verses.filter((v) => v.verse === verseNum);

    dispatch(presentBible({ verses: verseData, reference: ref }));

    fetch(`http://localhost:${SIDECAR_PORT}/api/screens/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "content:bible",
        roles: [ScreenRole.Public, ScreenRole.Stage, ScreenRole.Stream, ScreenRole.Monitor],
        data: { verses: verseData, reference: ref },
      }),
    });
  };

  // Breadcrumb navigation
  if (!selectedBook) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {books.map((book) => (
            <button
              key={book.abbr}
              onClick={() => setSelectedBook(book.name)}
              className="bg-zinc-800 rounded-lg p-3 text-left hover:bg-zinc-700 transition-colors"
            >
              <p className="text-white text-sm font-medium">{book.name}</p>
              <p className="text-zinc-500 text-xs">{book.chapters} cap.</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedBook(null)} className="text-blue-400 text-sm hover:underline">
          ← Livros
        </button>
        <h3 className="text-lg font-semibold text-white">{selectedBook}</h3>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: currentBook?.chapters ?? 0 }, (_, i) => i + 1).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChapter(ch)}
              className="bg-zinc-800 rounded-lg p-3 text-white text-center hover:bg-zinc-700 transition-colors"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setSelectedChapter(null)} className="text-blue-400 text-sm hover:underline">
          ← {selectedBook}
        </button>
        <span className="text-zinc-500 text-sm">Capitulo {selectedChapter}</span>
      </div>
      <div className="space-y-1">
        {verses.map((verse) => (
          <button
            key={verse.verse}
            onClick={() => sendVerse(verse.verse)}
            className="w-full text-left p-3 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <span className="text-blue-400 text-xs font-bold mr-2">{verse.verse}</span>
            <span className="text-white">{verse.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/components/BibleNavigator.tsx
git commit -m "feat(desktop): add bible navigator with book > chapter > verse drill-down"
```

---

### Task 18: Desktop — Screen List + QR Code

**Files:**
- Create: `apps/desktop/src/components/ScreenList.tsx`
- Create: `apps/desktop/src/components/QRCodeDialog.tsx`

- [ ] **Step 1: Implement ScreenList**

```tsx
// apps/desktop/src/components/ScreenList.tsx
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { toggleQRDialog } from "../store/slices/ui";
import { ScreenRole, SIDECAR_PORT } from "@castlight/shared";

const ROLE_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: ScreenRole.Public, label: "Publico" },
  { value: ScreenRole.Stage, label: "Retorno" },
  { value: ScreenRole.Stream, label: "Stream" },
  { value: ScreenRole.Monitor, label: "Monitor" },
  { value: ScreenRole.Bible, label: "Biblia" },
  { value: ScreenRole.Tech, label: "Tecnica" },
];

export function ScreenList() {
  const screens = useSelector((s: RootState) => s.screens.connected);
  const dispatch = useDispatch();

  const assignRole = async (socketId: string, role: string) => {
    await fetch(`http://localhost:${SIDECAR_PORT}/api/screens/${socketId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
  };

  const identify = async (socketId: string) => {
    await fetch(`http://localhost:${SIDECAR_PORT}/api/screens/${socketId}/identify`, {
      method: "POST",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400 uppercase">Telas ({screens.length})</h3>
        <button
          onClick={() => dispatch(toggleQRDialog())}
          className="text-xs text-blue-400 hover:underline"
        >
          QR Code
        </button>
      </div>
      {screens.map((screen) => (
        <div key={screen.id} className="bg-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm">{screen.name || "Sem nome"}</p>
            <button
              onClick={() => identify(screen.id)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Identificar
            </button>
          </div>
          <p className="text-zinc-500 text-xs">{screen.resolution.width}x{screen.resolution.height}</p>
          <select
            value={screen.role ?? ""}
            onChange={(e) => assignRole(screen.id, e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-xs"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement QRCodeDialog**

```tsx
// apps/desktop/src/components/QRCodeDialog.tsx
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { toggleQRDialog } from "../store/slices/ui";
import { QRCodeSVG } from "qrcode.react";
import { SIDECAR_PORT } from "@castlight/shared";

export function QRCodeDialog() {
  const open = useSelector((s: RootState) => s.ui.qrDialogOpen);
  const dispatch = useDispatch();

  if (!open) return null;

  // TODO: get real LAN IP from sidecar /api/health
  const url = `http://localhost:${SIDECAR_PORT}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">Conectar tela</h3>
        <p className="text-zinc-400 text-sm">Escaneie o QR Code com o dispositivo</p>
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeSVG value={url} size={200} />
        </div>
        <p className="text-zinc-500 text-xs font-mono">{url}</p>
        <button
          onClick={() => dispatch(toggleQRDialog())}
          className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-600"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/components/ScreenList.tsx apps/desktop/src/components/QRCodeDialog.tsx
git commit -m "feat(desktop): add screen list with role assignment, identify, and QR code dialog"
```

---

### Task 19: Verify Full Stack Integration

- [ ] **Step 1: Start sidecar**

Run: `cd apps/sidecar && bun run src/index.ts`
Expected: `[castlight] sidecar running on http://localhost:3100`

- [ ] **Step 2: Test health endpoint**

Run: `curl http://localhost:3100/api/health`
Expected: `{"status":"ok",...}`

- [ ] **Step 3: Test lyrics API**

Run:
```bash
curl -X POST http://localhost:3100/api/lyrics \
  -H "Content-Type: application/json" \
  -d '{"title":"Grande e o Senhor","artist":"Adhemar de Campos","key":"G","sections":[{"type":"verse","label":"Verso 1","text":"Grande e o Senhor\nE mui digno de louvor","order":0}]}'
```
Expected: 201 with song JSON.

- [ ] **Step 4: Test bible API**

Run: `curl "http://localhost:3100/api/bible/versions"`
Expected: JSON array with ACF version.

Run: `curl "http://localhost:3100/api/bible/verses?version=acf&book=Genesis&chapter=1&verseStart=1&verseEnd=3"`
Expected: 3 verses from Genesis.

- [ ] **Step 5: Start desktop dev server**

Run: `cd apps/desktop && pnpm dev`
Expected: Vite starts on http://localhost:1420

- [ ] **Step 6: Run all tests**

Run: `cd apps/sidecar && bun test`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: verify full stack integration — sidecar + desktop + shared"
```
