export function timestampToMillis(value: unknown, fallback = Date.now()): number {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return fallback;
}

export function cleanPatch<T extends Record<string, unknown>>(patch: Partial<T>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}
