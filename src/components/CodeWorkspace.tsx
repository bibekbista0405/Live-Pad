import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor, { OnMount } from '@monaco-editor/react';
import JSZip from 'jszip';
import {
  Play,
  RotateCcw,
  FileCode,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Code2,
  Terminal,
  Eye,
  Settings,
  Users,
  Lock,
  Unlock,
  Radio,
  Sparkles,
  BookOpen,
  Copy,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Info,
  Type,
  Folder,
  FileText,
  PanelLeft,
  PanelRight,
  WrapText,
  Search,
  ArrowLeft,
  GraduationCap,
  MessageSquare,
  Zap,
  CornerDownRight,
  ShieldAlert,
  Columns,
  Rows,
  LayoutGrid,
  ExternalLink,
  GripVertical,
  History,
  FolderCode,
  Archive,
  Upload
} from 'lucide-react';

import ActivityBar, { ActivityBarTab } from './code/ActivityBar';
import StatusBar from './code/StatusBar';
import CodePreviewPanel, { DevicePreset } from './CodePreviewPanel';
import FileExplorerTree, { SyncErrorState } from './code/FileExplorerTree';
import FileContextMenu from './code/FileContextMenu';
import BreadcrumbsNav from './code/BreadcrumbsNav';
import FileTabsBar from './code/FileTabsBar';
import QuickOpenModal from './code/QuickOpenModal';
import CommandPaletteModal, { CommandOption } from './code/CommandPaletteModal';
import VersionHistoryModal from './code/VersionHistoryModal';
import RecycleBinModal from './code/RecycleBinModal';
import ProjectManagerModal from './code/ProjectManagerModal';
import MonacoEditorWrapper from './code/MonacoEditorWrapper';
import ErrorBoundary from './ErrorBoundary';
import { AICopilotPanel } from './code/AICopilotPanel';
import InteractiveTerminal from './code/InteractiveTerminal';
import SearchFilesModal from './code/SearchFilesModal';
import DebugPanel from './code/DebugPanel';
import TestExplorerPanel from './code/TestExplorerPanel';
import ExtensionMarketplacePanel from './code/ExtensionMarketplacePanel';
import { OutlineView } from './code/OutlineView';
import { TaskRunnerPanel } from './code/TaskRunnerPanel';
import { ProfileSelectorModal } from './code/ProfileSelectorModal';
import { CloudWorkspacePanel } from './code/CloudWorkspacePanel';
import { GitHubPanel } from './code/GitHubPanel';
import { WorkspaceAdminPanel } from './code/WorkspaceAdminPanel';
import { WorkspaceKnowledgePanel } from './code/WorkspaceKnowledgePanel';
import { ProjectDashboardPanel } from './code/ProjectDashboardPanel';
import { LiveSessionBar } from './collaboration/LiveSessionBar';
import { languageService } from '../services/languageService';
import { projectIndexEngine } from '../services/projectIndexEngine';
import { backupService } from '../services/backupService';
import { profileService, WorkspaceProfile } from '../services/profileService';
import { 
  Breakpoint, 
  VariableScope, 
  WatchExpression, 
  StackFrame, 
  RunConfiguration, 
  DebugStatus, 
  TestSuite, 
  TestCase, 
  CoverageReport 
} from '../types/debug';
import { DebugConsoleLog } from './code/InteractiveTerminal';
import { VoicePanel } from './collaboration/VoicePanel';
import { ChatPanel, FloatingChatTrigger } from './collaboration/ChatPanel';
import { CommentsPanel } from './collaboration/CommentsPanel';
import { getLanguageFromExtension, getFileBoilerplate } from '../utils/languageSupport';

import {
  openLocalDirectory,
  saveFileToLocalDisk,
  isFileSystemAccessSupported
} from '../services/pwaFileSystemService';

import {
  CodingProject,
  ProjectFolder,
  ProjectFile,
  FileVersion,
  TrashedItem,
  ContextMenuState,
  ProblemDiagnostic
} from '../types/code';
import { getWorkspaceDiagnostics } from '../utils/virtualProjectBuilder';
import {
  saveLocalProjectData,
  loadLocalProjectData,
  saveFileVersionHistoryLocal
} from '../services/indexedDBService';
import { ensureAuth } from '../lib/firebase';
import { Platform } from '../platform';
import {
  subscribeToWorkspaceProjects,
  subscribeToProjectStructure,
  initializeWorkspaceProjectsInFirestore,
  saveProjectDoc,
  saveProjectFileDoc,
  deleteProjectFileDoc,
  saveProjectFolderDoc,
  deleteProjectFolderDoc,
  saveFileVersionDoc,
  saveTrashDoc,
  deleteTrashDoc
} from '../services/projectSyncService';

export interface ConsoleLogEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'system';
  message: string;
  timestamp: string;
}

interface CodeWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  activeContent: string;
  onUpdateContent: (newContent: string) => void;
  codeLanguage: string;
  onChangeCodeLanguage: (lang: string) => void;
  roomCode: string | null;
  userName: string;
  userRole: 'teacher' | 'student' | any;
  activeUsers: any[];
  isReadOnly: boolean;
  onAddToast: (type: 'success' | 'error' | 'info', message: string) => void;
  remoteCursors?: any[];
  onCursorPositionChange?: (line: number, col: number, selEndLine?: number, selEndCol?: number) => void;
  comments?: any[];
  onAddComment?: (newComment: any) => void;
}

const DEFAULT_PROJECT_A: CodingProject = {
  id: 'proj-default-1',
  workspaceId: 'default-workspace',
  name: 'Portfolio Website',
  description: 'Interactive portfolio app with HTML, CSS, JS.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'LivePad User',
  activeFileId: 'file-1',
  openFileIds: ['file-1', 'file-2', 'file-3'],
  pinnedFileIds: ['file-1']
};

const DEFAULT_FOLDERS: ProjectFolder[] = [
  {
    id: 'folder-src',
    projectId: 'proj-default-1',
    name: 'src',
    parentId: null,
    path: 'src',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isExpanded: true
  },
  {
    id: 'folder-components',
    projectId: 'proj-default-1',
    name: 'components',
    parentId: 'folder-src',
    path: 'src/components',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isExpanded: true
  },
  {
    id: 'folder-ui',
    projectId: 'proj-default-1',
    name: 'ui',
    parentId: 'folder-components',
    path: 'src/components/ui',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isExpanded: true
  }
];

