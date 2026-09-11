import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListTree, X, Heading1, Heading2, Heading3, ArrowRight } from 'lucide-react';

export interface OutlineHeading {
  id: string;
  level: number;
  text: string;
  lineNumber: number;
  index: number;
}

interface DocumentOutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onJumpToHeading: (lineNumber: number) => void;
}

export function extractHeadings(content: string): OutlineHeading[] {
  if (!content) return [];
  const headings: OutlineHeading[] = [];

  // Parse HTML h1, h2, h3 tags first if HTML content
  const htmlRegex = /<(h[1-3])(?:\s+[^>]*)?>(.*?)<\/\1>/gi;
  let match;
  let index = 0;
  while ((match = htmlRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
    headings.push({
      id: `h-${index}`,
      level,
      text: text || 'Untitled Heading',
      lineNumber: index + 1,
      index
    });
    index++;
  }

  if (headings.length > 0) return headings;

  // Fallback to markdown line headings
  const lines = content.split('\n');
  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      headings.push({
        id: `h1-${lineIdx}`,
        level: 1,
        text: trimmed.replace(/^#\s+/, ''),
        lineNumber: lineIdx + 1,
        index: lineIdx
      });
    } else if (trimmed.startsWith('## ')) {
      headings.push({
        id: `h2-${lineIdx}`,
        level: 2,
        text: trimmed.replace(/^##\s+/, ''),
        lineNumber: lineIdx + 1,
        index: lineIdx
      });
    } else if (trimmed.startsWith('### ')) {
      headings.push({
        id: `h3-${lineIdx}`,
        level: 3,
        text: trimmed.replace(/^###\s+/, ''),
        lineNumber: lineIdx + 1,
        index: lineIdx
      });
    }
  });

  return headings;
}

export default function DocumentOutlineModal({
  isOpen,
  onClose,
  content,
  onJumpToHeading
}: DocumentOutlineModalProps) {
  if (!isOpen) return null;

  const headings = extractHeadings(content);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm h-[85vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 px-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-[#0ea5e9]">
                <ListTree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">Document Outline</h3>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                  {headings.length} {headings.length === 1 ? 'heading' : 'headings'} detected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Headings */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {headings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 space-y-2">
                <ListTree className="w-8 h-8 stroke-1 text-slate-300 dark:text-zinc-700" />
                <p className="text-xs font-semibold">No headings found in document.</p>
                <p className="text-[10px]">Use Headings dropdown or slash commands to structure your document.</p>
              </div>
            ) : (
              headings.map((heading) => (
                <button
                  key={heading.id}
                  type="button"
                  onClick={() => {
                    onJumpToHeading(heading.lineNumber);
                    onClose();
                  }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between group hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15 transition-all cursor-pointer ${
                    heading.level === 1
                      ? 'pl-3 font-black text-xs text-slate-800 dark:text-zinc-100'
                      : heading.level === 2
                      ? 'pl-6 font-bold text-xs text-slate-700 dark:text-zinc-200'
                      : 'pl-9 font-medium text-[11px] text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {heading.level === 1 && <Heading1 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                    {heading.level === 2 && <Heading2 className="w-3.5 h-3.5 text-cyan-500/80 shrink-0" />}
                    {heading.level === 3 && <Heading3 className="w-3.5 h-3.5 text-cyan-500/60 shrink-0" />}
                    <span className="truncate">{heading.text || 'Untitled Heading'}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-[#0ea5e9]">
                    <span>Item {heading.lineNumber}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
