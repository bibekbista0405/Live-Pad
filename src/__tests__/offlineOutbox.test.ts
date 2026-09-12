import { beforeEach, describe, expect, it } from 'vitest';
import { offlineOutbox } from '../sync/offlineOutbox';

describe('Phase 4 durable offline outbox', () => {
  beforeEach(() => localStorage.clear());

  it('keeps only the newest pending write for a room', () => {
    offlineOutbox.enqueue({ roomId: 'room-1', content: 'a', txId: '1', clientId: 'c', updatedAt: 1 });
    offlineOutbox.enqueue({ roomId: 'room-1', content: 'b', txId: '2', clientId: 'c', updatedAt: 2 });
    offlineOutbox.enqueue({ roomId: 'room-2', content: 'x', txId: '3', clientId: 'c', updatedAt: 3 });
    expect(offlineOutbox.list()).toEqual([
      { roomId: 'room-1', content: 'b', txId: '2', clientId: 'c', updatedAt: 2 },
      { roomId: 'room-2', content: 'x', txId: '3', clientId: 'c', updatedAt: 3 },
    ]);
  });

  it('removes a successfully synced transaction', () => {
    offlineOutbox.enqueue({ roomId: 'room-1', content: 'a', txId: '1', clientId: 'c', updatedAt: 1 });
    offlineOutbox.remove('room-1', '1');
    expect(offlineOutbox.count()).toBe(0);
  });
});