const DEFAULT_FILES: ProjectFile[] = [
  {
    id: 'file-1',
    projectId: 'proj-default-1',
    name: 'index.html',
    extension: 'html',
    language: 'html',
    path: 'index.html',
    parentId: null,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>LivePad Code Workspace</title>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
    <div class="inline-flex p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl mb-2">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
    <h1 class="text-2xl font-black text-white tracking-tight">LivePad Interactive Sandbox</h1>
    <p class="text-slate-400 text-sm">A real browser preview: edit this file, run it, and interact with the result.</p>
    <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
      <div class="text-xs text-slate-400">Local counter</div>
      <div id="count" class="text-4xl font-black text-white">0</div>
      <div class="grid grid-cols-2 gap-2">
        <button id="increment" class="py-2 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-xl">Increment</button>
        <button id="reset" class="py-2 bg-slate-800 hover:bg-slate-700 font-bold text-white rounded-xl">Reset</button>
      </div>
      <div id="status" class="text-[11px] text-emerald-400">Ready</div>
    </div>
  </div>

  <script>
    let count = Number(localStorage.getItem('livepad-demo-count') || 0);
    const countEl = document.getElementById('count');
    const statusEl = document.getElementById('status');
    const render = () => { countEl.textContent = String(count); localStorage.setItem('livepad-demo-count', String(count)); statusEl.textContent = 'Saved locally'; };
    document.getElementById('increment').addEventListener('click', () => { count += 1; render(); });
    document.getElementById('reset').addEventListener('click', () => { count = 0; render(); });
    render();
  </script>
</body>
</html>`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'LivePad User',
    updatedBy: 'LivePad User',
    version: 1,
    isPinned: true
  },
  {
    id: 'file-2',
    projectId: 'proj-default-1',
    name: 'Button.tsx',
    extension: 'tsx',
    language: 'typescript',
    path: 'src/components/ui/Button.tsx',
    parentId: 'folder-ui',
    content: `// React UI Button Component
export function Button({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 font-bold text-white rounded-xl shadow-md transition-all"
    >
      {label}
    </button>
  );
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'LivePad User',
    updatedBy: 'LivePad User',
    version: 1
  },
  {
    id: 'file-3',
    projectId: 'proj-default-1',
    name: 'app.js',
    extension: 'js',
    language: 'javascript',
    path: 'app.js',
    parentId: null,
    content: `// LivePad JavaScript Execution Engine
const systemInfo = {
  appName: "LivePad Cloud IDE",
  version: "4.0.0",
  features: ["Multi-project Workspace", "Unlimited Folder Tree", "Drag & Drop", "IndexedDB Offline", "Firestore Realtime"]
};

console.log("🚀 Initializing LivePad Code Workspace...");
console.info("System Config Loaded:", JSON.stringify(systemInfo, null, 2));`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'LivePad User',
    updatedBy: 'LivePad User',
    version: 1
  }
];

export default function CodeWorkspace({
  isOpen,
  onClose,
  activeContent,
  onUpdateContent,
  codeLanguage,
  onChangeCodeLanguage,
  roomCode,
  userName,
  userRole,
  activeUsers,
  isReadOnly,
  onAddToast,
  remoteCursors = [],
  onCursorPositionChange,
  comments = [],
  onAddComment
}: CodeWorkspaceProps) {
  const workspaceId = roomCode || 'default-workspace';

  // Projects State
  const [projects, setProjects] = useState<CodingProject[]>([DEFAULT_PROJECT_A]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-default-1');

  // File Structure State
  const [folders, setFolders] = useState<ProjectFolder[]>(DEFAULT_FOLDERS);
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [trash, setTrash] = useState<TrashedItem[]>([]);

  // Selection & Tab State
  const [activeFileId, setActiveFileId] = useState<string | null>('file-1');
  const [openFileIds, setOpenFileIds] = useState<string[]>(['file-1', 'file-2', 'file-3']);
  const [selectedIds, setSelectedIds] = useState<string[]>(['file-1']);
  const [closedTabHistory, setClosedTabHistory] = useState<string[]>([]);

  // Clipboard State
  const [clipboard, setClipboard] = useState<{ ids: string[]; mode: 'copy' | 'cut' } | null>(null);

  // Collaboration Comment Threads State
  const [commentThreads, setCommentThreads] = useState<any[]>([]);

  // Floating Workspace Chat State
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Debugger State
  const [debugStatus, setDebugStatus] = useState<DebugStatus>('idle');
  const [runConfigurations, setRunConfigurations] = useState<RunConfiguration[]>([
    { id: 'cfg-1', name: 'Launch Node.js (server.ts)', type: 'node', program: 'server.ts' },
    { id: 'cfg-2', name: 'Browser Debugger (App.tsx)', type: 'chrome', program: 'src/App.tsx' },
    { id: 'cfg-3', name: 'Jest / Vitest Unit Tests', type: 'jest', program: 'src/**/*.test.ts' },
    { id: 'cfg-4', name: 'Python Runner (main.py)', type: 'python', program: 'main.py' }
  ]);
  const [activeConfigId, setActiveConfigId] = useState<string>('cfg-1');
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [variableScopes, setVariableScopes] = useState<VariableScope[]>([]);
  const [watchExpressions, setWatchExpressions] = useState<WatchExpression[]>([]);
  const [callStack, setCallStack] = useState<StackFrame[]>([]);
  const [activeStackFrameId, setActiveStackFrameId] = useState<string | null>(null);
  const [activeDebugLine, setActiveDebugLine] = useState<number | null>(null);
  const [debugSessionId, setDebugSessionId] = useState<string | null>(null);
  const [debugConsoleLogs, setDebugConsoleLogs] = useState<DebugConsoleLog[]>([]);

  // Testing State — results are populated only by a real Vitest run.
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showCoverageOverlay, setShowCoverageOverlay] = useState(false);
  const [coverageReport, setCoverageReport] = useState<CoverageReport>({
    overall: { statementsPct: 0, branchesPct: 0, functionsPct: 0, linesPct: 0 },
    files: []
  });

  // Debugger Action Handlers
  const appendDebugLog = (type: DebugConsoleLog['type'], text: string) => {
    setDebugConsoleLogs((prev) => [
      ...prev,
      { id: `dlog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, text, time: new Date().toLocaleTimeString() }
    ]);
  };

  const handleStartDebug = async () => {
    if (!Platform.isElectron) {
      onAddToast('info', 'Native debugging is available in LivePad Desktop Edition only.');
      return;
    }
    const configObj = runConfigurations.find(c => c.id === activeConfigId) || runConfigurations[0];
    const recentProjects = await Platform.getRecentProjects();
    const root = recentProjects[0]?.path;
    const scriptPath = activeFile?.path
      ? root ? `${root.replace(/[\\/]+$/, '')}/${activeFile.path}` : activeFile.path
      : configObj.program;
    if (!root && !scriptPath.match(/^[A-Za-z]:[\\/]/) && !scriptPath.startsWith('/')) {
      onAddToast('error', 'Open a desktop project folder before starting the debugger.');
      return;
    }

    setDebugStatus('starting');
    appendDebugLog('info', `[Debugger] Starting ${configObj.name} for ${scriptPath}...`);
    try {
      const result = await Platform.launchDebugger({
        scriptPath,
        cwd: root,
        args: configObj.args || []
      });
      setDebugSessionId(result.sessionId);
      setDebugStatus('running');
      appendDebugLog('info', `[Debugger] Session ${result.sessionId} launched on inspector port ${result.port}.`);
    } catch (error) {
      setDebugStatus('stopped');
      appendDebugLog('error', `[Debugger] ${error instanceof Error ? error.message : String(error)}`);
      onAddToast('error', 'Debugger could not be started.');
    }
  };

  const handlePauseDebug = async () => {
    if (!debugSessionId) return;
    const ok = await Platform.controlDebugger(debugSessionId, 'pause');
    if (!ok) appendDebugLog('error', '[Debugger] Pause request was not accepted.');
  };

  const handleResumeDebug = async () => {
    if (!debugSessionId) return;
    const ok = await Platform.controlDebugger(debugSessionId, 'resume');
    if (!ok) appendDebugLog('error', '[Debugger] Resume request was not accepted.');
  };

  const handleStepOver = async () => {
    if (!debugSessionId) return;
    const ok = await Platform.controlDebugger(debugSessionId, 'stepOver');
    if (!ok) appendDebugLog('error', '[Debugger] Step-over request was not accepted.');
  };

  const handleStepInto = async () => {
    if (!debugSessionId) return;
    const ok = await Platform.controlDebugger(debugSessionId, 'stepInto');
    if (!ok) appendDebugLog('error', '[Debugger] Step-into request was not accepted.');
  };

  const handleStepOut = async () => {
    if (!debugSessionId) return;
    const ok = await Platform.controlDebugger(debugSessionId, 'stepOut');
    if (!ok) appendDebugLog('error', '[Debugger] Step-out request was not accepted.');
  };

  const handleStopDebug = async () => {
    if (debugSessionId) await Platform.controlDebugger(debugSessionId, 'stop');
    setDebugSessionId(null);
    setDebugStatus('stopped');
    setActiveDebugLine(null);
    setVariableScopes([]);
    setCallStack([]);
    setActiveStackFrameId(null);
    appendDebugLog('info', '[Debugger] Session stopped.');
  };

  useEffect(() => {
    const offOutput = Platform.onDebuggerOutput((data) => {
      if (debugSessionId && data.sessionId !== debugSessionId) return;
      appendDebugLog(data.type === 'stderr' ? 'error' : 'info', data.data.trimEnd());
    });
    const offEvent = Platform.onDebuggerEvent((data) => {
      if (debugSessionId && data.sessionId !== debugSessionId) return;
      if (data.event === 'paused') {
        setDebugStatus('paused');
        const callFrames = Array.isArray(data.details?.callFrames) ? data.details.callFrames : [];
        const top = callFrames[0];
        const line = typeof top?.location?.lineNumber === 'number' ? top.location.lineNumber + 1 : null;
        setActiveDebugLine(line);
        setCallStack(callFrames.map((frame: any, index: number) => ({
          id: `${data.sessionId}-frame-${index}`,
          name: frame.functionName || '(anonymous)',
          fileId: frame.url || '',
          filePath: frame.url || '',
          lineNumber: typeof frame.location?.lineNumber === 'number' ? frame.location.lineNumber + 1 : 1,
          columnNumber: typeof frame.location?.columnNumber === 'number' ? frame.location.columnNumber + 1 : 1
        })));
        setActiveStackFrameId(callFrames.length ? `${data.sessionId}-frame-0` : null);
        appendDebugLog('warn', `[Debugger] Paused${line ? ` at line ${line}` : ''}.`);
      } else if (data.event === 'resumed') {
        setDebugStatus('running');
        setActiveDebugLine(null);
      } else if (data.event === 'terminated') {
        setDebugStatus('stopped');
        setDebugSessionId(null);
        setActiveDebugLine(null);
        appendDebugLog('info', `[Debugger] Process terminated with exit code ${data.details?.exitCode ?? 0}.`);
      }
    });
    return () => { offOutput(); offEvent(); };
  }, [debugSessionId]);

  const handleToggleBreakpointAtLine = (lineNumber: number) => {
    const curPath = activeFile?.path || 'src/App.tsx';
    const curId = activeFileId || 'file-1';

    const existing = breakpoints.find((b) => b.filePath === curPath && b.lineNumber === lineNumber);
    if (existing) {
      setBreakpoints((prev) => prev.filter((b) => b.id !== existing.id));
      onAddToast('info', `Removed breakpoint on line ${lineNumber}`);
    } else {
      const created: Breakpoint = {
        id: `bp-${Date.now()}`,
        fileId: curId,
        filePath: curPath,
        lineNumber,
        enabled: true
      };
      setBreakpoints((prev) => [...prev, created]);
      onAddToast('success', `Added breakpoint on line ${lineNumber}`);
    }
  };

  const handleEvalDebugExpression = async (expr: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugConsoleLogs((prev) => [...prev, { id: `dlog-eval-${Date.now()}`, type: 'eval', text: expr, time }]);
    if (!debugSessionId) {
      appendDebugLog('error', '[Debugger] No active debugger session.');
      return;
    }
    try {
      const result = await Platform.evaluateDebugger(debugSessionId, expr);
      appendDebugLog('result', typeof result === 'string' ? result : JSON.stringify(result));
    } catch (error) {
      appendDebugLog('error', `Evaluation Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test Runner Action Handlers — always execute the real project test command.
  const handleRunAllTests = async () => {
    if (!Platform.isElectron) {
      onAddToast('info', 'Running project tests requires the LivePad Desktop Edition.');
      return;
    }
    if (isTesting) return;
    setIsTesting(true);
    setTestSuites([{ id: 'vitest-run', name: 'Vitest project test run', fileId: '', filePath: '', status: 'running', cases: [] }]);
    setSelectedTestCaseId(null);
    setCoverageReport({ overall: { statementsPct: 0, branchesPct: 0, functionsPct: 0, linesPct: 0 }, files: [] });
    appendDebugLog('info', '[Tests] Running npm test -- --run ...');
    const processId = `livepad-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let offOutput = () => {};
    let offExit = () => {};
    offOutput = Platform.onTerminalOutput((data) => {
      if (data.processId !== processId) return;
      appendDebugLog(data.type === 'stderr' ? 'error' : 'info', data.data.trimEnd());
    });
    offExit = Platform.onTerminalExit((data) => {
      if (data.processId !== processId) return;
      offOutput();
      offExit();
      setIsTesting(false);
      setTestSuites([{ id: 'vitest-run', name: 'Vitest project test run', fileId: '', filePath: '', status: data.code === 0 ? 'passed' : 'failed', cases: [] }]);
      onAddToast(data.code === 0 ? 'success' : 'error', data.code === 0 ? 'Tests passed.' : `Tests failed with exit code ${data.code}.`);
    });
    try {
      await Platform.executeCommand('npm test -- --run', undefined, processId);
    } catch (error) {
      offOutput();
      offExit();
      setIsTesting(false);
      setTestSuites([{ id: 'vitest-run', name: 'Vitest project test run', fileId: '', filePath: '', status: 'failed', cases: [] }]);
      onAddToast('error', error instanceof Error ? error.message : String(error));
    }
  };
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuickOpenOpen, setIsQuickOpenOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeFiles = Array.isArray(files) ? files : [];
  const safeFolders = Array.isArray(folders) ? folders : [];
  const safeTrash = Array.isArray(trash) ? trash : [];
  const safeOpenFileIds = Array.isArray(openFileIds) ? openFileIds : [];

  const activeProject = safeProjects.find((p) => p?.id === activeProjectId) || safeProjects[0] || DEFAULT_PROJECT_A;
  const activeFile = safeFiles.find((f) => f?.id === activeFileId) || (safeFiles.length > 0 ? safeFiles[0] : null);
  const openFiles = safeFiles.filter((f) => f && safeOpenFileIds.includes(f.id));

  // Phase 3 Services Initialization & Auto-Recovery
  useEffect(() => {
    // 1. Language Service
    languageService.registerMonacoProviders();

    // 2. Project Index Engine
    projectIndexEngine.indexWorkspace('.', undefined);

    // 3. Profile Service
    profileService.init();

    // 4. Auto Backup Ticker
    backupService.startAutoBackup(() => ({
      timestamp: Date.now(),
      openTabs: files.filter((f) => openFileIds.includes(f.id)).map((f) => ({ path: f.path, name: f.name, content: f.content, isDirty: f.isUnsaved })),
      activeTabPath: activeFile?.path || null,
      breakpoints: breakpoints.map((b) => ({ file: b.filePath, line: b.lineNumber })),
      unsavedDrafts: files.reduce((acc, f) => {
        if (f.isUnsaved) acc[f.path] = f.content;
        return acc;
      }, {} as Record<string, string>)
    }), 12000);

    return () => {
      backupService.stopAutoBackup();
    };
  }, [files, openFileIds, activeFile, breakpoints]);

  // IDE Layout Panel Visibility & Persistent Preferences
  const LAYOUT_STORAGE_KEY = 'livepad_layout_preferences_v3';
  const getInitialLayoutSetting = <T,>(key: string, defaultValue: T): T => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && key in parsed) return parsed[key];
      }
    } catch (e) {}
    return defaultValue;
  };

  const [activityBarTab, setActivityBarTab] = useState<ActivityBarTab>(
    getInitialLayoutSetting('activityBarTab', 'explorer')
  );
  const [isAIPanelOpen, setIsAIPanelOpen] = useState<boolean>(
    getInitialLayoutSetting('isAIPanelOpen', false)
  );
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(
    getInitialLayoutSetting('isTerminalOpen', false)
  );
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);

  // PWA Local File System Access API State
  const [isPwaMounted, setIsPwaMounted] = useState(false);
  const [pwaPath, setPwaPath] = useState<string>('');
  const fileHandlesMapRef = useRef<Map<string, any>>(new Map());

  // PWA Open Local Folder handler
  const handleOpenLocalFolder = async () => {
    try {
      const res = await openLocalDirectory(activeProjectId);
      if (res) {
        setFolders(res.folders);
        setFiles(res.files);
        fileHandlesMapRef.current = res.fileHandlesMap;
        setIsPwaMounted(true);
        setPwaPath(res.projectName);
        if (res.files.length > 0) {
          setActiveFileId(res.files[0].id);
          setOpenFileIds([res.files[0].id]);
        }
        onAddToast('success', `Mounted local folder "${res.projectName}" with ${res.files.length} files.`);
      }
    } catch (err: any) {
      onAddToast('error', err?.message || 'Could not open local folder.');
    }
  };

  // Global Keyboard Shortcuts (Ctrl+P, Ctrl+Shift+P, Ctrl+S, Ctrl+B, Ctrl+J, Ctrl+I, Ctrl+Shift+F)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (e.shiftKey) {
          setIsCommandPaletteOpen((prev) => !prev);
        } else {
          setIsQuickOpenOpen((prev) => !prev);
        }
      } else if (modifier && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (modifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onAddToast('success', 'Saved workspace state.');
      } else if (modifier && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setLeftSidebarOpen((prev) => !prev);
      } else if (modifier && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      } else if (modifier && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAIPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onAddToast]);

  // Inline Explorer Edit State
  const [inlineCreatingInFolder, setInlineCreatingInFolder] = useState<{ folderId: string | null; type: 'file' | 'folder' } | null>(null);
  const [inlineRenamingItem, setInlineRenamingItem] = useState<{ id: string; type: 'file' | 'folder'; currentName: string } | null>(null);

  // Sync Error Handler State
  const [syncError, setSyncError] = useState<SyncErrorState | null>(null);

  const handleSyncError = useCallback((err: any) => {
    const rawMsg = err?.message || String(err);
    if (rawMsg.includes('permission') || rawMsg.includes('Missing or insufficient permissions')) {
      setSyncError({
        title: 'Sync Permission Notice',
        message: 'Cloud workspace sync is re-authenticating or in local backup mode.',
        reason: 'Firestore permissions are re-synchronizing for room: ' + workspaceId,
        type: 'permission'
      });
    } else if (rawMsg.includes('network') || rawMsg.includes('unavailable') || rawMsg.includes('offline')) {
      setSyncError({
        title: 'Network Offline Notice',
        message: 'Working in local offline mode. Edits are saved to IndexedDB.',
        reason: 'Cloud network connection lost. Will auto-sync when online.',
        type: 'connectivity'
      });
    } else {
      setSyncError({
        title: 'Cloud Sync Notice',
        message: 'Project workspace is backed up locally in IndexedDB.',
        reason: rawMsg.length > 80 ? rawMsg.substring(0, 80) + '...' : rawMsg,
        type: 'general'
      });
    }
  }, [workspaceId]);

  const handleRetrySync = useCallback(async () => {
    setSyncError(null);
    onAddToast('info', 'Re-authenticating and synchronizing workspace...');
    try {
      const user = await ensureAuth();
      if (user) {
        onAddToast('success', 'Authenticated with Cloud Sync.');
      }
    } catch (err) {
      onAddToast('error', 'Authentication attempt completed.');
    }
  }, [onAddToast]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Editor Display Settings
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [secondaryFileId, setSecondaryFileId] = useState<string | null>(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(true);
  const autoSaveDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleReorderTabs = useCallback((draggedId: string, targetId: string) => {
    setOpenFileIds((prev) => {
      const fromIdx = prev.indexOf(draggedId);
      const toIdx = prev.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }, []);

  // Sidebar & Panel visibility
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(
    getInitialLayoutSetting('leftSidebarOpen', true)
  );
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(
    getInitialLayoutSetting('rightSidebarOpen', false)
  );
  const [activeLeftTab, setActiveLeftTab] = useState<'explorer' | 'projects' | 'resources'>('explorer');

  // Layout & Preview Preset
  const [layoutPreset, setLayoutPreset] = useState<'code-only' | 'split-50' | 'preview-focus' | 'preview-only'>('split-50');
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(
    getInitialLayoutSetting('isPreviewOpen', false)
  );

  // Sync Layout Preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({
          isAIPanelOpen,
          isTerminalOpen,
          isPreviewOpen,
          rightSidebarOpen,
          leftSidebarOpen,
          activityBarTab
        })
      );
    } catch (e) {}
  }, [isAIPanelOpen, isTerminalOpen, isPreviewOpen, rightSidebarOpen, leftSidebarOpen, activityBarTab]);
  const [isAutoReload, setIsAutoReload] = useState<boolean>(true);
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const centralContainerRef = useRef<HTMLDivElement>(null);

  // Console output log state
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([
    {
      id: 'log-1',
      type: 'system',
      message: 'LivePad Professional Cloud IDE ready. Live execution environment active.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Monaco Editor Refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const topBroadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // --- Realtime Sync & Local Cache ---
  useEffect(() => {
    // Load local offline IndexedDB cache initially
    loadLocalProjectData(activeProjectId).then((data) => {
      if (data.project) {
        setProjects((prev) => {
          const exists = prev.some((p) => p.id === data.project!.id);
          return exists ? prev.map((p) => (p.id === data.project!.id ? data.project! : p)) : [...prev, data.project!];
        });
      }
      if (data.folders.length > 0) setFolders(data.folders);
      if (data.files.length > 0) {
        setFiles(data.files);
        if (data.project?.activeFileId && data.files.some((f) => f.id === data.project.activeFileId)) {
          setActiveFileId(data.project.activeFileId);
        }
      }
      if (data.trash) setTrash(data.trash);
    });

    // Subscribe to Firestore Workspace Projects & Structure
    const unsubProjects = subscribeToWorkspaceProjects(
      workspaceId,
      (projList) => {
        if (projList.length > 0) {
          setProjects(projList);
          if (!projList.some((p) => p.id === activeProjectId)) {
            setActiveProjectId(projList[0].id);
          }
        } else {
          // Auto-initialize workspace in Firestore if no projects exist
          initializeWorkspaceProjectsInFirestore(workspaceId, userName).then((res) => {
            setProjects([res.project]);
            setActiveProjectId(res.project.id);
            setFolders(res.folders);
            setFiles(res.files);
          }).catch((err) => handleSyncError(err));
        }
      },
      (err) => {
        handleSyncError(err);
      }
    );

    const unsubStructure = subscribeToProjectStructure(
      workspaceId,
      activeProjectId,
      (fList) => { if (fList.length > 0) setFolders(fList); },
      (fldList) => { if (fldList.length > 0) setFiles(fldList); },
      (trashList) => setTrash(trashList)
    );

    return () => {
      unsubProjects();
      unsubStructure();
    };
  }, [workspaceId, activeProjectId]);

  // Persist state to IndexedDB locally on changes
  useEffect(() => {
    if (activeProject) {
      saveLocalProjectData(activeProject, folders, files, trash);
    }
  }, [activeProject, folders, files, trash]);

  // Cross-window Preview Broadcast Channel
  useEffect(() => {
    try {
      topBroadcastChannelRef.current = new BroadcastChannel('livepad_preview_sync');
    } catch (e) {
      // ignore
    }
    return () => topBroadcastChannelRef.current?.close();
  }, []);

  const compilePreviewBundle = useCallback(() => {
    const safeList = Array.isArray(files) ? files : [];
    const cssFiles = safeList.filter((f) => f && (f.language === 'css' || f.name?.endsWith('.css')));
    const combinedCSS = cssFiles.map((f) => `/* File: ${f.name} */\n${f.content || ''}`).join('\n\n');

    const jsFiles = safeList.filter(
      (f) =>
        f &&
        (f.language === 'javascript' ||
          f.language === 'typescript' ||
          f.name?.endsWith('.js') ||
          f.name?.endsWith('.ts'))
    );
    const combinedJS = jsFiles.map((f) => `// File: ${f.name}\n${f.content || ''}`).join('\n\n');

    let baseHTML = '';
    const htmlFile = safeList.find((f) => f && (f.language === 'html' || f.name?.endsWith('.html')));
    if (htmlFile) {
      baseHTML = htmlFile.content;
    } else {
      baseHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>LivePad Application Preview</title>
</head>
<body class="bg-slate-950 text-slate-100 p-6 min-h-screen">
  <div id="root" class="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
    <h1 class="text-2xl font-black text-white">Application View</h1>
    <p class="text-slate-400 text-sm mt-2">Active File: <code class="text-cyan-300 font-mono">${activeFile?.name || 'app.js'}</code></p>
  </div>
</body>
</html>`;
    }

    let finalHTML = baseHTML;
    if (combinedCSS.trim()) {
      const styleTag = `<style id="livepad-injected-css">\n${combinedCSS}\n</style>`;
      finalHTML = finalHTML.includes('</head>')
        ? finalHTML.replace('</head>', `${styleTag}\n</head>`)
        : `${styleTag}\n${finalHTML}`;
    }

    const jsInjection = `<script id="livepad-injected-js">\ntry {\n${combinedJS}\n} catch(err) {\n  console.error("Runtime Exception:", err.message);\n}\n</script>`;
    finalHTML = finalHTML.includes('</body>')
      ? finalHTML.replace('</body>', `${jsInjection}\n</body>`)
      : finalHTML + jsInjection;

    return finalHTML;
  }, [files, activeFile]);

  // Sync with active editor content
  const handleSelectFile = (fileId: string, isMulti = false, isRange = false) => {
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
      );
    } else {
      setSelectedIds([fileId]);
    }

    setActiveFileId(fileId);
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds((prev) => [...prev, fileId]);
    }

    const selected = files.find((f) => f.id === fileId);
    if (selected) {
      onChangeCodeLanguage(selected.language);
      onUpdateContent(selected.content);
    }
  };

  // Real-time workspace diagnostics (compiler & linter)
  const workspaceProblems = React.useMemo(() => {
    return getWorkspaceDiagnostics(files);
  }, [files]);

  // Editor jump target position (line, column)
  const [editorTargetPosition, setEditorTargetPosition] = useState<{ line: number; column: number } | null>(null);

  const handleSelectProblem = useCallback((filePath: string, line: number, col: number, fileId?: string) => {
    let targetFile = fileId ? files.find((f) => f.id === fileId) : null;
    if (!targetFile) {
      targetFile = files.find(
        (f) => f.path === filePath || f.name === filePath || f.path.endsWith(filePath) || filePath.endsWith(f.path)
      );
    }
    if (targetFile) {
      handleSelectFile(targetFile.id);
    }
    setEditorTargetPosition({ line, column: col });
  }, [files]);

  const handleEditorChange = (val: string, targetFileId?: string) => {
    const fileToUpdateId = targetFileId || activeFileId;
    if (!fileToUpdateId) return;

    const currentFile = files.find((f) => f.id === fileToUpdateId);
    if (!currentFile) return;

    if (fileToUpdateId === activeFileId) {
      onUpdateContent(val);
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === fileToUpdateId ? { ...f, content: val, updatedAt: Date.now(), isUnsaved: !isAutoSaveEnabled } : f))
    );

    // Stream directly to PWA local computer disk if handle exists
    const handle = fileHandlesMapRef.current.get(fileToUpdateId);
    if (handle) {
      saveFileToLocalDisk(handle, val);
    }

    // Save to Firestore with debounced sync
    saveProjectFileDoc(workspaceId, activeProjectId, { ...currentFile, content: val, updatedAt: Date.now(), isUnsaved: false });

    // Handle AutoSave indicator clearing
    if (isAutoSaveEnabled) {
      const existingTimer = autoSaveDebounceRef.current.get(fileToUpdateId);
      if (existingTimer) clearTimeout(existingTimer);

      const newTimer = setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileToUpdateId ? { ...f, isUnsaved: false } : f))
        );
      }, 1000);
      autoSaveDebounceRef.current.set(fileToUpdateId, newTimer);
    }
  };

  // Tab Handlers
  const handleCloseTab = (fileId: string) => {
    setClosedTabHistory((prev) => [...prev, fileId]);
    const nextOpen = openFileIds.filter((id) => id !== fileId);
    setOpenFileIds(nextOpen);

    if (activeFileId === fileId) {
      if (nextOpen.length > 0) {
        handleSelectFile(nextOpen[nextOpen.length - 1]);
      } else {
        setActiveFileId(null);
      }
    }
  };

  const handleCloseOthers = (fileId: string) => {
    setOpenFileIds([fileId]);
    handleSelectFile(fileId);
  };

  const handleTogglePinTab = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isPinned: !f.isPinned } : f))
    );
  };

  const handleRestoreClosedTab = () => {
    if (closedTabHistory.length === 0) return;
    const lastClosed = closedTabHistory[closedTabHistory.length - 1];
    setClosedTabHistory((prev) => prev.slice(0, -1));
    if (files.some((f) => f.id === lastClosed)) {
      handleSelectFile(lastClosed);
    }
  };

  // Folder & File CRUD Operations
  const handleCreateInlineFolder = (parentId: string | null, name: string) => {
    const parent = folders.find((f) => f.id === parentId);
    const path = parent ? `${parent.path}/${name}` : name;

    const newFolder: ProjectFolder = {
      id: `folder-${Date.now()}`,
      projectId: activeProjectId,
      name,
      parentId,
      path,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isExpanded: true
    };

    setFolders((prev) => [...prev, newFolder]);
    saveProjectFolderDoc(workspaceId, activeProjectId, newFolder);
    onAddToast('success', `Created folder ${name}`);
  };

  const handleCreateInlineFile = (parentId: string | null, name: string) => {
    const parent = folders.find((f) => f.id === parentId);
    const path = parent ? `${parent.path}/${name}` : name;
    const ext = name.split('.').pop() || 'js';
    const lang = getLanguageFromExtension(name);
    const initialContent = getFileBoilerplate(name);

    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      projectId: activeProjectId,
      name,
      extension: ext,
      language: lang,
      path,
      parentId,
      content: initialContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userName || 'collaborator',
      updatedBy: userName || 'collaborator',
      version: 1
    };

    setFiles((prev) => [...prev, newFile]);
    saveProjectFileDoc(workspaceId, activeProjectId, newFile);
    handleSelectFile(newFile.id);
    onAddToast('success', `Created file ${name}`);
  };

  const handleRenameItem = (id: string, type: 'file' | 'folder', newName: string) => {
    if (type === 'file') {
      const ext = newName.split('.').pop() || 'js';
      const lang = getLanguageFromExtension(newName);
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const updated = { ...f, name: newName, extension: ext, language: lang, updatedAt: Date.now() };
            saveProjectFileDoc(workspaceId, activeProjectId, updated);
            return updated;
          }
          return f;
        })
      );
    } else {
      setFolders((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const updated = { ...f, name: newName, updatedAt: Date.now() };
            saveProjectFolderDoc(workspaceId, activeProjectId, updated);
            return updated;
          }
          return f;
        })
      );
    }
    onAddToast('info', `Renamed item to "${newName}"`);
  };

  const handleDuplicateItem = (id: string, type: 'file' | 'folder') => {
    if (type === 'file') {
      const source = files.find((f) => f.id === id);
      if (!source) return;
      const dup: ProjectFile = {
        ...source,
        id: `file-${Date.now()}`,
        name: `Copy_of_${source.name}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setFiles((prev) => [...prev, dup]);
      saveProjectFileDoc(workspaceId, activeProjectId, dup);
      handleSelectFile(dup.id);
      onAddToast('success', `Duplicated ${source.name}`);
    } else {
      const source = folders.find((f) => f.id === id);
      if (!source) return;
      const dupFolder: ProjectFolder = {
        ...source,
        id: `folder-${Date.now()}`,
        name: `Copy_of_${source.name}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setFolders((prev) => [...prev, dupFolder]);
      saveProjectFolderDoc(workspaceId, activeProjectId, dupFolder);
      onAddToast('success', `Duplicated folder ${source.name}`);
    }
  };

  const handleDeleteItems = (ids: string[], type: 'file' | 'folder') => {
    ids.forEach((id) => {
      if (type === 'file') {
        const item = files.find((f) => f.id === id);
        if (item) {
          const trashItem: TrashedItem = {
            id: `trash-${Date.now()}`,
            projectId: activeProjectId,
            originalItem: item,
            itemType: 'file',
            deletedAt: Date.now(),
            deletedBy: userName || 'collaborator'
          };
          setTrash((prev) => [...prev, trashItem]);
          saveTrashDoc(workspaceId, activeProjectId, trashItem);
          setFiles((prev) => prev.filter((f) => f.id !== id));
          deleteProjectFileDoc(workspaceId, activeProjectId, id);
          if (activeFileId === id) setActiveFileId(null);
        }
      } else {
        const item = folders.find((f) => f.id === id);
        if (item) {
          const trashItem: TrashedItem = {
            id: `trash-${Date.now()}`,
            projectId: activeProjectId,
            originalItem: item,
            itemType: 'folder',
            deletedAt: Date.now(),
            deletedBy: userName || 'collaborator'
          };
          setTrash((prev) => [...prev, trashItem]);
          saveTrashDoc(workspaceId, activeProjectId, trashItem);
          setFolders((prev) => prev.filter((f) => f.id !== id));
          deleteProjectFolderDoc(workspaceId, activeProjectId, id);
        }
      }
    });
    onAddToast('info', `Moved ${ids.length} item(s) to Recycle Bin.`);
  };

  const handleMoveItems = (sourceIds: string[], targetFolderId: string | null) => {
    const parent = folders.find((f) => f.id === targetFolderId);

    sourceIds.forEach((id) => {
      // Check files
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const path = parent ? `${parent.path}/${f.name}` : f.name;
            const updated = { ...f, parentId: targetFolderId, path, updatedAt: Date.now() };
            saveProjectFileDoc(workspaceId, activeProjectId, updated);
            return updated;
          }
          return f;
        })
      );

      // Check folders
      setFolders((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const path = parent ? `${parent.path}/${f.name}` : f.name;
            const updated = { ...f, parentId: targetFolderId, path, updatedAt: Date.now() };
            saveProjectFolderDoc(workspaceId, activeProjectId, updated);
            return updated;
          }
          return f;
        })
      );
    });

    onAddToast('success', `Moved item(s) cleanly.`);
  };

  // Clipboard Operations
  const handleCopy = (ids: string[]) => {
    setClipboard({ ids, mode: 'copy' });
    onAddToast('info', `Copied ${ids.length} item(s) to clipboard.`);
  };

  const handleCut = (ids: string[]) => {
    setClipboard({ ids, mode: 'cut' });
    onAddToast('info', `Cut ${ids.length} item(s) to clipboard.`);
  };

  const handlePaste = (targetFolderId: string | null) => {
    if (!clipboard || clipboard.ids.length === 0) return;

    clipboard.ids.forEach((id) => {
      if (clipboard.mode === 'cut') {
        handleMoveItems([id], targetFolderId);
      } else {
        handleDuplicateItem(id, files.some((f) => f.id === id) ? 'file' : 'folder');
      }
    });

    if (clipboard.mode === 'cut') setClipboard(null);
    onAddToast('success', 'Pasted items cleanly.');
  };

  // Download File, Folder or Entire Project as ZIP
  const handleDownloadItem = async (id: string, type: 'file' | 'folder') => {
    if (type === 'file') {
      const file = files.find((f) => f.id === id);
      if (!file) return;
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      onAddToast('success', `Downloaded ${file.name}`);
    } else {
      const zip = new JSZip();
      const folder = folders.find((f) => f.id === id);
      if (!folder) return;

      const addFolderToZip = (fId: string, currentZipFolder: JSZip) => {
        const subFiles = files.filter((f) => f.parentId === fId);
        subFiles.forEach((f) => currentZipFolder.file(f.name, f.content));

        const subFolders = folders.filter((f) => f.parentId === fId);
        subFolders.forEach((sub) => {
          const zipSub = currentZipFolder.folder(sub.name);
          if (zipSub) addFolderToZip(sub.id, zipSub);
        });
      };

      const folderZip = zip.folder(folder.name);
      if (folderZip) addFolderToZip(folder.id, folderZip);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      onAddToast('success', `Downloaded ${folder.name}.zip`);
    }
  };

  const handleDownloadProjectZip = async () => {
    const zip = new JSZip();

    const addFolderRecursive = (parentId: string | null, parentZip: JSZip) => {
      const rootFiles = files.filter((f) => f.parentId === parentId);
      rootFiles.forEach((f) => parentZip.file(f.name, f.content));

      const rootFolders = folders.filter((f) => f.parentId === parentId);
      rootFolders.forEach((folder) => {
        const subZip = parentZip.folder(folder.name);
        if (subZip) addFolderRecursive(folder.id, subZip);
      });
    };

    addFolderRecursive(null, zip);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/\s+/g, '_')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    onAddToast('success', `Exported full project ${activeProject.name}.zip`);
  };

  // Upload Desktop Files & Preserving Directory Trees
  const handleUploadDropFiles = (fileList: FileList, targetFolderId: string | null) => {
    Array.from(fileList).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const pathSegments = f.webkitRelativePath ? f.webkitRelativePath.split('/') : [f.name];
        const fileName = pathSegments[pathSegments.length - 1];

        handleCreateInlineFile(targetFolderId, fileName);
        // update file content
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((item) => (item.name === fileName ? { ...item, content } : item))
          );
        }, 100);
      };
      reader.readAsText(f);
    });
    onAddToast('success', `Uploaded ${fileList.length} file(s) from system.`);
  };

  // Restore from Trash
  const handleRestoreFromTrash = (item: TrashedItem) => {
    if (item.itemType === 'file') {
      const restored = item.originalItem as ProjectFile;
      setFiles((prev) => [...prev, restored]);
      saveProjectFileDoc(workspaceId, activeProjectId, restored);
    } else {
      const restored = item.originalItem as ProjectFolder;
      setFolders((prev) => [...prev, restored]);
      saveProjectFolderDoc(workspaceId, activeProjectId, restored);
    }
    setTrash((prev) => prev.filter((t) => t.id !== item.id));
    deleteTrashDoc(workspaceId, activeProjectId, item.id);
    onAddToast('success', `Restored ${item.originalItem.name}`);
  };

  const handleDeleteTrashPermanent = (trashId: string) => {
    setTrash((prev) => prev.filter((t) => t.id !== trashId));
    deleteTrashDoc(workspaceId, activeProjectId, trashId);
    onAddToast('info', 'Deleted item permanently.');
  };

  const handleEmptyTrash = () => {
    trash.forEach((t) => deleteTrashDoc(workspaceId, activeProjectId, t.id));
    setTrash([]);
    onAddToast('info', 'Recycle bin emptied.');
  };

  // Context Menu Handler
  const handleContextMenuTrigger = (
    e: React.MouseEvent,
    id: string | null,
    type: 'file' | 'folder' | 'root'
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetId: id,
      targetType: type
    });
  };

  // Shortcuts Listener (Ctrl + N, Ctrl + Shift + N, Ctrl + P, Ctrl + Shift + P, F2, Del, etc.)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (ctrl && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsQuickOpenOpen(true);
      } else if (ctrl && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setInlineCreatingInFolder({ folderId: null, type: 'folder' });
      } else if (ctrl && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setInlineCreatingInFolder({ folderId: null, type: 'file' });
      } else if (e.key === 'F2' && selectedIds.length === 1) {
        e.preventDefault();
        const id = selectedIds[0];
        const file = files.find((f) => f.id === id);
        if (file) {
          setInlineRenamingItem({ id, type: 'file', currentName: file.name });
        } else {
          const folder = folders.find((f) => f.id === id);
          if (folder) setInlineRenamingItem({ id, type: 'folder', currentName: folder.name });
        }
      } else if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        const fileIds = selectedIds.filter((id) => files.some((f) => f.id === id));
        if (fileIds.length > 0) handleDeleteItems(fileIds, 'file');
        const folderIds = selectedIds.filter((id) => folders.some((f) => f.id === id));
        if (folderIds.length > 0) handleDeleteItems(folderIds, 'folder');
      } else if (ctrl && (e.key === 'D' || e.key === 'd') && selectedIds.length === 1) {
        e.preventDefault();
        const id = selectedIds[0];
        if (files.some((f) => f.id === id)) handleDuplicateItem(id, 'file');
        else if (folders.some((f) => f.id === id)) handleDuplicateItem(id, 'folder');
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [selectedIds, files, folders]);

  // Command Palette Options
  const commandOptions: CommandOption[] = [
    {
      id: 'cmd-new-file',
      category: 'File',
      label: 'New File',
      shortcut: 'Ctrl + N',
      icon: <Plus className="w-4 h-4" />,
      action: () => setInlineCreatingInFolder({ folderId: null, type: 'file' })
    },
    {
      id: 'cmd-new-folder',
      category: 'File',
      label: 'New Folder',
      shortcut: 'Ctrl + Shift + N',
      icon: <Folder className="w-4 h-4" />,
      action: () => setInlineCreatingInFolder({ folderId: null, type: 'folder' })
    },
    {
      id: 'cmd-quick-open',
      category: 'Navigation',
      label: 'Quick Open File',
      shortcut: 'Ctrl + P',
      icon: <Search className="w-4 h-4" />,
      action: () => setIsQuickOpenOpen(true)
    },
    {
      id: 'cmd-switch-profile',
      category: 'Preferences',
      label: 'Switch Workspace Profile & Preferences',
      icon: <Settings className="w-4 h-4" />,
      action: () => setIsProfileModalOpen(true)
    },
    {
      id: 'cmd-export-zip',
      category: 'Project',
      label: 'Export Full Project ZIP',
      icon: <Archive className="w-4 h-4" />,
      action: handleDownloadProjectZip
    },
    {
      id: 'cmd-version-history',
      category: 'Version Control',
      label: 'File Version History & Snapshots',
      icon: <History className="w-4 h-4" />,
      action: () => setIsVersionHistoryOpen(true)
    },
    {
      id: 'cmd-recycle-bin',
      category: 'File',
      label: 'Open Project Recycle Bin / Trash',
      icon: <Trash2 className="w-4 h-4" />,
      action: () => setIsRecycleBinOpen(true)
    },
    {
      id: 'cmd-manage-projects',
      category: 'Workspace',
      label: 'Manage & Switch Projects',
      icon: <FolderCode className="w-4 h-4" />,
      action: () => setIsProjectModalOpen(true)
    },
    {
      id: 'cmd-format-doc',
      category: 'Editor',
      label: 'Format Active Document',
      shortcut: 'Shift + Alt + F',
      icon: <Sparkles className="w-4 h-4" />,
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
          onAddToast('info', 'Document formatted.');
        }
      }
    }
  ];

  // Draggable Split Pane Resizer
  const handleStartDragging = (clientX: number) => {
    setIsDraggingSplitter(true);

    const updatePosition = (currentX: number) => {
      if (!centralContainerRef.current) return;
      const rect = centralContainerRef.current.getBoundingClientRect();
      const offsetX = currentX - rect.left;
      const ratio = Math.min(85, Math.max(15, (offsetX / rect.width) * 100));

      centralContainerRef.current.style.gridTemplateColumns = `${ratio}% 6px 1fr`;
      setSplitRatio(ratio);
      if (editorRef.current) editorRef.current.layout();
    };

    const handleMouseMove = (moveEvent: MouseEvent) => updatePosition(moveEvent.clientX);
    const handleStopDragging = () => {
      setIsDraggingSplitter(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleStopDragging);
      if (editorRef.current) editorRef.current.layout();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleStopDragging);
  };

  const handleSelectLayoutPreset = (preset: 'code-only' | 'split-50' | 'preview-focus' | 'preview-only') => {
    setLayoutPreset(preset);
    let targetRatio = 50;
    if (preset === 'code-only') {
      setIsPreviewOpen(false);
      targetRatio = 100;
      setIsFullscreenPreview(false);
    } else if (preset === 'split-50') {
      setIsPreviewOpen(true);
      targetRatio = 50;
      setIsFullscreenPreview(false);
    } else if (preset === 'preview-focus') {
      setIsPreviewOpen(true);
      targetRatio = 30;
      setIsFullscreenPreview(false);
    } else if (preset === 'preview-only') {
      setIsPreviewOpen(true);
      targetRatio = 0;
      setIsFullscreenPreview(true);
    }

    setSplitRatio(targetRatio);
    if (centralContainerRef.current) {
      centralContainerRef.current.style.gridTemplateColumns = preset === 'code-only' ? '1fr' : `${targetRatio}% 6px 1fr`;
    }

    setTimeout(() => {
      if (editorRef.current) editorRef.current.layout();
    }, 100);
  };

  // Run Code in Sandbox
  const handleRunCode = () => {
    if (!activeFile) return;
    if (!isPreviewOpen || layoutPreset === 'code-only') {
      setIsPreviewOpen(true);
      setLayoutPreset('split-50');
      setSplitRatio(50);
    }

    const timeStr = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [
      ...prev,
      { id: `log-${Date.now()}`, type: 'system', message: `▶ Running ${activeFile.name}...`, timestamp: timeStr }
    ]);
    onAddToast('success', `${activeFile.name} executed cleanly.`);
  };

  const handleOpenExternalWindow = () => {
    const html = compilePreviewBundle();
    const win = window.open('', '_blank', 'width=1100,height=750,menubar=no,toolbar=no,status=no,resizable=yes');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      onAddToast('success', 'Opened preview in separate browser tab.');
    } else {
      onAddToast('error', 'Pop-up blocked. Please allow pop-ups for LivePad.');
    }
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary fallbackTitle="Code Mode Full Workspace">
      <AnimatePresence>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="fixed inset-0 z-50 bg-[#1e1e1e] text-[#cccccc] flex flex-col h-screen w-screen overflow-hidden font-sans select-none"
      >
        {/* Top Workspace Header Bar (VS Code Menu & Title Bar) */}
        <header className="h-8 bg-[#323233] border-b border-[#252526] px-2 flex items-center justify-between shrink-0 z-30 text-xs">
          {/* Left: Window controls & Menu Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#454545] text-[#cccccc] text-[11px] font-medium transition-colors cursor-pointer"
              title="Return to Document Mode"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="h-3 w-px bg-[#454545]" />

            <div className="hidden md:flex items-center gap-1 text-[11px] text-[#cccccc]">
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">File</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">Edit</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">Selection</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">View</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">Go</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">Run</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">Terminal</span>
              <span className="px-2 py-0.5 hover:bg-[#454545] rounded cursor-pointer">Help</span>
            </div>
          </div>

          {/* Middle: Active Project Title */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#252526] hover:bg-[#3c3c3c] text-white border border-[#454545] text-[11px] font-medium cursor-pointer"
              title="Switch or create projects"
            >
              <FolderCode className="w-3.5 h-3.5 text-[#007acc]" />
              <span className="font-mono max-w-[160px] truncate">{activeProject.name} - VS Code</span>
              <ChevronDown className="w-3 h-3 text-[#cccccc]" />
            </button>
          </div>

          {/* Right: Actions & Panel Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRunCode}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#0e639c] hover:bg-[#1177bb] text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>

            <button
              type="button"
              onClick={handleOpenExternalWindow}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#252526] hover:bg-[#3c3c3c] text-[#cccccc] border border-[#454545] text-[11px] transition-colors cursor-pointer"
              title="Open Preview in New Tab"
            >
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="h-3 w-px bg-[#454545] mx-1" />

            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="p-1 rounded hover:bg-[#454545] text-[#cccccc] transition-colors cursor-pointer"
              title="Search (Ctrl+Shift+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1 rounded hover:bg-[#454545] text-[#cccccc] transition-colors cursor-pointer"
              title="Command Palette (Ctrl+Shift+P)"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                leftSidebarOpen ? 'bg-[#04395e] text-white' : 'hover:bg-[#454545] text-[#cccccc]'
              }`}
              title="Toggle Sidebar (Ctrl+B)"
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isTerminalOpen ? 'bg-[#04395e] text-white' : 'hover:bg-[#454545] text-[#cccccc]'
              }`}
              title="Toggle Terminal (Ctrl+J)"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Main Body Grid (VS Code Layout Structure) */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden">
          {/* Activity Bar */}
          <ActivityBar
            activeTab={activityBarTab}
            onSelectTab={(tab) => {
              setActivityBarTab(tab);
              if (tab === 'trash') setIsRecycleBinOpen(true);
              if (tab === 'chat') setUnreadChatCount(0);
            }}
            isSidebarOpen={leftSidebarOpen}
            onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
            onOpenProjects={() => setIsProjectModalOpen(true)}
            unreadChatCount={unreadChatCount}
          />

          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {leftSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="bg-[#252526] border-r border-[#1e1e1e] flex flex-col shrink-0 overflow-hidden"
              >
                {activityBarTab === 'chat' ? (
                  <ChatPanel
                    isOpen={true}
                    onClose={() => setLeftSidebarOpen(false)}
                    roomId={roomCode}
                    activeUsers={activeUsers}
                    currentUid={userName}
                    userName={userName}
                    currentRole={userRole}
                    isFloating={false}
                    onInsertCodeToEditor={(snippet) => {
                      if (activeFile) {
                        handleEditorChange(activeFile.content + '\n' + snippet);
                      }
                    }}
                    onAddToast={onAddToast}
                  />
                ) : activityBarTab === 'voice' ? (
                  <VoicePanel
                    isOpen={true}
                    onClose={() => setLeftSidebarOpen(false)}
                    roomId={roomCode}
                    activeUsers={activeUsers}
                    currentUid={userName}
                    userName={userName}
                    currentRole={userRole}
                  />
                ) : activityBarTab === 'comments' ? (
                  <CommentsPanel
                    isOpen={true}
                    onClose={() => setLeftSidebarOpen(false)}
                    fileId={activeFileId || undefined}
                    filePath={activeFile?.path}
                    threads={commentThreads}
                    onAddThread={(newThread) => {
                      const created = {
                        ...newThread,
                        id: `comment-${Date.now()}`,
                        timestamp: Date.now(),
                        replies: []
                      };
                      setCommentThreads((prev) => [created, ...prev]);
                    }}
                    onAddReply={(threadId, text) => {
                      setCommentThreads((prev) =>
                        prev.map((t) => {
                          if (t.id === threadId) {
                            return {
                              ...t,
                              replies: [
                                ...t.replies,
                                {
                                  id: `reply-${Date.now()}`,
                                  authorUid: userName,
                                  authorName: userName,
                                  authorRole: userRole,
                                  text,
                                  timestamp: Date.now()
                                }
                              ]
                            };
                          }
                          return t;
                        })
                      );
                    }}
                    onToggleResolveThread={(threadId) => {
                      setCommentThreads((prev) =>
                        prev.map((t) =>
                          t.id === threadId
                            ? { ...t, status: t.status === 'open' ? 'resolved' : 'open' }
                            : t
                        )
                      );
                    }}
                    onDeleteThread={(threadId) => {
                      setCommentThreads((prev) => prev.filter((t) => t.id !== threadId));
                    }}
                    currentUid={userName}
                    userName={userName}
                    currentRole={userRole}
                  />
                ) : activityBarTab === 'run' ? (
                  <DebugPanel
                    debugStatus={debugStatus}
                    runConfigurations={runConfigurations}
                    activeConfigId={activeConfigId}
                    onSelectConfig={setActiveConfigId}
                    onStartDebug={handleStartDebug}
                    onPauseDebug={handlePauseDebug}
                    onResumeDebug={handleResumeDebug}
                    onStepOver={handleStepOver}
                    onStepInto={handleStepInto}
                    onStepOut={handleStepOut}
                    onRestartDebug={async () => {
                      await handleStopDebug();
                      await handleStartDebug();
                    }}
                    onStopDebug={handleStopDebug}
                    breakpoints={breakpoints}
                    onToggleBreakpoint={(id) => {
                      setBreakpoints((prev) =>
                        prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
                      );
                    }}
                    onRemoveBreakpoint={(id) => {
                      setBreakpoints((prev) => prev.filter((b) => b.id !== id));
                    }}
                    onAddBreakpointByLine={(filePath, lineNumber) => {
                      const f = files.find((file) => file.path === filePath);
                      const created: Breakpoint = {
                        id: `bp-${Date.now()}`,
                        fileId: f ? f.id : 'file-1',
                        filePath,
                        lineNumber,
                        enabled: true
                      };
                      setBreakpoints((prev) => [...prev, created]);
                    }}
                    variableScopes={variableScopes}
                    watchExpressions={watchExpressions}
                    onAddWatchExpression={(expr) => {
                      const created: WatchExpression = {
                        id: `watch-${Date.now()}`,
                        expression: expr,
                        value: 'evaluating...'
                      };
                      setWatchExpressions((prev) => [...prev, created]);
                      setTimeout(() => {
                        handleEvalDebugExpression(expr);
                      }, 200);
                    }}
                    onRemoveWatchExpression={(id) => {
                      setWatchExpressions((prev) => prev.filter((w) => w.id !== id));
                    }}
                    callStack={callStack}
                    activeStackFrameId={activeStackFrameId}
                    onSelectStackFrame={(frame) => setActiveStackFrameId(frame.id)}
                  />
                ) : activityBarTab === 'testing' ? (
                  <TestExplorerPanel
                    testSuites={testSuites}
                    selectedTestCaseId={selectedTestCaseId}
                    onSelectTestCase={(c) => setSelectedTestCaseId(c.id)}
                    onRunAllTests={handleRunAllTests}
                    onRunFailedTests={handleRunAllTests}
                    onRunSuite={handleRunAllTests}
                    onRunTestCase={handleRunAllTests}
                    isTesting={isTesting}
                    showCoverageOverlay={showCoverageOverlay}
                    onToggleCoverageOverlay={() => setShowCoverageOverlay((prev) => !prev)}
                    coverageReport={coverageReport}
                  />
                ) : activityBarTab === 'cloud' ? (
                  <CloudWorkspacePanel />
                ) : activityBarTab === 'github' ? (
                  <GitHubPanel />
                ) : activityBarTab === 'admin' ? (
                  <WorkspaceAdminPanel />
                ) : activityBarTab === 'knowledge' ? (
                  <WorkspaceKnowledgePanel />
                ) : activityBarTab === 'dashboard' ? (
                  <ProjectDashboardPanel />
                ) : activityBarTab === 'extensions' ? (
                  <ExtensionMarketplacePanel
                    onAddToast={onAddToast}
                  />
                ) : activityBarTab === 'outline' ? (
                  <OutlineView
                    activeFileContent={activeFile?.content}
                    activeFilePath={activeFile?.path}
                    onNavigateToSymbol={(line) => {
                      if (editorRef.current) {
                        editorRef.current.revealLineInCenter(line);
                        editorRef.current.setPosition({ lineNumber: line, column: 1 });
                        editorRef.current.focus();
                      }
                    }}
                  />
                ) : activityBarTab === 'tasks' ? (
                  <TaskRunnerPanel projectPath="." />
                ) : (
                  <FileExplorerTree
                    folders={folders}
                    files={files}
                    activeFileId={activeFileId}
                    selectedIds={selectedIds}
                    onSelectFile={handleSelectFile}
                    onSelectFolder={(fId, isMulti) => {
                      if (isMulti) setSelectedIds((prev) => [...prev, fId]);
                      else setSelectedIds([fId]);
                    }}
                    onToggleFolderExpand={(fId) =>
                      setFolders((prev) =>
                        prev.map((f) => (f.id === fId ? { ...f, isExpanded: !f.isExpanded } : f))
                      )
                    }
                    onContextMenu={handleContextMenuTrigger}
                    onMoveItem={handleMoveItems}
                    onCreateInlineFile={handleCreateInlineFile}
                    onCreateInlineFolder={handleCreateInlineFolder}
                    onRenameItem={handleRenameItem}
                    inlineCreatingInFolder={inlineCreatingInFolder}
                    setInlineCreatingInFolder={setInlineCreatingInFolder}
                    inlineRenamingItem={inlineRenamingItem}
                    setInlineRenamingItem={setInlineRenamingItem}
                    onUploadDropFiles={handleUploadDropFiles}
                    syncError={syncError}
                    onRetrySync={handleRetrySync}
                    onDismissSyncError={() => setSyncError(null)}
                    onOpenLocalFolder={handleOpenLocalFolder}
                    isPwaMounted={isPwaMounted}
                    pwaPath={pwaPath}
                  />
                )}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Editor & Bottom Panel Column */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
            {/* Main Editor Workstation */}
            <div className="flex-1 flex min-w-0 min-h-0 relative overflow-hidden">
              {/* Editor Workspace Canvas */}
              <div
                ref={centralContainerRef}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isPreviewOpen && !isFullscreenPreview ? `${splitRatio}% 6px 1fr` : '1fr'
                }}
                className="flex-1 min-w-0 h-full relative overflow-hidden bg-[#1e1e1e]"
              >
                {/* Editor Container */}
                <div className="flex flex-col h-full min-w-0 relative overflow-hidden">
                  <LiveSessionBar onOpenComments={() => {
                    setActivityBarTab('comments');
                    setLeftSidebarOpen(true);
                  }} />
                  {/* File Tabs Bar */}
                  <FileTabsBar
                    openFiles={openFiles}
                    activeFileId={activeFileId}
                    onSelectTab={handleSelectFile}
                    onCloseTab={handleCloseTab}
                    onCloseOthers={handleCloseOthers}
                    onTogglePinTab={handleTogglePinTab}
                    onReorderTabs={handleReorderTabs}
                    onRestoreClosedTab={handleRestoreClosedTab}
                    canRestoreTab={closedTabHistory.length > 0}
                    isSplitView={isSplitView}
                    onToggleSplitView={() => {
                      setIsSplitView((prev) => !prev);
                      if (!secondaryFileId && files.length > 1) {
                        const otherFile = files.find((f) => f.id !== activeFileId);
                        if (otherFile) setSecondaryFileId(otherFile.id);
                      }
                    }}
                    isAutoSaveEnabled={isAutoSaveEnabled}
                    onToggleAutoSave={() => setIsAutoSaveEnabled((prev) => !prev)}
                  />

                  {/* Breadcrumb Path Bar */}
                  <BreadcrumbsNav
                    projectName={activeProject.name}
                    activeFile={activeFile}
                    folders={folders}
                    onSelectFolder={(fId) => fId && setSelectedIds([fId])}
                    onSelectFile={handleSelectFile}
                  />

                  {/* Monaco Code Editor Area (Supports Single or Split Editor View) */}
                  <div className="flex-1 min-h-0 relative flex overflow-hidden">
                    {activeFile ? (
                      isSplitView ? (
                        <div className="w-full h-full flex divide-x divide-[#252526]">
                          {/* Main Editor Pane */}
                          <div className="flex-1 h-full min-w-0 relative">
                            <MonacoEditorWrapper
                              language={activeFile.language}
                              value={activeFile.content}
                              onChange={(val) => handleEditorChange(val || '', activeFile.id)}
                              showMinimap={showMinimap}
                              wordWrap={wordWrap}
                              allFiles={files}
                              onOpenFileById={handleSelectFile}
                              remoteCursors={remoteCursors}
                              onCursorPositionChange={onCursorPositionChange}
                              isReadOnly={isReadOnly}
                              breakpoints={breakpoints}
                              activeDebugLine={activeDebugLine}
                              coverageData={showCoverageOverlay ? coverageReport.files.find((f) => f.filePath === activeFile.path) : undefined}
                              onToggleBreakpointAtLine={handleToggleBreakpointAtLine}
                              targetPosition={editorTargetPosition}
                              onMount={(editor, monaco) => {
                                editorRef.current = editor;
                                monacoRef.current = monaco;
                              }}
                            />
                          </div>

                          {/* Secondary Split Editor Pane */}
                          <div className="flex-1 h-full min-w-0 flex flex-col bg-[#1e1e1e]">
                            <div className="h-7 bg-[#2d2d2d] border-b border-[#1e1e1e] flex items-center justify-between px-2 text-xs font-sans text-[#cccccc] shrink-0">
                              <select
                                value={secondaryFileId || activeFile.id}
                                onChange={(e) => setSecondaryFileId(e.target.value)}
                                className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-xs text-[#cccccc] focus:outline-none"
                              >
                                {files.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.language})
                                  </option>
                                ))}
                              </select>
                              <span className="text-[10px] text-[#858585] font-mono">Side-by-Side Split View</span>
                            </div>

                            <div className="flex-1 min-h-0 relative">
                              {(() => {
                                const secFile = files.find((f) => f.id === secondaryFileId) || activeFile;
                                return (
                                  <MonacoEditorWrapper
                                    language={secFile.language}
                                    value={secFile.content}
                                    onChange={(val) => handleEditorChange(val || '', secFile.id)}
                                    showMinimap={showMinimap}
                                    wordWrap={wordWrap}
                                    allFiles={files}
                                    onOpenFileById={handleSelectFile}
                                    remoteCursors={remoteCursors}
                                    onCursorPositionChange={onCursorPositionChange}
                                    isReadOnly={isReadOnly}
                                  />
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <MonacoEditorWrapper
                          language={activeFile.language}
                          value={activeFile.content}
                          onChange={(val) => handleEditorChange(val || '')}
                          showMinimap={showMinimap}
                          wordWrap={wordWrap}
                          allFiles={files}
                          onOpenFileById={handleSelectFile}
                          remoteCursors={remoteCursors}
                          onCursorPositionChange={onCursorPositionChange}
                          isReadOnly={isReadOnly}
                          breakpoints={breakpoints}
                          activeDebugLine={activeDebugLine}
                          coverageData={showCoverageOverlay ? coverageReport.files.find((f) => f.filePath === activeFile.path) : undefined}
                          onToggleBreakpointAtLine={handleToggleBreakpointAtLine}
                          targetPosition={editorTargetPosition}
                          onMount={(editor, monaco) => {
                            editorRef.current = editor;
                            monacoRef.current = monaco;
                          }}
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full text-[#858585] font-mono text-xs space-y-3">
                        <Code2 className="w-12 h-12 text-[#454545] animate-pulse" />
                        <p>No file open. Select or create a file from the Project Explorer.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Splitter Resizer Handle */}
                {isPreviewOpen && !isFullscreenPreview && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleStartDragging(e.clientX);
                    }}
                    className={`w-1.5 bg-[#252526] border-x border-[#1e1e1e] hover:bg-[#007acc] cursor-col-resize z-20 flex items-center justify-center transition-colors ${
                      isDraggingSplitter ? 'bg-[#007acc]' : ''
                    }`}
                  >
                    <GripVertical className="w-3 h-3 text-[#858585] opacity-60" />
                  </div>
                )}

                {/* Live Preview Panel */}
                {isPreviewOpen && !isFullscreenPreview && (
                  <CodePreviewPanel
                    activeFile={activeFile || DEFAULT_FILES[0]}
                    allFiles={files}
                    isAutoReload={isAutoReload}
                    onToggleAutoReload={() => setIsAutoReload(!isAutoReload)}
                    devicePreset={devicePreset}
                    onChangeDevicePreset={setDevicePreset}
                    zoomLevel={zoomLevel}
                    onChangeZoomLevel={setZoomLevel}
                    isFullscreen={isFullscreenPreview}
                    onToggleFullscreen={() => setIsFullscreenPreview(!isFullscreenPreview)}
                    consoleLogs={consoleLogs}
                    onClearConsoleLogs={() => setConsoleLogs([])}
                    activeBottomTab="preview"
                    onChangeBottomTab={() => {}}
                    onOpenExternalTab={handleOpenExternalWindow}
                  />
                )}
              </div>

              {/* Right Sidebar: AI Copilot Panel */}
              <AICopilotPanel
                isOpen={isAIPanelOpen}
                onClose={() => setIsAIPanelOpen(false)}
                activeFile={activeFile}
                allFiles={files}
                onApplyCodeToEditor={(newCode) => {
                  if (activeFile) handleEditorChange(newCode);
                }}
                onAddToast={onAddToast}
              />
            </div>

            {/* Bottom Panel: Interactive Terminal */}
            <InteractiveTerminal
              height={terminalHeight}
              isOpen={isTerminalOpen}
              onClose={() => setIsTerminalOpen(false)}
              onResizeStart={(e) => {
                const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                const startHeight = terminalHeight;
                const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
                  const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
                  const deltaY = startY - currentY;
                  setTerminalHeight(Math.max(100, Math.min(500, startHeight + deltaY)));
                };
                const handleMouseUp = () => {
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                  window.removeEventListener('touchmove', handleMouseMove);
                  window.removeEventListener('touchend', handleMouseUp);
                };
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
                window.addEventListener('touchmove', handleMouseMove);
                window.addEventListener('touchend', handleMouseUp);
              }}
              activeFile={activeFile}
              files={files}
              folders={folders}
              onSelectFile={handleSelectFile}
              onUpdateContent={handleEditorChange}
              isPwaMounted={isPwaMounted}
              pwaPath={pwaPath}
              wordCount={activeFile?.content ? activeFile.content.trim().split(/\s+/).length : 0}
              lineCount={activeFile?.content ? activeFile.content.split('\n').length : 0}
              debugConsoleLogs={debugConsoleLogs}
              onEvalDebugExpression={handleEvalDebugExpression}
              onClearDebugConsole={() => setDebugConsoleLogs([])}
              testSuites={testSuites}
              onRunAllTests={handleRunAllTests}
              onCreateFile={handleCreateInlineFile}
              onCreateFolder={handleCreateInlineFolder}
              onDeleteItems={handleDeleteItems}
              onRenameItem={handleRenameItem}
              problems={workspaceProblems}
              onSelectProblem={handleSelectProblem}
            />
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar
          activeFile={activeFile}
          activeUsersCount={activeUsers.length}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
          isAIPanelOpen={isAIPanelOpen}
          onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
          isSyncing={!!syncError}
        />

        {/* Global Modals & Context Menus */}
        <FileContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          onNewFile={(folderId) => setInlineCreatingInFolder({ folderId: folderId ?? null, type: 'file' })}
          onNewFolder={(folderId) => setInlineCreatingInFolder({ folderId: folderId ?? null, type: 'folder' })}
          onRename={(id, type) => {
            const item = type === 'file' ? files.find((f) => f.id === id) : folders.find((f) => f.id === id);
            if (item) setInlineRenamingItem({ id, type, currentName: item.name });
          }}
          onDuplicate={handleDuplicateItem}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          hasClipboardItems={!!clipboard && clipboard.ids.length > 0}
          onDelete={handleDeleteItems}
          onDownload={handleDownloadItem}
          onReveal={(id) => handleSelectFile(id)}
          onToggleExpand={(folderId) =>
            setFolders((prev) =>
              prev.map((f) => (f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f))
            )
          }
          onUploadFiles={(folderId) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e: any) => {
              if (e.target.files) handleUploadDropFiles(e.target.files, folderId ?? null);
            };
            input.click();
          }}
          onUploadFolder={(folderId) => {
            const input = document.createElement('input');
            input.type = 'file';
            (input as any).webkitdirectory = true;
            input.onchange = (e: any) => {
              if (e.target.files) handleUploadDropFiles(e.target.files, folderId ?? null);
            };
            input.click();
          }}
          onDownloadProjectZip={handleDownloadProjectZip}
          selectedIds={selectedIds}
        />

        <QuickOpenModal
          isOpen={isQuickOpenOpen}
          onClose={() => setIsQuickOpenOpen(false)}
          files={files}
          onSelectFile={handleSelectFile}
        />

        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          commands={commandOptions}
        />

        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          workspaceId={workspaceId}
          projectId={activeProjectId}
          file={activeFile}
          onRestoreVersion={(content, vNum) => {
            if (activeFile) {
              handleEditorChange(content);
              onAddToast('success', `Restored ${activeFile.name} to v${vNum}`);
            }
          }}
        />

        <RecycleBinModal
          isOpen={isRecycleBinOpen}
          onClose={() => setIsRecycleBinOpen(false)}
          trashItems={trash}
          onRestore={handleRestoreFromTrash}
          onDeletePermanent={handleDeleteTrashPermanent}
          onEmptyTrash={handleEmptyTrash}
        />

        <ProjectManagerModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(pId) => {
            setActiveProjectId(pId);
            onAddToast('info', `Switched project.`);
          }}
          onCreateProject={(name, template) => {
            const newProj: CodingProject = {
              id: `proj-${Date.now()}`,
              workspaceId,
              name,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              createdBy: userName || 'collaborator'
            };
            setProjects((prev) => [...prev, newProj]);
            saveProjectDoc(workspaceId, newProj);
            setActiveProjectId(newProj.id);
            onAddToast('success', `Created project ${name}`);
          }}
          onRenameProject={(pId, newName) => {
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id === pId) {
                  const updated = { ...p, name: newName, updatedAt: Date.now() };
                  saveProjectDoc(workspaceId, updated);
                  return updated;
                }
                return p;
              })
            );
            onAddToast('info', `Renamed project.`);
          }}
          onDuplicateProject={(pId) => {
            const source = projects.find((p) => p.id === pId);
            if (!source) return;
            const dup: CodingProject = {
              ...source,
              id: `proj-${Date.now()}`,
              name: `Copy of ${source.name}`,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            setProjects((prev) => [...prev, dup]);
            saveProjectDoc(workspaceId, dup);
            onAddToast('success', `Duplicated project.`);
          }}
          onDeleteProject={(pId) => {
            if (projects.length <= 1) {
              onAddToast('info', 'Cannot delete the only remaining project.');
              return;
            }
            const remaining = projects.filter((p) => p.id !== pId);
            setProjects(remaining);
            if (activeProjectId === pId) setActiveProjectId(remaining[0].id);
            onAddToast('info', 'Deleted project.');
          }}
        />

        <SearchFilesModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          files={files}
          onSelectFile={handleSelectFile}
          onUpdateFileContent={(fileId, newContent) => {
            const target = files.find((f) => f.id === fileId);
            if (target) {
              setFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, content: newContent, updatedAt: Date.now() } : f))
              );
              if (activeFileId === fileId) onUpdateContent(newContent);
            }
          }}
          onAddToast={onAddToast}
        />

        <ProfileSelectorModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />

        {/* Floating Real-Time Workspace Chat Panel */}
        <ChatPanel
          isOpen={isFloatingChatOpen}
          onClose={() => setIsFloatingChatOpen(false)}
          roomId={roomCode}
          activeUsers={activeUsers}
          currentUid={userName}
          userName={userName}
          currentRole={userRole}
          isFloating={true}
          onInsertCodeToEditor={(snippet) => {
            if (activeFile) {
              handleEditorChange(activeFile.content + '\n' + snippet);
            }
          }}
          onAddToast={onAddToast}
          onUnreadCountChange={(count) => setUnreadChatCount(count)}
        />

        {/* Floating Chat Trigger Launcher Button */}
        <FloatingChatTrigger
          isOpen={isFloatingChatOpen}
          onToggle={() => {
            setIsFloatingChatOpen(!isFloatingChatOpen);
            if (!isFloatingChatOpen) setUnreadChatCount(0);
          }}
          unreadCount={unreadChatCount}
          activeUsersCount={activeUsers.length || 1}
        />
      </motion.div>
    </AnimatePresence>
  </ErrorBoundary>
);
}
