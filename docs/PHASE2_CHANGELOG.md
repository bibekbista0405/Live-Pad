# Phase 2 Changelog

## Added
- Canonical workspace domain records.
- Repository contracts for workspace, members, presence, documents, messages,
  comments, projects, history, and audit.
- Firestore path registry.
- Firestore workspace/member/document repository adapters.
- Legacy `NoteRoom` read-only migration adapter.
- Canonical Firestore rules for workspace subcollections.
- Phase 2 structural tests.
- Phase 2 migration checklist and architecture documentation.

## Safety
- No automatic production data migration.
- No destructive deletion of legacy room data.
- No dual-write path introduced.
- Legacy `rooms` security surface remains available until feature migration is verified.
