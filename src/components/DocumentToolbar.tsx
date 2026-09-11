import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Table,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  RemoveFormatting,
  ListTree,
  ChevronDown,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Sparkles,
  RotateCcw,
  Trash2,
  GripVertical,
  Move,
  Share2,
  Check,
  Smile,
  Search,
  Columns2,
  Mic,
} from 'lucide-react';
import { searchEmojis } from '../lib/emojiData';
import { DictationState } from '../types/dictation';

interface DocumentToolbarProps {
  editor: Editor | null;
  onApplyFormat?: (formatType: string, extraData?: any) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  pageWidth: 'narrow' | 'medium' | 'full';
  onChangePageWidth: (width: 'narrow' | 'medium' | 'full') => void;
  onToggleOutline: () => void;
  isOutlineOpen: boolean;
  isReadOnly: boolean;
  onToggleReadOnly?: () => void;
  isCodeMode: boolean;
  wordCount: number;
  readingTime: number;
  selectedText?: string;
  theme?: 'light' | 'dark' | 'sepia' | 'system';
  onToggleSplitPreview?: () => void;
  isSplitPreviewOpen?: boolean;
  onToggleDictation?: () => void;
  dictationState?: DictationState;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const FONT_FAMILIES = [
  { name: 'Default (Sans)', value: '' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Helvetica / Arial', value: 'Helvetica, Arial, sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { name: 'Fira Code', value: '"Fira Code", monospace' },
  { name: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Lora', value: 'Lora, serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
  { name: 'Caveat (Handwriting)', value: 'Caveat, cursive' },
];
const PRESET_COLORS = [
  '#ffffff', '#cbd5e1', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export default function DocumentToolbar({
  editor,
  onApplyFormat,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  pageWidth,
  onChangePageWidth,
  onToggleOutline,
  isOutlineOpen,
  isReadOnly,
  onToggleReadOnly,
  isCodeMode,
  wordCount,
  readingTime,
  selectedText = '',
  theme = 'system',
  onToggleSplitPreview,
  isSplitPreviewOpen = false,
  onToggleDictation,
  dictationState = 'idle'
}: DocumentToolbarProps) {
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
  const [fontFamilyDropdownOpen, setFontFamilyDropdownOpen] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [pageWidthDropdownOpen, setPageWidthDropdownOpen] = useState(false);
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);
  const [emojiDropdownOpen, setEmojiDropdownOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [hasSelectionState, setHasSelectionState] = useState(false);

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'sepia'>(() => {
    if (theme === 'light' || theme === 'dark' || theme === 'sepia') return theme;
    if (typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('sepia')) return 'sepia';
      if (document.documentElement.classList.contains('dark')) return 'dark';
      if (document.documentElement.classList.contains('light')) return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'light' || theme === 'dark' || theme === 'sepia') {
      setActiveTheme(theme);
      return;
    }
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        if (document.documentElement.classList.contains('sepia')) {
          setActiveTheme(prev => prev !== 'sepia' ? 'sepia' : prev);
        } else if (document.documentElement.classList.contains('dark')) {
          setActiveTheme(prev => prev !== 'dark' ? 'dark' : prev);
        } else {
          setActiveTheme(prev => prev !== 'light' ? 'light' : prev);
        }
      }
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  const [imageWidthInput, setImageWidthInput] = useState<string>('');
  const [imageHeightInput, setImageHeightInput] = useState<string>('');
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('livepad_toolbar_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return { x: 0, y: 0 };
  });

  const handleDragEnd = (_: any, info: { offset: { x: number; y: number } }) => {
    setToolbarPos((prev) => {
      const newPos = {
        x: prev.x + info.offset.x,
        y: prev.y + info.offset.y,
      };
      try {
        localStorage.setItem('livepad_toolbar_pos', JSON.stringify(newPos));
      } catch {
        // ignore
      }
      return newPos;
    });
  };

  const handleResetToolbarPos = (e: React.MouseEvent) => {
    e.stopPropagation();
    const resetPos = { x: 0, y: 0 };
    setToolbarPos(resetPos);
    try {
      localStorage.setItem('livepad_toolbar_pos', JSON.stringify(resetPos));
    } catch {
      // ignore
    }
  };

  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: document.title || 'LivePad Collaborative Document',
      text: 'Join me on LivePad to edit this real-time document!',
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  // Sync image dimensions when selected image changes
  useEffect(() => {
    if (!editor) return;

    const syncImageData = () => {
      if (editor.isActive('image')) {
        const attrs = editor.getAttributes('image');
        setImageWidthInput(attrs.width ? String(attrs.width) : '');
        setImageHeightInput(attrs.height ? String(attrs.height) : '');
      }
    };

    syncImageData();
    editor.on('selectionUpdate', syncImageData);
    editor.on('transaction', syncImageData);

    return () => {
      editor.off('selectionUpdate', syncImageData);
      editor.off('transaction', syncImageData);
    };
  }, [editor]);

  const handleWidthChange = (val: string) => {
    setImageWidthInput(val);
    if (!editor || !editor.isActive('image')) return;

    if (val.trim() === '') {
      editor.chain().focus().updateAttributes('image', { width: null }).run();
      return;
    }

    const numericW = parseInt(val, 10);
    if (!isNaN(numericW) && numericW > 0) {
      if (lockAspectRatio) {
        const attrs = editor.getAttributes('image');
        const oldW = parseInt(attrs?.width, 10);
        const oldH = parseInt(attrs?.height, 10);
        if (!isNaN(oldW) && !isNaN(oldH) && oldW > 0) {
          const ratio = oldH / oldW;
          const newH = Math.round(numericW * ratio);
          setImageHeightInput(String(newH));
          editor.chain().focus().updateAttributes('image', { width: numericW, height: newH }).run();
          return;
        }
      }
      editor.chain().focus().updateAttributes('image', { width: numericW }).run();
    }
  };

  const handleHeightChange = (val: string) => {
    setImageHeightInput(val);
    if (!editor || !editor.isActive('image')) return;

    if (val.trim() === '') {
      editor.chain().focus().updateAttributes('image', { height: null }).run();
      return;
    }

    const numericH = parseInt(val, 10);
    if (!isNaN(numericH) && numericH > 0) {
      if (lockAspectRatio) {
        const attrs = editor.getAttributes('image');
        const oldW = parseInt(attrs?.width, 10);
        const oldH = parseInt(attrs?.height, 10);
        if (!isNaN(oldW) && !isNaN(oldH) && oldH > 0) {
          const ratio = oldW / oldH;
          const newW = Math.round(numericH * ratio);
          setImageWidthInput(String(newW));
          editor.chain().focus().updateAttributes('image', { width: newW, height: numericH }).run();
          return;
        }
      }
      editor.chain().focus().updateAttributes('image', { height: numericH }).run();
    }
  };

  const handleImagePreset = (percentage: number) => {
    if (!editor || !editor.isActive('image')) return;
    const parentW = 800;
    const targetW = Math.round((parentW * percentage) / 100);
    const attrs = editor.getAttributes('image');
    const oldW = parseInt(attrs?.width, 10) || parentW;
    const oldH = parseInt(attrs?.height, 10) || 500;
    const ratio = oldH / oldW;
    const targetH = Math.round(targetW * ratio);

    setImageWidthInput(String(targetW));
    setImageHeightInput(String(targetH));
    editor.chain().focus().updateAttributes('image', { width: targetW, height: targetH }).run();
  };

  const handleResetImageDimensions = () => {
    if (!editor || !editor.isActive('image')) return;
    setImageWidthInput('');
    setImageHeightInput('');
    editor.chain().focus().updateAttributes('image', { width: null, height: null }).run();
  };

  const handleSetImageAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor || !editor.isActive('image')) return;
    editor.chain().focus().updateAttributes('image', { alignment: align }).run();
  };

  const handleDeleteImage = () => {
    if (!editor || !editor.isActive('image')) return;
    editor.chain().focus().deleteSelection().run();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (e.g. PNG, JPG, WebP, GIF, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        if (editor) {
          editor.chain().focus().setImage({ src: base64Url }).run();
        } else if (onApplyFormat) {
          onApplyFormat('image', base64Url);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Monitor selection in TipTap editor
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setHasSelectionState(from !== to && text.trim().length > 0);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('transaction', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('transaction', handleSelectionUpdate);
    };
  }, [editor]);

  if (isCodeMode) return null;

  const isTableActive = editor?.isActive('table') ?? false;
  const isImageActive = editor?.isActive('image') ?? false;
  const isCodeActive = editor?.isActive('codeBlock') ?? false;
  const isLinkActive = editor?.isActive('link') ?? false;
  const isBlockquoteActive = editor?.isActive('blockquote') ?? false;
  const isHeadingActive = editor?.isActive('heading') ?? false;

  const isTextSelected = hasSelectionState || Boolean(selectedText && selectedText.trim().length > 0);
  const isContextActive = isTextSelected || isTableActive || isImageActive || isCodeActive || isLinkActive || isBlockquoteActive || isHeadingActive;

  const activeUndo = editor && !editor.isDestroyed ? (editor.can?.()?.undo?.() ?? false) : canUndo;
  const activeRedo = editor && !editor.isDestroyed ? (editor.can?.()?.redo?.() ?? false) : canRedo;

  const handleUndo = () => {
    if (editor) editor.chain().focus().undo().run();
    else if (onUndo) onUndo();
  };

  const handleRedo = () => {
    if (editor) editor.chain().focus().redo().run();
    else if (onRedo) onRedo();
  };

  const getHeadingLabel = () => {
    if (!editor) return 'Normal Text';
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Normal Text';
  };

  const currentFontSize = editor?.getAttributes('textStyle').fontSize || 'Size';
  const currentFontFamilyRaw = editor?.getAttributes('textStyle').fontFamily || '';

  const getFontFamilyLabel = () => {
    if (!currentFontFamilyRaw) return 'Font';
    const found = FONT_FAMILIES.find(
      (f) => f.value && (currentFontFamilyRaw.includes(f.name) || currentFontFamilyRaw === f.value)
    );
    return found ? found.name.split(' ')[0] : 'Font';
  };

  const currentColor = editor?.getAttributes('textStyle').color || '#ffffff';

  const isSepia = activeTheme === 'sepia';
  const isLight = activeTheme === 'light';

  const toolbarBg = isSepia
    ? 'bg-[#f6ebd4]/95 text-[#4a3b2c] border-[#e2d3bd] shadow-xl shadow-amber-950/10'
    : isLight
    ? 'bg-white/95 text-slate-800 border-slate-200/90 shadow-xl shadow-slate-300/40'
    : 'bg-slate-900/95 dark:bg-zinc-900/95 text-white border-slate-700/90 dark:border-zinc-700/90 shadow-2xl';

  const btnHover = isSepia
    ? 'hover:bg-[#ebe0c8] text-[#5c4a38]'
    : isLight
    ? 'hover:bg-slate-100 text-slate-700'
    : 'hover:bg-zinc-800 text-zinc-300';

  const dividerBg = isSepia
    ? 'bg-[#dcd0bc]'
    : isLight
    ? 'bg-slate-200'
    : 'bg-zinc-700';

  const dropdownBg = isSepia
    ? 'bg-[#f8f0e1] border-[#e2d3bd] text-[#4a3b2c] shadow-xl'
    : isLight
    ? 'bg-white border-slate-200 text-slate-800 shadow-xl'
    : 'bg-zinc-900 border-zinc-700 text-white shadow-xl';

  const dropdownItemHover = isSepia
    ? 'hover:bg-[#ebdcc5] text-[#4a3b2c]'
    : isLight
    ? 'hover:bg-slate-100 text-slate-800'
    : 'hover:bg-zinc-800 text-zinc-200';

  const badgeBg = isSepia
    ? 'bg-amber-200/80 text-amber-900'
    : isLight
    ? 'bg-teal-100 text-teal-800'
    : 'bg-teal-500/20 text-teal-300';

  const showToolbarPopover = isPinned || isContextActive;

  return (
    <div className="relative z-40 w-full pointer-events-none">
      {/* FLOATING TOP-RIGHT UTILITY CONTROLS (Always accessible, zero vertical flow displacement) */}
      <div className={`absolute top-2 right-4 z-40 pointer-events-auto flex items-center gap-1 p-1 rounded-xl shadow-lg border backdrop-blur-md text-xs transition-colors ${toolbarBg}`}>
        {/* Toggle Pin Popover */}
        <button
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isPinned
              ? 'bg-teal-500 text-white font-bold'
              : btnHover
          }`}
          title={isPinned ? 'Unpin formatting toolbar popover' : 'Pin formatting toolbar popover'}
        >
          {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>

        <div className={`w-px h-3.5 my-auto ${dividerBg}`} />

        {/* Read-Only Toggle */}
        {onToggleReadOnly && (
          <button
            type="button"
            onClick={onToggleReadOnly}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isReadOnly
                ? 'bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/50'
                : btnHover
            }`}
            title={isReadOnly ? 'Document Locked (Click to edit)' : 'Lock Document'}
          >
            {isReadOnly ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 opacity-70" />}
            <span className="hidden sm:inline text-[11px]">{isReadOnly ? 'Locked' : 'Editable'}</span>
          </button>
        )}

