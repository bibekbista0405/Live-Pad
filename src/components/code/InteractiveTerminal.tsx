import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Terminal as TerminalIcon,
  Activity,
  Code2,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  Info,
  Copy,
  Plus,
  Columns,
  Search,
  ChevronDown,
  Maximize2,
  Minimize2,
  HardDrive,
  Clipboard,
  Edit2,
  Check,
  ChevronRight,
  Monitor,
  Bug,
  FlaskConical,
  Play,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { ProjectFile, ProjectFolder, ProblemDiagnostic } from '../../types/code';
import { TestSuite, TestCase } from '../../types/debug';
import { renderAnsiText } from '../../utils/ansi';

export type ShellType = 'bash' | 'powershell' | 'cmd' | 'git-bash' | 'wsl';

export interface DebugConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'eval' | 'result';
  text: string;
  time: string;
}

interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  text: string;
  time: string;
}

interface ActivityLog {
  id: string;
  time: string;
  type: 'info' | 'sync' | 'success' | 'warning' | 'error';
  msg: string;
}

interface TerminalSession {
  id: string;
  name: string;
  shellType: ShellType;
  currentDir: string;
  logs: TerminalLog[];
  history: string[];
  historyIndex: number;
  isSplit: boolean;
  splitLogs: TerminalLog[];
  splitHistory: string[];
  splitHistoryIndex: number;
}

interface InteractiveTerminalProps {
  height: number;
  isOpen: boolean;
  onClose: () => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void;
  activeFile: ProjectFile | null;
  files: ProjectFile[];
  folders: ProjectFolder[];
  onSelectFile?: (fileId: string) => void;
  onUpdateContent?: (newContent: string) => void;
  isPwaMounted?: boolean;
  pwaPath?: string;
  wordCount?: number;
  lineCount?: number;
  debugConsoleLogs?: DebugConsoleLog[];
  onEvalDebugExpression?: (expr: string) => void;
  onClearDebugConsole?: () => void;
  testSuites?: TestSuite[];
  onRunAllTests?: () => void;
  onCreateFile?: (parentId: string | null, name: string) => void;
  onCreateFolder?: (parentId: string | null, name: string) => void;
  onDeleteItems?: (ids: string[], type: 'file' | 'folder') => void;
  onRenameItem?: (id: string, type: 'file' | 'folder', newName: string) => void;
  problems?: ProblemDiagnostic[];
  onSelectProblem?: (filePath: string, line: number, col: number, fileId?: string) => void;
}

const SHELL_CONFIGS: Record<
  ShellType,
  { label: string; icon: string; prompt: (dir: string) => string; headerColor: string }
> = {
  bash: {
    label: 'bash (Zsh)',
    icon: '🐚',
    prompt: (dir) => `livepad@ide:${dir}$ `,
    headerColor: 'text-cyan-400'
  },
  powershell: {
    label: 'PowerShell',
    icon: '⚡',
    prompt: (dir) => `PS C:${dir.replace(/\//g, '\\')}> `,
    headerColor: 'text-blue-400'
  },
  cmd: {
    label: 'Command Prompt (CMD)',
    icon: '💻',
    prompt: (dir) => `C:${dir.replace(/\//g, '\\')}> `,
    headerColor: 'text-amber-400'
  },
  'git-bash': {
    label: 'Git Bash',
    icon: '📦',
    prompt: (dir) => `user@pc MINGW64 ${dir} (main)$ `,
    headerColor: 'text-emerald-400'
  },
  wsl: {
    label: 'WSL (Ubuntu)',
    icon: '🐧',
    prompt: (dir) => `dev@wsl-ubuntu:${dir}$ `,
    headerColor: 'text-purple-400'
  }
};

