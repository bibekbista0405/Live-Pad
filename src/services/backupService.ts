import { Platform } from '../platform';

export interface WorkspaceBackupSnapshot {
  timestamp: number;
  openTabs: Array<{ path: string; name: string; content?: string; isDirty?: boolean }>;
  activeTabPath: string | null;
  breakpoints: Array<{ file: string; line: number }>;
  terminalBuffer?: string;
  unsavedDrafts: Record<string, string>;
}

export class BackupService {
  private static instance: BackupService;
  private autoSaveTimer: any = null;

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Save current workspace state snapshot
  public async saveBackupSnapshot(snapshot: WorkspaceBackupSnapshot): Promise<boolean> {
    try {
      await Platform.setNativeStorage('livepad_workspace_backup', snapshot);
      return true;
    } catch (e) {
      console.error('Failed to save backup snapshot:', e);
      return false;
    }
  }

  // Load last saved backup snapshot for auto-recovery
  public async getBackupSnapshot(): Promise<WorkspaceBackupSnapshot | null> {
    try {
      const data = await Platform.getNativeStorage('livepad_workspace_backup');
      if (data && typeof data === 'object') {
        return data as WorkspaceBackupSnapshot;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  // Clear backup after successful clean shutdown
  public async clearBackup(): Promise<void> {
    try {
      await Platform.setNativeStorage('livepad_workspace_backup', null);
    } catch {
      // Ignore
    }
  }

  // Start periodic auto-backup ticker
  public startAutoBackup(getSnapshotFn: () => WorkspaceBackupSnapshot, intervalMs: number = 10000) {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(() => {
      const snap = getSnapshotFn();
      if (snap) {
        this.saveBackupSnapshot(snap);
      }
    }, intervalMs);
  }

  public stopAutoBackup() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}

export const backupService = BackupService.getInstance();
