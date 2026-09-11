import { ProjectFile, ProjectFolder, ProblemDiagnostic } from '../types/code';

export interface BuildError {
  fileName: string;
  line?: number;
  column?: number;
  message: string;
  type: 'compile' | 'import' | 'syntax' | 'runtime';
}

export interface BuildResult {
  html: string;
  errors: BuildError[];
  warnings: string[];
}

/**
 * Analyzes workspace files and returns real-time compiler, linter, and language diagnostics
 */
export function getWorkspaceDiagnostics(files: ProjectFile[]): ProblemDiagnostic[] {
  const diagnostics: ProblemDiagnostic[] = [];
  const safeFiles = Array.isArray(files) ? files : [];

  for (const file of safeFiles) {
    if (!file || !file.content) continue;
    const ext = (file.extension || file.name.split('.').pop() || '').toLowerCase();
    const fileDir = getFileDirectory(file.path);

    // 1. JS / TS / JSX / TSX Compiler & Syntax Check
    if (['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript'].includes(ext)) {
      const babel = typeof window !== 'undefined' && (window as any).Babel;
      if (babel && babel.transform) {
        try {
          babel.transform(file.content, {
            presets: ['react', 'typescript', ['env', { modules: 'commonjs' }]],
            filename: file.name
          });
        } catch (err: any) {
          const loc = err.loc || {};
          diagnostics.push({
            id: `diag-syntax-${file.id}-${Date.now()}-${Math.random()}`,
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            line: loc.line || 1,
            column: loc.column || 1,
            message: err.message ? err.message.replace(/^.*?:\s*/, '') : 'Syntax error in file',
            severity: 'error',
            source: 'compiler'
          });
        }
      }

      // Check imports for unresolved relative references
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        const importMatch = lineText.match(/from\s+["'](\.\/|\.\.\/|src\/[^"']+)["']/);
        if (importMatch && importMatch[1]) {
          const rawRelPath = lineText.substring(lineText.indexOf(importMatch[1])).split(/["']/)[0];
          const foundFile = findMatchingFile(safeFiles, fileDir, rawRelPath);
          if (!foundFile) {
            diagnostics.push({
              id: `diag-import-${file.id}-${idx + 1}`,
              fileId: file.id,
              filePath: file.path,
              fileName: file.name,
              line: idx + 1,
              column: lineText.indexOf(importMatch[1]) + 1,
              message: `Cannot resolve module '${rawRelPath}'. File does not exist in workspace.`,
              severity: 'error',
              source: 'language-server'
            });
          }
        }

        // Linter rules: 'var' usage
        if (/\bvar\s+[a-zA-Z_$]/.test(lineText)) {
          diagnostics.push({
            id: `diag-var-${file.id}-${idx + 1}`,
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            line: idx + 1,
            column: lineText.search(/\bvar\b/) + 1,
            message: "Unexpected 'var', use 'let' or 'const' instead.",
            severity: 'warning',
            source: 'linter'
          });
        }

        // Linter rules: 'debugger' usage
        if (/\bdebugger\b/.test(lineText)) {
          diagnostics.push({
            id: `diag-dbg-${file.id}-${idx + 1}`,
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            line: idx + 1,
            column: lineText.indexOf('debugger') + 1,
            message: "Unexpected 'debugger' statement.",
            severity: 'warning',
            source: 'linter'
          });
        }
      });
    }

    // 2. JSON Syntax Check
    if (ext === 'json') {
      try {
        JSON.parse(file.content);
      } catch (err: any) {
        let line = 1;
        let column = 1;
        const posMatch = err.message.match(/at position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const sliced = file.content.substring(0, pos);
          const split = sliced.split('\n');
          line = split.length;
          column = split[split.length - 1].length + 1;
        }
        diagnostics.push({
          id: `diag-json-${file.id}`,
          fileId: file.id,
          filePath: file.path,
          fileName: file.name,
          line,
          column,
          message: `Invalid JSON syntax: ${err.message}`,
          severity: 'error',
          source: 'compiler'
        });
      }
    }
  }

  return diagnostics;
}


/**
 * Normalizes relative file paths cleanly.
 * e.g., resolvePath('src/components', './Button') -> 'src/components/Button'
 * e.g., resolvePath('src/components', '../utils/helper') -> 'src/utils/helper'
 */
export function normalizePath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

export function getFileDirectory(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/');
  parts.pop();
  return parts.join('/');
}

