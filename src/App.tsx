import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { Platform, Logger, SessionRestoreManager } from './platform';
import { useDictationEngine } from './hooks/useDictationEngine';
const DictationToolbar = lazy(() => import('./components/dictation/DictationToolbar').then(m => ({ default: m.DictationToolbar })));
const DictationPreview = lazy(() => import('./components/dictation/DictationPreview').then(m => ({ default: m.DictationPreview })));
import { 
  Plus, 
  ArrowRight, 
  Copy, 
  Check, 
  Users, 
  Clock, 
  FileText, 
  Download, 
  Keyboard, 
  CloudOff, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  ChevronLeft,
  Settings,
  Edit2,
  RefreshCw,
  LogOut,
  Moon,
  Info,
  Layers,
  ChevronRight,
  Sun,
  ShieldAlert,
  Cloud,
  Share2,
  Laptop,
  Tv,
  WrapText,
  Smartphone,
  Shield,
  Zap,
  Activity,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  BookOpen,
  Tag,
  History,
  Trash2,
  Globe,
  Mic,
  MicOff,
  Code,
  Play,
  Terminal,
  FileCode,
  GraduationCap,
  Eye,
  Paperclip,
  Upload,
  Video,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Table,
  Minus,
  Link,
  Image as ImageIcon,
  RemoveFormatting,
  ListTree,
  Replace,
  Undo2,
  Redo2,
  PanelLeft,
  PanelRight,
  FilePlus,
  Folder,
  Archive,
  Home,
  Hash,
  RotateCcw,
  Trash,
  Pin,
  Star,
  Bookmark,
  FolderKanban,
  ExternalLink,
  ArrowUpDown,
  Edit3,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, isFirebaseConfigured, auth, ensureAuth, handleFirestoreError, OperationType, isFirestoreQuotaExhausted, markQuotaExhausted } from './lib/firebase';
import { getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useLiveRoom } from './hooks/useLiveRoom';
import { WorkspaceLibraryService, UserWorkspaceRef } from './services/workspaceLibraryService';
import { Theme, ToastMessage, UserPresence, LocalNotepad, TrashedNotepad, SyncStatus, Attachment, WorkspaceType, WorkspaceRole, WorkspacePrivacy } from './types';
import { generateRoomCode, normalizeRoomCode, validateRoomCodeFormat, WORKSPACE_TYPES } from './utils/workspace';
import BackgroundParticles from './components/BackgroundParticles';
import Logo from './components/Logo';
import CollaborativeCursors from './components/CollaborativeCursors';
import IntroScreen from './components/IntroScreen';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/Toast';
import DocumentToolbar from './components/DocumentToolbar';
import CompactHeader from './components/CompactHeader';
import SlashCommandMenu, { SLASH_COMMANDS, SlashCommand } from './components/SlashCommandMenu';
import ErrorBoundary from './components/ErrorBoundary';
import { useWorkspaceLayout } from './hooks/useWorkspaceLayout';
import WorkspaceStatusBar from './components/WorkspaceStatusBar';
const BottomConsolePanel = lazy(() => import('./components/BottomConsolePanel'));
const InspectorPanel = lazy(() => import('./components/InspectorPanel').then(m => ({ default: m.InspectorPanel })));
const ChatPanel = lazy(() => import('./components/collaboration/ChatPanel').then(m => ({ default: m.ChatPanel })));
const FloatingChatTrigger = lazy(() => import('./components/collaboration/ChatPanel').then(m => ({ default: m.FloatingChatTrigger })));
import { exportToTxt, exportToPdf, exportToDocx, exportToHtml, exportToMarkdown, exportToEpub, printDocument, convertHtmlToMarkdown } from './utils/exporters';
import { CODE_SNIPPETS, CodeSnippet } from './utils/snippets';
import RichTextEditor from './components/RichTextEditor';
const MarkdownPreviewPanel = lazy(() => import('./components/MarkdownPreviewPanel'));
import { WorkspaceCategory, canPerformAction, GlobalSystemRole } from './utils/workspaceCategories';
import { Editor } from '@tiptap/react';
import { useDesktopApp } from './hooks/useDesktopApp';
import { DesktopDashboard } from './components/desktop/DesktopDashboard';
import { DesktopHeader } from './components/desktop/DesktopHeader';
import { DesktopSetupWizard } from './components/desktop/DesktopSetupWizard';
import { hasCompletedDesktopSetup, getDesktopUserProfile, syncProfileToFirestore } from './utils/desktopProfile';
import { saveRecentWorkspace } from './utils/recentWorkspaces';
import { useOfflineSync } from './hooks/useOfflineSync';
import { OfflineBanner } from './components/desktop/OfflineBanner';
import { initOfflineDB, putOfflineItem, enqueueOfflineOp, dequeueOfflineOp } from './utils/offlineDB';
import { DocumentConflict } from './types';
import { useAppUI } from './state/AppUIContext';
import { usePWA } from './hooks/usePWA';
import { useDocumentPersistence } from './hooks/useDocumentPersistence';
import { useWorkspaceCommands } from './application/useWorkspaceCommands';

// Lazy-loaded heavy components for accelerated app startup & code splitting
const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal'));
const ExportPreviewModal = lazy(() => import('./components/ExportPreviewModal'));
const PrintConfirmationModal = lazy(() => import('./components/PrintConfirmationModal'));
const DocumentOutlineModal = lazy(() => import('./components/DocumentOutlineModal'));
const CodeWorkspace = lazy(() => import('./components/CodeWorkspace'));
const DeleteWorkspaceModal = lazy(() => import('./components/DeleteWorkspaceModal'));
const CreateWorkspaceModal = lazy(() => import('./components/CreateWorkspaceModal'));
const AdminDashboardModal = lazy(() => import('./components/AdminDashboardModal'));
const TeachingView = lazy(() => import('./components/CategoryViews/TeachingView'));
const StudyGroupView = lazy(() => import('./components/CategoryViews/StudyGroupView'));
const CodingSessionView = lazy(() => import('./components/CategoryViews/CodingSessionView'));
const PersonalWorkspaceView = lazy(() => import('./components/CategoryViews/PersonalWorkspaceView'));
const TeamCollaborationView = lazy(() => import('./components/CategoryViews/TeamCollaborationView'));
const ConflictResolutionModal = lazy(() => import('./components/ConflictResolutionModal').then(m => ({ default: m.default || m.ConflictResolutionModal })));

