# Phase 1 Security Test Matrix

These scenarios should be executed against the Firebase Emulator before production deployment.

| Scenario | Expected |
|---|---|
| Unauthenticated room get | DENY |
| Unauthenticated room list | DENY |
| Authenticated public room get | ALLOW |
| Authenticated private non-member get | DENY |
| Non-member private room update | DENY |
| Member edits content | ALLOW |
| Member changes ownerId | DENY |
| Member changes another user's role | DENY |
| Member changes own role | DENY |
| Public non-member self-join | ALLOW only with default role |
| User changes another user's presence | DENY |
| Member creates history as another actor | DENY |
| Client deletes history | DENY |
| Client deletes audit log | DENY |
| Member creates chat as another sender | DENY |
| Non-member reads project | DENY |
| Oversized document content | DENY |
| Oversized project file | DENY |
| User reads another user's profile | DENY |
| Collection enumeration | DENY |

Do not mark Phase 1 production-ready until these are automated.
