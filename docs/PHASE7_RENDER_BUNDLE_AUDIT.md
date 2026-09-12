# Phase 7 — Render & Bundle Audit

## Final optimization pass

The production build showed that the largest files are Monaco editor/vendor assets and its language workers. These are required by the coding workspace but are not needed to open the normal LivePad landing/workspace shell.

### PWA install payload

Large Monaco vendor and worker files are now excluded from Workbox install-time precaching. A 2 MiB precache ceiling is also configured. These assets remain available through normal application loading and can be cached at runtime by the browser/service-worker path after the coding workspace requests them.

This avoids turning the PWA install/update path into a 20+ MiB download dominated by editor workers.

### Build analysis

`npm run build:analyze` performs a production build and reports the largest assets. The analyzer additionally flags non-Monaco/non-worker assets over 2 MiB so the optimization does not hide unexpectedly large application chunks.

### Intentional large assets

- Monaco vendor: expected for the coding workspace.
- TypeScript/HTML/CSS/JSON workers: expected language-service assets.
- Export vendor: loaded only for export workflows.

No functionality was removed to achieve the size reduction.

## Phase 7 completion gate

Performance/accessibility foundation, modal keyboard behavior, lazy loading, render containment, reduced-motion handling, and production bundle analysis are implemented. The remaining validation is running the final lint/test/build commands on the target Windows environment and reviewing the generated bundle report.
