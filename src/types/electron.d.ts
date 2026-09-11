import { LivePadElectronAPI } from '../../electron/preload';

declare global {
  interface Window {
    livepadElectron?: LivePadElectronAPI;
  }
}

export {};
