# Code Studio Pass 7 — Collaboration & Smoothness Stability

## Fixed
- Same-browser room join now uses a persisted local room descriptor when Firebase Auth is unavailable.
- New room creation no longer attempts an unauthenticated Firestore create after Anonymous Auth fails.
- Local teaching-room metadata preserves workspace type, creator/default role, participants and Code Studio state.
- Local BroadcastChannel collaboration can carry presence, content and Code Studio open/close state between tabs.
- Tiptap/Monaco memo wrappers were simplified to reduce TypeScript compiler inference depth.
- `useLiveRoom`, presence and membership hooks now expose explicit result types.
- TypeScript dependency is moved to the 5.9 line to avoid the older compiler path that was crashing during `npm run lint`.
- Landing-page scroll surface removes large animated blur layers and hover transforms that caused visible button movement/jank.

## Cloud collaboration boundary
Firebase Firestore rules remain authenticated. If the Firebase project has Anonymous Authentication disabled and no other Firebase sign-in method is configured, cross-device cloud collaboration cannot be enabled safely by the client alone. The app therefore uses the local/BroadcastChannel transport for same-browser fallback instead of weakening Firestore rules.
