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
