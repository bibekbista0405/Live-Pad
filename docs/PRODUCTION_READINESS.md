# LivePad Production Readiness — Phase 0

## Current status: NOT PRODUCTION READY

This is an engineering baseline, not a release approval.

### Blockers

- [ ] Full dependency install and reproducible build
- [ ] TypeScript baseline with no unexpected errors
- [ ] Firebase Emulator security suite
- [ ] Authenticated API tests
- [ ] Electron IPC security tests
- [ ] Workspace/file path sandbox tests
- [ ] Terminal/Git/debugger abuse tests
- [ ] Data migration/backfill plan
- [ ] Offline/realtime consistency tests
- [ ] E2E smoke suite
- [ ] CI pipeline
- [ ] Production/staging Firebase separation
- [ ] Error monitoring and alerting
- [ ] Backup/recovery verification
- [ ] Release/update security review

### Existing useful foundation

- React/Vite application structure exists.
- Firebase integration exists.
- Express API boundary exists.
- Electron uses context isolation, disabled Node integration, sandboxing, and web security.
- Vitest tests exist for selected utility/merge/export/release behaviors.
- A target domain/security directory has been started.

### Phase gate

Phase 0 is complete when the baseline is documented. No production deployment should be inferred from this document.
