import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Song, CreateSongInput, BibleVersion, BibleBook, BibleVerse, MediaFile, SlideSet, Notice, CreateNoticeInput, OBSConfig, OBSStatus, StreamConfig } from "@castlight/shared";

const SIDECAR_URL = "http://localhost:3100";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${SIDECAR_URL}/api` }),
  tagTypes: ["Songs", "Screens", "Media", "Slides", "Notices", "OBS", "Bibles", "Themes"],
  endpoints: (builder) => ({
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
    getBibleVersions: builder.query<BibleVersion[], void>({
      query: () => "/bible/versions",
      providesTags: ["Bibles"],
    }),
    getAvailableBibles: builder.query<Array<BibleVersion & { installed: boolean }>, void>({
      query: () => "/bible/available",
      providesTags: ["Bibles"],
    }),
    downloadBible: builder.mutation<void, string>({
      query: (versionId) => ({ url: `/bible/download/${versionId}`, method: "POST" }),
      invalidatesTags: ["Bibles"],
    }),
    removeBible: builder.mutation<void, string>({
      query: (versionId) => ({ url: `/bible/versions/${versionId}`, method: "DELETE" }),
      invalidatesTags: ["Bibles"],
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
    // OBS
    getOBSStatus: builder.query<OBSStatus, void>({ query: () => "/obs/status", providesTags: ["OBS"] }),
    connectOBS: builder.mutation<void, { host?: string; port?: number; password?: string }>({ query: (body) => ({ url: "/obs/connect", method: "POST", body }), invalidatesTags: ["OBS"] }),
    disconnectOBS: builder.mutation<void, void>({ query: () => ({ url: "/obs/disconnect", method: "POST" }), invalidatesTags: ["OBS"] }),
    getOBSScenes: builder.query<string[], void>({ query: () => "/obs/scenes" }),
    setOBSScene: builder.mutation<void, string>({ query: (sceneName) => ({ url: "/obs/scene", method: "POST", body: { sceneName } }) }),
    startRecording: builder.mutation<void, void>({ query: () => ({ url: "/obs/record/start", method: "POST" }) }),
    stopRecording: builder.mutation<void, void>({ query: () => ({ url: "/obs/record/stop", method: "POST" }) }),
    getSetting: builder.query<any, string>({ query: (key) => `/settings/${key}` }),
    saveSetting: builder.mutation<void, { key: string; value: any }>({ query: ({ key, value }) => ({ url: `/settings/${key}`, method: "PUT", body: value }) }),
    // Themes
    getThemes: builder.query<any[], void>({
      query: () => "/themes",
      providesTags: ["Themes"],
    }),
    getTheme: builder.query<any, string>({
      query: (id) => `/themes/${id}`,
    }),
    createTheme: builder.mutation<any, any>({
      query: (body) => ({ url: "/themes", method: "POST", body }),
      invalidatesTags: ["Themes"],
    }),
    updateTheme: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/themes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Themes"],
    }),
    setDefaultTheme: builder.mutation<void, string>({
      query: (id) => ({ url: `/themes/${id}/default`, method: "POST" }),
      invalidatesTags: ["Themes"],
    }),
    deleteTheme: builder.mutation<void, string>({
      query: (id) => ({ url: `/themes/${id}`, method: "DELETE" }),
      invalidatesTags: ["Themes"],
    }),
    // Online lyrics search
    searchOnlineLyrics: builder.query<Array<{ title: string; artist: string; text: string; source: string }>, string>({
      query: (q) => `/search/lyrics?q=${encodeURIComponent(q)}`,
    }),
    getOnlineLyricsText: builder.query<{ text: string | null }, { artist: string; title: string }>({
      query: ({ artist, title }) => `/search/lyrics/text?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
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
  useGetAvailableBiblesQuery,
  useDownloadBibleMutation,
  useRemoveBibleMutation,
  useGetBibleBooksQuery,
  useGetBibleVersesQuery,
  useSearchBibleQuery,
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
  useGetOBSStatusQuery,
  useConnectOBSMutation,
  useDisconnectOBSMutation,
  useGetOBSScenesQuery,
  useSetOBSSceneMutation,
  useStartRecordingMutation,
  useStopRecordingMutation,
  useGetSettingQuery,
  useSaveSettingMutation,
  useLazySearchOnlineLyricsQuery,
  useLazyGetOnlineLyricsTextQuery,
  useGetThemesQuery,
  useCreateThemeMutation,
  useUpdateThemeMutation,
  useSetDefaultThemeMutation,
  useDeleteThemeMutation,
} = api;
