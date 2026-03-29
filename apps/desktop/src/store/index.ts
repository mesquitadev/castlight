import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import { screensSlice } from "./slices/screens";
import { presentationSlice } from "./slices/presentation";
import { uiSlice } from "./slices/ui";
import { obsSlice } from "./slices/obs";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    screens: screensSlice.reducer,
    presentation: presentationSlice.reducer,
    ui: uiSlice.reducer,
    obs: obsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
