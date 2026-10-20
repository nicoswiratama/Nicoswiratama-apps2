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

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'super_admin' | 'user';
  createdAt: string;
  lastLogin: string;
}

export interface CapexSetup {
  roomRenovationPerRoom: number;
  publicAreaRenovation: number;
  mepEquipment: number;
  itPmsHardware: number;
  workingCapital: number;
}

export interface PropertyData {
  id: string;
  name: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  basicInput: any;
  monthlyTargets: any[];
  growthParams: {
    revGrowth: number;
    costInflation: number;
  };
  capex?: CapexSetup;
  depts?: any;
  customManningKpi?: {
    isCustomMode?: boolean;
    minRatio?: number;
    maxRatio?: number;
    hkLoad?: number;
    maxPayrollPct?: number;
    benchmarkType?: string;
  };
}

