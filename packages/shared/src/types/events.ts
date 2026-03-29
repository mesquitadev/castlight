import type { ScreenRole, ContentType } from "../enums";
import type { SongSection } from "./lyrics";
import type { BibleVerse, BibleReference } from "./bible";
import type { ScreenInfo } from "./screen";

// Client -> Server
export interface ClientToServerEvents {
  "screen:register": (info: { userAgent: string; resolution: { width: number; height: number }; fingerprint: string }) => void;
  "bible:send": (ref: BibleReference) => void;
}

// Server -> Client
export interface ServerToClientEvents {
  "screen:registered": (screen: ScreenInfo) => void;
  "screen:role-assigned": (role: ScreenRole) => void;
  "screen:identify": () => void;
  "content:lyrics": (data: { section: SongSection; nextSection: SongSection | null; song: { title: string; artist: string; key: string | null } }) => void;
  "content:bible": (data: { verses: BibleVerse[]; reference: BibleReference }) => void;
  "content:clear": (type: ContentType) => void;
  "screens:updated": (screens: ScreenInfo[]) => void;
}

// Server -> Server (inter-service)
export interface InterServerEvents {}

// Socket data
export interface SocketData {
  screenId: string;
  role: ScreenRole | null;
}
