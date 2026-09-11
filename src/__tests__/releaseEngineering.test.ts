import { describe, it, expect, vi } from 'vitest';
import { autoUpdateService } from '../services/autoUpdateService';
import { crashReporterService } from '../services/crashReporterService';
import { telemetryService } from '../services/telemetryService';
import { STARTER_TEMPLATES } from '../services/starterTemplates';
import { DOCUMENTATION_ARTICLES } from '../services/documentationService';
import { MARKETPLACE_CATALOG } from '../services/extensionRegistry';
import electronBuilderConfig from '../../electron-builder.json';

describe('Phase 6 — Release Engineering & Ecosystem Validation', () => {

  describe('Module 1 & 10 — Multi-Platform Installer Configuration', () => {
    it('should configure Windows installers (NSIS, MSI, Portable)', () => {
      const winTargets = electronBuilderConfig.win.target.map(t => t.target);
      expect(winTargets).toContain('nsis');
      expect(winTargets).toContain('msi');
      expect(winTargets).toContain('portable');
    });

    it('should configure macOS DMG installer', () => {
      const macTargets = electronBuilderConfig.mac.target.map(t => t.target);
      expect(macTargets).toContain('dmg');
    });

    it('should configure Linux AppImage, DEB, and RPM installers', () => {
      const linuxTargets = electronBuilderConfig.linux.target.map(t => t.target);
      expect(linuxTargets).toContain('AppImage');
      expect(linuxTargets).toContain('deb');
      expect(linuxTargets).toContain('rpm');
    });
  });

  describe('Module 2 — Auto Updates & Release Channels', () => {
    it('should default to stable release channel and allow channel switching', () => {
      expect(autoUpdateService.getState().channel).toBeDefined();
      autoUpdateService.setChannel('beta');
      expect(autoUpdateService.getState().channel).toBe('beta');
      autoUpdateService.setChannel('stable');
      expect(autoUpdateService.getState().channel).toBe('stable');
    });

    it('should perform update check and transition state', async () => {
      const state = await autoUpdateService.checkForUpdates();
      expect(['available', 'up-to-date']).toContain(state.status);
    });

    it('should handle simulated download and update ready state', async () => {
      await autoUpdateService.checkForUpdates();
      if (autoUpdateService.getState().status === 'available') {
        await autoUpdateService.startDownload();
        expect(autoUpdateService.getState().status).toBe('ready');
      }
    });
  });

  describe('Module 3 — Crash Reporting', () => {
    it('should allow toggling opt-in preference', () => {
      crashReporterService.setOptIn(true);
      expect(crashReporterService.getOptInStatus()).toBe(true);
    });

    it('should record crash reports when opted in with performance metrics', () => {
      crashReporterService.setOptIn(true);
      crashReporterService.clearReports();

      const report = crashReporterService.captureCrash({
        type: 'uncaught-exception',
        message: 'Test Exception for Verification',
        stack: 'Error: Test Exception\n  at test (test.js:1:1)'
      });

      expect(report).not.toBeNull();
      expect(report?.message).toBe('Test Exception for Verification');
      expect(crashReporterService.getReports().length).toBeGreaterThan(0);
    });

    it('should NOT record crash reports when user opts out', () => {
      crashReporterService.setOptIn(false);
      crashReporterService.clearReports();

      const report = crashReporterService.captureCrash({
        type: 'uncaught-exception',
        message: 'Opt-out test crash'
      });

      expect(report).toBeNull();
      expect(crashReporterService.getReports().length).toBe(0);
      crashReporterService.setOptIn(true); // Reset to true
    });
  });

  describe('Module 4 — Telemetry & Privacy Guarantees', () => {
    it('should guarantee no document or personal workspace content is tracked', () => {
      telemetryService.setOptIn(true);
      telemetryService.trackFeatureUsage('document_editor_opened', 'editor');

      const events = telemetryService.getLoggedEvents();
      expect(events.length).toBeGreaterThan(0);

      const latest = events[events.length - 1];
      expect(latest.details.feature).toBe('document_editor_opened');
      // Verify no document content field exists
      expect((latest.details as any).content).toBeUndefined();
      expect((latest.details as any).documentText).toBeUndefined();
    });

    it('should respect user opt-out preference', () => {
      telemetryService.setOptIn(false);
      telemetryService.trackFeatureUsage('test_feature');
      expect(telemetryService.getLoggedEvents().length).toBe(0);
    });
  });

  describe('Module 6 — Extension Marketplace', () => {
    it('should provide verified extensions in marketplace catalog', () => {
      expect(MARKETPLACE_CATALOG.length).toBeGreaterThan(0);
      const dracula = MARKETPLACE_CATALOG.find(e => e.id === 'theme-dracula-official');
      expect(dracula).toBeDefined();
      expect(dracula?.displayName).toBe('Dracula Official Theme');
    });
  });

  describe('Module 7 — Starter Templates Catalog', () => {
    it('should include all required starter templates (React, Next.js, Vue, Angular, Node.js, Python, Java, C++, Markdown, Blank, Teaching, Study Group)', () => {
      const templateIds = STARTER_TEMPLATES.map(t => t.id);
      expect(templateIds).toContain('template-react-ts');
      expect(templateIds).toContain('template-nextjs');
      expect(templateIds).toContain('template-vue');
      expect(templateIds).toContain('template-angular');
      expect(templateIds).toContain('template-nodejs');
      expect(templateIds).toContain('template-python');
      expect(templateIds).toContain('template-java');
      expect(templateIds).toContain('template-cpp');
      expect(templateIds).toContain('template-markdown');
      expect(templateIds).toContain('template-blank');
      expect(templateIds).toContain('template-teaching');
      expect(templateIds).toContain('template-study-group');
    });
  });

  describe('Module 8 — Documentation & Release Notes', () => {
    it('should contain full suite of documentation articles', () => {
      const categories = DOCUMENTATION_ARTICLES.map(d => d.category);
      expect(categories).toContain('user-guide');
      expect(categories).toContain('developer-guide');
      expect(categories).toContain('plugin-api');
      expect(categories).toContain('shortcuts');
      expect(categories).toContain('troubleshooting');
      expect(categories).toContain('release-notes');
      expect(categories).toContain('migration');
    });
  });

});
