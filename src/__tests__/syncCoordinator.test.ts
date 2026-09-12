import { describe, expect, it, vi } from 'vitest';
import { SyncCoordinator } from '../sync/syncCoordinator';

describe('Phase 4 sync coordinator', () => {
  it('prevents overlapping sync runs', async () => {
    const coordinator = new SyncCoordinator({ baseDelayMs: 1, maxRetries: 0 });
    let release!: () => void;
    const first = coordinator.run({ id: 'first', run: () => new Promise<void>((resolve) => { release = resolve; }) });
    expect(await coordinator.run({ id: 'second', run: async () => undefined })).toBe(false);
    release();
    expect(await first).toBe(true);
  });

  it('retries transient failures with bounded backoff', async () => {
    vi.useFakeTimers();
    const coordinator = new SyncCoordinator({ baseDelayMs: 10, maxDelayMs: 20, maxRetries: 2 });
    let attempts = 0;
    const promise = coordinator.run({
      id: 'retry',
      run: async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('temporary');
      },
    });
    await vi.runAllTimersAsync();
    expect(await promise).toBe(true);
    expect(attempts).toBe(3);
    vi.useRealTimers();
  });
});
