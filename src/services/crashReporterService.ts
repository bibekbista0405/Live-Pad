export interface CrashReport {
  id: string;
  timestamp: string;
  type: 'uncaught-exception' | 'unhandled-rejection' | 'renderer-crash' | 'electron-main-crash';
  message: string;
  stack?: string;
  metrics?: {
    memoryUsageMB?: number;
    activeTabCount?: number;
    uptimeSeconds?: number;
  };
  environment: {
    userAgent: string;
    isElectron: boolean;
    appVersion: string;
  };
}

const STORAGE_KEY_OPT_IN = 'livepad_crash_reporter_opt_in';
const STORAGE_KEY_REPORTS = 'livepad_crash_reports_log';

export class CrashReporterService {
  private isOptedIn: boolean = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_OPT_IN) !== 'false' : true;
  private reports: CrashReport[] = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(STORAGE_KEY_REPORTS) || '[]') : [];
  private startTime: number = Date.now();

  constructor() {
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.captureCrash({
        type: 'uncaught-exception',
        message: event.message || 'Uncaught Error',
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.captureCrash({
        type: 'unhandled-rejection',
        message: typeof reason === 'string' ? reason : reason?.message || 'Unhandled Promise Rejection',
        stack: reason?.stack
      });
    });

    if (window.electron) {
      window.electron.on('renderer-crash', (info: any) => {
        this.captureCrash({
          type: 'renderer-crash',
          message: info.message || 'Electron Renderer Process Crash',
          stack: info.stack
        });
      });
    }
  }

  public setOptIn(enabled: boolean) {
    this.isOptedIn = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_OPT_IN, enabled ? 'true' : 'false');
    }
  }

  public getOptInStatus(): boolean {
    return this.isOptedIn;
  }

  public captureCrash(details: { type: CrashReport['type']; message: string; stack?: string }): CrashReport | null {
    if (!this.isOptedIn) return null;

    const memoryMB = (performance as any)?.memory?.usedJSHeapSize
      ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))
      : undefined;

    const report: CrashReport = {
      id: `crash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: details.type,
      message: details.message,
      stack: details.stack,
      metrics: {
        memoryUsageMB: memoryMB,
        uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000)
      },
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node',
        isElectron: !!(typeof window !== 'undefined' && window.electron),
        appVersion: '1.0.0'
      }
    };

    this.reports.unshift(report);
    if (this.reports.length > 50) this.reports.pop(); // Keep last 50
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(this.reports));
    }

    console.warn('[CrashReporterService] Captured crash report:', report.id, report.message);
    return report;
  }

  public getReports(): CrashReport[] {
    return [...this.reports];
  }

  public clearReports() {
    this.reports = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_REPORTS);
    }
  }
}

export const crashReporterService = new CrashReporterService();
