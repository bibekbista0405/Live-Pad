import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, AlertCircle, Code2, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';
import { ProjectFile } from '../../types/code';
import { extensionRegistry } from '../../services/extensionRegistry';

export interface RemoteUserCursor {
  uid: string;
  name: string;
  color: string;
  lineNumber: number;
  columnNumber: number;
  selectionEndLine?: number;
  selectionEndColumn?: number;
}

interface MonacoEditorWrapperProps {
  language: string;
  value: string;
  onChange: (val: string) => void;
  showMinimap?: boolean;
  wordWrap?: boolean;
  onMount?: (editor: any, monaco: any) => void;
  allFiles?: ProjectFile[];
  onOpenFileById?: (fileId: string) => void;
  remoteCursors?: RemoteUserCursor[];
  onCursorPositionChange?: (line: number, col: number, selEndLine?: number, selEndCol?: number) => void;
  isReadOnly?: boolean;
  breakpoints?: Array<{ id: string; lineNumber: number; enabled: boolean }>;
  activeDebugLine?: number | null;
  coverageData?: { coveredLines: number[]; uncoveredLines: number[] } | null;
  onToggleBreakpointAtLine?: (line: number) => void;
  targetPosition?: { line: number; column: number } | null;
}

function FallbackTextAreaEditor({
  value,
  onChange,
  language
}: {
  value: string;
  onChange: (val: string) => void;
  language: string;
}) {
  const lineCount = (value || '').split('\n').length;
  const linesArray = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] text-slate-200 font-mono text-sm relative overflow-hidden border border-slate-800/80 rounded-xl">
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
        <span className="flex items-center gap-1.5 font-bold">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          Monaco Editor CDN unavailable — Using Native Lightweight Editor ({language})
        </span>
      </div>
      <div className="flex-1 flex min-h-0 relative">
        <div className="w-12 bg-slate-950/80 text-slate-600 text-right pr-3 py-3 select-none border-r border-slate-800/80 font-mono text-xs leading-6 overflow-hidden">
          {linesArray.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 h-full w-full bg-transparent text-slate-100 p-3 font-mono text-xs leading-6 focus:outline-none resize-none tab-size-2 custom-scrollbar"
        />
      </div>
    </div>
  );
}

// Global flag to prevent registering duplicate completion/definition providers on re-mount
let monacoProvidersRegistered = false;

