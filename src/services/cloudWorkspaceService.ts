import { CloudWorkspace, WorkspaceMode, WorkspaceSnapshot, DeviceSyncState } from '../types/phase4';
import { Platform } from '../platform';
import { loadLocalProjectData } from './indexedDBService';

const WORKSPACE_KEY = 'livepad_active_cloud_workspace';
const SNAPSHOT_KEY = 'livepad_workspace_snapshots';
const DEVICE_KEY = 'livepad_device_id';

function getLocalIdentity() {
  if (typeof localStorage === 'undefined') return 'local-user';
  return localStorage.getItem('livepad_local_uid') || 'local-user';
}

/** Local-first workspace metadata. Cloud persistence is only reported when a real provider is connected. */
export class CloudWorkspaceService {
  private static instance: CloudWorkspaceService;
  private currentWorkspace: CloudWorkspace | null = null;
  private snapshots: WorkspaceSnapshot[] = [];

  public static getInstance(): CloudWorkspaceService {
    if (!CloudWorkspaceService.instance) CloudWorkspaceService.instance = new CloudWorkspaceService();
    return CloudWorkspaceService.instance;
  }

  public async getActiveWorkspace(): Promise<CloudWorkspace> {
    if (this.currentWorkspace) return this.currentWorkspace;
    const stored = await Platform.getNativeStorage(WORKSPACE_KEY);
    if (stored && typeof stored === 'object' && typeof stored.id === 'string') {
      this.currentWorkspace = stored as CloudWorkspace;
      this.currentWorkspace.isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
      return this.currentWorkspace;
    }

    const now = Date.now();
    this.currentWorkspace = {
      id: `local-${getLocalIdentity()}`,
      name: 'LivePad Workspace',
      description: 'Local-first workspace with durable offline recovery.',
      mode: 'local',
      ownerId: getLocalIdentity(),
      ownerEmail: '',
      createdAt: now,
      updatedAt: now,
      isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      pendingSyncCount: 0,
      versionSnapshotCount: 0,
    };
    await Platform.setNativeStorage(WORKSPACE_KEY, this.currentWorkspace);
    return this.currentWorkspace;
  }

  public async setWorkspaceMode(mode: WorkspaceMode): Promise<CloudWorkspace> {
    const ws = await this.getActiveWorkspace();
    ws.mode = mode;
    ws.updatedAt = Date.now();
    ws.isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    this.currentWorkspace = ws;
    await Platform.setNativeStorage(WORKSPACE_KEY, ws);
    return { ...ws };
  }

  public async createVersionSnapshot(label: string): Promise<WorkspaceSnapshot> {
    const ws = await this.getActiveWorkspace();
    const projectId = typeof localStorage !== 'undefined' ? localStorage.getItem('livepad_active_project_id') : null;
    let filesCount = 0;
    let sizeBytes = 0;
    if (projectId) {
      const data = await loadLocalProjectData(projectId);
      filesCount = data.files.length;
      sizeBytes = data.files.reduce((sum, file) => sum + new Blob([file.content || '']).size, 0);
    }

    const snapshot: WorkspaceSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workspaceId: ws.id,
      timestamp: Date.now(),
      label: label.trim() || `Snapshot #${ws.versionSnapshotCount + 1}`,
      creator: ws.ownerEmail || ws.ownerId,
      filesCount,
      sizeBytes,
      autoCreated: false,
    };

    this.snapshots = [snapshot, ...this.snapshots];
    ws.versionSnapshotCount += 1;
    ws.updatedAt = Date.now();
    await Platform.setNativeStorage(SNAPSHOT_KEY, this.snapshots);
    await Platform.setNativeStorage(WORKSPACE_KEY, ws);
    return snapshot;
  }

  public async getSnapshots(): Promise<WorkspaceSnapshot[]> {
    if (this.snapshots.length) return [...this.snapshots];
    const stored = await Platform.getNativeStorage(SNAPSHOT_KEY);
    this.snapshots = Array.isArray(stored) ? stored.filter((item) => item && typeof item.id === 'string') : [];
    return [...this.snapshots];
  }

  public async getPendingSyncCount(): Promise<number> {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('livepad_sync_outbox_v1') : null;
    if (!raw) return 0;
    try {
      const queue = JSON.parse(raw);
      return Array.isArray(queue) ? queue.length : 0;
    } catch {
      return 0;
    }
  }

  public async updateDeviceSyncState(state: Partial<DeviceSyncState>): Promise<DeviceSyncState> {
    const storedId = await Platform.getNativeStorage(DEVICE_KEY);
    const deviceId = typeof storedId === 'string' && storedId ? storedId : `device-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    await Platform.setNativeStorage(DEVICE_KEY, deviceId);
    const fullState: DeviceSyncState = {
      deviceId,
      deviceName: typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron') ? 'LivePad Desktop' : 'LivePad Web Client',
      lastActive: Date.now(),
      openProjects: state.openProjects || [],
      openFiles: state.openFiles || [],
      activeFilePath: state.activeFilePath,
      cursorPosition: state.cursorPosition,
      theme: state.theme || 'vs-dark',
      activeLayout: state.activeLayout || {},
      breakpoints: state.breakpoints || [],
    };
    await Platform.setNativeStorage('livepad_device_sync_state', fullState);
    return fullState;
  }
}

export const cloudWorkspaceService = CloudWorkspaceService.getInstance();
