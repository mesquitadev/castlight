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