// Custom Language Snippets for 23 supported languages
const LANGUAGE_SNIPPETS: Record<string, Array<{ label: string; insertText: string; doc: string }>> = {
  html: [
    { label: 'html5', insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${1:Document}</title>\n</head>\n<body>\n  $0\n</body>\n</html>', doc: 'HTML5 Boilerplate' },
    { label: 'div', insertText: '<div class="${1:className}">\n  $0\n</div>', doc: 'DIV Container' },
    { label: 'form', insertText: '<form action="${1:#}" method="${2:post}">\n  $0\n</form>', doc: 'HTML Form' },
    { label: 'input', insertText: '<input type="${1:text}" name="${2:name}" placeholder="${3:placeholder}" />', doc: 'Input Tag' },
    { label: 'button', insertText: '<button type="${1:button}" class="${2:btn}">${3:Click}</button>', doc: 'Button Element' }
  ],
  css: [
    { label: 'cssflex', insertText: 'display: flex;\nalign-items: center;\njustify-content: center;', doc: 'Flexbox Center Align' },
    { label: 'grid', insertText: 'display: grid;\ngrid-template-columns: repeat(${1:3}, 1fr);\ngap: ${2:1rem};', doc: 'CSS Grid Layout' },
    { label: 'media', insertText: '@media (min-width: ${1:768}px) {\n  $0\n}', doc: 'Media Query' },
    { label: 'keyframes', insertText: '@keyframes ${1:animName} {\n  0% { opacity: 0; }\n  100% { opacity: 1; }\n}', doc: 'Keyframe Animation' }
  ],
  javascript: [
    { label: 'clg', insertText: 'console.log($1);', doc: 'Log output to console' },
    { label: 'imp', insertText: "import $1 from '$2';", doc: 'Import module ES6' },
    { label: 'rfce', insertText: "import React from 'react';\n\nexport default function ${1:ComponentName}() {\n  return (\n    <div className=\"$2\">\n      $0\n    </div>\n  );\n}", doc: 'React Functional Component' },
    { label: 'useState', insertText: 'const [$1, set${1/(.*)/${1:/capitalize}/}] = useState($2);', doc: 'React useState Hook' },
    { label: 'useEffect', insertText: 'useEffect(() => {\n  $1\n}, [$2]);', doc: 'React useEffect Hook' },
    { label: 'trycatch', insertText: 'try {\n  $1\n} catch (error) {\n  console.error(error);\n}', doc: 'Try Catch Block' },
    { label: 'asyncfn', insertText: 'async function ${1:name}($2) {\n  $3\n}', doc: 'Async Function' },
    { label: 'fori', insertText: 'for (let i = 0; i < ${1:array}.length; i++) {\n  const ${2:item} = ${1:array}[i];\n  $0\n}', doc: 'For Loop' }
  ],
  typescript: [
    { label: 'interface', insertText: 'export interface ${1:InterfaceName} {\n  id: string;\n  $0\n}', doc: 'TS Interface' },
    { label: 'type', insertText: 'export type ${1:TypeName} = ${2:string};', doc: 'TS Type Alias' },
    { label: 'enum', insertText: 'export enum ${1:EnumName} {\n  FIRST = "FIRST",\n  SECOND = "SECOND"\n}', doc: 'TS Enum' },
    { label: 'generic', insertText: 'function ${1:identity}<T>(arg: T): T {\n  return arg;\n}', doc: 'Generic Function' }
  ],
  python: [
    { label: 'pydef', insertText: 'def ${1:function_name}(${2:params}):\n    """${3:Docstring}"""\n    ${0:pass}', doc: 'Python Function' },
    { label: 'pyclass', insertText: 'class ${1:ClassName}:\n    def __init__(self, ${2:args}):\n        ${3:self.args = args}', doc: 'Python Class' },
    { label: 'pyifmain', insertText: 'if __name__ == "__main__":\n    ${1:main()}', doc: 'Main Block' },
    { label: 'pytry', insertText: 'try:\n    $1\nexcept Exception as e:\n    print(f"Error: {e}")', doc: 'Try Except' }
  ],
  java: [
    { label: 'javamain', insertText: 'public static void main(String[] args) {\n    System.out.println("${1:Hello}");\n}', doc: 'Java Main Method' },
    { label: 'javaclass', insertText: 'public class ${1:ClassName} {\n    public ${1:ClassName}() {\n        $0\n    }\n}', doc: 'Java Class' },
    { label: 'javasout', insertText: 'System.out.println($1);', doc: 'Print to Console' }
  ],
  c: [
    { label: 'cmain', insertText: '#include <stdio.h>\n\nint main() {\n    printf("${1:Hello World}\\n");\n    return 0;\n}', doc: 'C Main Program' },
    { label: 'cinclude', insertText: '#include <${1:stdio.h}>', doc: 'Include Header' },
    { label: 'cstruct', insertText: 'typedef struct {\n    int id;\n} ${1:StructName};', doc: 'C Struct' }
  ],
  cpp: [
    { label: 'cppmain', insertText: '#include <iostream>\n\nint main() {\n    std::cout << "${1:Hello}" << std::endl;\n    return 0;\n}', doc: 'C++ Main Program' },
    { label: 'cppclass', insertText: 'class ${1:ClassName} {\npublic:\n    ${1:ClassName}() {}\n};', doc: 'C++ Class' }
  ],
  csharp: [
    { label: 'csmain', insertText: 'using System;\n\nclass Program {\n    static void Main(string[] args) {\n        Console.WriteLine("${1:Hello}");\n    }\n}', doc: 'C# Main Method' },
    { label: 'cscw', insertText: 'Console.WriteLine($1);', doc: 'Console WriteLine' }
  ],
  go: [
    { label: 'gomain', insertText: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("${1:Hello}")\n}', doc: 'Go Main Package' },
    { label: 'gostruct', insertText: 'type ${1:StructName} struct {\n\tID string\n}', doc: 'Go Struct' },
    { label: 'goiferr', insertText: 'if err != nil {\n\treturn err\n}', doc: 'Go Error Check' }
  ],
  rust: [
    { label: 'rsmain', insertText: 'fn main() {\n    println!("${1:Hello}");\n}', doc: 'Rust Main Fn' },
    { label: 'rsstruct', insertText: 'struct ${1:MyStruct} {\n    id: u64,\n}', doc: 'Rust Struct' },
    { label: 'rsfn', insertText: 'fn ${1:func_name}() -> ${2:Result<(), String>} {\n    Ok(())\n}', doc: 'Rust Function' }
  ],
  php: [
    { label: 'phptag', insertText: '<?php\n\n$0', doc: 'PHP Opening Tag' },
    { label: 'phpecho', insertText: 'echo "${1:Hello}";', doc: 'PHP Echo' },
    { label: 'phpfn', insertText: 'function ${1:funcName}($2) {\n    return $3;\n}', doc: 'PHP Function' }
  ],
  ruby: [
    { label: 'rbdef', insertText: 'def ${1:method_name}\n  $0\nend', doc: 'Ruby Method' },
    { label: 'rbclass', insertText: 'class ${1:ClassName}\n  def initialize\n    $0\n  end\nend', doc: 'Ruby Class' }
  ],
  swift: [
    { label: 'swiftfn', insertText: 'func ${1:funcName}() {\n    print("${2:Hello}")\n}', doc: 'Swift Function' },
    { label: 'swiftstruct', insertText: 'struct ${1:MyStruct} {\n    var id: String\n}', doc: 'Swift Struct' }
  ],
  kotlin: [
    { label: 'ktmain', insertText: 'fun main() {\n    println("${1:Hello}")\n}', doc: 'Kotlin Main' },
    { label: 'ktclass', insertText: 'class ${1:ClassName}(val id: String)', doc: 'Kotlin Class' }
  ],
  dart: [
    { label: 'dartmain', insertText: 'void main() {\n  print("${1:Hello}");\n}', doc: 'Dart Main' },
    { label: 'dartclass', insertText: 'class ${1:ClassName} {\n  final String id;\n  ${1:ClassName}(this.id);\n}', doc: 'Dart Class' }
  ],
  sql: [
    { label: 'select', insertText: 'SELECT * FROM ${1:table_name} WHERE ${2:condition};', doc: 'SQL Select Query' },
    { label: 'insert', insertText: 'INSERT INTO ${1:table_name} (${2:columns}) VALUES (${3:values});', doc: 'SQL Insert Query' },
    { label: 'update', insertText: 'UPDATE ${1:table_name} SET ${2:column} = ${3:value} WHERE ${4:condition};', doc: 'SQL Update Query' }
  ],
  json: [
    { label: 'jsonkv', insertText: '"${1:key}": "${2:value}"', doc: 'JSON Key Value' }
  ],
  yaml: [
    { label: 'yamlkey', insertText: '${1:key}: ${2:value}', doc: 'YAML Key Value' }
  ],
  markdown: [
    { label: 'mdlink', insertText: '[${1:link text}](${2:https://example.com})', doc: 'Markdown Link' },
    { label: 'mdcode', insertText: '```${1:javascript}\n$0\n```', doc: 'Markdown Code Block' }
  ],
  xml: [
    { label: 'xmlnode', insertText: '<${1:node}>\n  $0\n</${1:node}>', doc: 'XML Node Tag' }
  ]
};

function configureTypeScriptCompilerOptions(monaco: any) {
  if (!monaco || !monaco.languages || !monaco.languages.typescript) return;
  try {
    const tsDefaults = monaco.languages.typescript.typescriptDefaults;
    const jsDefaults = monaco.languages.typescript.javascriptDefaults;

    const compilerOptions = {
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    };

    tsDefaults.setCompilerOptions(compilerOptions);
    jsDefaults.setCompilerOptions(compilerOptions);

    tsDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
    jsDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });

    // Add extra type declarations for React and CSS/Asset modules
    const reactAmbientTypes = `
      declare module 'react' { export = React; }
      declare module 'react-dom' { export = ReactDOM; }
      declare module '*.css' { const content: string; export default content; }
      declare module '*.json' { const content: any; export default content; }
      declare module '*.svg' { const content: string; export default content; }
      declare module '*.png' { const content: string; export default content; }
    `;
    tsDefaults.addExtraLib(reactAmbientTypes, 'file:///node_modules/@types/react/index.d.ts');
    jsDefaults.addExtraLib(reactAmbientTypes, 'file:///node_modules/@types/react/index.d.ts');
  } catch (err) {
    console.warn('Could not configure TypeScript compiler options in Monaco:', err);
  }
}

