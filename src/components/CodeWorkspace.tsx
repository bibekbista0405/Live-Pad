import React, { useState, useEffect, useRef, useCallback } from 'react';
import './code/code-workspace.css';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
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
  Command,
  Terminal,
  Eye,
  Settings,
  Users,
  Lock,
  Unlock,
  Radio,
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
import InteractiveTerminal from './code/InteractiveTerminal';
import SearchFilesModal from './code/SearchFilesModal';
import CodeRunPanel from './code/CodeRunPanel';
import TestExplorerPanel from './code/TestExplorerPanel';
import ExtensionMarketplacePanel from './code/ExtensionMarketplacePanel';
import { OutlineView } from './code/OutlineView';
import { TaskRunnerPanel } from './code/TaskRunnerPanel';
import { ProfileSelectorModal } from './code/ProfileSelectorModal';
import { CloudWorkspacePanel } from './code/CloudWorkspacePanel';
import { GitHubPanel } from './code/GitHubPanel';
import { WorkspaceAdminPanel } from './code/WorkspaceAdminPanel';
import { CodeLearningPanel } from './code/CodeLearningPanel';
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
import { ChatPanel } from './collaboration/ChatPanel';
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
import { buildVirtualProject, getWorkspaceDiagnostics } from '../utils/virtualProjectBuilder';
import { parseVitestJsonReport, parseV8Coverage } from '../services/vitestResults';
import {
  saveLocalProjectData,
  loadLocalProjectData,
  saveFileVersionHistoryLocal
} from '../services/indexedDBService';
import { ensureAuth, auth, db } from '../lib/firebase';
import { Platform } from '../platform';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
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
  userRole: 'teacher' | 'student' | 'admin' | 'owner' | any;
  isTeachingSession?: boolean;
  canControlCodeMode?: boolean;
  codeModeOpen?: boolean;
  onRequestCodeMode?: () => void;
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
  name: 'My First Website',
  description: 'A simple HTML, CSS and JavaScript learning project.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: '',
  activeFileId: 'file-1',
  openFileIds: ['file-1', 'file-2', 'file-3'],
  pinnedFileIds: ['file-1']
};

const DEFAULT_FOLDERS: ProjectFolder[] = [];


