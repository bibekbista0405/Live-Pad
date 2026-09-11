# Phase 1 Foundation — Completed Changes

## What changed

### 1. Firestore is now deny-by-default and authorization-aware
`firestore.rules` no longer treats a valid room code as sufficient authorization.

- Cloud access requires authentication.
- Direct room reads are allowed; collection enumeration is blocked.
- Public rooms may be read by authenticated users.
- Private/invite-only rooms require membership.
- Room creation requires the authenticated user to be the owner/creator.
- Normal members can only change collaboration-safe fields.
- Presence updates are restricted to the caller's own map entry.
- Owner/admin operations are separated from normal document editing.
- History and audit logs are immutable from clients.
- User profiles are self-owned.

### 2. Workspace deletion is now a soft-delete contract
The client-side permanent room deletion path is no longer compatible with cloud rules. Future deletion should set `status: 'deleted'` and be handled by a controlled backend cleanup process.

### 3. Published local notes now create proper cloud ownership metadata
Publishing a local note now creates a complete room identity/membership record instead of an ownerless room.

### 4. Ownership transfer writes `ownerId` and `updatedAt`
This aligns the client operation with the new authorization model.

### 5. History entries include `authorUid`
This gives the security layer a stable actor identity for future audit/history policies.

### 6. Canonical permission vocabulary added
`src/domain/security/permissions.ts` is the foundation for replacing the project's multiple overlapping role/permission systems in Phase 2/3.

## Important migration note
Existing production Firestore rooms created before this foundation may be missing ownership/membership metadata. Do not deploy the new rules against production data blindly. First run a migration/backfill and security-emulator test suite.

## Verification status
- Static source inspection: completed.
- Security rules: rewritten and reviewed against current client write paths.
- Full dependency install/build: not claimed as passing in this archive; dependency installation previously timed out in the analysis environment.

## Electron Git hardening (Phase 1 iteration)

Git IPC no longer builds shell command strings. Arguments are passed through `execFile`, with explicit allowlists/validation for sync actions, bounded log count, bounded commit messages, and a command timeout. This prevents shell metacharacters in repository paths, branch names, file paths, clone targets, and commit messages from becoming command injection payloads.

This is not a complete Electron security boundary yet: filesystem path authorization, terminal process policy, debugger policy, and authenticated project capabilities remain Phase 1 work.

## Phase 1B desktop capability hardening

The Electron privileged surface now uses per-renderer workspace capabilities. Native folder selection authorizes a canonical workspace root, and filesystem/project-search/Git/terminal/debugger operations validate requested paths against that capability. Missing paths validate their nearest existing ancestor to reduce symlink traversal risk.

Terminal execution now has command/concurrency/output/runtime limits and renderer-scoped process termination. Debugger sessions are renderer-scoped, arguments and expressions are bounded, and the Node inspector binds to localhost. Production CSP removes `unsafe-eval`.

Automated Firestore rule scenarios and workspace path-authorization regression tests are included. Emulator/build execution remains pending a successful dependency installation.
