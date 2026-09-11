# LivePad Foundation Checklist

## Phase 1 — Complete (implementation)

- [x] Deny-by-default Firestore fallback
- [x] Authentication required for cloud room access
- [x] Direct room reads separated from collection listing
- [x] Owner-bound room creation
- [x] Protected ownership fields
- [x] Self-scoped presence changes
- [x] Bounded document/project payloads
- [x] Immutable history/audit records
- [x] Soft-delete contract documented
- [x] Canonical permission vocabulary
- [x] Architecture/migration docs
- [x] Firebase Emulator rules test suite added
- [ ] Production-data migration/backfill
- [ ] AI API authentication + rate limits
- [x] Electron IPC security test coverage added
- [x] Safe process argument handling

## Phase 2 — Complete (architecture baseline)

- [x] Split `NoteRoom` aggregate into canonical domain records
- [x] Introduce repository interfaces
- [x] Add migration-compatible readers/writers
- [x] Consolidate role vocabulary at the domain boundary

## Phase 3 — In progress

- [x] Centralize cross-cutting UI state in `AppUIContext`
- [x] Isolate PWA lifecycle/install state in `usePWA` without removing PWA
- [x] Remove the 1-second save-clock rerender from the root `App` tree
- [x] Memoize expensive editor projections and derived collections
- [x] Coalesce local persistence during typing to reduce input lag
- [ ] Decompose `App.tsx` feature sections
- [ ] Move infrastructure calls behind use-cases/repositories
- [ ] Add integration tests around core workflows
- [ ] Extract workspace/session responsibilities from `useLiveRoom`
