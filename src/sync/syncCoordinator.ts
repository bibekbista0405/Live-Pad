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

/** Serializes sync work and applies bounded exponential backoff. Calls made while
 * another task is running are queued instead of being silently dropped. */
export class SyncCoordinator {
  private running = false;
  private scheduled = false;
  private queueDepth = 0;
  private chain: Promise<boolean> = Promise.resolve(true);
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
    if (this.scheduled || this.queueDepth > 0) return 'waiting';
    return 'idle';
  }

  private async execute(task: SyncTask): Promise<boolean> {
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
    }
  }

  run(task: SyncTask): Promise<boolean> {
    this.queueDepth += 1;
    const next = this.chain.then(async () => {
      this.queueDepth = Math.max(0, this.queueDepth - 1);
      return this.execute(task);
    });
    // Keep the queue alive after a rejected task while preserving the rejection
    // for the caller that owns that task.
    this.chain = next.then(() => true, () => false);
    return next;
  }

  schedule(task: SyncTask, delayMs = 0): void {
    if (this.scheduled) return;
    this.scheduled = true;
    const scheduleWindow = typeof window !== 'undefined' ? window : undefined;
    const timer = scheduleWindow?.setTimeout ?? setTimeout;
    timer(() => {
      this.scheduled = false;
      void this.run(task);
    }, delayMs);
  }
}
