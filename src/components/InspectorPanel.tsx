import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  X,
  Search,
  Pin,
  PinOff,
  ChevronDown,
  ChevronRight,
  FileText,
  Type,
  Palette,
  Users,
  BookOpen,
  Paperclip,
  Download,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Sparkles,
  Edit2,
  Check,
  Copy,
  Upload,
  Trash2,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
  Grid,
  Shield,
  Clock,
  ChevronUp,
  PanelRightClose,
  PanelRight,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { UserPresence, Attachment, WorkspaceRole } from '../types';

export interface InspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onToggle?: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void;
  isResizing: boolean;
  
  // Auto-hide configuration
  autoCollapseEnabled: boolean;
  onToggleAutoCollapse: () => void;
  
  // Document Context
  documentTitle: string;
  onTitleChange?: (newTitle: string) => void;
  documentCategory?: string;
  onCategoryChange?: (category: string) => void;
  editorContent: string;
  selectedText?: string;
  selectionRange?: { start: number; end: number } | null;
  
  // Formatting Actions
  onFormatText?: (tagOpen: string, tagClose?: string) => void;
  onInsertMarkdown?: (markdown: string) => void;
  
  // Editor Settings
  wordWrap: boolean;
  onToggleWordWrap: () => void;
  lineHeight: number;
  onChangeLineHeight: (val: number) => void;
  fontFamily: string;
  onChangeFontFamily: (font: string) => void;
  readOnly: boolean;
  onToggleReadOnly: () => void;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  canvasWidth?: 'standard' | 'wide' | 'full';
  onChangeCanvasWidth?: (w: 'standard' | 'wide' | 'full') => void;
  
  // Collaboration / User Presence
  userName: string;
  userColor: string;
  onSaveNickname: (name: string) => void;
  activeUsers: UserPresence[];
  currentUid: string;
  roomCode?: string;
  userRole?: WorkspaceRole;
  
  // Document Structure
  onNavigateToLine?: (lineText: string) => void;
  
  // Attachments
  attachments: Attachment[];
  onUploadAttachment?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAttachment?: (id: string) => void;
  
  // Export
  onExportMarkdown?: () => void;
  onExportHTML?: () => void;
  onExportTxt?: () => void;
  onExportPDF?: () => void;
  onExportEpub?: () => void;
  
  // Mobile flag
  isMobile: boolean;
}

// Memory keys
const LAST_OPENED_SECTION_KEY = 'livepad_inspector_last_section_v1';

