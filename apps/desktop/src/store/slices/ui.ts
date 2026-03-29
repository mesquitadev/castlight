import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ActivePanel = "lyrics" | "bible" | "media" | "screens" | "dashboard";

interface UIState {
  activePanel: ActivePanel;
  qrDialogOpen: boolean;
}

const initialState: UIState = {
  activePanel: "dashboard",
  qrDialogOpen: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<ActivePanel>) {
      state.activePanel = action.payload;
    },
    toggleQRDialog(state) {
      state.qrDialogOpen = !state.qrDialogOpen;
    },
  },
});

export const { setActivePanel, toggleQRDialog } = uiSlice.actions;
