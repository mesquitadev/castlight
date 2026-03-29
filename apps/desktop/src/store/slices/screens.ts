import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ScreenInfo } from "@castlight/shared";

interface ScreensState {
  connected: ScreenInfo[];
}

const initialState: ScreensState = { connected: [] };

export const screensSlice = createSlice({
  name: "screens",
  initialState,
  reducers: {
    setScreens(state, action: PayloadAction<ScreenInfo[]>) {
      state.connected = action.payload;
    },
  },
});

export const { setScreens } = screensSlice.actions;
