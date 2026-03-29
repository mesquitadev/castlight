import type { BibleVerse, BibleBook, BibleVersion, BibleReference } from "@castlight/shared";
import { readFileSync, readdirSync, writeFileSync, existsSync, unlinkSync } from "fs";
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

// GitHub source format (damarals/biblias)
interface GithubBibleBook {
  abbrev: string;
  name: string;
  chapters: string[][]; // chapters[chapterIndex][verseIndex] = text
}

// Available versions from damarals/biblias
const AVAILABLE_VERSIONS: Record<string, { name: string; language: string; copyright: string }> = {
  ACF: { name: "Almeida Corrigida e Fiel", language: "pt", copyright: "Sociedade Biblica Trinitariana do Brasil, 1994" },
  ARA: { name: "Almeida Revista e Atualizada", language: "pt", copyright: "Sociedade Biblica do Brasil, 1993" },
  ARC: { name: "Almeida Revista e Corrigida", language: "pt", copyright: "Sociedade Biblica do Brasil, 1995" },
  AS21: { name: "Almeida Seculo XXI", language: "pt", copyright: "Edicoes Vida Nova, 2009" },
  JFAA: { name: "Almeida Atualizada", language: "pt", copyright: "Sociedade Biblica do Brasil" },
  KJA: { name: "King James Atualizada", language: "pt", copyright: "Abba Press, 1999" },
  KJF: { name: "King James Fiel", language: "pt", copyright: "BV Films e Biblia King James, 1611/2012" },
  NAA: { name: "Nova Almeida Atualizada", language: "pt", copyright: "Sociedade Biblica do Brasil, 2017" },
  NBV: { name: "Nova Biblia Viva", language: "pt", copyright: "Editora Mundo Cristao, 2007" },
  NTLH: { name: "Nova Traducao na Linguagem de Hoje", language: "pt", copyright: "Sociedade Biblica do Brasil, 2000" },
  NVI: { name: "Nova Versao Internacional", language: "pt", copyright: "Biblica Inc., 2011" },
  NVT: { name: "Nova Versao Transformadora", language: "pt", copyright: "Editora Mundo Cristao, 2016" },
  TB: { name: "Traducao Brasileira", language: "pt", copyright: "Sociedade Biblica do Brasil, 2010" },
};

const GITHUB_BASE_URL = "https://raw.githubusercontent.com/damarals/biblias/master/inst/json";

export class BibleService {
  private bibles = new Map<string, BibleData>();
  private biblesDir: string;

  constructor(biblesDir: string) {
    this.biblesDir = biblesDir;
    this.loadAll();
  }

  private loadAll(): void {
    this.bibles.clear();
    if (!existsSync(this.biblesDir)) return;
    const files = readdirSync(this.biblesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const data: BibleData = JSON.parse(readFileSync(join(this.biblesDir, file), "utf-8"));
        this.bibles.set(data.version.id, data);
      } catch {
        // Skip invalid files
      }
    }
  }

  // List all versions available for download (whether installed or not)
  getAvailableVersions(): Array<BibleVersion & { installed: boolean; copyright: string }> {
    return Object.entries(AVAILABLE_VERSIONS).map(([id, info]) => ({
      id: id.toLowerCase(),
      name: info.name,
      language: info.language,
      installed: this.bibles.has(id.toLowerCase()),
      copyright: info.copyright,
    }));
  }

  // Download and convert a Bible version from GitHub
  async downloadVersion(versionId: string): Promise<void> {
    const upperKey = versionId.toUpperCase();
    const info = AVAILABLE_VERSIONS[upperKey];
    if (!info) throw new Error(`Versao desconhecida: ${versionId}`);

    const url = `${GITHUB_BASE_URL}/${upperKey}.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao baixar ${upperKey}: ${response.status}`);

    const githubData: GithubBibleBook[] = await response.json();
    const converted = this.convertFromGithub(versionId.toLowerCase(), info.name, info.language, githubData);

    writeFileSync(join(this.biblesDir, `${versionId.toLowerCase()}.json`), JSON.stringify(converted, null, 0));
    this.bibles.set(versionId.toLowerCase(), converted);
  }

  // Remove an installed Bible version
  removeVersion(versionId: string): void {
    const filePath = join(this.biblesDir, `${versionId}.json`);
    if (existsSync(filePath)) unlinkSync(filePath);
    this.bibles.delete(versionId);
  }

  // Convert GitHub format to Castlight format
  private convertFromGithub(id: string, name: string, language: string, data: GithubBibleBook[]): BibleData {
    return {
      version: { id, name, language },
      books: data.map((book) => ({
        name: book.name,
        abbr: book.abbrev,
        chapters: book.chapters.map((verses, chapterIndex) => ({
          chapter: chapterIndex + 1,
          verses: verses.map((text, verseIndex) => ({
            verse: verseIndex + 1,
            text,
          })),
        })),
      })),
    };
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
