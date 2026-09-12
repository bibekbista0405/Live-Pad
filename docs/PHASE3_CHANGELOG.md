# LivePad — Phase 3 Changelog

## Application & State Architecture

Phase 3 focuses on reducing the amount of cross-cutting orchestration owned by `App.tsx` and `useLiveRoom.ts`, while preserving the existing product surface.

### Completed

- Centralized cross-cutting UI state in `AppUIContext`.
- Extracted document persistence into `useDocumentPersistence`.
- Extracted workspace commands into `useWorkspaceCommands`.
- Extracted workspace presence/participant derivation into `useWorkspacePresence`.
- Extracted workspace membership mutations into `useWorkspaceMembership`.
- Added root-level `ErrorBoundary` so a render failure is contained instead of taking down the entire UI.
- Coalesced local cursor-state updates to one animation-frame update, reducing full application rerenders during rapid cursor movement.
- Kept PWA lifecycle and offline behavior intact.
- Kept existing workspace, editor, collaboration, coding, export, AI, desktop, and offline features intact.

### Stability rules

1. Refactors must preserve the public behavior of `useLiveRoom`.
2. No product feature is removed as part of Phase 3.
3. High-frequency editor events should avoid synchronous storage writes and avoid unnecessary root-level state updates.
4. Errors should be contained at the smallest useful UI boundary, with a root recovery boundary as the final safety net.
5. Phase 4 will handle deeper realtime/offline synchronization changes; Phase 3 does not replace the collaboration protocol.

## Result

Phase 3 application/state architecture work is complete at the current compatibility boundary. The next phase is Offline + Realtime Collaboration hardening.

## Finalization pass

- `useLiveRoom.ts` reduced from 1,531 lines to approximately 1,324 lines by extracting presence and membership concerns.
- Cursor state updates are animation-frame coalesced; Firestore cursor writes remain throttled.
- Root render recovery is now mounted in `main.tsx`.
- Added a focused Phase 3 reducer regression test.
- Added a Phase 3 stability note documenting the hot paths and compatibility boundary.
