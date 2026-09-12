# Code Studio Redesign Pass 3

## Goal
Turn Code Studio into a beginner-first HTML/CSS/JavaScript learning workspace while keeping real collaboration and existing coding capabilities available.

## Implemented
- Replaced the broken chat panel implementation with a compact realtime Firestore chat surface.
- Fixed the `messagesContainerRef is not defined` runtime failure by owning input/scroll refs inside ChatPanel.
- Chat uses the authenticated user's UID and supplied profile name; it never seeds demo participant names.
- Realtime messages, replies, reactions, edits and deletes remain backed by Firestore.
- Offline sends are retained in the existing durable chat outbox.
- Reworked chat visual hierarchy to remove gradients, oversized bubbles, excessive blur and floating-card stacking.
- Reworked comment-panel chrome to behave like a normal Code Studio side panel.
- Kept realtime code-comment listeners/replies in CodeWorkspace and tightened the visual presentation.
- Simplified project creation to one real Web Foundations starter: `index.html`, `style.css`, `app.js`.
- New projects now immediately create and persist their starter files rather than creating only a project record.
- Scoped Code Studio styling now uses a restrained dark product shell and cleaner activity/sidebar/editor chrome.

## Deliberately removed from the primary learner surface
- AI-generated UI surfaces.
- Python/React starter choices in the new-project flow.
- Decorative/floating chat trigger UI.
- Advanced IDE controls from the primary activity bar where they were not part of the HTML/CSS/JS learning path.

## Non-goals
- No Phase 8 work.
- No fake AI responses.
- No fake participant names.
- No removal of real Monaco, preview, file operations, collaboration, testing or debugging capabilities; advanced capabilities remain available where the existing product exposes them.

## Validation note
The edited workspace was parser-checked with the globally available TypeScript compiler. The container does not contain the project's installed npm dependency tree, so a full lint/test/build run is intentionally not claimed here. The user's Windows environment remains the authoritative runtime validation environment.
