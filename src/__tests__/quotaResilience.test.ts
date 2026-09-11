import { describe, it, expect, vi } from 'vitest';
import { isFirestoreQuotaExhausted, markQuotaExhausted, onQuotaExhaustedChange, handleFirestoreError, OperationType } from '../lib/firebase';

describe('Firestore Quota Exhaustion Resilience', () => {
  it('should initially be unexhausted or report status boolean', () => {
    expect(typeof isFirestoreQuotaExhausted()).toBe('boolean');
  });

  it('should register listener and trigger on quota exhaustion', () => {
    const listener = vi.fn();
    const unsubscribe = onQuotaExhaustedChange(listener);

    markQuotaExhausted();

    expect(isFirestoreQuotaExhausted()).toBe(true);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
  });

  it('should catch resource-exhausted error codes gracefully without crashing', () => {
    const quotaErr = {
      code: 'resource-exhausted',
      message: "Quota limit exceeded for quota metric 'Free daily write units per project'"
    };

    expect(() => {
      handleFirestoreError(quotaErr, OperationType.WRITE, 'rooms/test-room');
    }).not.toThrow();

    expect(isFirestoreQuotaExhausted()).toBe(true);
  });
});
