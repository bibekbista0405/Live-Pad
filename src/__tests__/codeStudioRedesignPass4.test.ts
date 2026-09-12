import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Code Studio redesign pass 4', () => {
  it('keeps teacher-only management controls out of student command options', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/CodeWorkspace.tsx'), 'utf8');
    expect(source).toContain('const visibleCommandOptions = commandOptions.filter');
    expect(source).toContain("!command.teacherOnly || !isTeachingSession || canControlCodeMode");
    expect(source).toContain('showManagementControls={!isTeachingSession || canControlCodeMode}');
  });

  it('uses the same virtual builder for manual external preview and prevents duplicate HTML-project boot', () => {
    const workspace = readFileSync(resolve(process.cwd(), 'src/components/CodeWorkspace.tsx'), 'utf8');
    const builder = readFileSync(resolve(process.cwd(), 'src/utils/virtualProjectBuilder.ts'), 'utf8');
    const preview = readFileSync(resolve(process.cwd(), 'src/components/CodePreviewPanel.tsx'), 'utf8');
    expect(workspace).toContain('buildVirtualProject(files, activeFile, folders)');
    expect(builder).toContain('if (hasHtmlDocument) return;');
    expect(preview).toContain('const [previewDocument, setPreviewDocument] = useState');
    expect(preview).toContain('refreshToken?: number');
  });

  it('has no undefined legacy chat scroll refs and keeps the real message anchor', () => {
    const chat = readFileSync(resolve(process.cwd(), 'src/components/collaboration/ChatPanel.tsx'), 'utf8');
    expect(chat).toContain('const scrollRef = useRef<HTMLDivElement | null>(null);');
    expect(chat).toContain('const endRef = useRef<HTMLDivElement | null>(null);');
    expect(chat).toContain('id={`chat-${message.id}`}');
    expect(chat).not.toContain('messagesContainerRef');
    expect(chat).not.toContain('messagesEndRef');
  });
});
