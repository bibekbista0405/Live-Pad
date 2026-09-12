export interface SyncTask {
  id: string;
  run: () => Promise<void>;
}

export type SyncState = 'idle' | 'running' | 'waiting';

export interface SyncCoordinatorOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxRetries?: number;
}

/** Serializes background sync work and applies bounded exponential backoff. */
export class SyncCoordinator {
  private running = false;
  private scheduled = false;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly maxRetries: number;

  constructor(options: SyncCoordinatorOptions = {}) {
    this.baseDelayMs = options.baseDelayMs ?? 500;
    this.maxDelayMs = options.maxDelayMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 5;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get state(): SyncState {
    if (this.running) return 'running';
    if (this.scheduled) return 'waiting';
    return 'idle';
  }

  async run(task: SyncTask): Promise<boolean> {
    if (this.running) return false;
    this.running = true;
    try {
      for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
        try {
          await task.run();
          return true;
        } catch (error) {
          if (attempt === this.maxRetries) throw error;
          const delay = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** attempt);
          await new Promise<void>((resolve) => setTimeout(resolve, delay));
        }
      }
      return false;
    } finally {
      this.running = false;
      this.scheduled = false;
    }
  }

  schedule(task: SyncTask, delayMs = 0): void {
    if (this.scheduled || this.running) return;
    this.scheduled = true;
    window.setTimeout(() => {
      this.scheduled = false;
      void this.run(task);
    }, delayMs);
  }
}
