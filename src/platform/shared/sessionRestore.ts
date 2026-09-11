import { Theme } from '../../types';
import { LeftSidebarMode } from '../../hooks/useWorkspaceLayout';
import { Logger } from './logger';

export interface SessionData {
  lastRoomCode?: string | null;
  lastActiveNoteId?: string | null;
  openNoteIds?: string[];
  theme?: Theme;
  leftSidebarMode?: LeftSidebarMode;
  rightSidebarOpen?: boolean;
  isCodeMode?: boolean;
  cursorLine?: number;
  cursorCol?: number;
  updatedAt: number;
}

const STORAGE_KEY = 'livepad_desktop_session_state';

export class SessionRestoreManager {
  public static saveSession(session: Partial<SessionData>): void {
    try {
      const existing = SessionRestoreManager.loadSession() || {};
      const updated: SessionData = {
        ...existing,
        ...session,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      Logger.debug('Platform Logs', 'Saved session state', updated);
    } catch (e) {
      Logger.error('Platform Logs', 'Failed to save session state', e);
    }
  }

  public static loadSession(): SessionData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SessionData;
      }
    } catch (e) {
      Logger.error('Platform Logs', 'Failed to load session state', e);
    }
    return null;
  }

  public static clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      Logger.info('Platform Logs', 'Cleared session state');
    } catch (e) {
      Logger.error('Platform Logs', 'Failed to clear session state', e);
    }
  }
}
