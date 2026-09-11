# LivePad Phase 1 — Foundation & Security

## Implemented in this iteration

- Deny-by-default Firestore rules with authenticated membership checks.
- Room ownership and role changes constrained at the rules layer.
- Immutable history/audit records from the client.
- API request hardening: smaller body limits, security headers, basic per-IP rate limiting.
- AI dictation endpoints now require a Firebase ID token.
- Electron IPC now has a central trusted-renderer boundary before privileged handlers run.
- Renderer AI calls attach the current Firebase ID token.

## Important runtime requirements

The server now uses `firebase-admin` to verify Firebase ID tokens. In deployed environments, provide normal Google Application Default Credentials or configure the Firebase Admin SDK using the environment supported by the deployment platform.

For local development, install dependencies first:

```bash
npm install
npm run dev
```

Then open the printed local URL. For the desktop shell:

```bash
npm run dev:electron
```

## Not yet considered complete

- Firestore Emulator security tests still need to be wired into CI.
- Electron filesystem operations still need project-root sandboxing and path authorization.
- Git commands still need an argument-array API instead of shell interpolation.
- Terminal execution needs explicit process/resource limits and a permission gate.
- Ownership transfer should move to a server-side atomic operation.
- Production API authentication should include deployment-specific credential configuration and observability.

## Phase 1B — Desktop capability hardening

The Electron privileged surface now has a project-root capability model:

- A workspace root is authorized only when the user selects it through the native folder picker, or when reopening a previously authorized recent project.
- Filesystem read/write/create/rename/delete/copy/reveal/watch operations are restricted to authorized roots.
- Existing paths are canonicalized with `realpath` and missing paths validate their nearest existing ancestor to reduce symlink traversal risk.
- Project content search is restricted to authorized workspace roots.
- Git repository operations are restricted to authorized roots; Git file arguments must be repository-relative and Git execution uses `execFile` argument arrays.
- Terminal execution is restricted to authorized workspace roots, limits concurrent processes, command length, output volume, and runtime, and process termination is scoped to the renderer that created the process.
- Debugger launch paths/cwd, arguments, breakpoints, and evaluate expressions are bounded and sessions are scoped to their creating renderer. The Node inspector binds to localhost.
- Production Electron CSP removes `unsafe-eval`; development retains only the relaxation needed for Vite development.
- Workspace capabilities are discarded when the renderer is destroyed.

### Validation status

Static implementation is complete for this Phase 1B pass. Full TypeScript/build validation remains dependent on a successful dependency installation in the development environment. Firestore rule tests are now included and can be run with `npm run test:rules` after Firebase CLI/emulator dependencies are available.


### Development-server rate-limit fix

The application security middleware now applies the in-memory request rate limiter only to `/api/*` routes. Vite development module/static requests are intentionally excluded because a single page load can request more than 60 modules/assets in a minute; limiting those requests caused HTTP 429 responses for legitimate Vite resources and resulted in a blank development UI. Security headers and body-size validation remain global.
