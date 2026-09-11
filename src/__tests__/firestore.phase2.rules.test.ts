import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');

describe('Phase 2 — canonical Firestore model', () => {
  it('defines the canonical collection boundaries', () => {
    expect(rules).toContain('match /workspaces/{workspaceId}');
    expect(rules).toContain('match /members/{uid}');
    expect(rules).toContain('match /documents/{documentId}');
    expect(rules).toContain('match /presence/{uid}');
    expect(rules).toContain('match /audit/{auditId}');
  });

  it('keeps collection enumeration disabled at workspace root', () => {
    const section = rules.slice(rules.indexOf('match /workspaces/{workspaceId}'));
    expect(section).toContain('allow list: if false;');
  });
});
