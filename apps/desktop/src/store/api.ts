import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Song, CreateSongInput, BibleVersion, BibleBook, BibleVerse } from "@castlight/shared";

const SIDECAR_URL = "http://localhost:3100";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${SIDECAR_URL}/api` }),
  tagTypes: ["Songs", "Screens"],
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
