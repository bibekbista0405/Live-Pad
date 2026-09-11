export type ReleaseChannel = 'stable' | 'beta' | 'nightly';

export interface AppVersionInfo {
  version: string;
  releaseDate: string;
  channel: ReleaseChannel;
  changelog: string[];
  downloadUrl: string;
  isMandatory?: boolean;
}

export interface UpdateState {
  currentVersion: string;
  channel: ReleaseChannel;
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error' | 'up-to-date';
  progressPercentage: number;
  latestVersion?: AppVersionInfo;
  errorMessage?: string;
  previousVersion?: string;
}

const STORAGE_KEY_CHANNEL = 'livepad_update_channel';
const STORAGE_KEY_PREV_VERSION = 'livepad_previous_version';

export class AutoUpdateService {
  private state: UpdateState = {
    currentVersion: '1.0.0',
    channel: ((typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CHANNEL) : null) as ReleaseChannel) || 'stable',
    status: 'idle',
    progressPercentage: 0,
    previousVersion: (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PREV_VERSION) : null) || undefined
  };

  private listeners: Array<(state: UpdateState) => void> = [];

  constructor() {
    this.initNativeListeners();
  }

  private initNativeListeners() {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.on('update-available', (info: AppVersionInfo) => {
        this.setState({
          status: 'available',
          latestVersion: info
        });
      });

      window.electron.on('update-download-progress', (progress: number) => {
        this.setState({
          status: 'downloading',
          progressPercentage: progress
        });
      });

      window.electron.on('update-downloaded', (info: AppVersionInfo) => {
        this.setState({
          status: 'ready',
          progressPercentage: 100,
          latestVersion: info
        });
      });

      window.electron.on('update-error', (errStr: string) => {
        this.setState({
          status: 'error',
          errorMessage: errStr
        });
      });
    }
  }

  public getState(): UpdateState {
    return { ...this.state };
  }

  public subscribe(callback: (state: UpdateState) => void): () => void {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private setState(partial: Partial<UpdateState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(cb => cb(this.state));
  }

  public setChannel(channel: ReleaseChannel) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CHANNEL, channel);
    }
    this.setState({ channel });
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.send('set-update-channel', channel);
    }
  }

  public async checkForUpdates(): Promise<UpdateState> {
    this.setState({ status: 'checking', errorMessage: undefined });

    if (typeof window !== 'undefined' && window.electron) {
      window.electron.send('check-for-updates', { channel: this.state.channel });
      return this.state;
    }

    // Simulated update check for Web/PWA environment
    await new Promise(r => setTimeout(r, 600));

    // Simulated release payload
    const mockLatest: AppVersionInfo = {
      version: '1.0.1',
      releaseDate: new Date().toISOString(),
      channel: this.state.channel,
      changelog: [
        'Enhanced offline workspace persistence & quota resilience',
        'Optimized collaboration synchronization',
        'Added multi-channel release pipeline & automated installer configs'
      ],
      downloadUrl: 'https://releases.livepad.app/download/1.0.1'
    };

    if (mockLatest.version !== this.state.currentVersion) {
      this.setState({
        status: 'available',
        latestVersion: mockLatest
      });
    } else {
      this.setState({
        status: 'up-to-date'
      });
    }

    return this.state;
  }

  public async startDownload(): Promise<void> {
    if (this.state.status !== 'available' || !this.state.latestVersion) return;

    this.setState({ status: 'downloading', progressPercentage: 0 });

    if (typeof window !== 'undefined' && window.electron) {
      window.electron.send('download-update');
      return;
    }

    // Web simulation
    for (let p = 10; p <= 100; p += 20) {
      await new Promise(r => setTimeout(r, 100));
      this.setState({ progressPercentage: p });
    }

    this.setState({ status: 'ready' });
  }

  public applyUpdateAndRestart(): void {
    if (this.state.status !== 'ready') return;

    // Save rollback reference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PREV_VERSION, this.state.currentVersion);
    }

    if (typeof window !== 'undefined' && window.electron) {
      window.electron.send('restart-and-install');
      return;
    }

    // Web reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  public rollbackToPrevious(): boolean {
    const prev = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PREV_VERSION) : null;
    if (!prev) return false;

    console.log(`[AutoUpdateService] Rolling back to previous version ${prev}`);
    this.setState({
      currentVersion: prev,
      previousVersion: undefined,
      status: 'idle'
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PREV_VERSION);
    }
    return true;
  }
}

export const autoUpdateService = new AutoUpdateService();
