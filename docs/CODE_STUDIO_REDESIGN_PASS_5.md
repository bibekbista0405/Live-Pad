# Code Studio Redesign Pass 5

## Focus

This pass addresses the reported Code Studio collaboration, preview, and typing problems without starting Phase 8.

### Collaboration
- Teaching-room Code Studio state remains authoritative in the room document.
- Room snapshot merging now preserves `codeModeOpen`, `codeModeOpenedBy`, and `codeModeOpenedAt` even when the snapshot is a local echo or arrives while the editor is locked.
- Workspace chat uses deterministic message IDs and optimistic local rendering, then persists through Firestore.
- Chat reconnect retry is handled by recreating the listener instead of forcing a page reload.
- Code discussion comments/replies use deterministic IDs and optimistic local rendering.
- Workspace chat receives the authoritative UID from `useLiveRoom`.

### Teaching permissions
- Teacher/owner/admin keep project/file management controls in teaching sessions.
- Students keep learning, preview, chat, and discussion surfaces but cannot create, rename, duplicate, delete, move, upload, or manage projects/files through the Code Studio UI or shortcuts.
- The same management controls remain available in normal non-teaching workspaces.

### Editor responsiveness
- Monaco remains local and synchronous while typing.
- Parent application content propagation is debounced.
- Project-file Firestore persistence is debounced instead of running on every keystroke.
- Local disk writes remain immediate when a PWA file handle is mounted.

### Preview
- Embedded JSON used by the preview runtime is HTML-safe, preventing a literal `</script>` in project content from terminating the runtime script.
- Vanilla HTML/CSS/JavaScript projects no longer receive the React/module bootstrap unnecessarily.
- Preview toolbar/status styling is aligned with Code Studio product chrome.

## Validation note

The container does not contain the project's installed npm dependencies, so full `npm run lint`, `npm run test`, production build, and Firebase emulator rules execution must still be run in the user's Windows project environment.
