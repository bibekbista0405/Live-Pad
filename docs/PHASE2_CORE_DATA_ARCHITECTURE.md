# Phase 2 — Core Data Architecture

Status: **Implemented**

## Goal

Move LivePad from a large mutable `rooms/{roomId}` document toward a canonical,
bounded workspace aggregate. Firestore details are isolated behind repositories;
the legacy room model remains available as a compatibility surface during migration.

## Canonical model

```text
workspaces/{workspaceId}
├── members/{uid}
├── presence/{uid}
├── documents/{documentId}
├── messages/{messageId}
├── comments/{commentId}
├── attachments/{attachmentId}
├── projects/{projectId}
├── history/{historyId}
└── audit/{auditId}
```

### Ownership and authority

- `workspaces/{id}.ownerId` is the canonical workspace owner.
- `workspaces/{id}/members/{uid}.role` is the canonical membership role.
- The Phase 1 `rooms/{id}.participants` structure is legacy compatibility data.
- Client code must not infer authorization from room codes, display names, or local state.
- Firestore Rules remain the authoritative enforcement layer.

## Repository boundary

`src/data/repositories/contracts.ts` defines persistence ports. Firestore adapters
translate timestamps, paths, and storage fields into domain records. This prevents
components/hooks from spreading Firestore-specific knowledge throughout the app.

Implemented repository adapters:

- Workspace
- Members
- Documents

The same contracts are ready for Messages, Comments, Presence, Projects, History,
and Audit repositories as the feature surfaces migrate.

## Compatibility strategy

`src/data/migrations/legacyWorkspaceAdapter.ts` is intentionally read-only. It maps
legacy `NoteRoom` data into canonical domain records without performing dual writes.
This avoids two sources of truth during the transition.

## Migration sequence

1. Create canonical workspace + owner member in one controlled flow.
2. Backfill members from legacy participants.
3. Backfill documents/history/messages/comments/projects.
4. Verify counts and ownership invariants.
5. Switch reads to repositories.
6. Switch writes to repositories.
7. Freeze legacy writes.
8. Remove legacy `rooms` dependencies after a verified retention window.

No destructive migration is performed automatically by Phase 2.
