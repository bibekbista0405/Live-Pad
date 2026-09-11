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
