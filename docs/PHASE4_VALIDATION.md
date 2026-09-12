# Phase 4 Validation

Phase 4 implementation includes durable offline outboxes, serialized/retried sync, realtime presence heartbeat handling, and real platform-bound test/debug execution.

Validation gate:
- `npm run lint` must report 0 TypeScript errors.
- `npm run test` must report 0 failed tests.
- `npm run test:rules` must report 0 failed tests with the Firestore emulator.

The Firestore room-content limit is intentionally 256 KiB so the security rule can reject oversized application content before the Firestore 1 MiB field limit is reached. The rules test therefore uses 262,145 bytes rather than a payload that the Firestore client itself rejects before rules evaluation.
