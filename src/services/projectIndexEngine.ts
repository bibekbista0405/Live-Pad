import { DirectoryItem } from '../platform/types';
import { Platform } from '../platform';

export interface IndexedSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'export' | 'route' | 'variable';
  filePath: string;
  relativePath: string;
  line: number;
  snippet: string;
}

export interface IndexedFile {
  path: string;
  relativePath: string;
  size?: number;
  extension: string;
  symbols: IndexedSymbol[];
  content?: string;
}

export class ProjectIndexEngine {
  private static instance: ProjectIndexEngine;
  private indexMap = new Map<string, IndexedFile>();
  private isIndexing = false;
  private lastIndexTime = 0;

  public static getInstance(): ProjectIndexEngine {
    if (!ProjectIndexEngine.instance) {
      ProjectIndexEngine.instance = new ProjectIndexEngine();
    }
    return ProjectIndexEngine.instance;
  }

  // Index an entire workspace tree or directory
  public async indexWorkspace(rootPath: string, tree?: DirectoryItem[]): Promise<number> {
    if (this.isIndexing) return this.indexMap.size;
    this.isIndexing = true;

    try {
      let items = tree;
      if (!items || items.length === 0) {
        items = await Platform.readDir(rootPath, true);
      }

      await this.scanItems(rootPath, items || []);
      this.lastIndexTime = Date.now();
    } catch (e) {
      console.error('Project Indexing failed:', e);
    } finally {
      this.isIndexing = false;
    }

    return this.indexMap.size;
  }

  private async scanItems(rootPath: string, items: DirectoryItem[]) {
    for (const item of items) {
      if (item.isDirectory) {
        if (item.children && item.children.length > 0) {
          await this.scanItems(rootPath, item.children);
        }
      } else {
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'html', 'css', 'go', 'rs', 'java', 'cpp', 'c', 'cs', 'php', 'sql', 'md'];
        
        if (codeExtensions.includes(ext)) {
          const relative = item.path.replace(rootPath, '').replace(/^[/\\]/, '');
          let content = '';

          // Read file content for indexing
          try {
            const fileData = await Platform.readFile(item.path);
            if (fileData) {
              content = fileData.content;
            }
          } catch {
            // Ignore unreadable
          }

          const symbols = this.extractSymbols(content, item.path, relative);
          this.indexMap.set(item.path, {
            path: item.path,
            relativePath: relative,
            size: item.size,
            extension: ext,
            symbols,
            content,
          });
        }
      }
    }
  }

  // Extract classes, functions, types, routes, exports
  private extractSymbols(content: string, fullPath: string, relativePath: string): IndexedSymbol[] {
    const symbols: IndexedSymbol[] = [];
    if (!content) return symbols;

    const lines = content.split('\n');
    lines.forEach((lineText, idx) => {
      const line = idx + 1;
      const trimmed = lineText.trim();

      // Functions / Component
      const fnMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)|(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/);
      if (fnMatch) {
        const name = fnMatch[1] || fnMatch[2];
        symbols.push({
          name,
          kind: 'function',
          filePath: fullPath,
          relativePath,
          line,
          snippet: trimmed,
        });
      }

      // Class
      const classMatch = trimmed.match(/(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          filePath: fullPath,
          relativePath,
          line,
          snippet: trimmed,
        });
      }

      // Interface or Type
      const typeMatch = trimmed.match(/(?:export\s+)?(?:interface|type)\s+([a-zA-Z0-9_$]+)/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: 'interface',
          filePath: fullPath,
          relativePath,
          line,
          snippet: trimmed,
        });
      }

      // Express / API Routes
      const routeMatch = trimmed.match(/app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/);
      if (routeMatch) {
        symbols.push({
          name: `${routeMatch[1].toUpperCase()} ${routeMatch[2]}`,
          kind: 'route',
          filePath: fullPath,
          relativePath,
          line,
          snippet: trimmed,
        });
      }
    });

    return symbols;
  }

  // Search indexed symbols across entire workspace
  public searchSymbols(query: string): IndexedSymbol[] {
    if (!query) return [];
    const q = query.toLowerCase();
    const results: IndexedSymbol[] = [];

    for (const [, file] of this.indexMap) {
      for (const sym of file.symbols) {
        if (sym.name.toLowerCase().includes(q) || sym.snippet.toLowerCase().includes(q)) {
          results.push(sym);
          if (results.length >= 50) break;
        }
      }
      if (results.length >= 50) break;
    }

    return results;
  }

  // Get Workspace Summary Context for AI Assistant
  public getWorkspaceContextSummary(): string {
    const totalFiles = this.indexMap.size;
    let totalSymbols = 0;
    const keyFiles: string[] = [];

    for (const [pathStr, file] of this.indexMap) {
      totalSymbols += file.symbols.length;
      if (keyFiles.length < 15) {
        keyFiles.push(file.relativePath);
      }
    }

    return `Workspace Index Status:
- Total Indexed Files: ${totalFiles}
- Total Indexed Symbols: ${totalSymbols}
- Key Workspace Files: ${keyFiles.join(', ')}
- Last Indexed At: ${this.lastIndexTime ? new Date(this.lastIndexTime).toLocaleTimeString() : 'Not indexed yet'}`;
  }

  public getIndexedFiles(): IndexedFile[] {
    return Array.from(this.indexMap.values());
  }

  public clear() {
    this.indexMap.clear();
  }
}

export const projectIndexEngine = ProjectIndexEngine.getInstance();