export function findMatchingFile(
  files: ProjectFile[],
  baseDir: string,
  relativePath: string
): ProjectFile | null {
  const cleanRelative = relativePath.trim();
  
  // Direct match if absolute or root relative
  if (cleanRelative.startsWith('/')) {
    const rawTarget = normalizePath(cleanRelative);
    const direct = files.find((f) => normalizePath(f.path) === rawTarget);
    if (direct) return direct;
  }

  // Combine base directory with relative path
  const combined = baseDir ? `${baseDir}/${cleanRelative}` : cleanRelative;
  const targetPath = normalizePath(combined);

  // Exact path match
  const exact = files.find((f) => normalizePath(f.path) === targetPath);
  if (exact) return exact;

  // Try common extensions (.tsx, .ts, .jsx, .js, .css, .json, .html, .svg, .png)
  const extensionsToTry = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json', '.html', '.svg', '.png', '.jpg'];
  for (const ext of extensionsToTry) {
    const candidate = files.find((f) => normalizePath(f.path) === `${targetPath}${ext}`);
    if (candidate) return candidate;
  }

  // Try index file in folder (e.g., ./components/Header -> ./components/Header/index.tsx)
  for (const ext of extensionsToTry) {
    const candidate = files.find((f) => normalizePath(f.path) === `${targetPath}/index${ext}`);
    if (candidate) return candidate;
  }

  // Fallback: match by file name if unique
  const fileNameOnly = cleanRelative.split('/').pop() || '';
  const byName = files.find((f) => f.name === fileNameOnly || f.name.startsWith(`${fileNameOnly}.`));
  if (byName) return byName;

  return null;
}

/**
 * Converts file content or SVG to base64 or Data URI
 */
export function getAssetDataUri(file: ProjectFile): string {
  const ext = (file.extension || file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'svg') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(file.content || '')}`;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(ext)) {
    if (file.content.startsWith('data:')) return file.content;
    return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${file.content}`;
  }
  return `data:text/plain;charset=utf-8,${encodeURIComponent(file.content || '')}`;
}

/**
 * Primary Virtual Project Builder
 */
