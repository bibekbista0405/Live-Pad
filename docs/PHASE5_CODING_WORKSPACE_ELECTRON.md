# Phase 5 — Coding Workspace + Electron

## Objective

Turn LivePad's desktop coding workspace into a real, security-bounded development environment while preserving browser/PWA functionality and making unsupported capabilities explicit.

## Current baseline

- Electron renderer runs with context isolation, disabled Node integration, and sandboxing.
- Privileged operations cross the preload/IPC boundary.
- IPC requests are rejected when the sender is not a trusted LivePad renderer.
- Local filesystem operations require an authorized workspace root and canonical-path validation.
- Native terminal execution is bounded by command length, process count, output size, and runtime limits.
- Git commands use `execFile` with argument arrays rather than shell interpolation.
- Project search excludes generated/dependency directories and bounds result counts.
- Native debugger launches supported Node.js scripts through the workspace boundary.
- Browser/PWA paths do not pretend to provide native filesystem, terminal, or debugger capabilities.

## Phase 5 work in this iteration

1. Removed third-party AI marketing/generator branding from the product README and environment documentation. The server-side AI implementation remains available as an implementation detail.
2. Reworked debugger command handling so controls wait for an actual inspector response instead of immediately reporting success.
3. Reworked breakpoint creation so the UI receives the inspector's actual breakpoint identifier and verification state.
4. Reworked debugger expression evaluation to use the same request/response command path with a bounded timeout.
5. Preserved the existing workspace, terminal, Git, PWA, AI, and collaboration features.

## Remaining Phase 5 targets

- Add dedicated Electron IPC integration tests.
- Parse real per-test runner results rather than reporting only process-level status.
- Validate debugger source-map and breakpoint behavior across supported Node.js project layouts.
- Harden recent-project metadata operations and lifecycle cleanup.
- Validate production Electron packaging and native capability permissions.
- Verify desktop updater behavior against real release artifacts.

## Acceptance rule

A Phase 5 capability is complete only when it executes against the real desktop service or explicitly reports that the current platform/workflow is unsupported. Simulated success is not an accepted implementation.
