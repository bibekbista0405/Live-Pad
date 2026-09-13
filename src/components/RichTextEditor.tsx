import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Link } from '@tiptap/extension-link';
import { ResizableImageExtension } from './ResizableImageNode';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize, ensureHtmlContent } from '../lib/tiptapExtensions';
import { MentionHighlightExtension } from '../lib/tiptapMentionHighlight';
import { searchEmojis, EmojiItem } from '../lib/emojiData';
import { motion, AnimatePresence } from 'motion/react';
import { UserPresence } from '../types';
import { playMentionChime, isUserMentioned } from '../utils/soundAlert';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Highlighter,
  Link as LinkIcon,
  Trash2,
  Plus,
  Sparkles,
  Code,
  Strikethrough,
  Upload,
  AtSign,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  isReadOnly?: boolean;
  placeholder?: string;
  editorSize?: number;
  fontClass?: string;
  pageWidth?: 'narrow' | 'medium' | 'full';
  onEditorReady?: (editor: Editor) => void;
  onSelectionChange?: (selectedText: string) => void;
  activeUsers?: UserPresence[];
  currentUid?: string;
  userName?: string;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

function normalizeHtmlForComparison(html: string): string {
  if (!html) return '';
  return html
    .replace(/<p><\/p>/gi, '')
    .replace(/<p><br\s*\/?>\s*<\/p>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TIPTAP_EXTENSIONS = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    // StarterKit in Tiptap 3 already bundles these extensions. Disable its copies
    // because LivePad configures them explicitly below.
    link: false,
    underline: false,
  }),
  Underline,
  Highlight.configure({
    multicolor: true,
  }),
  TextStyle,
  Color,
  FontSize,
  FontFamily,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  ResizableImageExtension.configure({
    allowBase64: true,
  }),
  Subscript,
  Superscript,
  MentionHighlightExtension,
];

