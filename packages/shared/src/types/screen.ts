import type { ScreenRole } from "../enums";

export interface ScreenInfo {
  id: string;
  name: string;
  role: ScreenRole | null;
  userAgent: string;
  resolution: { width: number; height: number };
  connectedAt: string;
  fingerprint: string;
}

export interface ScreenState {
  screens: ScreenInfo[];
}
