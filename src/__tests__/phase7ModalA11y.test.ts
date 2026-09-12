import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Phase 7 — modal accessibility hardening', () => {
  it('ships a shared modal focus and Escape primitive', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/hooks/useModalA11y.ts'), 'utf8');
    expect(source).toContain('event.key === \'Escape\'');
    expect(source).toContain('event.key !== \'Tab\'');
    expect(source).toContain('previousFocusRef.current?.focus()');
  });

  it('applies dialog semantics to high-frequency overlays', () => {
    for (const file of [
      'src/components/CommandPalette.tsx',
      'src/components/KeyboardShortcutsModal.tsx',
      'src/components/CreateWorkspaceModal.tsx'
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(source).toContain('useModalA11y');
      expect(source).toContain('role="dialog"');
      expect(source).toContain('aria-modal="true"');
    }
  });
});