// Toggle Switch Component
const ToggleSwitch = memo(({
  checked,
  onChange,
  label,
  description,
  id
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) => (
  <div className="flex items-center justify-between py-1.5 px-1 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded-lg transition-colors">
    <div className="flex flex-col pr-2">
      <label htmlFor={id} className="text-xs font-semibold text-slate-800 dark:text-zinc-200 cursor-pointer select-none">
        {label}
      </label>
      {description && <span className="text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">{description}</span>}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
        checked ? 'bg-cyan-600 dark:bg-cyan-500' : 'bg-slate-200 dark:bg-zinc-800'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
));

ToggleSwitch.displayName = 'ToggleSwitch';

// Section Accordion Component
const AccordionSection = memo(({
  id,
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string | number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border border-slate-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 shadow-2xs transition-all">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-900/80 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-colors select-none text-left cursor-pointer"
      aria-expanded={isOpen}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate uppercase tracking-wider">
          {title}
        </span>
        {badge !== undefined && (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
            {badge}
          </span>
        )}
      </div>
      <div className="text-slate-400 dark:text-zinc-500 shrink-0">
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
    </button>
    
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="p-3.5 space-y-3.5 border-t border-slate-100 dark:border-zinc-800/60 text-xs">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

AccordionSection.displayName = 'AccordionSection';

export const InspectorPanel: React.FC<InspectorPanelProps> = memo(({
  isOpen,
  onClose,
  onOpen,
  onToggle,
  width,
  onResizeStart,
  isResizing,
  autoCollapseEnabled,
  onToggleAutoCollapse,
  documentTitle,
  onTitleChange,
  documentCategory,
  onCategoryChange,
  editorContent,
  selectedText = '',
  selectionRange,
  onFormatText,
  onInsertMarkdown,
  wordWrap,
  onToggleWordWrap,
  lineHeight,
  onChangeLineHeight,
  fontFamily,
  onChangeFontFamily,
  readOnly,
  onToggleReadOnly,
  theme,
  onThemeChange,
  canvasWidth = 'standard',
  onChangeCanvasWidth,
  userName,
  userColor,
  onSaveNickname,
  activeUsers,
  currentUid,
  roomCode,
  userRole = 'Editor',
  onNavigateToLine,
  attachments,
  onUploadAttachment,
  onDeleteAttachment,
  onExportMarkdown,
  onExportHTML,
  onExportTxt,
  onExportPDF,
  onExportEpub,
  isMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>(() => {
    return localStorage.getItem(LAST_OPENED_SECTION_KEY) || 'selection';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(userName);
  const [titleInput, setTitleInput] = useState(documentTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Sync titleInput with prop
  useEffect(() => {
    setTitleInput(documentTitle);
  }, [documentTitle]);

  // Sync nicknameInput with prop
  useEffect(() => {
    setNicknameInput(userName);
  }, [userName]);

  // Save active section preference
  const handleToggleSection = useCallback((sectionId: string) => {
    setActiveSection((prev) => {
      const next = prev === sectionId ? '' : sectionId;
      if (next) {
        localStorage.setItem(LAST_OPENED_SECTION_KEY, next);
      }
      return next;
    });
  }, []);

  // Keyboard shortcut handlers (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Selection inspection detection
  const selectionContext = useMemo(() => {
    if (!selectedText || !selectedText.trim()) {
      return { type: 'none', label: 'Document Focus' };
    }
    const txt = selectedText.trim();
    if (txt.startsWith('![') && txt.includes('](')) {
      return { type: 'image', label: 'Image Selected', text: txt };
    }
    if (txt.includes('|') && txt.includes('-')) {
      return { type: 'table', label: 'Table Selected', text: txt };
    }
    if (txt.startsWith('```')) {
      return { type: 'code', label: 'Code Block Selected', text: txt };
    }
    return { type: 'text', label: `Text (${txt.length} chars)`, text: txt };
  }, [selectedText]);

  // Document word/char/paragraph stats
  const docStats = useMemo(() => {
    const text = editorContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const lines = text.split(/\r?\n/).length;
    const paragraphs = text.split(/\n\s*\n+/).filter((p) => p.trim()).length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 200));
    return { words, chars, lines, paragraphs, readingTimeMin };
  }, [editorContent]);

  // Parse Document Outline Structure
  const documentOutline = useMemo(() => {
    if (!editorContent) return [];
    const lines = editorContent.split(/\r?\n/);
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    const outline: { id: string; title: string; level: number; lineNum: number }[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(headingRegex);
      if (match) {
        outline.push({
          id: `heading-${idx}`,
          title: match[2].trim(),
          level: match[1].length,
          lineNum: idx + 1
        });
      }
    });

    return outline;
  }, [editorContent]);

  // Filter sections by search query
  const searchMatches = useCallback((keywords: string[]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return keywords.some((kw) => kw.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSaveTitle = () => {
    if (onTitleChange && titleInput.trim()) {
      onTitleChange(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      onSaveNickname(nicknameInput.trim());
    }
    setIsEditingName(false);
  };

  // Render Collapsed Sidebar Trigger when closed
  if (!isOpen && !isMobile) {
    return (
      <div className="fixed right-3 top-20 z-40 flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpen || onToggle || onClose}
          className="p-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 shadow-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all hover:scale-105 active:scale-95 group relative cursor-pointer"
          title="Show Inspector Panel (Ctrl+.)"
          aria-label="Show Inspector Panel"
        >
          <PanelRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-black text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Show Inspector (Ctrl+.)
          </span>
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Resizable Inspector Sidebar Container */}
      <motion.aside
        id="sidebar-container-resizable"
        {...(isMobile
          ? {
              initial: { y: '100%', opacity: 0 },
              animate: { y: 0, opacity: 1 },
              exit: { y: '100%', opacity: 0 },
              transition: { duration: 0.22, ease: 'easeOut' }
            }
          : {
              initial: { transform: 'translateX(100%)', opacity: 0 },
              animate: { transform: 'translateX(0%)', opacity: 1 },
              exit: { transform: 'translateX(100%)', opacity: 0 },
              transition: { duration: 0.2, ease: 'easeOut' },
              style: {
                width: `${width}px`,
                minWidth: '280px',
                maxWidth: '420px',
                willChange: 'transform'
              }
            })}
        className={`fixed z-45 flex flex-col bg-white/95 dark:bg-zinc-950/95 border-l border-slate-200/90 dark:border-zinc-800/90 shadow-2xl backdrop-blur-2xl transition-all ${
          isMobile
            ? 'inset-x-0 bottom-0 top-16 rounded-t-3xl max-h-[85vh]'
            : 'top-0 right-0 h-full'
        }`}
        role="complementary"
        aria-label="Inspector Panel"
      >
        {/* Left Resizer Drag Handle on Desktop */}
        {!isMobile && (
          <div
            onMouseDown={onResizeStart}
            onTouchStart={onResizeStart}
            className={`absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-cyan-500/50 transition-colors z-50 group flex items-center justify-center ${
              isResizing ? 'bg-cyan-500' : ''
            }`}
            title="Drag border to resize Inspector panel"
          >
            <div className="w-1 h-8 bg-slate-300 dark:bg-zinc-700 group-hover:bg-cyan-400 rounded-full transition-colors" />
          </div>
        )}

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 shrink-0 px-4 py-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-wide">
                Inspector
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                Ctrl+.
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleAutoCollapse}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  autoCollapseEnabled
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title={autoCollapseEnabled ? 'Auto-collapse ON (3s timer enabled)' : 'Pinned ON (Auto-collapse OFF)'}
              >
                {autoCollapseEnabled ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/80 dark:border-zinc-700/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                title="Hide Inspector Sidebar (Esc or Ctrl+.)"
              >
                <PanelRightClose className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Hide</span>
              </button>
            </div>
          </div>

          {/* Quick Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Inspector settings... (⌘K)"
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
          
          {/* 1. Dynamic Context Selection Properties */}
          {(searchMatches(['selection', 'text', 'typography', 'image', 'table', 'code', 'formatting']) || selectedText) && (
            <AccordionSection
              id="selection"
              title={selectionContext.label}
              icon={
                selectionContext.type === 'image'
                  ? ImageIcon
                  : selectionContext.type === 'table'
                  ? TableIcon
                  : selectionContext.type === 'code'
                  ? Code
                  : Type
              }
              isOpen={activeSection === 'selection' || !!searchQuery}
              onToggle={() => handleToggleSection('selection')}
            >
              {selectionContext.type === 'text' && (
                <div className="space-y-3">
                  {/* Text Formatting Actions */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Text Styling
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                      {[
                        { icon: Bold, label: 'Bold', tagOpen: '**', tagClose: '**' },
                        { icon: Italic, label: 'Italic', tagOpen: '*', tagClose: '*' },
                        { icon: Strikethrough, label: 'Strike', tagOpen: '~~', tagClose: '~~' },
                        { icon: Code, label: 'Code', tagOpen: '`', tagClose: '`' },
                      ].map((item) => {
                        const IconComp = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => onFormatText && onFormatText(item.tagOpen, item.tagClose)}
                            className="p-1.5 flex-1 rounded-md hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all flex items-center justify-center cursor-pointer"
                            title={item.label}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alignment */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Alignment
                    </label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                      {[
                        { icon: AlignLeft, align: 'left' },
                        { icon: AlignCenter, align: 'center' },
                        { icon: AlignRight, align: 'right' },
                        { icon: AlignJustify, align: 'justify' },
                      ].map((item, idx) => {
                        const IconComp = item.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onInsertMarkdown && onInsertMarkdown(`<p align="${item.align}">${selectedText}</p>`)}
                            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all flex items-center justify-center cursor-pointer"
                            title={`Align ${item.align}`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Transform Actions */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Quick Transformations
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInsertMarkdown && onInsertMarkdown(selectedText.toUpperCase())}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-[11px] transition-all cursor-pointer text-left"
                      >
                        UPPERCASE
                      </button>
                      <button
                        type="button"
                        onClick={() => onInsertMarkdown && onInsertMarkdown(selectedText.toLowerCase())}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-[11px] transition-all cursor-pointer text-left"
                      >
                        lowercase
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectionContext.type === 'image' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                      Image Actions
                    </label>
                    <button
                      type="button"
                      onClick={() => onInsertMarkdown && onInsertMarkdown(`![Image](${prompt('Enter Image URL:', 'https://') || ''})`)}
                      className="w-full px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Replace Image Link
                    </button>
                  </div>
                </div>
              )}

              {selectionContext.type === 'table' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onInsertMarkdown && onInsertMarkdown(`\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n`)}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 font-semibold text-[11px] transition-all"
                    >
                      Add Table Row
                    </button>
                  </div>
                </div>
              )}

              {selectionContext.type === 'none' && (
                <div className="p-3 rounded-lg bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500 inline mr-1.5" />
                  Select text, images, code blocks, or tables in the editor to reveal specific context properties here.
                </div>
              )}
            </AccordionSection>
          )}

          {/* 2. Document & Properties */}
          {searchMatches(['document', 'title', 'properties', 'word', 'character', 'line', 'wrap', 'stats']) && (
            <AccordionSection
              id="document"
              title="Document Properties"
              icon={FileText}
              badge={`${docStats.words} words`}
              isOpen={activeSection === 'document' || !!searchQuery}
              onToggle={() => handleToggleSection('document')}
            >
              {/* Document Title Editable */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Document Title
                  </label>
                  {!isEditingTitle ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                    >
                      <Edit2 className="w-2.5 h-2.5" /> Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveTitle}
                      className="text-emerald-500 hover:underline flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                    >
                      <Check className="w-2.5 h-2.5" /> Save
                    </button>
                  )}
                </div>

                {!isEditingTitle ? (
                  <div className="px-3 py-2 rounded-lg bg-slate-100/70 dark:bg-zinc-900/70 font-bold text-slate-800 dark:text-zinc-200 truncate border border-slate-200/50 dark:border-zinc-800/50">
                    {documentTitle || 'Untitled Document'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-cyan-500 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/50">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold block">Word Count</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{docStats.words}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/50">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold block">Characters</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{docStats.chars}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/50">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold block">Paragraphs</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{docStats.paragraphs}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/50">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold block">Read Time</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">~{docStats.readingTimeMin} min</span>
                </div>
              </div>

              {/* Editor Toggles */}
              <div className="space-y-1 pt-1">
                <ToggleSwitch
                  id="word-wrap-switch"
                  checked={wordWrap}
                  onChange={onToggleWordWrap}
                  label="Soft Word Wrap"
                  description="Wrap long text lines automatically"
                />
                <ToggleSwitch
                  id="readonly-switch"
                  checked={readOnly}
                  onChange={onToggleReadOnly}
                  label="Read-Only Mode"
                  description="Prevent accidental edits to text"
                />
              </div>

              {/* Line Height Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Line Height: {lineHeight}x
                </label>
                <div className="flex gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                  {[1.2, 1.5, 1.7, 2.0].map((lh) => (
                    <button
                      key={lh}
                      type="button"
                      onClick={() => onChangeLineHeight(lh)}
                      className={`flex-1 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                        lineHeight === lh
                          ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => onChangeFontFamily(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="sans">Plus Jakarta Sans / Clean Sans</option>
                  <option value="mono">JetBrains Mono / Code</option>
                  <option value="serif">Playfair Display / Serif</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </AccordionSection>
          )}

          {/* 3. Appearance Settings */}
          {searchMatches(['appearance', 'theme', 'dark', 'light', 'canvas', 'width', 'layout']) && (
            <AccordionSection
              id="appearance"
              title="Appearance & Canvas"
              icon={Palette}
              isOpen={activeSection === 'appearance' || !!searchQuery}
              onToggle={() => handleToggleSection('appearance')}
            >
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Color Mode
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'Auto', icon: Laptop },
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onThemeChange(t.id as any)}
                        className={`py-1.5 px-2 rounded-md font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-xs border border-slate-200/50 dark:border-zinc-700'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Width Selection */}
              {onChangeCanvasWidth && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Canvas Max-Width
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
                    {[
                      { id: 'standard', label: 'Normal' },
                      { id: 'wide', label: 'Wide' },
                      { id: 'full', label: 'Full' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onChangeCanvasWidth(w.id as any)}
                        className={`py-1.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                          canvasWidth === w.id
                            ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-xs'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sidebar Visibility & Options */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-zinc-800/60 space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Inspector Sidebar Controls
                </label>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100/90 hover:bg-slate-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <PanelRightClose className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>Hide Inspector Sidebar</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                    Ctrl+.
                  </span>
                </button>

                <ToggleSwitch
                  checked={autoCollapseEnabled}
                  onChange={onToggleAutoCollapse}
                  label="Auto-hide Inspector Sidebar"
                  description="Automatically slide away 3 seconds after opening a new document"
                  id="auto-collapse-inspector-setting-toggle"
                />

                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-snug">
                  Shortcut: Press <code className="font-mono bg-slate-100 dark:bg-zinc-800 px-1 rounded text-slate-600 dark:text-zinc-300">Ctrl + .</code> or <code className="font-mono bg-slate-100 dark:bg-zinc-800 px-1 rounded text-slate-600 dark:text-zinc-300">⌘ + .</code> anytime to hide or show sidebar.
                </p>
              </div>
            </AccordionSection>
          )}

          {/* 4. Collaboration & Presence */}
          {searchMatches(['collaboration', 'users', 'active', 'presence', 'role', 'nickname', 'share']) && (
            <AccordionSection
              id="collaboration"
              title="Collaboration & Users"
              icon={Users}
              badge={activeUsers.length}
              isOpen={activeSection === 'collaboration' || !!searchQuery}
              onToggle={() => handleToggleSection('collaboration')}
            >
              {/* User Profile Card */}
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">My Profile Identity</span>
                  {!isEditingName ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                    >
                      <Edit2 className="w-2.5 h-2.5" /> Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveNickname}
                      className="text-emerald-500 hover:underline flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                    >
                      <Check className="w-2.5 h-2.5" /> Save
                    </button>
                  )}
                </div>

                {!isEditingName ? (
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: userColor }}
                    >
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{userName || 'Anonymous Member'}</p>
                      <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">{userRole || 'Editor'}</p>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNickname();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-cyan-500 text-xs font-bold focus:outline-none"
                    autoFocus
                  />
                )}
              </div>

              {/* Active Online Users List */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
                  Active Users ({activeUsers.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeUsers.map((presence) => {
                    const isSelf = presence.uid === currentUid;
                    return (
                      <div
                        key={presence.uid}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-100/50 dark:bg-zinc-900/50 border border-slate-200/40 dark:border-zinc-800/40"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                            style={{ backgroundColor: presence.color }}
                          >
                            {presence.name ? presence.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                            {presence.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              You
                            </span>
                          )}
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccordionSection>
          )}

          {/* 5. Document Structure / Table of Contents */}
          {searchMatches(['structure', 'outline', 'toc', 'headings', 'section', 'navigation']) && (
            <AccordionSection
              id="structure"
              title="Document Outline"
              icon={BookOpen}
              badge={documentOutline.length}
              isOpen={activeSection === 'structure' || !!searchQuery}
              onToggle={() => handleToggleSection('structure')}
            >
              {documentOutline.length === 0 ? (
                <div className="py-4 text-center text-slate-400 dark:text-zinc-500 text-[11px]">
                  No Markdown headings found. Add `# Heading` to generate outline nodes.
                </div>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {documentOutline.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigateToLine && onNavigateToLine(item.title)}
                      className="w-full text-left p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer group"
                      style={{ paddingLeft: `${(item.level - 1) * 12 + 6}px` }}
                    >
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0">
                        H{item.level}
                      </span>
                      <span className="font-medium text-xs truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </AccordionSection>
          )}

          {/* 6. Attachments & Files */}
          {searchMatches(['attachments', 'files', 'upload', 'media']) && (
            <AccordionSection
              id="attachments"
              title="Attachments & Files"
              icon={Paperclip}
              badge={attachments.length}
              isOpen={activeSection === 'attachments' || !!searchQuery}
              onToggle={() => handleToggleSection('attachments')}
            >
              {onUploadAttachment && (
                <div>
                  <label className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-center gap-2 cursor-pointer transition-all text-slate-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400">
                    <Upload className="w-4 h-4" />
                    <span className="font-semibold text-xs">Upload File or Asset</span>
                    <input type="file" onChange={onUploadAttachment} className="hidden" />
                  </label>
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="py-3 text-center text-slate-400 dark:text-zinc-500 text-[11px]">
                  No attachments added to this note yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="p-2 rounded-lg bg-slate-100/70 dark:bg-zinc-900/70 border border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Asset'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-slate-400 hover:text-cyan-500"
                          title="Open Attachment"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {onDeleteAttachment && (
                          <button
                            type="button"
                            onClick={() => onDeleteAttachment(file.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionSection>
          )}

          {/* 7. Export & Developer */}
          {searchMatches(['export', 'download', 'markdown', 'html', 'pdf', 'txt', 'epub', 'book', 'developer']) && (
            <AccordionSection
              id="export"
              title="Export & Developer"
              icon={Download}
              isOpen={activeSection === 'export' || !!searchQuery}
              onToggle={() => handleToggleSection('export')}
            >
              <div className="grid grid-cols-2 gap-1.5">
                {onExportMarkdown && (
                  <button
                    type="button"
                    onClick={onExportMarkdown}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Markdown (.md)</span>
                  </button>
                )}
                {onExportHTML && (
                  <button
                    type="button"
                    onClick={onExportHTML}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-purple-500" />
                    <span>HTML (.html)</span>
                  </button>
                )}
                {onExportTxt && (
                  <button
                    type="button"
                    onClick={onExportTxt}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Plain Text (.txt)</span>
                  </button>
                )}
                {onExportPDF && (
                  <button
                    type="button"
                    onClick={onExportPDF}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PrinterIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span>PDF View</span>
                  </button>
                )}
                {onExportEpub && (
                  <button
                    type="button"
                    onClick={onExportEpub}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer col-span-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>EPUB E-Book (.epub)</span>
                  </button>
                )}
              </div>
            </AccordionSection>
          )}

        </div>
      </motion.aside>
    </>
  );
});

InspectorPanel.displayName = 'InspectorPanel';

// Helper icon
function PrinterIcon(props: any) {
  return <Download {...props} />;
}
