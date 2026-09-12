# Phase 4 — Offline + Realtime Collaboration

Status: **implementation complete, validation pending on the user's Windows environment**.

## What is now real

- BroadcastChannel remains the real same-browser/tab realtime transport when Firebase is unavailable.
- Firestore remains the real remote transport when Firebase is configured and authenticated.
- Content writes use a serialized `SyncCoordinator` with bounded exponential retry.
- Failed remote content writes are stored in a durable local outbox (`livepad_sync_outbox_v1`) instead of being silently discarded.
- The latest pending content write wins per room, preventing an offline typing burst from creating an unbounded queue.
- The outbox is automatically retried when the browser reports connectivity again.
- Local room content/history remain available for offline recovery.
- Presence heartbeat terminology was cleaned up so local heartbeats are not presented as fake/demo data.
- Workspace snapshots are now created from actual locally persisted project files; fabricated snapshot counts were removed.
- GitHub integration no longer fabricates repositories, PRs, issues, workflow runs, or credentials. It uses the real GitHub REST API after the user supplies a token.

## Conflict behavior

LivePad keeps the existing anti-rubber-band typing lock and last-write metadata. A remote snapshot received while the user is actively typing updates collaboration metadata without replacing the local editor buffer. This avoids cursor/content jumps while preserving the remote version for the next synchronization cycle.

## Remaining validation gate

Run on Windows:

```powershell
npm install
npm run lint
npm run test
npm run dev
```

Phase 4 is considered production-cleared only after the Phase 0–3 gate and these Phase 4 tests are green.

## Reliability model

The editor follows a local-first write path: the UI changes immediately, a local recovery copy is written, and remote delivery is attempted separately. Network loss therefore does not block typing. Once connectivity returns, the durable outbox retries the newest pending room state. Same-browser collaborators continue receiving changes through BroadcastChannel when the remote service is unavailable.
