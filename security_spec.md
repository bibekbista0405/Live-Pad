# LivePad Security Specification — Phase 1 Foundation

## Security boundary
Firestore Security Rules are authoritative. Frontend permission checks are UX safeguards only. A room code is an identifier, not a password or authorization token.

## Authentication
Cloud room/workspace/user access requires an authenticated Firebase user. Anonymous Firebase Auth is acceptable for low-friction onboarding, but the resulting UID is still mandatory for authorization.

## Room authorization
- Direct room reads only; room collection listing is blocked.
- Public rooms: authenticated users may read and may join themselves with the configured default role.
- Private/invite-only rooms: membership is required.
- Creation: authenticated creator must become the owner.
- Normal members cannot change ownership, privacy, lifecycle, role, permissions or other security-sensitive metadata.
- Owner/admin operations are restricted separately.

## Integrity
- Room IDs: 4–16 characters, `[A-Za-z0-9_-]+`.
- Document content: maximum 1 MiB.
- Project file content: maximum 1 MiB.
- `createdAt` is immutable after creation.
- Creation/update timestamps use Firestore server time for security-sensitive writes.
- History and audit records are client-immutable after creation.

## Presence
Presence writes are limited to the authenticated caller's own entry. Role fields cannot be changed through presence updates.

## Deletion
Client-side workspace deletion is disabled at the Firestore layer. The product should use soft deletion (`status = deleted`) and a controlled server-side cleanup process.

## Migration warning
The hardened rules assume modern room metadata (`ownerId`, `creatorId`, `participants`, etc.). Existing rooms created under the previous permissive rules may not satisfy the new policy. Backfill/migrate them before production deployment.

## Required next security work
1. Firebase Emulator automated rules tests.
2. Dedicated invite documents for invite-only rooms.
3. Server-side ownership transfer transaction.
4. AI endpoint authentication/rate limits.
5. Electron IPC security tests and process/filesystem sandboxing.
6. Git command execution hardening.
