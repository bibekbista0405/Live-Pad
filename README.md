<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fab92e81-53c5-451a-bd7a-9855322484de

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## LivePad V2 Foundation Status

The project is now organized around a phased hardening plan. **Phase 1 (Foundation & Security)** is the current engineering baseline.

Key Phase 1 changes in this archive:

- Firestore rules are deny-by-default and authorization-aware.
- Room codes are identifiers, not authorization credentials.
- Cloud room access requires authentication.
- Room collection enumeration is blocked.
- Ownership/creator metadata is protected.
- Presence updates are scoped to the caller's own identity.
- History/audit records are client-immutable after creation.
- Workspace deletion is intended to be soft-delete rather than direct document deletion.
- A canonical permission vocabulary has been added under `src/domain/security/`.
- Target V2 architecture and migration phases are documented under `docs/`.

**Production warning:** Existing Firestore rooms created under older rules may need metadata backfill before the hardened rules are deployed. Run Firebase Emulator security tests before changing production rules.

## LivePad V2 — Phase 0 Baseline

Phase 0 establishes the engineering baseline before further refactoring. See:

- `docs/PHASE0_BASELINE.md`
- `docs/ARCHITECTURE_MAP.md`
- `docs/TECH_DEBT.md`
- `docs/SECURITY_RISK_REGISTER.md`
- `docs/PRODUCTION_READINESS.md`

The project is intentionally **not** considered production-ready until the validation gates in these documents are completed.

## Installation

LivePad intentionally ships without a generated `package-lock.json` in the development source archive. This avoids stale npm Arborist dependency-graph state after dependency changes.

Requirements: Node.js 22+ and npm 11+. From the project root run:

```bash
npm cache verify
npm install
```

Then start the web/server development environment with `npm run dev`.

If npm reports an `idealTree` / `edgesOut` error, remove `node_modules` and the local npm lockfile, then run `npm install` again:

```bash
# Windows CMD
rmdir /s /q node_modules
del package-lock.json
npm cache verify
npm install
```

### npm install troubleshooting

This project intentionally uses `legacy-peer-deps=true` because npm 11.x can crash in Arborist while resolving Vitest optional peer dependencies (`edgesOut` error). The setting is project-local and does not change your global npm configuration.

On Windows, from the project root:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
npm cache verify
npm install
```

If npm itself still fails, use npm 10 for this project:

```powershell
npm install -g npm@10.9.2
npm --version
npm install
```

## Dependency/runtime fix (September 2026)

- Added `monaco-editor@0.56.0` because `src/services/languageService.ts` imports Monaco directly.
- Removed `@babel/standalone` from npm dependencies because LivePad's virtual preview injects Babel Standalone from its CDN URL at runtime; keeping the npm package caused Node 22.16 engine warnings with Babel 8.
- After extracting a fresh ZIP, run `npm install` to generate a fresh `package-lock.json`.


### Development server note

If the browser previously showed `HTTP 429` for Vite module requests, use this updated build. The API rate limiter is scoped to `/api/*`; Vite assets/modules are no longer rate-limited during development.

## Architecture status

- Phase 0 — Architecture Audit & Baseline: **Complete**
- Phase 1 — Foundation & Security: **Complete**
- Phase 2 — Core Data Architecture: **Complete (implementation baseline)**
- Phase 3 — Application & State Architecture: **Next**

Phase 2 introduces the canonical `workspaces/{workspaceId}` data hierarchy and
repository boundary while preserving the legacy `rooms/{roomId}` tree for safe,
non-destructive migration. See `docs/PHASE2_CORE_DATA_ARCHITECTURE.md`.


## Current architecture status

- Phase 0 — Architecture Audit & Baseline: complete
- Phase 1 — Foundation & Security: complete
- Phase 2 — Core Data Architecture: complete
- Phase 3 — Application & State Architecture: in progress
- Official LivePad branding is sourced from `public/brand/` and replaces the previous generated SVG/placeholder app icon assets.

See `docs/PHASE3_APPLICATION_STATE.md` for the current Phase 3 boundary and migration plan.


### Phase 3 — Application/state + performance
PWA support remains enabled. Its lifecycle is isolated in `src/hooks/usePWA.ts`. The application also uses memoized editor projections and coalesced local persistence to reduce typing lag without removing features.

## Phase 3 status

Phase 3 (Application & State Architecture) is complete at the compatibility boundary.
The next roadmap stage is Phase 4 — Offline + Realtime Collaboration. No product capability
was intentionally removed during the Phase 3 refactor; PWA remains enabled.
