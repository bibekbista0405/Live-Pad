# LivePad Foundation Checklist

## Phase 1 — Current

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
- [ ] Firebase Emulator rules test suite
- [ ] Production-data migration/backfill
- [ ] AI API authentication + rate limits
- [ ] Electron IPC security tests
- [ ] Safe process argument handling

## Phase 2 — Next

- [ ] Split `NoteRoom` aggregate into domain records
- [ ] Introduce repository interfaces
- [ ] Add migration-compatible readers/writers
- [ ] Consolidate role systems

## Phase 3

- [ ] Decompose `App.tsx`
- [ ] Move infrastructure calls behind use-cases/repositories
- [ ] Add integration tests around core workflows
