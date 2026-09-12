# Code Studio Redesign Pass 4

## Scope
This pass continues the Code Studio redesign without moving to Phase 8.

### UI / UX
- Replaced the command palette with a restrained LivePad modal surface.
- Unified Code Studio overlay backdrop/modal chrome.
- Removed sparkle/AI-style decorative controls from Code Studio surfaces.
- Kept Inter for product UI and JetBrains Mono for code-oriented UI.
- Kept Lucide as the icon system for consistent professional vector icons.
- Simplified the preview toolbar and removed non-functional browser history controls.

### Teaching sessions
- Teacher/admin/owner keeps project management, recycle bin, profile, export, terminal and class controls.
- Students keep the learning essentials: Files, Learn, Run, Checks, Chat and Discuss.
- Project switching/creation and management controls are hidden from students in teaching rooms.
- Normal/non-teaching workspaces retain the management controls.

### Chat
- Removed the previous undefined ref failure path.
- Added stable message DOM anchors for reply navigation.
- Added real offline queue flushing when the room reconnects.
- Sending requires a real profile name instead of creating a synthetic participant identity.
- Realtime Firestore listener remains the source of truth.

### Projects and files
- Initial workspace project now uses the same beginner web-foundations starter as Code Studio.
- No default `src/components` hierarchy is created.
- New projects create and persist `index.html`, `style.css`, and `app.js` together.
- Project/file IDs use collision-resistant UUIDs when available.
- Removed duplicate/delete project actions from the UI because the previous implementation did not perform a complete cloud-safe project cascade.
- Empty Firestore file/folder snapshots now correctly clear stale local state.

### Preview
- Preview compilation no longer mutates React state during render.
- Auto Reload now has real behavior: when disabled, editing does not force a preview reload; Run/Refresh does.
- Run explicitly increments a refresh token so manual preview execution works even with Auto Reload off.
- External preview uses the same virtual project builder as the in-app preview.
- Plain HTML projects no longer auto-boot `app.js` a second time, preventing duplicated event listeners and side effects.
- Preview iframe removes `allow-same-origin` from the sandbox to keep the local preview isolated.
- Browser-like back/forward controls were removed because the local preview does not implement navigation history.
- Copying the compiled bundle was removed from the beginner preview toolbar because it added complexity without helping the learning workflow.

## Validation
- Global TypeScript parser/type pass was run against changed files.
- No new syntax/type errors were found in the changed Code Studio files; remaining reported errors are pre-existing dependency-resolution issues from the container without installed project dependencies, plus unrelated existing test-run typing warnings.
- Full `npm run lint`, `npm run test`, `npm run build`, and Firestore emulator tests still need to be run in the user's Windows project environment where dependencies/Firebase CLI are installed.
