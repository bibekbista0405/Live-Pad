import type * as monaco from 'monaco-editor';
import { DirectoryItem } from '../platform/types';

export interface SymbolInfo {
  name: string;
  kind: monaco.languages.SymbolKind;
  location: {
    uri: string;
    line: number;
    column: number;
  };
  containerName?: string;
  detail?: string;
}

export interface HoverResult {
  contents: string[];
  range?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

export class LanguageService {
  private static instance: LanguageService;
  private registeredMonaco = false;

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  // Register Monaco Language Capabilities for 16+ languages (dynamically loads monaco)
  public async registerMonacoProviders() {
    if (this.registeredMonaco || typeof window === 'undefined') return;
    this.registeredMonaco = true;

    try {
      const monaco = await import('monaco-editor');

      const languages = [
        'typescript',
        'javascript',
        'html',
        'css',
        'json',
        'python',
        'java',
        'cpp',
        'c',
        'csharp',
        'go',
        'rust',
        'php',
        'sql',
        'markdown',
        'yaml',
        'xml',
      ];

      languages.forEach((lang) => {
        // 1. Completion Item Provider (IntelliSense)
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const text = model.getValue();
            const suggestions = this.extractLanguageCompletions(lang, text, range);
            return { suggestions };
          },
        });

        // 2. Hover Provider
        monaco.languages.registerHoverProvider(lang, {
          provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            const info = this.getSymbolHoverInfo(lang, word.word);
            if (!info) return null;
            return {
              range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
              contents: info.map((str) => ({ value: str })),
            };
          },
        });

        // 3. Document Symbol Provider (Outline View)
        monaco.languages.registerDocumentSymbolProvider(lang, {
          provideDocumentSymbols: (model) => {
            return this.parseDocumentSymbols(model.getValue(), model.uri.toString());
          },
        });
      });
    } catch (err) {
      console.warn('[LanguageService] Lazy Monaco registration skipped or failed:', err);
    }
  }

  // Symbol Parser for Outline, Breadcrumbs and Navigation
  public parseDocumentSymbols(code: string, uri: string): monaco.languages.DocumentSymbol[] {
    const symbols: monaco.languages.DocumentSymbol[] = [];
    const lines = code.split('\n');

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();

      const rangeObj = {
        startLineNumber: lineNum,
        startColumn: 1,
        endLineNumber: lineNum,
        endColumn: lineText.length + 1,
      };

      // Functions / Arrow functions / Methods (SymbolKind.Function = 11)
      const fnMatch = trimmed.match(/(?:async\s+)?function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(/);
      if (fnMatch) {
        const name = fnMatch[1] || fnMatch[2];
        symbols.push({
          name,
          detail: 'function',
          kind: 11 as monaco.languages.SymbolKind,
          tags: [],
          range: rangeObj,
          selectionRange: rangeObj,
        });
        return;
      }

      // Classes (SymbolKind.Class = 4)
      const classMatch = trimmed.match(/(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          detail: 'class',
          kind: 4 as monaco.languages.SymbolKind,
          tags: [],
          range: rangeObj,
          selectionRange: rangeObj,
        });
        return;
      }

      // Interfaces / Types (SymbolKind.Interface = 10)
      const typeMatch = trimmed.match(/(?:export\s+)?(?:interface|type)\s+([a-zA-Z0-9_$]+)/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          detail: 'interface',
          kind: 10 as monaco.languages.SymbolKind,
          tags: [],
          range: rangeObj,
          selectionRange: rangeObj,
        });
        return;
      }

      // Python def / class
      const pyDef = trimmed.match(/^def\s+([a-zA-Z0-9_$]+)/);
      if (pyDef) {
        symbols.push({
          name: pyDef[1],
          detail: 'def',
          kind: 11 as monaco.languages.SymbolKind,
          tags: [],
          range: rangeObj,
          selectionRange: rangeObj,
        });
      }
    });

    return symbols;
  }

  private extractLanguageCompletions(lang: string, text: string, range: any): monaco.languages.CompletionItem[] {
    const items: monaco.languages.CompletionItem[] = [];

    // Extract identifier words from active file (CompletionItemKind.Text = 0)
    const words = Array.from(new Set(text.match(/[a-zA-Z_$][a-zA-Z0-9_$]{2,}/g) || []));
    words.forEach((word) => {
      items.push({
        label: word,
        kind: 0 as monaco.languages.CompletionItemKind,
        insertText: word,
        range,
        detail: `Workspace Symbol (${lang})`,
      });
    });

    // Language Snippets (CompletionItemKind.Snippet = 27, InsertAsSnippet = 4)
    if (lang === 'typescript' || lang === 'javascript') {
      items.push({
        label: 'clg',
        kind: 27 as monaco.languages.CompletionItemKind,
        insertText: 'console.log(${1:val});',
        insertTextRules: 4 as monaco.languages.CompletionItemInsertTextRule,
        range,
        detail: 'Console log snippet',
      });
      items.push({
        label: 'asyncfn',
        kind: 27 as monaco.languages.CompletionItemKind,
        insertText: 'export async function ${1:name}(${2:params}) {\n\t$0\n}',
        insertTextRules: 4 as monaco.languages.CompletionItemInsertTextRule,
        range,
        detail: 'Async function snippet',
      });
    }

    if (lang === 'python') {
      items.push({
        label: 'def',
        kind: 27 as monaco.languages.CompletionItemKind,
        insertText: 'def ${1:name}(${2:self}):\n\t${0:pass}',
        insertTextRules: 4 as monaco.languages.CompletionItemInsertTextRule,
        range,
        detail: 'Python function definition',
      });
    }

    return items;
  }

  private getSymbolHoverInfo(lang: string, word: string): string[] | null {
    if (!word) return null;

    const docs: Record<string, string> = {
      useState: 'React Hook: Returns a stateful value and a function to update it.',
      useEffect: 'React Hook: Accepts a function that contains imperative, possibly effectful code.',
      useCallback: 'React Hook: Returns a memoized version of the callback that only changes if dependencies change.',
      useMemo: 'React Hook: Returns a memoized value generated by a factory function.',
      useRef: 'React Hook: Returns a mutable ref object whose `.current` property is initialized to the passed argument.',
      async: 'JavaScript Keyword: Declares an asynchronous function returning a Promise.',
      await: 'JavaScript Keyword: Pauses async function execution until Promise settles.',
      export: 'ES Module Keyword: Exports functions, objects, or primitive values from a module.',
      interface: 'TypeScript Keyword: Defines a contract for objects specifying structure.',
      def: 'Python Keyword: Used to define a function or method.',
      class: 'Object Oriented Keyword: Declares a class template for objects.',
    };

    if (docs[word]) {
      return [`**${word}** *(${lang})*`, docs[word]];
    }

    return [`**${word}**`, `Symbol defined in ${lang} workspace.`];
  }
}

export const languageService = LanguageService.getInstance();
