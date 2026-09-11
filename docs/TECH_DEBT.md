# LivePad Technical Debt Register — Phase 0

## P0 — Must address before production

| ID | Area | Problem | Direction |
|---|---|---|---|
| TD-001 | Security | Authorization must be proven by Firestore rules + membership, not room-code knowledge | Phase 1 |
| TD-002 | Electron | Git uses shell command strings / interpolation | Phase 1/5: `execFile`/argv |
| TD-003 | Electron | Filesystem `path.normalize()` is not an authorization boundary | Phase 1/5: workspace root sandbox |
| TD-004 | API | 50 MB request limits with no visible auth/rate-limit/quota layer | Phase 1/6 |
| TD-005 | Architecture | `App.tsx` is an 8k+ line orchestration monolith | Phase 3 |
| TD-006 | Data | Legacy room schema and target domain schema coexist | Phase 2 |

## P1 — High priority

- 354 textual `any` occurrences across the scanned application surface.
- 171 direct `localStorage` usages; persistence is spread across UI and utilities.
- 122 `useEffect` occurrences, increasing lifecycle coupling and cleanup risk.
- Large feature components combine view state, business rules, persistence, and platform behavior.
- Multiple role vocabularies exist; they should converge on one canonical authorization model.
- Mock/simulated/demo behavior is present in production-looking feature paths and needs explicit isolation.
- Firebase error handling currently logs detailed auth/provider information and rethrows serialized errors; this needs a deliberate privacy/error-boundary policy.

## P2 — Medium priority

- Duplicate/generated Electron JavaScript and TypeScript source files require a clear source-of-truth/build policy.
- Both npm and Bun lockfiles exist; choose and document one canonical package manager for CI/release.
- PWA runtime caching of Firebase API URLs needs review; dynamic application data should not accidentally become stale cached state.
- HTML injection points need a security review and centralized sanitization policy.
- Tests currently cover selected utilities but not the complete security/data lifecycle.

## Guiding rule

Do not solve technical debt by adding another abstraction layer on top of an unclear boundary. Each refactor should establish one source of truth and one ownership boundary.
