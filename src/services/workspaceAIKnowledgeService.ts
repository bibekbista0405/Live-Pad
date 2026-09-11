import { ArchitectureNode, RouteMapItem } from '../types/phase4';
import { projectIndexEngine } from './projectIndexEngine';

export class WorkspaceAIKnowledgeService {
  private static instance: WorkspaceAIKnowledgeService;

  public static getInstance(): WorkspaceAIKnowledgeService {
    if (!WorkspaceAIKnowledgeService.instance) {
      WorkspaceAIKnowledgeService.instance = new WorkspaceAIKnowledgeService();
    }
    return WorkspaceAIKnowledgeService.instance;
  }

  // Generate Project Architecture Nodes
  public getArchitectureOverview(): ArchitectureNode[] {
    const indexed = projectIndexEngine.getIndexedFiles();
    const nodes: ArchitectureNode[] = [];

    indexed.forEach((file, idx) => {
      let type: ArchitectureNode['type'] = 'component';
      if (file.relativePath.includes('service')) type = 'service';
      else if (file.relativePath.includes('hook')) type = 'hook';
      else if (file.relativePath.includes('ipc') || file.relativePath.includes('api')) type = 'route';
      else if (file.relativePath.includes('platform')) type = 'external';

      nodes.push({
        id: `node-${idx}`,
        name: file.relativePath.split('/').pop() || file.relativePath,
        type,
        filePath: file.relativePath,
        importsCount: (file.content?.match(/import/g) || []).length,
        exportedSymbols: file.symbols.map((s) => s.name),
      });
    });

    return nodes.slice(0, 20);
  }

  // Generate Route Map
  public getRouteMap(): RouteMapItem[] {
    return [
      { path: '/api/health', method: 'GET', handlerName: 'healthCheckHandler', filePath: 'server.ts', isProtected: false },
      { path: '/api/workspace/sync', method: 'POST', handlerName: 'syncWorkspaceHandler', filePath: 'server.ts', isProtected: true },
      { path: '/api/git/commit', method: 'POST', handlerName: 'gitCommitHandler', filePath: 'electron/ipc/git.ts', isProtected: true },
      { path: '/api/debugger/launch', method: 'POST', handlerName: 'launchDebuggerHandler', filePath: 'electron/ipc/debugger.ts', isProtected: true },
      { path: '/api/ai/copilot', method: 'POST', handlerName: 'aiCopilotStreamHandler', filePath: 'server.ts', isProtected: true },
    ];
  }

  // Generate README Markdown summary automatically
  public generateProjectDocumentation(): string {
    const context = projectIndexEngine.getWorkspaceContextSummary();
    const routes = this.getRouteMap();

    return `# LivePad Enterprise Workspace Documentation

## Overview
LivePad is a full-stack, cross-platform collaborative IDE running seamlessly across Web, PWA, and Desktop (Electron) environments.

## System Architecture Summary
${context}

## Exposed API Routes & Handles
${routes.map((r) => `- **${r.method} ${r.path}** \`[${r.filePath}]\` — Handler: \`${r.handlerName}\``).join('\n')}

## Security & Access Control
- Fine-grained role matrix: Owner, Admin, Maintainer, Developer, Reviewer, Commenter, Viewer, Guest.
- Audit logging & session state tracking enabled.
`;
  }
}

export const workspaceAIKnowledgeService = WorkspaceAIKnowledgeService.getInstance();
