import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PanelLeft,
  ChevronLeft,
  FileText,
  Globe,
  Tag,
  Check,
  Copy,
  Users,
  RefreshCw,
  CloudOff,
  Download,
  Settings,
  Layers,
  Search,
  Plus,
  Share2,
  QrCode,
  MoreHorizontal,
  Heading1,
  Heading2,
  Table,
  Image as ImageIcon,
  Code,
  Info,
  Minus,
  ChevronDown,
  FileUp,
  Eye,
  Maximize,
  Minimize,
  Clock,
  Archive,
  Trash2,
  LogOut,
  RotateCcw,
  Printer,
  Columns2,
  BookOpen
} from 'lucide-react';
import Logo from './Logo';
import QRCodeModal from './QRCodeModal';
import { ROOM_LABELS } from '../utils/workspace';
import { LocalNotepad, SyncStatus, UserPresence, WorkspaceRole, WorkspaceStatus } from '../types';
import { WorkspaceCategory, CATEGORY_DEFINITIONS } from '../utils/workspaceCategories';
import { Sparkles, ShieldAlert } from 'lucide-react';

interface CompactHeaderProps {
  layout: {
    leftMode: string;
    rightOpen: boolean;
    isFocusMode: boolean;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setRightOpen: (open: boolean) => void;
  };
  activeLocalNoteId: string | null;
  activeLocalNote?: LocalNotepad;
  roomCode: string | null;
  roomTitle?: string;
  roomLabel?: string;
  updateTitle: (title: string) => void;
  updateLabel: (label: string) => void;
  localNotes: LocalNotepad[];
  setLocalNotes: React.Dispatch<React.SetStateAction<LocalNotepad[]>>;
  handleExitRoom: () => void;
  handlePublishLocalNote: () => void;
  handleCopyCodeOnly: () => void;
  hasCopied: boolean;
  currentRole: WorkspaceRole | null;
  activeUsers: UserPresence[];
  syncStatus: SyncStatus;
  isInstallable: boolean;
  isAppInstalled: boolean;
  handleInstallApp: () => void;
  setShortcutsModalOpen: (open: boolean) => void;
  onSearchOpen: () => void;
  onApplyFormat: (formatType: string, extraData?: any) => void;
  onExportTxt: () => void;
  onExportPdf: () => void;
  onExportEpub?: () => void;
  onPreviewExport?: () => void;
  onPrintDocument?: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  autoCollapseEnabled?: boolean;
  onToggleAutoCollapse?: () => void;
  isOwner?: boolean;
  workspaceStatus?: WorkspaceStatus;
  onArchiveWorkspace?: () => void;
  onRestoreWorkspace?: () => void;
  onDeleteWorkspace?: () => void;
  onLeaveWorkspace?: () => void;
  onOpenCreateWizard?: () => void;
  onOpenAdminDashboard?: () => void;
  isAdmin?: boolean;
  workspaceCategory?: WorkspaceCategory;
  onToggleSplitPreview?: () => void;
  isSplitPreviewOpen?: boolean;
}

type HeaderDropdown = 'workspace' | 'tag' | 'insert' | 'collaborate' | 'overflow' | null;

