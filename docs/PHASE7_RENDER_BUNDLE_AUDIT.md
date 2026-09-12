# Phase 7 — Render + Bundle Performance Audit

## Status

Implemented as the next Phase 7 hardening pass.

## Render-cost changes

- Kept the primary rich-text editor synchronous because it is the main workspace interaction.
- Secondary workspace surfaces are now lazy-loaded: Markdown preview, bottom console, inspector, chat drawer/launcher, and dictation UI.
- Dictation preview is only mounted while a live/interim/result payload exists, preventing an unused overlay from loading during normal startup.
- The unused `AttachmentsPanel` import was removed from `App.tsx`; this eliminates an unnecessary module edge without removing a rendered feature (the component was not rendered by `App.tsx`).
- Existing Code Workspace lazy-loading remains intact; its heavy Monaco/editor/test/debugger dependencies stay off the landing bundle.

## Bundle analysis

- Added `npm run build:analyze`. It builds the production web bundle and prints the largest generated assets plus total raw asset size.
- The report intentionally does not fail the build solely because an asset exceeds 1 MiB; large vendor chunks can be valid when they are intentionally isolated. The report is a measurement tool for the next optimization pass.

## Guardrails

- No user-facing feature was removed.
- AI remains deferred.
- No fake implementation was introduced.
- Monaco, TipTap, Firebase, and export libraries retain their existing boundaries.
- Modal accessibility and reduced-motion work from the previous Phase 7 pass is preserved.
