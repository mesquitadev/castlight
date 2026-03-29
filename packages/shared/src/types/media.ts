export interface MediaFile {
  id: string;
  type: "image" | "video" | "background";
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface SlideSet {
  id: string;
  name: string;
  originalFilename: string;
  slideCount: number;
  slides: string[];
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  saved: boolean;
  createdAt: string;
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  save?: boolean;
}

export interface VideoCommand {
  action: "play" | "pause" | "seek";
  url: string;
  timestamp: number;
}

export type BackgroundFit = "cover" | "contain" | "stretch" | "center";

export interface BackgroundConfig {
  type: "image" | "video" | "color" | "gradient";
  value: string;
  fit?: BackgroundFit;
}

export interface ProjectionArea {
  enabled: boolean;
  top: number;    // percentage from top (0-50)
  bottom: number; // percentage from bottom (0-50)
  left: number;   // percentage from left (0-50)
  right: number;  // percentage from right (0-50)
}
