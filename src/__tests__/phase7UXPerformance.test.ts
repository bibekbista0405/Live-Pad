import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Phase 7 — UX + Performance foundation', () => {
  it('keeps decorative background animation CSS-driven and visibility-aware', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/BackgroundParticles.tsx'), 'utf8');
    expect(source).toContain('usePageVisibility');
    expect(source).toContain('livepad-background-paused');
    expect(source).not.toContain('requestAnimationFrame');
  });

  it('keeps secondary workspace surfaces out of the initial App module graph', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(source).toContain("lazy(() => import('./components/MarkdownPreviewPanel'))");
    expect(source).toContain("lazy(() => import('./components/BottomConsolePanel'))");
    expect(source).toContain("lazy(() => import('./components/collaboration/ChatPanel')");
    expect(source).toContain("lazy(() => import('./components/dictation/DictationToolbar')");
    expect(source).not.toContain("import { AttachmentsPanel } from './components/AttachmentsPanel'");
  });

  it('ships global keyboard focus and reduced-motion safeguards', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('livepad-deferred-surface');
  });
});