export function InteractiveTerminal({
  height,
  isOpen,
  onClose,
  onResizeStart,
  activeFile,
  files,
  folders,
  onSelectFile,
  onUpdateContent,
  isPwaMounted = false,
  pwaPath,
  wordCount = 0,
  lineCount = 0,
  debugConsoleLogs = [],
  onEvalDebugExpression,
  onClearDebugConsole,
  testSuites = [],
  onRunAllTests,
  onCreateFile,
  onCreateFolder,
  onDeleteItems,
  onRenameItem,
  problems = [],
  onSelectProblem
}: InteractiveTerminalProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'problems' | 'debugConsole' | 'testResults' | 'activity' | 'scratchpad' | 'status'>('terminal');
  const [problemFilter, setProblemFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [problemSearch, setProblemSearch] = useState('');
  const [debugEvalInput, setDebugEvalInput] = useState('');

  // Multi-terminal sessions state
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: 'term-1',
      name: '1: bash',
      shellType: 'bash',
      currentDir: '~/project',
      history: [],
      historyIndex: -1,
      logs: [
        {
          id: 'welcome-1',
          type: 'info',
          text: '\x1b[1;36mLivePad Professional Integrated Terminal v4.5\x1b[0m',
          time: new Date().toLocaleTimeString()
        },
        {
          id: 'welcome-2',
          type: 'success',
          text: '\x1b[32m✔ Shell Session Initialized.\x1b[0m Type \x1b[1;33m"help"\x1b[0m for available commands, or switch shell types (PowerShell, CMD, Git Bash, WSL).',
          time: new Date().toLocaleTimeString()
        }
      ],
      isSplit: false,
      splitLogs: [
        {
          id: 'split-welcome',
          type: 'info',
          text: '\x1b[34m[Split Terminal Pane Active]\x1b[0m',
          time: new Date().toLocaleTimeString()
        }
      ],
      splitHistory: [],
      splitHistoryIndex: -1
    }
  ]);

  const [activeSessionId, setActiveSessionId] = useState<string>('term-1');
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Primary & Split Pane Inputs
  const [inputVal, setInputVal] = useState('');
  const [splitInputVal, setSplitInputVal] = useState('');

  // Search in Buffer state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown for Shell Selector
  const [isShellDropdownOpen, setIsShellDropdownOpen] = useState(false);

  // Tab renaming state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');

  // Split view resizer width percentage
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  // Toast feedback
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Bottom scroll refs
  const primaryBottomRef = useRef<HTMLDivElement>(null);
  const splitBottomRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when logs update
  useEffect(() => {
    if (activeTab === 'terminal') {
      primaryBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      splitBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.logs, activeSession?.splitLogs, activeTab]);

  // Focus search input when search opened
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Helper to add new terminal tab
  const handleAddTerminal = (shellType: ShellType = 'bash') => {
    const newId = `term-${Date.now()}`;
    const shellConf = SHELL_CONFIGS[shellType];
    const count = sessions.filter((s) => s.shellType === shellType).length + 1;
    const newSession: TerminalSession = {
      id: newId,
      name: `${sessions.length + 1}: ${shellType}${count > 1 ? ` (${count})` : ''}`,
      shellType,
      currentDir: '~/project',
      history: [],
      historyIndex: -1,
      logs: [
        {
          id: `welcome-${newId}`,
          type: 'info',
          text: `\x1b[1;34m[Started ${shellConf.label} Session]\x1b[0m Environment ready at ~/project`,
          time: new Date().toLocaleTimeString()
        }
      ],
      isSplit: false,
      splitLogs: [],
      splitHistory: [],
      splitHistoryIndex: -1
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
    setIsShellDropdownOpen(false);
  };

  // Helper to close terminal tab
  const handleCloseTerminal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sessions.length === 1) return; // Keep at least one
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[remaining.length - 1].id);
    }
  };

  // Toggle split mode for active session
  const handleToggleSplit = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const nextIsSplit = !s.isSplit;
          const splitLogs =
            nextIsSplit && s.splitLogs.length === 0
              ? [
                  {
                    id: `split-init-${Date.now()}`,
                    type: 'info' as const,
                    text: `\x1b[35m[Side-by-Side Split Terminal (${s.shellType})]\x1b[0m`,
                    time: new Date().toLocaleTimeString()
                  }
                ]
              : s.splitLogs;
          return { ...s, isSplit: nextIsSplit, splitLogs };
        }
        return s;
      })
    );
  };

  // Handle Command Execution
  const executeCommand = (cmdStr: string, isSplitPane = false) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    const now = new Date().toLocaleTimeString();
    const shellConf = SHELL_CONFIGS[activeSession.shellType];
    const promptText = shellConf.prompt(activeSession.currentDir);

    const inputLog: TerminalLog = {
      id: `in-${Date.now()}-${Math.random()}`,
      type: 'input',
      text: `${promptText}${raw}`,
      time: now
    };

    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    const outputLogs: TerminalLog[] = [];

    if (cmd === 'clear' || cmd === 'cls') {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return isSplitPane
              ? { ...s, splitLogs: [], splitHistory: [raw, ...s.splitHistory], splitHistoryIndex: -1 }
              : { ...s, logs: [], history: [raw, ...s.history], historyIndex: -1 };
          }
          return s;
        })
      );
      if (isSplitPane) setSplitInputVal('');
      else setInputVal('');
      return;
    }

    if (cmd === 'help') {
      outputLogs.push({
        id: `out-${Date.now()}`,
        type: 'info',
        text: `\x1b[1;36mVS Code Interactive Terminal Commands:\x1b[0m
  \x1b[33m• help\x1b[0m                Show command palette guide
  \x1b[33m• ls / dir\x1b[0m            List files & directories in current path
  \x1b[33m• pwd\x1b[0m                 Print current working directory path
  \x1b[33m• cd <dir>\x1b[0m            Change directory (e.g. cd src)
  \x1b[33m• cat <filename>\x1b[0m      View contents of file
  \x1b[33m• mkdir <dir>\x1b[0m         Create new folder in workspace
  \x1b[33m• touch <file>\x1b[0m        Create new file in workspace
  \x1b[33m• run / node <file>\x1b[0m   Execute JavaScript/TypeScript code
  \x1b[33m• python <file>\x1b[0m       Execute Python script
  \x1b[33m• git status\x1b[0m          Check workspace modified files
  \x1b[33m• git log\x1b[0m             View commit log history
  \x1b[33m• npm run dev\x1b[0m         Run dev build script
  \x1b[33m• whoami / date\x1b[0m       Display system metadata
  \x1b[33m• history\x1b[0m             Display command execution history
  \x1b[33m• clear / cls\x1b[0m         Clear terminal buffer screen`,
        time: now
      });
    } else if (cmd === 'ls' || cmd === 'dir') {
      const rootFolders = files.filter((f) => !f.parentId).map((f) => `\x1b[1;36m${f.name}/\x1b[0m`);
      const rootFiles = files.filter((f) => !f.parentId).map((f) => {
        if (f.extension === 'js' || f.extension === 'ts' || f.extension === 'tsx' || f.extension === 'py') {
          return `\x1b[32m${f.name}\x1b[0m`;
        }
        return f.name;
      });
      const outputStr = [...rootFolders, ...rootFiles].join('   ') || '\x1b[90m(empty folder)\x1b[0m';
      outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: outputStr, time: now });
    } else if (cmd === 'pwd') {
      outputLogs.push({
        id: `out-${Date.now()}`,
        type: 'output',
        text: `/home/livepad/workspace${activeSession.currentDir.replace('~', '')}`,
        time: now
      });
    } else if (cmd === 'cd') {
      if (!arg || arg === '~') {
        activeSession.currentDir = '~/project';
        outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: 'Changed directory to ~/project', time: now });
      } else if (arg === '..') {
        const parts = activeSession.currentDir.split('/');
        if (parts.length > 2) parts.pop();
        activeSession.currentDir = parts.join('/');
        outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: `Changed directory to ${activeSession.currentDir}`, time: now });
      } else {
        const targetFolder = folders.find((f) => f.name.toLowerCase() === arg.toLowerCase());
        if (targetFolder) {
          activeSession.currentDir = `~/project/${targetFolder.path}`;
          outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: `Changed directory to ${activeSession.currentDir}`, time: now });
        } else {
          outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: `\x1b[31mcd: ${arg}: No such directory\x1b[0m`, time: now });
        }
      }
    } else if (cmd === 'touch') {
      if (!arg) {
        outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: '\x1b[31mUsage: touch <filename>\x1b[0m', time: now });
      } else {
        if (onCreateFile) {
          onCreateFile(null, arg);
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: `\x1b[32m✔ Created file: ${arg}\x1b[0m`, time: now });
        } else {
          outputLogs.push({ id: `out-${Date.now()}`, type: 'info', text: `Created file: ${arg}`, time: now });
        }
      }
    } else if (cmd === 'mkdir') {
      if (!arg) {
        outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: '\x1b[31mUsage: mkdir <foldername>\x1b[0m', time: now });
      } else {
        if (onCreateFolder) {
          onCreateFolder(null, arg);
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: `\x1b[32m✔ Created directory: ${arg}\x1b[0m`, time: now });
        } else {
          outputLogs.push({ id: `out-${Date.now()}`, type: 'info', text: `Created directory: ${arg}`, time: now });
        }
      }
    } else if (cmd === 'rm') {
      if (!arg) {
        outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: '\x1b[31mUsage: rm <filename/foldername>\x1b[0m', time: now });
      } else {
        const fileTarget = files.find((f) => f.name.toLowerCase() === arg.toLowerCase());
        const folderTarget = folders.find((f) => f.name.toLowerCase() === arg.toLowerCase());

        if (fileTarget && onDeleteItems) {
          onDeleteItems([fileTarget.id], 'file');
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: `\x1b[32m✔ Removed file: ${fileTarget.name}\x1b[0m`, time: now });
        } else if (folderTarget && onDeleteItems) {
          onDeleteItems([folderTarget.id], 'folder');
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: `\x1b[32m✔ Removed folder: ${folderTarget.name}\x1b[0m`, time: now });
        } else {
          outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: `\x1b[31mrm: ${arg}: No such file or directory\x1b[0m`, time: now });
        }
      }
    } else if (cmd === 'mv') {
      const parts = arg.split(/\s+/);
      if (parts.length < 2) {
        outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: '\x1b[31mUsage: mv <source> <target_name>\x1b[0m', time: now });
      } else {
        const src = parts[0];
        const dst = parts[1];
        const fileTarget = files.find((f) => f.name.toLowerCase() === src.toLowerCase());
        const folderTarget = folders.find((f) => f.name.toLowerCase() === src.toLowerCase());

        if (fileTarget && onRenameItem) {
          onRenameItem(fileTarget.id, 'file', dst);
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: `\x1b[32m✔ Renamed ${src} -> ${dst}\x1b[0m`, time: now });
        } else if (folderTarget && onRenameItem) {
          onRenameItem(folderTarget.id, 'folder', dst);
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: `\x1b[32m✔ Renamed folder ${src} -> ${dst}\x1b[0m`, time: now });
        } else {
          outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: `\x1b[31mmv: ${src}: No such file or directory\x1b[0m`, time: now });
        }
      }
    } else if (cmd === 'cat') {
      if (!arg) {
        outputLogs.push({ id: `out-${Date.now()}`, type: 'error', text: '\x1b[31mUsage: cat <filename>\x1b[0m', time: now });
      } else {
        const target = files.find((f) => f.name.toLowerCase() === arg.toLowerCase());
        if (target) {
          outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: target.content, time: now });
        } else {
          outputLogs.push({
            id: `out-${Date.now()}`,
            type: 'error',
            text: `\x1b[31mcat: ${arg}: No such file or directory\x1b[0m`,
            time: now
          });
        }
      }
    } else if (cmd === 'run' || cmd === 'node') {
      const fileToRun = arg ? files.find((f) => f.name.toLowerCase() === arg.toLowerCase()) : activeFile;
      if (!fileToRun) {
        outputLogs.push({
          id: `out-${Date.now()}`,
          type: 'error',
          text: '\x1b[31mError: No target file specified or open to execute.\x1b[0m',
          time: now
        });
      } else {
        outputLogs.push({
          id: `out-${Date.now()}`,
          type: 'info',
          text: `\x1b[34m[Executing Node.js script: ${fileToRun.name}...]\x1b[0m`,
          time: now
        });
        try {
          const logsCaptured: string[] = [];
          const customConsole = {
            log: (...a: any[]) =>
              logsCaptured.push(a.map((x) => (typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x))).join(' ')),
            info: (...a: any[]) => logsCaptured.push('\x1b[36m[INFO]\x1b[0m ' + a.join(' ')),
            warn: (...a: any[]) => logsCaptured.push('\x1b[33m[WARN]\x1b[0m ' + a.join(' ')),
            error: (...a: any[]) => logsCaptured.push('\x1b[31m[ERROR]\x1b[0m ' + a.join(' '))
          };
          const fn = new Function('console', 'window', fileToRun.content);
          fn(customConsole, {});
          const resultStr =
            logsCaptured.length > 0
              ? logsCaptured.join('\n')
              : '\x1b[32m✔ Process finished with exit code 0\x1b[0m';
          outputLogs.push({ id: `out-${Date.now()}`, type: 'success', text: resultStr, time: now });
        } catch (err: any) {
          outputLogs.push({
            id: `out-${Date.now()}`,
            type: 'error',
            text: `\x1b[31mRuntime Error: ${err?.message || err}\x1b[0m`,
            time: now
          });
        }
      }
    } else if (cmd === 'git') {
      if (arg === 'status') {
        const unsaved = files.filter((f) => f.isUnsaved);
        const statusText =
          unsaved.length === 0
            ? '\x1b[32mOn branch main\x1b[0m\nYour branch is up to date with "origin/main".\nNothing to commit, working tree clean.'
            : `\x1b[32mOn branch main\x1b[0m\nChanges not staged for commit:\n${unsaved
                .map((f) => `  \x1b[31mmodified: ${f.name}\x1b[0m`)
                .join('\n')}`;
        outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: statusText, time: now });
      } else if (arg === 'log') {
        outputLogs.push({
          id: `out-${Date.now()}`,
          type: 'output',
          text: `\x1b[33mcommit a8f9102c98d1a04f (HEAD -> main, origin/main)\x1b[0m\nAuthor: LivePad Developer <dev@livepad.io>\nDate:   ${new Date().toDateString()}\n\n    feat: Update workspace language support & terminal features`,
          time: now
        });
      } else {
        outputLogs.push({
          id: `out-${Date.now()}`,
          type: 'info',
          text: `\x1b[36mgit version 2.42.0.windows.1\x1b[0m\nSupported subcommands: git status, git log`,
          time: now
        });
      }
    } else if (cmd === 'npm') {
      if (arg.startsWith('run')) {
        outputLogs.push({
          id: `out-${Date.now()}`,
          type: 'info',
          text: `\x1b[34m> applet@1.0.0 ${arg}\x1b[0m\n\x1b[32m✔ Build successful. Server ready on port 3000.\x1b[0m`,
          time: now
        });
      } else {
        outputLogs.push({
          id: `out-${Date.now()}`,
          type: 'success',
          text: `\x1b[32m+ ${arg || 'package'}\x1b[0m\nadded 1 package in 0.4s`,
          time: now
        });
      }
    } else if (cmd === 'whoami') {
      outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: 'livepad-developer', time: now });
    } else if (cmd === 'date') {
      outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: new Date().toString(), time: now });
    } else if (cmd === 'history') {
      const hist = isSplitPane ? activeSession.splitHistory : activeSession.history;
      const listStr = hist.map((h, i) => `  ${hist.length - i}  ${h}`).join('\n') || '  (no commands in history)';
      outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: listStr, time: now });
    } else if (cmd === 'echo') {
      outputLogs.push({ id: `out-${Date.now()}`, type: 'output', text: arg, time: now });
    } else {
      outputLogs.push({
        id: `out-${Date.now()}`,
        type: 'error',
        text: `\x1b[31m${activeSession.shellType}: command not found: ${cmd}. Type "help" for assistance.\x1b[0m`,
        time: now
      });
    }

    // Update session state
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          if (isSplitPane) {
            return {
              ...s,
              splitLogs: [...s.splitLogs, inputLog, ...outputLogs],
              splitHistory: [raw, ...s.splitHistory],
              splitHistoryIndex: -1
            };
          } else {
            return {
              ...s,
              logs: [...s.logs, inputLog, ...outputLogs],
              history: [raw, ...s.history],
              historyIndex: -1
            };
          }
        }
        return s;
      })
    );

    if (isSplitPane) setSplitInputVal('');
    else setInputVal('');
  };

  // Keyboard Navigation for Command History (Up/Down Arrow)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isSplitPane = false) => {
    const hist = isSplitPane ? activeSession.splitHistory : activeSession.history;
    const histIdx = isSplitPane ? activeSession.splitHistoryIndex : activeSession.historyIndex;

    if (e.key === 'Enter') {
      executeCommand(isSplitPane ? splitInputVal : inputVal, isSplitPane);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hist.length > 0 && histIdx < hist.length - 1) {
        const nextIdx = histIdx + 1;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? isSplitPane
                ? { ...s, splitHistoryIndex: nextIdx }
                : { ...s, historyIndex: nextIdx }
              : s
          )
        );
        if (isSplitPane) setSplitInputVal(hist[nextIdx]);
        else setInputVal(hist[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) {
        const nextIdx = histIdx - 1;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? isSplitPane
                ? { ...s, splitHistoryIndex: nextIdx }
                : { ...s, historyIndex: nextIdx }
              : s
          )
        );
        if (isSplitPane) setSplitInputVal(hist[nextIdx]);
        else setInputVal(hist[nextIdx]);
      } else if (histIdx === 0) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? isSplitPane
                ? { ...s, splitHistoryIndex: -1 }
                : { ...s, historyIndex: -1 }
              : s
          )
        );
        if (isSplitPane) setSplitInputVal('');
        else setInputVal('');
      }
    }
  };

  // Copy full terminal buffer to clipboard
  const handleCopyTerminalOutput = () => {
    const textToCopy = activeSession.logs.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Scratchpad notes local persistence
  const [scratchNotes, setScratchNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('livepad_bottom_scratchpad') || '';
    } catch (_) {
      return '';
    }
  });

  const activeShellConf = SHELL_CONFIGS[activeSession.shellType];

  if (!isOpen) return null;

  return (
    <div
      style={{ height: `${height}px` }}
      className="shrink-0 w-full bg-[#181818] text-slate-200 border-t border-[#2d2d2d] flex flex-col relative overflow-hidden select-none z-20 shadow-2xl font-sans"
    >
      {/* Height Resize Drag Handle */}
      <div
        onMouseDown={onResizeStart}
        onTouchStart={onResizeStart}
        className="absolute top-0 inset-x-0 h-1.5 cursor-ns-resize hover:bg-[#007acc] active:bg-[#007acc] transition-colors z-30 group"
        title="Drag to resize Terminal Panel"
      >
        <div className="w-12 h-0.5 bg-[#3c3c3c] group-hover:bg-[#007acc] rounded-full mx-auto -translate-y-0.5 transition-colors" />
      </div>

      {/* Terminal Top Control Bar & Tabs */}
      <div className="pt-1 px-3 pb-1 border-b border-[#252526] flex items-center justify-between shrink-0 bg-[#252526] text-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 mr-2 text-[#cccccc] font-bold">
            <TerminalIcon className="w-3.5 h-3.5 text-[#007acc]" />
            <span className="text-[11px] uppercase tracking-wide">Terminal</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'bg-[#1e1e1e] text-white border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <TerminalIcon className="w-3 h-3 text-[#007acc]" />
            <span>Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('problems')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'problems'
                ? 'bg-[#1e1e1e] text-amber-400 border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <AlertTriangle className={`w-3 h-3 ${problems.some(p => p.severity === 'error') ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>Problems</span>
            {problems.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                problems.some(p => p.severity === 'error')
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {problems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('debugConsole')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'debugConsole'
                ? 'bg-[#1e1e1e] text-rose-400 border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <Bug className="w-3 h-3 text-rose-400" />
            <span>Debug Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('testResults')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'testResults'
                ? 'bg-[#1e1e1e] text-sky-400 border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <FlaskConical className="w-3 h-3 text-sky-400" />
            <span>Test Results</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-[#1e1e1e] text-white border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Activity Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scratchpad')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scratchpad'
                ? 'bg-[#1e1e1e] text-amber-300 border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <Code2 className="w-3 h-3 text-amber-400" />
            <span>Scratchpad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-[#1e1e1e] text-emerald-400 border border-[#3c3c3c]'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <TerminalIcon className="w-3 h-3 text-emerald-400" />
            <span>Environment</span>
          </button>
        </div>

        {/* Right Controls: Split, Search, New Shell, Copy, Clear, Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab === 'terminal' && (
            <>
              {/* Shell Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsShellDropdownOpen(!isShellDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-[#1e1e1e] hover:bg-[#333333] border border-[#3c3c3c] rounded text-[11px] text-[#cccccc] cursor-pointer"
                  title="Select Shell Type"
                >
                  <span>{activeShellConf.icon}</span>
                  <span className="font-semibold">{activeShellConf.label}</span>
                  <ChevronDown className="w-3 h-3 text-[#858585]" />
                </button>

                {isShellDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#252526] border border-[#3c3c3c] rounded shadow-2xl py-1 z-50 text-xs font-sans">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#858585] border-b border-[#3c3c3c]">
                      Switch Shell Profile
                    </div>
                    {(Object.keys(SHELL_CONFIGS) as ShellType[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setSessions((prev) =>
                            prev.map((s) => (s.id === activeSessionId ? { ...s, shellType: st } : s))
                          );
                          setIsShellDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-[#04395e] hover:text-white transition-colors cursor-pointer ${
                          activeSession.shellType === st ? 'bg-[#007acc]/20 text-white font-bold' : 'text-[#cccccc]'
                        }`}
                      >
                        <span>{SHELL_CONFIGS[st].icon}</span>
                        <span>{SHELL_CONFIGS[st].label}</span>
                      </button>
                    ))}

                    <div className="border-t border-[#3c3c3c] mt-1 pt-1 px-2">
                      <button
                        type="button"
                        onClick={() => handleAddTerminal('bash')}
                        className="w-full text-left py-1 text-[11px] text-[#007acc] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New Terminal Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Terminal Tab (+) */}
              <button
                type="button"
                onClick={() => handleAddTerminal(activeSession.shellType)}
                className="p-1 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors cursor-pointer"
                title="New Terminal Tab (Ctrl+Shift+`)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Split Terminal Button */}
              <button
                type="button"
                onClick={handleToggleSplit}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  activeSession.isSplit
                    ? 'text-[#007acc] bg-[#007acc]/20 border border-[#007acc]/50'
                    : 'text-[#858585] hover:text-white hover:bg-[#333333]'
                }`}
                title="Split Terminal Side-by-Side (Ctrl+\)"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>

              {/* Buffer Search Button */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isSearchOpen
                    ? 'text-cyan-400 bg-cyan-500/20'
                    : 'text-[#858585] hover:text-white hover:bg-[#333333]'
                }`}
                title="Search Terminal Buffer (Ctrl+F)"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Copy Terminal Output */}
              <button
                type="button"
                onClick={handleCopyTerminalOutput}
                className="p-1 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors cursor-pointer relative"
                title="Copy Terminal Output to Clipboard"
              >
                {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Clear Screen */}
              <button
                type="button"
                onClick={() => {
                  setSessions((prev) =>
                    prev.map((s) => (s.id === activeSessionId ? { ...s, logs: [], splitLogs: [] } : s))
                  );
                }}
                className="p-1 text-[#858585] hover:text-rose-400 rounded hover:bg-[#333333] transition-colors cursor-pointer"
                title="Clear Terminal Output Screen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Close Panel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors cursor-pointer"
            title="Close Terminal Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-terminal Sessions Tab Bar (VS Code style sub-bar) */}
      {activeTab === 'terminal' && sessions.length > 0 && (
        <div className="bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center px-2 gap-1 overflow-x-auto shrink-0 py-0.5 text-xs">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border transition-all cursor-pointer group ${
                activeSessionId === session.id
                  ? 'bg-[#2d2d2d] text-white border-[#3c3c3c]'
                  : 'bg-transparent text-[#858585] hover:text-[#cccccc] border-transparent hover:bg-[#252526]'
              }`}
            >
              <span>{SHELL_CONFIGS[session.shellType].icon}</span>

              {editingTabId === session.id ? (
                <input
                  type="text"
                  value={editingTabName}
                  onChange={(e) => setEditingTabName(e.target.value)}
                  onBlur={() => {
                    if (editingTabName.trim()) {
                      setSessions((prev) =>
                        prev.map((s) => (s.id === session.id ? { ...s, name: editingTabName.trim() } : s))
                      );
                    }
                    setEditingTabId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingTabName.trim()) {
                        setSessions((prev) =>
                          prev.map((s) => (s.id === session.id ? { ...s, name: editingTabName.trim() } : s))
                        );
                      }
                      setEditingTabId(null);
                    }
                  }}
                  className="bg-[#181818] text-white border border-[#007acc] rounded px-1 outline-none text-xs font-mono"
                  autoFocus
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditingTabId(session.id);
                    setEditingTabName(session.name);
                  }}
                  className="font-mono text-[11px] truncate max-w-[120px]"
                >
                  {session.name}
                </span>
              )}

              {session.isSplit && <Columns className="w-3 h-3 text-[#007acc]" />}

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleCloseTerminal(session.id, e)}
                  className="p-0.5 text-[#858585] hover:text-white rounded hover:bg-[#3c3c3c] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Kill Terminal Session"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search Buffer Bar */}
      {activeTab === 'terminal' && isSearchOpen && (
        <div className="bg-[#252526] border-b border-[#3c3c3c] px-3 py-1 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#858585]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter terminal buffer output..."
              className="bg-[#1e1e1e] text-white border border-[#3c3c3c] rounded px-2 py-0.5 text-xs outline-none w-full"
            />
            {searchQuery && (
              <span className="text-[10px] text-[#858585] font-mono shrink-0">
                {activeSession.logs.filter((l) => l.text.toLowerCase().includes(searchQuery.toLowerCase())).length}{' '}
                matches
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            className="text-[#858585] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Terminal View Container */}
      <div className="flex-1 overflow-hidden relative flex">
        {activeTab === 'terminal' && (
          <div className="w-full h-full flex divide-x divide-[#2d2d2d] bg-[#181818]">
            {/* Primary Terminal Pane */}
            <div
              style={{ width: activeSession.isSplit ? `${splitRatio}%` : '100%' }}
              className="h-full flex flex-col p-3 font-mono text-xs leading-relaxed overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-1 flex-1">
                {activeSession.logs
                  .filter((log) => !searchQuery || log.text.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((log) => (
                    <div key={log.id} className="whitespace-pre-wrap break-all">
                      {log.type === 'input' && (
                        <span className="text-cyan-400 font-bold">{log.text}</span>
                      )}
                      {log.type === 'output' && (
                        <span className="text-[#cccccc]">{renderAnsiText(log.text)}</span>
                      )}
                      {log.type === 'error' && (
                        <span className="text-rose-400 font-bold">{renderAnsiText(log.text)}</span>
                      )}
                      {log.type === 'success' && (
                        <span className="text-emerald-400 font-bold">{renderAnsiText(log.text)}</span>
                      )}
                      {log.type === 'info' && (
                        <span className="text-amber-300 font-medium">{renderAnsiText(log.text)}</span>
                      )}
                    </div>
                  ))}

                {/* Primary Input Line */}
                <div className="flex items-center gap-2 pt-1">
                  <span className={`${activeShellConf.headerColor} font-bold shrink-0`}>
                    {activeShellConf.prompt(activeSession.currentDir)}
                  </span>
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    placeholder={`Type command (help, ls, run, cat, git status)...`}
                    className="flex-1 bg-transparent text-slate-100 outline-none font-mono text-xs caret-[#007acc]"
                  />
                </div>
                <div ref={primaryBottomRef} />
              </div>
            </div>

            {/* Split Secondary Terminal Pane */}
            {activeSession.isSplit && (
              <div
                style={{ width: `${100 - splitRatio}%` }}
                className="h-full flex flex-col p-3 font-mono text-xs leading-relaxed overflow-y-auto custom-scrollbar bg-[#161616]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-[#252526] mb-2 text-[11px] text-[#858585]">
                  <span className="flex items-center gap-1 font-bold text-[#cccccc]">
                    <Columns className="w-3 h-3 text-[#007acc]" /> Split Terminal Pane
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSplit}
                    className="text-[#858585] hover:text-white text-[10px] hover:underline"
                  >
                    Close Split
                  </button>
                </div>

                <div className="space-y-1 flex-1">
                  {activeSession.splitLogs.map((log) => (
                    <div key={log.id} className="whitespace-pre-wrap break-all">
                      {log.type === 'input' && (
                        <span className="text-purple-400 font-bold">{log.text}</span>
                      )}
                      {log.type === 'output' && (
                        <span className="text-[#cccccc]">{renderAnsiText(log.text)}</span>
                      )}
                      {log.type === 'error' && (
                        <span className="text-rose-400 font-bold">{renderAnsiText(log.text)}</span>
                      )}
                      {log.type === 'success' && (
                        <span className="text-emerald-400 font-bold">{renderAnsiText(log.text)}</span>
                      )}
                      {log.type === 'info' && (
                        <span className="text-amber-300 font-medium">{renderAnsiText(log.text)}</span>
                      )}
                    </div>
                  ))}

                  {/* Secondary Input Line */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-purple-400 font-bold shrink-0">
                      {activeShellConf.prompt(activeSession.currentDir)}
                    </span>
                    <input
                      type="text"
                      value={splitInputVal}
                      onChange={(e) => setSplitInputVal(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      placeholder="Type command in split terminal..."
                      className="flex-1 bg-transparent text-slate-100 outline-none font-mono text-xs caret-purple-400"
                    />
                  </div>
                  <div ref={splitBottomRef} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Problems Panel Tab */}
        {activeTab === 'problems' && (
          <div className="w-full h-full flex flex-col bg-[#161616] p-3 font-mono text-xs overflow-hidden">
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2d2d2d] shrink-0 text-[11px]">
              <div className="flex items-center gap-3">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Workspace Diagnostics & Problems
                </span>

                {/* Severity Filters */}
                <div className="flex items-center gap-1 bg-[#252526] p-0.5 rounded border border-[#3c3c3c]">
                  <button
                    type="button"
                    onClick={() => setProblemFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      problemFilter === 'all'
                        ? 'bg-[#007acc] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({problems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProblemFilter('error')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      problemFilter === 'error'
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-400 hover:text-rose-300'
                    }`}
                  >
                    Errors ({problems.filter((p) => p.severity === 'error').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProblemFilter('warning')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      problemFilter === 'warning'
                        ? 'bg-amber-600 text-white'
                        : 'text-amber-300 hover:text-amber-200'
                    }`}
                  >
                    Warnings ({problems.filter((p) => p.severity === 'warning').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProblemFilter('info')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      problemFilter === 'info'
                        ? 'bg-sky-600 text-white'
                        : 'text-sky-300 hover:text-sky-200'
                    }`}
                  >
                    Info ({problems.filter((p) => p.severity === 'info').length})
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <div className="flex items-center gap-2 max-w-xs w-full sm:w-auto">
                <Search className="w-3 h-3 text-slate-500" />
                <input
                  type="text"
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  placeholder="Filter by file or message..."
                  className="bg-[#1e1e1e] text-slate-200 border border-[#3c3c3c] rounded px-2 py-0.5 text-[11px] outline-none w-full"
                />
              </div>
            </div>

            {/* Diagnostic List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-3">
              {(() => {
                const filtered = problems.filter((p) => {
                  const matchesFilter =
                    problemFilter === 'all' || p.severity === problemFilter;
                  const matchesSearch =
                    !problemSearch ||
                    p.message.toLowerCase().includes(problemSearch.toLowerCase()) ||
                    p.filePath.toLowerCase().includes(problemSearch.toLowerCase()) ||
                    p.fileName.toLowerCase().includes(problemSearch.toLowerCase());
                  return matchesFilter && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <div className="font-bold text-slate-200">No problems detected</div>
                      <div className="text-[11px] text-slate-500 max-w-md">
                        The workspace compiles cleanly with zero diagnostics matching your filter criteria.
                      </div>
                    </div>
                  );
                }

                // Group by file path
                const groupedByFile: Record<string, ProblemDiagnostic[]> = {};
                filtered.forEach((p) => {
                  const key = p.filePath || p.fileName;
                  if (!groupedByFile[key]) groupedByFile[key] = [];
                  groupedByFile[key].push(p);
                });

                return Object.entries(groupedByFile).map(([filePath, fileProblems]) => {
                  const fileErrCount = fileProblems.filter((p) => p.severity === 'error').length;
                  const fileWarnCount = fileProblems.filter((p) => p.severity === 'warning').length;

                  return (
                    <div key={filePath} className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-md overflow-hidden">
                      {/* Group File Header */}
                      <div className="bg-[#252526] px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-200 border-b border-[#2d2d2d]">
                        <span className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-sky-400" />
                          <span className="font-mono text-slate-100">{filePath}</span>
                        </span>
                        <div className="flex items-center gap-2 text-[10px]">
                          {fileErrCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded border border-rose-500/30">
                              {fileErrCount} {fileErrCount === 1 ? 'error' : 'errors'}
                            </span>
                          )}
                          {fileWarnCount > 0 && (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                              {fileWarnCount} {fileWarnCount === 1 ? 'warning' : 'warnings'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-[#282828]">
                        {fileProblems.map((prob) => (
                          <div
                            key={prob.id}
                            onClick={() => {
                              if (onSelectProblem) {
                                onSelectProblem(prob.filePath, prob.line, prob.column, prob.fileId);
                              } else if (prob.fileId && onSelectFile) {
                                onSelectFile(prob.fileId);
                              }
                            }}
                            className="p-2.5 hover:bg-[#28282d] transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              {prob.severity === 'error' && (
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              {prob.severity === 'warning' && (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              )}
                              {prob.severity === 'info' && (
                                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                              )}

                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="text-slate-200 text-[11px] leading-relaxed break-words font-sans">
                                  {prob.message}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                  <span className="text-slate-400 group-hover:text-sky-300 transition-colors">
                                    [Line {prob.line}, Col {prob.column}]
                                  </span>
                                  {prob.source && (
                                    <span className="uppercase tracking-wider px-1 py-0.2 bg-[#2d2d2d] text-slate-400 rounded text-[9px]">
                                      {prob.source}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-[#007acc] text-white rounded text-[10px] font-bold shrink-0 transition-opacity"
                            >
                              Go to file
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Debug Console Tab */}
        {activeTab === 'debugConsole' && (
          <div className="w-full h-full flex flex-col bg-[#161616] p-3 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d] shrink-0 text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Bug className="w-3.5 h-3.5 text-rose-400" /> Interactive Debug Console & Scope Evaluator
              </span>
              {onClearDebugConsole && (
                <button
                  onClick={onClearDebugConsole}
                  className="px-2 py-0.5 bg-[#252526] hover:bg-[#333333] text-slate-300 rounded flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3 text-slate-400" /> Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-1">
              {debugConsoleLogs.length === 0 ? (
                <div className="text-slate-500 italic text-[11px] p-2">
                  Debug Console initialized. Type expression below to evaluate in active execution scope.
                </div>
              ) : (
                debugConsoleLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span className="text-slate-600 shrink-0 text-[10px]">{log.time}</span>
                    {log.type === 'eval' && <span className="text-sky-400 font-bold shrink-0">&gt;</span>}
                    {log.type === 'result' && <span className="text-emerald-400 font-bold shrink-0">&lt;</span>}
                    {log.type === 'error' && <span className="text-rose-400 font-bold shrink-0">✕</span>}
                    {log.type === 'warn' && <span className="text-amber-400 font-bold shrink-0">⚠</span>}
                    <span
                      className={`break-all ${
                        log.type === 'eval'
                          ? 'text-sky-300 font-bold'
                          : log.type === 'result'
                          ? 'text-emerald-300 font-bold'
                          : log.type === 'error'
                          ? 'text-rose-300 font-bold'
                          : log.type === 'warn'
                          ? 'text-amber-300'
                          : 'text-slate-200'
                      }`}
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Interactive Debug Expression Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!debugEvalInput.trim()) return;
                if (onEvalDebugExpression) {
                  onEvalDebugExpression(debugEvalInput.trim());
                }
                setDebugEvalInput('');
              }}
              className="flex items-center gap-2 pt-2 border-t border-[#2d2d2d] shrink-0"
            >
              <span className="text-sky-400 font-bold">&gt;</span>
              <input
                type="text"
                value={debugEvalInput}
                onChange={(e) => setDebugEvalInput(e.target.value)}
                placeholder="Evaluate expression or variable (e.g., activeUsers, req.body, 1 + 1)..."
                className="flex-1 bg-transparent text-slate-100 outline-none font-mono text-xs caret-sky-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold"
              >
                Eval
              </button>
            </form>
          </div>
        )}

        {/* Test Results Tab */}
        {activeTab === 'testResults' && (
          <div className="w-full h-full flex flex-col bg-[#161616] p-3 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d] shrink-0 text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-sky-400" /> Unit Test Execution & Assertion Logs
              </span>
              {onRunAllTests && (
                <button
                  onClick={onRunAllTests}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded flex items-center gap-1 font-bold text-[11px]"
                >
                  <Play className="w-3 h-3 fill-current" /> Run All Tests
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-3">
              {testSuites.length === 0 ? (
                <div className="text-slate-500 italic text-[11px] p-2">
                  No test results. Click "Run All Tests" in Test Explorer sidebar or toolbar above.
                </div>
              ) : (
                testSuites.map((suite) => (
                  <div key={suite.id} className="p-2 bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-sky-400" /> {suite.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        suite.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        suite.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {suite.status}
                      </span>
                    </div>

                    <div className="pl-3 border-l border-slate-800 space-y-1">
                      {suite.cases.map((c) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-2">
                              {c.status === 'passed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                              {c.status === 'failed' && <XCircle className="w-3 h-3 text-rose-400" />}
                              <span className="text-slate-300">{c.name}</span>
                            </span>
                            {c.durationMs !== undefined && (
                              <span className="text-slate-500 text-[10px]">{c.durationMs}ms</span>
                            )}
                          </div>
                          {c.errorMessage && (
                            <div className="p-2 bg-rose-950/40 border border-rose-900/50 rounded text-rose-300 text-[10px] whitespace-pre-wrap">
                              {c.errorMessage}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'activity' && (
          <div className="w-full h-full p-3 overflow-y-auto custom-scrollbar space-y-2 font-mono text-xs">
            <div className="text-[11px] text-[#858585] border-b border-[#2d2d2d] pb-1 font-bold">
              IDE Runtime Execution & Synchronization Trail
            </div>
            {[
              { id: '1', time: new Date().toLocaleTimeString(), type: 'info', msg: 'VS Code Terminal Kernel & Virtual Shell initialized.' },
              { id: '2', time: new Date().toLocaleTimeString(), type: 'sync', msg: 'IndexedDB project persistence state synced.' },
              { id: '3', time: new Date().toLocaleTimeString(), type: 'success', msg: `Monaco Code Editor active buffer (${wordCount} words, ${lineCount} lines).` },
              { id: '4', time: new Date().toLocaleTimeString(), type: 'info', msg: `Active Shell: ${activeShellConf.label}` }
            ].map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-[11px]">
                <span className="text-[#858585] shrink-0 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {log.time}
                </span>
                <span
                  className={`font-bold shrink-0 uppercase text-[9px] px-1 py-0.2 rounded ${
                    log.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : log.type === 'sync'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-[#2d2d2d] text-[#cccccc]'
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-[#cccccc] break-all">{log.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scratchpad Tab */}
        {activeTab === 'scratchpad' && (
          <div className="w-full h-full p-3 flex flex-col">
            <div className="text-[11px] text-[#858585] mb-1 font-mono flex items-center justify-between">
              <span>Quick Code Scratchpad (Auto-saved to LocalStorage)</span>
              <span className="text-[10px] text-amber-400">Temporary workspace notes</span>
            </div>
            <textarea
              value={scratchNotes}
              onChange={(e) => {
                setScratchNotes(e.target.value);
                try {
                  localStorage.setItem('livepad_bottom_scratchpad', e.target.value);
                } catch (_) {}
              }}
              placeholder="// Type quick code snippets, temporary variables, or notes here..."
              className="flex-1 w-full bg-[#141414] text-slate-200 border border-[#2d2d2d] rounded p-2 focus:outline-none focus:border-[#007acc] resize-none font-mono text-xs leading-relaxed"
            />
          </div>
        )}

        {/* Environment / Status Tab */}
        {activeTab === 'status' && (
          <div className="w-full h-full p-4 overflow-y-auto font-sans">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-1">
                <span className="text-[#858585] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-[#007acc]" /> Shell Mode
                </span>
                <p className="font-bold text-white">{activeShellConf.label}</p>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-1">
                <span className="text-[#858585] text-[10px] uppercase font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Disk Integration
                </span>
                <p className="font-bold text-white">
                  {isPwaMounted ? 'Local Directory Mount' : 'Browser IndexedDB Engine'}
                </p>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-1">
                <span className="text-[#858585] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" /> Active Buffer
                </span>
                <p className="font-bold text-white">
                  {activeFile?.name || 'No file selected'} ({wordCount} words)
                </p>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-1">
                <span className="text-[#858585] text-[10px] uppercase font-bold flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-purple-400" /> Project Workspace
                </span>
                <p className="font-bold text-white">{files.length} Files loaded</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(InteractiveTerminal);
