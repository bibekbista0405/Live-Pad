# Phase 1B — Electron Capability Hardening Changelog

## Added
- `electron/ipc/workspaceAccess.ts`: per-renderer workspace-root capability and canonical path validation.
- `src/__tests__/workspaceAccess.test.ts`: traversal and missing-path regression tests.
- `src/__tests__/firestore.rules.test.ts`: Firebase Emulator security scenarios.
- `firebase.json`: Firestore emulator/rules configuration.

## Hardened
- Electron filesystem IPC: all project filesystem operations are workspace-scoped.
- Project search: restricted to authorized workspace roots.
- Git IPC: workspace-scoped repositories and repository-relative file arguments; `execFile` remains the execution primitive.
- Terminal IPC: workspace-scoped cwd, concurrency/output/runtime/command limits, renderer-scoped process termination.
- Debugger IPC: workspace-scoped scripts/cwd, bounded arguments/evaluation, renderer-scoped sessions, localhost inspector.
- Electron CSP: production removes `unsafe-eval`.
- API security middleware: safer client keying and bounded in-memory rate-limit cleanup; additional browser security headers.

## Validation
- TypeScript parser no longer reports the previously introduced malformed `useDictationEngine.ts` import.
- Full typecheck cannot complete until dependencies are installed; the current environment's dependency-only npm operation timed out.
- Firestore emulator tests are configured but have not been executed in this environment.