function RichTextEditorComponent({
  content,
  onChange,
  isReadOnly = false,
  placeholder = 'Write something amazing together...',
  editorSize = 16,
  fontClass = 'font-sans',
  pageWidth = 'medium',
  onEditorReady,
  onSelectionChange,
  activeUsers = [],
  currentUid,
  userName,
  onAddToast,
}: RichTextEditorProps) {
  const isUpdatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [emojiSuggestion, setEmojiSuggestion] = useState<{
    query: string;
    fromPos: number;
    toPos: number;
    position: { top: number; left: number };
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [matchedEmojis, setMatchedEmojis] = useState<EmojiItem[]>([]);

  const emojiSuggestionRef = useRef(emojiSuggestion);
  emojiSuggestionRef.current = emojiSuggestion;
  const matchedEmojisRef = useRef(matchedEmojis);
  matchedEmojisRef.current = matchedEmojis;
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // Mention suggestion state
  const [mentionSuggestion, setMentionSuggestion] = useState<{
    query: string;
    fromPos: number;
    toPos: number;
    position: { top: number; left: number };
  } | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [matchedUsers, setMatchedUsers] = useState<
    Array<{ uid: string; name: string; tag: string; isGroup?: boolean }>
  >([]);

  const mentionSuggestionRef = useRef(mentionSuggestion);
  mentionSuggestionRef.current = mentionSuggestion;
  const matchedUsersRef = useRef(matchedUsers);
  matchedUsersRef.current = matchedUsers;
  const selectedMentionIndexRef = useRef(selectedMentionIndex);
  selectedMentionIndexRef.current = selectedMentionIndex;

  const notifiedMentionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!content || !currentUid || !userName) return;
    if (isUserMentioned(content, currentUid, userName)) {
      const matches = content.match(/@[a-zA-Z0-9_ -]{1,30}/g);
      if (matches) {
        matches.forEach((m) => {
          const cleanTag = m.trim();
          const cleanUser = userName.toLowerCase().replace(/\s+/g, '');
          const cleanTagLower = cleanTag.toLowerCase();
          if (
            (cleanTagLower.includes(cleanUser) ||
              cleanTagLower === '@all' ||
              cleanTagLower === '@here') &&
            !notifiedMentionsRef.current.has(cleanTagLower)
          ) {
            notifiedMentionsRef.current.add(cleanTagLower);
            playMentionChime();
            if (onAddToast) {
              onAddToast('info', `🔔 You were tagged in document: ${cleanTag}`);
            }
          }
        });
      }
    }
  }, [content, currentUid, userName, onAddToast]);

  const checkMentionTrigger = (ed: Editor) => {
    if (!ed || isReadOnly) {
      setMentionSuggestion(null);
      return;
    }

    const { selection } = ed.state;
    if (!selection.empty) {
      setMentionSuggestion(null);
      return;
    }

    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, ' ');
    const match = textBefore.match(/@([a-zA-Z0-9_ -]{0,20})$/);

    if (match) {
      const query = match[1];
      const triggerLength = match[0].length;
      const fromPos = $from.pos - triggerLength;
      const toPos = $from.pos;

      const q = query.toLowerCase();
      const options: Array<{ uid: string; name: string; tag: string; isGroup?: boolean }> = [
        { uid: 'all', name: 'all (Notify workspace)', tag: 'all', isGroup: true },
        { uid: 'here', name: 'here (Notify online peers)', tag: 'here', isGroup: true },
      ];

      (activeUsers || []).forEach((u) => {
        if (u.uid !== currentUid && u.name) {
          options.push({
            uid: u.uid,
            name: u.name,
            tag: u.name.replace(/\s+/g, ''),
          });
        }
      });

      const filtered = options.filter(
        (opt) => opt.name.toLowerCase().includes(q) || opt.tag.toLowerCase().includes(q)
      );

      if (filtered.length > 0) {
        try {
          const coords = ed.view.coordsAtPos($from.pos);
          let top = coords.bottom + 6;
          let left = coords.left;

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            top = coords.bottom - rect.top + 6;
            left = Math.min(Math.max(coords.left - rect.left, 10), Math.max(rect.width - 270, 10));
          }

          setMentionSuggestion({
            query,
            fromPos,
            toPos,
            position: { top, left },
          });
          setMatchedUsers(filtered);
          setSelectedMentionIndex(0);
          return;
        } catch {
          // ignore coords issue
        }
      }
    }

    setMentionSuggestion(null);
  };

  const insertMentionAtCursor = (tag: string, fromPos: number, toPos: number) => {
    if (!editor) return;
    const mentionText = `@${tag} `;
    editor
      .chain()
      .focus()
      .deleteRange({ from: fromPos, to: toPos })
      .insertContent(mentionText)
      .run();
    setMentionSuggestion(null);

    if (onAddToast) {
      onAddToast('info', `Tagged @${tag} in document`);
    }
  };

  const checkEmojiTrigger = (ed: Editor) => {
    if (!ed || isReadOnly) {
      setEmojiSuggestion(null);
      return;
    }

    const { selection } = ed.state;
    if (!selection.empty) {
      setEmojiSuggestion(null);
      return;
    }

    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, ' ');
    const match = textBefore.match(/:([a-zA-Z0-9_+-]{0,20})$/);

    if (match) {
      const query = match[1];
      const triggerLength = match[0].length;
      const fromPos = $from.pos - triggerLength;
      const toPos = $from.pos;

      const results = searchEmojis(query);
      if (results.length > 0) {
        try {
          const coords = ed.view.coordsAtPos($from.pos);
          let top = coords.bottom + 6;
          let left = coords.left;

          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            top = coords.bottom - rect.top + 6;
            left = Math.min(Math.max(coords.left - rect.left, 10), Math.max(rect.width - 270, 10));
          }

          setEmojiSuggestion({
            query,
            fromPos,
            toPos,
            position: { top, left },
          });
          setMatchedEmojis(results);
          setSelectedIndex(0);
          return;
        } catch {
          // ignore coords issue
        }
      }
    }

    setEmojiSuggestion(null);
  };

  const insertEmojiAtCursor = (emojiChar: string, fromPos: number, toPos: number) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: fromPos, to: toPos })
      .insertContent(emojiChar)
      .run();
    setEmojiSuggestion(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    const files = Array.from(e.dataTransfer?.files || []) as File[];
    const imageFiles = files.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          if (base64Url && editor) {
            editor.chain().focus().setImage({ src: base64Url }).run();
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setIsDraggingOver(false);
    }
  };

  const initialHtml = ensureHtmlContent(content);

  const editor = useEditor({
    editable: !isReadOnly,
    content: initialHtml,
    extensions: TIPTAP_EXTENSIONS,
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[450px] p-3 leading-relaxed text-slate-800 dark:text-zinc-100 ${fontClass}`,
        style: `font-size: ${editorSize}px`,
        spellcheck: 'true',
      },
      handleKeyDown: (_view, event) => {
        if (mentionSuggestionRef.current && matchedUsersRef.current.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedMentionIndex((prev) => (prev + 1) % matchedUsersRef.current.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedMentionIndex((prev) => (prev - 1 + matchedUsersRef.current.length) % matchedUsersRef.current.length);
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            const currSuggestion = mentionSuggestionRef.current;
            const currList = matchedUsersRef.current;
            const currIdx = selectedMentionIndexRef.current;
            if (currSuggestion && currList[currIdx]) {
              insertMentionAtCursor(currList[currIdx].tag, currSuggestion.fromPos, currSuggestion.toPos);
            }
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setMentionSuggestion(null);
            return true;
          }
        }

        if (emojiSuggestionRef.current && matchedEmojisRef.current.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % matchedEmojisRef.current.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + matchedEmojisRef.current.length) % matchedEmojisRef.current.length);
            return true;
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            const currSuggestion = emojiSuggestionRef.current;
            const currList = matchedEmojisRef.current;
            const currIdx = selectedIndexRef.current;
            if (currSuggestion && currList[currIdx]) {
              insertEmojiAtCursor(currList[currIdx].emoji, currSuggestion.fromPos, currSuggestion.toPos);
            }
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setEmojiSuggestion(null);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        if (isReadOnly) return false;
        const imageFiles = (Array.from(event.dataTransfer?.files || []) as File[]).filter((file) =>
          file.type.startsWith('image/')
        );
        if (imageFiles.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          setIsDraggingOver(false);
          imageFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64Url = e.target?.result as string;
              if (base64Url && editor) {
                editor.chain().focus().setImage({ src: base64Url }).run();
              }
            };
            reader.readAsDataURL(file);
          });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      const html = editor.getHTML();
      onChange(html);
      checkEmojiTrigger(editor);
      checkMentionTrigger(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setHasSelection(from !== to && text.trim().length > 0);
      if (onSelectionChange) {
        onSelectionChange(text);
      }
      checkEmojiTrigger(editor);
      checkMentionTrigger(editor);
    },
  });

  // Expose editor instance to parent component
  const onEditorReadyRef = useRef(onEditorReady);
  useEffect(() => {
    onEditorReadyRef.current = onEditorReady;
  }, [onEditorReady]);

  useEffect(() => {
    if (editor && onEditorReadyRef.current) {
      onEditorReadyRef.current(editor);
    }
  }, [editor]);

  // Handle external content updates
  useEffect(() => {
    if (!editor) return;

    const formattedTarget = ensureHtmlContent(content);
    const currentHtml = editor.getHTML();

    if (normalizeHtmlForComparison(currentHtml) === normalizeHtmlForComparison(formattedTarget)) {
      return;
    }

    if (editor.isFocused) {
      // Do not rebuild the entire ProseMirror document while the user is typing.
      // Parent state can lag a realtime snapshot by a few milliseconds; replacing
      // the document here causes cursor jumps, lost selections and duplicate input.
      // Remote updates are applied only when the editor is idle/blurred.
      return;
    }

    // Idle / non-focused document update
    isUpdatingRef.current = true;
    editor.commands.setContent(formattedTarget, { emitUpdate: false } as any);
    isUpdatingRef.current = false;
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full flex-1 flex flex-col min-h-0 relative z-10 selection:bg-teal-500/30 rounded-xl transition-all ${
        isDraggingOver ? 'ring-2 ring-teal-500 bg-teal-500/5' : ''
      }`}
    >
      <AnimatePresence>
        {mentionSuggestion && matchedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: `${mentionSuggestion.position.top}px`,
              left: `${mentionSuggestion.position.left}px`,
            }}
            className="z-[99] w-64 max-h-56 overflow-y-auto rounded-xl bg-slate-900/95 dark:bg-zinc-900/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md p-1.5 no-scrollbar text-white select-none"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between border-b border-slate-800 dark:border-zinc-800 mb-1">
              <span className="flex items-center gap-1">
                <AtSign className="w-3 h-3 text-cyan-400" /> Mention User
              </span>
              <span className="text-[9px] text-teal-400 font-normal">↑↓ to navigate, Enter to insert</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {matchedUsers.map((item, idx) => (
                <button
                  key={item.uid + idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMentionAtCursor(item.tag, mentionSuggestion.fromPos, mentionSuggestion.toPos);
                  }}
                  onMouseEnter={() => setSelectedMentionIndex(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    idx === selectedMentionIndex
                      ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-500/30'
                      : 'hover:bg-slate-800/80 dark:hover:bg-zinc-800/80 text-slate-200 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      @
                    </span>
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono ml-1 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded shrink-0">
                    @{item.tag}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {emojiSuggestion && matchedEmojis.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: `${emojiSuggestion.position.top}px`,
              left: `${emojiSuggestion.position.left}px`,
            }}
            className="z-[99] w-64 max-h-56 overflow-y-auto rounded-xl bg-slate-900/95 dark:bg-zinc-900/95 border border-slate-700/80 dark:border-zinc-700/80 shadow-2xl backdrop-blur-md p-1.5 no-scrollbar text-white"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 flex items-center justify-between border-b border-slate-800 dark:border-zinc-800 mb-1">
              <span>Emoji {emojiSuggestion.query ? `matching ":${emojiSuggestion.query}"` : ''}</span>
              <span className="text-[9px] text-teal-400 font-normal">↑↓ to navigate, Enter to insert</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {matchedEmojis.map((item, idx) => (
                <button
                  key={item.shortcode + idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertEmojiAtCursor(item.emoji, emojiSuggestion.fromPos, emojiSuggestion.toPos);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    idx === selectedIndex
                      ? 'bg-teal-500/25 text-teal-200 font-bold border border-teal-500/30'
                      : 'hover:bg-slate-800/80 dark:hover:bg-zinc-800/80 text-slate-200 dark:text-zinc-200'
                  }`}
                >
                  <span className="text-lg leading-none">{item.emoji}</span>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono ml-1">:{item.shortcode}:</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-0 z-50 bg-teal-950/80 dark:bg-zinc-950/85 backdrop-blur-sm rounded-xl border-2 border-dashed border-teal-400 flex flex-col items-center justify-center p-6 text-white pointer-events-none"
          >
            <Upload className="w-10 h-10 text-teal-300 animate-bounce mb-2" />
            <p className="text-base font-bold text-teal-100">Drop image files here to embed</p>
            <p className="text-xs text-teal-300/80 mt-1">Images will be converted to base64 & inserted into document</p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Contextual Selection Bar (Shown only when text/table is actively selected) */}
      <AnimatePresence>
        {editor && !isReadOnly && (hasSelection || editor.isActive('table')) && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="sticky top-1 self-center z-[80] mb-2 px-2 py-1 rounded-xl bg-slate-900/95 dark:bg-zinc-900/95 text-white shadow-xl border border-slate-700/80 dark:border-zinc-700/80 backdrop-blur-md flex items-center gap-1"
          >
            {editor.isActive('table') ? (
              <div className="flex items-center gap-1.5 text-xs px-1 overflow-x-auto max-w-[88vw] sm:max-w-none no-scrollbar py-0.5">
                <span className="text-[10px] font-bold uppercase text-teal-400 mr-1 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" /> Table
                </span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-teal-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  title="Add Column Right"
                >
                  <Plus className="w-3 h-3" /> Col
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  title="Delete Selected Column"
                >
                  -Col
                </button>
                <div className="w-px h-3.5 bg-zinc-700 my-auto shrink-0" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-teal-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  title="Add Row Below"
                >
                  <Plus className="w-3 h-3" /> Row
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  title="Delete Selected Row"
                >
                  -Row
                </button>
                <div className="w-px h-3.5 bg-zinc-700 my-auto shrink-0" />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900/80 active:scale-95 text-rose-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  title="Delete Table"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('bold') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('italic') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('underline') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('strike') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-zinc-700 my-auto mx-0.5" />

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('heading', { level: 1 }) ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Heading 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('heading', { level: 2 }) ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('code') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Code Snippet"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('highlight') ? 'bg-amber-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Highlight"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const previousUrl = editor.getAttributes('link').href;
                    const url = window.prompt('URL:', previousUrl);
                    if (url === null) return;
                    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                  }}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    editor.isActive('link') ? 'bg-teal-500 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="Link"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <EditorContent editor={editor} className="w-full flex-1 min-h-[450px] outline-none" />
    </div>
  );
}

export default RichTextEditorComponent;