export function buildVirtualProject(
  files: ProjectFile[],
  activeFile: ProjectFile | null,
  folders: ProjectFolder[] = []
): BuildResult {
  const errors: BuildError[] = [];
  const warnings: string[] = [];

  const safeFiles = Array.isArray(files) ? files : [];
  const currentFile = activeFile || safeFiles[0] || null;

  if (!currentFile && safeFiles.length === 0) {
    return {
      html: `<!DOCTYPE html><html><body style="background:#090d16;color:#94a3b8;font-family:sans-serif;padding:2rem;text-align:center;"><h2>No files in workspace</h2></body></html>`,
      errors: [],
      warnings: []
    };
  }

  const fileName = currentFile?.name || 'app.js';
  const ext = (currentFile?.extension || fileName.split('.').pop() || '').toLowerCase();

  // --- 1. MARKDOWN PREVIEW ---
  if (ext === 'md' || currentFile?.language === 'markdown') {
    return {
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0d1117; color: #c9d1d9; font-family: system-ui, -apple-system, sans-serif; padding: 2rem; margin: 0; }
    .markdown-body h1 { border-bottom: 1px solid #30363d; padding-bottom: 0.3em; font-size: 2em; color: #f0f6fc; }
    .markdown-body h2 { border-bottom: 1px solid #30363d; padding-bottom: 0.3em; font-size: 1.5em; margin-top: 1.5rem; color: #f0f6fc; }
    .markdown-body code { background: rgba(110,118,129,0.4); padding: 0.2em 0.4em; border-radius: 6px; font-family: monospace; font-size: 85%; }
    .markdown-body pre { background: #161b22; padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid #30363d; }
  </style>
</head>
<body class="markdown-body">
  <div id="content"></div>
  <script>
    const raw = ${JSON.stringify(currentFile?.content || '# Empty Markdown')};
    document.getElementById('content').innerHTML = typeof marked !== 'undefined' ? marked.parse(raw) : '<pre>' + raw + '</pre>';
  </script>
</body>
</html>`,
      errors,
      warnings
    };
  }

  // --- 2. PYTHON IN-BROWSER EXECUTION (Pyodide) ---
  if (ext === 'py' || currentFile?.language === 'python') {
    const pythonCode = currentFile?.content || '# Empty Python script';
    return {
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Python Runtime - ${fileName}</title>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #090d16; color: #38bdf8; font-family: monospace; padding: 1.5rem; margin: 0; }
    #output { background: #0f172a; border: 1px solid #1e293b; padding: 1rem; border-radius: 12px; min-height: 200px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="max-w-3xl mx-auto space-y-4">
    <div class="flex items-center justify-between text-xs font-mono text-slate-400">
      <span class="text-amber-400 font-bold flex items-center gap-2">🐍 Pyodide WebAssembly Python Runtime</span>
      <span>${fileName}</span>
    </div>
    <div id="status" class="text-xs text-cyan-400 font-mono">Initializing Python environment...</div>
    <div id="output">Running...</div>
  </div>
  <script>
    async function main() {
      const status = document.getElementById('status');
      const output = document.getElementById('output');
      try {
        status.textContent = 'Loading Python WebAssembly kernel...';
        let pyodide = await loadPyodide();
        status.textContent = 'Kernel ready. Executing script...';
        
        let logs = [];
        pyodide.setStdout({ write: (buf) => { logs.push(String.fromCharCode.apply(null, buf)); } });
        pyodide.setStderr({ write: (buf) => { logs.push('[ERROR] ' + String.fromCharCode.apply(null, buf)); } });
        
        await pyodide.runPythonAsync(${JSON.stringify(pythonCode)});
        status.textContent = '✔ Execution finished successfully.';
        output.textContent = logs.join('') || '(No output returned)';
      } catch (err) {
        status.textContent = '✕ Python Runtime Exception';
        status.className = 'text-xs text-rose-400 font-mono font-bold';
        output.textContent = String(err);
        window.parent.postMessage({ source: 'livepad-preview', type: 'RUNTIME_ERROR', payload: { message: String(err) } }, '*');
      }
    }
    main();
  </script>
</body>
</html>`,
      errors,
      warnings
    };
  }

  // --- 3. COMPILED LANGUAGES (C, C++, Java, Go, Rust, PHP, SQL, YAML, XML) ---
  if (['c', 'cpp', 'h', 'hpp', 'java', 'go', 'rs', 'php', 'sql', 'yaml', 'yml', 'xml'].includes(ext)) {
    const langNames: Record<string, string> = {
      c: 'C', cpp: 'C++', h: 'C/C++ Header', hpp: 'C++ Header',
      java: 'Java', go: 'Go', rs: 'Rust', php: 'PHP', sql: 'SQL', yaml: 'YAML', yml: 'YAML', xml: 'XML'
    };
    const langName = langNames[ext] || ext.toUpperCase();
    return {
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-6 min-h-screen flex items-center justify-center">
  <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
    <div class="flex items-center gap-3 border-b border-slate-800 pb-3">
      <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
        ${ext.toUpperCase()}
      </div>
      <div>
        <h3 class="font-bold text-white text-base">${fileName}</h3>
        <p class="text-slate-400 text-xs">${langName} Source Document</p>
      </div>
    </div>
    <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
      <div class="text-cyan-400 font-bold">ℹ Language Toolchain Info:</div>
      <p class="text-slate-400 leading-relaxed">
        LivePad provides full syntax highlighting, linting, formatting, and structural analysis for ${langName}.
      </p>
      <div class="text-slate-500 text-[11px] pt-1 border-t border-slate-900">
        Lines: ${(currentFile?.content || '').split('\n').length} | Characters: ${(currentFile?.content || '').length}
      </div>
    </div>
  </div>
</body>
</html>`,
      errors,
      warnings
    };
  }

  // --- 4. HTML, CSS, JS, TS, REACT VIRTUAL PROJECT RESOLUTION ---
  const htmlFile = safeFiles.find((f) => f && (f.language === 'html' || f.name.endsWith('.html'))) ||
    (ext === 'html' ? currentFile : null);

  let baseHTML = '';

  if (htmlFile) {
    baseHTML = htmlFile.content;
    const htmlDir = getFileDirectory(htmlFile.path);

    // 4a. Resolve <link rel="stylesheet" href="...">
    baseHTML = baseHTML.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return match;
      }
      const matchedCss = findMatchingFile(safeFiles, htmlDir, href);
      if (matchedCss) {
        return `<style data-linked-file="${matchedCss.name}">\n/* Linked from ${href} */\n${matchedCss.content}\n</style>`;
      } else {
        errors.push({
          fileName: htmlFile.name,
          message: `Cannot resolve linked stylesheet: "${href}"`,
          type: 'import'
        });
        return `<!-- Failed to resolve stylesheet: ${href} -->`;
      }
    });

    // 4b. Resolve <script src="...">
    baseHTML = baseHTML.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        return match;
      }
      const matchedScript = findMatchingFile(safeFiles, htmlDir, src);
      if (matchedScript) {
        return `<script data-linked-file="${matchedScript.name}">\n/* Linked from ${src} */\n${matchedScript.content}\n</script>`;
      } else {
        errors.push({
          fileName: htmlFile.name,
          message: `Cannot resolve script file: "${src}"`,
          type: 'import'
        });
        return `<!-- Failed to resolve script: ${src} -->`;
      }
    });

    // 4c. Resolve <img src="..."> and <source src="...">
    baseHTML = baseHTML.replace(/<(img|source)\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, tag, src) => {
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('//')) {
        return match;
      }
      const matchedAsset = findMatchingFile(safeFiles, htmlDir, src);
      if (matchedAsset) {
        const uri = getAssetDataUri(matchedAsset);
        return match.replace(src, uri);
      }
      return match;
    });
  } else {
    // Default HTML root wrapper if no index.html exists
    baseHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LivePad Application Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="root"></div>
</body>
</html>`;
  }

  // --- 5. BUILD VIRTUAL ES MODULE BUNDLE FOR REACT / TS / JS FILES ---
  const jsTsFiles = safeFiles.filter((f) =>
    f && ['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript'].some((l) => l === f.language || f.extension === l || f.name.endsWith(`.${l}`))
  );

  const compiledModulesMap: Record<string, string> = {};

  for (const file of jsTsFiles) {
    let codeToCompile = file.content;
    const babel = typeof window !== 'undefined' && (window as any).Babel;

    if (babel && babel.transform) {
      try {
        const transpiled = babel.transform(codeToCompile, {
          presets: ['react', 'typescript', ['env', { modules: 'commonjs' }]],
          filename: file.name
        }).code || '';
        compiledModulesMap[normalizePath(file.path)] = transpiled;
      } catch (err: any) {
        const loc = err.loc || {};
        errors.push({
          fileName: file.path || file.name,
          line: loc.line || 1,
          column: loc.column || 1,
          message: err.message || String(err),
          type: 'syntax'
        });
        compiledModulesMap[normalizePath(file.path)] = codeToCompile;
      }
    } else {
      compiledModulesMap[normalizePath(file.path)] = codeToCompile;
    }
  }

  // --- 6. VIRTUAL MODULE LOADER & INJECTION SCRIPT ---
  const virtualModulesJSON = JSON.stringify(compiledModulesMap);
  const filePathsLookupJSON = JSON.stringify(
    safeFiles.map((f) => ({
      id: f.id,
      name: f.name,
      path: normalizePath(f.path),
      content: f.content,
      type: f.extension
    }))
  );

  const moduleSystemScript = `
<script>
(function() {
  const __modules__ = ${virtualModulesJSON};
  const __files_lookup__ = ${filePathsLookupJSON};
  const __cache__ = {};

  function normalize(p) {
    const parts = p.replace(/\\\\/g, '/').split('/');
    const st = [];
    for (const pt of parts) {
      if (!pt || pt === '.') continue;
      if (pt === '..') { if (st.length) st.pop(); }
      else st.push(pt);
    }
    return st.join('/');
  }

  function resolvePath(baseDir, relative) {
    if (!relative) return '';
    if (relative.startsWith('/')) return normalize(relative);
    const combined = baseDir ? baseDir + '/' + relative : relative;
    return normalize(combined);
  }

  function findModule(baseDir, reqPath) {
    const target = resolvePath(baseDir, reqPath);
    if (__modules__[target]) return target;

    const exts = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'];
    for (const ext of exts) {
      if (__modules__[target + ext]) return target + ext;
      if (__modules__[target + '/index' + ext]) return target + '/index' + ext;
    }

    // Try finding in files list (for CSS, JSON, assets)
    const fileItem = __files_lookup__.find(f => f.path === target || f.path === target + '.css' || f.name === reqPath.split('/').pop());
    if (fileItem) return fileItem.path;

    return null;
  }

  function customRequire(fromPath, reqPath) {
    // External standard browser packages
    if (reqPath === 'react') return window.React || window.React;
    if (reqPath === 'react-dom') return window.ReactDOM || window.ReactDOM;
    if (reqPath === 'react-dom/client') return window.ReactDOM || window.ReactDOM;
    if (reqPath === 'lucide-react') return window.LucideIcons || {};

    const baseDir = fromPath.split('/').slice(0, -1).join('/');
    const resolvedPath = findModule(baseDir, reqPath);

    if (!resolvedPath) {
      console.warn('Cannot resolve module: "' + reqPath + '" from "' + fromPath + '"');
      return {};
    }

    // Handle CSS import (e.g. import './style.css')
    if (resolvedPath.endsWith('.css')) {
      const cssFile = __files_lookup__.find(f => f.path === resolvedPath);
      if (cssFile && !document.querySelector('style[data-path="' + resolvedPath + '"]')) {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-path', resolvedPath);
        styleEl.innerHTML = cssFile.content;
        document.head.appendChild(styleEl);
      }
      return {};
    }

    // Handle JSON import
    if (resolvedPath.endsWith('.json')) {
      const jsonFile = __files_lookup__.find(f => f.path === resolvedPath);
      try {
        return jsonFile ? JSON.parse(jsonFile.content) : {};
      } catch(e) { return {}; }
    }

    if (__cache__[resolvedPath]) {
      return __cache__[resolvedPath].exports;
    }

    const moduleObj = { exports: {} };
    __cache__[resolvedPath] = moduleObj;

    let codeFn = __modules__[resolvedPath];
    if (typeof codeFn === 'string') {
      let executableCode = codeFn;
      if (window.Babel && (executableCode.includes('import ') || executableCode.includes('export ') || executableCode.includes('<') || executableCode.includes(':'))) {
        try {
          executableCode = window.Babel.transform(executableCode, {
            presets: ['react', 'typescript', ['env', { modules: 'commonjs' }]],
            filename: resolvedPath
          }).code || executableCode;
        } catch(e) {
          console.error('Transpile error for ' + resolvedPath + ':', e.message);
        }
      }
      const runner = new Function('exports', 'require', 'module', executableCode);
      runner(moduleObj.exports, (p) => customRequire(resolvedPath, p), moduleObj);
    }

    return moduleObj.exports;
  }

  // Intercept Console Logs & Errors for Parent IDE
  function notifyParent(type, payload) {
    try {
      window.parent.postMessage({ source: 'livepad-preview', type: type, payload: payload }, '*');
    } catch(e) {}
  }

  ['log', 'info', 'warn', 'error'].forEach(function(lvl) {
    var orig = console[lvl];
    console[lvl] = function() {
      var args = Array.prototype.slice.call(arguments);
      orig.apply(console, args);
      var msg = args.map(function(a) {
        if (a === null) return 'null';
        if (a === undefined) return 'undefined';
        return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
      }).join(' ');
      notifyParent('CONSOLE_LOG', { level: lvl, message: msg });
    };
  });

  window.onerror = function(msg, src, line, col, err) {
    notifyParent('RUNTIME_ERROR', { message: String(msg), line: line, column: col, stack: err ? err.stack : '' });
    return false;
  };

  window.addEventListener('unhandledrejection', function(e) {
    notifyParent('RUNTIME_ERROR', { message: e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Promise Rejection' });
  });

  // Auto-boot React entry point (App.tsx / main.tsx / index.tsx)
  window.addEventListener('DOMContentLoaded', function() {
    try {
      const entryCandidates = [
        'src/App.tsx', 'src/App.jsx', 'src/App.js', 'src/main.tsx', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx', 'App.tsx', 'app.js'
      ];
      let entryModule = null;
      for (const cand of entryCandidates) {
        if (__modules__[cand]) {
          entryModule = cand;
          break;
        }
      }

      if (entryModule && document.getElementById('root')) {
        const exportsObj = customRequire('root', entryModule);
        const Component = exportsObj.default || exportsObj.App || exportsObj.Main;
        if (Component && window.ReactDOM && window.React) {
          const rootEl = document.getElementById('root');
          if (window.ReactDOM.createRoot) {
            window.ReactDOM.createRoot(rootEl).render(window.React.createElement(Component));
          } else {
            window.ReactDOM.render(window.React.createElement(Component), rootEl);
          }
        }
      }
    } catch(err) {
      console.error("Application Boot Failure:", err.message);
    }
  });
})();
</script>
`;

  // Inject React and Babel CDN dependencies if React/JS/TS files exist
  const hasReact = jsTsFiles.some((f) => f.content.includes('React') || f.content.includes('export default') || f.name.endsWith('.tsx') || f.name.endsWith('.jsx'));
  const hasJsTs = jsTsFiles.length > 0;

  const reactCdnScript = `
    ${hasJsTs ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.0/babel.min.js"></script>' : ''}
    ${hasReact ? '<script src="https://unpkg.com/react@18/umd/react.development.js"></script>\n<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>' : ''}
  `.trim();

  let finalHTML = baseHTML;
  if (finalHTML.includes('</head>')) {
    finalHTML = finalHTML.replace('</head>', `${reactCdnScript}\n</head>`);
  } else {
    finalHTML = `${reactCdnScript}\n${finalHTML}`;
  }

  if (finalHTML.includes('</body>')) {
    finalHTML = finalHTML.replace('</body>', `${moduleSystemScript}\n</body>`);
  } else {
    finalHTML += moduleSystemScript;
  }

  return {
    html: finalHTML,
    errors,
    warnings
  };
}
