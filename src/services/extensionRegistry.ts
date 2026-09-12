import {
  ExtensionManifest,
  InstalledExtension,
  ExtensionThemeContribution,
  ExtensionIconContribution,
  ExtensionSnippetContribution,
  ExtensionLanguagePackContribution,
  ExtensionAIToolContribution,
  ExtensionAPI
} from '../types/extension';

// Default built-in Extension Catalog available in Marketplace
export const MARKETPLACE_CATALOG: ExtensionManifest[] = [
  {
    id: 'theme-dracula-official',
    name: 'dracula-official',
    displayName: 'Dracula Official Theme',
    version: '2.2.4',
    publisher: 'Dracula Theme',
    description: 'The famous dark theme for developers with high contrast neon pastel accents.',
    category: 'themes',
    bannerColor: '#282a36',
    downloads: 1420500,
    rating: 4.9,
    reviewsCount: 3120,
    readme: 'Dracula is a dark theme for 300+ apps, including VS Code, LivePad IDE, and Terminal.',
    changelog: 'v2.2.4: Refined line numbers contrast and active tab border glow.',
    contributes: {
      themes: [
        {
          id: 'dracula-official',
          label: 'Dracula Official',
          uiTheme: 'vs-dark',
          colors: {
            background: '#282a36',
            sidebarBackground: '#21222c',
            editorBackground: '#282a36',
            activeTabBackground: '#282a36',
            inactiveTabBackground: '#191a21',
            accentColor: '#bd93f9',
            textColor: '#f8f8f2',
            mutedText: '#6272a4',
            border: '#44475a',
            lineNumber: '#6272a4',
            lineHighlight: '#44475a',
            selection: '#44475a',
            statusBarBackground: '#191a21'
          },
          monacoRules: [
            { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
            { token: 'string', foreground: 'f1fa8c' },
            { token: 'number', foreground: 'bd93f9' },
            { token: 'type', foreground: '8be9fd' },
            { token: 'function', foreground: '50fa7b' }
          ]
        }
      ]
    }
  },
  {
    id: 'theme-one-dark-pro',
    name: 'one-dark-pro',
    displayName: 'One Dark Pro Atom Theme',
    version: '3.18.0',
    publisher: 'zhuangtongfa',
    description: 'Atom One Dark theme for LivePad IDE with rich syntax highlighting.',
    category: 'themes',
    bannerColor: '#282c34',
    downloads: 2150000,
    rating: 4.8,
    reviewsCount: 5410,
    readme: 'Atom One Dark Pro brings the iconic dark aesthetic from Atom to your web IDE workspace.',
    changelog: 'v3.18.0: Improved TypeScript interface & enum color tokens.',
    contributes: {
      themes: [
        {
          id: 'one-dark-pro',
          label: 'One Dark Pro',
          uiTheme: 'vs-dark',
          colors: {
            background: '#282c34',
            sidebarBackground: '#21252b',
            editorBackground: '#282c34',
            activeTabBackground: '#282c34',
            inactiveTabBackground: '#1e2227',
            accentColor: '#61afef',
            textColor: '#abb2bf',
            mutedText: '#5c6370',
            border: '#3e4451',
            lineNumber: '#4b5263',
            lineHighlight: '#2c313c',
            selection: '#3e4451',
            statusBarBackground: '#21252b'
          },
          monacoRules: [
            { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'c678dd' },
            { token: 'string', foreground: '98c379' },
            { token: 'number', foreground: 'd19a66' },
            { token: 'type', foreground: 'e5c07b' },
            { token: 'function', foreground: '61afef' }
          ]
        }
      ]
    }
  },
  {
    id: 'theme-cyberpunk-neon-2077',
    name: 'cyberpunk-neon-2077',
    displayName: 'Cyberpunk Neon 2077 Theme',
    version: '1.5.2',
    publisher: 'NightCity Devs',
    description: 'High voltage cyberpunk aesthetic with glowing cyan, electric magenta, and yellow.',
    category: 'themes',
    bannerColor: '#0d0f18',
    downloads: 620400,
    rating: 4.95,
    reviewsCount: 1890,
    readme: 'Futuristic high-contrast neon theme inspired by Cyberpunk 2077 HUD graphics.',
    changelog: 'v1.5.2: Added neon cyan gutter highlight glow.',
    contributes: {
      themes: [
        {
          id: 'cyberpunk-neon-2077',
          label: 'Cyberpunk Neon 2077',
          uiTheme: 'vs-dark',
          colors: {
            background: '#0d0f18',
            sidebarBackground: '#080a10',
            editorBackground: '#0d0f18',
            activeTabBackground: '#161928',
            inactiveTabBackground: '#06070a',
            accentColor: '#00f0ff',
            textColor: '#fcee0a',
            mutedText: '#7681b3',
            border: '#00f0ff',
            lineNumber: '#00f0ff',
            lineHighlight: '#1d2238',
            selection: '#ff0055',
            statusBarBackground: '#00f0ff'
          },
          monacoRules: [
            { token: 'comment', foreground: '7681b3', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff0055', fontStyle: 'bold' },
            { token: 'string', foreground: '00f0ff' },
            { token: 'number', foreground: 'fcee0a' },
            { token: 'type', foreground: '39ff14' },
            { token: 'function', foreground: 'ff00aa' }
          ]
        }
      ]
    }
  },
  {
    id: 'theme-solarized-light',
    name: 'solarized-light',
    displayName: 'Solarized Light Pro',
    version: '2.0.1',
    publisher: 'Ethan Schoonover',
    description: 'Precision color palette designed for low eye strain in daylight environments.',
    category: 'themes',
    bannerColor: '#fdf6e3',
    downloads: 410200,
    rating: 4.7,
    reviewsCount: 820,
    readme: 'Solarized is a sixteen color palette for use with terminal and graphical applications.',
    changelog: 'v2.0.1: Optimized contrast for light screen viewports.',
    contributes: {
      themes: [
        {
          id: 'solarized-light',
          label: 'Solarized Light',
          uiTheme: 'vs-light',
          colors: {
            background: '#fdf6e3',
            sidebarBackground: '#eee8d5',
            editorBackground: '#fdf6e3',
            activeTabBackground: '#fdf6e3',
            inactiveTabBackground: '#e0dacb',
            accentColor: '#268bd2',
            textColor: '#657b83',
            mutedText: '#93a1a1',
            border: '#d33682',
            lineNumber: '#93a1a1',
            lineHighlight: '#eee8d5',
            selection: '#eee8d5',
            statusBarBackground: '#eee8d5'
          }
        }
      ]
    }
  },
  {
    id: 'icons-material-theme',
    name: 'material-icon-theme',
    displayName: 'Material Icon Theme Pro',
    version: '5.2.0',
    publisher: 'Philipp Kief',
    description: 'Material Design Icons for files, folders, and language extensions.',
    category: 'icons',
    downloads: 3890100,
    rating: 4.9,
    reviewsCount: 9200,
    readme: 'The official Material Icon Theme for code editors with distinct file brand badges.',
    changelog: 'v5.2.0: Added Bun, Turbopack, and Vitest file icons.',
    contributes: {
      icons: [
        {
          id: 'material-icons',
          label: 'Material Icon Theme',
          iconMap: {
            ts: 'file-code-2',
            tsx: 'file-type-2',
            js: 'file-json',
            jsx: 'file-type',
            json: 'file-json-2',
            css: 'palette',
            html: 'layout',
            py: 'terminal',
            sql: 'database',
            md: 'file-text'
          }
        }
      ]
    }
  },
  {
    id: 'icons-vs-code-great',
    name: 'vscode-great-icons',
    displayName: 'VS Code Great Icons',
    version: '2.1.0',
    publisher: 'Emmanuel Béziat',
    description: 'Clean vector icons with vivid colors for popular web development stacks.',
    category: 'icons',
    downloads: 1205000,
    rating: 4.8,
    reviewsCount: 1400,
    contributes: {
      icons: [
        {
          id: 'vscode-great-icons',
          label: 'VS Code Great Icons',
          iconMap: {
            ts: 'code',
            tsx: 'component',
            js: 'file-code',
            py: 'code-2'
          }
        }
      ]
    }
  },
  {
    id: 'snippets-react-next-ultimate',
    name: 'react-nextjs-snippets',
    displayName: 'React & Next.js Ultimate Snippets',
    version: '4.1.0',
    publisher: 'dsznajder',
    description: 'Essential snippets for React 18, Next.js App Router, Hooks, and TypeScript.',
    category: 'snippets',
    downloads: 2900000,
    rating: 4.9,
    reviewsCount: 4200,
    contributes: {
      snippets: [
        {
          id: 'snip-rfc',
          language: 'typescriptreact',
          prefix: 'rfc',
          title: 'React Functional Component',
          description: 'Generates a React FC with named export and TypeScript props interface.',
          body: [
            'import React from "react";',
            '',
            'interface ${1:ComponentName}Props {',
            '  children?: React.ReactNode;',
            '}',
            '',
            'export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ children }) => {',
            '  return (',
            '    <div className="${2:className}">',
            '      {children}',
            '    </div>',
            '  );',
            '};'
          ]
        },
        {
          id: 'snip-use-state',
          language: 'typescriptreact',
          prefix: 'useSt',
          title: 'useState Hook',
          description: 'Generates useState hook with tuple destructuring.',
          body: ['const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:string}>(${3:initialState});']
        },
        {
          id: 'snip-use-effect',
          language: 'typescriptreact',
          prefix: 'useEf',
          title: 'useEffect Hook',
          description: 'Generates useEffect hook with dependency array.',
          body: [
            'useEffect(() => {',
            '  ${1:// effect logic}',
            '  return () => {',
            '    ${2:// cleanup}',
            '  };',
            '}, [${3:deps}]);'
          ]
        }
      ]
    }
  },
  {
    id: 'snippets-express-node-rest',
    name: 'express-node-snippets',
    displayName: 'Express & Node.js REST API Snippets',
    version: '2.0.0',
    publisher: 'NodeCraft',
    description: 'Speed up backend Express route creation, middleware, and async error wrappers.',
    category: 'snippets',
    downloads: 1800000,
    rating: 4.8,
    reviewsCount: 2100,
    contributes: {
      snippets: [
        {
          id: 'snip-express-app',
          language: 'typescript',
          prefix: 'expApp',
          title: 'Express Server Bootstrap',
          description: 'Creates a fully configured Express server listener.',
          body: [
            'import express from "express";',
            'const app = express();',
            'app.use(express.json());',
            '',
            'app.get("/api/health", (req, res) => {',
            '  res.json({ status: "ok", timestamp: new Date().toISOString() });',
            '});',
            '',
            'app.listen(3000, "0.0.0.0", () => {',
            '  console.log("Server running on port 3000");',
            '});'
          ]
        },
        {
          id: 'snip-express-route',
          language: 'typescript',
          prefix: 'expGet',
          title: 'Express GET Endpoint',
          description: 'Standard async GET route handler with try-catch.',
          body: [
            'app.get("${1:/api/resource}", async (req, res) => {',
            '  try {',
            '    ${2:// Logic}',
            '    res.json({ success: true });',
            '  } catch (err: any) {',
            '    res.status(500).json({ error: err.message });',
            '  }',
            '});'
          ]
        }
      ]
    }
  },
  {
    id: 'langpack-es-spanish',
    name: 'spanish-language-pack',
    displayName: 'Spanish Language Pack (Español)',
    version: '1.2.0',
    publisher: 'LivePad i18n Team',
    description: 'Traduce la interfaz de usuario de LivePad IDE al idioma Español.',
    category: 'language-packs',
    downloads: 540000,
    rating: 4.9,
    reviewsCount: 910,
    contributes: {
      languagePacks: [
        {
          locale: 'es',
          label: 'Español (Spanish)',
          translations: {
            'Explorer': 'Explorador',
            'Search in Workspace': 'Buscar en el Espacio de Trabajo',
            'Source Control': 'Control de Versiones',
            'Run & Debug': 'Ejecutar y Depurar',
            'Test Explorer': 'Explorador de Pruebas',
            'Extensions Marketplace': 'Mercado de Extensiones',
            'AI Assistant': 'Asistente de IA',
            'Terminal': 'Terminal Interactivo',
            'Debug Console': 'Consola de Depuración',
            'Settings': 'Configuración',
            'Install': 'Instalar',
            'Installed': 'Instalado',
            'Uninstall': 'Desinstalar',
            'Enable': 'Habilitar',
            'Disable': 'Deshabilitar',
            'Update': 'Actualizar'
          }
        }
      ]
    }
  },
  {
    id: 'langpack-ja-japanese',
    name: 'japanese-language-pack',
    displayName: 'Japanese Language Pack (日本語)',
    version: '1.4.0',
    publisher: 'LivePad i18n Team',
    description: 'LivePad IDE の UI を日本語に翻訳する言語パック拡張機能です。',
    category: 'language-packs',
    downloads: 820000,
    rating: 4.95,
    reviewsCount: 1540,
    contributes: {
      languagePacks: [
        {
          locale: 'ja',
          label: '日本語 (Japanese)',
          translations: {
            'Explorer': 'エクスプローラー',
            'Search in Workspace': 'ワークスペース内検索',
            'Source Control': 'ソース管理 (Git)',
            'Run & Debug': '実行とデバッグ',
            'Test Explorer': 'テストエクスプローラー',
            'Extensions Marketplace': '拡張機能マーケットプレイス',
            'AI Assistant': 'AI アシスタント',
            'Terminal': 'ターミナル',
            'Debug Console': 'デバッグコンソール',
            'Settings': '設定',
            'Install': 'インストール',
            'Installed': 'インストール済み',
            'Uninstall': 'アンインストール',
            'Enable': '有効化',
            'Disable': '無効化',
            'Update': '更新'
          }
        }
      ]
    }
  },
  {
    id: 'langpack-fr-french',
    name: 'french-language-pack',
    displayName: 'French Language Pack (Français)',
    version: '1.1.0',
    publisher: 'LivePad i18n Team',
    description: 'Traduit l’interface utilisateur de LivePad IDE en français.',
    category: 'language-packs',
    downloads: 320000,
    rating: 4.85,
    reviewsCount: 420,
    contributes: {
      languagePacks: [
        {
          locale: 'fr',
          label: 'Français (French)',
          translations: {
            'Explorer': 'Explorateur',
            'Search in Workspace': 'Rechercher',
            'Source Control': 'Gestionnaire de Source',
            'Run & Debug': 'Exécuter et Déboguer',
            'Test Explorer': 'Explorateur de Tests',
            'Extensions Marketplace': 'Marketplace d’Extensions',
            'AI Assistant': 'Assistant IA',
            'Settings': 'Paramètres',
            'Install': 'Installer',
            'Installed': 'Installé'
          }
        }
      ]
    }
  },
  {
    id: 'ai-tool-refactor-security-scanner',
    name: 'ai-code-refactoring-scanner',
    displayName: 'AI Code Refactoring & Security Scanner',
    version: '2.5.0',
    publisher: 'DeepMind AI Labs',
    description: 'Scans source files for memory leaks, XSS, security vulnerabilities, and optimizes performance.',
    category: 'ai-tools',
    downloads: 1420000,
    rating: 4.95,
    reviewsCount: 3800,
    contributes: {
      aiTools: [
        {
          id: 'tool-security-audit',
          name: 'Security & Bug Audit AI',
          description: 'Analyzes active code for security bugs, unhandled exceptions, and edge case vulnerabilities.',
          promptTemplate: 'Please perform a comprehensive security & performance code review on the following code:\n\n```\n{code}\n```\n\nHighlight vulnerabilities, complexity bottlenecks, and provide exact corrected code snippets.',
          iconName: 'ShieldAlert'
        },
        {
          id: 'tool-refactor-clean-code',
          name: 'Clean Code Refactor AI',
          description: 'Refactors selected code following SOLID principles, DRY standards, and modern clean architecture.',
          promptTemplate: 'Refactor the following code to adhere strictly to clean code practices and modern TypeScript standards:\n\n```\n{code}\n```',
          iconName: 'Sparkles'
        }
      ]
    }
  },
  {
    id: 'ai-tool-jsdoc-generator',
    name: 'ai-jsdoc-docstring-generator',
    displayName: 'JSDoc & Docstring AI Auto-Generator',
    version: '1.8.0',
    publisher: 'DocuAI',
    description: 'Automatically drafts clean, professional JSDoc / TypeDoc / Python docstrings for functions and classes.',
    category: 'ai-tools',
    downloads: 980000,
    rating: 4.88,
    reviewsCount: 1950,
    contributes: {
      aiTools: [
        {
          id: 'tool-jsdoc-auto',
          name: 'Auto JSDoc Generator',
          description: 'Generates typed JSDoc comments with @param, @returns, and edge case throws annotations.',
          promptTemplate: 'Generate clean JSDoc comments for all exported functions and classes in the following code:\n\n```\n{code}\n```',
          iconName: 'FileText'
        }
      ]
    }
  },
  {
    id: 'ai-tool-sql-query-builder',
    name: 'ai-sql-query-builder',
    displayName: 'SQL Query Builder & Schema Assistant AI',
    version: '1.3.0',
    publisher: 'DataCraft AI',
    description: 'Generates optimized PostgreSQL / MySQL queries, indexes, and schema migration DDL scripts.',
    category: 'ai-tools',
    downloads: 670000,
    rating: 4.9,
    reviewsCount: 1100,
    contributes: {
      aiTools: [
        {
          id: 'tool-sql-gen',
          name: 'SQL Query Builder AI',
          description: 'Transforms natural language data requirements into high performance SQL queries.',
          promptTemplate: 'Build an optimized SQL query for the following request:\n{userPrompt}\n\nTarget Database: PostgreSQL / Firestore.',
          iconName: 'Database'
        }
      ]
    }
  }
];

const STORAGE_KEY_INSTALLED = 'livepad_extensions_installed_v2';
const STORAGE_KEY_ACTIVE_THEME = 'livepad_active_theme_id';
const STORAGE_KEY_ACTIVE_ICON_PACK = 'livepad_active_icon_pack_id';
const STORAGE_KEY_ACTIVE_LOCALE = 'livepad_active_locale';

type Listener = () => void;

class ExtensionRegistryManager {
  private installed: Map<string, InstalledExtension> = new Map();
  private catalog: ExtensionManifest[] = [...MARKETPLACE_CATALOG];
  private listeners: Set<Listener> = new Set();

  private activeThemeId: string = 'dracula-official';
  private activeIconPackId: string = 'material-icons';
  private activeLocale: string = 'en';

  private dynamicThemes: Map<string, ExtensionThemeContribution> = new Map();
  private dynamicIconPacks: Map<string, ExtensionIconContribution> = new Map();
  private dynamicSnippets: Map<string, ExtensionSnippetContribution> = new Map();
  private dynamicLanguagePacks: Map<string, ExtensionLanguagePackContribution> = new Map();
  private dynamicAITools: Map<string, ExtensionAIToolContribution> = new Map();
  private customCommands: Map<string, (...args: any[]) => void> = new Map();

  // Cached array references for useSyncExternalStore stability
  private cachedInstalledArray: InstalledExtension[] = [];
  private cachedThemesArray: ExtensionThemeContribution[] = [];
  private cachedLocalesArray: Array<{ locale: string; label: string }> = [];
  private cachedSnippetsArray: ExtensionSnippetContribution[] = [];
  private cachedAIToolsArray: ExtensionAIToolContribution[] = [];

  constructor() {
    this.loadFromStorage();
    this.rebuildCaches();
  }

  private rebuildCaches() {
    this.cachedInstalledArray = Array.from(this.installed.values());
    this.cachedThemesArray = Array.from(this.dynamicThemes.values());
    this.cachedSnippetsArray = Array.from(this.dynamicSnippets.values());
    this.cachedAIToolsArray = Array.from(this.dynamicAITools.values());

    const localesList: Array<{ locale: string; label: string }> = [{ locale: 'en', label: 'English (US)' }];
    this.dynamicLanguagePacks.forEach((pack) => {
      localesList.push({ locale: pack.locale, label: pack.label });
    });
    this.cachedLocalesArray = localesList;
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_ACTIVE_THEME);
      if (savedTheme) this.activeThemeId = savedTheme;

      const savedIconPack = localStorage.getItem(STORAGE_KEY_ACTIVE_ICON_PACK);
      if (savedIconPack) this.activeIconPackId = savedIconPack;

      const savedLocale = localStorage.getItem(STORAGE_KEY_ACTIVE_LOCALE);
      if (savedLocale) this.activeLocale = savedLocale;

      const rawInstalled = localStorage.getItem(STORAGE_KEY_INSTALLED);
      if (rawInstalled) {
        const parsed: InstalledExtension[] = JSON.parse(rawInstalled);
        parsed.forEach((ext) => {
          this.installed.set(ext.manifest.id, ext);
          if (ext.enabled) {
            this.activateExtensionContributions(ext.manifest);
          }
        });
      } else {
        // Auto-install Dracula, Material Icons, React Snippets, Spanish & AI Security Scanner as default enabled built-in extensions
        const defaultInstalls = [
          'theme-dracula-official',
          'icons-material-theme',
          'snippets-react-next-ultimate',
          'ai-tool-refactor-security-scanner',
          'langpack-es-spanish'
        ];
        defaultInstalls.forEach((id) => {
          const item = this.catalog.find((c) => c.id === id);
          if (item) {
            const installedObj: InstalledExtension = {
              manifest: item,
              enabled: true,
              installedAt: new Date().toISOString(),
              installedVersion: item.version
            };
            this.installed.set(item.id, installedObj);
            this.activateExtensionContributions(item);
          }
        });
        this.saveToStorage();
      }
    } catch (err) {
      console.warn('Error loading extension state from storage:', err);
    }
  }

  private saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const arr = Array.from(this.installed.values());
      localStorage.setItem(STORAGE_KEY_INSTALLED, JSON.stringify(arr));
      localStorage.setItem(STORAGE_KEY_ACTIVE_THEME, this.activeThemeId);
      localStorage.setItem(STORAGE_KEY_ACTIVE_ICON_PACK, this.activeIconPackId);
      localStorage.setItem(STORAGE_KEY_ACTIVE_LOCALE, this.activeLocale);
    } catch (err) {
      console.warn('Error saving extension state:', err);
    }
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.rebuildCaches();
    this.listeners.forEach((l) => l());
  }

  private activateExtensionContributions(manifest: ExtensionManifest) {
    // 1. Themes
    manifest.contributes.themes?.forEach((theme) => {
      this.dynamicThemes.set(theme.id, theme);
    });

    // 2. Icon packs
    manifest.contributes.icons?.forEach((icons) => {
      this.dynamicIconPacks.set(icons.id, icons);
    });

    // 3. Snippets
    manifest.contributes.snippets?.forEach((snippet) => {
      this.dynamicSnippets.set(snippet.id, snippet);
    });

    // 4. Language packs
    manifest.contributes.languagePacks?.forEach((langPack) => {
      this.dynamicLanguagePacks.set(langPack.locale, langPack);
    });

    // 5. AI tools
    manifest.contributes.aiTools?.forEach((aiTool) => {
      this.dynamicAITools.set(aiTool.id, aiTool);
    });

    // 6. Dynamic Script Content
    if (manifest.scriptContent) {
      this.runDynamicScript(manifest.scriptContent, manifest.id);
    }
  }

  private deactivateExtensionContributions(manifest: ExtensionManifest) {
    manifest.contributes.themes?.forEach((theme) => {
      this.dynamicThemes.delete(theme.id);
    });
    manifest.contributes.icons?.forEach((icons) => {
      this.dynamicIconPacks.delete(icons.id);
    });
    manifest.contributes.snippets?.forEach((snippet) => {
      this.dynamicSnippets.delete(snippet.id);
    });
    manifest.contributes.languagePacks?.forEach((langPack) => {
      this.dynamicLanguagePacks.delete(langPack.locale);
    });
    manifest.contributes.aiTools?.forEach((aiTool) => {
      this.dynamicAITools.delete(aiTool.id);
    });
  }

  // Runtime Extension API exposed to dynamic extensions loaded without rebuilding!
  public createExtensionAPI(extensionId: string): ExtensionAPI {
    return {
      registerTheme: (theme) => {
        this.dynamicThemes.set(theme.id, theme);
        this.notify();
      },
      registerIconPack: (iconPack) => {
        this.dynamicIconPacks.set(iconPack.id, iconPack);
        this.notify();
      },
      registerSnippets: (snippets) => {
        snippets.forEach((s) => this.dynamicSnippets.set(s.id, s));
        this.notify();
      },
      registerLanguagePack: (langPack) => {
        this.dynamicLanguagePacks.set(langPack.locale, langPack);
        this.notify();
      },
      registerAITool: (aiTool) => {
        this.dynamicAITools.set(aiTool.id, aiTool);
        this.notify();
      },
      registerCommand: (commandId, handler) => {
        this.customCommands.set(commandId, handler);
      },
      showNotification: (type, message) => {
        console.log(`[Extension:${extensionId}] [${type.toUpperCase()}] ${message}`);
      },
      getWorkspaceFiles: () => [],
      getActiveFile: () => null
    };
  }

  public runDynamicScript(code: string, extensionId: string) {
    try {
      const api = this.createExtensionAPI(extensionId);
      const runner = new Function('api', code);
      runner(api);
    } catch (err) {
      console.error(`[ExtensionRegistry] Failed to execute dynamic script for extension ${extensionId}:`, err);
    }
  }

  // Marketplace & Installed Getters
  public getCatalog(): ExtensionManifest[] {
    return this.catalog;
  }

  public getInstalledExtensions(): InstalledExtension[] {
    return this.cachedInstalledArray;
  }

  public getInstalledExtension(id: string): InstalledExtension | undefined {
    return this.installed.get(id);
  }

  // Extension Actions
  public installExtension(manifest: ExtensionManifest): void {
    const existing = this.installed.get(manifest.id);
    if (existing) {
      this.enableExtension(manifest.id);
      return;
    }

    const newInstalled: InstalledExtension = {
      manifest,
      enabled: true,
      installedAt: new Date().toISOString(),
      installedVersion: manifest.version
    };

    this.installed.set(manifest.id, newInstalled);
    this.activateExtensionContributions(manifest);

    // Auto-set as active theme/icon/locale if applicable
    if (manifest.contributes.themes?.[0]) {
      this.setActiveTheme(manifest.contributes.themes[0].id);
    }
    if (manifest.contributes.icons?.[0]) {
      this.setActiveIconPack(manifest.contributes.icons[0].id);
    }
    if (manifest.contributes.languagePacks?.[0]) {
      this.setActiveLocale(manifest.contributes.languagePacks[0].locale);
    }

    this.saveToStorage();
    this.notify();
  }

  public updateExtension(id: string): void {
    const installed = this.installed.get(id);
    const catalogItem = this.catalog.find((c) => c.id === id);
    if (installed && catalogItem) {
      installed.installedVersion = catalogItem.version;
      installed.hasUpdate = false;
      installed.manifest = catalogItem;
      if (installed.enabled) {
        this.activateExtensionContributions(catalogItem);
      }
      this.saveToStorage();
      this.notify();
    }
  }

  public removeExtension(id: string): void {
    const installed = this.installed.get(id);
    if (installed) {
      this.deactivateExtensionContributions(installed.manifest);
      this.installed.delete(id);
      this.saveToStorage();
      this.notify();
    }
  }

  public enableExtension(id: string): void {
    const installed = this.installed.get(id);
    if (installed) {
      installed.enabled = true;
      this.activateExtensionContributions(installed.manifest);
      this.saveToStorage();
      this.notify();
    }
  }

  public disableExtension(id: string): void {
    const installed = this.installed.get(id);
    if (installed) {
      installed.enabled = false;
      this.deactivateExtensionContributions(installed.manifest);
      this.saveToStorage();
      this.notify();
    }
  }

  // Active theme, icons, locale management
  public setActiveTheme(themeId: string) {
    this.activeThemeId = themeId;
    this.saveToStorage();
    this.notify();
  }

  public getActiveThemeId(): string {
    return this.activeThemeId;
  }

  public getActiveTheme(): ExtensionThemeContribution | undefined {
    return this.dynamicThemes.get(this.activeThemeId);
  }

  public getAllThemes(): ExtensionThemeContribution[] {
    return this.cachedThemesArray;
  }

  public setActiveIconPack(iconPackId: string) {
    this.activeIconPackId = iconPackId;
    this.saveToStorage();
    this.notify();
  }

  public getActiveIconPackId(): string {
    return this.activeIconPackId;
  }

  public getActiveIconPack(): ExtensionIconContribution | undefined {
    return this.dynamicIconPacks.get(this.activeIconPackId);
  }

  public setActiveLocale(locale: string) {
    this.activeLocale = locale;
    this.saveToStorage();
    this.notify();
  }

  public getActiveLocale(): string {
    return this.activeLocale;
  }

  public getTranslation(key: string): string {
    if (this.activeLocale === 'en') return key;
    const pack = this.dynamicLanguagePacks.get(this.activeLocale);
    if (pack && pack.translations[key]) {
      return pack.translations[key];
    }
    return key;
  }

  public getAllAvailableLocales(): Array<{ locale: string; label: string }> {
    return this.cachedLocalesArray;
  }

  public getAllSnippets(): ExtensionSnippetContribution[] {
    return this.cachedSnippetsArray;
  }

  public getAllAITools(): ExtensionAIToolContribution[] {
    return this.cachedAIToolsArray;
  }

  // Dynamic Runtime Loading without rebuilding (Validation Requirement)
  public loadDynamicBundle(bundleJsonOrCode: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(bundleJsonOrCode);
      if (parsed && parsed.id && parsed.displayName) {
        const manifest: ExtensionManifest = {
          id: parsed.id,
          name: parsed.name || parsed.id,
          displayName: parsed.displayName,
          version: parsed.version || '1.0.0',
          publisher: parsed.publisher || 'Custom Developer',
          description: parsed.description || 'Dynamically sideloaded custom extension.',
          category: parsed.category || 'ai-tools',
          downloads: 1,
          rating: 5.0,
          reviewsCount: 1,
          contributes: parsed.contributes || {}
        };
        this.installExtension(manifest);
        return { success: true, message: `Successfully sideloaded extension "${manifest.displayName}" dynamically!` };
      }
    } catch (e) {
      // If not JSON, attempt to execute as JS snippet using ExtensionAPI
      try {
        const dummyId = `custom-script-${Date.now()}`;
        this.runDynamicScript(bundleJsonOrCode, dummyId);
        this.notify();
        return { success: true, message: 'Executed custom dynamic JS extension script successfully!' };
      } catch (scriptErr: any) {
        return { success: false, message: `Failed to load bundle: ${scriptErr.message}` };
      }
    }
    return { success: false, message: 'Invalid manifest format. Required fields: id, displayName, category.' };
  }
}

export const extensionRegistry = new ExtensionRegistryManager();
