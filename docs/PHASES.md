# LivePad Architecture Roadmap

| Phase | Weight | Status |
|---|---:|---|
| Phase 0 — Architecture Audit & Baseline | 5% | Complete |
| Phase 1 — Foundation & Security | 25% | Complete |
| Phase 2 — Core Data Architecture | 20% | Complete (implementation baseline) |
| Phase 3 — Application & State Architecture | 15% | Complete |
| Phase 4 — Offline + Realtime Collaboration | 15% | Implementation complete — Windows validation pending |
| Phase 5 — Coding Workspace + Electron | 8% | Planned |
| Phase 6 — AI Platform | 5% | Planned |
| Phase 7 — UX + Performance | 4% | Planned |
| Phase 8 — Testing + Production | 3% | Planned |

## Architecture principle

**Pehle foundation, phir data model, phir application state, phir realtime/offline,
then feature hardening and production polish.**

Phase 2 does not perform a destructive production migration. It establishes the
canonical model, security rules, repository boundary, and compatibility adapter needed
for safe incremental migration.


## Phase 5 implementation status

Phase 5 is in progress. The current desktop baseline and acceptance criteria are documented in `docs/PHASE5_CODING_WORKSPACE_ELECTRON.md`.
