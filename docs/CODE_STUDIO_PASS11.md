# Code Studio Pass 11 — Collaboration + Desktop/PWA Surface

## Fixes
- Public workspaces consistently prefer the LivePad server collaboration transport when the room is registered there, preventing one browser from using Firestore while another uses the server fallback.
- Chat polling is cache-disabled and runs at 600ms in server-transport mode.
- Server chat responses are marked `no-store` and validate timestamps.
- Failed server chat sends remain locally visible but now surface a clear transport error instead of silently implying delivery.
- Rich Text Editor continues to avoid replacing the ProseMirror document while focused, preventing cursor jumps during local typing.
- Code Studio receives the real `activeUsers` projection from workspace presence.
- Added responsive Code Studio chrome rules for PWA standalone and Electron desktop window sizes.

## Boundary
The server room/chat registry is an in-memory fallback. It is suitable for local development and a single running LivePad server process. Production multi-instance persistence should use the authenticated Firestore transport or a durable collaboration service.
