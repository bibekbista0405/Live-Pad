export interface DocArticle {
  id: string;
  title: string;
  category: 'user-guide' | 'developer-guide' | 'plugin-api' | 'shortcuts' | 'troubleshooting' | 'release-notes' | 'migration';
  content: string;
}

export const DOCUMENTATION_ARTICLES: DocArticle[] = [
  {
    id: 'user-guide-overview',
    title: 'LivePad User Guide',
    category: 'user-guide',
    content: `
# LivePad User Guide

Welcome to LivePad — the real-time collaborative workspace and IDE for web, desktop, and PWA.

## Core Features:
1. **Document Editor**: Rich text editing with Markdown, HTML/DOCX/PDF export, offline auto-saving, and real-time conflict-free collaboration.
2. **Code Mode & IDE**: Built-in code editor with Monaco syntax highlighting, virtual project file explorer, integrated terminal execution, and Git integration.
3. **Real-Time Collaboration**: Share workspace room codes with peers for multiplayer cursors, typing sync, and voice chat.
4. **Desktop & Offline Native**: Seamless desktop experience with file system access, offline database sync, and status persistence.
`
  },
  {
    id: 'dev-guide-arch',
    title: 'Developer Guide & Architecture',
    category: 'developer-guide',
    content: `
# LivePad Developer Guide

LivePad uses a unified modular architecture across Web, PWA, and Electron environments.

## Tech Stack:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **State & Database**: Firestore with IndexedDB offline local fallback and quota resilience wrappers.
- **Desktop Runtime**: Electron IPC bridge with native terminal, fs access, and shell commands.
- **Execution & Sandbox**: Web Container / Virtual Worker task runner for in-browser JavaScript execution.
`
  },
  {
    id: 'plugin-api-docs',
    title: 'Plugin & Extension API Specification',
    category: 'plugin-api',
    content: `
# LivePad Extension API (v1.0)

Extensions can contribute Themes, Languages, Snippets, AI Assistants, and Commands.

## Example Theme Contribution:
\`\`\`json
{
  "id": "custom-theme",
  "name": "Custom Dark",
  "contributes": {
    "themes": [
      {
        "id": "dark-synth",
        "label": "Dark Synth",
        "uiTheme": "vs-dark"
      }
    ]
  }
}
\`\`\`
`
  },
  {
    id: 'keyboard-shortcuts-doc',
    title: 'Keyboard Shortcuts Reference',
    category: 'shortcuts',
    content: `
# Keyboard Shortcuts

| Command | Windows / Linux | macOS |
| :--- | :--- | :--- |
| Quick Command Palette | \`Ctrl + Shift + P\` | \`Cmd + Shift + P\` |
| Save Document | \`Ctrl + S\` | \`Cmd + S\` |
| Toggle Code Mode | \`Ctrl + Alt + C\` | \`Cmd + Option + C\` |
| Toggle Terminal | \`Ctrl + \` \` | \`Cmd + \` \` |
| Find in Workspace | \`Ctrl + Shift + F\` | \`Cmd + Shift + F\` |
`
  },
  {
    id: 'troubleshooting-doc',
    title: 'Troubleshooting & Recovery',
    category: 'troubleshooting',
    content: `
# Troubleshooting Guide

## Offline / Quota Fallback
If cloud database quota limits are reached or you lose network connection, LivePad automatically switches to offline IndexedDB mode. All changes remain safely saved locally and will auto-sync upon reconnect.

## Restoring Unsaved Sessions
If LivePad is forcibly closed, open **Settings > Recovery** to restore previous workspace snapshots.
`
  },
  {
    id: 'release-notes-v1',
    title: 'Release Notes (v1.0.0 Stable)',
    category: 'release-notes',
    content: `
# LivePad v1.0.0 Release Notes

### What's New:
- **Production Hardening**: Zero-leak event listener lifecycle, Firestore quota limit auto-fallback, 3-way conflict-free text merge engine.
- **Multi-Platform Installers**: Windows NSIS/MSI, macOS DMG, Linux AppImage/DEB/RPM configurations.
- **Release Channels**: Switch between Stable, Beta, and Nightly updates in Settings.
- **Full Starter Templates**: React, Next.js, Vue, Angular, Node.js, Python, Java, C++, Markdown, Teaching Workspaces.
`
  },
  {
    id: 'migration-guide-doc',
    title: 'Migration Guide (v0.9 -> v1.0)',
    category: 'migration',
    content: `
# LivePad Migration Guide

Upgrading to v1.0 is completely seamless and backward-compatible.
All workspace files, IndexedDB backups, and settings automatically migrate to the new robust schema format.
`
  }
];
