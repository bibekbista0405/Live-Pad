# Phase 4 — Offline + Realtime Collaboration

Status: **Started**

Phase 4 begins only after the Phase 0–3 validation defects were addressed. This phase preserves all existing collaboration, PWA, local persistence, and Firebase behavior while hardening the synchronization path.

## First increment

- Cross-platform Electron workspace authorization uses canonical `path.relative` containment checks.
- Added a serial `SyncCoordinator` to prevent overlapping background sync runs.
- Added bounded exponential retry for transient sync failures.
- Added coordinator tests.
- Existing `useOfflineSync` and IndexedDB queue remain intact; this increment does not replace the existing sync protocol.

## Safety rules

1. Never silently discard queued edits.
2. Never bypass workspace path authorization during sync.
3. Never treat a workspace code as an authorization secret.
4. Preserve existing realtime collaboration behavior while changes are introduced behind tests.
5. PWA/offline support remains a permanent product capability.

## Next increments

- coalesce compatible queued document updates without changing semantic ordering;
- make reconnect handling idempotent;
- strengthen multi-tab coordination;
- expand conflict tests around concurrent edits and stale snapshots;
- validate Firestore emulator rules and offline/reconnect flows on the development machine.
