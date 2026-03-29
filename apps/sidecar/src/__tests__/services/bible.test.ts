import { describe, it, expect, beforeEach } from "bun:test";
import { BibleService } from "../../services/bible";
import { join } from "path";

describe("BibleService", () => {
  let service: BibleService;

  beforeEach(() => {
    const biblesDir = join(import.meta.dir, "../../../../../assets/bibles");
    service = new BibleService(biblesDir);
  });

  it("lists available versions", () => {
    const versions = service.getVersions();
    expect(versions.length).toBeGreaterThanOrEqual(1);
  });

  it("lists books for a version", () => {
    const versions = service.getVersions();
    if (versions.length === 0) return; // skip if no bible installed
    const versionId = versions[0].id;
    const books = service.getBooks(versionId);
    expect(books.length).toBeGreaterThanOrEqual(1);
    expect(books[0].abbr).toBe("Gn");
  });

  it("gets verses by reference (using abbreviation)", () => {
    const versions = service.getVersions();
    if (versions.length === 0) return;
    const versionId = versions[0].id;
    const verses = service.getVerses({ version: versionId, book: "Gn", chapter: 1, verseStart: 1, verseEnd: 3 });
    expect(verses).toHaveLength(3);
    expect(verses[2].text.toLowerCase()).toContain("luz");
  });

  it("gets a single verse", () => {
    const versions = service.getVersions();
    if (versions.length === 0) return;
    const versionId = versions[0].id;
    const books = service.getBooks(versionId);
    // Find John (Jo or João)
    const john = books.find((b) => b.abbr === "Jo");
    if (!john) return;
    const verses = service.getVerses({ version: versionId, book: john.name, chapter: 3, verseStart: 16 });
    expect(verses).toHaveLength(1);
    expect(verses[0].text.toLowerCase()).toContain("deus");
  });

  it("returns empty for invalid reference", () => {
    const versions = service.getVersions();
    if (versions.length === 0) return;
    const verses = service.getVerses({ version: versions[0].id, book: "Invalid", chapter: 1, verseStart: 1 });
    expect(verses).toHaveLength(0);
  });

  it("searches verses by text", () => {
    const versions = service.getVersions();
    if (versions.length === 0) return;
    const results = service.searchText(versions[0].id, "luz");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
