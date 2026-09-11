# LivePad Architecture Map — Phase 0

## Current high-level shape

```text
React UI
  |
  +-- App.tsx  (large orchestration boundary)
  |
  +-- hooks / context / services / platform adapters
  |
  +-- Firebase Auth + Firestore
  |
  +-- Express /api
  |      `-- Gemini AI
  |
  `-- Electron preload/IPC
         +-- filesystem
         +-- terminal
         +-- git
         +-- debugger
         +-- dialogs/window/updates
```

## Main architectural domains observed

### 1. Application shell
`src/App.tsx` currently coordinates many unrelated responsibilities: local notes, rooms, persistence, authentication-dependent behavior, editor state, exports, keyboard shortcuts, workspace setup, and large parts of UI composition.

**Target:** reduce it to composition/orchestration only.

### 2. Realtime collaboration
`src/hooks/useLiveRoom.ts` and related services/components own room synchronization, presence, typing, history, and collaboration behavior.

**Target:** repository + sync engine + domain model separation.

### 3. Persistence
There are multiple persistence mechanisms:

- Firestore
- browser `localStorage`
- IndexedDB service
- Electron native storage

**Risk:** the same conceptual state can have multiple sources of truth.

### 4. Code workspace
Monaco, project/file tree, terminal, Git, debugger, source control, cloud workspace, extensions, and code preview are separate feature surfaces but currently have significant orchestration inside large components.

**Target:** capability interfaces and explicit platform boundaries.

### 5. Server/API
The Express server currently exposes health and dictation/AI routes. Middleware is minimal and uses 50 MB JSON/urlencoded body limits.

**Target:** authenticated API boundary, validation, rate limiting, quotas, safe error responses, request-size policy.

### 6. Electron
Electron has good baseline browser isolation settings, but privileged IPC handlers expose filesystem, terminal, Git, and debugger capabilities.

**Target:** validate sender/window, constrain paths, constrain processes, validate arguments, and remove shell-string command construction.

## Dependency direction to enforce in later phases

```text
UI components
   -> application/use-case layer
      -> domain types + policies
         -> repositories/platform interfaces
            -> Firebase / IndexedDB / Electron / HTTP adapters
```

The domain layer must not depend directly on React, Electron, Firebase SDKs, or browser globals.
