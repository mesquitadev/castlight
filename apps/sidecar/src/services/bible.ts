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
    return bible.books.map((b) => ({ name: b.name, abbr: b.abbr, chapters: b.chapters.length }));
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
      .map((v) => ({ book: book.name, bookAbbr: book.abbr, chapter: ref.chapter, verse: v.verse, text: v.text }));
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
            results.push({ book: book.name, bookAbbr: book.abbr, chapter: chapter.chapter, verse: verse.verse, text: verse.text });
          }
        }
      }
    }
    return results;
  }
}