function syncWorkspaceModels(monaco: any, allFiles: ProjectFile[]) {
  if (!monaco || !Array.isArray(allFiles)) return;
  allFiles.forEach((file) => {
    if (!file || !file.path) return;
    const cleanPath = file.path.replace(/\\/g, '/');
    const uri = monaco.Uri.parse(`file:///${cleanPath}`);
    let model = monaco.editor.getModel(uri);
    const lang = file.language || 'javascript';

    if (!model) {
      try {
        model = monaco.editor.createModel(file.content || '', lang, uri);
      } catch (e) {
        // model might already exist
      }
    } else if (model.getValue() !== file.content) {
      model.setValue(file.content || '');
    }
  });
}

function registerAdvancedMonacoFeatures(monaco: any, allFilesRef: React.MutableRefObject<ProjectFile[]>, onOpenFileById?: (fileId: string) => void) {
  if (monacoProvidersRegistered || !monaco) return;
  monacoProvidersRegistered = true;

  configureTypeScriptCompilerOptions(monaco);

  const allLangs = [
    'javascript', 'typescript', 'html', 'css', 'json', 'python', 'markdown',
    'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift',
    'kotlin', 'dart', 'sql', 'yaml', 'xml'
  ];

  // 1. Register Snippets & IntelliSense Completion Providers
  allLangs.forEach((lang) => {
    monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ['.', '/', '<', '"', "'", '@', '$'],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const currentFiles = allFilesRef.current || [];
        const lineText = model.getLineContent(position.lineNumber);
        const suggestions: any[] = [];

        // 1a. File Path Import Autocomplete (typing import ... from './ or <link href="./)
        if (lineText.includes('./') || lineText.includes('../') || lineText.includes('from "') || lineText.includes("from '")) {
          currentFiles.forEach((f) => {
            suggestions.push({
              label: `./${f.path}`,
              kind: monaco.languages.CompletionItemKind.File,
              insertText: f.path,
              documentation: `Workspace File (${f.language}): ${f.path}`,
              range
            });
          });
        }

        // 1b. Project-wide exported functions/components completion
        currentFiles.forEach((f) => {
          const fileLines = (f.content || '').split('\n');
          fileLines.forEach((l) => {
            const exportMatch = l.match(/export\s+(const|function|class|interface|type)\s+([A-Za-z0-9_$]+)/);
            if (exportMatch) {
              const symType = exportMatch[1];
              const symName = exportMatch[2];
              suggestions.push({
                label: symName,
                kind: symType === 'function' || symType === 'const'
                  ? monaco.languages.CompletionItemKind.Function
                  : monaco.languages.CompletionItemKind.Class,
                insertText: symName,
                documentation: `Exported from ${f.name} (${f.path})`,
                range
              });
            }
          });
        });

        // 1c. Language Snippets
        const snippets = LANGUAGE_SNIPPETS[lang] || LANGUAGE_SNIPPETS['javascript'] || [];
        snippets.forEach((s) => {
          suggestions.push({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: s.doc,
            range
          });
        });

        return { suggestions };
      }
    });
  });

  // 2. Register Cross-File Definition Provider (Go to Definition - F12)
  allLangs.forEach((lang) => {
    monaco.languages.registerDefinitionProvider(lang, {
      provideDefinition: (model: any, position: any) => {
        const wordInfo = model.getWordAtPosition(position);
        const lineContent = model.getLineContent(position.lineNumber);
        const currentFiles = allFilesRef.current || [];

        // 2a. Check if clicking on file path import e.g. import ... from './Header'
        const importMatch = lineContent.match(/from\s+["']([^"']+)["']/) ||
          lineContent.match(/href=["']([^"']+)["']/) ||
          lineContent.match(/src=["']([^"']+)["']/);

        if (importMatch && importMatch[1]) {
          const importPath = importMatch[1].replace(/^\.\//, '').replace(/^\//, '');
          const targetFile = currentFiles.find(
            (f) => f.path === importPath ||
              f.path.endsWith(importPath) ||
              f.path.replace(/\.[^/.]+$/, "") === importPath.replace(/\.[^/.]+$/, "")
          );

          if (targetFile) {
            if (onOpenFileById) onOpenFileById(targetFile.id);
            const targetUri = monaco.Uri.parse(`file:///${targetFile.path}`);
            return {
              uri: targetUri,
              range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
            };
          }
        }

        if (!wordInfo) return null;
        const symbolName = wordInfo.word;

        // 2b. Search for symbol across ALL workspace files
        for (const file of currentFiles) {
          const text = file.content || '';
          const lines = text.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (
              line.includes(`function ${symbolName}`) ||
              line.includes(`def ${symbolName}`) ||
              line.includes(`fn ${symbolName}`) ||
              line.includes(`const ${symbolName}`) ||
              line.includes(`let ${symbolName}`) ||
              line.includes(`class ${symbolName}`) ||
              line.includes(`interface ${symbolName}`) ||
              line.includes(`struct ${symbolName}`) ||
              line.includes(`type ${symbolName}`)
            ) {
              const targetUri = monaco.Uri.parse(`file:///${file.path}`);
              if (file.path !== model.uri.path.replace(/^\//, '') && onOpenFileById) {
                onOpenFileById(file.id);
              }
              return {
                uri: targetUri,
                range: {
                  startLineNumber: i + 1,
                  startColumn: line.indexOf(symbolName) + 1,
                  endLineNumber: i + 1,
                  endColumn: line.indexOf(symbolName) + 1 + symbolName.length
                }
              };
            }
          }
        }

        return null;
      }
    });
  });

  // 3. Register Cross-File Rename Provider (F2 Rename Symbol)
  allLangs.forEach((lang) => {
    monaco.languages.registerRenameProvider(lang, {
      provideRenameEdits: (model: any, position: any, newName: string) => {
        const wordInfo = model.getWordAtPosition(position);
        if (!wordInfo) return null;

        const oldName = wordInfo.word;
        const currentFiles = allFilesRef.current || [];
        const edits: any[] = [];
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');

        currentFiles.forEach((file) => {
          const text = file.content || '';
          const fileUri = monaco.Uri.parse(`file:///${file.path}`);
          const fileModel = monaco.editor.getModel(fileUri) || model;
          let match;

          while ((match = regex.exec(text)) !== null) {
            const pos = fileModel.getPositionAt ? fileModel.getPositionAt(match.index) : { lineNumber: 1, column: 1 };
            edits.push({
              resource: fileUri,
              versionId: fileModel.getVersionId ? fileModel.getVersionId() : undefined,
              textEdit: {
                range: {
                  startLineNumber: pos.lineNumber,
                  startColumn: pos.column,
                  endLineNumber: pos.lineNumber,
                  endColumn: pos.column + oldName.length
                },
                text: newName
              }
            });
          }
        });

        return { edits };
      }
    });
  });

  // 4. Register Document Formatting Provider (Shift+Alt+F)
  allLangs.forEach((lang) => {
    monaco.languages.registerDocumentFormattingEditProvider(lang, {
      provideDocumentFormattingEdits: (model: any) => {
        const text = model.getValue();
        let formatted = text;

        try {
          if (lang === 'json') {
            formatted = JSON.stringify(JSON.parse(text), null, 2);
          } else {
            const lines = text.split('\n');
            let indentLevel = 0;
            const formattedLines = lines.map((line: string) => {
              let trimmed = line.trim();
              if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
                indentLevel = Math.max(0, indentLevel - 1);
              }
              const padded = '  '.repeat(indentLevel) + trimmed;
              if (
                (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(') || trimmed.endsWith(':')) &&
                !trimmed.startsWith('//') && !trimmed.startsWith('#')
              ) {
                indentLevel++;
              }
              return padded;
            });
            formatted = formattedLines.join('\n');
          }
        } catch {
          formatted = text;
        }

        return [
          {
            range: model.getFullModelRange(),
            text: formatted
          }
        ];
      }
    });
  });
}

// Perform client-side syntax checking & error highlighting for Monaco models
function performSyntaxChecking(editor: any, monaco: any, language: string) {
  if (!editor || !monaco) return;
  const model = editor.getModel();
  if (!model) return;

  const content = model.getValue();
  const markers: any[] = [];

  if (language === 'json') {
    try {
      JSON.parse(content);
    } catch (err: any) {
      const match = err.message.match(/at line (\d+) column (\d+)/) || err.message.match(/position (\d+)/);
      let line = 1;
      let col = 1;
      if (match && match[1] && match[2]) {
        line = parseInt(match[1], 10);
        col = parseInt(match[2], 10);
      }
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `JSON Syntax Error: ${err.message}`,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: col + 5
      });
    }
  } else {
    // General bracket matching check for syntax error highlighting
    const stack: Array<{ char: string; line: number; col: number }> = [];
    const lines = content.split('\n');

    for (let l = 0; l < lines.length; l++) {
      const lineText = lines[l];
      for (let c = 0; c < lineText.length; c++) {
        const char = lineText[c];
        if (char === '{' || char === '(' || char === '[') {
          stack.push({ char, line: l + 1, col: c + 1 });
        } else if (char === '}' || char === ')' || char === ']') {
          const last = stack.pop();
          const expected = char === '}' ? '{' : char === ')' ? '(' : '[';
          if (!last || last.char !== expected) {
            markers.push({
              severity: monaco.MarkerSeverity.Error,
              message: `Unmatched closing bracket '${char}'`,
              startLineNumber: l + 1,
              startColumn: c + 1,
              endLineNumber: l + 1,
              endColumn: c + 2
            });
          }
        }
      }
    }

    if (stack.length > 0 && markers.length === 0) {
      const unclosed = stack[stack.length - 1];
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: `Unclosed bracket '${unclosed.char}'`,
        startLineNumber: unclosed.line,
        startColumn: unclosed.col,
        endLineNumber: unclosed.line,
        endColumn: unclosed.col + 1
      });
    }
  }

  monaco.editor.setModelMarkers(model, 'syntax-checker', markers);
}

