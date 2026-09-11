# LivePad V2 Target Architecture

```text
UI / React
    │
    ▼
Feature layer
    │
    ▼
Application use-cases
    │
    ▼
Domain models + policies
    │
    ├──────────────┐
    ▼              ▼
Local store     Repositories
    │              │
    └──── Sync ────┤
                   ▼
          Firebase / Server APIs

Electron privileged capabilities remain behind IPC boundaries.
```

## Target feature layout

```text
src/
├── app/
├── features/
│   ├── workspace/
│   ├── editor/
│   ├── collaboration/
│   ├── coding/
│   ├── ai/
│   ├── github/
│   └── export/
├── domain/
│   ├── security/
│   └── workspace/
├── infrastructure/
│   ├── firebase/
│   ├── api/
│   ├── electron/
│   └── storage/
└── shared/
```

The existing application is intentionally not moved wholesale in Phase 1. We will migrate feature-by-feature so every step remains buildable and reversible.

## Non-negotiable boundaries
1. UI permissions are UX only; server rules are authoritative.
2. Room codes are identifiers, not secrets.
3. Secrets never live in renderer/client bundles.
4. Filesystem/terminal/debugger access is privileged.
5. High-frequency presence does not belong in the primary workspace document long term.
6. Domain logic should not import React.