const ROOM_LABELS = [
  { name: 'Work', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/35 bg-blue-500/10 dark:bg-blue-500/20', dotBg: 'bg-blue-500' },
  { name: 'Personal', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-500/20', dotBg: 'bg-emerald-500' },
  { name: 'Urgent', bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 bg-rose-500/10 dark:bg-rose-500/20', dotBg: 'bg-rose-500' },
  { name: 'Study', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35 bg-amber-500/10 dark:bg-amber-500/20', dotBg: 'bg-amber-500' },
  { name: 'Brainstorm', bg: 'bg-[#8b5cf6]/15 text-[#8b5cf6] dark:text-[#a78bfa] border-[#8b5cf6]/35 bg-[#8b5cf6]/10 dark:bg-[#8b5cf6]/20', dotBg: 'bg-[#8b5cf6]' },
];

const formatHistoryTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

interface StructureItem {
  id: string;
  title: string;
  wordCount: number;
  charCount: number;
  percentage: number;
  preview: string;
  originalText: string;
  level?: number;
}

const getDocumentStructure = (content: string): {
  type: 'sections' | 'paragraphs' | 'empty';
  items: StructureItem[];
  totalWords: number;
  totalChars: number;
  paragraphCount: number;
  sectionCount: number;
} => {
  if (!content || !content.trim()) {
    return { type: 'empty', items: [], totalWords: 0, totalChars: 0, paragraphCount: 0, sectionCount: 0 };
  }

  const totalChars = content.length;
  const totalWords = content.trim().split(/\s+/).filter(Boolean).length;

  const lines = content.split(/\r?\n/);
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  const hasHeadings = lines.some(line => headingRegex.test(line));

  // Count raw paragraphs separated by blank lines
  const paragraphsRaw = content.split(/\n\s*\n+/).filter(p => p.trim());
  const paragraphCount = paragraphsRaw.length;

  // Count sections if headings present
  let sectionCount = 0;
  if (hasHeadings) {
    sectionCount = lines.filter(line => headingRegex.test(line)).length;
  }

  if (hasHeadings) {
    const items: StructureItem[] = [];
    let currentSection = {
      title: 'Introduction',
      level: 1,
      lines: [] as string[],
      headerLine: ''
    };

    lines.forEach((line, idx) => {
      const match = line.match(headingRegex);
      if (match) {
        // Save previous section if it has content or was initialized
        if (currentSection.lines.length > 0 || currentSection.title !== 'Introduction') {
          const sectionText = currentSection.lines.join('\n').trim();
          const words = sectionText ? sectionText.split(/\s+/).filter(Boolean).length : 0;
          const chars = sectionText.length;
          items.push({
            id: `sec-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            title: currentSection.title,
            level: currentSection.level,
            wordCount: words,
            charCount: chars,
            percentage: totalWords > 0 ? Math.round((words / totalWords) * 100) : 0,
            preview: sectionText ? (sectionText.length > 60 ? sectionText.substring(0, 60) + '...' : sectionText) : 'No content under this heading',
            originalText: currentSection.headerLine || currentSection.title
          });
        }
        currentSection = {
          title: match[2].trim(),
          level: match[1].length,
          lines: [],
          headerLine: line
        };
      } else {
        currentSection.lines.push(line);
      }
    });

    // Add trailing section
    const sectionText = currentSection.lines.join('\n').trim();
    const words = sectionText ? sectionText.split(/\s+/).filter(Boolean).length : 0;
    const chars = sectionText.length;
    items.push({
      id: `sec-last-${Math.random().toString(36).substring(2, 5)}`,
      title: currentSection.title,
      level: currentSection.level,
      wordCount: words,
      charCount: chars,
      percentage: totalWords > 0 ? Math.round((words / totalWords) * 100) : 0,
      preview: sectionText ? (sectionText.length > 60 ? sectionText.substring(0, 60) + '...' : sectionText) : 'No content under this heading',
      originalText: currentSection.headerLine || currentSection.title
    });

    return {
      type: 'sections',
      items,
      totalWords,
      totalChars,
      paragraphCount,
      sectionCount
    };
  } else {
    // Breakdown by paragraphs
    const items: StructureItem[] = paragraphsRaw.map((paragraph, idx) => {
      const pText = paragraph.trim();
      const words = pText.split(/\s+/).filter(Boolean).length;
      const chars = pText.length;
      
      // Extract first few words as title
      const cleanWords = pText.split(/\s+/);
      const title = cleanWords.slice(0, 4).join(' ') + (cleanWords.length > 4 ? '...' : '');

      return {
        id: `para-${idx}`,
        title: `Paragraph ${idx + 1}: ${title}`,
        wordCount: words,
        charCount: chars,
        percentage: totalWords > 0 ? Math.round((words / totalWords) * 100) : 0,
        preview: pText.length > 60 ? pText.substring(0, 60) + '...' : pText,
        originalText: paragraph
      };
    }).filter(item => item.wordCount > 0);

    return {
      type: 'paragraphs',
      items,
      totalWords,
      totalChars,
      paragraphCount,
      sectionCount: 0
    };
  }
};

const findEligibleBlocks = (content: string) => {
  const blocks: Array<{ id: string; startLine: number; endLine: number; startChar: number; endChar: number }> = [];
  const lines = content.split('\n');
  const stack: Array<{ lineIndex: number; charIndex: number }> = [];
  
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  let inHtmlComment = false;
  let absoluteCharIndex = 0;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    inLineComment = false;
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const nextChar = line[c + 1] || '';
      
      if (inBlockComment) {
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          c++;
        }
        continue;
      }
      if (inHtmlComment) {
        if (char === '-' && nextChar === '-' && line[c + 2] === '>') {
          inHtmlComment = false;
          c += 2;
        }
        continue;
      }
      if (inLineComment) {
        continue;
      }
      if (inString) {
        if (char === '\\') {
          c++;
          continue;
        }
        if (char === inString) {
          inString = null;
        }
        continue;
      }
      
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        c++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        c++;
        continue;
      }
      if (char === '<' && nextChar === '!' && line[c + 2] === '-' && line[c + 3] === '-') {
        inHtmlComment = true;
        c += 3;
        continue;
      }
      
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
      }
      
      if (char === '{') {
        stack.push({ lineIndex: l, charIndex: absoluteCharIndex + c });
      } else if (char === '}') {
        const start = stack.pop();
        if (start && start.lineIndex !== l) {
          const lineTrim = lines[start.lineIndex].trim().substring(0, 15);
          const blockId = `block-${start.lineIndex}-${lineTrim}`;
          blocks.push({
            id: blockId,
            startLine: start.lineIndex,
            endLine: l,
            startChar: start.charIndex,
            endChar: absoluteCharIndex + c
          });
        }
      }
    }
    absoluteCharIndex += line.length + 1;
  }
  return blocks.sort((a, b) => a.startLine - b.startLine);
};

const getFoldedDisplayState = (originalContent: string, foldedBlockIds: string[]) => {
  const originalLines = originalContent.split('\n');
  const blocks = findEligibleBlocks(originalContent);
  const activeFoldedBlocks = blocks.filter(b => foldedBlockIds.includes(b.id));

  const activeFoldsSorted = [...activeFoldedBlocks].sort((a, b) => a.startLine - b.startLine);
  const topLevelFolds: typeof blocks = [];
  let currentFoldEnd = -1;
  for (const fold of activeFoldsSorted) {
    if (fold.startLine > currentFoldEnd) {
      topLevelFolds.push(fold);
      currentFoldEnd = fold.endLine;
    }
  }

  const displayLines: string[] = [];
  const gutterLines: Array<{ originalIndex: number; label: string; isFoldItem: boolean; isFolded: boolean; blockId?: string }> = [];
  const lineToOriginalMap: number[] = [];

  let i = 0;
  while (i < originalLines.length) {
    const fold = topLevelFolds.find(f => f.startLine === i);
    if (fold) {
      const startLineText = originalLines[fold.startLine];
      const endLineText = originalLines[fold.endLine];
      const braceIdx = endLineText.lastIndexOf('}');
      const afterBrace = braceIdx !== -1 ? endLineText.substring(braceIdx) : '}';
      
      let foldDisplayText = startLineText;
      const idxOfBrace = foldDisplayText.lastIndexOf('{');
      if (idxOfBrace !== -1) {
        foldDisplayText = foldDisplayText.substring(0, idxOfBrace + 1) + ' ... ' + afterBrace;
      } else {
        foldDisplayText = foldDisplayText + ' ... ' + afterBrace;
      }
      
      displayLines.push(foldDisplayText);
      gutterLines.push({
        originalIndex: fold.startLine,
        label: String(fold.startLine + 1),
        isFoldItem: true,
        isFolded: true,
        blockId: fold.id
      });
      lineToOriginalMap.push(fold.startLine);
      i = fold.endLine + 1;
    } else {
      const isFoldStart = blocks.some(f => f.startLine === i);
      const matchingBlock = blocks.find(f => f.startLine === i);
      displayLines.push(originalLines[i]);
      gutterLines.push({
        originalIndex: i,
        label: String(i + 1),
        isFoldItem: isFoldStart,
        isFolded: false,
        blockId: matchingBlock?.id
      });
      lineToOriginalMap.push(i);
      i++;
    }
  }

  if (displayLines.length === 0) {
    displayLines.push('');
    gutterLines.push({ originalIndex: 0, label: '1', isFoldItem: false, isFolded: false });
    lineToOriginalMap.push(0);
  }

  return {
    displayContent: displayLines.join('\n'),
    displayLines,
    gutterLines,
    lineToOriginalMap
  };
};

const SaveTimeLabel = ({ lastSavedTime }: { lastSavedTime: number | null }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!lastSavedTime) return <>Saved just now</>;
  const seconds = Math.max(0, Math.floor((now - lastSavedTime) / 1000));
  if (seconds < 1) return <>Saved just now</>;
  if (seconds < 60) return <>Saved {seconds}s ago</>;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return <>Saved {minutes}m {remainingSeconds}s ago</>;
  const hours = Math.floor(minutes / 60);
  return <>Saved {hours}h {minutes % 60}m ago</>;
};

export default function App() {
  // Adaptive Workspace Layout Manager
  const layout = useWorkspaceLayout();

  // Floating Workspace Chat Panel State
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Active Tiptap Editor Instance
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const [showIntro, setShowIntro] = useState<boolean>(true);
  const { isDesktopApp, desktopTab, setDesktopTab } = useDesktopApp();
  const [showDesktopSetup, setShowDesktopSetup] = useState<boolean>(() => {
    return isDesktopApp && !hasCompletedDesktopSetup();
  });

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    if (isDesktopApp && !hasCompletedDesktopSetup()) {
      setShowDesktopSetup(true);
    }
  }, [isDesktopApp]);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState<boolean>(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState<boolean>(false);
  const [printTargetTitle, setPrintTargetTitle] = useState<string>('');
  const [isSplitPreviewOpen, setIsSplitPreviewOpen] = useState<boolean>(false);
  const [isSplitPreviewExpanded, setIsSplitPreviewExpanded] = useState<boolean>(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState<boolean>(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [globalRole, setGlobalRole] = useState<GlobalSystemRole>('user');

  const [foldedBlockIds, setFoldedBlockIds] = useState<string[]>([]);
  const [floatingMenuCoords, setFloatingMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('livepad_username') || '';
  });
  const [nameInput, setNameInput] = useState<string>(userName);
  const { theme, setTheme, workspaceCategory, setWorkspaceCategory, notepadViewMode, setNotepadViewMode, sidebarOpen, setSidebarOpen, leftSidebarOpen, setLeftSidebarOpen, isCodeMode, setIsCodeMode, isFullscreen, setIsFullscreen, commandPaletteOpen, setCommandPaletteOpen, searchOpen, setSearchOpen, searchQuery, setSearchQuery, activeMatchIndex, setActiveMatchIndex } = useAppUI();

  // Global Toast Notifications Registry
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = useCallback(
    (
      type: 'success' | 'error' | 'info' | 'conflict',
      message: string,
      options?: { actionLabel?: string; onAction?: () => void; conflictData?: DocumentConflict }
    ) => {
      const id = Math.random().toString(36).substring(2, 7);
      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          message,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
          conflictData: options?.conflictData,
        },
      ]);
      if (type !== 'conflict') {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
      }
    },
    []
  );

  // PWA lifecycle is isolated from the main application render tree.
  // PWA is intentionally retained; this hook only removes its boot-time state
  // and event listeners from the 8k-line App component.
  const {
    needRefresh,
    offlineReady,
    isInstallable,
    isAppInstalled,
    handleInstallApp,
    updateServiceWorker,
    dismissUpdate,
  } = usePWA(addToast);

  const [conflictModalData, setConflictModalData] = useState<DocumentConflict | null>(null);

  const handleConflictDetected = useCallback((conflict: DocumentConflict) => {
    addToast(
      'conflict',
      `Document conflict detected for "${conflict.documentTitle}" upon re-establishing connection.`,
      {
        actionLabel: 'Resolve',
        onAction: () => {
          setConflictModalData(conflict);
        },
        conflictData: conflict,
      }
    );
  }, [addToast]);

  // Offline architecture synchronization hook
  const offlineSync = useOfflineSync(
    (msg) => {
      addToast('success', msg);
    },
    handleConflictDetected
  );

  const handleResolveConflict = async (
    resolvedContent: string,
    resolutionType: 'local' | 'remote' | 'merged'
  ) => {
    if (!conflictModalData) return;

    const docId = conflictModalData.documentId;

    // 1. Local-first update to IndexedDB primary store
    await putOfflineItem('documents', {
      id: docId,
      content: resolvedContent,
      updatedAt: Date.now(),
    });

    // 2. Update local state if active
    if (roomCode === docId) {
      handleUpdateContent(resolvedContent);
    } else if (activeLocalNoteId === docId) {
      const updated = localNotes.map((n) =>
        n.id === docId ? { ...n, content: resolvedContent, updatedAt: Date.now() } : n
      );
      setLocalNotes(updated);
      localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    }

    // 3. Write resolved state to Firestore
    if (isFirebaseConfigured && db && navigator.onLine && !isFirestoreQuotaExhausted()) {
      try {
        await ensureAuth();
        const roomRef = doc(db, 'rooms', docId);
        await setDoc(roomRef, { content: resolvedContent, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        if (String(e).includes('resource-exhausted') || String(e).includes('Quota')) {
          markQuotaExhausted();
        } else {
          console.warn('[handleResolveConflict] Firestore write error:', e);
        }
      }
    }

    // 4. Remove queue item
    if (conflictModalData.queueItemId) {
      await dequeueOfflineOp(conflictModalData.queueItemId);
      await offlineSync.refreshQueue();
    }

    addToast('success', `Conflict resolved (${resolutionType} version applied)!`);
  };

  // Active view router: leverages URL parameter matching
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room')?.toUpperCase() || null;
  });

  // ========== LOCAL NOTEPAD MANAGEMENT REGISTRY ==========
  const [localNotes, setLocalNotes] = useState<LocalNotepad[]>(() => {
    const saved = localStorage.getItem('livepad_local_notepads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback on parser crash
      }
    }
    const defaults: LocalNotepad[] = [
      {
        id: 'welcome-notes',
        title: 'Quick Checklist & Notepad Guide 📝',
        content: `Welcome to your personal private Notepad!\n\nThis is an offline-first workspace saved directly on your browser. It works exactly like a default Notes application with powerful developer workflows!\n\n🚀 NEW FEATURES ADDED:\n★ HTML & JS Code Playgrounds: Switch matching tabs to write web layouts or scripts with live sandbox renderers and developer execution consoles!\n★ Built-in Snippet Library: Browse code templates from the top-bar dropdown. Effortlessly insert snippets directly at your cursor or replace editor content entirely!\n★ Focus Mode & Auto-Collapse: Hit "Focus Mode" (Alt + F) to remove distractions. The system automatically collapses the workspace sidebar after 3 seconds of inactivity to keep your view completely clean!\n\nCORE FEATURES:\n✓ Instant Auto-saving as you type\n✓ Fully customizable document title\n✓ Offline private writing (no internet required)\n✓ Easy Publishing to a shared collaborative live room!\n\nFeel free to clear this note, rename it, or click "+ New Note" in the sidebar to make a separate document!`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'shopping-list',
        title: 'My Daily Ideas & Shopping List 🛒',
        content: `My Private To-do & Inspiration Board:\n\n- Write daily journals ✍\n- Feed the cat 🐱\n- Groceries:\n  [ ] Fresh avocados 🥑\n  [ ] Whole grain bread 🍞\n  [ ] Almond milk 🥛\n  [ ] Blueberries 🫐\n\n- Coding/App ideas to brainstorm next...`,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 1800000
      }
    ];
    localStorage.setItem('livepad_local_notepads', JSON.stringify(defaults));
    return defaults;
  });

  // Hydrate & mirror local documents into IndexedDB (LivePadDB)
  useEffect(() => {
    initOfflineDB()
      .then(() => {
        localNotes.forEach((note) => {
          putOfflineItem('documents', { id: note.id, ...note });
        });
      })
      .catch((err) => {
        console.warn('LivePadDB hydration error:', err);
      });
  }, [localNotes]);

  // ========== TRASH BIN MANAGEMENT REGISTRY ==========
  const [trashedNotes, setTrashedNotes] = useState<TrashedNotepad[]>(() => {
    const saved = localStorage.getItem('livepad_trashed_notepads');
    if (saved) {
      try {
        const parsed: TrashedNotepad[] = JSON.parse(saved);
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const nowMs = Date.now();
        const valid = parsed.filter(n => nowMs - n.deletedAt <= thirtyDaysMs);
        if (valid.length !== parsed.length) {
          localStorage.setItem('livepad_trashed_notepads', JSON.stringify(valid));
        }
        return valid;
      } catch (e) {
        // Fallback on parser crash
      }
    }
    return [];
  });

  // ========== USER SAVED WORKSPACES LIBRARY ==========
  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspaceRef[]>([]);

  useEffect(() => {
    const currentUid = auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
    const unsub = WorkspaceLibraryService.subscribeUserLibrary(currentUid, (items) => {
      setUserWorkspaces(items);
    });
    return () => {
      unsub();
    };
  }, [auth?.currentUser?.uid]);

  const handleTogglePinWorkspace = async (e: MouseEvent, wsId: string, currentPinned: boolean) => {
    e.stopPropagation();
    const currentUid = auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
    await WorkspaceLibraryService.togglePin(currentUid, wsId, !currentPinned);
  };

  const handleToggleFavoriteWorkspace = async (e: MouseEvent, wsId: string, currentFav: boolean) => {
    e.stopPropagation();
    const currentUid = auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
    await WorkspaceLibraryService.toggleFavorite(currentUid, wsId, !currentFav);
  };

  const handleRemoveWorkspaceFromNotes = async (e: MouseEvent, wsId: string) => {
    e.stopPropagation();
    const currentUid = auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
    await WorkspaceLibraryService.removeFromLibrary(currentUid, wsId);
    addToast('info', 'Workspace removed from your personal library & notes.');
  };

  const handleDeleteWorkspacePermanently = async (e: MouseEvent, wsId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this online workspace? This action cannot be undone.')) {
      return;
    }
    const currentUid = auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
    await WorkspaceLibraryService.deleteWorkspacePermanently(currentUid, wsId);
    addToast('success', 'Workspace permanently deleted.');
    if (roomCode === wsId) {
      handleNavigateRoom(null);
    }
  };

  // Toggle for Landing Page Personal Notepad section ('active' | 'workspaces' | 'trash')


  // Auto-purge expired trashed notes (>30 days) on load & when trashedNotes updates
  useEffect(() => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const valid = trashedNotes.filter(n => nowMs - n.deletedAt <= thirtyDaysMs);
    if (valid.length !== trashedNotes.length) {
      setTrashedNotes(valid);
      localStorage.setItem('livepad_trashed_notepads', JSON.stringify(valid));
    }
  }, []);

  const getDaysRemainingInTrash = (deletedAt: number): number => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - deletedAt;
    const remainingMs = thirtyDaysMs - elapsed;
    return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  };

  const [activeLocalNoteId, setActiveLocalNoteId] = useState<string | null>(() => {
    return localStorage.getItem('livepad_active_local_note_id') || null;
  });

  const handleCreateLocalNote = () => {
    const newId = 'note-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newNote: LocalNotepad = {
      id: newId,
      title: 'New Note ' + (localNotes.length + 1),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [newNote, ...localNotes];
    setLocalNotes(updated);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    setActiveLocalNoteId(newId);
    localStorage.setItem('livepad_active_local_note_id', newId);
    setRoomCode(null);
    window.history.pushState({}, '', window.location.pathname);
    addToast('success', 'Created a new custom local document!');
  };

  const handleTogglePinNote = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    const updated = localNotes.map(n => {
      if (n.id === id) {
        const nextPinned = !(n as any).pinned;
        return { ...n, pinned: nextPinned };
      }
      return n;
    });
    setLocalNotes(updated);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    addToast('info', 'Note pin status updated.');
  };

  const handleDuplicateLocalNote = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    const target = localNotes.find(n => n.id === id);
    if (!target) return;
    const newId = 'note-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newNote: LocalNotepad = {
      ...target,
      id: newId,
      title: `${target.title || 'Note'} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [newNote, ...localNotes];
    setLocalNotes(updated);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    addToast('success', `Duplicated "${target.title || 'Note'}".`);
  };

  const handleStartRenameNote = (id: string, currentTitle: string, e?: any) => {
    if (e) e.stopPropagation();
    setEditingNoteId(id);
    setEditingNoteTitle(currentTitle || '');
  };

  const handleSaveRenameNote = (id: string) => {
    if (!editingNoteTitle.trim()) {
      setEditingNoteId(null);
      return;
    }
    const updated = localNotes.map(n => {
      if (n.id === id) {
        return { ...n, title: editingNoteTitle.trim(), updatedAt: Date.now() };
      }
      return n;
    });
    setLocalNotes(updated);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    setEditingNoteId(null);
    addToast('success', 'Note renamed successfully!');
  };

  // Sync recent workspaces for Desktop PWA & Dashboard
  useEffect(() => {
    if (roomCode) {
      saveRecentWorkspace({
        id: roomCode,
        code: roomCode,
        title: `Workspace #${roomCode}`,
        category: 'coding_session',
        lastAccessedAt: Date.now(),
        isLocal: false,
      });
    } else if (activeLocalNoteId) {
      const activeNote = localNotes.find((n) => n.id === activeLocalNoteId);
      saveRecentWorkspace({
        id: activeLocalNoteId,
        code: activeLocalNoteId,
        title: activeNote?.title || 'Private Scratchpad',
        category: 'personal',
        lastAccessedAt: Date.now(),
        isLocal: true,
      });
    }
  }, [roomCode, activeLocalNoteId, localNotes]);

  // Word sizing helper state
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [activeCursorPos, setActiveCursorPos] = useState<number>(0);

  // Inspector Panel Customization States
  const [wordWrap, setWordWrap] = useState<boolean>(true);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [fontFamily, setFontFamily] = useState<string>('inter');
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [canvasWidth, setCanvasWidth] = useState<'standard' | 'wide' | 'full'>('standard');

  // Autocomplete state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<{ label: string; type: "keyword" | "tag" | "property" | "builtin"; snippet?: string }[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState<number>(0);
  const [autocompletePosition, setAutocompletePosition] = useState<{ top: number; left: number } | null>(null);
  const [autocompleteWordStart, setAutocompleteWordStart] = useState<number>(0);

  // Phase 4 - Editor & Writing Experience States
  const [pageWidth, setPageWidth] = useState<'narrow' | 'medium' | 'full'>(() => {
    const saved = localStorage.getItem('livepad_page_width');
    return (saved === 'narrow' || saved === 'medium' || saved === 'full') ? saved : 'medium';
  });
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState<boolean>(false);
  const [slashQuery, setSlashQuery] = useState<string>('');
  const [slashIndex, setSlashIndex] = useState<number>(0);
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number } | null>(null);

  // Undo/Redo Stack
  const historyStackRef = useRef<string[]>(['']);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Find and Replace Extension
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [replaceMode, setReplaceMode] = useState<boolean>(false);

  const handlePageWidthChange = (width: 'narrow' | 'medium' | 'full') => {
    setPageWidth(width);
    localStorage.setItem('livepad_page_width', width);
    addToast('info', `Document layout set to ${width}.`);
  };

  const addToHistory = (content: string) => {
    if (historyStackRef.current[historyIndexRef.current] === content) return;
    const newStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    newStack.push(content);
    if (newStack.length > 100) newStack.shift();
    historyStackRef.current = newStack;
    historyIndexRef.current = newStack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < newStack.length - 1);
  };

  const handleUndo = () => {
    if (editorInstance && !editorInstance.isDestroyed && editorInstance.can?.()?.undo?.()) {
      editorInstance.chain().focus().undo().run();
      addToast('info', 'Undo applied');
      return;
    }
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevContent = historyStackRef.current[historyIndexRef.current];
      if (editorInstance) {
        editorInstance.commands.setContent(prevContent);
      } else {
        handleUpdateContent(prevContent);
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
      addToast('info', 'Undo applied');
    }
  };

  const handleRedo = () => {
    if (editorInstance && !editorInstance.isDestroyed && editorInstance.can?.()?.redo?.()) {
      editorInstance.chain().focus().redo().run();
      addToast('info', 'Redo applied');
      return;
    }
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextContent = historyStackRef.current[historyIndexRef.current];
      if (editorInstance) {
        editorInstance.commands.setContent(nextContent);
      } else {
        handleUpdateContent(nextContent);
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
      addToast('info', 'Redo applied');
    }
  };

  // Auto-Collapse Sidebar State & Handler
  const [autoCollapseEnabled, setAutoCollapseEnabled] = useState<boolean>(true);

  const toggleAutoCollapse = () => {
    setAutoCollapseEnabled((prev) => {
      const next = !prev;
      addToast('info', next ? 'Sidebar auto-collapse enabled (3s inactivity).' : 'Sidebar auto-collapse disabled. Sidebar pinned.');
      return next;
    });
  };

  // Auto-hide Inspector 3 seconds after a NEW workspace/note is created/opened for the first time
  useEffect(() => {
    const activeDocId = roomCode || activeLocalNoteId;
    if (!activeDocId || showIntro) return;

    const storageKey = `livepad_autohide_done_${activeDocId}`;
    const alreadyAutoHidden = localStorage.getItem(storageKey);

    if (!alreadyAutoHidden && autoCollapseEnabled) {
      // 1. Open Inspector automatically
      layout.setRightOpen(true);

      // 2. Wait exactly 3 seconds then slide away automatically
      const timer = setTimeout(() => {
        layout.setRightOpen(false);
        localStorage.setItem(storageKey, 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [roomCode, activeLocalNoteId, showIntro, autoCollapseEnabled, layout.setRightOpen]);

  const handleApplyFormat = (formatType: string, extraData?: any) => {
    if (!editorInstance) return;

    if (formatType === 'bold') editorInstance.chain().focus().toggleBold().run();
    else if (formatType === 'italic') editorInstance.chain().focus().toggleItalic().run();
    else if (formatType === 'underline') editorInstance.chain().focus().toggleUnderline().run();
    else if (formatType === 'strikethrough') editorInstance.chain().focus().toggleStrike().run();
    else if (formatType === 'code') editorInstance.chain().focus().toggleCode().run();
    else if (formatType === 'highlight') editorInstance.chain().focus().toggleHighlight({ color: '#fef08a' }).run();
    else if (formatType === 'h1') editorInstance.chain().focus().toggleHeading({ level: 1 }).run();
    else if (formatType === 'h2') editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
    else if (formatType === 'h3') editorInstance.chain().focus().toggleHeading({ level: 3 }).run();
    else if (formatType === 'paragraph') editorInstance.chain().focus().setParagraph().run();
    else if (formatType === 'bullet-list') editorInstance.chain().focus().toggleBulletList().run();
    else if (formatType === 'numbered-list') editorInstance.chain().focus().toggleOrderedList().run();
    else if (formatType === 'checklist') editorInstance.chain().focus().toggleTaskList().run();
    else if (formatType === 'quote') editorInstance.chain().focus().toggleBlockquote().run();
    else if (formatType === 'table') editorInstance.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    else if (formatType === 'divider') editorInstance.chain().focus().setHorizontalRule().run();
    else if (formatType === 'font-size') {
      if (extraData) editorInstance.chain().focus().setFontSize(extraData).run();
    } else if (formatType === 'color') {
      if (extraData) editorInstance.chain().focus().setColor(extraData).run();
    } else if (formatType === 'clear') {
      editorInstance.chain().focus().unsetAllMarks().clearNodes().run();
    }
  };

  const applySlashCommand = (cmd: SlashCommand) => {
    if (!editorInstance) return;

    if (cmd.id === 'h1') editorInstance.chain().focus().toggleHeading({ level: 1 }).run();
    else if (cmd.id === 'h2') editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
    else if (cmd.id === 'h3') editorInstance.chain().focus().toggleHeading({ level: 3 }).run();
    else if (cmd.id === 'bullet') editorInstance.chain().focus().toggleBulletList().run();
    else if (cmd.id === 'number') editorInstance.chain().focus().toggleOrderedList().run();
    else if (cmd.id === 'task') editorInstance.chain().focus().toggleTaskList().run();
    else if (cmd.id === 'quote') editorInstance.chain().focus().toggleBlockquote().run();
    else if (cmd.id === 'table') editorInstance.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    else if (cmd.id === 'divider') editorInstance.chain().focus().setHorizontalRule().run();
    else {
      editorInstance.chain().focus().insertContent(cmd.snippet).run();
    }
    setSlashMenuOpen(false);
    setSlashQuery('');
  };

  const handleJumpToHeading = (lineNumber: number) => {
    if (!editorInstance) return;
    editorInstance.commands.focus();
  };

  const applySizeToSelection = (fontSize: number) => {
    if (!editorInstance) {
      addToast('info', 'Highlight or select a word/phrase in the editor first!');
      return;
    }
    editorInstance.chain().focus().setFontSize(`${fontSize}px`).run();
    addToast('success', `Formatted selected word with ${fontSize}px size!`);
  };

  const mapDisplayPosToOriginalPos = (displayPos: number, originalContent: string, foldedIds: string[]): number => {
    const { displayLines, lineToOriginalMap } = getFoldedDisplayState(originalContent, foldedIds);
    const originalLines = originalContent.split('\n');
    
    let currentPos = 0;
    let displayLineIdx = -1;
    let displayColIdx = -1;
    for (let i = 0; i < displayLines.length; i++) {
      const lineLen = displayLines[i].length + 1; // +1 for newline character
      if (displayPos >= currentPos && displayPos < currentPos + lineLen) {
        displayLineIdx = i;
        displayColIdx = displayPos - currentPos;
        break;
      }
      currentPos += lineLen;
    }
    
    if (displayLineIdx === -1) {
      return originalContent.length;
    }
    
    const originalLineIdx = lineToOriginalMap[displayLineIdx];
    if (originalLineIdx === undefined) {
      return originalContent.length;
    }
    let originalOffset = 0;
    for (let i = 0; i < originalLineIdx; i++) {
      if (originalLines[i] !== undefined) {
        originalOffset += originalLines[i].length + 1;
      }
    }
    return originalOffset + displayColIdx;
  };

  const mapOriginalPosToDisplayPos = (originalPos: number, originalContent: string, foldedIds: string[]): number => {
    const { displayLines, lineToOriginalMap } = getFoldedDisplayState(originalContent, foldedIds);
    const originalLines = originalContent.split('\n');
    
    let currentRawPos = 0;
    let originalLineIdx = -1;
    let colIdx = -1;
    for (let i = 0; i < originalLines.length; i++) {
      const lineLen = originalLines[i].length + 1;
      if (originalPos >= currentRawPos && originalPos < currentRawPos + lineLen) {
        originalLineIdx = i;
        colIdx = originalPos - currentRawPos;
        break;
      }
      currentRawPos += lineLen;
    }
    
    if (originalLineIdx === -1) {
      return originalPos;
    }
    
    const displayLineIdx = lineToOriginalMap.indexOf(originalLineIdx);
    if (displayLineIdx === -1) {
      return 0;
    }
    
    let displayOffset = 0;
    for (let i = 0; i < displayLineIdx; i++) {
      if (displayLines[i] !== undefined) {
        displayOffset += displayLines[i].length + 1;
      }
    }
    return displayOffset + colIdx;
  };

  const updateFloatingMenuCoords = (range: { start: number; end: number } | null = selectionRange) => {
    if (!range || range.start === range.end) {
      setFloatingMenuCoords(null);
      return;
    }
    
    requestAnimationFrame(() => {
      const marker = document.getElementById('livepad-selection-marker');
      if (marker) {
        const markerRect = marker.getBoundingClientRect();
        const parentElement = textareaRef.current?.parentElement;
        if (parentElement) {
          const parentRect = parentElement.getBoundingClientRect();
          
          const x = markerRect.left + (markerRect.width / 2) - parentRect.left;
          const y = markerRect.top - parentRect.top;
          
          setFloatingMenuCoords({ x, y });
        }
      }
    });
  };

  const applyStyleToSelection = (styleType: 'bold' | 'italic' | 'underline') => {
    if (editorInstance) {
      if (styleType === 'bold') {
        editorInstance.chain().focus().toggleBold().run();
      } else if (styleType === 'italic') {
        editorInstance.chain().focus().toggleItalic().run();
      } else if (styleType === 'underline') {
        editorInstance.chain().focus().toggleUnderline().run();
      }
      addToast('success', `${styleType.charAt(0).toUpperCase() + styleType.slice(1)} formatting applied!`);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea || !selectionRange) {
      addToast('info', 'Highlight or select some text first!');
      return;
    }
    const { start, end } = selectionRange;
    
    let tagOpen = '';
    let tagClose = '';
    if (styleType === 'bold') {
      tagOpen = '<b>';
      tagClose = '</b>';
    } else if (styleType === 'italic') {
      tagOpen = '<i>';
      tagClose = '</i>';
    } else if (styleType === 'underline') {
      tagOpen = '<u>';
      tagClose = '</u>';
    }

    let currentVal = editorContent;
    let startInRaw = start;
    let endInRaw = end;

    if (isCodeMode) {
      startInRaw = mapDisplayPosToOriginalPos(start, editorContent, foldedBlockIds);
      endInRaw = mapDisplayPosToOriginalPos(end, editorContent, foldedBlockIds);
    }

    const selection = currentVal.substring(startInRaw, endInRaw);
    let newSelectionText = '';
    if (selection.startsWith(tagOpen) && selection.endsWith(tagClose)) {
      newSelectionText = selection.substring(tagOpen.length, selection.length - tagClose.length);
    } else {
      newSelectionText = `${tagOpen}${selection}${tagClose}`;
    }

    const beforeStr = currentVal.substring(0, startInRaw);
    const afterStr = currentVal.substring(endInRaw);
    const newContent = beforeStr + newSelectionText + afterStr;

    handleUpdateContent(newContent);
    addToast('success', `${styleType.charAt(0).toUpperCase() + styleType.slice(1)} formatting applied!`);

    setTimeout(() => {
      const freshContainer = textareaRef.current;
      if (!freshContainer) return;
      freshContainer.focus();
      
      if (isCodeMode) {
        const newDisplayStart = mapOriginalPosToDisplayPos(startInRaw, newContent, foldedBlockIds);
        const newDisplayEnd = newDisplayStart + newSelectionText.length;
        freshContainer.setSelectionRange(newDisplayStart, newDisplayEnd);
        setSelectedText(newSelectionText);
        setSelectionRange({ start: newDisplayStart, end: newDisplayEnd });
        updateFloatingMenuCoords({ start: newDisplayStart, end: newDisplayEnd });
      } else {
        const newEnd = start + newSelectionText.length;
        freshContainer.setSelectionRange(start, newEnd);
        setSelectedText(newSelectionText);
        setSelectionRange({ start, end: newEnd });
        updateFloatingMenuCoords({ start, end: newEnd });
      }
    }, 50);
  };

  const handleCopySelectionAsMarkdown = async () => {
    let markdownText = '';

    if (editorInstance) {
      const { from, to } = editorInstance.state.selection;
      if (from !== to) {
        try {
          const { DOMSerializer } = await import('@tiptap/pm/model');
          const fragment = editorInstance.state.selection.content().content;
          const dom = DOMSerializer.fromSchema(editorInstance.schema).serializeFragment(fragment);
          const div = document.createElement('div');
          div.appendChild(dom);
          const html = div.innerHTML;
          markdownText = convertHtmlToMarkdown(html);
        } catch {
          const text = editorInstance.state.doc.textBetween(from, to, ' ');
          markdownText = convertHtmlToMarkdown(text);
        }
      }
    }

    if (!markdownText && selectedText) {
      markdownText = convertHtmlToMarkdown(selectedText);
    }

    if (!markdownText && selectionRange && textareaRef.current) {
      const rawSelected = editorContent.substring(selectionRange.start, selectionRange.end);
      markdownText = convertHtmlToMarkdown(rawSelected);
    }

    if (!markdownText) {
      addToast('info', 'Highlight or select some text first!');
      return;
    }

    try {
      await navigator.clipboard.writeText(markdownText);
      setCopiedMarkdown(true);
      addToast('success', 'Copied selected text as Markdown!');
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = markdownText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMarkdown(true);
      addToast('success', 'Copied selected text as Markdown!');
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  useEffect(() => {
    const handleDocumentClick = (e: globalThis.MouseEvent) => {
      const textarea = textareaRef.current;
      const menu = document.getElementById('livepad-floating-formatting-menu');
      if (textarea && menu) {
        const target = e.target as HTMLElement;
        if (!textarea.contains(target) && !menu.contains(target)) {
          setSelectedText('');
          setSelectionRange(null);
          setFloatingMenuCoords(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const handleDeleteLocalNote = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    const noteToDelete = localNotes.find(n => n.id === id);
    if (!noteToDelete) return;

    const updatedLocal = localNotes.filter(n => n.id !== id);
    setLocalNotes(updatedLocal);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updatedLocal));

    const trashedItem: TrashedNotepad = {
      ...noteToDelete,
      deletedAt: Date.now()
    };
    const updatedTrash = [trashedItem, ...trashedNotes.filter(n => n.id !== id)];
    setTrashedNotes(updatedTrash);
    localStorage.setItem('livepad_trashed_notepads', JSON.stringify(updatedTrash));

    if (activeLocalNoteId === id) {
      if (updatedLocal.length > 0) {
        setActiveLocalNoteId(updatedLocal[0].id);
        localStorage.setItem('livepad_active_local_note_id', updatedLocal[0].id);
      } else {
        setActiveLocalNoteId(null);
        localStorage.removeItem('livepad_active_local_note_id');
      }
    }
    addToast('info', `"${noteToDelete.title || 'Note'}" moved to Trash Bin. Restorable for 30 days.`);
  };

  const handleRestoreNote = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    const noteToRestore = trashedNotes.find(n => n.id === id);
    if (!noteToRestore) return;

    const updatedTrash = trashedNotes.filter(n => n.id !== id);
    setTrashedNotes(updatedTrash);
    localStorage.setItem('livepad_trashed_notepads', JSON.stringify(updatedTrash));

    const restoredNote: LocalNotepad = {
      id: noteToRestore.id,
      title: noteToRestore.title,
      content: noteToRestore.content,
      createdAt: noteToRestore.createdAt,
      updatedAt: Date.now(),
      attachments: noteToRestore.attachments
    };

    const updatedLocal = [restoredNote, ...localNotes.filter(n => n.id !== id)];
    setLocalNotes(updatedLocal);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updatedLocal));

    addToast('success', `Restored "${restoredNote.title || 'Note'}" to active notes.`);
  };

  const handlePermanentDeleteNote = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    const noteToDelete = trashedNotes.find(n => n.id === id);
    const updatedTrash = trashedNotes.filter(n => n.id !== id);
    setTrashedNotes(updatedTrash);
    localStorage.setItem('livepad_trashed_notepads', JSON.stringify(updatedTrash));
    addToast('info', `Permanently deleted "${noteToDelete?.title || 'Note'}".`);
  };

  const handleEmptyTrash = () => {
    if (trashedNotes.length === 0) return;
    setShowEmptyTrashModal(true);
  };

  const confirmEmptyTrash = () => {
    if (trashedNotes.length === 0) return;
    const count = trashedNotes.length;
    setTrashedNotes([]);
    localStorage.removeItem('livepad_trashed_notepads');
    setShowEmptyTrashModal(false);
    addToast('info', `Permanently deleted ${count} note${count === 1 ? '' : 's'} from Trash Bin.`);
  };

  const handleNavigateToLocalNote = (id: string) => {
    setActiveLocalNoteId(id);
    localStorage.setItem('livepad_active_local_note_id', id);
    setRoomCode(null);
    window.history.pushState({}, '', window.location.pathname);
    addToast('success', 'Switched to private note.');
  };

  const handlePublishLocalNote = async () => {
    const activeNote = localNotes.find(n => n.id === activeLocalNoteId);
    if (!activeNote) {
      addToast('error', 'Select a personal notepad document to publish.');
      return;
    }
    
    setIsCreatingRoom(true);
    const uniqueRoomCode = generateRoomCode();
    try {
      if (isFirebaseConfigured && db && !isFirestoreQuotaExhausted()) {
        const cloudUser = await ensureAuth();
        if (!cloudUser) throw new Error('Authentication is required to publish a note.');
        await setDoc(doc(db, 'rooms', uniqueRoomCode), {
          workspaceId: uniqueRoomCode,
          roomCode: uniqueRoomCode,
          workspaceName: activeNote.title || 'Published Note',
          title: activeNote.title || 'Published Note',
          privacy: 'public',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ownerId: cloudUser.uid,
          ownerName: userName || 'Anonymous Writer',
          createdBy: cloudUser.uid,
          creatorId: cloudUser.uid,
          creatorRole: 'owner',
          workspaceRoleVersion: 2,
          participantLimit: 50,
          defaultRole: 'member',
          participants: {
            [cloudUser.uid]: {
              uid: cloudUser.uid,
              name: userName || 'Anonymous Writer',
              role: 'owner',
              joinedAt: Date.now()
            }
          },
          permissions: { allowGuestEdit: false, allowChat: true, allowExport: true },
          content: activeNote.content || '',
          users: {},
          typingUsers: {},
          attachments: []
        });
      } else {
        localStorage.setItem(
          `livepad_local_room_${uniqueRoomCode}`,
          activeNote.content || ''
        );
      }
      
      handleNavigateRoom(uniqueRoomCode);
      addToast('success', `Published Note to Live Room ${uniqueRoomCode}!`);
      
      // Copy URL to clipboard
      try {
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${uniqueRoomCode}`;
        await navigator.clipboard.writeText(shareUrl);
        addToast('success', 'Collaborative URL copied to clipboard!');
      } catch (clipErr) {
        // Fallback if clipboard API not formatted/available in iframe
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to publish notepad note to cloud database.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleNavigateRoom = async (roomId: string | null): Promise<boolean> => {
    if (!roomId) {
      const newUrl = window.location.pathname;
      window.history.pushState({}, '', newUrl);
      setRoomCode(null);
      refresh();
      return true;
    }

    const { valid, message, cleanCode } = validateRoomCodeFormat(roomId);
    if (!valid || !cleanCode) {
      addToast('error', message || 'Invalid room code format.');
      return false;
    }

    let roomExists = false;
    let roomData: any = null;

    // Verify cloud rooms only when a real Firebase user is available. If Auth is
    // unavailable, use the local room descriptor for same-browser collaboration
    // instead of failing the join with a Firestore permission error.
    if (isFirebaseConfigured && db) {
      try {
        const cloudUser = await ensureAuth();
        if (!cloudUser) {
          try {
            const rawMeta = localStorage.getItem(`livepad_local_room_meta_${cleanCode}`);
            const localMeta = rawMeta ? JSON.parse(rawMeta) : null;
            if (localMeta && typeof localMeta === 'object') { roomExists = true; roomData = localMeta; }
          } catch {}
        } else {
          const docRef = doc(db, 'rooms', cleanCode);
        let docSnap = await getDoc(docRef);

        // Fallback checks for case or formatting variations if primary cleanCode lookup returns empty
        if (!docSnap.exists()) {
          const rawTrimmed = roomId.trim();
          if (rawTrimmed !== cleanCode) {
            const rawRef = doc(db, 'rooms', rawTrimmed);
            const rawSnap = await getDoc(rawRef);
            if (rawSnap.exists()) {
              docSnap = rawSnap;
            }
          }
          if (!docSnap.exists()) {
            const upperRef = doc(db, 'rooms', rawTrimmed.toUpperCase());
            const upperSnap = await getDoc(upperRef);
            if (upperSnap.exists()) {
              docSnap = upperSnap;
            }
          }
        }

          if (docSnap && docSnap.exists()) {
            roomExists = true;
            roomData = docSnap.data();
          }
        }
      } catch (err: any) {
        console.warn(`[handleNavigateRoom] Cloud verification unavailable for "${cleanCode}"; checking local room cache.`, err);
        try {
          const rawMeta = localStorage.getItem(`livepad_local_room_meta_${cleanCode}`);
          const localMeta = rawMeta ? JSON.parse(rawMeta) : null;
          if (localMeta && typeof localMeta === 'object') {
            roomExists = true;
            roomData = localMeta;
          }
        } catch {}
        if (!roomExists) {
          addToast('error', 'Cloud collaboration is unavailable on this device. Please enable a Firebase sign-in provider or use the LivePad server guest-auth setup.');
          return false;
        }
      }
    }

    // Check local storage registry fallback if not verified via Firestore
    if (!roomExists) {
      if (localStorage.getItem(`livepad_local_room_${cleanCode}`) !== null || localStorage.getItem(`livepad_local_room_${roomId.trim()}`) !== null) {
        roomExists = true;
      }
    }

    if (!roomExists) {
      addToast('error', `Workspace "${cleanCode}" does not exist. Please check the room code.`);
      console.warn(`[handleNavigateRoom] Verification failed for workspace "${cleanCode}". Navigation aborted.`);
      return false;
    }

    // Validate Room Status, Limits, and Permissions
    if (roomData) {
      const status = roomData.status || 'active';
      if (status === 'deleted' || status === 'expired' || status === 'archived') {
        // Navigate to room view so the distinct Workspace Expired / Workspace Archived warning screen is displayed
        setRoomCode(cleanCode);
        setActiveLocalNoteId(null);
        window.history.pushState({}, '', `?room=${cleanCode}`);
        return true;
      }

      // Check participant limits
      const limit = roomData.participantLimit || 50;
      const currentCount = Object.keys(roomData.users || {}).length;
      const currentUid = auth?.currentUser?.uid || uid || '';
      if (currentCount >= limit && (!currentUid || !roomData.users?.[currentUid])) {
        addToast('error', `Workspace "${cleanCode}" is full (${currentCount}/${limit} participants).`);
        return false;
      }

      // Check privacy constraints
      if (roomData.privacy === 'private' && roomData.creatorId && currentUid && roomData.creatorId !== currentUid && !roomData.participants?.[currentUid]) {
        addToast('error', `Workspace "${cleanCode}" is private and requires an invitation.`);
        return false;
      }
    }

    // Deactivate active local note when visiting live workroom
    setActiveLocalNoteId(null);
    localStorage.removeItem('livepad_active_local_note_id');
    
    // Auto-save workspace to user's notes & library
    const currentUidForLib = auth?.currentUser?.uid || localStorage.getItem('livepad_local_uid') || 'anonymous';
    WorkspaceLibraryService.saveWorkspaceToLibrary(currentUidForLib, {
      workspaceId: cleanCode,
      roomCode: cleanCode,
      title: roomData?.title || roomData?.workspaceName || 'Collaborative Workspace',
      category: roomData?.label || 'coding_session',
      workspaceType: roomData?.type || 'team',
      role: 'Editor',
      lastOpened: Date.now(),
    }).catch(() => {});

    const newUrl = `${window.location.pathname}?room=${cleanCode}`;
    window.history.pushState({}, '', newUrl);

    setRoomCode(cleanCode);
    console.log(`[handleNavigateRoom] Explicitly triggering refresh() for room: "${cleanCode}"`);
    refresh();
    return true;
  };

  // Synchronize browser history / back-forward navigation with active room code
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('room')?.toUpperCase() || null;
      if (code) {
        setActiveLocalNoteId(null);
      }
      setRoomCode(code);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // State Management
  const [joinModalOpen, setJoinModalOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [selectedWorkspaceType, setSelectedWorkspaceType] = useState<WorkspaceType>('team');
  const [customWorkspaceName, setCustomWorkspaceName] = useState<string>('');
  const [selectedPrivacy, setSelectedPrivacy] = useState<WorkspacePrivacy>('public');
  const [customParticipantLimit, setCustomParticipantLimit] = useState<number | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [lessonBoardOpen, setLessonBoardOpen] = useState<boolean>(true);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [targetRoomInput, setTargetRoomInput] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState<boolean>(false);
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(userName);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState<boolean>(false);

  // Editor Style Choices
  const [sidebarTab, setSidebarTab] = useState<'info' | 'attachments'>('info');
  const [editorFont, setEditorFont] = useState<'sans' | 'mono' | 'serif'>(() => {
    try {
      const saved = localStorage.getItem('livepad_editor_font');
      return (saved as 'sans' | 'mono' | 'serif') || 'sans';
    } catch (_) {
      return 'sans';
    }
  });
  const [editorSize, setEditorSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('livepad_editor_size');
      return saved ? Number(saved) : 16;
    } catch (_) {
      return 16;
    }
  });


  const [leftSidebarSearchQuery, setLeftSidebarSearchQuery] = useState<string>('');
  const [sidebarCategoryFilter, setSidebarCategoryFilter] = useState<'all' | 'notes' | 'workspaces' | 'pinned' | 'trash'>('all');
  const [sidebarSortBy, setSidebarSortBy] = useState<'updated' | 'title' | 'created'>('updated');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState<string>('');
  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const [showSizeSlider, setShowSizeSlider] = useState<boolean>(false);
  const sliderTimeoutRef = useRef<any>(null);

  useEffect(() => {
    try {
      localStorage.setItem('livepad_editor_font', editorFont);
    } catch (_) {}
  }, [editorFont]);

  useEffect(() => {
    try {
      localStorage.setItem('livepad_editor_size', String(editorSize));
    } catch (_) {}
  }, [editorSize]);

  const clearSliderTimeout = () => {
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
      sliderTimeoutRef.current = null;
    }
  };

  const startSliderTimeout = (delay = 3000) => {
    clearSliderTimeout();
    sliderTimeoutRef.current = setTimeout(() => {
      setShowSizeSlider(false);
    }, delay);
  };

  const resetSliderTimeout = () => {
    startSliderTimeout(3000);
  };

  useEffect(() => {
    return () => {
      clearSliderTimeout();
    };
  }, []);


  const [isStructureOpen, setIsStructureOpen] = useState<boolean>(true);
  const [structureModeOverride, setStructureModeOverride] = useState<'default' | 'paragraphs' | 'sections'>('default');

  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [softWrap, setSoftWrap] = useState<boolean>(() => {
    return localStorage.getItem('livepad_soft_wrap') !== 'false';
  });
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Voice dictation state using Web Speech API
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Attachment states inside writing sheet / notepad area
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [showAttachmentAlert, setShowAttachmentAlert] = useState<boolean>(false);
  const [toastAttachmentName, setToastAttachmentName] = useState<string | null>(null);
  const notepadFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setLeftSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Code Playground / Code Editor Modes and States


  const handleSaveNote = (id: string, title: string, content: string) => {
    const updated = localNotes.map((n) => (n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n));
    setLocalNotes(updated);
    localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    putOfflineItem('documents', { id, title, content, updatedAt: Date.now() });
  };

  useEffect(() => {
    // 1. Session Restoration on App Boot
    const restoredSession = SessionRestoreManager.loadSession();
    if (restoredSession) {
      Logger.info('Platform Logs', 'Restoring desktop session parameters', restoredSession);
      if (restoredSession.theme) {
        setTheme(restoredSession.theme);
      }
      if (restoredSession.isCodeMode !== undefined) {
        setIsCodeMode(restoredSession.isCodeMode);
      }
    }

    // 2. Desktop Electron Native Application Menu Listeners
    const unsubscribeMenu = Platform.onMenuCommand((command, data) => {
      Logger.info('Electron Logs', `Native Menu Command Received: ${command}`, data);

      switch (command) {
        case 'file:new-note':
          handleCreateLocalNote();
          break;
        case 'file:save': {
          const targetNote = localNotes.find((n) => n.id === activeLocalNoteId);
          if (targetNote) {
            handleSaveNote(targetNote.id, targetNote.title, targetNote.content);
            Platform.showSuccess('Document Saved', `Saved "${targetNote.title}" to disk`);
          }
          break;
        }
        case 'file:open':
          Platform.readFile().then((res) => {
            if (res) {
              const newNoteId = 'note-' + Date.now();
              const newNote = {
                id: newNoteId,
                title: res.path.split(/[/\\]/).pop() || 'Opened File',
                content: res.content,
                updatedAt: Date.now(),
                createdAt: Date.now(),
                pinned: false,
              };
              setLocalNotes((prev) => [newNote, ...prev]);
              setActiveLocalNoteId(newNoteId);
              Platform.showSuccess('File Loaded', `Successfully loaded file: ${newNote.title}`);
            }
          });
          break;
        case 'file:export':
          setExportModalOpen(true);
          break;
        case 'view:toggle-sidebar':
          layout.toggleLeftSidebar();
          break;
        case 'view:toggle-inspector':
          layout.toggleRightSidebar();
          break;
        case 'view:toggle-code-mode':
          setIsCodeMode((prev) => !prev);
          break;
        case 'workspace:new-room':
          setCreateModalOpen(true);
          break;
        case 'workspace:join':
          setCommandPaletteOpen(true);
          break;
        case 'workspace:ai-assistant':
          layout.setRightOpen(true);
          break;
        case 'code:terminal':
          Platform.openTerminal();
          break;
        case 'help:shortcuts':
          setShortcutsModalOpen(true);
          break;
        case 'edit:find':
          setSearchOpen(true);
          break;
        default:
          break;
      }
    });

    return () => {
      unsubscribeMenu();
    };
  }, []);

  // Save Session State automatically when key workspace state changes
  useEffect(() => {
    SessionRestoreManager.saveSession({
      lastRoomCode: roomCode,
      lastActiveNoteId: activeLocalNoteId,
      theme,
      leftSidebarMode: layout.leftMode,
      rightSidebarOpen: layout.rightOpen,
      isCodeMode,
    });
  }, [roomCode, activeLocalNoteId, theme, layout.leftMode, layout.rightOpen, isCodeMode]);

  // Search / Universal Command Palette States & Refs




  const [matches, setMatches] = useState<number[]>([]);

  // Code Playground / Code Editor Modes and States
  const [codeLanguage, setCodeLanguage] = useState<'html' | 'javascript'>('html');
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'log' | 'info' | 'warn' | 'error'; text: string; id: number }[]>([]);
  const [isAutoRun, setIsAutoRun] = useState<boolean>(true);
  const [htmlPreviewDoc, setHtmlPreviewDoc] = useState<string>('');
  const [jsSandboxDoc, setJsSandboxDoc] = useState<string>('');
  const [sandboxRunKey, setSandboxRunKey] = useState(0);
  const jsSandboxFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isSnippetDropdownOpen, setIsSnippetDropdownOpen] = useState<boolean>(false);
  const [isWordSizeDropdownOpen, setIsWordSizeDropdownOpen] = useState<boolean>(false);
  const [snippetSearchQuery, setSnippetSearchQuery] = useState<string>('');

  const TEACHER_EXERCISES = [
    {
      id: 'ex-fizzbuzz',
      title: 'FizzBuzz Console Exercise ⚡',
      language: 'javascript',
      description: 'Classic core programming loop logic and evaluation problem.',
      code: `/**\n * CLASSROOM CHALLENGE: The FizzBuzz Solver\n * \n * INSTRUCTIONS FOR STUDENTS:\n * Write a program that prints the numbers from 1 to 30:\n * - For multiples of 3, console.log("Fizz") instead of the number.\n * - For multiples of 5, console.log("Buzz").\n * - For multiples of both 3 and 5, console.log("FizzBuzz").\n */\n\nfunction solveFizzBuzz() {\n  for (let i = 1; i <= 30; i++) {\n    // --- IMPLEMENT YOUR SOLVER BELOW ---\n    if (i % 15 === 0) {\n      console.log("FizzBuzz");\n    } else if (i % 3 === 0) {\n      console.log("Fizz");\n    } else if (i % 5 === 0) {\n      console.log("Buzz");\n    } else {\n      console.log(i);\n    }\n    // ----------------------------------\n  }\n}\n\n// Trigger solver to review outcomes in the Console right side!\nsolveFizzBuzz();`
    },
    {
      id: 'ex-pricing',
      title: 'Tailwind Pricing Card Flexbox 🎨',
      language: 'html',
      description: 'Responsive flexbox styling challenge with premium highlights.',
      code: `<!-- \n  CLASSROOM CHALLENGE: Responsive Pricing Cards with Tailwind CSS\n  INSTRUCTIONS FOR STUDENTS:\n  1. Style the cards below layout structures utilizing Flexbox / Grid classes.\n  2. Enhance the "Premium bg-emerald-500" card with custom rounded scales!\n-->\n<div class="bg-zinc-950 text-white min-h-screen p-8 flex flex-col justify-center items-center font-sans">\n  <div class="text-center mb-8">\n    <span class="text-xs font-black tracking-widest text-[#0ea5e9] uppercase bg-[#0ea5e9]/10 px-3 py-1 rounded-full">Unit 2: Flexbox Layouts</span>\n    <h1 class="text-3xl font-extrabold mt-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Classroom Pricing Grid</h1>\n    <p class="text-zinc-400 text-sm mt-1">Complete layout adjustments inside the container.</p>\n  </div>\n\n  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">\n    <!-- Card 1: Standard Starter -->\n    <div class="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl hover:border-zinc-700 transition-all">\n      <h3 class="text-lg font-bold text-zinc-200">Starter Core</h3>\n      <p class="text-3xl font-black my-3 text-white">$0</p>\n      <ul class="text-xs text-zinc-400 space-y-2 mb-6">\n        <li>✓ Free workspace preview</li>\n        <li>✓ Local saving states</li>\n      </ul>\n      <button class="w-full py-2 bg-gradient-to-r from-zinc-800 to-zinc-750 hover:from-zinc-700 hover:to-zinc-650 rounded-xl text-xs font-bold transition-all">Get Started</button>\n    </div>\n    \n    <!-- Card 2: Premium (Highlight with Emerald) -->\n    <div class="bg-zinc-900 border-2 border-emerald-500/80 p-6 rounded-2xl relative shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5 transition-all bg-emerald-950/10">\n      <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">Classroom Target</span>\n      <h3 class="text-lg font-bold text-emerald-400">Premium Pro</h3>\n      <p class="text-3xl font-black my-3 text-white">$29 <span class="text-xs text-zinc-500 font-normal">/mo</span></p>\n      <ul class="text-xs text-zinc-300 space-y-2 mb-6 font-semibold">\n        <li>✓ Full-screen dynamic classrooms</li>\n        <li>✓ Interactive collaborative syncing</li>\n      </ul>\n      <button class="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black transition-all">Enable Classroom</button>\n    </div>\n  </div>\n</div>`
    },
    {
      id: 'ex-arrays',
      title: 'High-Order Array Exercises 🧠',
      language: 'javascript',
      description: 'Practice filtering, mapping, and reducing dynamic data sets.',
      code: `/**\n * CLASSROOM EXERCISE: High-Order Array Methods\n * \n * INSTRUCTIONS FOR STUDENTS:\n * Filter items over $100 and map their titles automatically!\n */\n\nconst hardwareStore = [\n  { id: 1, name: "Mechanical Keyboard", price: 120, brand: "Logitech" },\n  { id: 2, name: "Anker USB-C Hub", price: 35, brand: "Anker" },\n  { id: 3, name: "UltraWide Pro Monitor", price: 450, brand: "Dell" }\n];\n\nfunction verifyHardware() {\n  console.log("=== VERIFYING HARDWARE LIST ===");\n\n  // 1. Filter out expensive items (> $100)\n  const premiumProducts = hardwareStore.filter(product => product.price > 100);\n  console.log("💎 Products > $100: ", premiumProducts);\n\n  // 2. Map titles to print\n  const itemTitles = hardwareStore.map(product => product.name);\n  console.log("🚀 Product names list: ", itemTitles);\n}\n\nverifyHardware();`
    }
  ];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineHighlightRef = useRef<HTMLDivElement>(null);

  // Helper to find all index positions of a pattern case-insensitively
  const findAllMatches = (content: string, search: string) => {
    if (!search || !content) return [];
    const indices: number[] = [];
    const searchLower = search.toLowerCase();
    const contentLower = content.toLowerCase();
    let idx = contentLower.indexOf(searchLower);
    while (idx !== -1) {
      indices.push(idx);
      idx = contentLower.indexOf(searchLower, idx + searchLower.length);
    }
    return indices;
  };

  // Safe HTML escaper to protect from XSS while wrapping with formatting marks
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const highlightCSS = (cssCode: string) => {
    const placeholders: { [key: string]: string } = {};
    let placeholderCounter = 0;

    // Protect CSS comments
    const commentRegex = /\/\*[\s\S]*?\*\//g;
    let processed = cssCode;
    
    processed = processed.replace(commentRegex, (match) => {
      const key = `_CSS_COMMENT_${placeholderCounter++}_`;
      const escapedText = escapeHtml(match);
      placeholders[key] = `<span class="text-[#5c6370] dark:text-[#7f848e] font-mono italic inline select-none">${escapedText}</span>`;
      return key;
    });

    // Escape original body
    let escapedCSS = escapeHtml(processed);

    // Highlight CSS Selectors: classes, IDs, rules (One Dark gold & blue)
    escapedCSS = escapedCSS.replace(/(\.[a-zA-Z0-9_-]+)/g, '<span class="text-[#c18401] dark:text-[#e5c07b] font-semibold font-mono">$1</span>');
    escapedCSS = escapedCSS.replace(/(#[a-zA-Z0-9_-]+)(?=\s*\{|\s*,|\s+[.#a-zA-Z0-9])?/g, '<span class="text-[#4078f2] dark:text-[#61afef] font-semibold font-mono">$1</span>');

    // Highlight CSS properties (One Dark red)
    const cssPropertyRegex = /\b([a-zA-Z-]+)(?=\s*:)/g;
    escapedCSS = escapedCSS.replace(cssPropertyRegex, '<span class="text-[#e06c75] dark:text-[#e06c75] font-semibold inline">$1</span>');

    // Highlight CSS units: number followed by unit (px, rem, em, %, vh, vw, ms, s, deg, pt, ch, fr) (One Dark orange & cyan)
    const cssUnitRegex = /(\b\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|ms|s|deg|pt|ch|fr)(?![a-zA-Z0-9])/gi;
    escapedCSS = escapedCSS.replace(cssUnitRegex, '<span class="text-[#b76b1c] dark:text-[#d19a66] font-medium font-mono">$1</span><span class="text-[#0184bc] dark:text-[#56b6c2] font-bold font-mono">$2</span>');

    // Highlight common values (One Dark cyan)
    const commonValues = [
      'absolute', 'relative', 'fixed', 'sticky', 'block', 'inline', 'flex', 'grid', 'none', 'bold', 'normal',
      'pointer', 'white', 'black', 'transparent', 'inherit', 'initial', 'unset'
    ];
    const valueRegex = new RegExp(`\\b(${commonValues.join('|')})\\b`, 'g');
    escapedCSS = escapedCSS.replace(valueRegex, '<span class="text-[#0184bc] dark:text-[#56b6c2] font-medium inline">$1</span>');

    // Highlight !important (One Dark purple)
    escapedCSS = escapedCSS.replace(/(!important)\b/gi, '<span class="text-[#a626a4] dark:text-[#c678dd] font-black tracking-wide inline">$1</span>');

    // Restore comments
    let finalHtml = escapedCSS;
    Object.keys(placeholders).forEach((key) => {
      finalHtml = finalHtml.split(key).join(placeholders[key]);
    });

    return finalHtml;
  };

  // Formats text into safe HTML markup highlighting any occurrences
  const highlightJavaScript = (code: string) => {
    const placeholders: { [key: string]: string } = {};
    let placeholderCounter = 0;

    // RegEx for comments (inline and block)
    const commentRegex = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g;
    // RegEx for strings (single, double, template literals) without backreference-in-class issues
    const stringRegex = /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(`(?:\\.|[^`\\])*`)/g;

    let processed = code;

    // Protect comments (One Dark muted gray/slate)
    processed = processed.replace(commentRegex, (match) => {
      const key = `_JS_COMMENT_${placeholderCounter++}_`;
      const escapedText = escapeHtml(match);
      placeholders[key] = `<span class="text-[#5c6370] dark:text-[#7f848e] font-mono italic inline select-none">${escapedText}</span>`;
      return key;
    });

    // Protect strings (One Dark green)
    processed = processed.replace(stringRegex, (match) => {
      const key = `_JS_STRING_${placeholderCounter++}_`;
      const escapedText = escapeHtml(match);
      placeholders[key] = `<span class="text-[#50a14f] dark:text-[#98c379] font-mono font-medium inline">${escapedText}</span>`;
      return key;
    });

    // Escape original body
    let escapedCode = escapeHtml(processed);

    // Keywords (One Dark purple)
    const keywords = [
      'const', 'let', 'var', 'function', 'class', 'return', 'if', 'else', 'for', 'while', 
      'do', 'switch', 'case', 'break', 'continue', 'default', 'import', 'export', 'from', 
      'new', 'this', 'typeof', 'instanceof', 'try', 'catch', 'finally', 'throw', 'async', 
      'await', 'yield'
    ];
    const keywordsRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    escapedCode = escapedCode.replace(keywordsRegex, '<span class="text-[#a626a4] dark:text-[#c678dd] font-bold inline">$1</span>');

    // Builtins (One Dark cyan)
    const builtins = [
      'console', 'log', 'error', 'warn', 'info', 'window', 'document', 'process', 'Math', 'JSON', 'Promise'
    ];
    const builtinsRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    escapedCode = escapedCode.replace(builtinsRegex, '<span class="text-[#0184bc] dark:text-[#56b6c2] font-semibold inline">$1</span>');

    // Literals (One Dark dark orange)
    const literals = ['true', 'false', 'null', 'undefined'];
    const literalsRegex = new RegExp(`\\b(${literals.join('|')})\\b`, 'g');
    escapedCode = escapedCode.replace(literalsRegex, '<span class="text-[#b76b1c] dark:text-[#d19a66] font-mono font-medium inline">$1</span>');

    // Numbers (One Dark gold)
    const numberRegex = /\b(\d+(?:\.\d+)?)\b/g;
    escapedCode = escapedCode.replace(numberRegex, '<span class="text-[#c18401] dark:text-[#e5c07b] font-mono inline">$1</span>');

    // Method/Function calls (One Dark blue)
    const functionCallRegex = /\b(\w+)(?=\s*\()/g;
    escapedCode = escapedCode.replace(functionCallRegex, '<span class="text-[#4078f2] dark:text-[#61afef] font-semibold inline">$1</span>');

    // Restore comments and strings
    let finalHtml = escapedCode;
    Object.keys(placeholders).forEach((key) => {
      finalHtml = finalHtml.split(key).join(placeholders[key]);
    });

    return finalHtml;
  };

  const highlightHTML = (code: string) => {
    const placeholders: { [key: string]: string } = {};
    let placeholderCounter = 0;

    // Comments string matcher (One Dark muted gray/slate)
    const commentRegex = /<!--[\s\S]*?-->/g;
    let processed = code;

    // Protect HTML comments
    processed = processed.replace(commentRegex, (match) => {
      const key = `_HTML_COMMENT_${placeholderCounter++}_`;
      const escapedText = escapeHtml(match);
      placeholders[key] = `<span class="text-[#5c6370] dark:text-[#7f848e] font-mono italic inline select-none">${escapedText}</span>`;
      return key;
    });

    // Detect and extract style blocks
    // Format: <style...>CSS CONTENT</style>
    const styleBlockRegex = /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi;
    processed = processed.replace(styleBlockRegex, (match, openTag, cssContent, closeTag) => {
      const key = `_STYLE_BLOCK_${placeholderCounter++}_`;
      
      const highlightedOpenTag = openTag.replace(/<\/?[a-zA-Z0-9:-]+(?:\s+[^>]*?)?\/?>/g, (tagMatch: string) => {
        let tagBody = escapeHtml(tagMatch);
        tagBody = tagBody.replace(/(^&lt;\/?)([a-zA-Z0-9:-]+)/, (m, prefix, name) => {
          return `${prefix}<span class="text-[#e06c75] dark:text-[#e06c75] font-bold inline">${name}</span>`;
        });
        tagBody = tagBody.replace(/\b([a-zA-Z0-9:-]+)(?=\s*=)/g, '<span class="text-[#986801] dark:text-[#d19a66] font-semibold inline">$1</span>');
        return tagBody;
      });

      const highlightedCloseTag = closeTag.replace(/<\/?[a-zA-Z0-9:-]+(?:\s+[^>]*?)?\/?>/g, (tagMatch: string) => {
        let tagBody = escapeHtml(tagMatch);
        tagBody = tagBody.replace(/(^&lt;\/?)([a-zA-Z0-9:-]+)/, (m, prefix, name) => {
          return `${prefix}<span class="text-[#e06c75] dark:text-[#e06c75] font-bold inline">${name}</span>`;
        });
        return tagBody;
      });

      const highlightedCSS = highlightCSS(cssContent);

      placeholders[key] = `${highlightedOpenTag}${highlightedCSS}${highlightedCloseTag}`;
      return key;
    });

    // RegEx for tag: opening tags, self closing tags, close tags
    // e.g. <div class="bg-black">, </p>, <input type="text" />
    const tagRegex = /<\/?[a-zA-Z0-9:-]+(?:\s+[^>]*?)?\/?>/g;

    processed = processed.replace(tagRegex, (match) => {
      const key = `_HTML_TAG_${placeholderCounter++}_`;
      
      const inlinePlaceholders: { [k: string]: string } = {};
      let subCounter = 0;
      const attrStringRegex = /("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')/g;
      
      let tagBody = match.replace(attrStringRegex, (subMatch) => {
        const subKey = `_SUB_STR_${subCounter++}_`;
        const escapedSub = escapeHtml(subMatch);
        inlinePlaceholders[subKey] = `<span class="text-[#50a14f] dark:text-[#98c379] font-mono inline">${escapedSub}</span>`;
        return subKey;
      });

      let escapedTagBody = escapeHtml(tagBody);

      // Highlight HTML tag name (One Dark red/coral)
      const tagNameRegex = /(^&lt;\/?)([a-zA-Z0-9:-]+)/g;
      escapedTagBody = escapedTagBody.replace(tagNameRegex, (m, prefix, name) => {
        return `${prefix}<span class="text-[#e06c75] dark:text-[#e06c75] font-bold inline">${name}</span>`;
      });

      // Highlight trailing slash and closing angles of tag
      escapedTagBody = escapedTagBody.replace(/(\/?&gt;)$/g, '<span class="text-[#a0a1a7] dark:text-[#5c6370] inline">$1</span>');

      // Accent attribute keys inside tag body, e.g., class=, id=, type=, src= (One Dark dark-orange/gold)
      const attrKeyRegex = /\b([a-zA-Z0-9:-]+)(?=\s*=)/g;
      escapedTagBody = escapedTagBody.replace(attrKeyRegex, '<span class="text-[#986801] dark:text-[#d19a66] font-semibold inline">$1</span>');

      // Restore inline attributes strings
      Object.keys(inlinePlaceholders).forEach((k) => {
        escapedTagBody = escapedTagBody.split(k).join(inlinePlaceholders[k]);
      });

      placeholders[key] = escapedTagBody;
      return key;
    });

    // Escape original body
    let finalHtml = escapeHtml(processed);

    // Restore tags and comments
    Object.keys(placeholders).forEach((key) => {
      finalHtml = finalHtml.split(key).join(placeholders[key]);
    });

    return finalHtml;
  };

  const getMatchingBracketIndices = (content: string, cursorPos: number): [number, number] | null => {
    if (!content || cursorPos < 0 || cursorPos > content.length) return null;

    const openers = ['{', '[', '('];
    const closers = ['}', ']', ')'];
    const pairs: { [key: string]: string } = {
      '{': '}', '[': ']', '(': ')',
      '}': '{', ']': '[', ')': '('
    };

    let targetPos = -1;
    if (cursorPos < content.length && (openers.includes(content[cursorPos]) || closers.includes(content[cursorPos]))) {
      targetPos = cursorPos;
    } else if (cursorPos > 0 && (openers.includes(content[cursorPos - 1]) || closers.includes(content[cursorPos - 1]))) {
      targetPos = cursorPos - 1;
    }

    if (targetPos === -1) return null;

    const char = content[targetPos];
    const matchChar = pairs[char];
    if (!matchChar) return null;

    const isOpening = openers.includes(char);

    if (isOpening) {
      let depth = 1;
      for (let i = targetPos + 1; i < content.length; i++) {
        if (content[i] === char) depth++;
        else if (content[i] === matchChar) {
          depth--;
          if (depth === 0) return [targetPos, i];
        }
      }
    } else {
      let depth = 1;
      for (let i = targetPos - 1; i >= 0; i--) {
        if (content[i] === char) depth++;
        else if (content[i] === matchChar) {
          depth--;
          if (depth === 0) return [i, targetPos];
        }
      }
    }

    return null;
  };

  const getHighlightedHtml = (content: string, search: string, activeIndex: number) => {
    let processed = content;

    // Bracket matching highlight placeholders
    const bracketPlaceholders: { [key: string]: string } = {};
    const matchingBrackets = isCodeMode ? getMatchingBracketIndices(content, activeCursorPos) : null;

    if (matchingBrackets) {
      const [idx1, idx2] = matchingBrackets;
      const char1 = content[idx1];
      const char2 = content[idx2];

      const key2 = `_BRKT_HL_2_`;
      const key1 = `_BRKT_HL_1_`;

      bracketPlaceholders[key2] = char2;
      bracketPlaceholders[key1] = char1;

      // Replace right to left so idx1 index does not shift!
      processed = content.substring(0, idx1) + key1 + content.substring(idx1 + 1, idx2) + key2 + content.substring(idx2 + 1);
    }
    
    // Protect active selection
    const selectionPlaceholder = `_LIVEPAD_ACTIVE_SELECTION_PLACEHOLDER_`;
    let selectedSubText = '';
    let hasSelection = false;
    
    if (selectionRange && selectionRange.start !== selectionRange.end) {
      const { start, end } = selectionRange;
      if (start >= 0 && end <= content.length) {
        selectedSubText = content.substring(start, end);
        processed = content.substring(0, start) + selectionPlaceholder + content.substring(end);
        hasSelection = true;
      }
    }

    const searchPlaceholders: { [key: string]: { original: string, isCurrent: boolean } } = {};
    let searchCounter = 0;

    // Detect search matches if query is active
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      // Use processed text to index search bounds so we don't conflict with selection ranges
      const contentLower = processed.toLowerCase();
      const matchIndices: number[] = [];
      let idx = contentLower.indexOf(searchLower);
      while (idx !== -1) {
        matchIndices.push(idx);
        idx = contentLower.indexOf(searchLower, idx + search.length);
      }

      if (matchIndices.length > 0) {
        // Replace matches from right to left so indices don't shift!
        for (let i = matchIndices.length - 1; i >= 0; i--) {
          const start = matchIndices[i];
          const end = start + search.length;
          const originalText = processed.substring(start, end);
          if (originalText.includes(selectionPlaceholder)) {
            // Skip matches that cross the placeholder boundary to keep HTML clean
            continue;
          }
          const placeholder = `_SRCH_MCH_PLCHDR_${searchCounter++}_`;
          
          searchPlaceholders[placeholder] = {
            original: originalText,
            isCurrent: i === activeIndex
          };
          
          processed = processed.substring(0, start) + placeholder + processed.substring(end);
        }
      }
    }

    // Highlighting route depending on code vs text content
    let coreHtml = '';
    if (isCodeMode) {
      if (codeLanguage === 'html') {
        coreHtml = highlightHTML(processed);
      } else if ((codeLanguage as string) === 'css') {
        coreHtml = highlightCSS(processed);
      } else {
        coreHtml = highlightJavaScript(processed);
      }
    } else {
      // Standard Notepad / Text Mode
      coreHtml = escapeHtml(processed);

      // Also process custom inline word sizing CSS inside Standard Notepad text with recursive nested tag resolution
      const innerSizeTagRegex = /&lt;span style=&quot;font-size: (\d+)px&quot;&gt;((?:(?!&lt;span)[\s\S])*?)&lt;\/span&gt;/gi;
      let hasMatches = true;
      let iterations = 0;
      while (hasMatches && iterations < 5) {
        hasMatches = false;
        coreHtml = coreHtml.replace(innerSizeTagRegex, (match, size, innerText) => {
          hasMatches = true;
          const openingTagHtml = `&lt;span style=&quot;font-size: ${size}px&quot;&gt;`;
          const closingTagHtml = `&lt;/span&gt;`;
          
          return (
            `<span class="opacity-30 dark:opacity-40 text-[9px] font-mono select-none inline-block" style="font-size: 10px">${openingTagHtml}</span>` +
            `<span style="font-size: ${size}px; line-height: 1.25" class="text-slate-800 dark:text-zinc-100 font-extrabold border-b border-dashed border-cyan-400 inline">${innerText}</span>` +
            `<span class="opacity-30 dark:opacity-40 text-[9px] font-mono select-none inline-block" style="font-size: 10px">${closingTagHtml}</span>`
          );
        });
        iterations++;
      }

      // Also process standard formatting tags (<b>, <i>, <u>) for the editor display (Standard Notepad / Text Mode)
      coreHtml = coreHtml
        .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<b class="font-bold text-slate-900 dark:text-neutral-50">$1</b>')
        .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<i class="italic text-slate-800 dark:text-neutral-105">$1</i>')
        .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u class="underline decoration-indigo-400 dark:decoration-indigo-500">$1</u>');
    }

    // Restore search matches with beautiful visual marker tags
    Object.keys(searchPlaceholders).forEach((key) => {
      const { original, isCurrent } = searchPlaceholders[key];
      const escapedOriginal = escapeHtml(original);
      
      const bgClass = isCurrent 
        ? 'bg-cyan-500/50 dark:bg-cyan-400/60 ring-2 ring-cyan-500 font-black text-slate-900 dark:text-white inline' 
        : 'bg-yellow-300 dark:bg-yellow-500/35 text-slate-800 dark:text-zinc-100 font-semibold inline';

      const markTag = `<mark class="${bgClass} rounded-xs px-0.5 py-0.2 select-none">${escapedOriginal}</mark>`;
      coreHtml = coreHtml.split(key).join(markTag);
    });

    // Finally restore selected range as a custom high-end IDE styled selector tag
    if (hasSelection) {
      let highlightedSubtext = '';
      if (isCodeMode) {
        if (codeLanguage === 'html') {
          highlightedSubtext = highlightHTML(selectedSubText);
        } else {
          highlightedSubtext = highlightJavaScript(selectedSubText);
        }
      } else {
        highlightedSubtext = escapeHtml(selectedSubText);
        
        // Sizing
        const innerSizeTagRegex = /&lt;span style=&quot;font-size: (\d+)px&quot;&gt;((?:(?!&lt;span)[\s\S])*?)&lt;\/span&gt;/gi;
        let hasM = true;
        let iters = 0;
        while (hasM && iters < 5) {
          hasM = false;
          highlightedSubtext = highlightedSubtext.replace(innerSizeTagRegex, (m, size, innerText) => {
            hasM = true;
            return `<span style="font-size: ${size}px; line-height: 1.25" class="font-extrabold text-[#0ea5e9] dark:text-cyan-400 inline-block my-1">${innerText}</span>`;
          });
          iters++;
        }

        // Formatting
        highlightedSubtext = highlightedSubtext
          .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<b class="font-bold text-slate-900 dark:text-neutral-50">$1</b>')
          .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<i class="italic text-slate-800 dark:text-neutral-105">$1</i>')
          .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u class="underline decoration-indigo-400 dark:decoration-indigo-500">$1</u>');
      }

      // Render the marker
      const markerHtml = `<span id="livepad-selection-marker" class="bg-indigo-500/15 dark:bg-indigo-500/30 rounded-xs relative inline">${highlightedSubtext}</span>`;
      coreHtml = coreHtml.split(selectionPlaceholder).join(markerHtml);
    }

    // Restore matching brackets highlight tags
    Object.keys(bracketPlaceholders).forEach((key) => {
      const char = bracketPlaceholders[key];
      const escaped = escapeHtml(char);
      const tag = `<span class="bg-cyan-400/40 dark:bg-cyan-400/50 text-cyan-950 dark:text-cyan-100 ring-2 ring-cyan-500 font-extrabold rounded-2xs px-[2px] inline-block shadow-md animate-pulse">${escaped}</span>`;
      coreHtml = coreHtml.split(key).join(tag);
    });

    return coreHtml;
  };

  const getReaderModeHtml = (content: string) => {
    let processed = escapeHtml(content);
    
    // Resolve nested tags from inside-out
    const innerSizeTagRegex = /&lt;span style=&quot;font-size: (\d+)px&quot;&gt;((?:(?!&lt;span)[\s\S])*?)&lt;\/span&gt;/gi;
    
    let hasMatches = true;
    let iterations = 0;
    while (hasMatches && iterations < 5) {
      hasMatches = false;
      processed = processed.replace(innerSizeTagRegex, (match, size, innerText) => {
        hasMatches = true;
        // Clean, tagless, pure styled span! No raw HTML source tags shown to the reader!
        return `<span style="font-size: ${size}px; line-height: 1.25" class="font-extrabold text-[#0ea5e9] dark:text-cyan-400 inline-block my-1">${innerText}</span>`;
      });
      iterations++;
    }

    // Highlight standard formatting inside reader mode
    processed = processed
      .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<b class="font-bold text-slate-900 dark:text-zinc-150 inline">$1</b>')
      .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<i class="italic text-slate-850 dark:text-zinc-200 inline">$1</i>')
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u class="underline decoration-indigo-400 dark:decoration-indigo-500 inline">$1</u>');
    
    return processed;
  };

  const handleSearchChange = (content: string, query: string) => {
    setSearchQuery(query);
    const allMatches = findAllMatches(content, query);
    setMatches(allMatches);
    setActiveMatchIndex(0);
    if (allMatches.length > 0) {
      setTimeout(() => selectMatch(0, allMatches, query), 10);
    }
  };

  const selectMatch = (matchIdx: number, currentMatches = matches, query = searchQuery) => {
    if (currentMatches.length === 0 || matchIdx < 0 || matchIdx >= currentMatches.length) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = currentMatches[matchIdx];
    const end = start + query.length;
    
    textarea.setSelectionRange(start, end);
    
    // Smooth scroll transition
    const prevActive = document.activeElement as HTMLElement;
    textarea.focus();
    if (prevActive && prevActive.id === 'editor-search-input') {
      prevActive.focus();
    }
  };

  const jumpToNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matches.length;
    setActiveMatchIndex(nextIdx);
    selectMatch(nextIdx);
  };

  const jumpToPrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + matches.length) % matches.length;
    setActiveMatchIndex(prevIdx);
    selectMatch(prevIdx);
  };

  const handleReplaceOne = () => {
    if (matches.length === 0 || activeMatchIndex < 0 || activeMatchIndex >= matches.length) return;
    const matchStart = matches[activeMatchIndex];
    const matchLen = searchQuery.length;
    const newContent = editorContent.substring(0, matchStart) + replaceQuery + editorContent.substring(matchStart + matchLen);
    handleUpdateContent(newContent);
    addToHistory(newContent);
    const newMatches = findAllMatches(newContent, searchQuery);
    setMatches(newMatches);
    const nextIdx = Math.min(activeMatchIndex, Math.max(0, newMatches.length - 1));
    setActiveMatchIndex(nextIdx);
    if (newMatches.length > 0) {
      selectMatch(nextIdx, newMatches, searchQuery);
    }
    addToast('success', 'Replaced 1 occurrence.');
  };

  const handleReplaceAll = () => {
    if (!searchQuery || matches.length === 0) return;
    const count = matches.length;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = editorContent.replace(regex, replaceQuery);
    handleUpdateContent(newContent);
    addToHistory(newContent);
    setMatches([]);
    setActiveMatchIndex(0);
    addToast('success', `Replaced all ${count} occurrences.`);
  };

  const handleScroll = () => {
    if (textareaRef.current) {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
        overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
      if (lineHighlightRef.current) {
        lineHighlightRef.current.scrollTop = textareaRef.current.scrollTop;
        lineHighlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      updateFloatingMenuCoords();
    }
  };

  const handleInsertCharacter = (char: string) => {
    if (editorInstance) {
      editorInstance.chain().focus().insertContent(char).run();
      if (codeLanguage === 'html' && isAutoRun) {
        setTimeout(() => {
          setHtmlPreviewDoc(editorInstance.getHTML());
        }, 100);
      }
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = textarea.value;
      const beforeStr = currentVal.substring(0, start);
      const afterStr = currentVal.substring(end);
      
      const newContent = beforeStr + char + afterStr;
      handleUpdateContent(newContent);
      
      // Keep focus and restore cursor position after inserting
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + char.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        if (updateCursorIndex) {
          updateCursorIndex(newCursorPos);
        }
      }, 50);

      // Force refresh HTML sandbox if applicable
      if (codeLanguage === 'html' && isAutoRun) {
        setTimeout(() => {
          setHtmlPreviewDoc(newContent);
        }, 100);
      }
    } else {
      const newContent = editorContent + char;
      handleUpdateContent(newContent);
    }
  };

  // Automatically activate Fullscreen/Focus Mode and Monospace when Code Mode is toggled
  useEffect(() => {
    if (isCodeMode) {
      setIsFullscreen(true);
      setEditorFont('mono');
    }
  }, [isCodeMode]);

  // Trigger Live Synchronizer Hook
  const {
    room,
    syncStatus: rawSyncStatus,
    error: liveError,
    userColor,
    activeUsers: realActiveUsers,
    allParticipants,
    updateContent,
    setTyping,
    uid,
    updateLabel,
    updateTitle,
    history,
    revertToHistory,
    updateCursorIndex,
    updateAttachments,
    refresh,
    currentRole,
    isCreator,
    isOwner,
    canEdit,
    canComment,
    archiveWorkspace,
    restoreWorkspace,
    deleteWorkspace,
    workspaceType,
    workspaceName,
    workspaceStatus,
    codeModeOpen,
    setCodeModeOpen
  } = useLiveRoom(roomCode, userName || auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || '');

  const isTeachingSession = workspaceType === 'teaching';
  const isTeacher = currentRole === 'teacher' || currentRole === 'admin' || currentRole === 'owner';
  const classroomRole = isTeachingSession ? (isTeacher ? 'teacher' : 'student') : 'standard';
  const canControlCodeMode = isTeacher && Boolean(roomCode);

  // In teaching sessions Code Studio is a shared classroom surface. The room's
  // Firestore state is authoritative, so opening it from the teacher's device
  // automatically opens it for every participant.
  useEffect(() => {
    if (!roomCode) return;
    if (isTeachingSession) setIsCodeMode(codeModeOpen === true);
  }, [isTeachingSession, roomCode, codeModeOpen, setIsCodeMode]);

  useEffect(() => {
    if (!isTeachingSession || !roomCode) return;
    if (!codeModeOpen && isCodeMode) setIsCodeMode(false);
  }, [isTeachingSession, roomCode, codeModeOpen, isCodeMode, setIsCodeMode]);

  const handleCodeModeToggle = useCallback(async () => {
    if (isTeachingSession) {
      if (!canControlCodeMode) {
        addToast('info', 'Code Studio is controlled by the teacher for this learning session.');
        return;
      }
      const next = !codeModeOpen;
      const ok = await setCodeModeOpen(next);
      if (ok) addToast('info', next ? 'Code Studio is now open for everyone.' : 'Code Studio is closed for everyone.');
      else addToast('error', 'Could not update the shared Code Studio state.');
      return;
    }
    setIsCodeMode(prev => !prev);
  }, [isTeachingSession, canControlCodeMode, codeModeOpen, setCodeModeOpen, setIsCodeMode, addToast]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  const isInactiveWorkspace = Boolean(
    roomCode && (
      workspaceStatus === 'expired' || 
      workspaceStatus === 'deleted' ||
      (liveError && (liveError.includes('expired') || liveError.includes('deleted') || liveError.includes('currently')))
    )
  );

  const {
    archive: handleArchiveWorkspace,
    restore: handleRestoreWorkspace,
    remove: handleConfirmDeleteWorkspace,
    leave: handleLeaveWorkspace,
  } = useWorkspaceCommands({
    room,
    roomCode,
    archiveWorkspace,
    restoreWorkspace,
    deleteWorkspace,
    addToast,
    navigateToDashboard: () => handleNavigateRoom(null),
  });

  const activeLocalNote = useMemo(
    () => localNotes.find(n => n.id === activeLocalNoteId),
    [localNotes, activeLocalNoteId]
  );

  // If in notepad mode, override room and content values:
  const editorContent = useMemo(
    () => activeLocalNoteId ? (activeLocalNote?.content ?? '') : (room?.content ?? ''),
    [activeLocalNoteId, activeLocalNote?.content, room?.content]
  );

  const activeAttachments = useMemo(
    () => (roomCode ? room?.attachments : activeLocalNote?.attachments) || [],
    [roomCode, room?.attachments, activeLocalNote?.attachments]
  );

  const { localSavingState, handleUpdateContent } = useDocumentPersistence({
    activeLocalNoteId,
    localNotes,
    setLocalNotes,
    setLastSavedTime,
    roomCode,
    room,
    userName,
    updateContent,
  });

  const {
    dictationState,
    activeProviderId,
    currentLanguage,
    setCurrentLanguage,
    settings: dictationSettings,
    updateSettings: updateDictationSettings,
    stats: dictationStats,
    volumeLevel: dictationVolumeLevel,
    audioDevices: dictationAudioDevices,
    liveTranscript: dictationLiveTranscript,
    interimTranscript: dictationInterimTranscript,
    lastResult: dictationLastResult,
    detectedLangPrompt: dictationDetectedLangPrompt,
    setDetectedLangPrompt: setDictationDetectedLangPrompt,
    pauseListening: pauseDictationListening,
    resumeListening: resumeDictationListening,
    stopListening: stopDictationListening,
    toggleDictation,
    triggerAICleanup: triggerDictationAICleanup,
    availableProviders: dictationAvailableProviders
  } = useDictationEngine({
    editorInstance,
    textareaRef,
    editorContent,
    onUpdateContent: handleUpdateContent,
    addToast
  });

  const handleAddAttachmentCombined = async (newAttachment: Attachment) => {
    if (roomCode) {
      const updated = [...(room?.attachments || []), newAttachment];
      try {
        await updateAttachments(updated);
        addToast('success', `Attached "${newAttachment.name}" to this room!`);
        setToastAttachmentName(newAttachment.name);
        setShowAttachmentAlert(true);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('too large') || errMsg.includes('large') || errMsg.includes('size')) {
          addToast('error', `Failed to attach "${newAttachment.name}": The file is too large for database sync (Firestore has 1MB document limit). Please use the "Web Link" tab instead!`);
        } else {
          addToast('error', `Failed to upload attachment: ${errMsg}`);
        }
      }
    } else if (activeLocalNoteId) {
      const updatedNotes = localNotes.map(n => {
        if (n.id === activeLocalNoteId) {
          const updatedAtts = [...(n.attachments || []), newAttachment];
          return { ...n, attachments: updatedAtts, updatedAt: Date.now() };
        }
        return n;
      });
      try {
        setLocalNotes(updatedNotes);
        localStorage.setItem('livepad_local_notepads', JSON.stringify(updatedNotes));
        addToast('success', `Attached "${newAttachment.name}" to private note!`);
        setToastAttachmentName(newAttachment.name);
        setShowAttachmentAlert(true);
      } catch (err: any) {
        // Revert localNotes changes
        setLocalNotes(localNotes);
        addToast('error', `Browser storage limit exceeded. Please use "Web Link" tab for larger items!`);
      }
    }
  };

  const processFileForAttachments = (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const MAX_SIZE = 700 * 1024; // 700KB limit for database stability

    const formatBytes = (bytes?: number): string => {
      if (bytes === undefined || bytes === null) return '';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const compressAndProcessImage = (f: File, callback: (base64: string) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1024;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            callback(dataUrl);
          } else {
            callback(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(f);
    };

    if (file.size > MAX_SIZE) {
      if (isImage) {
        compressAndProcessImage(file, (base64Url) => {
          const roughSize = Math.round(base64Url.length * 0.75);
          if (roughSize > MAX_SIZE) {
            addToast('error', `Image is too large even after compression (${formatBytes(roughSize)}). Direct uploads are limited to 700KB. Try linking it instead!`);
            setIsProcessingFile(false);
            return;
          }
          const finalAttachment: Attachment = {
            id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            name: file.name,
            type: 'image',
            url: base64Url,
            size: roughSize,
            uploadedAt: Date.now(),
            uploadedBy: userName || 'Anonymous'
          };
          handleAddAttachmentCombined(finalAttachment);
          setIsProcessingFile(false);
        });
        return;
      } else {
        addToast('error', `File "${file.name}" is too large (${formatBytes(file.size)}). Max limit for direct attachments is 700KB. For larger files, please add them via sidebar Link tab.`);
        setIsProcessingFile(false);
        return;
      }
    }

    // Standard reading for file under 700KB
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = e.target?.result as string;
      let type: 'image' | 'video' | 'document' = 'document';
      if (isImage) type = 'image';
      else if (isVideo) type = 'video';

      const finalAttachment: Attachment = {
        id: 'att_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        name: file.name,
        type,
        url: resultStr,
        size: file.size,
        uploadedAt: Date.now(),
        uploadedBy: userName || 'Anonymous'
      };

      handleAddAttachmentCombined(finalAttachment);
      setIsProcessingFile(false);
    };

    reader.onerror = () => {
      addToast('error', `Could not read file "${file.name}".`);
      setIsProcessingFile(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteAttachmentCombined = async (id: string) => {
    if (roomCode) {
      const updated = (room?.attachments || []).filter(item => item.id !== id);
      try {
        await updateAttachments(updated);
        addToast('info', 'Attachment deleted successfully.');
      } catch (err: any) {
        addToast('error', `Failed to delete attachment: ${err?.message || String(err)}`);
      }
    } else if (activeLocalNoteId) {
      const updatedNotes = localNotes.map(n => {
        if (n.id === activeLocalNoteId) {
          const updatedAtts = (n.attachments || []).filter(item => item.id !== id);
          return { ...n, attachments: updatedAtts, updatedAt: Date.now() };
        }
        return n;
      });
      try {
        setLocalNotes(updatedNotes);
        localStorage.setItem('livepad_local_notepads', JSON.stringify(updatedNotes));
        addToast('info', 'Attachment deleted successfully.');
      } catch (err: any) {
        addToast('error', 'Failed to update notepad changes.');
      }
    }
  };

  const handleStructureItemClick = (item: StructureItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const content = textarea.value;
    let index = content.indexOf(item.originalText);
    if (index === -1) {
      // Clean target substring match fallback
      const cleanPreview = item.preview.replace('...', '');
      if (cleanPreview.length > 5) {
        index = content.indexOf(cleanPreview);
      }
    }

    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index);

      // Scroll smoothly to selection line block offset
      const textBefore = content.substring(0, index);
      const lineCount = textBefore.split('\n').length;
      const lineHeight = Number(window.getComputedStyle(textarea).lineHeight.replace('px', '')) || 20;
      textarea.scrollTop = Math.max(0, (lineCount * lineHeight) - 80);

      addToast('info', `Focused: ${item.title.split(':')[0]}`);
    }
  };

  const syncStatus = activeLocalNoteId ? localSavingState : rawSyncStatus;

  const updateAutocompleteSuggestions = (content: string, cursorPos: number) => {
    if (!isCodeMode || isReadOnly) {
      setAutocompleteSuggestions([]);
      return;
    }

    const textBefore = content.substring(0, cursorPos);
    const wordMatch = textBefore.match(/(?:<|\b)([a-zA-Z0-9_\-\.]+)$/);
    
    if (!wordMatch) {
      setAutocompleteSuggestions([]);
      return;
    }

    const fullMatched = wordMatch[0];
    const isHtmlTagPrefix = fullMatched.startsWith('<');
    const rawPrefix = isHtmlTagPrefix ? fullMatched.slice(1) : fullMatched;

    if (!rawPrefix || rawPrefix.length < 1) {
      setAutocompleteSuggestions([]);
      return;
    }

    const lowerPrefix = rawPrefix.toLowerCase();
    const suggestions: { label: string; type: 'keyword' | 'tag' | 'property' | 'builtin'; snippet?: string }[] = [];

    if (codeLanguage === 'html' || isHtmlTagPrefix) {
      const htmlTags = [
        'div', 'span', 'p', 'a', 'button', 'input', 'form', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
        'script', 'style', 'link', 'meta', 'img', 'table', 'tr', 'td', 'th', 'tbody', 'thead',
        'textarea', 'select', 'option', 'canvas', 'svg', 'path', 'iframe', 'details', 'summary',
        'strong', 'em', 'code', 'pre', 'figure', 'figcaption', 'video', 'audio', 'source'
      ];
      
      htmlTags.forEach(tag => {
        if (tag.toLowerCase().startsWith(lowerPrefix)) {
          suggestions.push({
            label: `<${tag}>`,
            type: 'tag',
            snippet: `<${tag}></${tag}>`
          });
        }
      });
    }

    if (codeLanguage === 'javascript' || (!isHtmlTagPrefix && codeLanguage === 'html')) {
      const jsKeywords = [
        { label: 'function', type: 'keyword' as const, snippet: 'function name() {\n  \n}' },
        { label: 'const', type: 'keyword' as const },
        { label: 'let', type: 'keyword' as const },
        { label: 'var', type: 'keyword' as const },
        { label: 'return', type: 'keyword' as const },
        { label: 'if', type: 'keyword' as const, snippet: 'if (condition) {\n  \n}' },
        { label: 'else', type: 'keyword' as const },
        { label: 'for', type: 'keyword' as const, snippet: 'for (let i = 0; i < length; i++) {\n  \n}' },
        { label: 'while', type: 'keyword' as const, snippet: 'while (condition) {\n  \n}' },
        { label: 'switch', type: 'keyword' as const, snippet: 'switch (key) {\n  case value:\n    break;\n  default:\n    break;\n}' },
        { label: 'case', type: 'keyword' as const },
        { label: 'break', type: 'keyword' as const },
        { label: 'continue', type: 'keyword' as const },
        { label: 'import', type: 'keyword' as const, snippet: "import module from 'module';" },
        { label: 'export', type: 'keyword' as const },
        { label: 'default', type: 'keyword' as const },
        { label: 'async', type: 'keyword' as const },
        { label: 'await', type: 'keyword' as const },
        { label: 'try', type: 'keyword' as const, snippet: 'try {\n  \n} catch (error) {\n  \n}' },
        { label: 'catch', type: 'keyword' as const },
        { label: 'finally', type: 'keyword' as const },
        { label: 'throw', type: 'keyword' as const },
        { label: 'new', type: 'keyword' as const },
        { label: 'this', type: 'keyword' as const },
        { label: 'typeof', type: 'keyword' as const },
        { label: 'instanceof', type: 'keyword' as const },
        { label: 'class', type: 'keyword' as const, snippet: 'class ClassName {\n  constructor() {\n    \n  }\n}' },
        { label: 'console.log', type: 'builtin' as const, snippet: 'console.log();' },
        { label: 'console.error', type: 'builtin' as const, snippet: 'console.error();' },
        { label: 'document.getElementById', type: 'builtin' as const, snippet: "document.getElementById('')" },
        { label: 'document.querySelector', type: 'builtin' as const, snippet: "document.querySelector('')" },
        { label: 'addEventListener', type: 'builtin' as const, snippet: "addEventListener('click', (e) => {\n  \n})" },
        { label: 'Promise', type: 'builtin' as const, snippet: 'new Promise((resolve, reject) => {\n  \n})' },
        { label: 'setTimeout', type: 'builtin' as const, snippet: 'setTimeout(() => {\n  \n}, 1000);' },
        { label: 'JSON.stringify', type: 'builtin' as const, snippet: 'JSON.stringify()' },
        { label: 'JSON.parse', type: 'builtin' as const, snippet: 'JSON.parse()' }
      ];

      jsKeywords.forEach(item => {
        if (item.label.toLowerCase().startsWith(lowerPrefix) && !suggestions.some(s => s.label === item.label)) {
          suggestions.push(item);
        }
      });
    }

    if ((codeLanguage as string) === 'css') {
      const cssProps = [
        'display', 'flex', 'grid', 'padding', 'margin', 'background', 'color', 'font-size', 'font-family',
        'border', 'position', 'absolute', 'relative', 'fixed', 'sticky', 'width', 'height', 'max-width',
        'min-height', 'justify-content', 'align-items', 'flex-direction', 'gap', 'overflow', 'z-index',
        'cursor', 'transition', 'transform', 'border-radius', 'box-shadow', 'opacity', 'visibility'
      ];

      cssProps.forEach(prop => {
        if (prop.toLowerCase().startsWith(lowerPrefix)) {
          suggestions.push({
            label: prop,
            type: 'property',
            snippet: `${prop}: ;`
          });
        }
      });
    }

    const filtered = suggestions.slice(0, 8);
    if (filtered.length > 0) {
      setAutocompleteSuggestions(filtered);
      setAutocompleteIndex(0);
      setAutocompleteWordStart(cursorPos - fullMatched.length);

      const lines = textBefore.split('\n');
      const lineIndex = lines.length - 1;
      const colIndex = lines[lineIndex].length;
      
      const top = Math.min((lineIndex + 1) * 22 + 4 - (textareaRef.current?.scrollTop || 0), 450);
      const left = Math.min(colIndex * 8 + 12 - (textareaRef.current?.scrollLeft || 0), 600);
      setAutocompletePosition({ top: Math.max(10, top), left: Math.max(10, left) });
    } else {
      setAutocompleteSuggestions([]);
    }
  };

  const applyAutocomplete = (suggestion: { label: string; type: string; snippet?: string }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentContent = textarea.value;
    const insertText = suggestion.snippet || suggestion.label;
    
    const before = currentContent.substring(0, autocompleteWordStart);
    const after = currentContent.substring(textarea.selectionStart || 0);

    const newContent = before + insertText + after;
    handleUpdateContent(newContent);

    let newCursorPos = before.length + insertText.length;

    if (suggestion.snippet) {
      if (suggestion.snippet.includes('()')) {
        newCursorPos = before.length + suggestion.snippet.indexOf('()') + 1;
      } else if (suggestion.snippet.includes("('')")) {
        newCursorPos = before.length + suggestion.snippet.indexOf("('')") + 2;
      } else if (suggestion.type === 'tag' && suggestion.snippet.includes('></')) {
        newCursorPos = before.length + suggestion.snippet.indexOf('></') + 1;
      } else if (suggestion.type === 'property' && suggestion.snippet.includes(': ;')) {
        newCursorPos = before.length + suggestion.snippet.indexOf(': ;') + 2;
      }
    }

    setAutocompleteSuggestions([]);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      setActiveCursorPos(newCursorPos);
    }, 10);
  };

  const handleSelectionChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || start;
      if (updateCursorIndex) {
        updateCursorIndex(start, end);
      }
      setActiveCursorPos(start);

      // Compute exact line & column for status bar
      const textBefore = textarea.value.substring(0, start);
      const lineList = textBefore.split('\n');
      setCursorLine(lineList.length);
      setCursorCol(lineList[lineList.length - 1].length + 1);

      if (start !== end) {
        const text = textarea.value.substring(start, end);
        setSelectedText(text);
        const newRange = { start, end };
        setSelectionRange(newRange);
        updateFloatingMenuCoords(newRange);
      } else {
        setSelectedText('');
        setSelectionRange(null);
        setFloatingMenuCoords(null);
      }

      if (isCodeMode && !isReadOnly) {
        updateAutocompleteSuggestions(textarea.value, start);
      } else {
        setAutocompleteSuggestions([]);
      }
    }
  };

  const activeUsers = realActiveUsers;

  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);
  const prevSyncStatusRef = useRef<string>('');
  const toastTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (room?.updatedAt) {
      setLastSavedTime(room.updatedAt);
    }
  }, [room?.updatedAt]);

  useEffect(() => {
    if (prevSyncStatusRef.current === 'saving' && syncStatus === 'synced') {
      setShowSyncSuccess(true);
      setLastSavedTime(Date.now());
      const timer = setTimeout(() => setShowSyncSuccess(false), 2000);

      // Debounce the notification toast so it triggers after 1.5 seconds of sustained synced state
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        const isLocal = !!activeLocalNoteId || !isFirebaseConfigured;
        if (isLocal) {
          addToast('success', 'Editor document successfully auto-saved to local storage.');
        } else {
          addToast('success', 'Editor document successfully auto-saved to cloud database.');
        }
      }, 1500);

      return () => {
        clearTimeout(timer);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      };
    }
    if (syncStatus) {
      prevSyncStatusRef.current = syncStatus;
    }
  }, [syncStatus, activeLocalNoteId]);

  // Clean raw sync status toastTimeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const contentValue = editorContent;
  const { plainTextContent, charCount, lineCount, wordCount } = useMemo(() => {
    const plain = contentValue ? contentValue.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    return {
      plainTextContent: plain,
      charCount: plain.length,
      lineCount: contentValue ? contentValue.split(/<br\s*\/?>|<\/p>|\n/).filter(Boolean).length || 1 : 1,
      wordCount: plain ? plain.split(/\s+/).filter(Boolean).length : 0,
    };
  }, [contentValue]);



  // Sync scroll on open or layout shift
  useEffect(() => {
    if (searchOpen) {
      setTimeout(handleScroll, 10);
    }
  }, [searchOpen, editorContent]);

  // Real database users currently typing (excluding self)
  const typingUserNames = useMemo(() => Object.entries(room?.typingUsers || {})
    .filter(([userId, isTyping]) => isTyping && userId !== uid)
    .map(([userId]) => {
      const u = room?.users?.[userId];
      return u?.name || 'Someone';
    }), [room?.typingUsers, room?.users, uid]);

  const getCreatedTimeStr = () => {
    if (!room?.createdAt) return 'Now';
    const mins = Math.floor((Date.now() - room.createdAt) / 60000);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  };

  const getUpdatedTimeStr = () => {
    if (!room?.updatedAt) return 'Now';
    const secs = Math.floor((Date.now() - room.updatedAt) / 1000);
    if (secs < 2) return 'Just now';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  };

  // Handle invalid room recovery (if user opens a link to a room that doesn't exist)
  useEffect(() => {
    if (roomCode && liveError === 'Room does not exist.') {
      addToast('error', `Room "${roomCode}" does not exist. Please check the code or create a new room.`);
      setRoomCode(null);
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [roomCode, liveError]);

  // Setup dynamic theme triggers with smooth fade-in animation
  const isInitialThemeMount = useRef<boolean>(true);

  useEffect(() => {
    const applyThemeClasses = (t: Theme) => {
      const rootClasses = document.documentElement.classList;
      rootClasses.remove('dark');
      rootClasses.remove('sepia');
      if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        rootClasses.add('dark');
      } else if (t === 'sepia') {
        rootClasses.add('sepia');
      }
    };

    const updateThemeWithTransition = (t: Theme) => {
      // Prevent flash animation on initial page load
      if (isInitialThemeMount.current) {
        isInitialThemeMount.current = false;
        applyThemeClasses(t);
        return;
      }

      // Add temporary class for smooth CSS background and color transitions
      document.documentElement.classList.add('theme-transition');

      if ('startViewTransition' in document && typeof (document as any).startViewTransition === 'function') {
        try {
          const vt = (document as any).startViewTransition(() => {
            applyThemeClasses(t);
          });
          if (vt && typeof vt.ready?.catch === 'function') {
            vt.ready.catch(() => {});
          }
          if (vt && typeof vt.finished?.catch === 'function') {
            vt.finished.catch(() => {});
          }
        } catch (e) {
          applyThemeClasses(t);
        }
      } else {
        applyThemeClasses(t);
      }

      const timer = setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 400);

      return () => clearTimeout(timer);
    };

    const cleanupTimer = updateThemeWithTransition(theme);
    localStorage.setItem('livepad_theme', theme);

    if (theme === 'system') {
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyThemeClasses('system');
      query.addEventListener('change', listener);
      return () => {
        if (cleanupTimer) cleanupTimer();
        query.removeEventListener('change', listener);
      };
    }

    return () => {
      if (cleanupTimer) cleanupTimer();
    };
  }, [theme]);

  // Offline ready notification
  useEffect(() => {
    if (offlineReady) {
      addToast('success', 'LivePad is cached and ready for full offline use!');
    }
  }, [offlineReady]);

  // Handle PWA shortcut actions (?action=new or ?action=scratchpad)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'new') {
      setIsCreateWizardOpen(true);
    } else if (action === 'scratchpad') {
      setRoomCode(null);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Voice Dictation effect cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    toggleDictation();
  };

  // HTML Debounce Live Update
  useEffect(() => {
    if (!isCodeMode || codeLanguage !== 'html') return;
    if (!isAutoRun) return;

    const handler = setTimeout(() => {
      setHtmlPreviewDoc(editorContent);
    }, 500);

    return () => clearTimeout(handler);
  }, [editorContent, isCodeMode, codeLanguage, isAutoRun]);

  // Execute JavaScript only inside an opaque-origin iframe. The LivePad renderer
  // never evaluates user code directly, so editor state and storage stay isolated.
  const buildJavaScriptSandboxDocument = (codeStr: string) => {
    const safeCode = JSON.stringify(codeStr).replaceAll('</script', '<\\/script');
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:"></head><body style="margin:0;background:#09090b;color:#e4e4e7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace"><script>
(() => {
  const send=(type,payload)=>parent.postMessage({source:'livepad-js-sandbox',type,payload},'*');
  const stringify=(value)=>{try{if(typeof value==='string')return value;if(typeof value==='undefined')return 'undefined';if(typeof value==='bigint')return value+'n';if(value instanceof Error)return value.stack||value.message;return JSON.stringify(value,null,2)}catch{return String(value)}};
  const proxy={};
  ['log','info','warn','error'].forEach(level=>proxy[level]=(...args)=>send('CONSOLE_LOG',{level,message:args.map(stringify).join(' ')}));
  window.console=proxy;
  window.onerror=(message,source,line,column,error)=>send('RUNTIME_ERROR',{message:String(message),line,column,stack:error&&error.stack});
  window.onunhandledrejection=(event)=>send('RUNTIME_ERROR',{message:stringify(event.reason)});
  const source=${safeCode};
  try { const script=document.createElement('script'); script.textContent=source; document.body.appendChild(script); send('EXECUTION_COMPLETE',{}); }
  catch(error){ send('RUNTIME_ERROR',{message:error instanceof Error?error.message:String(error),stack:error&&error.stack}); }
})();
</script></body></html>`;
  };

  const executeSandboxCode = () => {
    if (codeLanguage === 'html') {
      setHtmlPreviewDoc(editorContent);
      setIframeKey(prev => prev + 1);
      addToast('success', 'Web rendering preview generated successfully.');
      return;
    }
    setConsoleLogs([]);
    setJsSandboxDoc(buildJavaScriptSandboxDocument(editorContent));
    setSandboxRunKey(prev => prev + 1);
    addToast('success', 'JavaScript started in the isolated browser sandbox.');
  };

  useEffect(() => {
    const handleSandboxMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'livepad-js-sandbox') return;
      if (event.source !== jsSandboxFrameRef.current?.contentWindow) return;
      const payload = event.data.payload || {};
      if (event.data.type === 'CONSOLE_LOG') {
        const type = payload.level === 'error' ? 'error' : payload.level === 'warn' ? 'warn' : payload.level === 'info' ? 'info' : 'log';
        setConsoleLogs(prev => [...prev, { type, text: String(payload.message ?? ''), id: Date.now() + prev.length }]);
      } else if (event.data.type === 'RUNTIME_ERROR') {
        setConsoleLogs(prev => [...prev, { type: 'error', text: String(payload.message ?? 'Runtime error'), id: Date.now() + prev.length }]);
      }
    };
    window.addEventListener('message', handleSandboxMessage);
    return () => window.removeEventListener('message', handleSandboxMessage);
  }, []);

  const loadCodeTemplate = () => {
    if (codeLanguage === 'html') {
      handleUpdateContent(`<!-- Welcome to LivePad HTML Playground! -->
<div class="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-sans tracking-tight transition-all duration-300">
  <div class="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-8 rounded-3xl border border-slate-200/55 dark:border-zinc-800 shadow-xl max-w-sm w-full transition-all hover:scale-[1.01] hover:shadow-2xl">
    <span class="text-4xl animate-bounce inline-block">🚀</span>
    <h2 class="text-2xl font-black text-slate-800 dark:text-white mt-4 leading-tight">LivePad Sandbox</h2>
    <p class="text-slate-500 dark:text-zinc-400 text-sm mt-2">Write modern web documents leveraging Tailwind CSS inside collaborative real-time rooms.</p>
    
    <div class="mt-6 p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800/60 text-left">
      <span class="text-xs font-mono text-indigo-500 dark:text-indigo-400 font-bold block mb-1">Simple Local Clicker:</span>
      <div class="flex items-center justify-between">
        <span id="counter" class="text-3xl font-black text-slate-700 dark:text-neutral-200">0</span>
        <button id="btn" class="bg-indigo-600 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-md hover:shadow-indigo-500/10 hover:bg-indigo-700 cursor-pointer">
          Press Me +
        </button>
      </div>
    </div>
  </div>

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    let count = 0;
    const num = document.getElementById('counter');
    document.getElementById('btn').addEventListener('click', () => {
      count++;
      num.textContent = count;
      num.classList.add('scale-110', 'text-indigo-600', 'dark:text-indigo-400');
      setTimeout(() => num.classList.remove('scale-110', 'text-indigo-600', 'dark:text-indigo-400'), 150);
    });
  </script>
</div>`);
    } else {
      handleUpdateContent(`// Welcome to LivePad JavaScript Console!
// Write real ES6/Javascript code and view output results captures.

const creators = ["Bibek Bista", "AI Coding Agent"];
console.log("⚡ Compiling Sandbox JS execution pipelines...");

const showWelcomeMessage = (developerName) => {
  console.info(\`Greetings to \${developerName}! LivePad is ready to run code.\`);
};

creators.forEach(dev => showWelcomeMessage(dev));

const sampleObject = {
  appName: "LivePad",
  isRealtime: true,
  collaboratorsOnline: 4
};
console.log("Workspace example:", sampleObject);

console.warn("Verify your variables before deployment!");
`);
    }
    // Refresh states
    setTimeout(() => {
      setHtmlPreviewDoc(editorContent);
      setIframeKey(prev => prev + 1);
    }, 100);
    addToast('success', `${codeLanguage.toUpperCase()} code sandbox template loaded.`);
  };

  const handleInsertSnippet = (snippet: CodeSnippet, replaceAll: boolean = false) => {
    let newContent = '';
    
    if (replaceAll) {
      if (editorInstance) {
        editorInstance.commands.setContent(snippet.code);
      } else {
        newContent = snippet.code;
        handleUpdateContent(newContent);
      }
      addToast('success', `Editor content replaced with "${snippet.title}".`);
    } else {
      if (editorInstance) {
        editorInstance.chain().focus().insertContent(snippet.code).run();
      } else {
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentVal = textarea.value;
          
          const beforeStr = currentVal.substring(0, start);
          const afterStr = currentVal.substring(end);
          
          const needsNLBefore = beforeStr.length > 0 && !beforeStr.endsWith('\n');
          const needsNLAfter = afterStr.length > 0 && !afterStr.startsWith('\n');
          
          const snippetText = (needsNLBefore ? '\n' : '') + snippet.code + (needsNLAfter ? '\n' : '');
          newContent = beforeStr + snippetText + afterStr;
          
          handleUpdateContent(newContent);
          
          setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + snippetText.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            if (updateCursorIndex) {
              updateCursorIndex(newCursorPos);
            }
          }, 50);
        } else {
          const currentVal = editorContent;
          const needsNLBefore = currentVal.length > 0 && !currentVal.endsWith('\n');
          newContent = currentVal + (needsNLBefore ? '\n' : '') + snippet.code;
          handleUpdateContent(newContent);
        }
      }
      addToast('success', `Snippet "${snippet.title}" successfully inserted at cursor.`);
    }

    setIsSnippetDropdownOpen(false);

    // If HTML mode and active autoRun, force render update
    if (codeLanguage === 'html' && isAutoRun) {
      setTimeout(() => {
        setHtmlPreviewDoc(newContent);
      }, 100);
    }
  };

  const toggleFullScreenAndFocus = () => {
    const nextVal = !isFullscreen;
    setIsFullscreen(nextVal);
    
    try {
      if (nextVal) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
        setSidebarOpen(false);
        addToast('success', 'Focus Mode enabled. Pure focus, zero distractions.');
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen();
        }
        setSidebarOpen(true);
        addToast('info', 'Exited Focus Mode.');
      }
    } catch (e) {
      if (nextVal) {
        setSidebarOpen(false);
        addToast('success', 'Focus Mode enabled.');
      } else {
        setSidebarOpen(true);
        addToast('info', 'Exited Focus Mode.');
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Automatically collapse workspace info sidebar 5 seconds after document load to maximize writing space
  useEffect(() => {
    const autoHideTimer = setTimeout(() => {
      setSidebarOpen(false);
    }, 5000);
    return () => clearTimeout(autoHideTimer);
  }, []);

  // Automatically collapse sidebar after 3 seconds of inactivity when in Focus Mode (isFullscreen)
  useEffect(() => {
    if (!isFullscreen || !sidebarOpen || !autoCollapseEnabled) return;

    let activityTimeoutId: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (activityTimeoutId) clearTimeout(activityTimeoutId);
      activityTimeoutId = setTimeout(() => {
        setSidebarOpen(false);
      }, 3000);
    };

    // Initialize timer on mount or state change
    resetInactivityTimer();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (activityTimeoutId) clearTimeout(activityTimeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isFullscreen, sidebarOpen]);

  // Automatically switch to read-only after 5 minutes of inactivity if currently in write mode
  useEffect(() => {
    if (isReadOnly) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsReadOnly(true);
        addToast('info', 'Notepad was automatically set to read-only due to 5 minutes of inactivity.');
      }, 5 * 60 * 1000); // 5 minutes
    };

    resetTimer();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isReadOnly]);

  // Copy Room Code Helper
  const [hasCopied, setHasCopied] = useState(false);
  const handleCopyCodeOnly = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode)
      .then(() => {
        setHasCopied(true);
        addToast('success', 'Room code copied to clipboard!');
        setTimeout(() => setHasCopied(false), 2000);
      })
      .catch(() => addToast('error', 'Clipboard access denied.'));
  };

  // Keyboard Command Handlers
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setShortcutsModalOpen((prev) => !prev);
      }

      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          e.preventDefault();
        } else if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery('');
          setMatches([]);
          setActiveMatchIndex(0);
          textareaRef.current?.focus();
          e.preventDefault();
          e.stopPropagation();
        } else {
          setJoinModalOpen(false);
          setShortcutsModalOpen(false);
          setShowExportMenu(false);
        }
      }

      // Command Palette (Ctrl+Shift+P or Ctrl+K / Cmd+K)
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Sidebar Toggles (Ctrl+B / Ctrl+Shift+B)
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        layout.toggleRightSidebar();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        layout.toggleLeftSidebar();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        if (roomCode || activeLocalNoteId) {
          if (searchOpen) {
            const input = document.getElementById('editor-search-input');
            input?.focus();
            (input as HTMLInputElement)?.select();
          } else {
            setSearchOpen(true);
            setTimeout(() => {
              const input = document.getElementById('editor-search-input');
              input?.focus();
              (input as HTMLInputElement)?.select();
            }, 50);
          }
        }
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (roomCode || activeLocalNoteId) {
          addToast('info', 'Document synchronized securely.');
        }
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
        addToast('info', 'Theme toggled successfully!');
      }

      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (roomCode) {
          handleCopyCodeOnly();
        }
      }

      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullScreenAndFocus();
      }
    };

    window.addEventListener('keydown', handleKeys, true);
    return () => window.removeEventListener('keydown', handleKeys, true);
  }, [roomCode, activeLocalNoteId, searchOpen, isFullscreen, commandPaletteOpen, layout]);

  // Create Room Dispatcher
  const dispatchCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreatingRoom(true);

    const finalName = nameInput.trim() || auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || '';
    if (!finalName) {
      addToast('error', 'Enter your real name before creating a workspace.');
      setIsCreatingRoom(false);
      return;
    }
    localStorage.setItem('livepad_username', finalName);
    setUserName(finalName);
    setEditedName(finalName);

    let activeUid = auth?.currentUser?.uid || uid;
    let cloudAuthenticated = Boolean(auth?.currentUser?.uid);
    if (isFirebaseConfigured && auth && !auth.currentUser) {
      const cloudUser = await ensureAuth();
      if (cloudUser?.uid) {
        activeUid = cloudUser.uid;
        cloudAuthenticated = true;
      }
    }
    const currentUid = activeUid || (localStorage.getItem('livepad_local_uid') || (() => {
      const localUid = 'local_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('livepad_local_uid', localUid);
      return localUid;
    })());

    let uniqueCode = generateRoomCode();
    // Guarantee collision resistance by querying Firestore
    if (isFirebaseConfigured && db && cloudAuthenticated) {
      try {
        let attempts = 0;
        while (attempts < 3) {
          const checkSnap = await getDoc(doc(db, 'rooms', uniqueCode));
          if (!checkSnap.exists()) break;
          uniqueCode = generateRoomCode();
          attempts++;
        }
      } catch (_) {}
    }

    const wsType = selectedWorkspaceType || 'team';
    const typeDef = WORKSPACE_TYPES[wsType] || WORKSPACE_TYPES.team;
    const wsName = customWorkspaceName.trim() || typeDef.title;
    const limit = customParticipantLimit && customParticipantLimit > 0 ? customParticipantLimit : typeDef.defaultLimit;

    const userColorLocal = localStorage.getItem('livepad_color') || '#3b82f6';

    const welcomeContent = `Welcome to ${wsName} (${uniqueCode})!\n\nStart together, keep it simple, and learn by doing.\n\nIn Code Studio you can:\n• open the same coding session together\n• edit code in real time\n• run the code and see the result\n• ask questions in chat and discuss code\n\n${wsType === 'teaching' ? 'Teacher: open Code Studio when the class is ready. Students will follow automatically.' : 'Friends: everyone can learn, experiment, and help each other.'}\n\nTip: start with one small change, then Run & Check.`;

    try {
      if (isFirebaseConfigured && db && cloudAuthenticated) {
        const roomPayload = {
          workspaceId: uniqueCode,
          roomCode: uniqueCode,
          workspaceType: wsType,
          workspaceName: wsName,
          ownerId: currentUid,
          ownerName: finalName,
          createdBy: currentUid,
          creatorId: currentUid,
          creatorRole: 'owner',
          workspaceRoleVersion: 2,
          status: 'active',
          privacy: selectedPrivacy || 'public',
          participantLimit: limit,
          defaultRole: wsType === 'teaching' ? 'student' : 'member',
          participants: {
            [currentUid]: {
              uid: currentUid,
              name: finalName,
              role: 'owner',
              joinedAt: Date.now(),
              color: userColorLocal,
              isOnline: true,
              lastActive: Date.now()
            }
          },
          permissions: {
            allowGuestEdit: true,
            allowChat: true,
            allowExport: true
          },
          content: welcomeContent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          title: wsName,
          label: '',
          codeModeOpen: false,
          users: {
            [currentUid]: {
              uid: currentUid,
              name: finalName,
              joinedAt: Date.now(),
              color: userColorLocal,
              isOnline: true,
              lastActive: Date.now(),
              role: 'owner'
            }
          },
          typingUsers: {},
          attachments: []
        };

        if (!isFirestoreQuotaExhausted()) {
          try {
            await setDoc(doc(db, 'rooms', uniqueCode), roomPayload);
            
          } catch (firestoreErr: any) {
            if (String(firestoreErr).includes('resource-exhausted') || String(firestoreErr).includes('Quota')) {
              markQuotaExhausted();
            } else {
              console.error("Firestore room creation failed:", firestoreErr);
              const errorMessage = firestoreErr?.message || String(firestoreErr);
              addToast('error', `Failed to persist workspace to cloud database: ${errorMessage}`);
              try {
                handleFirestoreError(firestoreErr, OperationType.CREATE, `rooms/${uniqueCode}`);
              } catch (_) {}
              return;
            }
          }
        }
      }

      // Keep a complete local room descriptor so another tab can join the same
      // room when Firebase Authentication is unavailable. Cloud multi-device
      // collaboration still requires a real Firebase-authenticated user.
      try {
        localStorage.setItem(`livepad_local_room_${uniqueCode}`, welcomeContent);
        localStorage.setItem(`livepad_local_room_meta_${uniqueCode}`, JSON.stringify({
          workspaceId: uniqueCode, roomCode: uniqueCode, workspaceName: wsName, title: wsName,
          workspaceType: selectedWorkspaceType, privacy: selectedPrivacy,
          participantLimit: customParticipantLimit || typeDef.defaultLimit,
          creatorId: currentUid, creatorRole: 'owner', defaultRole: typeDef.participantRole,
          ownerName: finalName, status: 'active', codeModeOpen: false,
          participants: { [currentUid]: { uid: currentUid, name: finalName, role: 'owner', joinedAt: Date.now(), color: userColorLocal, isOnline: true, lastActive: Date.now() } },
          createdAt: Date.now(), updatedAt: Date.now()
        }));
      } catch {}

      const navigated = await handleNavigateRoom(uniqueCode);
      if (navigated) {
        setCreateModalOpen(false);
        addToast('success', `Created ${typeDef.title}: ${uniqueCode}`);
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', `Critical workspace creation exception: ${err?.message || err}`);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Join Room verification routine
  const dispatchJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    const rawInput = targetRoomInput.trim();
    if (!rawInput) {
      addToast('error', 'Please enter a room code.');
      return;
    }

    const { valid, message, cleanCode } = validateRoomCodeFormat(rawInput);
    if (!valid || !cleanCode) {
      addToast('error', message || 'Invalid room code format.');
      return;
    }

    setIsVerifyingRoom(true);

    const finalName = nameInput.trim() || auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || '';
    if (!finalName) {
      addToast('error', 'Enter your real name before joining a workspace.');
      setIsVerifyingRoom(false);
      return;
    }
    localStorage.setItem('livepad_username', finalName);
    setUserName(finalName);
    setEditedName(finalName);

    try {
      const success = await handleNavigateRoom(cleanCode);
      if (success) {
        setJoinModalOpen(false);
        setTargetRoomInput('');
        addToast('success', `Joined workspace: ${cleanCode}`);
      }
    } finally {
      setIsVerifyingRoom(false);
    }
  };

  // Save updated pseudonym
  const saveNickname = () => {
    const trimmed = editedName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    localStorage.setItem('livepad_username', trimmed);
    setIsEditingNickname(false);
    addToast('success', `Username updated to "${trimmed}"`);
  };

  // Exit current workspace room
  const handleExitRoom = () => {
    handleNavigateRoom(null);
    setActiveLocalNoteId(null);
    localStorage.removeItem('livepad_active_local_note_id');
    addToast('info', 'Returned to Home Dashboard.');
  };

  // Export handlers dispatcher
  const handleExportTxt = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    exportToTxt(codeOrTitle, editorInstance || editorContent, addToast);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    exportToPdf(codeOrTitle, editorInstance || editorContent, addToast);
    setShowExportMenu(false);
  };

  const handleExportDocx = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    exportToDocx(codeOrTitle, editorInstance || editorContent, addToast);
    setShowExportMenu(false);
  };

  const handleExportHtml = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    exportToHtml(codeOrTitle, editorInstance || editorContent, addToast);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    exportToMarkdown(codeOrTitle, editorInstance || editorContent, addToast);
    setShowExportMenu(false);
  };

  const handleExportEpub = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    exportToEpub(codeOrTitle, editorInstance || editorContent, addToast);
    setShowExportMenu(false);
  };

  const handlePrintDocument = () => {
    const codeOrTitle = activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
    setPrintTargetTitle(codeOrTitle);
    setShowPrintConfirmModal(true);
    setShowExportMenu(false);
  };

  const handleConfirmPrint = () => {
    printDocument(printTargetTitle, editorInstance || editorContent, addToast, true);
  };

  const handleExportJson = () => {
    try {
      const isLocal = !!activeLocalNoteId;
      const id = isLocal ? activeLocalNoteId : roomCode;
      const title = isLocal ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room');
      const documentContent = editorInstance ? editorInstance.getHTML() : editorContent;
      const documentJson = editorInstance ? editorInstance.getJSON() : null;

      const exportData = {
        type: isLocal ? 'local_note' : 'collaborative_room',
        id,
        title,
        content: documentContent,
        documentJson,
        language: codeLanguage,
        createdAt: isLocal ? activeLocalNote?.createdAt : (room?.createdAt || null),
        updatedAt: isLocal ? activeLocalNote?.updatedAt : (room?.updatedAt || null),
        label: isLocal ? undefined : (room?.label || ''),
        activeUsers: isLocal ? [] : activeUsers.map(u => ({
          uid: u.uid,
          name: u.name,
          color: u.color,
          joinedAt: u.joinedAt,
          isOnline: u.isOnline,
          lastActive: u.lastActive
        })),
        history: isLocal ? [] : history.map(h => ({
          id: h.id,
          content: h.content,
          updatedAt: h.updatedAt,
          authorName: h.authorName
        })),
        exportedAt: Date.now()
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `livepad_${isLocal ? 'note' : 'room'}_${id || 'export'}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      addToast('success', 'Successfully exported!');
      setShowExportMenu(false);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to export data as JSON.');
    }
  };

  return (
    <div className={`h-screen w-screen overflow-hidden text-slate-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300 selection:bg-cyan-500/30`}>
      {/* Immersive cinematic intro overlay (Identical on Web and Installed Desktop PWA) */}
      <AnimatePresence>
        {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Background Orbs & Sparkles to match image */}
      <BackgroundParticles />

      {/* PWA Update / Refresh Banner */}
      <AnimatePresence>
        {needRefresh && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md bg-slate-900/95 dark:bg-zinc-950/95 border border-cyan-500/30 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400">Update Available!</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  A new production-ready version of LivePad is available. Refresh now to experience the latest offline capabilities and feature updates instantly.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={dismissUpdate}
                className="cursor-pointer px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => updateServiceWorker(true)}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-black font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-cyan-500/10 transition-all hover:scale-105"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Now</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkles decorative layers */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 dark:opacity-60 overflow-hidden">
        <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-cyan-200 blur-xs opacity-70" />
        <div className="absolute top-[45%] right-[25%] w-3 h-3 rounded-full bg-violet-400/50 opacity-60" />
        <div className="absolute bottom-[30%] left-[45%] w-1.5 h-1.5 rounded-full bg-emerald-300 opacity-60" />
        <div className="absolute top-[75%] right-[10%] w-2.5 h-2.5 rounded-full bg-teal-200/60 opacity-60" />
      </div>

      {/* Persistent Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Offline Architecture Banner & Sync Queue Monitor */}
      <OfflineBanner
        isOnline={offlineSync.isOnline}
        isSyncing={offlineSync.isSyncing}
        pendingQueueCount={offlineSync.pendingQueueCount}
        queueItems={offlineSync.queueItems}
        syncError={offlineSync.syncError}
        storageError={offlineSync.storageError}
        onSyncNow={offlineSync.processQueue}
        onRefresh={offlineSync.refreshQueue}
        onClearQueue={offlineSync.clearQueue}
        onExportBackup={offlineSync.exportQueueBackup}
        onClearSyncError={offlineSync.clearSyncError}
        onClearStorageError={offlineSync.clearStorageError}
      />

      {/* Desktop App Setup Wizard (Installed PWA First-Time Setup after Intro) */}
      {isDesktopApp && !showIntro && showDesktopSetup && (
        <DesktopSetupWizard
          theme={theme}
          onComplete={(profile) => {
            setShowDesktopSetup(false);
            const effectiveName = profile.displayName || profile.firstName;
            setUserName(effectiveName);
            addToast('success', `Welcome to LivePad Desktop, ${profile.firstName}!`);
          }}
        />
      )}

      {/* Main Container Views Router */}
      <AnimatePresence mode="wait">
        {isDesktopApp && !roomCode && !activeLocalNoteId ? (
          <DesktopDashboard
            userName={userName}
            onOpenWorkspace={(code) => {
              handleNavigateRoom(code);
            }}
            onOpenLocalNote={(id) => {
              if (id) {
                handleNavigateToLocalNote(id);
              } else {
                handleCreateLocalNote();
              }
            }}
            onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenAdminModal={() => setIsAdminDashboardOpen(true)}
            theme={theme}
            onThemeChange={setTheme}
          />
        ) : !roomCode && !activeLocalNoteId ? (
          /* ================= LANDING PAGE REDESIGN ================= */
          <main
            key="landing"
            className="livepad-scroll-surface livepad-landing-shell flex-1 w-full h-full overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 flex flex-col items-center justify-start z-10 no-scrollbar"
          >
            {/* Upper Nav Header */}
            <div className="livepad-landing-nav w-full flex items-center justify-between pointer-events-auto">
              <Logo />
              <div className="flex items-center gap-4">
                {isInstallable && !isAppInstalled && (
                  <>
                    <button
                      type="button"
                      onClick={handleInstallApp}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white shadow-md text-[10px] font-extrabold uppercase tracking-widest rounded-full cursor-pointer transition-colors shadow-cyan-500/10"
                      title="Install LivePad on your local device!"
                    >
                      <Download className="w-3.5 h-3.5 animate-bounce" />
                      <span>Install App</span>
                    </button>
                    <div className="w-[1.5px] h-4 bg-slate-300 dark:bg-zinc-800 hidden sm:block" />
                  </>
                )}
                <button
                  onClick={() => setShortcutsModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 hover:text-cyan-500 hover:scale-105 transition-all"
                >
                  <Keyboard className="w-4 h-4" /> Keyboard
                </button>
                <div className="w-[1.5px] h-4 bg-slate-300 dark:bg-zinc-800 hidden sm:block" />
                <div className="flex p-0.5 b-1 bg-white/75 dark:bg-black/30 sepia:bg-[#3f2f1e]/20 rounded-full border border-white/40 dark:border-white/5 sepia:border-[#3f2f1e]/10">
                  <button type="button" onClick={() => setTheme('light')} title="Light Theme" className="p-0 border-0 bg-transparent cursor-pointer">
                    <Sun
                      className={`w-6 h-6 p-1 rounded-full transition-all ${theme === 'light' ? 'bg-white text-orange-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    />
                  </button>
                  <button type="button" onClick={() => setTheme('system')} title="System Theme" className="p-0 border-0 bg-transparent cursor-pointer">
                    <Cloud
                      className={`w-6 h-6 p-1 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-800 text-cyan-500 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    />
                  </button>
                  <button type="button" onClick={() => setTheme('dark')} title="Dark Theme" className="p-0 border-0 bg-transparent cursor-pointer">
                    <Moon
                      className={`w-6 h-6 p-1 rounded-full transition-all ${theme === 'dark' ? 'bg-zinc-800 text-indigo-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    />
                  </button>
                  <button type="button" onClick={() => setTheme('sepia')} title="Sepia Theme" className="p-0 border-0 bg-transparent cursor-pointer">
                    <BookOpen
                      className={`w-6 h-6 p-1 rounded-full transition-all ${theme === 'sepia' ? 'bg-[#f6ebd4] text-amber-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Title / Slogan Section */}
            <div className="my-auto py-10 md:py-14 flex flex-col items-center text-center max-w-4xl space-y-6">
              
              <div className="relative mb-2 mt-4">
                {/* Large Center Logo with Click pointer rays to match exact design */}
                <div
                  initial={{ rotate: -5, scale: 0.95 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-4"
                >
                  <Logo iconSize={110} showText={false} />
                  
                  <h2 className="text-5xl md:text-7xl font-black tracking-[-0.055em] font-sans mt-1 flex items-center justify-center uppercase select-none">
                    <span className="text-[#0000ff] dark:text-[#3b82f6]">Live</span>
                    <span className="text-slate-800 dark:text-zinc-100">Pad</span>
                  </h2>

                  <p className="text-xs md:text-sm font-bold tracking-[0.25em] text-slate-400 dark:text-neutral-500 uppercase select-none">
                    Real-Time Notes, Seamlessly
                  </p>
                </div>
                
                <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-emerald-400 animate-pulse opacity-40 blur-md" />
                <div className="absolute -bottom-6 -left-6 w-14 h-14 rounded-full bg-cyan-400 animate-pulse opacity-30 blur-md" />
              </div>

              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium tracking-wide max-w-2xl">
                Real-time Collaboration. Infinite Expression.
              </p>

              {/* PWA install CTA — restored on the main landing page when the browser exposes a real install prompt. */}
              {isInstallable && !isAppInstalled && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="mt-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-extrabold tracking-wide shadow-md shadow-cyan-500/15 transition-colors cursor-pointer"
                  title="Install LivePad as an app"
                >
                  <Download className="w-4 h-4" />
                  Install LivePad App
                </button>
              )}

              {/* Offline disclaimer if Firebase is absent */}
              {!isFirebaseConfigured && (
                <div className="p-3 w-full max-w-2xl rounded-2xl border border-amber-200/50 bg-amber-50/70 text-amber-900/95 dark:border-amber-950/20 dark:bg-amber-950/20 dark:text-amber-200/95 backdrop-blur-md flex gap-2.5 text-xs text-left leading-relaxed">
                  <Info className="w-5 h-5 shrink-0 text-amber-500" />
                  <div>
                    <span className="font-semibold">Local Sandbox Sync</span> (Broadcasting locally on this browser). Configure Firebase key in parameters to persist globally!
                  </div>
                </div>
              )}

              {/* Dual Column Layout: Collaboration vs Personal Notepad */}
              <div className="w-full max-w-5xl mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                
                {/* COLUMN 1: COLLABORATIVE ROOMS */}
                <div className="livepad-landing-panel p-6 md:p-7 rounded-2xl bg-white/90 dark:bg-zinc-900/85 border border-slate-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-5 h-full min-h-[350px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span className="text-[11px] font-medium tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                          Collaborative Rooms
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Online Mode
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="nickname-input-home" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Your Writer Profile
                      </label>
                      <input
                        id="nickname-input-home"
                        type="text"
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          setEditedName(e.target.value);
                        }}
                        placeholder="Enter your nickname..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 font-normal focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-xs sm:text-sm"
                      />
                    </div>
                    
                    <p className="text-xs font-normal text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Create a shared digital room or connect with partners to edit and coordinate documents in real-time with live presence indicators.
                    </p>
                    {isFirebaseConfigured && (
                      <div className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500 dark:text-zinc-500">
                        <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                        <span>Public teaching rooms can use secure guest cloud authentication; private rooms still require membership.</span>
                      </div>
                    )}
                  </div>

                  {/* Room Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="cursor-pointer py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <>Create Workspace <Plus className="w-4 h-4" /></>
                    </button>

                    <button
                      onClick={() => setJoinModalOpen(true)}
                      className="cursor-pointer py-2.5 px-4 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      Join Room <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: MY LOCAL NOTEPAD & TRASH BIN */}
                <div className="p-6 rounded-2xl bg-white/85 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between gap-4 h-full min-h-[360px]">
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/60 pb-3">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                        <button
                          type="button"
                          onClick={() => setNotepadViewMode('active')}
                          className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            notepadViewMode === 'active'
                              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Notes ({localNotes.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotepadViewMode('workspaces')}
                          className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            notepadViewMode === 'workspaces'
                              ? 'bg-white dark:bg-zinc-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>Workspaces ({userWorkspaces.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotepadViewMode('trash')}
                          className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            notepadViewMode === 'trash'
                              ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Trash ({trashedNotes.length})</span>
                        </button>
                      </div>
                      
                      {notepadViewMode === 'active' ? (
                        <button
                          onClick={handleCreateLocalNote}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                        >
                          <Plus className="w-3 h-3" /> New Note
                        </button>
                      ) : notepadViewMode === 'workspaces' ? (
                        <button
                          onClick={() => setCreateModalOpen(true)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                        >
                          <Plus className="w-3 h-3" /> New Room
                        </button>
                      ) : trashedNotes.length > 0 ? (
                        <button
                          onClick={handleEmptyTrash}
                          className="cursor-pointer text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                        >
                          Empty Trash
                        </button>
                      ) : null}
                    </div>

                    {/* Scrollable list of local notes, online workspaces, or trashed notes */}
                    <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 space-y-2 no-scrollbar">
                      {notepadViewMode === 'active' ? (
                        localNotes.length === 0 ? (
                          <div className="h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                            <BookOpen className="w-7 h-7 text-slate-300 dark:text-zinc-700 mb-2" />
                            <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                              No notepad files saved.
                            </span>
                            <button
                              onClick={handleCreateLocalNote}
                              className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline mt-1 cursor-pointer"
                            >
                              Create first note
                            </button>
                          </div>
                        ) : (
                          localNotes.map((note) => {
                            const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;
                            return (
                              <div
                                key={note.id}
                                onClick={() => handleNavigateToLocalNote(note.id)}
                                className="group p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 hover:border-sky-500/50 transition-all duration-200 flex items-center justify-between cursor-pointer shadow-xs"
                              >
                                <div className="flex flex-col min-w-0 flex-1 pr-3">
                                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                    {note.title || 'Untitled Notepad Doc'}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                      {wordCount} words
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">
                                      {new Date(note.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} {new Date(note.updatedAt).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', hour12: false})}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => handleDeleteLocalNote(note.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md cursor-pointer transition-all shrink-0"
                                  title="Move to Trash Bin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )
                      ) : notepadViewMode === 'workspaces' ? (
                        userWorkspaces.length === 0 ? (
                          <div className="h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                            <FolderKanban className="w-7 h-7 text-slate-300 dark:text-zinc-700 mb-2" />
                            <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                              No online workspaces saved.
                            </span>
                            <button
                              onClick={() => setCreateModalOpen(true)}
                              className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline mt-1 cursor-pointer"
                            >
                              Create a workspace
                            </button>
                          </div>
                        ) : (
                          userWorkspaces.map((ws) => {
                            const code = ws.roomCode || ws.workspaceId;
                            const isCurrentRoom = code === roomCode;
                            return (
                              <div
                                key={ws.workspaceId || ws.id}
                                onClick={() => handleNavigateRoom(code)}
                                className={`group p-3 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer shadow-xs ${
                                  isCurrentRoom
                                    ? 'bg-cyan-500/10 border-cyan-500/40'
                                    : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700/80 hover:border-cyan-500/50'
                                }`}
                              >
                                <div className="flex flex-col min-w-0 flex-1 pr-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                      {ws.title || 'Collaborative Workspace'}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                      {code}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                                    <span className="capitalize text-indigo-600 dark:text-indigo-400 font-bold">
                                      {ws.role || 'Member'}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">
                                      Opened {new Date(ws.lastOpened || Date.now()).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => handleTogglePinWorkspace(e, ws.workspaceId, ws.pinned)}
                                    className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors ${ws.pinned ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                                    title={ws.pinned ? 'Unpin Workspace' : 'Pin Workspace'}
                                  >
                                    <Pin className={`w-3.5 h-3.5 ${ws.pinned ? 'fill-current' : ''}`} />
                                  </button>

                                  <button
                                    onClick={(e) => handleToggleFavoriteWorkspace(e, ws.workspaceId, ws.favorite)}
                                    className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors ${ws.favorite ? 'text-amber-500' : 'text-slate-400'}`}
                                    title={ws.favorite ? 'Unfavorite' : 'Favorite'}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${ws.favorite ? 'fill-current' : ''}`} />
                                  </button>

                                  <button
                                    onClick={(e) => handleRemoveWorkspaceFromNotes(e, ws.workspaceId)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                                    title="Remove from My Notes"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )
                      ) : (
                        trashedNotes.length === 0 ? (
                          <div className="h-[140px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                            <Trash2 className="w-7 h-7 text-slate-300 dark:text-zinc-700 mb-2" />
                            <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                              Trash Bin is empty.
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                              Deleted notes are kept for 30 days before permanent removal.
                            </span>
                          </div>
                        ) : (
                          trashedNotes.map((note) => {
                            const daysLeft = getDaysRemainingInTrash(note.deletedAt);
                            return (
                              <div
                                key={note.id}
                                className="group p-3 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 flex items-center justify-between shadow-xs"
                              >
                                <div className="flex flex-col min-w-0 flex-1 pr-3">
                                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                                    {note.title || 'Untitled Note'}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>{daysLeft === 1 ? 'Expires in 1 day' : `Expires in ${daysLeft} days`}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={(e) => handleRestoreNote(note.id, e)}
                                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md cursor-pointer transition-all flex items-center gap-1 text-[11px] font-bold"
                                    title="Restore Note"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Restore</span>
                                  </button>
                                  <button
                                    onClick={(e) => handlePermanentDeleteNote(note.id, e)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-md cursor-pointer transition-all"
                                    title="Delete Permanently"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 text-center uppercase tracking-wider border-t border-slate-200/60 dark:border-zinc-800/60 pt-2.5">
                    Locally stored on your device
                  </div>
                </div>

              </div>
            </div>

            {/* Features Showcase Renders */}
            <div className="livepad-deferred-surface w-full pt-12 border-t border-slate-300/20 dark:border-zinc-800/20">
              <h3 className="text-center font-extrabold text-sm tracking-widest text-[#0ea5e9] uppercase mb-8">
                Features
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="livepad-landing-card p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-white/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center space-y-2 transition-all duration-200 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-[0_20px_25px_-5px_rgba(14,165,233,0.1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Users className="w-5 h-5 animate-bounce-slow" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Real-time collaboration</span>
                </div>

                <div className="livepad-landing-card p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-white/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center space-y-2 transition-all duration-200 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-[0_20px_25px_-5px_rgba(14,165,233,0.1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                    <Activity className="w-5 h-5 " />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Instant Update</span>
                </div>

                <div className="livepad-landing-card p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-white/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center space-y-2 transition-all duration-200 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-[0_20px_25px_-5px_rgba(14,165,233,0.1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Secure code</span>
                </div>

                <div className="livepad-landing-card p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-white/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center space-y-2 transition-all duration-200 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-[0_20px_25px_-5px_rgba(14,165,233,0.1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Auto-save</span>
                </div>

                <div className="livepad-landing-card p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-white/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center space-y-2 transition-all duration-200 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-[0_20px_25px_-5px_rgba(14,165,233,0.1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Cross-device</span>
                </div>

                <div className="livepad-landing-card p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/80 border border-white/60 dark:border-white/5 shadow-xs flex flex-col items-center text-center space-y-2 transition-all duration-200 hover:border-sky-500/40 dark:hover:border-sky-500/40 hover:shadow-[0_20px_25px_-5px_rgba(14,165,233,0.1)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 dark:text-white leading-tight">Fast performance</span>
                </div>
              </div>
            </div>

            {/* Bottom bar credits */}
            <footer className="w-full mt-12 pt-6 border-t border-slate-300/10 dark:border-zinc-800/20 text-center text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              © {new Date().getFullYear()} LivePad. Crafted elegantly by <span className="text-[#0ea5e9] dark:text-cyan-400 font-bold hover:underline transition-all">bibek bista</span>. Dynamic collaborative writing tool built elegantly.
            </footer>
          </main>
        ) : (
          /* ================= WORKSPACE REDESIGN (GLASS TABLET FRAME style) ================= */
          <motion.div
            key="workspace"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 w-full h-full max-w-none p-0 mx-auto flex flex-col overflow-hidden z-10"
          >
            {/* Full-Screen Workspace Container */}
            <div className="flex-1 w-full flex flex-col overflow-hidden transition-all duration-300 bg-slate-50 dark:bg-[#0c0d12] text-slate-900 dark:text-zinc-100">
              
              {isInactiveWorkspace ? (
                <div className="flex-1 w-full flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-950 text-slate-100 overflow-y-auto min-h-screen">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-xl w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden my-auto"
                  >
                    {/* Background ambient glow */}
                    <div className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
                      workspaceStatus === 'expired' ? 'bg-amber-500/15' : workspaceStatus === 'archived' ? 'bg-indigo-500/15' : 'bg-rose-500/15'
                    }`} />

                    {/* Top Status Icon Badge */}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border shadow-inner ${
                      workspaceStatus === 'expired' 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : workspaceStatus === 'archived' 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {workspaceStatus === 'expired' ? (
                        <Clock className="w-10 h-10 animate-pulse" />
                      ) : workspaceStatus === 'archived' ? (
                        <Archive className="w-10 h-10" />
                      ) : (
                        <ShieldAlert className="w-10 h-10" />
                      )}
                    </div>

                    {/* Title & Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border bg-slate-950/70 text-slate-300 border-slate-800">
                      <span className={`w-2 h-2 rounded-full ${
                        workspaceStatus === 'expired' ? 'bg-amber-400' : workspaceStatus === 'archived' ? 'bg-indigo-400' : 'bg-rose-400'
                      }`} />
                      <span>
                        {workspaceStatus === 'expired' ? 'Workspace Expired' : workspaceStatus === 'archived' ? 'Workspace Archived' : 'Workspace Inactive'}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {workspaceStatus === 'expired' 
                        ? 'This Workspace Has Expired' 
                        : workspaceStatus === 'archived' 
                        ? 'This Workspace Is Archived' 
                        : 'Workspace Is Unavailable'}
                    </h2>

                    <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-md">
                      {workspaceStatus === 'expired' 
                        ? `Workspace #${roomCode} has reached its designated expiration lifespan and is no longer active for editing or live collaboration.` 
                        : workspaceStatus === 'archived' 
                        ? `Workspace #${roomCode} has been archived by its owner and is currently locked for all participants.` 
                        : `Workspace #${roomCode} is inactive or deleted and cannot be accessed.`}
                    </p>

                    {/* Room Code Info Chip */}
                    <div className="mt-6 w-full p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-xs text-slate-400 shrink-0">Workspace Code:</span>
                        <code className="text-sm font-mono font-bold text-white tracking-wider truncate">{roomCode}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (roomCode) {
                            navigator.clipboard.writeText(roomCode);
                            addToast('success', 'Room code copied to clipboard!');
                          }
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium transition-colors cursor-pointer shrink-0"
                      >
                        Copy Code
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setRoomCode(null);
                          setActiveLocalNoteId(null);
                          window.history.pushState({}, '', window.location.pathname);
                        }}
                        className="w-full flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        <Home className="w-4 h-4" />
                        <span>Return to Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRoomCode(null);
                          setActiveLocalNoteId(null);
                          window.history.pushState({}, '', window.location.pathname);
                          setTimeout(() => {
                            setIsCreatingRoom(true);
                          }, 100);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4 text-cyan-400" />
                        <span>New Workspace</span>
                      </button>
                    </div>

                    <div className="mt-6 text-xs text-slate-500">
                      Return to the home dashboard to create or join an active collaborative room.
                    </div>
                  </motion.div>
                </div>
              ) : (
                <>
                  {/* Top Desktop Bar in Installed PWA Mode */}
                  {isDesktopApp && (
                    <DesktopHeader
                      roomCode={roomCode}
                      workspaceTitle={activeLocalNoteId ? (activeLocalNote?.title || 'Private Scratchpad') : (room?.title || room?.workspaceName || roomCode || 'Workspace')}
                      onGoToDashboard={() => {
                        setRoomCode(null);
                        setActiveLocalNoteId(null);
                        window.history.pushState({}, '', window.location.pathname);
                      }}
                      onSwitchWorkspace={(code) => {
                        handleNavigateRoom(code);
                      }}
                    />
                  )}

                  {/* Header inside Workspace */}
                  <CompactHeader
                layout={layout}
                activeLocalNoteId={activeLocalNoteId}
                activeLocalNote={activeLocalNote}
                roomCode={roomCode}
                roomTitle={room?.title}
                roomLabel={room?.label}
                updateTitle={updateTitle}
                updateLabel={updateLabel}
                localNotes={localNotes}
                setLocalNotes={setLocalNotes}
                handleExitRoom={handleExitRoom}
                handlePublishLocalNote={handlePublishLocalNote}
                handleCopyCodeOnly={handleCopyCodeOnly}
                hasCopied={hasCopied}
                currentRole={currentRole}
                activeUsers={activeUsers}
                syncStatus={syncStatus}
                isInstallable={isInstallable}
                isAppInstalled={isAppInstalled}
                handleInstallApp={handleInstallApp}
                setShortcutsModalOpen={setShortcutsModalOpen}
                onSearchOpen={() => setCommandPaletteOpen(true)}
                onApplyFormat={handleApplyFormat}
                onExportTxt={handleExportTxt}
                onExportPdf={handleExportPdf}
                onExportEpub={handleExportEpub}
                onPreviewExport={() => setIsExportPreviewOpen(true)}
                onPrintDocument={handlePrintDocument}
                addToast={addToast}
                isFullscreen={isFullscreen}
                toggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                autoCollapseEnabled={autoCollapseEnabled}
                onToggleAutoCollapse={toggleAutoCollapse}
                isOwner={isOwner}
                workspaceStatus={workspaceStatus}
                onArchiveWorkspace={handleArchiveWorkspace}
                onRestoreWorkspace={handleRestoreWorkspace}
                onDeleteWorkspace={() => setIsDeleteModalOpen(true)}
                onLeaveWorkspace={handleLeaveWorkspace}
                onOpenCreateWizard={() => setIsCreateWizardOpen(true)}
                onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
                isAdmin={globalRole === 'admin'}
                workspaceCategory={(room?.workspaceCategory || workspaceCategory) as WorkspaceCategory}
                onToggleSplitPreview={() => setIsSplitPreviewOpen(!isSplitPreviewOpen)}
                isSplitPreviewOpen={isSplitPreviewOpen}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />

              <div className="flex-1 flex overflow-hidden relative">
                {/* Left Workspace Navigation & Explorer Sidebar */}
                <AnimatePresence>
                  {layout.leftMode !== 'hidden' && !layout.isFocusMode && isMobile && (
                    <motion.div
                      id="left-sidebar-backdrop-mobile"
                      key="left-sidebar-backdrop-mobile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="md:hidden fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs z-30"
                      onClick={() => layout.setLeftMode('hidden')}
                    />
                  )}

                  {/* Icon Rail Mode (Collapsed) */}
                  {layout.leftMode === 'collapsed' && !layout.isFocusMode && !isMobile && (
                    <motion.aside
                      key="left-sidebar-collapsed-rail"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 56, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="shrink-0 w-14 h-full border-r border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/90 dark:bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-between py-3 z-20 select-none"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <button
                          type="button"
                          onClick={() => layout.setLeftMode('expanded')}
                          className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-all cursor-pointer"
                          title="Expand Explorer Sidebar (Ctrl+B)"
                        >
                          <Folder className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleCreateLocalNote}
                          className="p-2 rounded-xl text-slate-500 hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="New Private Note"
                        >
                          <FilePlus className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            layout.setLeftMode('expanded');
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="Search Documents"
                        >
                          <Search className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setJoinModalOpen(true)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="Join or Switch Room"
                        >
                          <Users className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCodeModeToggle()}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            isCodeMode ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-zinc-800'
                          }`}
                          title="Code Mode Playground"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => layout.setLeftMode('expanded')}
                          className="p-2 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="Expand Sidebar (Ctrl+B)"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.aside>
                  )}

                  {/* Expanded Resizable Mode */}
                  {layout.leftMode === 'expanded' && !layout.isFocusMode && (
                    <motion.aside
                      id="left-sidebar-container"
                      key="left-sidebar-container"
                      {...(isMobile
                        ? {
                            initial: { x: '-100%', opacity: 0 },
                            animate: { x: 0, opacity: 1 },
                            exit: { x: '-100%', opacity: 0 },
                            transition: { type: 'spring', stiffness: 300, damping: 22 }
                          }
                        : {
                            initial: { width: 0, opacity: 0 },
                            animate: { width: layout.leftWidth, opacity: 1 },
                            exit: { width: 0, opacity: 0 },
                            transition: { type: 'spring', stiffness: 300, damping: 25 }
                          })}
                      style={isMobile ? {} : { width: `${layout.leftWidth}px` }}
                      className="fixed inset-y-0 left-0 z-45 h-full md:static flex flex-col shrink-0 border-r border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/90 dark:bg-zinc-950/95 backdrop-blur-xl overflow-hidden select-none relative"
                    >
                      {/* Drag Resizer Edge on Desktop */}
                      {!isMobile && (
                        <div
                          onMouseDown={layout.startLeftResize}
                          onTouchStart={layout.startLeftResize}
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-30 group"
                          title="Drag border to resize Explorer panel"
                        >
                          <div className="w-0.5 h-8 bg-slate-300 dark:bg-zinc-700 group-hover:bg-cyan-400 rounded-full mx-auto relative top-1/2 -translate-y-1/2 transition-colors" />
                        </div>
                      )}

                      {/* Explorer Header */}
                      <div className="p-3 border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-cyan-500" />
                          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                            Explorer
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleCreateLocalNote}
                            className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs shadow-cyan-500/20 cursor-pointer shrink-0"
                            title="Create New Private Note"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>New Note</span>
                          </button>
                          {!isMobile && (
                            <button
                              type="button"
                              onClick={() => layout.setLeftMode('collapsed')}
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-all cursor-pointer"
                              title="Collapse to Icon Rail (Ctrl+B)"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isMobile && (
                            <button
                              type="button"
                              onClick={() => layout.setLeftMode('hidden')}
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Explorer Filter Pills & Search */}
                      <div className="p-2 border-b border-slate-200/60 dark:border-zinc-800/60 shrink-0 space-y-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search notes or workspaces..."
                            value={leftSidebarSearchQuery}
                            onChange={(e) => setLeftSidebarSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-1 bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 rounded-lg text-xs font-medium text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all shadow-inner"
                          />
                          {leftSidebarSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setLeftSidebarSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Category Filter Pills Bar */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                            {[
                              { id: 'all', label: 'All', count: localNotes.length + userWorkspaces.length },
                              { id: 'notes', label: 'Notes', count: localNotes.length },
                              { id: 'workspaces', label: 'Rooms', count: userWorkspaces.length },
                              { id: 'pinned', label: 'Pinned', count: localNotes.filter((n: any) => n.pinned).length + userWorkspaces.filter(w => w.pinned).length },
                              { id: 'trash', label: 'Trash', count: trashedNotes.length },
                            ].map(tab => {
                              const isSelected = sidebarCategoryFilter === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setSidebarCategoryFilter(tab.id as any)}
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-cyan-500 text-white shadow-xs shadow-cyan-500/20'
                                      : 'bg-slate-200/60 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  <span>{tab.label}</span>
                                  <span className={`text-[9px] px-1 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-300/60 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                                    {tab.count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Sort Toggle Dropdown */}
                          <button
                            type="button"
                            onClick={() => {
                              const modes: ('updated' | 'title' | 'created')[] = ['updated', 'title', 'created'];
                              const next = modes[(modes.indexOf(sidebarSortBy) + 1) % modes.length];
                              setSidebarSortBy(next);
                            }}
                            className="p-1 rounded-md bg-slate-200/60 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 hover:text-cyan-500 transition-colors shrink-0"
                            title={`Sorted by: ${sidebarSortBy === 'updated' ? 'Recent' : sidebarSortBy === 'title' ? 'Title (A-Z)' : 'Date Created'}. Click to change.`}
                          >
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Sidebar Content Scroll Area */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-3.5 no-scrollbar">
                        {/* Section 1: Private Documents / Local Notes */}
                        {(sidebarCategoryFilter === 'all' || sidebarCategoryFilter === 'notes' || sidebarCategoryFilter === 'pinned') && (
                          <div>
                            <div className="px-1 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                              <span>My Private Notes ({localNotes.length})</span>
                              <button
                                type="button"
                                onClick={handleCreateLocalNote}
                                className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-md text-[10px] font-bold flex items-center gap-0.5 transition-all cursor-pointer border border-cyan-500/20"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                <span>Note</span>
                              </button>
                            </div>
                            <div className="mt-1 space-y-1">
                              {localNotes
                                .filter(n => {
                                  const matchesSearch = (n.title || '').toLowerCase().includes(leftSidebarSearchQuery.toLowerCase());
                                  if (sidebarCategoryFilter === 'pinned') return matchesSearch && (n as any).pinned;
                                  return matchesSearch;
                                })
                                .sort((a, b) => {
                                  if ((a as any).pinned !== (b as any).pinned) return (b as any).pinned ? 1 : -1;
                                  if (sidebarSortBy === 'title') return (a.title || '').localeCompare(b.title || '');
                                  if (sidebarSortBy === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
                                  return (b.updatedAt || 0) - (a.updatedAt || 0);
                                })
                                .map(note => {
                                  const isActive = activeLocalNoteId === note.id && !roomCode;
                                  const isEditing = editingNoteId === note.id;
                                  const isPinned = (note as any).pinned;

                                  return (
                                    <div
                                      key={note.id}
                                      onClick={() => handleNavigateToLocalNote(note.id)}
                                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                                        isActive
                                          ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-sm'
                                          : 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/40 dark:border-zinc-800/40 text-slate-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:border-slate-300 dark:hover:border-zinc-700'
                                      }`}
                                    >
                                      {/* Active Left Pill Indicator */}
                                      {isActive && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-500 rounded-r-full shadow-sm shadow-cyan-500/50" />
                                      )}

                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1 pl-1">
                                        <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-500' : isPinned ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                                        
                                        {isEditing ? (
                                          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                            <input
                                              type="text"
                                              value={editingNoteTitle}
                                              onChange={(e) => setEditingNoteTitle(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveRenameNote(note.id);
                                                if (e.key === 'Escape') setEditingNoteId(null);
                                              }}
                                              autoFocus
                                              className="w-full px-1.5 py-0.5 bg-white dark:bg-zinc-950 border border-cyan-500 rounded text-xs text-slate-800 dark:text-zinc-100 font-semibold focus:outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleSaveRenameNote(note.id)}
                                              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer"
                                            >
                                              <Check className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col min-w-0 flex-1">
                                            <span className={`truncate font-semibold ${isActive ? 'font-bold' : ''}`}>
                                              {note.title || 'Untitled Note'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                                              {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Local'}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Quick Hover Action Bar */}
                                      {!isEditing && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={(e) => handleTogglePinNote(note.id, e)}
                                            className={`p-1 rounded hover:bg-slate-200/80 dark:hover:bg-zinc-800 transition-colors ${isPinned ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'}`}
                                            title={isPinned ? 'Unpin Note' : 'Pin Note'}
                                          >
                                            <Pin className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => handleStartRenameNote(note.id, note.title, e)}
                                            className="p-1 rounded text-slate-400 hover:text-cyan-500 hover:bg-slate-200/80 dark:hover:bg-zinc-800 transition-colors"
                                            title="Rename Note"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => handleDuplicateLocalNote(note.id, e)}
                                            className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-200/80 dark:hover:bg-zinc-800 transition-colors"
                                            title="Duplicate Note"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => handleDeleteLocalNote(note.id, e)}
                                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                            title="Move to Trash Bin"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* Section 2: Online Workspaces Library */}
                        {(sidebarCategoryFilter === 'all' || sidebarCategoryFilter === 'workspaces' || sidebarCategoryFilter === 'pinned') && (
                          <div>
                            <div className="px-1 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                              <span>Online Workspaces ({userWorkspaces.length})</span>
                              <button
                                type="button"
                                onClick={() => setJoinModalOpen(true)}
                                className="px-1.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-bold flex items-center gap-0.5 transition-all cursor-pointer border border-indigo-500/20"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                                <span>Join Room</span>
                              </button>
                            </div>
                            <div className="mt-1 space-y-1">
                              {roomCode ? (
                                <div className="p-2.5 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 rounded-xl space-y-1.5 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      Active Live Room
                                    </span>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold">
                                      LIVE
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-black text-slate-800 dark:text-zinc-100">{roomCode}</span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={handleCopyCodeOnly}
                                        className="p-1 hover:bg-cyan-500/20 text-cyan-500 rounded cursor-pointer transition-colors"
                                        title="Copy Room Code"
                                      >
                                        {hasCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleLeaveWorkspace}
                                        className="p-1 hover:bg-rose-500/20 text-rose-500 rounded cursor-pointer transition-colors"
                                        title="Disconnect / Switch Note"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {userWorkspaces
                                .filter(ws => {
                                  const matchesSearch = (ws.title || ws.roomCode || '').toLowerCase().includes(leftSidebarSearchQuery.toLowerCase());
                                  if (sidebarCategoryFilter === 'pinned') return matchesSearch && ws.pinned;
                                  return matchesSearch;
                                })
                                .map((ws) => {
                                  const code = ws.roomCode || ws.workspaceId;
                                  const isActive = code === roomCode;
                                  return (
                                    <div
                                      key={ws.workspaceId || ws.id}
                                      onClick={() => handleNavigateRoom(code)}
                                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                                        isActive
                                          ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-sm'
                                          : 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/40 dark:border-zinc-800/40 text-slate-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:border-slate-300 dark:hover:border-zinc-700'
                                      }`}
                                    >
                                      {/* Active Left Pill Indicator */}
                                      {isActive && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-500 rounded-r-full shadow-sm shadow-cyan-500/50" />
                                      )}

                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1 pl-1">
                                        <FolderKanban className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-500' : ws.pinned ? 'text-indigo-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className={`truncate font-semibold ${isActive ? 'font-bold' : ''}`}>
                                            {ws.title || 'Collaborative Workspace'}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[9px] font-mono px-1 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0 font-bold">
                                              #{code}
                                            </span>
                                            {ws.category && (
                                              <span className="text-[9px] text-indigo-500 dark:text-indigo-400 capitalize truncate">
                                                {ws.category.replace('_', ' ')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={(e) => handleTogglePinWorkspace(e, ws.workspaceId, ws.pinned)}
                                          className={`p-1 rounded hover:bg-slate-200/80 dark:hover:bg-zinc-800 transition-colors ${ws.pinned ? 'text-indigo-500' : 'text-slate-400'}`}
                                          title={ws.pinned ? 'Unpin Workspace' : 'Pin Workspace'}
                                        >
                                          <Pin className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleRemoveWorkspaceFromNotes(e, ws.workspaceId)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                          title="Remove from My Library"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* Section 1.5: Trash Bin */}
                        {(sidebarCategoryFilter === 'all' || sidebarCategoryFilter === 'trash') && (
                          <div>
                            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                              <div className="flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Trash Bin ({trashedNotes.length})</span>
                              </div>
                              {trashedNotes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleEmptyTrash}
                                  className="text-[9px] text-rose-500 hover:underline font-bold cursor-pointer"
                                  title="Empty Trash Bin"
                                >
                                  Empty
                                </button>
                              )}
                            </div>
                            {trashedNotes.length === 0 ? (
                              <div className="px-2 py-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">
                                Trash is empty
                              </div>
                            ) : (
                              <div className="mt-1 space-y-1">
                                {trashedNotes
                                  .filter(n => (n.title || '').toLowerCase().includes(leftSidebarSearchQuery.toLowerCase()))
                                  .map(note => {
                                    const daysLeft = getDaysRemainingInTrash(note.deletedAt);
                                    return (
                                      <div
                                        key={note.id}
                                        className="group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/15 hover:border-rose-500/30 transition-all"
                                      >
                                        <div className="flex flex-col min-w-0 flex-1 pr-1">
                                          <span className="truncate font-semibold text-slate-700 dark:text-zinc-300">
                                            {note.title || 'Untitled Note'}
                                          </span>
                                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                            {daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={(e) => handleRestoreNote(note.id, e)}
                                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer transition-colors"
                                            title="Restore Note"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => handlePermanentDeleteNote(note.id, e)}
                                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                                            title="Delete Permanently"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Section 3: Developer Tools & Code Mode */}
                        <div>
                          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            <span>Developer Tools</span>
                          </div>
                          <div className="mt-1 space-y-1">
                            <button
                              type="button"
                              onClick={() => handleCodeModeToggle()}
                              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                                isCodeMode
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
                                  : 'bg-white/40 dark:bg-zinc-900/40 border-slate-200/40 dark:border-zinc-800/40 text-slate-600 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-900/80'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Code className="w-3.5 h-3.5 text-amber-500" />
                                <span>Code Playground</span>
                              </div>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                {codeLanguage.toUpperCase()}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsSnippetDropdownOpen(true)}
                              className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 bg-white/40 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-zinc-800/40 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              <span>Insert Snippet</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar Footer */}
                      <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-200/40 dark:bg-zinc-900/40 shrink-0 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                          <span className="truncate max-w-[140px]" title={userName || 'Anonymous User'}>
                            👤 {userName || 'Anonymous Writer'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditedName(userName);
                              setIsEditingNickname(true);
                            }}
                            className="text-[10px] text-cyan-500 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>

                        {/* Theme Switcher Pill */}
                        <div className="flex bg-slate-200/80 dark:bg-zinc-800/80 p-0.5 rounded-lg text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`flex-1 py-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              theme === 'light' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            <Sun className="w-3 h-3" /> Light
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`flex-1 py-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              theme === 'dark' ? 'bg-zinc-950 text-cyan-400 shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            <Moon className="w-3 h-3" /> Dark
                          </button>
                          <button
                            type="button"
                            onClick={() => setTheme('sepia')}
                            className={`flex-1 py-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              theme === 'sepia' ? 'bg-[#f4ebe0] text-[#705e4c] shadow-xs' : 'text-slate-500 dark:text-zinc-400'
                            }`}
                          >
                            <BookOpen className="w-3 h-3" /> Sepia
                          </button>
                        </div>
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>

                {/* Central Workspace Sheet */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden p-0">
                  
                  {/* Clean rounded pure white writing sheet panel floating over gradient */}
                  <div 
                    onDragOver={(e) => {
                      if (!isReadOnly) {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      if (isReadOnly) return;
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0];
                        processFileForAttachments(file);
                      }
                    }}
                    className={`flex-1 flex flex-col overflow-hidden relative spring-transition ${isFullscreen ? 'rounded-none border-0 shadow-none' : 'rounded-2xl shadow-premium border'} ${
                      isReadOnly 
                        ? 'bg-[#faf6ef] border-[#e8dfcf] dark:bg-[#181614] dark:border-[#2b2520] sepia:bg-[#f5ebd5] sepia:border-[#dfd3b6]' 
                        : 'bg-white border-slate-200/80 dark:bg-zinc-950 dark:border-zinc-800/40 sepia:bg-[#f5ebd5] sepia:border-[#dfd3b6]'
                    }`}
                  >
                    {/* Hidden File Picker Tag */}
                    <input
                      type="file"
                      ref={notepadFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processFileForAttachments(e.target.files[0]);
                        }
                      }}
                    />

                    {/* Drag-and-drop Visual HUD Overlay */}
                    <AnimatePresence>
                      {isDraggingFile && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-50 bg-slate-50/90 dark:bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 border-4 border-dashed border-cyan-500/50 rounded-2xl m-3 pointer-events-none"
                        >
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="p-5 bg-white dark:bg-zinc-900 rounded-full shadow-lg border border-cyan-500/30 text-cyan-500 flex items-center justify-center mb-4"
                          >
                            <Upload className="w-10 h-10 animate-bounce" />
                          </motion.div>
                          <h3 className="text-lg font-black text-slate-800 dark:text-neutral-100 uppercase tracking-wide">
                            Drop your file here
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1 max-w-xs text-center">
                            Release to instantly attach image, doc, or video to this notepad (max 700KB)
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* File Attachment Processing Indicator Overhead */}
                    <AnimatePresence>
                      {isProcessingFile && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <span className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                              Processing and Attaching File...
                            </h3>
                            <p className="text-xs text-zinc-400">
                              Compacting images and saving securely
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {workspaceStatus === 'archived' && (
                      <div className="w-full bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <div className="flex items-center gap-2">
                          <Archive className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Workspace Archived — Locked in read-only mode by owner.</span>
                        </div>
                        {isOwner && (
                          <button
                            onClick={handleRestoreWorkspace}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Workspace</span>
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Top actions panel inside writing book matching lookup */}
                    <div className={`shrink-0 min-h-[48px] h-auto py-2.5 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 border-b gap-3 transition-all duration-300 ${
                      isReadOnly 
                        ? 'bg-[#f4ebe0]/60 border-[#e8dfcf] dark:bg-[#1f1b18]/60 dark:border-[#2b2520] sepia:bg-[#ecdcb9]/60 sepia:border-[#dfd3b6]' 
                        : 'bg-slate-50/50 dark:bg-zinc-900/10 border-slate-100 dark:border-zinc-800 sepia:bg-[#ecdcb9]/40 sepia:border-[#dfd3b6]'
                    }`}>
                      {/* Theme control: Sun, Cloud, Moon, BookOpen capsule */}
                      <div className="flex p-0.5 bg-slate-150/40 dark:bg-zinc-800/10 sepia:bg-[#dfd3b6]/30 rounded-full border border-slate-200/30 dark:border-zinc-800 sepia:border-[#dfd3b6] flex-row gap-0.5 shrink-0 self-start sm:self-auto">
                        <motion.button
                          onClick={() => setTheme('light')}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full cursor-pointer transition-all ${theme === 'light' ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-xs' : 'text-neutral-400 sepia:text-[#7d6851]'}`}
                          title="Light Theme"
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={() => setTheme('system')}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full cursor-pointer transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-800 text-cyan-500 shadow-xs' : 'text-neutral-400 sepia:text-[#7d6851]'}`}
                          title="System Theme"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={() => setTheme('dark')}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full cursor-pointer transition-all ${theme === 'dark' ? 'bg-white dark:bg-zinc-800 text-indigo-400 shadow-xs' : 'text-neutral-400 sepia:text-[#7d6851]'}`}
                          title="Dark Theme"
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={() => setTheme('sepia')}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-full cursor-pointer transition-all ${theme === 'sepia' ? 'bg-white dark:bg-zinc-850 text-amber-800 shadow-xs' : 'text-neutral-400 sepia:text-[#7d6851]'}`}
                          title="Sepia Reading Theme"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      {/* Font togglers/Classroom togglers built beautifully */}
                      <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto sm:justify-end">
                        {isCodeMode ? (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-cyan-500/15 bg-cyan-500/[0.04] dark:bg-cyan-400/[0.04] shrink-0">
                            {isTeachingSession ? (
                              <>
                                <GraduationCap className={`w-3.5 h-3.5 ${isTeacher ? 'text-indigo-500' : 'text-cyan-500'}`} />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300">{isTeacher ? 'Teacher controls' : 'Learning session'}</span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{isTeacher ? 'Live for everyone' : 'Following teacher'}</span>
                              </>
                            ) : (
                              <>
                                <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300">Practice mode</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400">font:</span>
                            <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                              <motion.button
                                onClick={() => setEditorFont('sans')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${editorFont === 'sans' ? 'bg-white dark:bg-zinc-800 text-[#0ea5e9] shadow-xs' : 'text-slate-400'}`}
                              >
                                Sans
                              </motion.button>
                              <motion.button
                                onClick={() => setEditorFont('mono')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${editorFont === 'mono' ? 'bg-white dark:bg-zinc-800 text-[#0ea5e9] shadow-xs' : 'text-slate-400'}`}
                              >
                                Mono
                              </motion.button>
                              <motion.button
                                onClick={() => setEditorFont('serif')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${editorFont === 'serif' ? 'bg-white dark:bg-zinc-800 text-[#0ea5e9] shadow-xs' : 'text-slate-400'}`}
                              >
                                Serif
                              </motion.button>
                            </div>
                          </>
                        )}

                        {/* Interactive Expandable Font Sizing Card/Slider */}
                        <div 
                          className="relative flex items-center shrink-0 z-40"
                          onMouseEnter={() => {
                            clearSliderTimeout();
                          }}
                          onMouseLeave={() => {
                            if (showSizeSlider) {
                              startSliderTimeout(3000);
                            }
                          }}
                          onTouchStart={() => {
                            clearSliderTimeout();
                          }}
                          onTouchEnd={() => {
                            if (showSizeSlider) {
                              startSliderTimeout(3000);
                            }
                          }}
                        >
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const nextVal = !showSizeSlider;
                              setShowSizeSlider(nextVal);
                              if (nextVal) {
                                startSliderTimeout(3000);
                              } else {
                                clearSliderTimeout();
                              }
                            }}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                              showSizeSlider
                                ? 'bg-cyan-500/15 text-[#0ea5e9] border-cyan-500/35 dark:bg-cyan-500/20 dark:text-cyan-400'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
                            }`}
                            title="Adjust editor font size slider"
                          >
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-zinc-500 border-r border-slate-250 dark:border-zinc-800/80 pr-1.5 mr-0.5">Size</span>
                            <span className="font-mono text-[11px] font-black text-[#0ea5e9]">
                              {editorSize}px
                            </span>
                          </motion.button>

                          <AnimatePresence>
                            {showSizeSlider && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                                className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 flex items-center gap-3 min-w-[210px] select-none"
                                onMouseEnter={() => {
                                  clearSliderTimeout();
                                }}
                                onMouseLeave={() => {
                                  startSliderTimeout(3000);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  clearSliderTimeout();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSliderTimeout();
                                }}
                              >
                                <div className="flex flex-col w-full gap-1 text-left">
                                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest px-1">
                                    <span>Adjust size</span>
                                    <span className="text-[#0ea5e9] font-mono font-black">{editorSize}px</span>
                                  </div>
                                  <div className="flex items-center gap-2 px-1">
                                    <span className="text-[9px] font-bold text-zinc-400">12</span>
                                    <input
                                      type="range"
                                      min="12"
                                      max="32"
                                      value={editorSize}
                                      onChange={(e) => {
                                        setEditorSize(Number(e.target.value));
                                        clearSliderTimeout();
                                      }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        clearSliderTimeout();
                                      }}
                                      onTouchStart={(e) => {
                                        e.stopPropagation();
                                        clearSliderTimeout();
                                      }}
                                      onTouchEnd={() => {
                                        startSliderTimeout(3000);
                                      }}
                                      className="w-32 h-5 cursor-pointer accent-cyan-500 focus:outline-hidden"
                                      title="Adjust editor font size between 12px and 32px"
                                    />
                                    <span className="text-[9px] font-bold text-zinc-400">32</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>


                        {/* Find (Ctrl+F) Trigger Button */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (searchOpen) {
                              setSearchOpen(false);
                              setSearchQuery('');
                              setMatches([]);
                              setActiveMatchIndex(0);
                              textareaRef.current?.focus();
                            } else {
                              setSearchOpen(true);
                              setTimeout(() => {
                                const input = document.getElementById('editor-search-input');
                                input?.focus();
                                (input as HTMLInputElement)?.select();
                              }, 50);
                            }
                          }}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                            searchOpen 
                              ? 'bg-cyan-500/15 text-[#0ea5e9] border-cyan-500/35 dark:bg-cyan-500/20 dark:text-cyan-400' 
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
                          }`}
                          title="Find in document (Ctrl+F)"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </motion.button>

                        {/* Word-wrap Toggle Button */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const next = !softWrap;
                            setSoftWrap(next);
                            localStorage.setItem('livepad_soft_wrap', String(next));
                            addToast('info', `Word wrap ${next ? 'enabled (soft-wrap)' : 'disabled (no-wrap)'}`);
                          }}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                            softWrap
                              ? 'bg-cyan-500/15 text-[#0ea5e9] border-cyan-500/35 dark:bg-cyan-500/20 dark:text-cyan-400'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
                          }`}
                          title={softWrap ? "Switch to No-Wrap (Horizontal scrolling mode)" : "Switch to Soft-Wrap (Default mode)"}
                        >
                          <WrapText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{softWrap ? "Wrap" : "No-Wrap"}</span>
                        </motion.button>

                        {/* Word Sizing Selection Formatter Dropdown */}
                        <div className="relative">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (!selectedText) {
                                addToast('info', 'Please highlight or select a word/phrase in the notepad first, then choose a size style!');
                                return;
                              }
                              setIsWordSizeDropdownOpen(!isWordSizeDropdownOpen);
                            }}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                              selectedText
                                ? 'bg-indigo-550/15 text-indigo-700 border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-300 animate-pulse'
                                : 'bg-slate-50 border-slate-200 dark:bg-zinc-900/60 dark:border-zinc-805 text-slate-400 dark:text-zinc-550'
                            }`}
                            title={selectedText ? "Click to format size of the selected text" : "Highlight some text to unlock word sizing!"}
                          >
                            <span className="font-mono text-center text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">A</span>
                            <span className="hidden sm:inline">Word Size</span>
                            {selectedText && (
                              <span className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] px-1.5 py-0.2 rounded-sm max-w-[60px] truncate">
                                {selectedText}
                              </span>
                            )}
                          </motion.button>

                          <AnimatePresence>
                            {isWordSizeDropdownOpen && selectedText && (
                              <>
                                <div 
                                  className="fixed inset-0 z-50 bg-transparent" 
                                  onClick={() => setIsWordSizeDropdownOpen(false)} 
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                  className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl p-1.5 z-51 text-left"
                                >
                                  <div className="px-2 py-1 text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800/60 mb-1">
                                    Apply font size:
                                  </div>
                                  {[12, 14, 16, 18, 20, 24, 28, 32, 40].map((size) => (
                                    <button
                                      key={size}
                                      type="button"
                                      onClick={() => {
                                        applySizeToSelection(size);
                                        setIsWordSizeDropdownOpen(false);
                                      }}
                                      className="w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-lg text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer group"
                                    >
                                      <span className="font-mono">{size}px</span>
                                      <span 
                                        className="text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-all select-none truncate" 
                                        style={{ fontSize: `${Math.min(size, 20)}px` }}
                                      >
                                        Text size
                                      </span>
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Read-only (Reader Mode) Trigger Button */}
                        {!isCodeMode && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const nextReadOnly = !isReadOnly;
                              setIsReadOnly(nextReadOnly);
                              addToast(
                                'info',
                                nextReadOnly 
                                  ? 'Reader Mode: note is now read-only with optimized typography & reduced eyestrain colors.' 
                                  : 'Editor Mode: editing and sync restored.'
                              );
                            }}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                              isReadOnly 
                                ? 'bg-amber-500/15 text-amber-700 border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' 
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
                            }`}
                            title={isReadOnly ? "Switch to Editor Mode" : "Read-only Reader Mode"}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isReadOnly ? 'Reading' : 'Read-only'}</span>
                          </motion.button>
                        )}

                        {/* Code Playground Sandbox Mode Toggle */}
                        <motion.button
                          type="button"
                          id="livepad-codex-btn"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const nextVal = !isCodeMode;
                            handleCodeModeToggle();
                            addToast('info', nextVal ? 'Code Playground mode enabled! Write and execute HTML/JS code collaboratively.' : 'Standard collaborative text writing mode.');
                          }}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                            isCodeMode 
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/35 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
                          }`}
                          title={isCodeMode ? "Switch to standard writing mode" : "Code Playground Sandbox Mode"}
                        >
                          <Code className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span className="hidden sm:inline">{isCodeMode ? 'Code Active' : 'Code Mode'}</span>
                        </motion.button>

                        {/* Professional AI Voice Dictation Engine Toolbar */}
                        {!isCodeMode && (
                          <Suspense fallback={null}>
                          <DictationToolbar
                            dictationState={dictationState}
                            activeProviderId={activeProviderId}
                            currentLanguage={currentLanguage}
                            onLanguageChange={setCurrentLanguage}
                            settings={dictationSettings}
                            onUpdateSettings={updateDictationSettings}
                            stats={dictationStats}
                            volumeLevel={dictationVolumeLevel}
                            audioDevices={dictationAudioDevices}
                            availableProviders={dictationAvailableProviders}
                            onToggleDictation={toggleDictation}
                            onPauseDictation={pauseDictationListening}
                            onResumeDictation={resumeDictationListening}
                            onStopDictation={stopDictationListening}
                            onTriggerAICleanup={triggerDictationAICleanup}
                            confidenceScore={dictationLastResult?.confidence || 0.96}
                          />
                          </Suspense>
                        )}

                        {/* Attach File Action Trigger */}
                        {!isReadOnly && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <motion.button
                              type="button"
                              id="livepad-notepad-attach-btn"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => notepadFileInputRef.current?.click()}
                              className="cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800"
                              title="Attach a file or image to this notepad (max 700KB)"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-cyan-500" />
                              <span className="hidden sm:inline">Attach File</span>
                            </motion.button>

                            {activeAttachments.length > 0 && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => setSidebarTab('attachments')}
                                className="cursor-pointer px-2 py-1.5 rounded-lg border border-cyan-200/50 dark:border-cyan-800/60 bg-cyan-50/70 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 text-[10px] font-bold flex items-center gap-1 shadow-xs hover:bg-cyan-100/80 dark:hover:bg-cyan-950/60 transition-all select-none"
                                title="Click to view all attachments in the sidebar"
                              >
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                                </span>
                                <span>{activeAttachments.length} {activeAttachments.length === 1 ? 'file' : 'files'}</span>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* Interactive Fullscreen / Distraction-free Focus Mode Toggle */}
                        <motion.button
                          type="button"
                          id="livepad-fullscreen-btn"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleFullScreenAndFocus}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1.5 focus:outline-hidden ${
                            isFullscreen 
                              ? 'bg-rose-500/15 text-rose-500 border-rose-500/35 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' 
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-zinc-800'
                          }`}
                          title={isFullscreen ? "Exit Focus Mode (Alt+F)" : "Focus Mode (Alt+F)"}
                        >
                          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{isFullscreen ? 'Exit Focus' : 'Focus Mode'}</span>
                        </motion.button>

                        {/* Export Menu trigger absolute drop down */}
                        <div className="relative">
                          <motion.button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="cursor-pointer px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 focus:outline-hidden"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                            <span>Export ▾</span>
                          </motion.button>
                          
                          <AnimatePresence>
                            {showExportMenu && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                                <motion.div
                                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                  className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-xl py-1 z-50 overflow-hidden"
                                >
                                  <motion.button
                                    onClick={handleExportTxt}
                                    whileHover={{ x: 4 }}
                                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                  >
                                    <Download className="w-3.5 h-3.5 text-teal-500" />
                                    <span>Plain Text (.txt)</span>
                                  </motion.button>
                                  <motion.button
                                    onClick={handleExportPdf}
                                    whileHover={{ x: 4 }}
                                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                                    <span>PDF Document (.pdf)</span>
                                  </motion.button>
                                  <motion.button
                                    onClick={handleExportEpub}
                                    whileHover={{ x: 4 }}
                                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                                    <span>EPUB E-Book (.epub)</span>
                                  </motion.button>
                                  <motion.button
                                    onClick={handleExportDocx}
                                    whileHover={{ x: 4 }}
                                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                  >
                                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Word Document (.docx)</span>
                                  </motion.button>
                                  <motion.button
                                    onClick={handleExportMarkdown}
                                    whileHover={{ x: 4 }}
                                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                  >
                                    <Download className="w-3.5 h-3.5 text-cyan-500" />
                                    <span>Markdown (.md)</span>
                                  </motion.button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Editor body contains standard textarea */}
                    <div className="flex-1 relative p-6 overflow-y-auto">
                      {/* Floatable Search & Replace Bar */}
                      <AnimatePresence>
                        {searchOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-6 top-4 z-40 flex flex-col gap-2 p-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-zinc-800/85 shadow-2xl select-none min-w-[280px]"
                          >
                            <div className="flex items-center gap-2">
                              <Search className="w-4 h-4 text-slate-400 shrink-0" />
                              <input
                                id="editor-search-input"
                                type="text"
                                value={searchQuery}
                                placeholder="Find..."
                                onChange={(e) => handleSearchChange(editorContent, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                      jumpToPrevMatch();
                                    } else {
                                      jumpToNextMatch();
                                    }
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                    setMatches([]);
                                    setActiveMatchIndex(0);
                                    textareaRef.current?.focus();
                                  }
                                }}
                                className="w-32 sm:w-40 bg-transparent outline-hidden border-0 p-0 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-0 h-5"
                              />
                              {searchQuery && (
                                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 shrink-0 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md min-w-[36px] text-center">
                                  {matches.length > 0 ? `${activeMatchIndex + 1}/${matches.length}` : '0/0'}
                                </span>
                              )}
                              <div className="w-[1px] h-4 bg-slate-200 dark:bg-zinc-800 shrink-0" />
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  disabled={matches.length === 0}
                                  onClick={jumpToPrevMatch}
                                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-neutral-400 disabled:opacity-30 cursor-pointer"
                                  title="Previous Match (Shift+Enter)"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={matches.length === 0}
                                  onClick={jumpToNextMatch}
                                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-neutral-400 disabled:opacity-30 cursor-pointer"
                                  title="Next Match (Enter)"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="w-[1px] h-4 bg-slate-200 dark:bg-zinc-800 shrink-0" />
                              <button
                                type="button"
                                onClick={() => setReplaceMode(!replaceMode)}
                                className={`p-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                                  replaceMode ? 'bg-cyan-500/20 text-[#0ea5e9]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                                }`}
                                title="Toggle Replace"
                              >
                                <Replace className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery('');
                                  setMatches([]);
                                  setActiveMatchIndex(0);
                                  setReplaceMode(false);
                                  textareaRef.current?.focus();
                                }}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                                title="Close Search (Esc)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Replace input row when replaceMode is active */}
                            {replaceMode && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80"
                              >
                                <input
                                  type="text"
                                  value={replaceQuery}
                                  placeholder="Replace with..."
                                  onChange={(e) => setReplaceQuery(e.target.value)}
                                  className="flex-1 bg-transparent outline-hidden border-0 p-0 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-0 h-5"
                                />
                                <button
                                  type="button"
                                  disabled={matches.length === 0}
                                  onClick={handleReplaceOne}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-30 transition-all cursor-pointer"
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  disabled={matches.length === 0}
                                  onClick={handleReplaceAll}
                                  className="px-2 py-0.5 rounded-md bg-cyan-500 hover:bg-cyan-600 text-[10px] font-bold text-white disabled:opacity-30 transition-all cursor-pointer"
                                >
                                  All
                                </button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {(() => {
                        const fontClass = editorFont === 'mono' ? 'font-mono' : editorFont === 'serif' ? 'font-serif' : 'font-sans';
                        const leadingClass = isReadOnly ? 'leading-loose md:leading-[1.9] tracking-wide' : 'leading-relaxed';

                        if (isCodeMode) {
                          return null;
                        }

                        if (false as any) {
                          const filteredSnippets: any[] = [];
                          const groupedSnippets: Record<string, any[]> = {};
                          const gutterLines: any[] = [];
                          const activeLineIndex = 0;
                          const displayLines: string[] = [];
                          const displayContent = '';
                          const handleEditorChange = (_v: string) => {};
                          return (
                            <div className="w-full h-full flex flex-col xl:grid xl:grid-cols-2 gap-5 relative z-20">
                              <div className="flex h-[525px] md:h-[625px] xl:h-[725px] min-h-0 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-slate-205 dark:border-zinc-850 shadow-md shadow-slate-100/30 dark:shadow-black/20 overflow-hidden flex-row relative w-full">
                                
                                {/* Mini vertical icon sidebar like VS Code */}
                                <div className="w-12 bg-slate-50 dark:bg-[#070709] border-r border-slate-250/60 dark:border-zinc-855/65 flex flex-col items-center py-4.5 gap-4.5 shrink-0 select-none">
                                  <div className="p-1.5 text-[#0ea5e9] bg-sky-500/10 dark:bg-sky-500/15 rounded-lg cursor-pointer transition-all border border-sky-500/10 relative" title="Workspace Code Editor active">
                                    <FileCode className="w-4 h-4" />
                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-sky-500 rounded-r-sm" />
                                  </div>
                                  <div 
                                    className="p-1.5 text-slate-400 hover:text-slate-705 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-zinc-900" 
                                    title="Search / Find in Document (Ctrl+F)" 
                                    onClick={() => setSearchOpen(true)}
                                  >
                                    <Search className="w-4 h-4" />
                                  </div>
                                  {(classroomRole === 'teacher' || classroomRole === 'student') && (
                                    <div 
                                      className={`p-1.5 rounded-lg cursor-pointer transition-all relative ${
                                        lessonBoardOpen 
                                          ? 'text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/20' 
                                          : 'text-slate-400 hover:text-indigo-505 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                      }`} 
                                      title="Classroom Lesson Parameters"
                                      onClick={() => setLessonBoardOpen(!lessonBoardOpen)}
                                    >
                                      <GraduationCap className="w-4 h-4" />
                                      <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    </div>
                                  )}
                                  <div 
                                    className={`mt-auto p-1.5 text-slate-400 hover:text-slate-750 dark:text-zinc-550 dark:hover:text-zinc-250 rounded-lg cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-zinc-900 ${isSnippetDropdownOpen ? 'text-indigo-550 dark:text-indigo-400' : ''}`} 
                                    title="Explore Insertable Code Snippets" 
                                    onClick={() => setIsSnippetDropdownOpen(true)}
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* Main editor text area workspace with custom header of indicators */}
                                <div className="flex-1 flex flex-col p-5 min-h-0">
                                  {/* Editor Header tools */}
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80 shrink-0 select-none">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-800/60">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCodeLanguage('html');
                                          setEditorFont('mono');
                                        }}
                                        className={`px-3 py-1 text-xs font-black rounded-md cursor-pointer transition-all ${codeLanguage === 'html' ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-500'}`}
                                      >
                                        HTML / Web
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCodeLanguage('javascript');
                                          setEditorFont('mono');
                                        }}
                                        className={`px-3 py-1 text-xs font-black rounded-md cursor-pointer transition-all ${codeLanguage === 'javascript' ? 'bg-white dark:bg-zinc-800 text-yellow-600 dark:text-yellow-400 shadow-xs' : 'text-slate-500'}`}
                                      >
                                        JS Console
                                      </button>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500 font-mono">Editor</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Snippets Dropdown Selector */}
                                    <div className="relative">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => {
                                          setIsSnippetDropdownOpen(!isSnippetDropdownOpen);
                                          setSnippetSearchQuery('');
                                        }}
                                        className={`cursor-pointer text-[10px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1 border transition-all ${
                                          isSnippetDropdownOpen
                                            ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-505/20 bg-indigo-500/10 dark:bg-indigo-500/20'
                                            : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border-indigo-200/50 dark:border-indigo-800/80'
                                        }`}
                                        title="Browse templates and insert snippets"
                                      >
                                        <BookOpen className="w-3 h-3" />
                                        <span>Snippets</span>
                                        <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-300 ${isSnippetDropdownOpen ? 'rotate-180' : ''}`} />
                                      </motion.button>

                                      <AnimatePresence>
                                        {isSnippetDropdownOpen && (
                                          <>
                                            {/* Transparent Overlay backdrop */}
                                            <div
                                              className="fixed inset-0 z-40 bg-transparent cursor-default"
                                              onClick={() => setIsSnippetDropdownOpen(false)}
                                            />
                                            
                                            {/* Tool Popover body */}
                                            <motion.div
                                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                              animate={{ opacity: 1, y: 0, scale: 1 }}
                                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                              transition={{ duration: 0.15 }}
                                              className="absolute right-0 mt-2 w-[280px] sm:w-80 max-w-[calc(100vw-2rem)] max-h-[420px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 rounded-xl shadow-xl z-50 flex flex-col focus:outline-hidden overflow-hidden"
                                            >
                                              {/* Panel Header */}
                                              <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-205/50 dark:border-zinc-800/60 flex items-center justify-between shrink-0">
                                                <span className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5 font-mono">
                                                  <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                                  {codeLanguage === 'html' ? 'HTML / Tailwind Library' : 'JS Snippet Library'}
                                                </span>
                                                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 font-extrabold bg-slate-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded-sm">
                                                  {filteredSnippets.length} Snips
                                                </span>
                                              </div>

                                              {/* Internal filter search */}
                                              <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/60 shrink-0">
                                                <div className="relative">
                                                  <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400 dark:text-zinc-550" />
                                                  <input
                                                    type="text"
                                                    placeholder="Search snippets or components..."
                                                    value={snippetSearchQuery}
                                                    onChange={(e) => setSnippetSearchQuery(e.target.value)}
                                                    className="w-full pl-7.5 pr-6 py-1 rounded-md text-[10px] bg-white dark:bg-zinc-950 text-slate-800 dark:text-neutral-100 border border-slate-200 dark:border-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium placeholder-slate-400"
                                                  />
                                                  {snippetSearchQuery && (
                                                    <button
                                                      type="button"
                                                      onClick={() => setSnippetSearchQuery('')}
                                                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-650"
                                                    >
                                                      <X className="w-2.5 h-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200" />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Snippets list scrolling area */}
                                              <div className="flex-1 overflow-y-auto p-2 space-y-3 max-h-[280px]">
                                                {filteredSnippets.length === 0 ? (
                                                  <div className="text-center text-slate-400 dark:text-zinc-500 text-[10px] py-8 font-medium italic">
                                                    No matching templates or snippets. Try searching another term!
                                                  </div>
                                                ) : (
                                                  Object.keys(groupedSnippets).map((category) => (
                                                    <div key={category} className="space-y-1.5">
                                                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-zinc-500 block px-1 font-mono">
                                                        — {category}
                                                      </span>
                                                      <div className="space-y-1.5">
                                                        {groupedSnippets[category].map((snippet) => (
                                                          <div
                                                            key={snippet.id}
                                                            className="p-2.5 rounded-lg bg-slate-50/40 hover:bg-slate-100/40 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70 border border-slate-150/40 dark:border-zinc-800/40 hover:border-indigo-500/15 dark:hover:border-indigo-500/30 transition-all text-left flex flex-col"
                                                          >
                                                            <div className="flex justify-between items-start gap-1">
                                                              <h4 className="text-[11px] font-black text-slate-700 dark:text-neutral-200 leading-tight">
                                                                {snippet.title}
                                                              </h4>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal mt-1">
                                                              {snippet.description}
                                                            </p>

                                                            {/* Actions container */}
                                                            <div className="flex items-center gap-1.5 mt-2.5">
                                                              <button
                                                                type="button"
                                                                onClick={() => handleInsertSnippet(snippet, false)}
                                                                className="cursor-pointer py-1 px-2 hover:px-2.5 rounded-md text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/25 border border-indigo-100 dark:border-indigo-500/10 transition-all flex items-center gap-1"
                                                              >
                                                                <Plus className="w-2.5 h-2.5" />
                                                                Insert at Cursor
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={() => handleInsertSnippet(snippet, true)}
                                                                className="cursor-pointer py-1 px-2 hover:px-2.5 rounded-md text-[9px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-400 dark:hover:text-rose-450 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-zinc-800 hover:border-rose-200/50 transition-all flex items-center gap-1"
                                                                title="Delete current sandbox code and replace it entirely with this snippet"
                                                              >
                                                                <RefreshCw className="w-2.5 h-2.5" />
                                                                Replace All
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  ))
                                                )}
                                              </div>
                                            </motion.div>
                                          </>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={loadCodeTemplate}
                                      className="cursor-pointer text-[10px] px-2.5 py-1 text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 border border-slate-200/50 dark:border-zinc-800/80 rounded-md font-bold"
                                      title="Load built-in template for chosen language"
                                    >
                                      Load Template
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={() => handleUpdateContent('')}
                                      className="cursor-pointer text-[10px] px-2.5 py-1 text-rose-500 hover:text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/10 rounded-md font-bold"
                                      title="Clear Editor Box"
                                    >
                                      Clear
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Adaptive Collapsible Lesson Parameters Board */}
                                {classroomRole === 'teacher' && (
                                  <div className="mb-3.5 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-[#6366f1]/10 dark:to-[#8b5cf6]/10 rounded-xl border border-indigo-200/40 dark:border-indigo-950/30 overflow-hidden transition-all duration-300 shadow-3xs shrink-0 select-none">
                                    <button
                                      type="button"
                                      onClick={() => setLessonBoardOpen(!lessonBoardOpen)}
                                      className="w-full h-9 flex items-center justify-between px-3 bg-indigo-50/60 dark:bg-[#0f0f12]/80 border-b border-indigo-100/40 dark:border-zinc-850/40 text-indigo-700 dark:text-indigo-400 font-bold text-[10.5px] select-none cursor-pointer hover:bg-indigo-100/30 dark:hover:bg-zinc-855/35 transition-colors animate-fade-in"
                                    >
                                      <div className="flex items-center gap-1.5 font-sans">
                                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Instructor Adaptive Lesson Desk</span>
                                      </div>
                                      <span className="text-[8.5px] font-black uppercase text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-505/15 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                                        {lessonBoardOpen ? 'COLLAPSE ▴' : 'OPEN DESK ▾'}
                                      </span>
                                    </button>
                                    
                                    <AnimatePresence initial={false}>
                                      {lessonBoardOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-3 text-xs">
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-normal mb-3 max-w-2xl font-sans font-medium">
                                              Selecting an active programmatic scenario below instantly overrides and formats the collaborative pad for all student cursors.
                                            </p>

                                            <div className="flex flex-wrap gap-1.5 font-mono">
                                              {TEACHER_EXERCISES.map((ex) => (
                                                <button
                                                  key={ex.id}
                                                  type="button"
                                                  onClick={() => {
                                                    handleUpdateContent(ex.code);
                                                    setCodeLanguage(ex.language as 'html' | 'javascript');
                                                    addToast('success', `Live Pushed challenge: "${ex.title}" is now active!`);
                                                  }}
                                                  className="cursor-pointer text-[9px] font-extrabold px-2.5 py-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-indigo-700 dark:text-indigo-400 hover:border-indigo-500 dark:hover:border-indigo-505 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all flex items-center gap-1 shadow-3xs rounded-md active:scale-95"
                                                >
                                                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                                  <span>{ex.title}</span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}

                                {/* Adaptive Collapsible Student Desk */}
                                {classroomRole === 'student' && (
                                  <div className="mb-3.5 bg-gradient-to-r from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10 rounded-xl border border-rose-200/40 dark:border-rose-950/30 overflow-hidden transition-all duration-300 shadow-3xs shrink-0 select-none">
                                    <button
                                      type="button"
                                      onClick={() => setLessonBoardOpen(!lessonBoardOpen)}
                                      className="w-full h-9 flex items-center justify-between px-3 bg-rose-50/60 dark:bg-zinc-900/70 border-b border-rose-100/40 dark:border-rose-850/40 text-rose-700 dark:text-rose-400 font-bold text-[10.5px] select-none cursor-pointer hover:bg-rose-100/30 dark:hover:bg-zinc-855/35 transition-colors animate-fade-in"
                                    >
                                      <div className="flex items-center gap-1.5 font-sans">
                                        <GraduationCap className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Classroom Student Desk (Synced)</span>
                                      </div>
                                      <span className="text-[8.5px] font-black uppercase text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                                        {lessonBoardOpen ? 'COLLAPSE ▴' : 'OPEN DESK ▾'}
                                      </span>
                                    </button>
                                    
                                    <AnimatePresence initial={false}>
                                      {lessonBoardOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-3 text-xs">
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal font-sans font-medium">
                                              Your instructor has synchronized live classroom exercises. Follow along on the shared cursor above, enter your corresponding solutions inside the text area, and check output logs.
                                            </p>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}

                                {/* Custom quick code accessory short symbol keys for rapid classroom typing */}
                                <div className="flex flex-wrap gap-1 px-1 mb-3 pt-1 border-t border-slate-100 dark:border-zinc-850/60 shrink-0 select-none overflow-x-auto scrollbar-none">
                                  <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 mr-2 self-center font-mono uppercase tracking-wider">Shortcuts:</span>
                                  {['{', '}', '(', ')', '[', ']', '<', '>', '"', '\'', ';', '=>', '===', '&&', '||', 'console.log'].map((sym) => (
                                    <button
                                      key={sym}
                                      type="button"
                                      onClick={() => handleInsertCharacter(sym)}
                                      className="cursor-pointer px-2 py-1 text-[11px] font-semibold text-slate-650 hover:text-slate-900 bg-slate-100 hover:bg-slate-205 dark:text-zinc-400 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded border border-slate-200/50 dark:border-zinc-800/80 transition-all font-mono shadow-xs active:scale-95"
                                      title={`Insert "${sym}"`}
                                    >
                                      {sym}
                                    </button>
                                  ))}
                                </div>

                                {/* Textarea holder with synced Line Gutter */}
                                <div className={`relative flex-1 w-full min-h-0 flex flex-row border rounded-xl p-3.5 shadow-inner overflow-hidden transition-all duration-300 ${
                                  isDraggingFile 
                                    ? 'border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/5' 
                                    : 'border-slate-150/85 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-[#09090b]'
                                }`}>
                                  
                                  {/* Line Numbers Gutter (Synced perfectly on scroll) */}
                                  <div
                                    ref={gutterRef}
                                    className="w-12 select-none overflow-hidden text-right pr-2 text-slate-350 dark:text-zinc-600 font-mono border-r border-slate-205/30 dark:border-zinc-850/40 shrink-0 py-0.5"
                                    style={{
                                      fontSize: `${editorSize}px`,
                                      lineHeight: isReadOnly ? '2' : '1.625',
                                      scrollbarWidth: 'none',
                                    }}
                                  >
                                    {gutterLines.map((line, idx) => {
                                      const isActiveLine = isCodeMode && idx === activeLineIndex;
                                      return (
                                        <div key={idx} className={`h-[1.625em] leading-[1.625em] pr-0.5 flex items-center justify-end gap-1 select-none relative group/gutter ${isActiveLine ? 'text-cyan-500 dark:text-cyan-400 font-bold' : ''}`}>
                                          {line.isFoldItem && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (line.blockId) {
                                                  if (line.isFolded) {
                                                    setFoldedBlockIds(prev => prev.filter(id => id !== line.blockId));
                                                  } else {
                                                    setFoldedBlockIds(prev => [...prev, line.blockId!]);
                                                  }
                                                }
                                              }}
                                              className="w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-cyan-500 cursor-pointer text-[9px] font-sans transition-all shrink-0 active:scale-90"
                                              title={line.isFolded ? "Expand code block" : "Collapse code block"}
                                            >
                                              {line.isFolded ? '▶' : '▼'}
                                            </button>
                                          )}
                                          <span className={`text-[10px] text-right inline-block ${line.isFolded || isActiveLine ? 'text-cyan-500 font-bold font-mono' : ''}`}>
                                            {line.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Code Input Layer */}
                                  <div className="flex-1 relative min-w-0 pl-3.5">
                                    {/* Active Line Highlight overlay inside Code Mode */}
                                    {isCodeMode && (
                                      <div
                                        ref={lineHighlightRef}
                                        className={`absolute inset-0 w-full h-full pointer-events-none bg-transparent border-0 p-0 overflow-y-auto z-0 ${fontClass} ${leadingClass} ${
                                          softWrap 
                                            ? 'whitespace-pre-wrap break-words overflow-x-hidden' 
                                            : 'whitespace-pre overflow-x-auto'
                                        }`}
                                        style={{
                                          scrollbarWidth: 'none',
                                          msOverflowStyle: 'none',
                                          fontSize: `${editorSize}px`
                                        }}
                                      >
                                        {displayLines.map((lineText, idx) => {
                                          const isActive = idx === activeLineIndex;
                                          return (
                                            <div
                                              key={idx}
                                              className={`w-full transition-colors duration-75 text-transparent select-none ${
                                                isActive
                                                  ? 'bg-cyan-500/10 dark:bg-cyan-400/15 border-l-2 border-cyan-500 dark:border-cyan-400 -ml-3.5 pl-3'
                                                  : 'border-l-2 border-transparent -ml-3.5 pl-3'
                                              }`}
                                            >
                                              {lineText || ' '}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Dynamic Syntax Highlighting layer beneath #livepad-textarea-box */}
                                    {(isCodeMode || (searchOpen && searchQuery)) && (
                                      <div
                                        ref={overlayRef}
                                        id="livepad-syntax-highlight-layer"
                                        className={`absolute inset-0 w-full h-full pointer-events-none bg-transparent border-0 p-0 overflow-y-auto ${fontClass} ${leadingClass} ${
                                          isCodeMode ? 'text-slate-800 dark:text-[#e4e4e7]' : 'text-transparent'
                                        } ${
                                          softWrap 
                                            ? 'whitespace-pre-wrap break-words overflow-x-hidden' 
                                            : 'whitespace-pre overflow-x-auto'
                                        }`}
                                        style={{
                                          scrollbarWidth: 'none',
                                          msOverflowStyle: 'none',
                                          fontSize: `${editorSize}px`
                                        }}
                                        dangerouslySetInnerHTML={{
                                          __html: getHighlightedHtml(displayContent, searchQuery, activeMatchIndex) + (displayContent.endsWith('\n') ? ' ' : '')
                                        }}
                                      />
                                    )}

                                    <textarea
                                      ref={textareaRef}
                                      id="livepad-textarea-box"
                                      onClick={handleSelectionChange}
                                       onKeyDown={(e) => {
                                         if (autocompleteSuggestions.length > 0) {
                                           if (e.key === 'ArrowDown') {
                                             e.preventDefault();
                                             setAutocompleteIndex((prev) => (prev + 1) % autocompleteSuggestions.length);
                                             return;
                                           }
                                           if (e.key === 'ArrowUp') {
                                             e.preventDefault();
                                             setAutocompleteIndex((prev) => (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length);
                                             return;
                                           }
                                           if (e.key === 'Enter' || e.key === 'Tab') {
                                             e.preventDefault();
                                             if (autocompleteSuggestions[autocompleteIndex]) {
                                               applyAutocomplete(autocompleteSuggestions[autocompleteIndex]);
                                             }
                                             return;
                                           }
                                           if (e.key === 'Escape') {
                                             e.preventDefault();
                                             setAutocompleteSuggestions([]);
                                             return;
                                           }
                                         }

                                         if (isCodeMode && e.key === 'Tab') {
                                           e.preventDefault();
                                           const textarea = textareaRef.current;
                                           if (textarea) {
                                             const start = textarea.selectionStart;
                                             const end = textarea.selectionEnd;
                                             const val = textarea.value;
                                             const newVal = val.substring(0, start) + '  ' + val.substring(end);
                                             handleEditorChange(newVal);
                                             setTimeout(() => {
                                               textarea.selectionStart = textarea.selectionEnd = start + 2;
                                               handleSelectionChange();
                                             }, 0);
                                           }
                                         }
                                       }}
                                      placeholder={codeLanguage === 'html' ? "<!-- Write HTML, CSS, JavaScript, or Tailwind component here... -->" : "// Write standard JavaScript or algorithms here..."}
                                      value={displayContent}
                                      readOnly={isReadOnly}
                                      wrap={softWrap ? 'soft' : 'off'}
                                      onChange={(e) => {
                                        handleEditorChange(e.target.value);
                                        if (searchOpen) {
                                          handleSearchChange(e.target.value, searchQuery);
                                        }
                                        handleSelectionChange();
                                      }}
                                      onFocus={() => !isReadOnly && !activeLocalNoteId && setTyping(true)}
                                      onBlur={() => !activeLocalNoteId && setTyping(false)}
                                      onScroll={handleScroll}
                                      onKeyUp={handleSelectionChange}
                                      onMouseUp={handleSelectionChange}
                                      onSelect={handleSelectionChange}
                                      onDragOver={(e) => {
                                        if (!isReadOnly) {
                                          e.preventDefault();
                                          setIsDraggingFile(true);
                                        }
                                      }}
                                      onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDraggingFile(false);
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDraggingFile(false);
                                        if (isReadOnly) return;
                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                          const file = e.dataTransfer.files[0];
                                          processFileForAttachments(file);
                                        }
                                      }}
                                      style={{ fontSize: `${editorSize}px` }}
                                      className={`w-full h-full resize-none bg-transparent outline-hidden border-0 p-0 transition-all relative z-10 placeholder-zinc-550 focus:outline-hidden focus:ring-0 ${fontClass} ${leadingClass} ${
                                        isCodeMode 
                                          ? 'text-transparent! caret-cyan-500 selection:bg-cyan-500/20' 
                                          : 'text-slate-850 dark:text-zinc-200'
                                      } ${
                                        softWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                                      }`}
                                    />

                                     {/* Autocomplete Popup Menu */}
                                     {isCodeMode && autocompleteSuggestions.length > 0 && autocompletePosition && (
                                       <div
                                         id="livepad-autocomplete-menu"
                                         className="absolute z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-700/80 shadow-2xl rounded-xl p-1.5 min-w-[210px] max-w-[320px] transition-all animate-in fade-in slide-in-from-top-1 duration-100"
                                         style={{
                                           top: `${autocompletePosition.top}px`,
                                           left: `${autocompletePosition.left}px`,
                                         }}
                                       >
                                         <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-semibold select-none">
                                           <span>AUTOCOMPLETE</span>
                                           <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-cyan-600 dark:text-cyan-400 font-bold">Tab / Enter</span>
                                         </div>
                                         <div className="max-h-[190px] overflow-y-auto space-y-0.5 custom-scrollbar">
                                           {autocompleteSuggestions.map((item, idx) => {
                                             const isSelected = idx === autocompleteIndex;
                                             return (
                                               <button
                                                 key={idx}
                                                 type="button"
                                                 onMouseDown={(e) => {
                                                   e.preventDefault();
                                                   applyAutocomplete(item);
                                                 }}
                                                 className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs font-mono transition-all cursor-pointer ${
                                                   isSelected
                                                     ? 'bg-cyan-500 text-white font-bold shadow-xs'
                                                     : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                                                 }`}
                                               >
                                                 <span className="truncate flex-1">{item.label}</span>
                                                 <span
                                                   className={`text-[9px] font-sans px-1.5 py-0.5 rounded-md font-semibold shrink-0 uppercase tracking-wider ${
                                                     isSelected
                                                       ? 'bg-white/20 text-white'
                                                       : item.type === 'tag'
                                                       ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                                                       : item.type === 'keyword'
                                                       ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                                                       : item.type === 'builtin'
                                                       ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                                       : 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                                                   }`}
                                                 >
                                                   {item.type}
                                                 </span>
                                               </button>
                                             );
                                           })}
                                         </div>
                                       </div>
                                     )}

                                    {/* Cursors Overlay */}
                                    <CollaborativeCursors
                                      content={displayContent}
                                      activeUsers={activeUsers}
                                      typingUsers={room?.typingUsers ?? {}}
                                      myUid={uid}
                                      textareaRef={textareaRef}
                                      editorFont={editorFont}
                                      editorSize={editorSize}
                                      isReadOnly={isReadOnly}
                                    />

                                    {/* Inline Attachment Previews непосредственно внутри текстовой области */}
                                    {activeAttachments.length > 0 && (
                                      <div className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1.5 p-1 rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm max-w-[85%] overflow-x-auto scrollbar-none select-none">
                                        <div className="flex items-center gap-1 pl-1 pr-1.5 border-r border-slate-200/60 dark:border-zinc-800/60 shrink-0">
                                          <Paperclip className="w-3 h-3 text-cyan-500" />
                                          <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">Files</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                                          {activeAttachments.map((item) => (
                                            <div key={item.id} className="relative flex items-center gap-1 border border-slate-150 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 rounded-md p-0.5 pr-1.5 transition-all hover:border-cyan-500/50 hover:bg-slate-100/50 dark:hover:bg-zinc-900/50">
                                              <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center shrink-0 bg-slate-100 dark:bg-zinc-850">
                                                {item.type === 'image' ? (
                                                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : item.type === 'video' ? (
                                                  <Video className="w-3 h-3 text-cyan-500" />
                                                ) : item.type === 'link' ? (
                                                  <Globe className="w-3 h-3 text-[#8b5cf6]" />
                                                ) : (
                                                  <FileText className="w-3 h-3 text-emerald-500" />
                                                )}
                                              </div>
                                              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[65px]" title={item.name}>{item.name}</span>
                                              {!isReadOnly && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteAttachmentCombined(item.id)}
                                                  className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-zinc-800 shrink-0"
                                                  title="Delete Attachment"
                                                >
                                                  <X className="w-2.5 h-2.5" />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                              {/* Right column: Sandbox Execution Panel */}
                              <div className="flex flex-col h-[500px] xl:h-full min-h-0 bg-[#0a0a0c] text-white rounded-2xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden">
                                {/* Control bar */}
                                <div className="flex items-center justify-between pb-3 border-b border-zinc-805/80 border-zinc-800 shrink-0 select-none">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-1">
                                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                                    </div>
                                    <span className="text-xs font-mono font-black tracking-wide text-zinc-400 flex items-center gap-1.5">
                                      {codeLanguage === 'html' ? (
                                        <>
                                          <Eye className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                          Live Preview Device
                                        </>
                                      ) : (
                                        <>
                                          <Terminal className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                                          JavaScript Sandbox Console
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {codeLanguage === 'html' && (
                                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-zinc-400 select-none">
                                        <input
                                          type="checkbox"
                                          checked={isAutoRun}
                                          onChange={(e) => setIsAutoRun(e.target.checked)}
                                          className="rounded border-zinc-700 bg-zinc-800 text-teal-400 focus:ring-0 accent-teal-500"
                                        />
                                        Auto-render
                                      </label>
                                    )}

                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={executeSandboxCode}
                                      className={`cursor-pointer px-4 py-1.5 rounded-lg text-xs font-black text-black flex items-center gap-1.5 shadow-md ${
                                        codeLanguage === 'html'
                                          ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-emerald-500/10'
                                          : 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-500/10'
                                      }`}
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Run Code</span>
                                    </motion.button>
                                  </div>
                                </div>

                                {/* Content runner area */}
                                <div className="flex-1 w-full min-h-0 mt-4 relative">
                                  {codeLanguage === 'html' ? (
                                    <div className="w-full h-full rounded-xl border border-zinc-800 bg-white dark:bg-zinc-950 shadow-inner overflow-hidden flex flex-col relative">
                                      {/* Mock Iframe Location Bar */}
                                      <div className="h-7 px-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between select-none text-[10px] shrink-0">
                                        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
                                          <button 
                                            type="button"
                                            onClick={() => setIframeKey(prev => prev + 1)}
                                            className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                            title="Reload Sandbox"
                                          >
                                            <RefreshCw className="w-3 h-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 active:rotate-180 transition-transform duration-300 shrink-0" />
                                          </button>
                                          <div className="bg-white dark:bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 font-mono text-zinc-500 dark:text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap w-full max-w-[280px]">
                                            sandbox://livepad-preview.local/
                                          </div>
                                        </div>
                                        <span className="text-[9px] font-mono font-black text-rose-500/70 border border-rose-500/20 bg-rose-500/5 px-1 rounded">SECURE IFRAME</span>
                                      </div>

                                      {/* Embedded Web Sandbox */}
                                      <iframe
                                        key={iframeKey}
                                        srcDoc={`
                                          <!DOCTYPE html>
                                          <html>
                                            <head>
                                              <meta charset="utf-8">
                                              <style>
                                                body {
                                                  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                                                  padding: 1.25rem;
                                                  color: #1e293b;
                                                  background-color: #f8fafc;
                                                  transition: background-color 0.2s, color 0.2s;
                                                  line-height: 1.5;
                                                  margin: 0;
                                                }
                                                @media (prefers-color-scheme: dark) {
                                                  body {
                                                    color: #f1f5f9;
                                                    background-color: #0c0c0e;
                                                  }
                                                }
                                              </style>
                                              <script src="https://cdn.tailwindcss.com"></script>
                                            </head>
                                            <body>
                                              ${htmlPreviewDoc || editorContent || '<div class="h-full flex items-center justify-center text-zinc-400 text-sm italic py-12">Iframe is completely blank. Load the template above or write custom HTML/CSS code to populate it.</div>'}
                                            </body>
                                          </html>
                                        `}
                                        title="Live Render Frame"
                                        referrerPolicy="no-referrer"
                                        className="w-full flex-1 border-0 bg-slate-50 dark:bg-[#0c0c0e]"
                                        sandbox="allow-scripts"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner flex flex-col overflow-hidden">
                                      <div className="h-8 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between select-none text-[10px] shrink-0 text-zinc-400">
                                        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse inline-block" />Isolated JavaScript Console</div>
                                        <button type="button" onClick={() => setConsoleLogs([])} className="hover:text-white cursor-pointer hover:underline uppercase tracking-wider font-extrabold text-[9px]">Clear Console</button>
                                      </div>
                                      <div className="flex-1 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] min-h-0">
                                        <iframe key={sandboxRunKey} title="LivePad isolated JavaScript sandbox" srcDoc={jsSandboxDoc || '<!doctype html><html><body style=\"background:#09090b\"></body></html>'} sandbox="allow-scripts" referrerPolicy="no-referrer" ref={jsSandboxFrameRef} className="w-full h-full border-0 bg-zinc-950" />
                                        <div className="min-h-0 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-3 border-t border-zinc-800">
                                          {consoleLogs.length === 0 ? <div className="text-zinc-500 italic py-6 text-center select-none">Run JavaScript to see real console output from the isolated browser runtime.</div> : consoleLogs.map((log) => {
                                            const typeColors = log.type === 'error' ? 'text-rose-400 bg-rose-500/5 border-l-2 border-rose-500 pl-2 py-0.5' : log.type === 'warn' ? 'text-amber-400 bg-amber-500/5 border-l-2 border-amber-500 pl-2 py-0.5' : log.type === 'info' ? 'text-cyan-400 bg-cyan-500/5 border-l-2 border-cyan-500 pl-2 py-0.5' : 'text-zinc-200 pl-2';
                                            return <div key={log.id} className={`${typeColors} whitespace-pre-wrap break-all`}><span className="text-zinc-500 text-[9px] mr-1.5 select-none font-sans font-bold">[{log.type.toUpperCase()}]</span>{log.text}</div>;
                                          })}
                                        </div>
                                      </div>
                                    </div>                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className={`${
                            isSplitPreviewOpen
                              ? 'max-w-7xl px-2 sm:px-4'
                              : isReadOnly
                              ? 'max-w-2xl'
                              : pageWidth === 'narrow'
                              ? 'max-w-2xl'
                              : pageWidth === 'medium'
                              ? 'max-w-4xl'
                              : 'max-w-full px-4 sm:px-6'
                          } mx-auto h-full flex flex-col relative z-20 spring-transition`}>
                            {/* Category Specific Purpose-Built View */}
                            <Suspense fallback={null}>
                              {(() => {
                                const activeCategory: WorkspaceCategory = (room?.workspaceCategory || room?.workspaceType || workspaceCategory || 'team') as WorkspaceCategory;
                                const userCategoryRole = currentRole || 'editor';

                                switch (activeCategory) {
                                  case 'teaching':
                                    return (
                                      <TeachingView
                                        role={userCategoryRole as any}
                                        currentTitle={room?.title || roomCode || 'Untitled Session'}
                                        onAddToast={addToast}
                                        codeLanguage={codeLanguage}
                                        onChangeCodeLanguage={(lang) => setCodeLanguage(lang as 'html' | 'javascript')}
                                      />
                                    );
                                  case 'study':
                                    return (
                                      <StudyGroupView
                                        role={userCategoryRole as any}
                                        onAddToast={addToast}
                                      />
                                    );
                                  case 'coding':
                                    return (
                                      <CodingSessionView
                                        role={userCategoryRole as any}
                                        onAddToast={addToast}
                                        codeLanguage={codeLanguage}
                                        onChangeCodeLanguage={(lang) => setCodeLanguage(lang as 'html' | 'javascript')}
                                        onToggleCodeMode={() => handleCodeModeToggle()}
                                      />
                                    );
                                  case 'personal':
                                    return (
                                      <PersonalWorkspaceView
                                        role={userCategoryRole as any}
                                        onAddToast={addToast}
                                      />
                                    );
                                  case 'team':
                                  default:
                                    return (
                                      <TeamCollaborationView
                                        role={userCategoryRole as any}
                                        onAddToast={addToast}
                                      />
                                    );
                                }
                              })()}
                            </Suspense>

                            {/* Document Toolbar for Phase 4 Writing Experience */}
                            <DocumentToolbar
                              editor={editorInstance}
                              onApplyFormat={handleApplyFormat}
                              canUndo={canUndo}
                              canRedo={canRedo}
                              onUndo={handleUndo}
                              onRedo={handleRedo}
                              pageWidth={pageWidth}
                              onChangePageWidth={handlePageWidthChange}
                              onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
                              isOutlineOpen={isOutlineOpen}
                              isReadOnly={isReadOnly}
                              onToggleReadOnly={() => {
                                const nextVal = !isReadOnly;
                                setIsReadOnly(nextVal);
                                addToast(
                                  'info',
                                  nextVal 
                                    ? 'Read-Only Mode: document locked, editor & inputs disabled.' 
                                    : 'Editor Mode: editing and sync restored.'
                                );
                              }}
                              isCodeMode={isCodeMode}
                              wordCount={wordCount}
                              readingTime={Math.max(1, Math.ceil(wordCount / 200))}
                              selectedText={selectedText}
                              theme={theme}
                              onToggleSplitPreview={() => setIsSplitPreviewOpen(!isSplitPreviewOpen)}
                              isSplitPreviewOpen={isSplitPreviewOpen}
                              onToggleDictation={toggleDictation}
                              dictationState={dictationState}
                            />

                            <div className={`relative flex-1 w-full h-full min-h-0 spring-transition ${
                              isSplitPreviewOpen
                                ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden pb-1'
                                : 'flex flex-col'
                            }`}>
                              {/* Left Side: Rich Editor View */}
                              <div className={`relative flex-1 w-full h-full flex flex-col min-h-0 spring-transition rounded-xl ${
                                isDraggingFile 
                                  ? 'ring-2 ring-cyan-500/50 bg-cyan-500/5 dark:bg-cyan-950/5' 
                                  : 'bg-transparent'
                              }`}>
                               {/* HIGHLIGHT OVERLAY (ONLY visible when search query is entered) */}
                              {searchOpen && searchQuery && (
                                <div
                                  ref={overlayRef}
                                  className={`absolute inset-0 w-full h-full pointer-events-none text-transparent bg-transparent border-0 p-0 overflow-y-auto ${fontClass} ${leadingClass} ${
                                    softWrap 
                                      ? 'whitespace-pre-wrap break-words overflow-x-hidden' 
                                      : 'whitespace-pre overflow-x-auto'
                                  }`}
                                  style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    fontSize: `${isReadOnly ? editorSize + 2 : editorSize}px`
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: getHighlightedHtml(editorContent, searchQuery, activeMatchIndex) + (editorContent.endsWith('\n') ? ' ' : '')
                                  }}
                                />
                              )}

                              {/* TIPTAP RICH TEXT EDITOR ENGINE */}
                              <RichTextEditor
                                content={editorContent}
                                onChange={(html) => {
                                  handleUpdateContent(html);
                                  addToHistory(html);
                                }}
                                isReadOnly={isReadOnly}
                                editorSize={editorSize}
                                fontClass={fontClass}
                                pageWidth={pageWidth}
                                onEditorReady={setEditorInstance}
                                onSelectionChange={(selText) => setSelectedText(selText)}
                                activeUsers={activeUsers}
                                currentUid={uid}
                                userName={userName}
                                onAddToast={addToast}
                              />

                              {/* Slash Command Menu Popover */}
                              <SlashCommandMenu
                                query={slashQuery}
                                selectedIndex={slashIndex}
                                position={slashPosition}
                                onSelectCommand={applySlashCommand}
                                onClose={() => setSlashMenuOpen(false)}
                              />

                              {/* Document Outline Modal */}
                              <Suspense fallback={null}>
                                <DocumentOutlineModal
                                  isOpen={isOutlineOpen}
                                  onClose={() => setIsOutlineOpen(false)}
                                  content={editorContent}
                                  onJumpToHeading={handleJumpToHeading}
                                />
                              </Suspense>

                              {/* Collaborative Cursors Overlay */}
                              <CollaborativeCursors
                                content={editorContent}
                                activeUsers={activeUsers}
                                typingUsers={room?.typingUsers ?? {}}
                                myUid={uid}
                                textareaRef={textareaRef}
                                editorFont={editorFont}
                                editorSize={editorSize}
                                isReadOnly={isReadOnly}
                              />

                              {/* Inline Attachment Previews непосредственно внутри текстовой области */}
                              {activeAttachments.length > 0 && (
                                <div className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1.5 p-1 rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm max-w-[85%] overflow-x-auto scrollbar-none select-none">
                                  <div className="flex items-center gap-1 pl-1 pr-1.5 border-r border-slate-200/60 dark:border-zinc-800/60 shrink-0">
                                    <Paperclip className="w-3 h-3 text-cyan-500" />
                                    <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">Files</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                                    {activeAttachments.map((item) => (
                                      <div key={item.id} className="relative flex items-center gap-1 border border-slate-150 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 rounded-md p-0.5 pr-1.5 transition-all hover:border-cyan-500/50 hover:bg-slate-100/50 dark:hover:bg-zinc-900/50">
                                        <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center shrink-0 bg-slate-100 dark:bg-zinc-850">
                                          {item.type === 'image' ? (
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : item.type === 'video' ? (
                                            <Video className="w-3 h-3 text-cyan-500" />
                                          ) : item.type === 'link' ? (
                                            <Globe className="w-3 h-3 text-[#8b5cf6]" />
                                          ) : (
                                            <FileText className="w-3 h-3 text-emerald-500" />
                                          )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate max-w-[65px]" title={item.name}>{item.name}</span>
                                        {!isReadOnly && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteAttachmentCombined(item.id)}
                                            className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-zinc-800 shrink-0"
                                            title="Delete Attachment"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Floating Attachment Indicator Badge */}
                              <AnimatePresence>
                                {showAttachmentAlert && toastAttachmentName && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                    className="absolute bottom-4 right-4 z-40 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl shadow-premium border border-zinc-800 dark:border-zinc-200 flex items-center gap-2.5 backdrop-blur-md select-none text-xs font-bold leading-none"
                                  >
                                    <div className="p-1.5 bg-cyan-500 rounded-lg text-white">
                                      <Paperclip className="w-3.5 h-3.5 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col text-left gap-0.5 max-w-[200px] truncate">
                                      <span className="text-[9px] font-black uppercase text-cyan-400 dark:text-cyan-600 tracking-wider">File Attached Success</span>
                                      <span className="text-[11px] font-semibold truncate text-zinc-300 dark:text-zinc-700">{toastAttachmentName}</span>
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => setShowAttachmentAlert(false)}
                                      className="text-zinc-400 hover:text-white dark:text-zinc-500 dark:hover:text-zinc-800 hover:scale-115 transition-all outline-hidden ml-1 text-sm shrink-0"
                                    >
                                      ✕
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Floating context menu for inline styling formatting */}
                              <AnimatePresence>
                                {floatingMenuCoords && !isCodeMode && (
                                  <motion.div
                                    id="livepad-floating-formatting-menu"
                                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 10 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                    style={{
                                      position: 'absolute',
                                      left: `${floatingMenuCoords.x}px`,
                                      top: `${floatingMenuCoords.y}px`,
                                      transform: 'translate(-50%, -100%) translateY(-8px)',
                                      zIndex: 100,
                                    }}
                                    className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl backdrop-blur-md select-none pointer-events-auto"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => applyStyleToSelection('bold')}
                                      className="p-1 px-2 rounded-md hover:bg-zinc-800 text-zinc-100 hover:text-white transition-all active:scale-95 text-xs font-semibold flex items-center gap-1.5"
                                      title="Bold (<b>)"
                                    >
                                      <Bold className="w-3.5 h-3.5" />
                                      <span>Bold</span>
                                    </button>
                                    <div className="w-px h-3.5 bg-zinc-800 self-center" />
                                    <button
                                      type="button"
                                      onClick={() => applyStyleToSelection('italic')}
                                      className="p-1 px-2 rounded-md hover:bg-zinc-800 text-zinc-100 hover:text-white transition-all active:scale-95 text-xs italic flex items-center gap-1.5"
                                      title="Italic (<i>)"
                                    >
                                      <Italic className="w-3.5 h-3.5" />
                                      <span>Italic</span>
                                    </button>
                                    <div className="w-px h-3.5 bg-zinc-800 self-center" />
                                    <button
                                      type="button"
                                      onClick={() => applyStyleToSelection('underline')}
                                      className="p-1 px-2 rounded-md hover:bg-zinc-800 text-zinc-100 hover:text-white transition-all active:scale-95 text-xs underline flex items-center gap-1.5"
                                      title="Underline (<u>)"
                                    >
                                      <Underline className="w-3.5 h-3.5" />
                                      <span>Underline</span>
                                    </button>
                                    <div className="w-px h-3.5 bg-zinc-800 self-center" />
                                    <button
                                      type="button"
                                      onClick={handleCopySelectionAsMarkdown}
                                      className="p-1 px-2 rounded-md hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 text-xs font-medium flex items-center gap-1.5"
                                      title="Copy selected text as Markdown with formatting"
                                    >
                                      {copiedMarkdown ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-emerald-400 font-semibold">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copy Markdown</span>
                                        </>
                                      )}
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Right Side: Split-Screen Live Markdown Preview Panel */}
                            <AnimatePresence>
                              {isSplitPreviewOpen && (
                                <motion.div
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.2 }}
                                  className="h-full min-h-[350px] lg:min-h-0 flex flex-col"
                                >
                                  <Suspense fallback={null}>
                                  <MarkdownPreviewPanel
                                    content={editorContent}
                                    onClose={() => setIsSplitPreviewOpen(false)}
                                    onAddToast={addToast}
                                    isExpanded={isSplitPreviewExpanded}
                                    onToggleExpand={() => setIsSplitPreviewExpanded(!isSplitPreviewExpanded)}
                                    theme={theme}
                                  />
                                  </Suspense>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                      })()}
                    </div>
 
                    {/* Bottom Status bar exactly like mockup */}
                    <div className={`shrink-0 h-8 border-t px-4 flex items-center justify-between text-[11px] font-semibold transition-all duration-300 select-none z-20 ${
                      isReadOnly 
                        ? 'border-[#e8dfcf] text-[#85796b]/80 bg-[#f4ebe0]/30 dark:border-[#2b2520] dark:text-[#beaf9a]/80 dark:bg-[#1f1b18]/30' 
                        : 'border-slate-200/80 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 bg-slate-100/90 dark:bg-zinc-950/90'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${roomCode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">
                            {roomCode ? `Live Room #${roomCode}` : 'Private Notepad'}
                          </span>
                        </div>

                        <div className={`w-px h-3 shrink-0 ${isReadOnly ? 'bg-[#e8dfcf] dark:bg-[#2b2520]' : 'bg-slate-300 dark:bg-zinc-800'}`} />

                        <div className="flex items-center gap-1 shrink-0">
                          <Users className="w-3.5 h-3.5 text-[#0ea5e9]" /> {activeUsers.length} user{activeUsers.length === 1 ? '' : 's'}
                        </div>
                        
                        <div className={`w-px h-3 shrink-0 ${isReadOnly ? 'bg-[#e8dfcf] dark:bg-[#2b2520]' : 'bg-slate-300 dark:bg-zinc-800'}`} />
                        
                        {/* Cursor position Ln, Col */}
                        <div className="font-mono text-[10px] text-slate-600 dark:text-zinc-400 font-bold shrink-0">
                          Ln {cursorLine}, Col {cursorCol}
                        </div>

                        <div className={`w-px h-3 shrink-0 hidden sm:block ${isReadOnly ? 'bg-[#e8dfcf] dark:bg-[#2b2520]' : 'bg-slate-300 dark:bg-zinc-800'}`} />

                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                          {(() => {
                            const milestoneProgress = Math.min(wordCount / 500, 1);
                            const isMilestoneReached = wordCount >= 500;
                            const wordCountFontSize = wordCount >= 10000 ? 'text-[7.5px]' : wordCount >= 1000 ? 'text-[9px]' : wordCount >= 100 ? 'text-[10px]' : 'text-[11px]';
                            
                            const activeStrokeClass = isMilestoneReached
                              ? (isReadOnly ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-emerald-500 dark:stroke-emerald-400')
                              : (isReadOnly ? 'stroke-amber-700 dark:stroke-amber-500' : 'stroke-cyan-500 dark:stroke-cyan-400');
                              
                            return (
                              <div className="flex items-center gap-1.5" title={`Word count: ${wordCount}/500 milestone`}>
                                <motion.div 
                                  className="relative flex items-center justify-center w-6 h-6 shrink-0 select-none"
                                  animate={isMilestoneReached ? { scale: [1, 1.05, 1] } : {}}
                                  transition={isMilestoneReached ? { repeat: Infinity, repeatType: 'reverse', duration: 3, ease: 'easeInOut' } : {}}
                                >
                                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="9"
                                      className={`fill-none stroke-2 ${
                                        isReadOnly 
                                          ? 'stroke-amber-900/10 dark:stroke-stone-850' 
                                          : 'stroke-slate-200 dark:stroke-zinc-805'
                                      }`}
                                    />
                                    <motion.circle
                                      cx="12"
                                      cy="12"
                                      r="9"
                                      className={`fill-none stroke-2 ${activeStrokeClass}`}
                                      strokeLinecap="round"
                                      initial={{ strokeDashoffset: 56.55 }}
                                      animate={{ strokeDashoffset: 56.55 * (1 - milestoneProgress) }}
                                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                                      strokeDasharray={56.55}
                                    />
                                  </svg>
                                  <span className={`relative font-mono font-black leading-none ${wordCountFontSize} ${
                                    isReadOnly ? 'text-amber-950 dark:text-amber-100 sepia:text-[#433422]' : 'text-slate-700 dark:text-neutral-200 sepia:text-[#433422]'
                                  }`}>
                                    {wordCount}
                                  </span>
                                </motion.div>
                                <span className={isReadOnly ? 'text-amber-900/60 dark:text-stone-400 sepia:text-[#7d6851]/80' : 'text-slate-500 dark:text-zinc-400 sepia:text-[#7d6851]/80'}>
                                  words
                                </span>
                              </div>
                            );
                          })()}
                          
                          <AnimatePresence>
                            {showSyncSuccess && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.7, width: 0 }}
                                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                exit={{ opacity: 0, scale: 0.7, width: 0 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                                className="flex items-center gap-1 text-emerald-600 dark:text-[#34d399] font-sans"
                              >
                                <Check className="w-3 h-3 stroke-[3px]" />
                                <span className="text-[9px] font-black tracking-widest uppercase">Synced</span>
                              </motion.span>
                            )}
                          </AnimatePresence>

                          <span className={isReadOnly ? 'text-amber-900/20 dark:text-stone-700' : 'text-slate-200 dark:text-zinc-800'}>•</span>
                          <span className="opacity-90 font-mono font-medium">
                            {charCount} chars
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {typingUserNames.length > 0 && (
                          <span className="text-purple-500 animate-pulse flex items-center gap-1 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {typingUserNames.join(', ')} typing...
                          </span>
                        )}

                        <div className="font-mono text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                          {isCodeMode ? `${codeLanguage} Sandbox` : 'Rich Text'}
                        </div>
                        
                        <span className={`font-mono text-[10px] font-bold ${isReadOnly ? 'text-amber-900/60 dark:text-stone-400' : 'text-slate-500 dark:text-zinc-400'}`}>
                          <SaveTimeLabel lastSavedTime={lastSavedTime} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Docked Bottom Console Panel */}
                  <Suspense fallback={null}>
                  <BottomConsolePanel
                    height={layout.bottomHeight}
                    isOpen={layout.bottomOpen && !layout.isFocusMode}
                    onClose={layout.toggleBottomPanel}
                    onResizeStart={layout.startBottomResize}
                    roomCode={roomCode}
                    activeUsersCount={activeUsers.length}
                    wordCount={wordCount}
                    lineCount={lineCount}
                  />
                  </Suspense>
                </div>

                {/* Modern Resizable Inspector Panel */}
                <Suspense fallback={null}>
                <InspectorPanel
                  isOpen={layout.rightOpen && !layout.isFocusMode}
                  onClose={() => layout.setRightOpen(false)}
                  onOpen={() => layout.setRightOpen(true)}
                  onToggle={layout.toggleRightSidebar}
                  width={layout.rightWidth}
                  onResizeStart={layout.startRightResize}
                  isResizing={layout.isResizing === 'right'}
                  autoCollapseEnabled={autoCollapseEnabled}
                  onToggleAutoCollapse={toggleAutoCollapse}
                  documentTitle={room?.workspaceName || activeLocalNote?.title || 'Untitled Document'}
                  onTitleChange={(title) => {
                    if (activeLocalNoteId) {
                      const updated = localNotes.map((n) =>
                        n.id === activeLocalNoteId ? { ...n, title, updatedAt: Date.now() } : n
                      );
                      setLocalNotes(updated);
                      localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
                    }
                  }}
                  editorContent={editorContent}
                  selectedText={selectionRange && selectionRange.start !== selectionRange.end ? editorContent.substring(selectionRange.start, selectionRange.end) : ''}
                  selectionRange={selectionRange}
                  onFormatText={(tagOpen) => {
                    if (!editorInstance) return;
                    if (tagOpen === '**' || tagOpen === '<b>') editorInstance.chain().focus().toggleBold().run();
                    else if (tagOpen === '*' || tagOpen === '<i>') editorInstance.chain().focus().toggleItalic().run();
                    else if (tagOpen === '<u>') editorInstance.chain().focus().toggleUnderline().run();
                    else if (tagOpen === '~~' || tagOpen === '<s>') editorInstance.chain().focus().toggleStrike().run();
                    else if (tagOpen === '`') editorInstance.chain().focus().toggleCode().run();
                    else if (tagOpen === '```\n') editorInstance.chain().focus().toggleCodeBlock().run();
                    else if (tagOpen === '# ') editorInstance.chain().focus().toggleHeading({ level: 1 }).run();
                    else if (tagOpen === '## ') editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
                    else if (tagOpen === '### ') editorInstance.chain().focus().toggleHeading({ level: 3 }).run();
                    else if (tagOpen === '> ') editorInstance.chain().focus().toggleBlockquote().run();
                    else if (tagOpen === '- ') editorInstance.chain().focus().toggleBulletList().run();
                    else if (tagOpen === '1. ') editorInstance.chain().focus().toggleOrderedList().run();
                    else if (tagOpen === '- [ ] ') editorInstance.chain().focus().toggleTaskList().run();
                    else handleApplyFormat(tagOpen);
                  }}
                  onInsertMarkdown={(md) => {
                    if (editorInstance) {
                      editorInstance.chain().focus().insertContent(md).run();
                    }
                  }}
                  wordWrap={wordWrap}
                  onToggleWordWrap={() => setWordWrap(!wordWrap)}
                  lineHeight={lineHeight}
                  onChangeLineHeight={setLineHeight}
                  fontFamily={fontFamily}
                  onChangeFontFamily={setFontFamily}
                  readOnly={readOnly}
                  onToggleReadOnly={() => setReadOnly(!readOnly)}
                  theme={theme === 'dark' ? 'dark' : theme === 'system' ? 'system' : 'light'}
                  onThemeChange={(t) => setTheme(t)}
                  canvasWidth={canvasWidth}
                  onChangeCanvasWidth={setCanvasWidth}
                  userName={userName}
                  userColor={userColor}
                  onSaveNickname={saveNickname}
                  activeUsers={activeUsers}
                  currentUid={uid}
                  roomCode={roomCode || undefined}
                  userRole="owner"
                  onNavigateToLine={(lineText) => {
                    handleStructureItemClick({
                      id: 'nav-line',
                      title: lineText,
                      wordCount: 0,
                      charCount: lineText.length,
                      percentage: 0,
                      preview: lineText,
                      originalText: lineText
                    });
                  }}
                  attachments={(roomCode ? room?.attachments : activeLocalNote?.attachments) || []}
                  onUploadAttachment={(e) => {
                    if (e.target.files?.[0]) {
                      processFileForAttachments(e.target.files[0]);
                    }
                  }}
                  onDeleteAttachment={handleDeleteAttachmentCombined}
                  onExportMarkdown={handleExportMarkdown}
                  onExportHTML={handleExportHtml}
                  onExportTxt={handleExportTxt}
                  onExportPDF={handleExportPdf}
                  onExportEpub={handleExportEpub}
                  isMobile={isMobile}
                />
                </Suspense>

              </div>

              {/* Desktop Workspace Status Bar */}
              <WorkspaceStatusBar
                roomCode={roomCode}
                isOnline={navigator.onLine}
                wordCount={wordCount}
                charCount={charCount}
                lineCount={lineCount}
                cursorLine={cursorLine}
                cursorCol={cursorCol}
                editorFont={editorFont}
                editorSize={editorSize}
                softWrap={softWrap}
                isFocusMode={layout.isFocusMode}
                leftMode={layout.leftMode}
                rightOpen={layout.rightOpen}
                bottomOpen={layout.bottomOpen}
                onToggleLeft={layout.toggleLeftSidebar}
                onToggleRight={layout.toggleRightSidebar}
                onToggleBottom={layout.toggleBottomPanel}
                onToggleFocus={layout.toggleFocusMode}
                isCodeMode={isCodeMode}
                codeLanguage={codeLanguage}
                activeUsersCount={activeUsers.length}
                pendingQueueCount={offlineSync.pendingQueueCount}
                queueItems={offlineSync.queueItems}
                isSyncing={offlineSync.isSyncing}
              />

              {/* Floating Escape Pill in Focus Mode */}
              <AnimatePresence>
                {layout.isFocusMode && (
                  <motion.button
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    onClick={layout.toggleFocusMode}
                    className="fixed top-3 right-6 z-50 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-amber-400 border border-amber-500/30 text-xs font-bold backdrop-blur-md shadow-xl flex items-center gap-2 hover:bg-slate-900 transition-all cursor-pointer"
                    title="Press Esc or click to exit Focus Mode"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    <span>Exit Focus Mode (Esc)</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {!isInactiveWorkspace && (
          <>
            {/* Real-Time Workspace Chat Panel Drawer */}
            <Suspense fallback={null}>
            <ChatPanel
              isOpen={isFloatingChatOpen && !isCodeMode}
              onClose={() => setIsFloatingChatOpen(false)}
              roomId={roomCode || 'private-pad'}
              activeUsers={activeUsers}
              currentUid={uid}
              userName={userName}
              currentRole={classroomRole === 'teacher' ? 'admin' : 'editor'}
              isFloating={true}
              theme={theme}
              onInsertCodeToEditor={(code) => {
                if (editorInstance) {
                  editorInstance.chain().focus().insertContent(`\`\`\`\n${code}\n\`\`\``).run();
                }
              }}
              onAddToast={addToast}
              onUnreadCountChange={(count) => setUnreadChatCount(count)}
            />
            </Suspense>

            {/* Floating Chat Launcher Button (Bottom Right) */}
            {!isCodeMode && (
              <Suspense fallback={null}>
              <FloatingChatTrigger
                isOpen={isFloatingChatOpen}
                onToggle={() => {
                  setIsFloatingChatOpen(!isFloatingChatOpen);
                  if (!isFloatingChatOpen) setUnreadChatCount(0);
                }}
                unreadCount={unreadChatCount}
                activeUsersCount={activeUsers.length}
              />
              </Suspense>
            )}

            {/* Universal Command Palette Overlay */}
            <CommandPalette
              isOpen={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
              activeLocalNoteId={activeLocalNoteId}
              activeLocalNote={activeLocalNote}
              roomCode={roomCode}
              roomTitle={room?.title}
              isCodeMode={isCodeMode}
              isReadOnly={isReadOnly}
              isFullscreen={isFullscreen}
              isOutlineOpen={isOutlineOpen}
              theme={theme === 'light' ? 'light' : 'dark'}
              localNotes={localNotes}
              userWorkspaces={userWorkspaces}
              activeUsersCount={activeUsers.length}
              onNavigateHome={handleExitRoom}
              onCreateNewRoom={() => setCreateModalOpen(true)}
              onCreateLocalNote={handleCreateLocalNote}
              onPublishNote={handlePublishLocalNote}
              onSelectNote={(id) => {
                setActiveLocalNoteId(id);
                localStorage.setItem('livepad_active_note_id', id);
              }}
              onSelectWorkspace={(code) => handleNavigateRoom(code)}
              onToggleCodeMode={() => handleCodeModeToggle()}
              onToggleLeftSidebar={layout.toggleLeftSidebar}
              onToggleRightSidebar={layout.toggleRightSidebar}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              onToggleOutline={() => setIsOutlineOpen(!isOutlineOpen)}
              onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
              onOpenShortcuts={() => setShortcutsModalOpen(true)}
              onExportTxt={handleExportTxt}
              onExportPdf={handleExportPdf}
              onExportEpub={handleExportEpub}
              onCopyRoomLink={handleCopyCodeOnly}
              onCopyRoomCode={handleCopyCodeOnly}
              onApplyFormat={handleApplyFormat}
              onChangePageWidth={setPageWidth}
              onOpenInDocumentSearch={() => {
                setSearchOpen(true);
                setTimeout(() => {
                  const input = document.getElementById('editor-search-input');
                  input?.focus();
                  (input as HTMLInputElement)?.select();
                }, 50);
              }}
              onChangeLanguage={(lang) => setCodeLanguage(lang as any)}
              autoCollapseEnabled={autoCollapseEnabled}
              onToggleAutoCollapse={toggleAutoCollapse}
              onRunCode={() => {
                setIsCodeMode(true);
                addToast('info', 'Code Workspace Mode active');
              }}
              addToast={addToast}
            />

            {/* Hidden Keyboard Shortcuts Modal overlay & Delete Workspace Modal */}
            <Suspense fallback={null}>
              <KeyboardShortcutsModal
                isOpen={shortcutsModalOpen}
                onClose={() => setShortcutsModalOpen(false)}
              />

              <DeleteWorkspaceModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                workspaceName={room?.workspaceName || room?.title || roomCode || 'Workspace'}
                roomCode={roomCode || ''}
                onConfirmDelete={handleConfirmDeleteWorkspace}
              />
            </Suspense>

            {/* Confirmation Modal for Export Room / Export Note */}
            <AnimatePresence>
              {exportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setExportModalOpen(false)}
                    className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md"
                  />

                  {/* Modal container */}
                  <motion.div
                    id="export-confirmation-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                    className="relative w-full max-w-[325px] sm:max-w-md p-5 sm:p-6 border border-slate-200/50 dark:border-zinc-805 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl shadow-3xl rounded-3xl overflow-hidden text-left z-10"
                  >
                    {/* Glowing Accent Top border */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
                        <Download className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                          Confirm Room Export
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          You are about to export your collaborative workspace content and session details.
                        </p>
                      </div>
                    </div>

                    {/* Metadata summary list */}
                    <div className="space-y-3 bg-slate-50 dark:bg-[#141416] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 mb-5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-zinc-800/50">
                        <span className="text-slate-400 font-medium font-sans">Export Type:</span>
                        <span className="font-bold text-[#0ea5e9] bg-sky-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase font-mono tracking-wider">
                          {activeLocalNoteId ? 'Local Note' : 'Collaborative Room'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-medium font-sans">Document Title:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[200px]" title={activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room')}>
                          {activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || `Live Room #${roomCode}`)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-medium font-sans">Code/Content Length:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                          {editorContent.length.toLocaleString()} characters
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-slate-400 font-medium font-sans">Editor Language:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase font-mono">
                          {codeLanguage}
                        </span>
                      </div>

                      {!activeLocalNoteId && (
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium font-sans">Active Writers (Cursors):</span>
                          <span className="font-bold text-slate-700 dark:text-zinc-300">
                            {activeUsers.length} online
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1 border-t border-slate-200/50 dark:border-zinc-800/50 mt-1">
                        <span className="text-slate-400 font-medium font-sans">File Format:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          JSON (.json)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-normal mb-5 italic font-sans text-center">
                      ℹ️ This JSON includes room properties, cursors schema, syntax highlights, and active notepad states.
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setExportModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-xs font-bold text-slate-500 dark:text-neutral-400 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          handleExportJson();
                          setExportModalOpen(false);
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 dark:from-emerald-600 dark:to-teal-600 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 animate-bounce" />
                        <span>Export Now</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    )}
  </AnimatePresence>

      {/* Code Mode Full Screen Professional Workspace */}
      <Suspense fallback={null}>
        <ErrorBoundary fallbackTitle="Code Workspace Engine" onReset={() => setIsCodeMode(false)}>
          <CodeWorkspace
            isOpen={isCodeMode}
            onClose={() => setIsCodeMode(false)}
            activeContent={editorContent}
            onUpdateContent={handleUpdateContent}
            codeLanguage={codeLanguage}
            onChangeCodeLanguage={(lang) => setCodeLanguage(lang as 'html' | 'javascript')}
            roomCode={roomCode}
            userName={userName}
            userRole={currentRole}
            isTeachingSession={isTeachingSession}
            canControlCodeMode={canControlCodeMode}
            codeModeOpen={codeModeOpen}
            onRequestCodeMode={handleCodeModeToggle}
            activeUsers={activeUsers}
            isReadOnly={isReadOnly}
            onAddToast={addToast}
            remoteCursors={activeUsers
              .filter((u: any) => u.uid !== uid)
              .map((u: any) => ({
                uid: u.uid,
                name: u.name,
                color: u.color,
                lineNumber: u.lineNumber || 1,
                columnNumber: u.columnNumber || 1,
                selectionEndLine: u.selectionEndLine,
                selectionEndColumn: u.selectionEndColumn
              }))}
            onCursorPositionChange={(line, col, selEndLine, selEndCol) => {
              if (updateCursorIndex) {
                updateCursorIndex({
                  lineNumber: line,
                  columnNumber: col,
                  selectionEndLine: selEndLine,
                  selectionEndColumn: selEndCol
                });
              }
            }}
          />
        </ErrorBoundary>

        {/* Export Preview Modal */}
        <ExportPreviewModal
          isOpen={isExportPreviewOpen}
          onClose={() => setIsExportPreviewOpen(false)}
          title={activeLocalNoteId ? (activeLocalNote?.title ?? 'Notepad') : (room?.title || roomCode || 'Room')}
          editorOrContent={editorInstance || editorContent}
          addToast={addToast}
        />

        {/* Print Confirmation Modal */}
        <PrintConfirmationModal
          isOpen={showPrintConfirmModal}
          onClose={() => setShowPrintConfirmModal(false)}
          onConfirm={handleConfirmPrint}
          title={printTargetTitle}
        />

        {/* 4-Step Category Workspace Creation Wizard Modal */}
        <CreateWorkspaceModal
          isOpen={isCreateWizardOpen}
          onClose={() => setIsCreateWizardOpen(false)}
          onCreateWorkspace={async (workspaceData) => {
            setIsCreateWizardOpen(false);
            const uniqueCode = generateRoomCode();
            try {
              const expiresAt = workspaceData.permissions.lifespan === '24_hours' 
                ? Date.now() + 24*60*60*1000 
                : workspaceData.permissions.lifespan === '7_days' 
                ? Date.now() + 7*24*60*60*1000 
                : workspaceData.permissions.lifespan === '30_days' 
                ? Date.now() + 30*24*60*60*1000 
                : null;

              if (isFirebaseConfigured && db && !isFirestoreQuotaExhausted()) {
                await setDoc(doc(db, 'rooms', uniqueCode), {
                  workspaceId: uniqueCode,
                  roomCode: uniqueCode,
                  workspaceName: workspaceData.name,
                  title: workspaceData.name,
                  workspaceCategory: workspaceData.category,
                  workspaceType: workspaceData.category,
                  privacy: workspaceData.privacy,
                  status: 'active',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  expiresAt,
                  ownerId: uid,
                  ownerName: userName || '',
                  createdBy: uid,
                  creatorId: uid,
                  creatorRole: 'owner',
                  workspaceRoleVersion: 2,
                  participants: {
                    [uid]: {
                      uid,
                      name: userName || '',
                      role: 'owner',
                      joinedAt: Date.now()
                    }
                  },
                  editingPolicy: workspaceData.permissions.editingPolicy,
                  codeExecutionEnabled: workspaceData.permissions.codeExecution,
                  voiceChatEnabled: workspaceData.permissions.voiceChat,
                  chatEnabled: workspaceData.permissions.chatEnabled,
                  defaultRole: workspaceData.permissions.defaultRole,
                  users: {},
                  typingUsers: {},
                  content: `# ${workspaceData.name}\n\nCategory: ${workspaceData.category}\n\nWelcome to your ${workspaceData.category} workspace!`
                });
              } else {
                localStorage.setItem(`livepad_local_room_${uniqueCode}`, `# ${workspaceData.name}\n\nCategory: ${workspaceData.category}\n`);
              }

              setWorkspaceCategory(workspaceData.category);
              handleNavigateRoom(uniqueCode);
              addToast('success', `Created ${workspaceData.category} workspace "${workspaceData.name}"!`);
            } catch (err) {
              console.error("Failed to create workspace:", err);
              addToast('error', 'Failed to create workspace.');
            }
          }}
        />

        {/* Platform Administrator Dashboard Modal */}
        <AdminDashboardModal
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          room={room}
          currentUserId={uid}
          currentUserName={userName}
          addToast={addToast}
        />
      </Suspense>

      {/* Empty Trash Confirmation Modal */}
      <AnimatePresence>
        {showEmptyTrashModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmptyTrashModal(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md p-6 border border-rose-500/20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl rounded-3xl z-10"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Permanently Empty Trash?
                </h3>

                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                  Are you sure you want to permanently delete <span className="font-bold text-rose-600 dark:text-rose-400">{trashedNotes.length} note{trashedNotes.length === 1 ? '' : 's'}</span>? This action <span className="font-bold underline">cannot be undone</span>.
                </p>

                {/* Preview list of items to be deleted */}
                <div className="w-full my-2 p-3 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/15 rounded-xl max-h-36 overflow-y-auto space-y-1.5 text-left no-scrollbar">
                  {trashedNotes.map((note) => (
                    <div key={note.id} className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="truncate">{note.title || 'Untitled Note'}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmptyTrashModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmEmptyTrash}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Empty Trash</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ================= JOIN WORKSPACE MODAL ================= */}
      <AnimatePresence>
        {joinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJoinModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[340px] sm:max-w-md p-5 sm:p-6 border border-white/40 dark:border-white/5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl shadow-3xl rounded-3xl shadow-slate-900/10"
            >
              <form onSubmit={dispatchJoinRoom} className="space-y-4">
                <div className="text-center">
                  <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
                    Join Workspace
                  </h3>
                  <p className="text-xs font-semibold text-[#0ea5e9] mt-0.5 uppercase tracking-wider">
                    Enter valid workspace code
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500">
                      NickName (Pseudonym)
                    </label>
                    <input
                      type="text"
                      placeholder="Your nickname..."
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        setEditedName(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-white/5 text-sm font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500 font-sans">
                      Workspace Code (e.g. LP-7XK9-MQ2P)
                    </label>
                    <input
                      type="text"
                      placeholder="LP-XXXX-XXXX"
                      required
                      value={targetRoomInput}
                      onChange={(e) => setTargetRoomInput(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-3 bg-white dark:bg-zinc-950 font-mono text-center font-black uppercase text-lg sm:text-xl tracking-wider border border-slate-200 dark:border-white/5 rounded-2xl placeholder-zinc-300 dark:placeholder-zinc-700 text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                      Only existing, active workspaces can be joined.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(false)}
                    className="flex-1 cursor-pointer py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 dark:hover:bg-zinc-800 hover:bg-slate-50 text-xs font-bold text-slate-500 dark:text-neutral-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingRoom}
                    className="flex-1 cursor-pointer py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-400 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-md hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isVerifyingRoom ? <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Join Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CREATE WORKSPACE MODAL ================= */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg p-6 border border-white/40 dark:border-white/5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-3xl rounded-3xl shadow-slate-900/20 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <form onSubmit={dispatchCreateRoom} className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-500 animate-pulse" /> Create Workspace
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mt-0.5">
                      Configure workspace type and role permissions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:text-neutral-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Workspace Category Grid */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500">
                    Workspace Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.values(WORKSPACE_TYPES).map((wt) => {
                      const isSelected = selectedWorkspaceType === wt.type;
                      return (
                        <button
                          key={wt.type}
                          type="button"
                          onClick={() => {
                            setSelectedWorkspaceType(wt.type);
                            if (!customWorkspaceName || Object.values(WORKSPACE_TYPES).some(t => t.title === customWorkspaceName)) {
                              setCustomWorkspaceName(wt.title);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/50 dark:bg-cyan-500/20 dark:border-cyan-400 shadow-sm'
                              : 'bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{wt.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-zinc-800 text-slate-600 dark:text-neutral-300">
                              Limit {wt.defaultLimit}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800 dark:text-white">{wt.title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight mt-0.5">{wt.description}</div>
                          </div>
                          <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mt-1">
                            <span>Creator: {wt.creatorRole}</span>
                            <span>•</span>
                            <span>Joiner: {wt.participantRole}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workspace Name & Pseudonym */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500">
                      Workspace Title
                    </label>
                    <input
                      type="text"
                      placeholder={WORKSPACE_TYPES[selectedWorkspaceType]?.title || "Workspace Title..."}
                      value={customWorkspaceName}
                      onChange={(e) => setCustomWorkspaceName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500">
                      Your Pseudonym
                    </label>
                    <input
                      type="text"
                      placeholder="Your name..."
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        setEditedName(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 cursor-pointer py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 dark:hover:bg-zinc-800 hover:bg-slate-50 text-xs font-bold text-slate-500 dark:text-neutral-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRoom}
                    className="flex-1 cursor-pointer py-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-md hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isCreatingRoom ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Launch Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Conflict Resolution Modal */}
      <Suspense fallback={null}>
        <ConflictResolutionModal
          conflict={conflictModalData}
          onClose={() => setConflictModalData(null)}
          onResolve={handleResolveConflict}
        />
      </Suspense>
      {/* Live AI Dictation Stream Preview Overlay */}
      {(dictationLiveTranscript || dictationInterimTranscript || dictationLastResult) && (
      <Suspense fallback={null}>
      <DictationPreview
        liveTranscript={dictationLiveTranscript}
        interimTranscript={dictationInterimTranscript}
        lastResult={dictationLastResult}
        confidenceThreshold={dictationSettings.confidenceThreshold}
        detectedLangPrompt={dictationDetectedLangPrompt}
        onAcceptDetectedLang={() => {
          if (dictationDetectedLangPrompt) {
            setCurrentLanguage(dictationDetectedLangPrompt.code);
            setDictationDetectedLangPrompt(null);
            addToast('success', `Switched language to ${dictationDetectedLangPrompt.name}`);
          }
        }}
        onDismissDetectedLang={() => setDictationDetectedLangPrompt(null)}
      />
      </Suspense>
      )}
    </div>
  );
}
