/**
 * 3-Way Text Merge Utility for Realtime Collaborative Editing
 * Solves edit collision conflicts between local user and remote server changes.
 */

export function merge3Text(base: string, local: string, remote: string): string {
  if (local === base) return remote;
  if (remote === base) return local;
  if (local === remote) return local;

  const baseLines = base.split('\n');
  const localLines = local.split('\n');
  const remoteLines = remote.split('\n');

  const result: string[] = [];
  let b = 0, l = 0, r = 0;

  while (b < baseLines.length || l < localLines.length || r < remoteLines.length) {
    const baseLine = b < baseLines.length ? baseLines[b] : null;
    const localLine = l < localLines.length ? localLines[l] : null;
    const remoteLine = r < remoteLines.length ? remoteLines[r] : null;

    if (baseLine === localLine && baseLine === remoteLine) {
      if (baseLine !== null) result.push(baseLine);
      b++; l++; r++;
    } else if (baseLine === localLine && remoteLine !== null) {
      // Local did not change line, remote changed line
      result.push(remoteLine);
      if (baseLine !== null) b++;
      if (localLine !== null) l++;
      r++;
    } else if (baseLine === remoteLine && localLine !== null) {
      // Remote did not change line, local changed line
      result.push(localLine);
      if (baseLine !== null) b++;
      if (remoteLine !== null) r++;
      l++;
    } else if (localLine !== null && remoteLine !== null && localLine === remoteLine) {
      // Both made the exact same change
      result.push(localLine);
      if (baseLine !== null) b++;
      l++; r++;
    } else {
      // Conflict or non-overlapping insertion
      if (localLine !== null && baseLine !== localLine && (b >= baseLines.length || !remoteLines.includes(localLine))) {
        result.push(localLine);
        l++;
      } else if (remoteLine !== null && baseLine !== remoteLine && (b >= baseLines.length || !localLines.includes(remoteLine))) {
        result.push(remoteLine);
        r++;
      } else {
        if (localLine !== null) {
          result.push(localLine);
          l++;
        }
        if (remoteLine !== null) {
          result.push(remoteLine);
          r++;
        }
        if (baseLine !== null) b++;
      }
    }
  }

  return result.join('\n');
}
