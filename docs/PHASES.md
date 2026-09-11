# LivePad V2 — Phased Engineering Plan

## Phase 1 — Foundation & Security (CURRENT)
- Lock down Firestore authorization.
- Make authentication mandatory for cloud access.
- Separate identifiers from authorization.
- Prevent client-side ownership/role escalation.
- Make workspace deletion a soft-delete path.
- Add bounded payload validation.
- Add a canonical permission vocabulary.
- Document the target architecture without forcing a risky rewrite.

## Phase 2 — Domain & Data Model
- Split the current `NoteRoom` aggregate into workspace, membership, document, presence, messages, comments, projects and audit-log domains.
- Introduce repository interfaces.
- Migrate data with backward-compatible readers.

## Phase 3 — Application Architecture
- Break `App.tsx` into feature/application modules.
- Move Firebase/IPC calls behind repositories/use-cases.
- Remove duplicated role systems.

## Phase 4 — Local-first Sync & Collaboration
- Make local state the immediate source for edits.
- Queue operations and reconcile with the server.
- Isolate high-frequency presence from document state.
- Improve conflict semantics.

## Phase 5 — Coding Workspace
- Harden terminal, Git, debugger and filesystem boundaries.
- Replace shell-string execution with argument-safe process APIs.

## Phase 6 — AI Platform
- Authentication, rate limits, quotas, request validation, cost controls and privacy boundaries for every AI endpoint.

## Phase 7 — UX & Performance
- Simplify workspace hierarchy.
- Virtualize large lists.
- Reduce unnecessary rerenders.
- Give mobile a dedicated interaction model.

## Phase 8 — Production Release
- Emulator security tests.
- Integration/E2E tests.
- CI release gates.
- Observability, crash reporting and upgrade strategy.
