import { beforeEach, describe, expect, it } from 'vitest';
import { chatOutbox } from '../sync/chatOutbox';

describe('chat outbox', () => {
  beforeEach(() => localStorage.clear());
  it('keeps queued messages durable and de-duplicates client keys', () => {
    chatOutbox.enqueue({ roomId: 'r1', clientKey: 'm1', data: { text: 'a' }, queuedAt: 1 });
    chatOutbox.enqueue({ roomId: 'r1', clientKey: 'm1', data: { text: 'b' }, queuedAt: 2 });
    expect(chatOutbox.list('r1')).toEqual([{ roomId: 'r1', clientKey: 'm1', data: { text: 'b' }, queuedAt: 2 }]);
  });
  it('removes only the acknowledged message', () => {
    chatOutbox.enqueue({ roomId: 'r1', clientKey: 'm1', data: {}, queuedAt: 1 });
    chatOutbox.enqueue({ roomId: 'r1', clientKey: 'm2', data: {}, queuedAt: 2 });
    chatOutbox.remove('m1');
    expect(chatOutbox.count('r1')).toBe(1);
    expect(chatOutbox.list('r1')[0].clientKey).toBe('m2');
  });
});
