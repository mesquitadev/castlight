import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OBSStatus } from "@castlight/shared";

interface OBSState { status: OBSStatus; }

const initialState: OBSState = {
  status: { connected: false, currentScene: null, recording: false, streaming: false },
};

export const obsSlice = createSlice({
  name: "obs",
  initialState,
  reducers: {
    setOBSStatus(state, action: PayloadAction<OBSStatus>) { state.status = action.payload; },
  },
});

export const { setOBSStatus } = obsSlice.actions;
