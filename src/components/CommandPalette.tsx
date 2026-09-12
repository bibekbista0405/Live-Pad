import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Command,
  FileText,
  Code,
  Layers,
  Settings,
  PanelLeft,
  Moon,
  Sun,
  Globe,
  Share2,
  Copy,
  Download,
  FileUp,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  ListTree,
  Type,
  Bold,
  Italic,
  List,
  ListChecks,
  Table,
  HelpCircle,
  Users,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Clock,
  Check,
  X,
  Play,
  RotateCcw,
  Eye,
  Sliders,
  FolderPlus,
  LogOut,
  Hash,
  Terminal,
  Heading1,
  Heading2,
  Heading3,
  FolderKanban,
  BookOpen
} from 'lucide-react';
import { LocalNotepad } from '../types';
import { useModalA11y } from '../hooks/useModalA11y';

export interface CommandItem {
  id: string;
  label: string;
  description: string;
  category: 'Workspace' | 'Workspaces' | 'Documents' | 'Editor' | 'Code Mode' | 'Collaboration' | 'Navigation';
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  shortcut?: string[];
  action: () => void;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  // Context state
  activeLocalNoteId: string | null;
  activeLocalNote?: LocalNotepad;
  roomCode: string | null;
  roomTitle?: string;
  isCodeMode: boolean;
  isReadOnly: boolean;
  isFullscreen: boolean;
  isOutlineOpen: boolean;
  theme: 'light' | 'dark';
  localNotes: LocalNotepad[];
  userWorkspaces?: any[];
  activeUsersCount: number;
  // Action callbacks
  onNavigateHome: () => void;
  onCreateNewRoom: () => void;
  onCreateLocalNote: () => void;
  onPublishNote?: () => void;
  onSelectNote: (id: string) => void;
  onSelectWorkspace?: (roomCode: string) => void;
  onToggleCodeMode: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onToggleFullscreen: () => void;
  onToggleTheme: () => void;
  onToggleOutline: () => void;
  onToggleReadOnly: () => void;
  onOpenShortcuts: () => void;
  onExportTxt: () => void;
  onExportPdf: () => void;
  onExportEpub?: () => void;
  onCopyRoomLink: () => void;
  onCopyRoomCode: () => void;
  onApplyFormat: (formatType: string) => void;
  onChangePageWidth: (width: 'narrow' | 'medium' | 'full') => void;
  onOpenInDocumentSearch: () => void;
  onChangeLanguage?: (lang: string) => void;
  onRunCode?: () => void;
  autoCollapseEnabled?: boolean;
  onToggleAutoCollapse?: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  activeLocalNoteId,
  activeLocalNote,
  roomCode,
  roomTitle,
  isCodeMode,
  isReadOnly,
  isFullscreen,
  isOutlineOpen,
  theme,
  localNotes,
  userWorkspaces,
  activeUsersCount,
  onNavigateHome,
  onCreateNewRoom,
  onCreateLocalNote,
  onPublishNote,
  onSelectNote,
  onSelectWorkspace,
  onToggleCodeMode,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onToggleFullscreen,
  onToggleTheme,
  onToggleOutline,
  onToggleReadOnly,
  onOpenShortcuts,
  onExportTxt,
  onExportPdf,
  onExportEpub,
  onCopyRoomLink,
  onCopyRoomCode,
  onApplyFormat,
  onChangePageWidth,
  onOpenInDocumentSearch,
  onChangeLanguage,
  onRunCode,
  autoCollapseEnabled = true,
  onToggleAutoCollapse,
  addToast
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('livepad_recent_commands');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalA11y(isOpen, onClose);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build complete command registry
  const allCommands = useMemo<CommandItem[]>(() => {
    const commands: CommandItem[] = [
      // WORKSPACE & NAVIGATION
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Return to LivePad main workspace dashboard',
        category: 'Workspace',
        icon: LogOut,
        keywords: ['home', 'dashboard', 'exit', 'room', 'leave', 'workspace'],
        action: () => {
          onNavigateHome();
          addToast('info', 'Returned to Dashboard');
        }
      },
      {
        id: 'ws-create-room',
        label: 'Create New Collaborative Room',
        description: 'Start a new real-time shared workspace room',
        category: 'Workspace',
        icon: Globe,
        keywords: ['create', 'new', 'room', 'collaborate', 'share', 'live'],
        action: () => {
          onCreateNewRoom();
        }
      },
      {
        id: 'ws-new-note',
        label: 'New Local Notepad',
        description: 'Create an offline, auto-saving scratchpad document',
        category: 'Documents',
        icon: FileText,
        keywords: ['new', 'note', 'document', 'notepad', 'local', 'scratchpad'],
        action: () => {
          onCreateLocalNote();
          addToast('success', 'Created new local notepad');
        }
      },
      ...(activeLocalNoteId && onPublishNote
        ? [
            {
              id: 'ws-publish-note',
              label: 'Publish Local Note as Live Room',
              description: 'Convert this offline note into a real-time collaborative workspace',
              category: 'Workspace' as const,
              icon: Globe,
              keywords: ['publish', 'live', 'collaborate', 'convert', 'share'],
              action: () => {
                onPublishNote();
              }
            }
          ]
        : []),

      // MODE TOGGLES
      {
        id: 'mode-toggle-code',
        label: isCodeMode ? 'Switch to Rich Text Editor' : 'Switch to Code Workspace Mode',
        description: isCodeMode
          ? 'Switch to rich text markdown writing view'
          : 'Switch to multi-tab polyglot code editor',
        category: 'Editor',
        icon: Code,
        keywords: ['code', 'mode', 'editor', 'script', 'programming', 'rich text', 'toggle'],
        shortcut: ['Ctrl', 'Shift', 'C'],
        action: () => {
          onToggleCodeMode();
        }
      },
      {
        id: 'ui-toggle-theme',
        label: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        description: 'Toggle visual appearance color scheme',
        category: 'Navigation',
        icon: theme === 'dark' ? Sun : Moon,
        keywords: ['theme', 'dark', 'light', 'mode', 'color', 'appearance'],
        shortcut: ['Ctrl', 'D'],
        action: () => {
          onToggleTheme();
        }
      },
      {
        id: 'ui-toggle-fullscreen',
        label: isFullscreen ? 'Exit Focus Mode' : 'Enter Focus Mode (Fullscreen)',
        description: 'Toggle borderless focus view without navigation header',
        category: 'Editor',
        icon: isFullscreen ? Minimize2 : Maximize2,
        keywords: ['fullscreen', 'focus', 'zen', 'expand', 'hide header'],
        shortcut: ['Alt', 'F'],
        action: () => {
          onToggleFullscreen();
        }
      },
      {
        id: 'ui-toggle-left-sidebar',
        label: 'Toggle Left Explorer Sidebar',
        description: 'Show or hide file explorer and workspace navigator',
        category: 'Editor',
        icon: PanelLeft,
        keywords: ['sidebar', 'left', 'explorer', 'navigator', 'files', 'drawer'],
        shortcut: ['Ctrl', 'B'],
        action: () => {
          onToggleLeftSidebar();
        }
      },
      {
        id: 'ui-toggle-right-sidebar',
        label: 'Toggle Right Inspector Panel',
        description: 'Show or hide chat, activity, and document parameters',
        category: 'Editor',
        icon: Layers,
        keywords: ['inspector', 'right', 'panel', 'chat', 'activity', 'comments'],
        shortcut: ['Ctrl', 'Shift', 'B'],
        action: () => {
          onToggleRightSidebar();
        }
      },
      {
        id: 'ui-toggle-autocollapse',
        label: autoCollapseEnabled ? 'Disable Sidebar Auto-Collapse (Pin Sidebar)' : 'Enable Sidebar Auto-Collapse (3s timer)',
        description: autoCollapseEnabled
          ? 'Pin sidebar open and disable 3-second auto-collapse timer'
          : 'Enable automatic 3-second inactivity auto-collapse for sidebar',
        category: 'Editor',
        icon: Clock,
        keywords: ['autocollapse', 'collapse', 'timer', 'sidebar', 'pin', 'inactivity', '3s'],
        action: () => {
          if (onToggleAutoCollapse) onToggleAutoCollapse();
        }
      },
      {
        id: 'ui-toggle-outline',
        label: isOutlineOpen ? 'Hide Document Outline' : 'Show Document Outline',
        description: 'Toggle Table of Contents sidebar for current headings',
        category: 'Editor',
        icon: ListTree,
        keywords: ['outline', 'toc', 'headings', 'table of contents', 'navigation'],
        action: () => {
          onToggleOutline();
        }
      },
      {
        id: 'ui-toggle-readonly',
        label: isReadOnly ? 'Disable Read-Only Mode' : 'Enable Read-Only Mode',
        description: 'Lock document from accidental edits',
        category: 'Editor',
        icon: Eye,
        keywords: ['readonly', 'lock', 'view', 'read', 'protect'],
        action: () => {
          onToggleReadOnly();
        }
      },

      // DOCUMENT SEARCH & EXPORTS
      {
        id: 'doc-search-text',
        label: 'Find in Document',
        description: 'Search text and highlight occurrences inside current document',
        category: 'Documents',
        icon: Search,
        keywords: ['find', 'search', 'text', 'replace', 'lookup'],
        shortcut: ['Ctrl', 'F'],
        action: () => {
          onOpenInDocumentSearch();
        }
      },
      {
        id: 'doc-export-txt',
        label: 'Export Document as Plain Text (.txt)',
        description: 'Download current document content as a .txt file',
        category: 'Documents',
        icon: FileUp,
        keywords: ['export', 'download', 'txt', 'plain text', 'save'],
        action: () => {
          onExportTxt();
        }
      },
      {
        id: 'doc-export-pdf',
        label: 'Export Document as PDF (.pdf)',
        description: 'Generate and print clean PDF preview',
        category: 'Documents',
        icon: Download,
        keywords: ['export', 'pdf', 'download', 'print'],
        action: () => {
          onExportPdf();
        }
      },
      ...(onExportEpub
        ? [
            {
              id: 'doc-export-epub',
              label: 'Export Document as EPUB E-Book (.epub)',
              description: 'Turn your notes into an EPUB e-book for e-readers',
              category: 'Documents' as const,
              icon: BookOpen,
              keywords: ['export', 'epub', 'ebook', 'book', 'download', 'read'],
              action: () => {
                onExportEpub();
              }
            }
          ]
        : []),

      // COLLABORATION
      ...(roomCode
        ? [
            {
              id: 'collab-copy-link',
              label: 'Copy Live Room Share Link',
              description: 'Copy full browser URL with room code to clipboard',
              category: 'Collaboration' as const,
              icon: Share2,
              keywords: ['share', 'link', 'copy', 'invite', 'room', 'url'],
              shortcut: ['Ctrl', 'Shift', 'C'],
              action: () => {
                onCopyRoomLink();
              }
            },
            {
              id: 'collab-copy-code',
              label: 'Copy Room Code Only',
              description: `Copy room passcode (${roomCode})`,
              category: 'Collaboration' as const,
              icon: Copy,
              keywords: ['code', 'passcode', 'copy', 'room'],
              action: () => {
                onCopyRoomCode();
              }
            }
          ]
        : []),

      // PAGE LAYOUT & WIDTH
      {
        id: 'layout-width-narrow',
        label: 'Page Layout: Narrow (680px)',
        description: 'Set writing page width to distraction-free narrow column',
        category: 'Editor',
        icon: Sliders,
        keywords: ['page', 'width', 'narrow', 'column', 'layout'],
        action: () => {
          onChangePageWidth('narrow');
          addToast('info', 'Page width set to Narrow');
        }
      },
      {
        id: 'layout-width-medium',
        label: 'Page Layout: Standard (850px)',
        description: 'Set writing page width to comfortable standard size',
        category: 'Editor',
        icon: Sliders,
        keywords: ['page', 'width', 'medium', 'standard', 'layout'],
        action: () => {
          onChangePageWidth('medium');
          addToast('info', 'Page width set to Standard');
        }
      },
      {
        id: 'layout-width-full',
        label: 'Page Layout: Full Width',
        description: 'Expand writing page to fill container width',
        category: 'Editor',
        icon: Sliders,
        keywords: ['page', 'width', 'full', 'wide', 'layout'],
        action: () => {
          onChangePageWidth('full');
          addToast('info', 'Page width set to Full Width');
        }
      },

      // RICH TEXT FORMATTING
      {
        id: 'format-h1',
        label: 'Format: Heading 1',
        description: 'Apply large section header format',
        category: 'Editor',
        icon: Heading1,
        keywords: ['h1', 'heading', 'title', 'header', 'format'],
        action: () => onApplyFormat('h1')
      },
      {
        id: 'format-h2',
        label: 'Format: Heading 2',
        description: 'Apply sub-heading format',
        category: 'Editor',
        icon: Heading2,
        keywords: ['h2', 'heading', 'subheading', 'header', 'format'],
        action: () => onApplyFormat('h2')
      },
      {
        id: 'format-h3',
        label: 'Format: Heading 3',
        description: 'Apply small heading format',
        category: 'Editor',
        icon: Heading3,
        keywords: ['h3', 'heading', 'header', 'format'],
        action: () => onApplyFormat('h3')
      },
      {
        id: 'format-bold',
        label: 'Format: Bold Text',
        description: 'Make selected text bold',
        category: 'Editor',
        icon: Bold,
        keywords: ['bold', 'strong', 'format'],
        shortcut: ['Ctrl', 'B'],
        action: () => onApplyFormat('bold')
      },
      {
        id: 'format-italic',
        label: 'Format: Italic Text',
        description: 'Make selected text italic',
        category: 'Editor',
        icon: Italic,
        keywords: ['italic', 'emphasis', 'format'],
        shortcut: ['Ctrl', 'I'],
        action: () => onApplyFormat('italic')
      },
      {
        id: 'format-bullet-list',
        label: 'Format: Bullet List',
        description: 'Insert unordered bullet point list',
        category: 'Editor',
        icon: List,
        keywords: ['bullet', 'list', 'points', 'unordered'],
        action: () => onApplyFormat('bullet-list')
      },
      {
        id: 'format-task-list',
        label: 'Format: Task Checklist',
        description: 'Insert interactive checkbox task item',
        category: 'Editor',
        icon: ListChecks,
        keywords: ['checklist', 'task', 'todo', 'checkbox'],
        action: () => onApplyFormat('checklist')
      },
      {
        id: 'format-table',
        label: 'Format: Insert Table',
        description: 'Insert markdown table structure',
        category: 'Editor',
        icon: Table,
        keywords: ['table', 'grid', 'columns', 'rows', 'data'],
        action: () => onApplyFormat('table')
      },

      // CODE MODE SPECIFIC COMMANDS
      ...(isCodeMode
        ? [
            {
              id: 'code-run',
              label: 'Run / Preview Code Script',
              description: 'Execute active code file in live browser sandbox',
              category: 'Code Mode' as const,
              icon: Play,
              keywords: ['run', 'execute', 'preview', 'sandbox', 'compiler'],
              action: () => {
                if (onRunCode) onRunCode();
              }
            },
            {
              id: 'code-lang-ts',
              label: 'Code Language: TypeScript / JavaScript',
              description: 'Set code syntax highlighting to TypeScript',
              category: 'Code Mode' as const,
              icon: Code,
              keywords: ['typescript', 'js', 'ts', 'javascript', 'lang'],
              action: () => {
                if (onChangeLanguage) onChangeLanguage('typescript');
              }
            },
            {
              id: 'code-lang-py',
              label: 'Code Language: Python',
              description: 'Set code syntax highlighting to Python',
              category: 'Code Mode' as const,
              icon: Code,
              keywords: ['python', 'py', 'script', 'lang'],
              action: () => {
                if (onChangeLanguage) onChangeLanguage('python');
              }
            },
            {
              id: 'code-lang-html',
              label: 'Code Language: HTML / CSS',
              description: 'Set code syntax highlighting to HTML/CSS',
              category: 'Code Mode' as const,
              icon: Code,
              keywords: ['html', 'css', 'web', 'markup', 'lang'],
              action: () => {
                if (onChangeLanguage) onChangeLanguage('html');
              }
            }
          ]
        : []),

      // SYSTEM & HELP
      {
        id: 'sys-shortcuts',
        label: 'Keyboard Shortcuts Reference',
        description: 'View full list of keyboard shortcuts',
        category: 'Navigation',
        icon: HelpCircle,
        keywords: ['shortcuts', 'help', 'keyboard', 'hotkeys', 'keybindings'],
        shortcut: ['?'],
        action: () => {
          onOpenShortcuts();
        }
      }
    ];

    // Append Recent Local Notes as Quick Switch Commands
    localNotes.forEach((note) => {
      commands.push({
        id: `doc-note-${note.id}`,
        label: `Switch Note: ${note.title || 'Untitled Note'}`,
        description: `Open local notepad (Updated ${new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        category: 'Documents',
        icon: FileText,
        keywords: ['open', 'switch', 'note', 'document', note.title.toLowerCase()],
        action: () => {
          onSelectNote(note.id);
          addToast('info', `Opened note: ${note.title}`);
        },
        badge: note.id === activeLocalNoteId ? 'Active' : undefined
      });
    });

    // Append Saved Online Workspaces
    if (userWorkspaces && userWorkspaces.length > 0) {
      userWorkspaces.forEach((ws) => {
        const code = ws.roomCode || ws.workspaceId;
        commands.push({
          id: `workspace-${ws.workspaceId}`,
          label: `Open Online Workspace: ${ws.title || 'Untitled Workspace'}`,
          description: `Switch to room code ${code} (${ws.category || 'team'})`,
          category: 'Workspaces',
          icon: FolderKanban,
          keywords: ['open', 'switch', 'room', 'workspace', ws.title.toLowerCase(), code.toLowerCase()],
          action: () => {
            if (onSelectWorkspace) {
              onSelectWorkspace(code);
              addToast('info', `Switched to workspace: ${ws.title || code}`);
            }
          },
          badge: code === roomCode ? 'Active' : ws.pinned ? 'Pinned' : undefined
        });
      });
    }

    return commands;
  }, [
    activeLocalNoteId,
    activeLocalNote,
    roomCode,
    roomTitle,
    isCodeMode,
    isReadOnly,
    isFullscreen,
    userWorkspaces,
    isOutlineOpen,
    theme,
    localNotes,
    onNavigateHome,
    onCreateNewRoom,
    onCreateLocalNote,
    onPublishNote,
    onSelectNote,
    onToggleCodeMode,
    onToggleLeftSidebar,
    onToggleRightSidebar,
    onToggleFullscreen,
    onToggleTheme,
    onToggleOutline,
    onToggleReadOnly,
    onOpenShortcuts,
    onExportTxt,
    onExportPdf,
    onCopyRoomLink,
    onCopyRoomCode,
    onApplyFormat,
    onChangePageWidth,
    onOpenInDocumentSearch,
    onChangeLanguage,
    onRunCode,
    addToast
  ]);

  // Categories list
  const categories = ['All', 'Workspace', 'Documents', 'Editor', 'Code Mode', 'Collaboration', 'Navigation'];

  // Filter commands by query & category
  const filteredCommands = useMemo(() => {
    let list = allCommands || [];
    const safeRecents = Array.isArray(recentCommandIds) ? recentCommandIds : [];

    if (selectedCategory !== 'All') {
      list = list.filter((cmd) => cmd?.category === selectedCategory);
    }

    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      // If query is empty, surface Recent Commands first if available
      if (safeRecents.length > 0) {
        const recents = safeRecents
          .map((id) => list.find((c) => c.id === id))
          .filter((c): c is CommandItem => Boolean(c));

        const nonRecents = list.filter((c) => !safeRecents.includes(c.id));
        return [...recents, ...nonRecents];
      }
      return list;
    }

    // Fuzzy / keyword scoring
    return list
      .map((cmd) => {
        let score = 0;
        const labelLower = (cmd.label || '').toLowerCase();
        const descLower = (cmd.description || '').toLowerCase();

        if (labelLower.startsWith(trimmed)) score += 100;
        else if (labelLower.includes(trimmed)) score += 60;

        if (descLower.includes(trimmed)) score += 30;

        (cmd.keywords || []).forEach((kw) => {
          if (kw.toLowerCase().startsWith(trimmed)) score += 40;
          else if (kw.toLowerCase().includes(trimmed)) score += 20;
        });

        return { cmd, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.cmd);
  }, [allCommands, selectedCategory, query, recentCommandIds]);

  // Clamp selection index when filteredCommands changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Execute command helper
  const handleExecute = (cmd: CommandItem) => {
    // Save to recents
    const safeRecents = Array.isArray(recentCommandIds) ? recentCommandIds : [];
    const updatedRecents = [cmd.id, ...safeRecents.filter((id) => id !== cmd.id)].slice(0, 8);
    setRecentCommandIds(updatedRecents);
    try {
      localStorage.setItem('livepad_recent_commands', JSON.stringify(updatedRecents));
    } catch {
      // ignore
    }

    onClose();
    setTimeout(() => {
      cmd.action();
    }, 50);
  };

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredCommands.length ? (prev + 1) % filteredCommands.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredCommands.length ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleExecute(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle categories with Tab
      const currCatIdx = categories.indexOf(selectedCategory);
      const nextCatIdx = (currCatIdx + 1) % categories.length;
      setSelectedCategory(categories[nextCatIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="livepad-command-palette-title"
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-101"
          onKeyDown={handleKeyDown}
        >
          {/* Top Search Input Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
            <span id="livepad-command-palette-title" className="sr-only">Command palette</span>
            <Search className="w-5 h-5 text-cyan-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search actions (e.g. theme, code, export)..."
              className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md">
                ESC
              </kbd>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-zinc-900/80 bg-white dark:bg-zinc-950 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/10 text-[#0ea5e9] dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Command List Container */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, index) => {
                const IconComponent = cmd.icon;
                const isSelected = index === selectedIndex;
                const isRecent = !query && recentCommandIds.includes(cmd.id);

                return (
                  <div
                    key={cmd.id}
                    data-selected={isSelected}
                    onClick={() => handleExecute(cmd)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`group px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/30 text-slate-900 dark:text-zinc-100'
                        : 'hover:bg-slate-100/70 dark:hover:bg-zinc-900/60 border border-transparent text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2 rounded-lg transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-cyan-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:text-cyan-500'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate">{cmd.label}</span>
                          {cmd.badge && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                              {cmd.badge}
                            </span>
                          )}
                          {isRecent && !query && (
                            <span className="flex items-center gap-1 text-[9px] font-mono font-semibold text-slate-400 dark:text-zinc-500">
                              <Clock className="w-2.5 h-2.5 text-cyan-500" /> Recent
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                          {cmd.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border border-slate-200/50 dark:border-zinc-800/50">
                        {cmd.category}
                      </span>

                      {cmd.shortcut && (
                        <div className="flex items-center gap-0.5">
                          {cmd.shortcut.map((key) => (
                            <kbd
                              key={key}
                              className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded shadow-2xs"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}

                      <ChevronRight
                        className={`w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-cyan-500 transition-colors ${
                          isSelected ? 'text-cyan-500 translate-x-0.5' : ''
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-zinc-700 animate-bounce" />
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                  No matching commands found
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-xs">
                  Try searching for terms like <span className="font-mono text-cyan-500">"theme"</span>,{' '}
                  <span className="font-mono text-cyan-500">"code"</span>,{' '}
                  <span className="font-mono text-cyan-500">"export"</span>, or{' '}
                  <span className="font-mono text-cyan-500">"new note"</span>.
                </p>
              </div>
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-slate-400 dark:text-zinc-500 select-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold">
                  ↵
                </kbd>{' '}
                Select
              </span>
              <span className="flex items-center gap-1 hidden sm:flex">
                <kbd className="px-1 py-0.2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded font-mono font-bold">
                  TAB
                </kbd>{' '}
                Switch Category
              </span>
            </div>

            <span className="font-mono font-bold text-cyan-500">LivePad Universal Command Center</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
