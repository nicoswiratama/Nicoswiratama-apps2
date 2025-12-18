export enum AppMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for image preview
  timestamp: number;
  isStreaming?: boolean;
}

export interface LiveStatus {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number; // 0-100 for visualizer
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
