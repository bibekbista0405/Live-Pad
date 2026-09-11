export interface TelemetryEvent {
  id: string;
  timestamp: string;
  eventName: 'startup_metric' | 'feature_usage' | 'performance_metric' | 'error_stat';
  details: {
    feature?: string;
    durationMs?: number;
    category?: string;
    success?: boolean;
  };
}

const STORAGE_KEY_TELEMETRY_OPT_IN = 'livepad_telemetry_opt_in';

export class TelemetryService {
  private isOptedIn: boolean = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TELEMETRY_OPT_IN) === 'true' : false; // Default opt-out for maximum privacy
  private eventsLog: TelemetryEvent[] = [];

  public setOptIn(enabled: boolean) {
    this.isOptedIn = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TELEMETRY_OPT_IN, enabled ? 'true' : 'false');
    }
    if (!enabled) {
      this.eventsLog = [];
    }
  }

  public getOptInStatus(): boolean {
    return this.isOptedIn;
  }

  public trackFeatureUsage(featureName: string, category: string = 'general') {
    if (!this.isOptedIn) return;
    this.recordEvent('feature_usage', { feature: featureName, category });
  }

  public trackPerformance(metricName: string, durationMs: number) {
    if (!this.isOptedIn) return;
    this.recordEvent('performance_metric', { feature: metricName, durationMs });
  }

  public trackError(category: string, feature: string) {
    if (!this.isOptedIn) return;
    this.recordEvent('error_stat', { category, feature, success: false });
  }

  private recordEvent(
    eventName: TelemetryEvent['eventName'],
    details: TelemetryEvent['details']
  ) {
    // Sanity assertion: Ensure NO document contents or text are passed
    const cleanDetails = {
      feature: details.feature ? String(details.feature).substring(0, 50) : undefined,
      durationMs: typeof details.durationMs === 'number' ? details.durationMs : undefined,
      category: details.category ? String(details.category).substring(0, 30) : undefined,
      success: details.success
    };

    const event: TelemetryEvent = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventName,
      details: cleanDetails
    };

    this.eventsLog.push(event);
    if (this.eventsLog.length > 100) this.eventsLog.shift();
  }

  public getLoggedEvents(): TelemetryEvent[] {
    return [...this.eventsLog];
  }
}

export const telemetryService = new TelemetryService();