export default function CompactHeader({
  layout,
  activeLocalNoteId,
  activeLocalNote,
  roomCode,
  roomTitle,
  roomLabel,
  updateTitle,
  updateLabel,
  localNotes,
  setLocalNotes,
  handleExitRoom,
  handlePublishLocalNote,
  handleCopyCodeOnly,
  hasCopied,
  currentRole,
  activeUsers,
  syncStatus,
  isInstallable,
  isAppInstalled,
  handleInstallApp,
  setShortcutsModalOpen,
  onSearchOpen,
  onApplyFormat,
  onExportTxt,
  onExportPdf,
  onExportEpub,
  onPreviewExport,
  onPrintDocument,
  addToast,
  isFullscreen,
  toggleFullscreen,
  autoCollapseEnabled = true,
  onToggleAutoCollapse,
  isOwner = false,
  workspaceStatus = 'active',
  onArchiveWorkspace,
  onRestoreWorkspace,
  onDeleteWorkspace,
  onLeaveWorkspace,
  onOpenCreateWizard,
  onOpenAdminDashboard,
  isAdmin = false,
  workspaceCategory = 'team',
  onToggleSplitPreview,
  isSplitPreviewOpen = false,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = true,
}: CompactHeaderProps & {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  const [activeDropdown, setActiveDropdown] = useState<HeaderDropdown | 'file' | 'view'>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const closeAllDropdowns = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const toggleDropdown = useCallback((menu: HeaderDropdown | 'file' | 'view') => {
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDropdown !== null) {
        closeAllDropdowns();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDropdown, closeAllDropdowns]);

  if (isFullscreen) return null;

  const currentTitle = activeLocalNoteId ? (activeLocalNote?.title ?? '') : (roomTitle ?? '');

  const handleTitleChange = (newTitle: string) => {
    if (activeLocalNoteId) {
      const updated = localNotes.map((n) =>
        n.id === activeLocalNoteId ? { ...n, title: newTitle, updatedAt: Date.now() } : n
      );
      setLocalNotes(updated);
      localStorage.setItem('livepad_local_notepads', JSON.stringify(updated));
    } else {
      updateTitle(newTitle);
    }
  };

  return (
    <header
      ref={headerRef}
      role="banner"
      aria-label="Application Header"
      className="shrink-0 h-11 py-1 sm:py-1.5 border-b border-slate-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-all duration-200 z-[60] relative flex items-center justify-between px-2.5 sm:px-4 select-none gap-2 whitespace-nowrap overflow-visible"
    >
      {/* LEFT SECTION: Toggle, Back, Logo, Title, and Grouped Dropdowns (File, Insert, View, Workspace) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Toggle Explorer Sidebar */}
        <button
          type="button"
          onClick={layout.toggleLeftSidebar}
          aria-label="Toggle Explorer Sidebar"
          aria-expanded={layout.leftMode !== 'hidden'}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500/40 ${
            layout.leftMode !== 'hidden'
              ? 'bg-teal-500/15 text-teal-600 border-teal-500/35 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/40 font-bold'
              : 'bg-slate-100/80 dark:bg-zinc-900/80 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-800'
          }`}
          title="Toggle Explorer Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Return to Dashboard */}
        <button
          type="button"
          onClick={() => {
            handleExitRoom();
            addToast('info', 'Returned to Dashboard');
          }}
          aria-label="Return to Dashboard"
          className="p-1.5 rounded-lg bg-slate-100/80 dark:bg-zinc-900/80 hover:bg-slate-200/80 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
          title="Return to Dashboard"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="hidden md:block">
          <Logo iconSize={15} className="scale-90 origin-left" />
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block" />

        {/* Title Input */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-zinc-200">
          <FileText className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <input
            id="livepad-compact-title-input"
            type="text"
            value={currentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder={activeLocalNoteId ? 'Untitled note...' : 'Untitled doc...'}
            className="bg-transparent font-bold tracking-tight text-xs focus:outline-hidden text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] truncate"
            title="Click to rename document"
            aria-label="Rename document"
          />
        </div>

        {/* Organized Action Dropdowns (File, Insert, View, Workspace) */}
        <div className="hidden lg:flex items-center gap-1">
          {/* File Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('file')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeDropdown === 'file'
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>File</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'file' && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={closeAllDropdowns} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.96 }}
                    className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-[100]"
                  >
                    {onOpenCreateWizard && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCreateWizard();
                          closeAllDropdowns();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>New Workspace...</span>
                      </button>
                    )}

                    {activeLocalNoteId && handlePublishLocalNote && (
                      <button
                        type="button"
                        onClick={() => {
                          handlePublishLocalNote();
                          closeAllDropdowns();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-teal-600 dark:text-teal-400 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-teal-500" />
                        <span>Publish to Live Room</span>
                      </button>
                    )}

                    <div className="h-px bg-slate-200/80 dark:bg-zinc-800/80 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        onExportTxt();
                        closeAllDropdowns();
                        addToast('success', 'Exported plain text file');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <FileUp className="w-3.5 h-3.5 text-teal-500" />
                      <span>Export Plain Text (.txt)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onExportPdf();
                        closeAllDropdowns();
                        addToast('success', 'Generated PDF export');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-500" />
                      <span>Export PDF Document (.pdf)</span>
                    </button>

                    {onExportEpub && (
                      <button
                        type="button"
                        onClick={() => {
                          onExportEpub();
                          closeAllDropdowns();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>Export EPUB E-Book (.epub)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (onPreviewExport) onPreviewExport();
                        else onExportPdf();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Preview & Export</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onPrintDocument) {
                          onPrintDocument();
                        } else if (onPreviewExport) {
                          onPreviewExport();
                        }
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-400" />
                      <span>Print Document...</span>
                    </button>

                    {isOwner && !activeLocalNoteId && (
                      <>
                        <div className="h-px bg-slate-200/80 dark:bg-zinc-800/80 my-1" />
                        {workspaceStatus === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onRestoreWorkspace) onRestoreWorkspace();
                              closeAllDropdowns();
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Restore Workspace</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onArchiveWorkspace) onArchiveWorkspace();
                              closeAllDropdowns();
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-500" />
                            <span>Archive Workspace</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteWorkspace) onDeleteWorkspace();
                            closeAllDropdowns();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete Workspace...</span>
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Insert Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('insert')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeDropdown === 'insert'
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>Insert</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'insert' && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={closeAllDropdowns} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.96 }}
                    className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-[100]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('h1');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Heading1 className="w-3.5 h-3.5 text-teal-500" /> Heading 1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('h2');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Heading2 className="w-3.5 h-3.5 text-teal-500" /> Heading 2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('table');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Table className="w-3.5 h-3.5 text-teal-500" /> Table Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('image');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-teal-500" /> Image Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('code');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5 text-teal-500" /> Code Snippet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('callout');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-teal-500" /> Callout Note
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormat('divider');
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5 text-teal-500" /> Divider Line
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* View Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('view')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeDropdown === 'view'
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>View</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'view' && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={closeAllDropdowns} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.96 }}
                    className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-[100]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        layout.toggleLeftSidebar();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <PanelLeft className="w-3.5 h-3.5 text-teal-500" /> Toggle Explorer Sidebar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        layout.toggleRightSidebar();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-teal-500" /> {layout.rightOpen ? 'Hide Inspector Panel' : 'Show Inspector Panel'}
                    </button>
                    {onToggleSplitPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleSplitPreview();
                          closeAllDropdowns();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-cyan-500/10 rounded-lg flex items-center gap-2 text-cyan-600 dark:text-cyan-400 cursor-pointer"
                      >
                        <Columns2 className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{isSplitPreviewOpen ? 'Close Split Preview' : 'Split Markdown Preview'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        toggleFullscreen();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-medium hover:bg-teal-500/10 rounded-lg flex items-center gap-2 text-slate-700 dark:text-zinc-200 cursor-pointer"
                    >
                      {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-teal-500" /> : <Maximize className="w-3.5 h-3.5 text-teal-500" />}
                      <span>{isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('workspace')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                activeDropdown === 'workspace'
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>Workspace</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <AnimatePresence>
              {activeDropdown === 'workspace' && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={closeAllDropdowns} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.96 }}
                    className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 z-[100]"
                  >
                    {!activeLocalNoteId && (
                      <div className="px-2.5 py-1 border-b border-slate-100 dark:border-zinc-800 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Category Label</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {ROOM_LABELS.map((lb) => (
                            <button
                              key={lb.name}
                              type="button"
                              onClick={() => {
                                updateLabel(lb.name);
                                closeAllDropdowns();
                                addToast('success', `Room labeled as "${lb.name}"`);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                roomLabel === lb.name
                                  ? 'bg-teal-500/15 text-teal-600 font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-teal-500" />
                                <span>{lb.name}</span>
                              </div>
                              {roomLabel === lb.name && <Check className="w-3 h-3 text-teal-500" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (onLeaveWorkspace) onLeaveWorkspace();
                        else handleExitRoom();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Leave Workspace</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* CENTER SECTION: Universal Search Trigger */}
      <div className="flex-1 max-w-xs mx-1 sm:mx-3 flex justify-center">
        <button
          type="button"
          onClick={onSearchOpen}
          aria-label="Search or open command palette"
          className="w-full flex items-center justify-between px-2.5 py-1 bg-slate-100/80 dark:bg-zinc-900/80 hover:bg-slate-200/80 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-lg text-xs text-slate-600 dark:text-zinc-300 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500/40"
          title="Quick Search (⌘K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate">Search or jump...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-white dark:bg-zinc-950 border border-teal-500/30 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* RIGHT SECTION: Undo, Redo, Share, Collaborate, Sync, User Avatar, Overflow Menu */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo & Redo Controls */}
        <div className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800">
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => onUndo?.()}
            className="p-1 rounded hover:bg-white dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Button (Copy Link) */}
        <button
          type="button"
          onClick={handleCopyCodeOnly}
          className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 transition-all cursor-pointer"
          title="Share / Copy Link"
        >
          {hasCopied ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>

        {/* Active Collaborators Pill & Dropdown */}
        {!activeLocalNoteId && (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('collaborate')}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-xs font-semibold text-teal-700 dark:text-teal-300 transition-all cursor-pointer"
              title="Active Participants"
            >
              <Users className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <div className="flex -space-x-1.5">
                {activeUsers.slice(0, 3).map((u, idx) => (
                  <div
                    key={u.uid ? `${u.uid}-${idx}` : `avatar-${idx}`}
                    className="w-4 h-4 rounded-full border border-white dark:border-zinc-950 text-[8px] font-black flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: u.color || '#14b8a6' }}
                  >
                    {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                {activeUsers.length}
              </span>
            </button>

            <AnimatePresence>
              {activeDropdown === 'collaborate' && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={closeAllDropdowns} />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1 w-60 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 z-[100]"
                  >
                    <div className="px-2 py-1 border-b border-teal-500/10 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400">
                        Active Participants ({activeUsers.length})
                      </span>
                      {currentRole && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-600 capitalize">
                          {currentRole}
                        </span>
                      )}
                    </div>

                    <div className="max-h-36 overflow-y-auto flex flex-col gap-1 mb-2">
                      {activeUsers.map((u, idx) => (
                        <div
                          key={u.uid ? `${u.uid}-${idx}` : `user-${idx}`}
                          className="flex items-center justify-between px-2 py-1 rounded-lg bg-teal-500/5 dark:bg-zinc-900/60 text-xs border border-teal-500/10"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: u.color || '#14b8a6' }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                              {u.name || 'Anonymous Scribe'}
                            </span>
                          </div>
                          <span className="text-[9px] text-teal-500 font-mono font-bold">active</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsQRModalOpen(true);
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-500" />
                      <span>Share via QR Code</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sync Status Dot */}
        <div className="flex items-center px-1" title={`Sync Status: ${syncStatus || 'Connected'}`}>
          {syncStatus === 'saving' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-500" />
          ) : syncStatus === 'error' ? (
            <CloudOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-teal-500 ring-2 ring-teal-500/20" />
          )}
        </div>

        {/* Overflow Menu (⋮) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('overflow')}
            aria-label="More Options Menu"
            className="p-1.5 rounded-lg bg-slate-100/80 dark:bg-zinc-900/80 hover:bg-slate-200/80 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {activeDropdown === 'overflow' && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={closeAllDropdowns} />
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.96 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 z-[100]"
                >
                  {onOpenAdminDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAdminDashboard();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}

                  {isInstallable && !isAppInstalled && (
                    <button
                      type="button"
                      onClick={() => {
                        handleInstallApp();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-500 animate-bounce" />
                      <span>Install LivePad PWA</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleAutoCollapse) onToggleAutoCollapse();
                      closeAllDropdowns();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-teal-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    <span>Sidebar Auto-Collapse: {autoCollapseEnabled ? '3s Auto' : 'Pinned'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShortcutsModalOpen(true);
                      closeAllDropdowns();
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-teal-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-500" />
                    <span>Keyboard Shortcuts</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        roomCode={roomCode}
        roomTitle={roomTitle || currentTitle}
        addToast={addToast}
      />
    </header>
  );
}


