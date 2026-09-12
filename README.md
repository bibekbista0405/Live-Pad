# LivePad

LivePad is a real-time collaborative workspace that combines notes, documents, project files, coding tools, and desktop-native development capabilities in one application.

## Development

### Requirements

- Node.js 22+
- npm 11+
- Java 21+ for Firestore Emulator security-rule tests
- Git for desktop Git features

### Install

```bash
npm install
```

Start the application:

```bash
npm run dev
```

For the Electron desktop development build:

```bash
npm run dev:electron
```

## Validation

Run the normal TypeScript and application tests:

```bash
npm run lint
npm run test
```

Run the Firestore security-rule suite with the emulator:

```bash
npm run test:rules
```

The current validation gate requires all three commands to complete successfully.

## Architecture roadmap

- Phase 0 — Architecture Audit & Baseline: complete
- Phase 1 — Foundation & Security: complete
- Phase 2 — Core Data Architecture: complete
- Phase 3 — Application & State Architecture: complete
- Phase 4 — Offline + Realtime Collaboration: complete
- Phase 5 — Coding Workspace + Electron: in progress
- Phase 6 — AI Platform: planned
- Phase 7 — UX + Performance: planned
- Phase 8 — Testing + Production: planned

See the phase documentation in `docs/` for engineering decisions and validation records.

## Desktop capabilities

Electron provides the native capabilities that are unavailable or intentionally restricted in the browser, including:

- Authorized local workspace filesystem access
- Native terminal/process execution
- Git operations
- Project search and recent-project management
- Native debugger integration for supported Node.js workflows
- Native window, clipboard, notification, and update services

Renderer code cannot directly access Node.js APIs. Privileged operations cross the preload/IPC boundary and are validated against the authorized workspace.

## Feature policy

LivePad does not intentionally present simulated success as real work. A capability either executes against the real underlying service or clearly reports when the current platform does not support it.

## Branding

Official LivePad brand assets are stored under `public/brand/`.
