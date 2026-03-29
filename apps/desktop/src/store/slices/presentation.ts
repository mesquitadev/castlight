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
