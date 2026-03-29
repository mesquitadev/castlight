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
