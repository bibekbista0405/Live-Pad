# LivePad Security Risk Register — Phase 0

Severity reflects architectural risk observed during source audit.

| ID | Severity | Surface | Finding | Required action |
|---|---|---|---|---|
| SEC-001 | Critical | Firestore | Authorization must be enforced server-side for every protected operation | Emulator-tested rules + membership model |
| SEC-002 | Critical | Electron FS | Arbitrary normalized paths can reach privileged filesystem operations | **Implemented:** per-renderer authorized workspace roots + canonical path checks; regression tests added |
| SEC-003 | Critical | Electron Git | Shell command strings interpolate user-controlled values | **Implemented:** `execFile` argument arrays + repo/file-path validation |
| SEC-004 | High | Electron IPC | IPC handlers need explicit sender/window validation | **Implemented:** central trusted-renderer IPC guard |
| SEC-005 | High | Terminal | Renderer can request powerful local process execution | **Implemented:** authorized cwd, concurrency/output/runtime/command limits, renderer-scoped kill |
| SEC-006 | High | Debugger | Local process/debugger execution is privileged | **Implemented:** workspace-scoped launch, bounded args/expression, renderer-scoped sessions, localhost inspector |
| SEC-007 | High | API | AI endpoints lack a visible authentication/rate-limit/usage-control boundary | **Partial:** Firebase ID-token auth + basic rate limiting; usage accounting/quotas remain |
| SEC-008 | High | API | Large JSON body limit creates DoS/cost exposure | **Implemented:** 5 MB global parser/body guard; route-specific limits remain |
| SEC-009 | High | AI | Gemini API key is server-side, but request authorization and quota ownership are not yet defined | Authenticated usage accounting |
| SEC-010 | Medium | Browser | Multiple direct localStorage stores can contain user/workspace state | Central persistence adapter |
| SEC-011 | Medium | HTML | `dangerouslySetInnerHTML`/raw `innerHTML` require centralized sanitization review | Security review + safe renderer |
| SEC-012 | Medium | Mock paths | Simulated/demo behavior can be confused with production capabilities | Explicit mock adapters and feature flags |

## Security invariants for Phase 1

1. A room/workspace identifier is never an authorization credential.
2. Every cloud read/write is evaluated against authenticated identity and membership/role.
3. Privileged desktop operations are capability-gated and path/argument validated.
4. Client-provided role/owner/audit fields are never trusted blindly.
5. API requests have explicit authentication, size, rate, timeout, and quota policies.
6. Errors shown to clients do not leak secrets or unnecessary identity/provider details.
