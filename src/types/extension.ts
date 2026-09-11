export type ExtensionCategory = 'themes' | 'icons' | 'snippets' | 'language-packs' | 'ai-tools';

export type ExtensionState = 'not_installed' | 'installed' | 'disabled' | 'update_available';

export interface ExtensionThemeContribution {
  id: string;
  label: string;
  uiTheme: 'vs-dark' | 'vs-light' | 'hc-black';
  colors: {
    background: string;
    sidebarBackground: string;
    editorBackground: string;
    activeTabBackground: string;
    inactiveTabBackground: string;
    accentColor: string;
    textColor: string;
    mutedText: string;
    border: string;
    lineNumber: string;
    lineHighlight: string;
    selection: string;
    statusBarBackground: string;
  };
  monacoRules?: Array<{
    token: string;
    foreground?: string;
    fontStyle?: string;
  }>;
}

export interface ExtensionIconContribution {
  id: string;
  label: string;
  iconMap: Record<string, string>; // file extension -> lucide icon name or svg
}

export interface ExtensionSnippetContribution {
  id: string;
  language: string;
  prefix: string;
  title: string;
  description: string;
  body: string | string[];
}

export interface ExtensionLanguagePackContribution {
  locale: string;
  label: string;
  translations: Record<string, string>;
}

export interface ExtensionAIToolContribution {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  iconName?: string;
  systemInstruction?: string;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;
  publisher: string;
  description: string;
  category: ExtensionCategory;
  iconUrl?: string;
  bannerColor?: string;
  downloads: number;
  rating: number;
  reviewsCount: number;
  changelog?: string;
  readme?: string;
  repository?: string;
  homepage?: string;
  contributes: {
    themes?: ExtensionThemeContribution[];
    icons?: ExtensionIconContribution[];
    snippets?: ExtensionSnippetContribution[];
    languagePacks?: ExtensionLanguagePackContribution[];
    aiTools?: ExtensionAIToolContribution[];
    commands?: Array<{ id: string; title: string; category?: string }>;
  };
  // Optional dynamic JS script content that registers custom behavior via ExtensionAPI
  scriptContent?: string;
}

export interface InstalledExtension {
  manifest: ExtensionManifest;
  enabled: boolean;
  installedAt: string;
  installedVersion: string;
  hasUpdate?: boolean;
  latestVersion?: string;
  customConfig?: Record<string, any>;
}

export interface ExtensionAPI {
  registerTheme: (theme: ExtensionThemeContribution) => void;
  registerIconPack: (iconPack: ExtensionIconContribution) => void;
  registerSnippets: (snippets: ExtensionSnippetContribution[]) => void;
  registerLanguagePack: (langPack: ExtensionLanguagePackContribution) => void;
  registerAITool: (aiTool: ExtensionAIToolContribution) => void;
  registerCommand: (commandId: string, handler: (...args: any[]) => void) => void;
  showNotification: (type: 'info' | 'success' | 'warn' | 'error', message: string) => void;
  getWorkspaceFiles: () => any[];
  getActiveFile: () => any | null;
}
