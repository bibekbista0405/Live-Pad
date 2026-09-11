import { describe, it, expect } from 'vitest';
import { merge3Text } from '../utils/textMerge';

describe('3-Way Text Merge Utility', () => {
  it('should return remote text if local has not changed from base', () => {
    const base = 'Hello World';
    const local = 'Hello World';
    const remote = 'Hello Remote World';
    expect(merge3Text(base, local, remote)).toBe(remote);
  });

  it('should return local text if remote has not changed from base', () => {
    const base = 'Hello World';
    const local = 'Hello Local World';
    const remote = 'Hello World';
    expect(merge3Text(base, local, remote)).toBe(local);
  });

  it('should handle non-overlapping line additions from both sides', () => {
    const base = 'Line 1\nLine 2';
    const local = 'Line 0\nLine 1\nLine 2';
    const remote = 'Line 1\nLine 2\nLine 3';
    const merged = merge3Text(base, local, remote);
    expect(merged).toContain('Line 0');
    expect(merged).toContain('Line 1');
    expect(merged).toContain('Line 2');
    expect(merged).toContain('Line 3');
  });

  it('should handle identical changes gracefully', () => {
    const base = 'Line 1';
    const local = 'Line 1 Modified';
    const remote = 'Line 1 Modified';
    expect(merge3Text(base, local, remote)).toBe('Line 1 Modified');
  });
});