let syntaxCheckTimer: any = null;
function debouncedSyntaxChecking(editor: any, monaco: any, language: string) {
  if (syntaxCheckTimer) clearTimeout(syntaxCheckTimer);
  syntaxCheckTimer = setTimeout(() => {
    performSyntaxChecking(editor, monaco, language);
  }, 350);
}

function MonacoEditorWrapperComponent({
  language,
  value,
  onChange,
  showMinimap = true,
  wordWrap = true,
  onMount,
  allFiles = [],
  onOpenFileById,
  remoteCursors = [],
  onCursorPositionChange,
  isReadOnly = false,
  breakpoints = [],
  activeDebugLine = null,
  coverageData = null,
  onToggleBreakpointAtLine,
  targetPosition = null
}: MonacoEditorWrapperProps) {
  const [editorError, setEditorError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const debugDecorationsRef = useRef<string[]>([]);
  const coverageDecorationsRef = useRef<string[]>([]);

  const allFilesRef = useRef<ProjectFile[]>(allFiles);
  useEffect(() => {
    allFilesRef.current = allFiles;
    if (monacoRef.current) {
      syncWorkspaceModels(monacoRef.current, allFiles);
    }
  }, [allFiles]);

  // Keep the editor model authoritative while typing. Monaco is intentionally
  // uncontrolled here; feeding every keystroke back through React's `value` prop
  // causes cursor jumps and visible lag during fast input/delete operations.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel?.();
    if (!model) return;
    if (model.getValue() === value) return;
    const position = editor.getPosition?.();
    const selection = editor.getSelection?.();
    try {
      model.pushEditOperations([], [{
        range: model.getFullModelRange(),
        text: value || ''
      }], () => selection ? [selection] : null);
      if (position) editor.setPosition(position);
    } catch {
      model.setValue(value || '');
    }
  }, [value]);

  // Jump to line and column when targetPosition changes
  useEffect(() => {
    if (targetPosition && editorRef.current) {
      try {
        editorRef.current.setPosition({
          lineNumber: targetPosition.line,
          column: targetPosition.column
        });
        editorRef.current.revealLineInCenter(targetPosition.line);
        editorRef.current.focus();
      } catch (e) {
        console.warn('Could not set position in Monaco editor:', e);
      }
    }
  }, [targetPosition]);

  // Map language aliases to standard Monaco languages
  const getMonacoLanguage = (lang: string) => {
    if (!lang) return 'javascript';
    const l = lang.toLowerCase();
    if (l === 'js' || l === 'javascript') return 'javascript';
    if (l === 'ts' || l === 'typescript') return 'typescript';
    if (l === 'jsx' || l === 'tsx' || l === 'react') return 'typescript';
    if (l === 'vue') return 'html';
    if (l === 'py' || l === 'python') return 'python';
    if (l === 'java') return 'java';
    if (l === 'c') return 'c';
    if (l === 'cpp' || l === 'c++' || l === 'cc' || l === 'cxx') return 'cpp';
    if (l === 'cs' || l === 'csharp' || l === 'c#') return 'csharp';
    if (l === 'go' || l === 'golang') return 'go';
    if (l === 'rs' || l === 'rust') return 'rust';
    if (l === 'php') return 'php';
    if (l === 'rb' || l === 'ruby') return 'ruby';
    if (l === 'swift') return 'swift';
    if (l === 'kt' || l === 'kts' || l === 'kotlin') return 'kotlin';
    if (l === 'dart') return 'dart';
    if (l === 'sql') return 'sql';
    if (l === 'json' || l === 'json5') return 'json';
    if (l === 'yaml' || l === 'yml') return 'yaml';
    if (l === 'md' || l === 'markdown') return 'markdown';
    if (l === 'xml' || l === 'svg') return 'xml';
    if (l === 'css' || l === 'scss' || l === 'less') return 'css';
    if (l === 'html' || l === 'htm') return 'html';
    return l;
  };

  // Render Remote Cursors and Selection Decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !remoteCursors) return;

    const newDecorations: any[] = [];

    remoteCursors.forEach((c) => {
      if (!c.lineNumber || !c.columnNumber) return;

      // Caret line decoration
      newDecorations.push({
        range: new monaco.Range(c.lineNumber, c.columnNumber, c.lineNumber, c.columnNumber + 1),
        options: {
          className: `remote-cursor-${c.uid.replace(/[^a-zA-Z0-9]/g, '_')}`,
          hoverMessage: { value: `**${c.name}** is editing here` },
          beforeContentClassName: 'remote-cursor-head'
        }
      });

      // Selection decoration
      if (c.selectionEndLine && c.selectionEndColumn) {
        newDecorations.push({
          range: new monaco.Range(
            Math.min(c.lineNumber, c.selectionEndLine),
            Math.min(c.columnNumber, c.selectionEndColumn),
            Math.max(c.lineNumber, c.selectionEndLine),
            Math.max(c.columnNumber, c.selectionEndColumn)
          ),
          options: {
            className: 'remote-selection-highlight',
            isWholeLine: false
          }
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteCursors]);

  // Render Breakpoint and Active Debug Line Decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations: any[] = [];

    // Breakpoint glyphs
    breakpoints.forEach((bp) => {
      if (!bp.lineNumber) return;
      newDecorations.push({
        range: new monaco.Range(bp.lineNumber, 1, bp.lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: bp.enabled ? 'debug-breakpoint-glyph' : 'debug-breakpoint-glyph opacity-40',
          glyphMarginHoverMessage: { value: `Breakpoint line ${bp.lineNumber}` }
        }
      });
    });

    // Active debug execution line arrow & highlight
    if (activeDebugLine) {
      newDecorations.push({
        range: new monaco.Range(activeDebugLine, 1, activeDebugLine, 1),
        options: {
          isWholeLine: true,
          className: 'debug-active-line-highlight',
          glyphMarginClassName: 'debug-active-line-glyph',
          glyphMarginHoverMessage: { value: `Paused on line ${activeDebugLine}` }
        }
      });
    }

    debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, newDecorations);
  }, [breakpoints, activeDebugLine]);

  // Render Coverage Line Highlights
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (!coverageData) {
      coverageDecorationsRef.current = editor.deltaDecorations(coverageDecorationsRef.current, []);
      return;
    }

    const newDecorations: any[] = [];

    coverageData.coveredLines.forEach((line) => {
      newDecorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'coverage-covered-line',
          linesDecorationsClassName: 'coverage-covered-line'
        }
      });
    });

    coverageData.uncoveredLines.forEach((line) => {
      newDecorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'coverage-uncovered-line',
          linesDecorationsClassName: 'coverage-uncovered-line'
        }
      });
    });

    coverageDecorationsRef.current = editor.deltaDecorations(coverageDecorationsRef.current, newDecorations);
  }, [coverageData]);

  // Extension active theme synchronization
  const activeTheme = useSyncExternalStore(
    (cb) => extensionRegistry.subscribe(cb),
    () => extensionRegistry.getActiveTheme()
  );

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !activeTheme) return;

    try {
      const rules = activeTheme.monacoRules || [];
      monaco.editor.defineTheme(activeTheme.id, {
        base: activeTheme.uiTheme,
        inherit: true,
        rules: rules,
        colors: {
          'editor.background': activeTheme.colors.editorBackground || activeTheme.colors.background,
          'editor.foreground': activeTheme.colors.textColor,
          'editorCursor.foreground': activeTheme.colors.accentColor,
          'editor.lineHighlightBackground': activeTheme.colors.lineHighlight,
          'editorLineNumber.foreground': activeTheme.colors.lineNumber,
          'editor.selectionBackground': activeTheme.colors.selection
        }
      });
      monaco.editor.setTheme(activeTheme.id);
    } catch (err) {
      console.warn('Could not define custom theme in Monaco:', err);
    }
  }, [activeTheme]);

  // Memoize Monaco Options
  const editorOptions = React.useMemo(() => ({
    readOnly: isReadOnly,
    glyphMargin: true,
    minimap: { enabled: showMinimap, side: 'right' as const, renderCharacters: true },
    wordWrap: (wordWrap ? 'on' : 'off') as 'on' | 'off',
    fontSize: 14,
    fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Consolas', monospace",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12, bottom: 12 },
    tabSize: 2,
    renderWhitespace: 'selection' as const,
    smoothScrolling: false,
    cursorBlinking: 'blink' as const,
    cursorSmoothCaretAnimation: 'off' as const,
    stickyScroll: { enabled: true },
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'always' as const,
    multiCursorModifier: 'alt' as const,
    matchBrackets: 'always' as const,
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    autoIndent: 'full' as const,
    formatOnPaste: true,
    formatOnType: false,
    snippetSuggestions: 'top' as const,
    suggestOnTriggerCharacters: true,
    quickSuggestions: { other: true, comments: true, strings: true },
    renderLineHighlight: 'all' as const,
    lineNumbers: 'on' as const,
    contextmenu: true
  }), [isReadOnly, showMinimap, wordWrap]);

  if (editorError) {
    return (
      <FallbackTextAreaEditor
        value={value}
        onChange={onChange}
        language={language}
      />
    );
  }

  return (
    <ErrorBoundary
      fallbackTitle="Code Editor Loading Recovery"
      onReset={() => setEditorError(false)}
    >
      <div ref={containerRef} className="w-full h-full min-h-[150px] relative overflow-hidden bg-[#1e1e1e]">
        <Editor
          height="100%"
          width="100%"
          language={getMonacoLanguage(language)}
          theme="vs-dark"
          defaultValue={value}
          onChange={(val) => {
            if (!isReadOnly) {
              onChange(val || '');
            }
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            syncWorkspaceModels(monaco, allFilesRef.current);
            registerAdvancedMonacoFeatures(monaco, allFilesRef, onOpenFileById);
            debouncedSyntaxChecking(editor, monaco, getMonacoLanguage(language));

            // Cursor position and selection change listeners
            if (onCursorPositionChange) {
              editor.onDidChangeCursorPosition((e: any) => {
                const pos = e.position;
                const sel = editor.getSelection();
                onCursorPositionChange(
                  pos.lineNumber,
                  pos.column,
                  sel ? sel.endLineNumber : pos.lineNumber,
                  sel ? sel.endColumn : pos.column
                );
              });
            }

            editor.onDidChangeModelContent(() => {
              debouncedSyntaxChecking(editor, monaco, getMonacoLanguage(language));
            });

            // Glyph Margin click listener for toggling Breakpoints
            editor.onMouseDown((e: any) => {
              if (
                onToggleBreakpointAtLine &&
                e.target &&
                e.target.position &&
                (e.target.type === 2 || e.target.type === 3 || e.target.type === 4) // GlyphMargin or LineNumbers
              ) {
                onToggleBreakpointAtLine(e.target.position.lineNumber);
              }
            });

            if (onMount) {
              onMount(editor, monaco);
            }
          }}
          loading={
            <div className="flex flex-col items-center justify-center h-full w-full bg-[#1e1e1e] text-slate-400 font-mono text-xs space-y-3 p-4">
              <Loader2 className="w-6 h-6 text-[#007acc] animate-spin" />
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#007acc]" />
                <span className="font-semibold text-slate-300">Initializing VS Code Monaco Workspace...</span>
              </div>
            </div>
          }
          options={editorOptions}
        />
      </div>
    </ErrorBoundary>
  );
}

export default React.memo(MonacoEditorWrapperComponent);

