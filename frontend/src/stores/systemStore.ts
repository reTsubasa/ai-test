import { create } from 'zustand';

export interface SystemInfo {
  hostname: string;
  version: string;
  uptime: number;
  bootTime: string;
  kernelVersion: string;
  architecture: string;
  cpuModel: string;
  cpuCores: number;
  memoryTotal: number;
  memoryAvailable: number;
  diskTotal: number;
  diskAvailable: number;
  loadAverage: [number, number, number];
}

export interface VyOSImage {
  name: string;
  version: string;
  description: string;
  installed: boolean;
  current: boolean;
  size: number;
  installDate: string;
}

export interface SystemLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical';
  facility: string;
  message: string;
  process?: string;
  pid?: number;
}

export type LogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'all';

interface SystemState {
  // State
  systemInfo: SystemInfo | null;
  images: VyOSImage[];
  logs: SystemLogEntry[];
  isLoadingInfo: boolean;
  isLoadingImages: boolean;
  isLoadingLogs: boolean;
  isRebooting: boolean;
  isPoweringOff: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;

  // Actions
  setSystemInfo: (info: SystemInfo) => void;
  setImages: (images: VyOSImage[]) => void;
  setLogs: (logs: SystemLogEntry[]) => void;
  addLogs: (logs: SystemLogEntry[]) => void;
  setLoadingInfo: (isLoading: boolean) => void;
  setLoadingImages: (isLoading: boolean) => void;
  setLoadingLogs: (isLoading: boolean) => void;
  setRebooting: (isRebooting: boolean) => void;
  setPoweringOff: (isPoweringOff: boolean) => void;
  setUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setError: (error: string | null) => void;

  // Computed
  getCurrentImage: () => VyOSImage | null;
  getInstalledImages: () => VyOSImage[];
  getAvailableImages: () => VyOSImage[];
  getLogsByLevel: (level: LogLevel) => SystemLogEntry[];
}

export const useSystemStore = create<SystemState>((set, get) => ({
  // Initial state
  systemInfo: null,
  images: [],
  logs: [],
  isLoadingInfo: false,
  isLoadingImages: false,
  isLoadingLogs: false,
  isRebooting: false,
  isPoweringOff: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,

  // Actions
  setSystemInfo: (info) => set({ systemInfo: info }),

  setImages: (images) => set({ images }),

  setLogs: (logs) => set({ logs }),

  addLogs: (newLogs) =>
    set((state) => ({
      logs: [...newLogs, ...state.logs].slice(0, 1000), // Keep last 1000 logs
    })),

  setLoadingInfo: (isLoading) => set({ isLoadingInfo: isLoading }),

  setLoadingImages: (isLoading) => set({ isLoadingImages: isLoading }),

  setLoadingLogs: (isLoading) => set({ isLoadingLogs: isLoading }),

  setRebooting: (isRebooting) => set({ isRebooting }),

  setPoweringOff: (isPoweringOff) => set({ isPoweringOff }),

  setUploading: (isUploading) => set({ isUploading }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  setError: (error) => set({ error }),

  // Computed
  getCurrentImage: () => {
    const { images } = get();
    return images.find((img) => img.current) || null;
  },

  getInstalledImages: () => {
    const { images } = get();
    return images.filter((img) => img.installed);
  },

  getAvailableImages: () => {
    const { images } = get();
    return images.filter((img) => !img.installed);
  },

  getLogsByLevel: (level) => {
    const { logs } = get();
    if (level === 'all') return logs;
    return logs.filter((log) => log.level === level);
  },
}));