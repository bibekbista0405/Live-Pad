import { CloudWorkspace, WorkspaceMode, WorkspaceSnapshot, DeviceSyncState } from '../types/phase4';
import { Platform } from '../platform';

export class CloudWorkspaceService {
  private static instance: CloudWorkspaceService;
  private currentWorkspace: CloudWorkspace | null = null;
  private snapshots: WorkspaceSnapshot[] = [];
  private syncTimer: any = null;

  public static getInstance(): CloudWorkspaceService {
    if (!CloudWorkspaceService.instance) {
      CloudWorkspaceService.instance = new CloudWorkspaceService();
    }
    return CloudWorkspaceService.instance;
  }

  // Initialize or fetch current active workspace
  public async getActiveWorkspace(): Promise<CloudWorkspace> {
    if (this.currentWorkspace) return this.currentWorkspace;

    // Load stored workspace metadata or fallback to default
    const stored = await Platform.getNativeStorage('livepad_active_cloud_workspace');
    if (stored && typeof stored === 'object') {
      this.currentWorkspace = stored as CloudWorkspace;
    } else {
      this.currentWorkspace = {
        id: 'ws-default-local',
        name: 'LivePad Main Workspace',
        description: 'Primary local and cloud synchronized developer workspace',
        mode: 'hybrid',
        ownerId: 'user-1',
        ownerEmail: 'developer@livepad.dev',
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now(),
        isOffline: !navigator.onLine,
        pendingSyncCount: 0,
        versionSnapshotCount: 3,
        cloudUrl: 'https://cloud.livepad.dev/ws/main-workspace',
        repoUrl: 'https://github.com/livepad/main-workspace',
      };
    }

    return this.currentWorkspace;
  }

  // Switch workspace mode (Local, Cloud, Hybrid)
  public async setWorkspaceMode(mode: WorkspaceMode): Promise<CloudWorkspace> {
    const ws = await this.getActiveWorkspace();
    ws.mode = mode;
    ws.updatedAt = Date.now();
    this.currentWorkspace = ws;
    await Platform.setNativeStorage('livepad_active_cloud_workspace', ws);
    return ws;
  }

  // Create Version Snapshot
  public async createVersionSnapshot(label: string, filesCount: number, sizeBytes: number): Promise<WorkspaceSnapshot> {
    const ws = await this.getActiveWorkspace();
    const snapshot: WorkspaceSnapshot = {
      id: `snap-${Date.now()}`,
      workspaceId: ws.id,
      timestamp: Date.now(),
      label: label || `Snapshot #${ws.versionSnapshotCount + 1}`,
      creator: ws.ownerEmail,
      filesCount,
      sizeBytes,
      autoCreated: false,
    };

    this.snapshots.unshift(snapshot);
    ws.versionSnapshotCount += 1;
    ws.updatedAt = Date.now();

    await Platform.setNativeStorage('livepad_workspace_snapshots', this.snapshots);
    await Platform.setNativeStorage('livepad_active_cloud_workspace', ws);
    return snapshot;
  }

  public async getSnapshots(): Promise<WorkspaceSnapshot[]> {
    if (this.snapshots.length > 0) return this.snapshots;
    const stored = await Platform.getNativeStorage('livepad_workspace_snapshots');
    if (stored && Array.isArray(stored)) {
      this.snapshots = stored;
    } else {
      // Mock initial snapshots for rich display
      const ws = await this.getActiveWorkspace();
      this.snapshots = [
        {
          id: 'snap-1',
          workspaceId: ws.id,
          timestamp: Date.now() - 3600000 * 2,
          label: 'Phase 3 Services Integration',
          creator: 'developer@livepad.dev',
          filesCount: 42,
          sizeBytes: 1024 * 340,
          autoCreated: true,
        },
        {
          id: 'snap-2',
          workspaceId: ws.id,
          timestamp: Date.now() - 86400000 * 1,
          label: 'Stable Build Pre-Release v1.2',
          creator: 'developer@livepad.dev',
          filesCount: 38,
          sizeBytes: 1024 * 290,
          autoCreated: false,
        },
      ];
    }
    return this.snapshots;
  }

  // Multi-Device State Syncing
  public async updateDeviceSyncState(state: Partial<DeviceSyncState>): Promise<DeviceSyncState> {
    const deviceId = (await Platform.getNativeStorage('livepad_device_id')) || `device-${Math.random().toString(36).substring(2, 7)}`;
    await Platform.setNativeStorage('livepad_device_id', deviceId);

    const fullState: DeviceSyncState = {
      deviceId,
      deviceName: window.navigator.userAgent.includes('Electron') ? 'LivePad Desktop' : 'LivePad Web Client',
      lastActive: Date.now(),
      openProjects: state.openProjects || ['.'],
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
