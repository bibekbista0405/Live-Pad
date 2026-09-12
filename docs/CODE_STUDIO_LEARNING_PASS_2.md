# LivePad Code Studio — Learning + Collaboration Pass 2

## Goal

Keep Code Studio beginner-first for HTML, CSS and JavaScript while making collaboration real and reducing visual noise.

## Implemented

- Replaced the AI knowledge-base sidebar with a focused web-learning panel.
- Replaced the debugger-first Run sidebar with a beginner-friendly Run/Preview panel.
- Removed the AI Copilot surface from Code Studio. The AI service is not part of the learner workflow.
- Removed the duplicate Project Dashboard demo surface.
- Removed the legacy collaboration-engine demo data and rebuilt the live session bar from real workspace presence.
- Live session avatars and names now come from the workspace's real `activeUsers` data.
- Removed random generated participant names from room creation/joining. A real entered/profile name is required.
- Fixed Code Studio Chat to use the authenticated Firebase UID rather than the display name as the identity key.
- Removed the duplicate floating chat drawer while Code Studio is open; Code Studio has one clear Chat destination.
- Simplified Chat grouping/search chrome and reduced visual effects.
- Live code comments now persist to Firestore under `rooms/{roomId}/comments` with replies under each thread.
- Live comment threads and replies are subscribed in realtime so collaborators see changes without refresh.
- Comment authorization is enforced by Firestore rules; authors/teachers/admins can resolve, and authors/admins can delete.
- Comment creation uses the real authenticated UID and profile/display name.
- Selecting a code line/text before opening Discuss carries the real line and selection into the comment composer.
- Added a learning panel organized around HTML → CSS → JavaScript with direct file navigation.
- Removed the architecture/API/document-generation AI panel from the learner workflow.
- Removed fake sample people from the deleted dashboard/collaboration surfaces.

## Product principle

Code Studio should teach the web foundations first. Advanced tooling may remain in the codebase for future focused surfaces, but it should not compete with the beginner workflow.

Phase 8 is intentionally not started by this pass.
