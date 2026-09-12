# LivePad real-feature policy

LivePad must not display fabricated activity as if it came from a real service.

- Remote collaboration data comes from Firestore or the real same-origin BroadcastChannel fallback.
- Offline edits are persisted locally and queued for later remote delivery.
- GitHub data comes from GitHub's API after a real token is supplied.
- AI Copilot calls the protected server Gemini endpoint; it no longer generates canned answers.
- Cloud workspace snapshots are derived from actual locally persisted project files; empty state means no snapshots.
- Desktop-only terminal/debugger operations are not simulated in Web/PWA mode.
- Browser update checks do not invent a downloadable release; Electron uses the native updater IPC path.
- Voice UI never fabricates remote speaker activity. It only reports real microphone activity available to the current client.

A feature may be unavailable in a platform, but it must be explicit about that limitation rather than returning fake success.