const DEFAULT_FILES: ProjectFile[] = [
  {
    id: 'file-1',
    projectId: 'proj-default-1',
    name: 'index.html',
    extension: 'html',
    language: 'html',
    path: 'index.html',
    parentId: null,
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My first web page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="card">
    <p class="eyebrow">My first website</p>
    <h1>Hello, LivePad!</h1>
    <p id="message">I am learning HTML, CSS and JavaScript.</p>
    <button id="changeMessage">Click me</button>
  </main>

  <script src="app.js"></script>
</body>
</html>`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: '',
    updatedBy: '',
    version: 1,
    isPinned: true
  },
  {
    id: 'file-2',
    projectId: 'proj-default-1',
    name: 'style.css',
    extension: 'css',
    language: 'css',
    path: 'style.css',
    parentId: null,
    content: `* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #f4f7fb;
  color: #172033;
}

.card {
  width: min(90vw, 520px);
  padding: 2.5rem;
  border-radius: 24px;
  background: white;
  box-shadow: 0 20px 60px rgba(23, 32, 51, 0.12);
  text-align: center;
}

.eyebrow {
  color: #0891b2;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: #0891b2;
  color: white;
  font-weight: 700;
  cursor: pointer;
}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: '',
    updatedBy: '',
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
    content: `const button = document.querySelector('#changeMessage');
const message = document.querySelector('#message');

button.addEventListener('click', () => {
  message.textContent = 'Great! You just changed a web page with JavaScript.';
});`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: '',
    updatedBy: '',
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
  isTeachingSession = false,
  canControlCodeMode = false,
  codeModeOpen = true,
  onRequestCodeMode,
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
  const [commentContext, setCommentContext] = useState<{ lineNumber?: number; selectedText?: string }>({});
  const commentReplyUnsubsRef = useRef<Map<string, () => void>>(new Map());
  const [resolvedUserUid, setResolvedUserUid] = useState(auth?.currentUser?.uid || '');
  const currentUserUid = resolvedUserUid;
  const currentUserName = userName?.trim() || auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || '';

  useEffect(() => {
    let cancelled = false;
    void ensureAuth().then((user) => {
      if (!cancelled && user?.uid) setResolvedUserUid(user.uid);
    });
    return () => { cancelled = true; };
  }, []);

  // Code comments are workspace collaboration data, not local component state.
  // Subscribe to the room and each thread's replies so every participant sees updates live.
  useEffect(() => {
    if (!roomCode || !db || !currentUserUid) {
      setCommentThreads([]);
      return;
    }

    const commentsRef = collection(db, 'rooms', roomCode, 'comments');
    const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeReplies = commentReplyUnsubsRef.current;

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const nextThreads = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
        replies: []
      }));
      setCommentThreads(nextThreads);

      const liveIds = new Set(nextThreads.map((thread) => thread.id));
      unsubscribeReplies.forEach((unsubscribe, threadId) => {
        if (!liveIds.has(threadId)) {
          unsubscribe();
          unsubscribeReplies.delete(threadId);
        }
      });

      nextThreads.forEach((thread) => {
        if (unsubscribeReplies.has(thread.id)) return;
        const repliesRef = collection(db, 'rooms', roomCode, 'comments', thread.id, 'replies');
        const repliesQuery = query(repliesRef, orderBy('timestamp', 'asc'), limit(50));
        const unsubscribe = onSnapshot(repliesQuery, (replySnapshot) => {
          const replies = replySnapshot.docs.map((replyDoc) => ({ id: replyDoc.id, ...replyDoc.data() }));
          setCommentThreads((current) => current.map((item) => item.id === thread.id ? { ...item, replies } : item));
        });
        unsubscribeReplies.set(thread.id, unsubscribe);
      });
    }, (error) => {
      console.warn('[LivePad Comments] Realtime listener unavailable', error);
    });

    return () => {
      unsubscribeComments();
      unsubscribeReplies.forEach((unsubscribe) => unsubscribe());
      unsubscribeReplies.clear();
    };
  }, [roomCode, currentUserUid]);

  // Floating Workspace Chat State
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
    if (configObj.type !== 'node') {
      onAddToast('info', `${configObj.type.toUpperCase()} debugging is not supported by the current Electron debugger. Select a Node.js configuration.`);
      return;
    }
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
      for (const breakpoint of breakpoints.filter((item) => item.enabled)) {
        try {
          const applied = await Platform.setDebuggerBreakpoint(result.sessionId, `${root || ''}/${breakpoint.filePath}`.replace(/\\/g, '/'), breakpoint.lineNumber);
          if (applied.verified) {
            setBreakpoints((prev) => prev.map((item) => item.id === breakpoint.id ? { ...item, id: applied.id } : item));
          }
        } catch (error) {
          appendDebugLog('error', `[Debugger] Breakpoint ${breakpoint.filePath}:${breakpoint.lineNumber} could not be restored: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
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

  const handleToggleBreakpointAtLine = async (lineNumber: number) => {
    const curPath = activeFile?.path || 'src/App.tsx';
    const curId = activeFileId || 'file-1';
    const existing = breakpoints.find((b) => b.filePath === curPath && b.lineNumber === lineNumber);
    if (existing) {
      if (debugSessionId && !existing.id.startsWith('bp-')) {
        const removed = await Platform.removeDebuggerBreakpoint(debugSessionId, existing.id);
        if (!removed) {
          onAddToast('error', `Could not remove the active debugger breakpoint on line ${lineNumber}.`);
          return;
        }
      }
      setBreakpoints((prev) => prev.filter((b) => b.id !== existing.id));
      onAddToast('info', `Removed breakpoint on line ${lineNumber}`);
      return;
    }

    const created: Breakpoint = {
      id: `bp-${Date.now()}`,
      fileId: curId,
      filePath: curPath,
      lineNumber,
      enabled: true
    };
    if (debugSessionId) {
      const recentProjects = await Platform.getRecentProjects();
      const root = recentProjects[0]?.path;
      if (!root) {
        onAddToast('error', 'Open a desktop project folder before adding a live breakpoint.');
        return;
      }
      try {
        const applied = await Platform.setDebuggerBreakpoint(debugSessionId, `${root}/${curPath}`.replace(/\\/g, '/'), lineNumber);
        if (!applied.verified) {
          onAddToast('error', `Debugger could not verify breakpoint on line ${lineNumber}.`);
          return;
        }
        created.id = applied.id;
      } catch (error) {
        onAddToast('error', error instanceof Error ? error.message : String(error));
        return;
      }
    }
    setBreakpoints((prev) => [...prev, created]);
    onAddToast('success', `Added breakpoint on line ${lineNumber}`);
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

  // Test Runner — backed by the real project's Vitest JSON + V8 coverage reports.
  const getDesktopProjectRoot = async (): Promise<string | null> => {
    const recentProjects = await Platform.getRecentProjects();
    return recentProjects[0]?.path || null;
  };

  const quoteCommandArg = (value: string): string => {
    if (Platform.os === 'windows') return `"${value.replace(/"/g, '\\"')}"`;
    return `'${value.replace(/'/g, `'"'"'`)}'`;
  };

  const runVitest = async (options: { testFile?: string; testName?: string; coverage?: boolean }): Promise<void> => {
    const root = await getDesktopProjectRoot();
    if (!root) throw new Error('Open a desktop project folder before running tests.');

    const outputDir = '.livepad';
    const resultPath = `${outputDir}/test-results.json`;
    const coveragePath = `${outputDir}/coverage/coverage-final.json`;
    const args = [
      'npm test -- --run --reporter=json',
      `--outputFile=${quoteCommandArg(resultPath)}`,
    ];
    if (options.coverage) {
      args.push('--coverage', '--coverage.reporter=json', `--coverage.reportsDirectory=${quoteCommandArg(`${outputDir}/coverage`)}`);
    }
    if (options.testFile) args.push(quoteCommandArg(options.testFile));
    if (options.testName) args.push('-t', quoteCommandArg(options.testName));

    const command = `node -e "require('fs').mkdirSync('${outputDir.replace(/'/g, "\\'")}', { recursive: true })" && ${args.join(' ')}`;
    const processId = `livepad-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    await new Promise<void>((resolve, reject) => {
      let output = '';
      let settled = false;
      let offOutput = () => {};
      let offExit = () => {};
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        offOutput();
        offExit();
        error ? reject(error) : resolve();
      };
      offOutput = Platform.onTerminalOutput((data) => {
        if (data.processId !== processId) return;
        output += data.data;
        if (output.length > 2_000_000) output = output.slice(-2_000_000);
        appendDebugLog(data.type === 'stderr' ? 'error' : 'info', data.data.trimEnd());
      });
      offExit = Platform.onTerminalExit(async (data) => {
        if (data.processId !== processId) return;
        try {
          const report = await Platform.readWorkspaceFile(`${root}/${resultPath}`.replace(/\\/g, '/'));
          if (!report?.content) throw new Error(`Vitest did not produce ${resultPath}. ${output.slice(-1000)}`);
          const suites = parseVitestJsonReport(report.content);
          setTestSuites(suites);
          const selected = suites.flatMap((suite) => suite.cases).find((test) => test.status === 'failed') || suites.flatMap((suite) => suite.cases)[0];
          setSelectedTestCaseId(selected?.id || null);

          if (options.coverage) {
            const coverage = await Platform.readWorkspaceFile(`${root}/${coveragePath}`.replace(/\\/g, '/'));
            if (coverage?.content) setCoverageReport(parseV8Coverage(coverage.content));
            else setCoverageReport({ overall: { statementsPct: 0, branchesPct: 0, functionsPct: 0, linesPct: 0 }, files: [] });
          }
          if (data.code !== 0) reject(new Error(`Vitest exited with code ${data.code}`));
          else resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        } finally {
          finish();
        }
      });
      Platform.executeCommand(command, root, processId).catch((error) => finish(error instanceof Error ? error : new Error(String(error))));
    });
  };

  const handleRunAllTests = async () => {
    if (!Platform.isElectron) {
      onAddToast('info', 'Running project tests requires the LivePad Desktop Edition.');
      return;
    }
    if (isTesting) return;
    setIsTesting(true);
    setTestSuites([]);
    setSelectedTestCaseId(null);
    setCoverageReport({ overall: { statementsPct: 0, branchesPct: 0, functionsPct: 0, linesPct: 0 }, files: [] });
    appendDebugLog('info', '[Tests] Running the real Vitest suite with JSON results and V8 coverage...');
    try {
      await runVitest({ coverage: true });
      setIsTesting(false);
      onAddToast('success', 'Tests and coverage completed.');
    } catch (error) {
      setIsTesting(false);
      onAddToast('error', error instanceof Error ? error.message : String(error));
    }
  };

  const handleRunTestCase = async (caseId: string) => {
    if (!Platform.isElectron || isTesting) return;
    const testCase = testSuites.flatMap((suite) => suite.cases).find((test) => test.id === caseId);
    if (!testCase) return;
    setIsTesting(true);
    try {
      await runVitest({ testFile: testCase.filePath, testName: testCase.name });
      onAddToast('success', `Test completed: ${testCase.name}`);
    } catch (error) {
      onAddToast('error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunFailedTests = async () => {
    if (!Platform.isElectron || isTesting) return;
    const failed = testSuites.flatMap((suite) => suite.cases.filter((test) => test.status === 'failed'));
    if (failed.length === 0) return;
    setIsTesting(true);
    try {
      const files = [...new Set(failed.map((test) => test.filePath).filter(Boolean))];
      const names = [...new Set(failed.map((test) => test.name))];
      const escapedNames = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const pattern = names.length === 1 ? names[0] : `(${escapedNames})`;
      await runVitest({ testFile: files.length === 1 ? files[0] : undefined, testName: pattern });
      onAddToast('success', 'Previously failed tests completed.');
    } catch (error) {
      onAddToast('error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunSuite = async (suiteId: string) => {
    if (!Platform.isElectron || isTesting) return;
    const suite = testSuites.find((item) => item.id === suiteId);
    if (!suite) return;
    setIsTesting(true);
    try {
      await runVitest({ testFile: suite.filePath });
      onAddToast('success', `Test suite completed: ${suite.name}`);
    } catch (error) {
      onAddToast('error', error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
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

  const initialActivityTab = getInitialLayoutSetting<ActivityBarTab>('activityBarTab', 'explorer');
  const allowedActivityTabs: ActivityBarTab[] = ['explorer', 'knowledge', 'run', 'testing', 'chat', 'comments', 'admin', 'trash'];
  const canManageFiles = !isTeachingSession || canControlCodeMode;
  const [activityBarTab, setActivityBarTab] = useState<ActivityBarTab>(
    allowedActivityTabs.includes(initialActivityTab) ? initialActivityTab : 'explorer'
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
  const autoSaveDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const projectSaveDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const parentContentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEditorContentRef = useRef<Map<string, string>>(new Map());

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
          isTerminalOpen,
          isPreviewOpen,
          rightSidebarOpen,
          leftSidebarOpen,
          activityBarTab
        })
      );
    } catch (e) {}
  }, [isTerminalOpen, isPreviewOpen, rightSidebarOpen, leftSidebarOpen, activityBarTab]);
  const [isAutoReload, setIsAutoReload] = useState<boolean>(true);
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
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
      message: 'LivePad web preview ready. Changes are reflected in the browser preview.',
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
      if (data.project?.id === activeProjectId) setFolders(data.folders);
      if (data.project?.id === activeProjectId) {
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
          initializeWorkspaceProjectsInFirestore(workspaceId).then((res) => {
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
      (fList) => setFolders(fList),
      (fldList) => setFiles(fldList),
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

  const focusLearningFile = useCallback((kind: 'html' | 'css' | 'js') => {
    const target = files.find((file) => {
      if (kind === 'html') return file.extension === 'html' || file.language === 'html';
      if (kind === 'css') return file.extension === 'css' || file.language === 'css';
      return file.extension === 'js' || file.extension === 'jsx' || file.language === 'javascript';
    });
    if (target) handleSelectFile(target.id);
  }, [files, handleSelectFile]);

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

  const handleEditorChange = useCallback((val: string, targetFileId?: string) => {
    const fileToUpdateId = targetFileId || activeFileId;
    if (!fileToUpdateId) return;

    const currentFile = files.find((f) => f.id === fileToUpdateId);
    if (!currentFile) return;
    const updatedAt = Date.now();
    pendingEditorContentRef.current.set(fileToUpdateId, val);

    // Keep Monaco local and synchronous. Cloud persistence and the large parent App
    // tree are intentionally debounced so fast typing never waits on React/Firestore.
    setFiles((prev) => prev.map((f) => (f.id === fileToUpdateId
      ? { ...f, content: val, updatedAt, isUnsaved: !isAutoSaveEnabled }
      : f)));

    if (fileToUpdateId === activeFileId) {
      if (parentContentDebounceRef.current) clearTimeout(parentContentDebounceRef.current);
      parentContentDebounceRef.current = setTimeout(() => {
        parentContentDebounceRef.current = null;
        onUpdateContent(val);
      }, 140);
    }

    const handle = fileHandlesMapRef.current.get(fileToUpdateId);
    if (handle) void saveFileToLocalDisk(handle, val);

    const existingProjectTimer = projectSaveDebounceRef.current.get(fileToUpdateId);
    if (existingProjectTimer) clearTimeout(existingProjectTimer);
    const saveTimer = setTimeout(() => {
      projectSaveDebounceRef.current.delete(fileToUpdateId);
      const latestContent = pendingEditorContentRef.current.get(fileToUpdateId);
      const latestFile = files.find((f) => f.id === fileToUpdateId);
      if (!latestFile || latestContent === undefined) return;
      void saveProjectFileDoc(workspaceId, activeProjectId, {
        ...latestFile, content: latestContent, updatedAt: Date.now(), isUnsaved: false
      });
      pendingEditorContentRef.current.delete(fileToUpdateId);
      setFiles((prev) => prev.map((f) => f.id === fileToUpdateId ? { ...f, isUnsaved: false } : f));
    }, isAutoSaveEnabled ? 450 : 900);
    projectSaveDebounceRef.current.set(fileToUpdateId, saveTimer);

    if (isAutoSaveEnabled) {
      const existingTimer = autoSaveDebounceRef.current.get(fileToUpdateId);
      if (existingTimer) clearTimeout(existingTimer);
      const newTimer = setTimeout(() => {
        setFiles((prev) => prev.map((f) => (f.id === fileToUpdateId ? { ...f, isUnsaved: false } : f)));
      }, 700);
      autoSaveDebounceRef.current.set(fileToUpdateId, newTimer);
    }
  }, [activeFileId, activeProjectId, files, isAutoSaveEnabled, onUpdateContent, workspaceId]);

  useEffect(() => {
    return () => {
      if (parentContentDebounceRef.current) clearTimeout(parentContentDebounceRef.current);
      autoSaveDebounceRef.current.forEach((timer) => clearTimeout(timer));
      projectSaveDebounceRef.current.forEach((timer) => clearTimeout(timer));
      autoSaveDebounceRef.current.clear();
      projectSaveDebounceRef.current.clear();
    };
  }, []);

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
    if (!canManageFiles) return;
    const parent = folders.find((f) => f.id === parentId);
    const path = parent ? `${parent.path}/${name}` : name;

    const newFolder: ProjectFolder = {
      id: `folder-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
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
    if (!canManageFiles) return;
    const parent = folders.find((f) => f.id === parentId);
    const path = parent ? `${parent.path}/${name}` : name;
    const ext = name.split('.').pop() || 'js';
    const lang = getLanguageFromExtension(name);
    const initialContent = getFileBoilerplate(name);

    const newFile: ProjectFile = {
      id: `file-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
      projectId: activeProjectId,
      name,
      extension: ext,
      language: lang,
      path,
      parentId,
      content: initialContent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUserUid,
      updatedBy: currentUserUid,
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
        id: `file-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
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
        id: `folder-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`,
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
            deletedBy: currentUserUid
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
            deletedBy: currentUserUid
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
      } else if (canManageFiles && ctrl && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setInlineCreatingInFolder({ folderId: null, type: 'folder' });
      } else if (canManageFiles && ctrl && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setInlineCreatingInFolder({ folderId: null, type: 'file' });
      } else if (canManageFiles && e.key === 'F2' && selectedIds.length === 1) {
        e.preventDefault();
        const id = selectedIds[0];
        const file = files.find((f) => f.id === id);
        if (file) {
          setInlineRenamingItem({ id, type: 'file', currentName: file.name });
        } else {
          const folder = folders.find((f) => f.id === id);
          if (folder) setInlineRenamingItem({ id, type: 'folder', currentName: folder.name });
        }
      } else if (canManageFiles && e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault();
        const fileIds = selectedIds.filter((id) => files.some((f) => f.id === id));
        if (fileIds.length > 0) handleDeleteItems(fileIds, 'file');
        const folderIds = selectedIds.filter((id) => folders.some((f) => f.id === id));
        if (folderIds.length > 0) handleDeleteItems(folderIds, 'folder');
      } else if (canManageFiles && ctrl && (e.key === 'D' || e.key === 'd') && selectedIds.length === 1) {
        e.preventDefault();
        const id = selectedIds[0];
        if (files.some((f) => f.id === id)) handleDuplicateItem(id, 'file');
        else if (folders.some((f) => f.id === id)) handleDuplicateItem(id, 'folder');
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [selectedIds, files, folders, canManageFiles]);

  // Command Palette Options
  const commandOptions: CommandOption[] = [
    {
      teacherOnly: true,
      id: 'cmd-new-file',
      category: 'File',
      label: 'New File',
      shortcut: 'Ctrl + N',
      icon: <Plus className="w-4 h-4" />,
      action: () => setInlineCreatingInFolder({ folderId: null, type: 'file' })
    },
    {
      teacherOnly: true,
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
      teacherOnly: true,
      id: 'cmd-switch-profile',
      category: 'Preferences',
      label: 'Switch Workspace Profile & Preferences',
      icon: <Settings className="w-4 h-4" />,
      action: () => setIsProfileModalOpen(true)
    },
    {
      teacherOnly: true,
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
      teacherOnly: true,
      id: 'cmd-recycle-bin',
      category: 'File',
      label: 'Open Project Recycle Bin / Trash',
      icon: <Trash2 className="w-4 h-4" />,
      action: () => setIsRecycleBinOpen(true)
    },
    {
      teacherOnly: true,
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
      icon: <Type className="w-4 h-4" />,
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
          onAddToast('info', 'Document formatted.');
        }
      }
    }
  ];

  const visibleCommandOptions = commandOptions.filter((command) => !command.teacherOnly || !isTeachingSession || canControlCodeMode);

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
    setPreviewRefreshToken((value) => value + 1);
    if (!isPreviewOpen || layoutPreset === 'code-only') {
      setIsPreviewOpen(true);
      setLayoutPreset('split-50');
      setSplitRatio(50);
    }

    const timeStr = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [
      ...prev,
      { id: `log-${Date.now()}`, type: 'system', message: `▶ Preview updated for ${activeFile.name}`, timestamp: timeStr }
    ]);
    onAddToast('success', `Preview updated for ${activeFile.name}.`);
  };

  const handleOpenExternalWindow = () => {
    const build = buildVirtualProject(files, activeFile, folders);
    if (build.errors.length > 0) {
      onAddToast('error', `${build.errors[0].fileName}: ${build.errors[0].message}`);
    }
    const html = build.html;
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

  const openCodeDiscussion = useCallback(() => {
    const editor = editorRef.current;
    let lineNumber: number | undefined;
    let selectedText: string | undefined;
    if (editor) {
      const position = editor.getPosition?.();
      const selection = editor.getSelection?.();
      lineNumber = selection?.startLineNumber || position?.lineNumber;
      if (selection && !selection.isEmpty?.()) {
        selectedText = editor.getModel?.()?.getValueInRange(selection)?.trim();
      }
    }
    setCommentContext({ lineNumber, selectedText });
    setActivityBarTab('comments');
    setLeftSidebarOpen(true);
  }, []);

  if (!isOpen) return null;

  return (
    <ErrorBoundary fallbackTitle="Code Mode Full Workspace">
      <AnimatePresence>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="livepad-code-shell fixed inset-0 z-50 flex flex-col h-screen w-screen overflow-hidden select-none" data-learning-role={isTeachingSession && !canControlCodeMode ? 'student' : 'teacher'}
      >
        {/* Top Workspace Header Bar (Code Studio title bar) */}
        <header className="livepad-code-titlebar h-12 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 text-xs">
          {/* Left: Window controls & Menu Bar */}
          <div className="flex items-center gap-2 min-w-0">
            {(!isTeachingSession || canControlCodeMode) && (
              <button
                type="button"
                onClick={onClose}
                className="livepad-code-ghost-btn flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                title="Return to Document Mode"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to workspace</span>
              </button>
            )}

            <div className="h-5 w-px bg-white/10" />

            <div className="hidden lg:flex items-center gap-2 text-[11px] text-white/45">
              <span className="font-semibold tracking-wide text-white/90">Code Studio</span>
              <span className="h-1 w-1 rounded-full bg-cyan-400/70" />
              <span>{isTeachingSession ? (canControlCodeMode ? 'Teacher-led session' : 'Learning session') : 'Practice workspace'}</span>
            </div>
          </div>

          {/* Middle: Active Project Title */}
          <div className="flex items-center gap-2">
            {(!isTeachingSession || canControlCodeMode) ? (
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(true)}
                className="livepad-code-project-switch flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium min-w-0 cursor-pointer"
                title="Switch or create projects"
              >
                <img src="/brand/livepad-icon-192.png" alt="" className="w-5 h-5 rounded-md shrink-0" />
                <span className="hidden sm:inline text-white/50">Project</span>
                <span className="font-medium max-w-[180px] truncate text-white">{activeProject.name}</span>
                <ChevronDown className="w-3 h-3 text-[#9aa8ba]" />
              </button>
            ) : (
              <div className="livepad-code-project-readonly" aria-label={`Teacher managed project: ${activeProject.name}`}>
                <img src="/brand/livepad-icon-192.png" alt="" className="w-5 h-5 rounded-md shrink-0" />
                <span className="text-[10px] uppercase tracking-[.08em] text-white/35">Class project</span>
                <span className="max-w-[180px] truncate text-xs font-semibold text-white/80">{activeProject.name}</span>
              </div>
            )}
          </div>

          {/* Session context: keep the learning model visible without adding another control surface. */}
          {isTeachingSession && (
            <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                canControlCodeMode
                  ? 'border-indigo-400/20 bg-indigo-400/10 text-indigo-200'
                  : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${canControlCodeMode ? 'bg-indigo-300' : 'bg-cyan-300'}`} />
                {canControlCodeMode ? 'Teacher' : 'Student'} · {activeUsers.length} learning
              </span>
            </div>
          )}

          {/* Right: Actions & Panel Controls */}
          <div className="flex items-center gap-1">
            {isTeachingSession && canControlCodeMode && onRequestCodeMode && (
              <button
                type="button"
                onClick={onRequestCodeMode}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  codeModeOpen
                    ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
                    : 'border-white/10 bg-white/[0.03] text-white/60'
                }`}
                title={codeModeOpen ? 'Close Code Studio for students' : 'Open Code Studio for students'}
              >
                <Radio className={`w-3 h-3 ${codeModeOpen ? 'text-cyan-300' : 'text-white/40'}`} />
                {codeModeOpen ? 'Classroom live' : 'Open for class'}
              </button>
            )}

            <button
              type="button"
              onClick={handleRunCode}
              className="livepad-code-run-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run preview</span>
            </button>

            <button
              type="button"
              onClick={handleOpenExternalWindow}
              className="livepad-code-icon-btn flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              title="Open Preview in New Tab"
            >
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="h-3 w-px bg-[#454545] mx-1" />

            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="livepad-code-icon-btn p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Search (Ctrl+Shift+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="livepad-code-icon-btn p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Command Palette (Ctrl+Shift+P)"
            >
              <Command className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className={`livepad-code-icon-btn p-1.5 rounded-lg transition-colors cursor-pointer ${
                leftSidebarOpen ? 'is-active' : ''
              }`} 
              title="Toggle Sidebar (Ctrl+B)"
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            {(!isTeachingSession || canControlCodeMode) && (
              <button
                type="button"
                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                className={`livepad-code-icon-btn p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isTerminalOpen ? 'is-active' : ''
                }`}
                title="Toggle Terminal (Ctrl+J)"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Body Grid (LivePad Code Studio layout) */}
        <div className="livepad-code-body flex-1 flex min-h-0 relative overflow-hidden">
          {/* Activity Bar */}
          <ActivityBar
            activeTab={activityBarTab}
            onSelectTab={(tab) => {
              setActivityBarTab(tab);
              if (tab === 'trash' && (!isTeachingSession || canControlCodeMode)) setIsRecycleBinOpen(true);
              if (tab === 'chat') setUnreadChatCount(0);
            }}
            isSidebarOpen={leftSidebarOpen}
            onToggleSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
            onOpenProjects={(!isTeachingSession || canControlCodeMode) ? () => setIsProjectModalOpen(true) : undefined}
            showManagementControls={!isTeachingSession || canControlCodeMode}
            unreadChatCount={unreadChatCount}
            learningRole={isTeachingSession ? (canControlCodeMode ? 'teacher' : 'student') : 'peer'}
          />

          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {leftSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="livepad-code-sidebar border-r flex flex-col shrink-0 overflow-hidden"
              >
                <div className="livepad-code-sidebar-header h-10 px-3 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {activityBarTab === 'explorer' ? 'Explorer' : activityBarTab.replace(/-/g, ' ')}
                  </span>
                  <span className="text-[10px] text-white/25">{isTeachingSession ? 'Learning' : 'Code'}</span>
                </div>
                {activityBarTab === 'chat' ? (
                  <ChatPanel
                    isOpen={true}
                    onClose={() => setLeftSidebarOpen(false)}
                    roomId={roomCode}
                    activeUsers={activeUsers}
                    currentUid={currentUserUid}
                    userName={userName}
                    currentRole={userRole}
                    isFloating={false}
                    onUnreadCountChange={setUnreadChatCount}
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
                    currentUid={currentUserUid}
                    userName={userName}
                    currentRole={userRole}
                  />
                ) : activityBarTab === 'comments' ? (
                  <CommentsPanel
                    isOpen={true}
                    onClose={() => setLeftSidebarOpen(false)}
                    fileId={activeFileId || undefined}
                    filePath={activeFile?.path}
                    activeLineNumber={commentContext.lineNumber}
                    selectedText={commentContext.selectedText}
                    threads={commentThreads}
                    onAddThread={async (newThread) => {
                      if (!roomCode || !db || !currentUserUid || !currentUserName) {
                        onAddToast('error', 'Set your real profile name before adding a comment.');
                        return;
                      }
                      const threadId = `comment-${currentUserUid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                      const thread = {
                        ...newThread,
                        authorUid: currentUserUid,
                        authorName: currentUserName,
                        authorRole: userRole,
                        timestamp: Date.now(),
                        status: 'open',
                        replies: []
                      };
                      setCommentThreads((prev) => [{ id: threadId, ...thread }, ...prev]);
                      try {
                        await setDoc(doc(db, 'rooms', roomCode, 'comments', threadId), thread);
                      } catch (error) {
                        setCommentThreads((prev) => prev.filter((item) => item.id !== threadId));
                        console.warn('[LivePad Comments] Failed to create thread', error);
                        onAddToast('error', 'Comment could not be posted. Check your connection and permissions.');
                      }
                    }}
                    onAddReply={async (threadId, text) => {
                      if (!roomCode || !db || !currentUserUid || !currentUserName) return;
                      const replyId = `reply-${currentUserUid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                      const reply = {
                        authorUid: currentUserUid,
                        authorName: currentUserName,
                        authorRole: userRole,
                        text,
                        timestamp: Date.now()
                      };
                      setCommentThreads((prev) => prev.map((item) => item.id === threadId
                        ? { ...item, replies: [...(item.replies || []), { id: replyId, ...reply }] }
                        : item));
                      try {
                        await setDoc(doc(db, 'rooms', roomCode, 'comments', threadId, 'replies', replyId), reply);
                      } catch (error) {
                        setCommentThreads((prev) => prev.map((item) => item.id === threadId
                          ? { ...item, replies: (item.replies || []).filter((replyItem: any) => replyItem.id !== replyId) }
                          : item));
                        console.warn('[LivePad Comments] Failed to create reply', error);
                        onAddToast('error', 'Reply could not be posted.');
                      }
                    }}
                    onToggleResolveThread={async (threadId) => {
                      if (!roomCode || !db) return;
                      const thread = commentThreads.find((item) => item.id === threadId);
                      if (!thread) return;
                      try {
                        await updateDoc(doc(db, 'rooms', roomCode, 'comments', threadId), {
                          status: thread.status === 'open' ? 'resolved' : 'open'
                        });
                      } catch (error) {
                        console.warn('[LivePad Comments] Failed to update thread', error);
                        onAddToast('error', 'Comment status could not be updated.');
                      }
                    }}
                    onDeleteThread={async (threadId) => {
                      if (!roomCode || !db) return;
                      try {
                        await deleteDoc(doc(db, 'rooms', roomCode, 'comments', threadId));
                      } catch (error) {
                        console.warn('[LivePad Comments] Failed to delete thread', error);
                        onAddToast('error', 'Comment could not be deleted.');
                      }
                    }}
                    currentUid={currentUserUid}
                    userName={currentUserName}
                    currentRole={userRole}
                  />
                ) : activityBarTab === 'run' ? (
                  <CodeRunPanel
                    activeFile={activeFile}
                    isPreviewOpen={isPreviewOpen}
                    isTeachingSession={isTeachingSession}
                    onRun={handleRunCode}
                    onOpenPreview={() => {
                      setIsPreviewOpen(true);
                      setLayoutPreset('split-50');
                      setSplitRatio(50);
                    }}
                  />
                ) : activityBarTab === 'testing' ? (
                  <TestExplorerPanel
                    testSuites={testSuites}
                    selectedTestCaseId={selectedTestCaseId}
                    onSelectTestCase={(c) => setSelectedTestCaseId(c.id)}
                    onRunAllTests={handleRunAllTests}
                    onRunFailedTests={handleRunFailedTests}
                    onRunSuite={handleRunSuite}
                    onRunTestCase={handleRunTestCase}
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
                  <CodeLearningPanel
                    files={files}
                    activeFile={activeFile}
                    onSelectFile={handleSelectFile}
                    isTeachingSession={isTeachingSession}
                    isTeacher={isTeachingSession && canControlCodeMode}
                  />
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
                    onContextMenu={canManageFiles ? handleContextMenuTrigger : ((e) => e.preventDefault())}
                    onMoveItem={canManageFiles ? handleMoveItems : (() => {})}
                    onCreateInlineFile={handleCreateInlineFile}
                    onCreateInlineFolder={handleCreateInlineFolder}
                    onRenameItem={canManageFiles ? handleRenameItem : (() => {})}
                    inlineCreatingInFolder={inlineCreatingInFolder}
                    setInlineCreatingInFolder={setInlineCreatingInFolder}
                    inlineRenamingItem={inlineRenamingItem}
                    setInlineRenamingItem={setInlineRenamingItem}
                    onUploadDropFiles={handleUploadDropFiles}
                    syncError={syncError}
                    onRetrySync={handleRetrySync}
                    onDismissSyncError={() => setSyncError(null)}
                    onOpenLocalFolder={canManageFiles ? handleOpenLocalFolder : undefined}
                    isPwaMounted={isPwaMounted}
                    pwaPath={pwaPath}
                    canManageFiles={canManageFiles}
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
                className="livepad-code-canvas flex-1 min-w-0 h-full relative overflow-hidden"
              >
                {/* Editor Container */}
                <div className="flex flex-col h-full min-w-0 relative overflow-hidden">
                  <LiveSessionBar
                    activeUsers={activeUsers}
                    isTeacher={isTeachingSession && canControlCodeMode}
                    onOpenComments={openCodeDiscussion} />
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

                  {/* Beginner-first learning strip. Advanced tools remain available in their panels,
                      but the editor itself always tells a new learner what to do next. */}
                  <div className="livepad-learning-strip shrink-0 min-h-11 px-3 sm:px-4 flex items-center justify-between gap-3 border-b text-[10px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="livepad-learning-step shrink-0">{isTeachingSession && canControlCodeMode ? 'TEACH' : 'LEARN'}</span>
                      <span className="text-white/55 truncate">
                        {isTeachingSession
                          ? (canControlCodeMode ? 'Explain the idea, then run it with the class.' : 'Follow the lesson, change the code, then run it.')
                          : 'Build the foundation: HTML → CSS → JavaScript.'}
                      </span>
                    </div>
                    <div className="livepad-language-path shrink-0" role="group" aria-label="Web learning path">
                      {([['html', 'HTML'], ['css', 'CSS'], ['js', 'JS']] as const).map(([kind, label], index) => (
                        <React.Fragment key={kind}>
                          {index > 0 && <span className="text-white/15">→</span>}
                          <button
                            type="button"
                            onClick={() => focusLearningFile(kind)}
                            className={`livepad-language-chip ${((kind === 'html' && (activeFile?.extension === 'html' || activeFile?.language === 'html')) || (kind === 'css' && (activeFile?.extension === 'css' || activeFile?.language === 'css')) || (kind === 'js' && (activeFile?.extension === 'js' || activeFile?.extension === 'jsx' || activeFile?.language === 'javascript'))) ? 'is-active' : ''}`}
                          >
                            {label}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Monaco Code Editor Area (Supports Single or Split Editor View) */}
                  <div className="flex-1 min-h-0 relative flex overflow-hidden">
                    {activeFile ? (
                      isSplitView ? (
                        <div className="w-full h-full flex divide-x divide-white/10">
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
                            <div className="livepad-code-splitbar h-8 border-b flex items-center justify-between px-2 text-xs shrink-0">
                              <select
                                value={secondaryFileId || activeFile.id}
                                onChange={(e) => setSecondaryFileId(e.target.value)}
                                className="livepad-code-select rounded-md px-2 py-1 text-xs focus:outline-none"
                              >
                                {files.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.language})
                                  </option>
                                ))}
                              </select>
                              <span className="text-[10px] text-white/35 font-medium">Split editor</span>
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
                      <div className="livepad-empty-editor flex flex-col items-center justify-center h-full w-full text-xs space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"><Code2 className="w-6 h-6 opacity-40" /></div>
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
                    className={`livepad-code-splitter w-1.5 cursor-col-resize z-20 flex items-center justify-center transition-colors ${
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
                    refreshToken={previewRefreshToken}
                  />
                )}
              </div>

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
          isSyncing={!!syncError}
          showTerminal={canManageFiles}
        />

        {/* Global Modals & Context Menus */}
        {canManageFiles && <FileContextMenu
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
          commands={visibleCommandOptions}
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
          isOpen={isRecycleBinOpen && (!isTeachingSession || canControlCodeMode)}
          onClose={() => setIsRecycleBinOpen(false)}
          trashItems={trash}
          onRestore={handleRestoreFromTrash}
          onDeletePermanent={handleDeleteTrashPermanent}
          onEmptyTrash={handleEmptyTrash}
        />

        <ProjectManagerModal
          isOpen={isProjectModalOpen && (!isTeachingSession || canControlCodeMode)}
          onClose={() => setIsProjectModalOpen(false)}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(pId) => {
            setActiveProjectId(pId);
            onAddToast('info', `Switched project.`);
          }}
          onCreateProject={(name, template) => {
            const projectId = `proj-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
            const now = Date.now();
            const newProj: CodingProject = {
              id: projectId,
              workspaceId,
              name,
              description: 'HTML, CSS and JavaScript learning project.',
              createdAt: now,
              updatedAt: now,
              createdBy: currentUserUid,
              activeFileId: `${projectId}-html`,
              openFileIds: [`${projectId}-html`, `${projectId}-css`, `${projectId}-js`],
              pinnedFileIds: [`${projectId}-html`]
            };
            const starterFiles: ProjectFile[] = [
              { ...DEFAULT_FILES[0], id: `${projectId}-html`, projectId, createdAt: now, updatedAt: now, createdBy: currentUserUid, updatedBy: currentUserUid, isPinned: true },
              { ...DEFAULT_FILES[1], id: `${projectId}-css`, projectId, createdAt: now, updatedAt: now, createdBy: currentUserUid, updatedBy: currentUserUid, isPinned: false },
              { ...DEFAULT_FILES[2], id: `${projectId}-js`, projectId, createdAt: now, updatedAt: now, createdBy: currentUserUid, updatedBy: currentUserUid, isPinned: false }
            ];
            setProjects((prev) => [...prev, newProj]);
            setActiveProjectId(projectId);
            setFiles(starterFiles);
            setFolders([]);
            setTrash([]);
            setActiveFileId(`${projectId}-html`);
            setOpenFileIds(starterFiles.map((file) => file.id));
            setSelectedIds([`${projectId}-html`]);
            void Promise.all([
              saveProjectDoc(workspaceId, newProj),
              ...starterFiles.map((file) => saveProjectFileDoc(workspaceId, projectId, file))
            ]).then(() => {
              onAddToast('success', `Created ${name} with HTML, CSS and JavaScript.`);
            }).catch(() => {
              onAddToast('error', 'Project was created locally, but cloud sync failed.');
            });
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
        />}

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
          isOpen={isProfileModalOpen && (!isTeachingSession || canControlCodeMode)}
          onClose={() => setIsProfileModalOpen(false)}
        />

      </motion.div>
    </AnimatePresence>
  </ErrorBoundary>
);
}
