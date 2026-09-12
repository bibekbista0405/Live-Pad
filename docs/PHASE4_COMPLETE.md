# Phase 4 — Offline + Realtime Collaboration

Status: **Complete.**

## Real collaboration guarantees

- Firestore is the cloud source for room content and chat when configured/authenticated.
- BroadcastChannel provides real same-browser-tab communication when cloud sync is unavailable.
- Editor writes are local-first and protected by a durable content outbox.
- Chat messages that fail cloud persistence enter a durable chat outbox and retry after connectivity returns.
- Chat edits and reactions persist to Firestore when the message has a server document id.
- New chat messages are initially read only by their sender; read receipts are generated from actual chat visibility rather than marking every active user as read.
- Presence and typing state remain separate from document content and are rate-limited.
- Remote content received while a user is actively typing does not rubber-band the local editor.
- Sync retries use bounded exponential backoff and serialize overlapping runs.
- Offline recovery keeps the latest room snapshot locally.

## Real code sandbox

- JavaScript no longer executes with `new Function()` in the LivePad renderer.
- JavaScript runs in an opaque-origin `iframe sandbox="allow-scripts"`.
- Console output and runtime errors cross the iframe boundary through `postMessage`.
- The sandbox CSP disables network connections and external resource loading.
- HTML preview continues to use a sandboxed iframe.

## Demo policy

LivePad does not claim a simulated feature is real. Interactive examples are either real browser execution or clearly labeled as local-only behavior.

## Verification

The Phase 4 implementation and automated test suite are complete. The rules runner now starts a dedicated Firestore emulator on `127.0.0.1:8080`, waits for readiness, runs the rules suite, and tears the emulator down cleanly. This avoids relying on the Firebase CLI `emulators:exec` wrapper for process lifetime.

Run the verification commands:

```powershell
npm install
npm run lint
npm run test
npm run dev
```

Expected: zero TypeScript errors and zero failed tests. Firestore emulator tests should also be run with:

```powershell
npm run test:rules
```


## Final hardening

- Sync tasks are serialized; overlapping writes are queued instead of being silently dropped.
- Browser reconnect processing flushes the newest durable room write and chat outbox.
- Conflict detection remains explicit rather than silently overwriting remote edits.
- Cross-tab collaboration uses BroadcastChannel only as a local transport fallback; Firestore remains the cloud source of truth when available.
- AI/Copilot work is intentionally deferred to a future phase and is not part of the Phase 4 completion gate.
