# Phase 4 Validation

Phase 4 implementation includes durable offline outboxes, serialized/retried sync, realtime presence heartbeat handling, reconnect recovery, conflict detection, cross-tab transport, and real platform-bound test/debug execution.

Validation gate:
- `npm run lint` reports 0 TypeScript errors.
- `npm run test` reports 0 failed tests.
- `npm run test:rules` runs against a dedicated Firestore emulator on `127.0.0.1:8080` and must report 0 failed tests.
- The rules runner owns emulator startup/readiness/cleanup so Phase 4 validation does not depend on Firebase CLI `emulators:exec` process timing.

The Firestore room-content limit is intentionally 256 KiB so the security rule can reject oversized application content before the Firestore 1 MiB field limit is reached. The rules test therefore uses 262,145 bytes rather than a payload that the Firestore client itself rejects before rules evaluation.