        {/* Document Outline */}
        <button
          type="button"
          onClick={onToggleOutline}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isOutlineOpen ? 'bg-teal-500/30 text-teal-600 dark:text-teal-300 font-bold' : btnHover
          }`}
          title="Document Outline"
        >
          <ListTree className="w-3.5 h-3.5 text-teal-500" />
        </button>

        {/* Split-Screen Markdown Preview Toggle */}
        {onToggleSplitPreview && (
          <button
            type="button"
            onClick={onToggleSplitPreview}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isSplitPreviewOpen
                ? 'bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 shadow-xs'
                : btnHover
            }`}
            title={isSplitPreviewOpen ? 'Close Split Markdown Preview' : 'Open Split Markdown Preview'}
          >
            <Columns2 className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden md:inline text-[11px]">
              {isSplitPreviewOpen ? 'Split On' : 'Split Preview'}
            </span>
          </button>
        )}

        {/* Basic Dictation Mode Toggle */}
        {onToggleDictation && (
          <button
            type="button"
            onClick={onToggleDictation}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              dictationState === 'listening'
                ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/50'
                : dictationState === 'paused'
                ? 'bg-amber-500 text-white'
                : btnHover
            }`}
            title={
              dictationState === 'listening'
                ? 'Stop Voice Dictation (Listening...)'
                : dictationState === 'paused'
                ? 'Resume Voice Dictation (Paused)'
                : 'Start Voice Dictation'
            }
          >
            <Mic className={`w-3.5 h-3.5 ${dictationState === 'listening' ? 'animate-bounce text-white' : 'text-rose-500'}`} />
            <span className="hidden sm:inline text-[11px]">
              {dictationState === 'listening' ? 'Listening...' : dictationState === 'paused' ? 'Paused' : 'Dictate'}
            </span>
          </button>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            shareCopied
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
              : btnHover
          }`}
          title="Share Room Link (Native Share or Copy Link)"
        >
          {shareCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-teal-500" />
          )}
          <span className="hidden sm:inline text-[11px]">{shareCopied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Page Width */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPageWidthDropdownOpen(!pageWidthDropdownOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${btnHover}`}
            title="Page Width"
          >
            <span className="text-[10px] font-mono uppercase text-teal-600 dark:text-teal-400">
              {pageWidth === 'narrow' ? 'Narrow' : pageWidth === 'medium' ? 'Std' : 'Full'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          <AnimatePresence>
            {pageWidthDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setPageWidthDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className={`absolute right-0 top-full mt-1.5 w-32 rounded-xl border p-1 z-[100] ${dropdownBg}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChangePageWidth('narrow');
                      setPageWidthDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs font-medium rounded-lg cursor-pointer ${
                      pageWidth === 'narrow' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                    }`}
                  >
                    Narrow (680px)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangePageWidth('medium');
                      setPageWidthDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs font-medium rounded-lg cursor-pointer ${
                      pageWidth === 'medium' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                    }`}
                  >
                    Standard (850px)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangePageWidth('full');
                      setPageWidthDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs font-medium rounded-lg cursor-pointer ${
                      pageWidth === 'full' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                    }`}
                  >
                    Full Width
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CONTEXT-AWARE FORMATTING POPOVER (Animated floating popover rendered when text/blocks are selected or pinned) */}
      <AnimatePresence>
        {showToolbarPopover && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.05}
            onDragEnd={handleDragEnd}
            style={{ x: toolbarPos.x, y: toolbarPos.y }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[92vw] overflow-x-auto no-scrollbar rounded-2xl border backdrop-blur-xl p-1.5 px-3 flex items-center gap-1.5 cursor-grab active:cursor-grabbing ${toolbarBg}`}
          >
            {/* Drag Handle */}
            <div
              onDoubleClick={handleResetToolbarPos}
              className={`p-1 rounded cursor-grab active:cursor-grabbing transition-colors shrink-0 flex items-center gap-0.5 ${btnHover}`}
              title="Drag to move toolbar anywhere in the app UI (Double-click to reset position)"
            >
              <GripVertical className="w-4 h-4 opacity-70" />
            </div>

            <div className={`w-px h-3.5 my-auto shrink-0 ${dividerBg}`} />

            <div className={`flex items-center gap-1.5 ${isReadOnly ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              {/* Context Tag indicator */}
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider shrink-0 ${badgeBg}`}>
                <Sparkles className="w-3 h-3 text-teal-500" />
                <span>{isTableActive ? 'Table' : isCodeActive ? 'Code' : isImageActive ? 'Image' : isTextSelected ? 'Selection' : 'Toolbar'}</span>
              </div>

              <div className={`w-px h-3.5 my-auto shrink-0 ${dividerBg}`} />

              {/* Undo / Redo */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={!activeUndo}
                  onClick={handleUndo}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 transition-all cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!activeRedo}
                  onClick={handleRedo}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 transition-all cursor-pointer"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-px h-3.5 bg-zinc-700 my-auto shrink-0" />

              {isImageActive ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Image Width & Height numeric input fields */}
                  <div className={`flex items-center gap-1 p-1 rounded-lg border ${isSepia ? 'bg-[#ebe0c8]/90 border-[#d8c8b0]' : isLight ? 'bg-slate-100/90 border-slate-300' : 'bg-zinc-800/90 border-zinc-700/80'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1 opacity-70">Size:</span>
                    <input
                      type="number"
                      value={imageWidthInput}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder="W"
                      className={`w-14 px-1.5 py-0.5 rounded text-xs font-mono text-center focus:outline-none ${isSepia ? 'bg-[#f8f0e1] border border-[#d8c8b0] text-[#4a3b2c] focus:border-amber-700' : isLight ? 'bg-white border border-slate-300 text-slate-800 focus:border-teal-600' : 'bg-zinc-900 border border-zinc-700 text-teal-300 focus:border-teal-400'}`}
                      title="Width in pixels"
                    />
                    <span className="text-xs font-bold opacity-60">×</span>
                    <input
                      type="number"
                      value={imageHeightInput}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder="H"
                      className={`w-14 px-1.5 py-0.5 rounded text-xs font-mono text-center focus:outline-none ${isSepia ? 'bg-[#f8f0e1] border border-[#d8c8b0] text-[#4a3b2c] focus:border-amber-700' : isLight ? 'bg-white border border-slate-300 text-slate-800 focus:border-teal-600' : 'bg-zinc-900 border border-zinc-700 text-teal-300 focus:border-teal-400'}`}
                      title="Height in pixels"
                    />
                    <button
                      type="button"
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        lockAspectRatio ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300' : btnHover
                      }`}
                      title={lockAspectRatio ? 'Lock Aspect Ratio' : 'Unlock Aspect Ratio'}
                    >
                      {lockAspectRatio ? <Lock className="w-3 h-3 text-teal-500" /> : <Unlock className="w-3 h-3 opacity-60" />}
                    </button>
                  </div>

                  {/* Presets */}
                  <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${isSepia ? 'bg-[#ebe0c8]/80 border-[#d8c8b0]/60' : isLight ? 'bg-slate-100/80 border-slate-300/60' : 'bg-zinc-800/80 border-zinc-700/60'}`}>
                    <button
                      type="button"
                      onClick={() => handleImagePreset(25)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${btnHover}`}
                      title="Resize to 25% width"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImagePreset(50)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${btnHover}`}
                      title="Resize to 50% width"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImagePreset(75)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${btnHover}`}
                      title="Resize to 75% width"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImagePreset(100)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${btnHover}`}
                      title="Resize to 100% width"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={handleResetImageDimensions}
                      className={`p-1 rounded cursor-pointer ${btnHover}`}
                      title="Reset image dimensions"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Alignment */}
                  <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${isSepia ? 'bg-[#ebe0c8]/80 border-[#d8c8b0]/60' : isLight ? 'bg-slate-100/80 border-slate-300/60' : 'bg-zinc-800/80 border-zinc-700/60'}`}>
                    <button
                      type="button"
                      onClick={() => handleSetImageAlignment('left')}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        editor?.getAttributes('image').alignment === 'left' ? 'bg-teal-500 text-white font-bold' : btnHover
                      }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetImageAlignment('center')}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        (editor?.getAttributes('image').alignment || 'center') === 'center' ? 'bg-teal-500 text-white font-bold' : btnHover
                      }`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetImageAlignment('right')}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        editor?.getAttributes('image').alignment === 'right' ? 'bg-teal-500 text-white font-bold' : btnHover
                      }`}
                      title="Align Right"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors cursor-pointer"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Headings Selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setHeadingDropdownOpen(!headingDropdownOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSepia ? 'bg-[#ebe0c8]/80 hover:bg-[#ebdcc5] border-[#d8c8b0] text-[#4a3b2c]' : isLight ? 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 text-slate-800' : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-200'
                  }`}
                  title="Text Style"
                >
                  <Type className="w-3 h-3 text-teal-500" />
                  <span className="text-[11px]">{getHeadingLabel()}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>

                <AnimatePresence>
                  {headingDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setHeadingDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className={`absolute left-0 top-full mt-1.5 w-44 rounded-xl border p-1 z-[100] ${dropdownBg}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (editor) editor.chain().focus().setParagraph().run();
                            else if (onApplyFormat) onApplyFormat('paragraph');
                            setHeadingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer ${
                            editor?.isActive('paragraph') ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                          }`}
                        >
                          <Type className="w-3.5 h-3.5 opacity-60" /> Normal Text
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editor) editor.chain().focus().toggleHeading({ level: 1 }).run();
                            else if (onApplyFormat) onApplyFormat('h1');
                            setHeadingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-black rounded-lg flex items-center gap-2 cursor-pointer ${
                            editor?.isActive('heading', { level: 1 }) ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                          }`}
                        >
                          <Heading1 className="w-3.5 h-3.5 text-teal-500" /> Heading 1
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editor) editor.chain().focus().toggleHeading({ level: 2 }).run();
                            else if (onApplyFormat) onApplyFormat('h2');
                            setHeadingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer ${
                            editor?.isActive('heading', { level: 2 }) ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                          }`}
                        >
                          <Heading2 className="w-3.5 h-3.5 text-teal-500" /> Heading 2
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editor) editor.chain().focus().toggleHeading({ level: 3 }).run();
                            else if (onApplyFormat) onApplyFormat('h3');
                            setHeadingDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-2 cursor-pointer ${
                            editor?.isActive('heading', { level: 3 }) ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                          }`}
                        >
                          <Heading3 className="w-3 h-3 text-teal-500" /> Heading 3
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Font Family Selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setFontFamilyDropdownOpen(!fontFamilyDropdownOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSepia ? 'bg-[#ebe0c8]/80 hover:bg-[#ebdcc5] border-[#d8c8b0] text-[#4a3b2c]' : isLight ? 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 text-slate-800' : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-200'
                  }`}
                  title="Font Family"
                >
                  <span className="text-[11px] font-medium max-w-[85px] truncate">{getFontFamilyLabel()}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>

                <AnimatePresence>
                  {fontFamilyDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setFontFamilyDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className={`absolute left-0 top-full mt-1.5 w-44 max-h-60 overflow-y-auto rounded-xl border p-1 z-[100] custom-scrollbar ${dropdownBg}`}
                      >
                        {FONT_FAMILIES.map((font) => (
                          <button
                            key={font.name}
                            type="button"
                            onClick={() => {
                              if (editor) {
                                if (font.value) {
                                  editor.chain().focus().setFontFamily(font.value).run();
                                } else {
                                  editor.chain().focus().unsetFontFamily().run();
                                }
                              }
                              setFontFamilyDropdownOpen(false);
                            }}
                            style={{ fontFamily: font.value || 'inherit' }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                              (currentFontFamilyRaw === font.value || (!currentFontFamilyRaw && !font.value))
                                ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold'
                                : dropdownItemHover
                            }`}
                          >
                            {font.name}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Font Size Selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setFontSizeDropdownOpen(!fontSizeDropdownOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSepia ? 'bg-[#ebe0c8]/80 hover:bg-[#ebdcc5] border-[#d8c8b0] text-[#4a3b2c]' : isLight ? 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 text-slate-800' : 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-200'
                  }`}
                  title="Font Size"
                >
                  <span className="text-[11px] font-mono">{currentFontSize}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>

                <AnimatePresence>
                  {fontSizeDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setFontSizeDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className={`absolute left-0 top-full mt-1.5 w-24 max-h-48 overflow-y-auto rounded-xl border p-1 z-[100] no-scrollbar ${dropdownBg}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (editor) editor.chain().focus().unsetFontSize().run();
                            setFontSizeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1 text-[11px] opacity-70 rounded cursor-pointer ${dropdownItemHover}`}
                        >
                          Default
                        </button>
                        {FONT_SIZES.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              if (editor) editor.chain().focus().setFontSize(size).run();
                              setFontSizeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1 text-xs rounded cursor-pointer ${
                              currentFontSize === size ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 font-bold' : dropdownItemHover
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-3.5 bg-zinc-700 my-auto shrink-0" />

              {/* Inline Formatting */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleBold().run() : onApplyFormat?.('bold')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('bold') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleItalic().run() : onApplyFormat?.('italic')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('italic') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleUnderline().run() : onApplyFormat?.('underline')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('underline') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleStrike().run() : onApplyFormat?.('strikethrough')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('strike') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleCode().run() : onApplyFormat?.('code')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('code') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Code Snippet"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run() : onApplyFormat?.('highlight')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('highlight') ? 'bg-amber-500 text-white font-bold' : btnHover
                  }`}
                  title="Highlight Text"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>

                {/* Subscript & Superscript */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSubscript().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('subscript') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Subscript"
                >
                  <SubscriptIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('superscript') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Superscript"
                >
                  <SuperscriptIcon className="w-3.5 h-3.5" />
                </button>

                {/* Text Color Picker */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                    className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-0.5 ${btnHover}`}
                    title="Text Color"
                  >
                    <Palette className="w-3.5 h-3.5" style={{ color: currentColor !== '#ffffff' && currentColor !== '#000000' ? currentColor : undefined }} />
                  </button>

                  <AnimatePresence>
                    {colorDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setColorDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className={`absolute left-0 top-full mt-1.5 w-36 rounded-xl border p-2 z-[100] ${dropdownBg}`}
                        >
                          <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider">Color Palette</p>
                          <div className="grid grid-cols-5 gap-1.5 mb-2">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  if (editor) editor.chain().focus().setColor(c).run();
                                  setColorDropdownOpen(false);
                                }}
                                className="w-5 h-5 rounded-full border border-zinc-500/40 hover:scale-110 transition-transform cursor-pointer"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (editor) editor.chain().focus().unsetColor().run();
                              setColorDropdownOpen(false);
                            }}
                            className={`w-full text-center py-1 text-[10px] opacity-70 rounded ${dropdownItemHover}`}
                          >
                            Reset Color
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className={`w-px h-3.5 my-auto shrink-0 ${dividerBg}`} />

              {/* Alignment */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive({ textAlign: 'left' }) ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive({ textAlign: 'center' }) ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive({ textAlign: 'right' }) ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive({ textAlign: 'justify' }) ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Align Justify"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`w-px h-3.5 my-auto shrink-0 ${dividerBg}`} />

              {/* Lists & Blocks */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleBulletList().run() : onApplyFormat?.('bullet-list')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('bulletList') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleOrderedList().run() : onApplyFormat?.('numbered-list')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('orderedList') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleTaskList().run() : onApplyFormat?.('checklist')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('taskList') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Task Checklist"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor ? editor.chain().focus().toggleBlockquote().run() : onApplyFormat?.('quote')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('blockquote') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Block Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editor) {
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    } else if (onApplyFormat) {
                      onApplyFormat('table');
                    }
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${btnHover}`}
                  title="Insert Table"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editor) {
                      editor.chain().focus().setHorizontalRule().run();
                    } else if (onApplyFormat) {
                      onApplyFormat('divider');
                    }
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${btnHover}`}
                  title="Horizontal Divider"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editor) {
                      const previousUrl = editor.getAttributes('link').href;
                      const url = window.prompt('Enter URL link:', previousUrl);
                      if (url === null) return;
                      if (url === '') {
                        editor.chain().focus().extendMarkRange('link').unsetLink().run();
                        return;
                      }
                      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    } else if (onApplyFormat) {
                      onApplyFormat('link');
                    }
                  }}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor?.isActive('link') ? 'bg-teal-500 text-white font-bold' : btnHover
                  }`}
                  title="Insert Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                {/* Image Upload / Insertion Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setImageDropdownOpen(!imageDropdownOpen)}
                    className={`p-1 rounded cursor-pointer transition-colors flex items-center gap-0.5 ${
                      isImageActive ? 'bg-teal-500 text-white font-bold' : btnHover
                    }`}
                    title="Insert Image (Upload File or URL)"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>

                  <AnimatePresence>
                    {imageDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setImageDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className={`absolute left-0 top-full mt-1.5 w-48 rounded-xl border p-1.5 z-[100] flex flex-col gap-1 ${dropdownBg}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setImageDropdownOpen(false);
                              fileInputRef.current?.click();
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer ${dropdownItemHover}`}
                          >
                            <Upload className="w-3.5 h-3.5 text-teal-500" />
                            <span>Upload Image File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageDropdownOpen(false);
                              if (editor) {
                                const url = window.prompt('Enter Image Web URL:');
                                if (url) {
                                  editor.chain().focus().setImage({ src: url }).run();
                                }
                              } else if (onApplyFormat) {
                                onApplyFormat('image');
                              }
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer ${dropdownItemHover}`}
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Insert Image URL</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Emoji Picker Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setEmojiDropdownOpen(!emojiDropdownOpen)}
                    className={`p-1 rounded cursor-pointer transition-colors flex items-center gap-0.5 ${btnHover}`}
                    title="Insert Emoji (Search & Click)"
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>

                  <AnimatePresence>
                    {emojiDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setEmojiDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          className={`absolute left-0 top-full mt-1.5 w-64 rounded-xl border p-2 z-[100] shadow-2xl ${dropdownBg}`}
                        >
                          <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                            <input
                              type="text"
                              value={emojiSearch}
                              onChange={(e) => setEmojiSearch(e.target.value)}
                              placeholder="Search emoji (or type : in editor)..."
                              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-zinc-800/40 dark:bg-zinc-800/50 border border-zinc-700/60 focus:outline-none focus:border-teal-500 text-zinc-100 placeholder:text-zinc-500"
                              autoFocus
                            />
                          </div>
                          <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto no-scrollbar p-0.5">
                            {searchEmojis(emojiSearch).map((item, idx) => (
                              <button
                                key={item.shortcode + idx}
                                type="button"
                                onClick={() => {
                                  if (editor) {
                                    editor.chain().focus().insertContent(item.emoji).run();
                                  } else if (onApplyFormat) {
                                    onApplyFormat('emoji', item.emoji);
                                  }
                                  setEmojiDropdownOpen(false);
                                  setEmojiSearch('');
                                }}
                                className="w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-teal-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                title={`${item.name} (:${item.shortcode}:)`}
                              >
                                {item.emoji}
                              </button>
                            ))}
                          </div>
                          <div className="mt-1.5 pt-1 border-t border-zinc-700/40 text-[10px] opacity-70 text-center">
                            Tip: Type <code className="bg-teal-500/20 text-teal-400 px-1 rounded font-mono">:keyword</code> inside document
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editor) {
                      editor.chain().focus().unsetAllMarks().clearNodes().run();
                    } else if (onApplyFormat) {
                      onApplyFormat('clear');
                    }
                  }}
                  className="p-1 rounded hover:bg-rose-900/50 text-rose-400 transition-colors cursor-pointer"
                  title="Clear Formatting"
                >
                  <RemoveFormatting className="w-3.5 h-3.5" />
                </button>

                {/* Clean Dictation Toggle Icon Button */}
                {onToggleDictation && (
                  <button
                    type="button"
                    onClick={onToggleDictation}
                    className={`p-1 rounded cursor-pointer transition-colors relative ${
                      dictationState === 'listening'
                        ? 'bg-rose-500 text-white font-bold'
                        : dictationState === 'paused'
                        ? 'bg-amber-500 text-white font-bold'
                        : btnHover
                    }`}
                    title={
                      dictationState === 'listening'
                        ? 'Stop Voice Dictation'
                        : dictationState === 'paused'
                        ? 'Resume Voice Dictation'
                        : 'Voice Dictation'
                    }
                  >
                    <Mic className={`w-3.5 h-3.5 ${dictationState === 'listening' ? 'text-white animate-pulse' : 'text-rose-500 dark:text-rose-400'}`} />
                  </button>
                )}
              </div>
            </>
          )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
