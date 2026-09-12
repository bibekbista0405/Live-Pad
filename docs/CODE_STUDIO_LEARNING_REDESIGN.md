# LivePad Code Studio — Learning-first redesign

## Product model

Code Studio is a beginner-first collaborative programming classroom, not a general-purpose IDE exposed at full complexity by default.

### Teaching workspace
- Workspace creator is the owner/admin authority.
- A teacher/owner/admin can open or close the shared Code Studio session.
- `codeModeOpen` is stored on the live room document and is authoritative across connected clients.
- Students automatically enter Code Studio when the teacher opens it.
- Students can edit, run, discuss, and learn; classroom controls remain teacher-led.

### Friends / peer learning
- Study/coding sessions use the same Code Studio without teacher-only controls.
- Everyone can collaborate, edit, run, chat, and discuss code.

## UI principles
- One primary task: **learn by writing code and seeing the result**.
- Keep the editor, files, Run & Check, preview, chat, discussion, and learning tools easy to find.
- Advanced tooling remains in the application but is not the first thing a beginner sees.
- Avoid fake/demo states. Live room state, content sync, and teacher controls use the existing realtime infrastructure.
- Preserve desktop Electron and browser/PWA support.

## Shared Code Studio state
Firestore room fields:
- `codeModeOpen: boolean`
- `codeModeOpenedBy: string`
- `codeModeOpenedAt: timestamp`

Only owner/admin/teacher participants can mutate these fields. Students cannot force the classroom state.
