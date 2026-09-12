# Phase 3 Stability & Performance Notes

## Hot paths addressed

### Editor content
Content updates continue to update the editor immediately. Local persistence is coalesced and delayed so typing is not coupled to synchronous `localStorage`/IndexedDB work.

### Cursor movement
Cursor events can arrive at editor-event frequency. Local room-state updates are now coalesced with `requestAnimationFrame`, while the existing Firebase write throttle remains in place.

### UI state
Navigation, sidebar, theme, code-mode, fullscreen, command palette, and search state are centralized in `AppUIContext` rather than being duplicated as unrelated state channels.

### Failure containment
The application root is wrapped in the existing recovery-capable `ErrorBoundary`. Feature-level boundaries remain available for specialized views.

## Compatibility

The public return shape of `useLiveRoom` remains unchanged. Existing callers do not need to migrate as a result of these Phase 3 extractions.
