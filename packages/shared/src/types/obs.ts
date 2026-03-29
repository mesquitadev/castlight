export interface OBSConfig {
  host: string;
  port: number;
  password: string;
  autoConnect: boolean;
  sceneMapping: Record<string, string>;
}

export interface OBSStatus {
  connected: boolean;
  currentScene: string | null;
  recording: boolean;
  streaming: boolean;
}

export interface StreamConfig {
  showLyrics: boolean;
  showBible: boolean;
  showLowerThird: boolean;
  showLogo: boolean;
  lowerThirdColor: string;
  lowerThirdPosition: "bottom" | "top";
}

export interface LowerThirdData {
  text: string;
  subtext: string;
  visible: boolean;
}
