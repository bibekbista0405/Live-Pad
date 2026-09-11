# Phase 2 Migration Checklist

- [x] Canonical workspace aggregate defined
- [x] Canonical role vocabulary defined
- [x] Repository contracts introduced
- [x] Firestore workspace/member/document adapters introduced
- [x] Canonical Firestore security rules introduced
- [x] Legacy read-only adapter introduced
- [x] Structural rules tests introduced
- [ ] Production backfill run against real Firebase data
- [ ] Feature-by-feature read migration
- [ ] Feature-by-feature write migration
- [ ] Legacy `rooms` collection retired

The unchecked items require a real production Firebase environment and must not be
performed automatically against user data.
