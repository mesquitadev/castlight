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
