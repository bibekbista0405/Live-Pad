# Phase 3 — Application & State Architecture

## Goal

Reduce `App.tsx` from being the owner of every UI state transition. Phase 3 introduces a
small application-state boundary while preserving existing behavior.

## Implemented in this increment

### 1. Central UI state provider

`src/state/AppUIContext.tsx` owns cross-cutting UI state:

- theme
- workspace category
- notepad navigation mode
- left/right sidebar visibility
- code mode
- fullscreen
- command palette
- document search state

The provider exposes React-compatible setter functions so existing components can migrate
without a flag-day rewrite.

### 2. Reducer boundary

`appUIReducer` is pure and independently testable. UI transitions are explicit actions
rather than scattered state mutation rules.

This gives us a safe path toward more granular feature stores in later Phase 3 work.

### 3. App integration

`App.tsx` now consumes the provider instead of creating those cross-cutting state atoms
itself. `main.tsx` owns provider composition.

### 4. State tests

`src/__tests__/appUIState.test.ts` covers navigation transitions and search reset behavior.

## Migration strategy

We are intentionally not moving every `useState` out of `App.tsx` at once. Local editor
selection, modal-specific form state, drag state, and transient component state should stay
local until a second feature genuinely needs them.

The next Phase 3 increments should:

1. extract workspace/session state from `useLiveRoom`
2. introduce an application command layer for workspace actions
3. split large App view sections into feature containers
4. remove duplicated workspace-role/category state
5. make persistence effects subscribe to application state instead of directly coupling UI
   concerns to Firestore


## Phase 3 performance pass
- PWA lifecycle/install state extracted into `src/hooks/usePWA.ts`; PWA remains enabled and is not removed.
- Save-time clock moved into a small `SaveTimeLabel` component so the 1-second timer no longer rerenders the entire 8k-line `App`.
- Editor statistics (plain text, characters, lines, words) are memoized.
- Active note/content/attachments and typing-user projections are memoized.
- Local note IndexedDB/localStorage persistence is coalesced during typing instead of serializing/writing on every keystroke; UI state remains immediate.
- `handleUpdateContent` is memoized to reduce downstream hook/effect churn.
- No existing product capability was intentionally removed.


## Feature-preservation rule
No product capability was intentionally deleted in this phase. In particular, PWA install,
service-worker update prompts, offline readiness, PWA caching, Electron support, collaboration,
editor modes, exports, AI, and coding features remain in the application. The work focuses on
state ownership, render isolation, and persistence cost.

## Phase 3 continuation — application boundaries
- Extracted local document/room persistence into `src/hooks/useDocumentPersistence.ts`.
- Persistence now keeps the latest local-note snapshot in a ref, avoiding a state update solely for a delayed `localStorage` write.
- Local persistence status now returns to `synced` after a successful flush and reports `error` when browser persistence fails.
- Extracted workspace lifecycle orchestration into `src/application/useWorkspaceCommands.ts` so archive/restore/delete/leave feedback and navigation are application commands rather than inline App handlers.
- Existing workspace lifecycle capabilities remain available; this is an ownership/refactoring change, not a feature removal.


## Current Phase 3 checkpoint
- `App.tsx`: 8,508 → 8,370 lines in this continuation (behavior-preserving extraction).
- Workspace lifecycle commands now have an application-level boundary.
- Document persistence no longer owns a delayed persistence state update through `setLocalNotes`; it uses a ref snapshot for the delayed browser-storage write.
- PWA remains enabled; no PWA capability was removed.
- Feature-preservation rule remains active: refactor/optimize first, remove nothing without an explicit product decision.
