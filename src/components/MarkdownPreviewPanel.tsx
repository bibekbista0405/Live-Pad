import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import {
  FileText,
  Copy,
  Check,
  Code,
  Eye,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { htmlToMarkdown } from '../utils/htmlToMarkdown';

interface MarkdownPreviewPanelProps {
  content: string;
  onClose?: () => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  theme?: 'light' | 'dark' | 'sepia' | 'system';
}

export default function MarkdownPreviewPanel({
  content,
  onClose,
  onAddToast,
  isExpanded = false,
  onToggleExpand,
  theme = 'system',
}: MarkdownPreviewPanelProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');

  // Convert HTML or keep raw text as Markdown
  const markdownText = useMemo(() => {
    return htmlToMarkdown(content);
  }, [content]);

  const handleCopyMd = async () => {
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopiedMd(true);
      if (onAddToast) onAddToast('success', 'Copied Markdown to clipboard!');
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      if (onAddToast) onAddToast('error', 'Failed to copy to clipboard.');
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedHtml(true);
      if (onAddToast) onAddToast('success', 'Copied HTML source to clipboard!');
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      if (onAddToast) onAddToast('error', 'Failed to copy to clipboard.');
    }
  };

  const wordCount = useMemo(() => {
    if (!markdownText) return 0;
    return markdownText.trim().split(/\s+/).filter(Boolean).length;
  }, [markdownText]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col h-full bg-white dark:bg-zinc-950 sepia:bg-[#f5ebd5] border border-slate-200/80 dark:border-zinc-800/80 sepia:border-[#dfd3b6] rounded-2xl shadow-xl overflow-hidden transition-colors ${
        isExpanded ? 'fixed inset-4 z-50 rounded-2xl' : 'relative w-full'
      }`}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-zinc-900/80 sepia:bg-[#ecdcb9]/60 border-b border-slate-200 dark:border-zinc-800/80 sepia:border-[#dfd3b6] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 dark:bg-cyan-400/10 sepia:bg-amber-800/10 text-cyan-600 dark:text-cyan-400 sepia:text-amber-900 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 sepia:text-[#433422]">
                Live Markdown Preview
              </h3>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-cyan-500/10 dark:bg-cyan-400/10 sepia:bg-amber-800/10 text-cyan-600 dark:text-cyan-400 sepia:text-amber-900 border border-cyan-500/20 dark:border-cyan-400/20 sepia:border-amber-800/20">
                GFM Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 sepia:text-[#7d6851] font-medium">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} · Real-time synced
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Toggle View Mode (Rendered vs Source) */}
          <div className="flex items-center bg-slate-200/60 dark:bg-zinc-800/60 sepia:bg-[#dfd3b6]/60 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700/50 sepia:border-[#dfd3b6]">
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'rendered'
                  ? 'bg-white dark:bg-zinc-900 sepia:bg-[#f5ebd5] text-cyan-600 dark:text-cyan-400 sepia:text-amber-900 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 sepia:text-[#7d6851] hover:text-slate-700 dark:hover:text-zinc-200 sepia:hover:text-[#433422]'
              }`}
              title="Parsed Markdown Preview"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'source'
                  ? 'bg-white dark:bg-zinc-900 sepia:bg-[#f5ebd5] text-cyan-600 dark:text-cyan-400 sepia:text-amber-900 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 sepia:text-[#7d6851] hover:text-slate-700 dark:hover:text-zinc-200 sepia:hover:text-[#433422]'
              }`}
              title="Raw Markdown Source"
            >
              <Code className="w-3 h-3" />
              <span>Source</span>
            </button>
          </div>

          {/* Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMd}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 sepia:text-[#7d6851] sepia:hover:text-[#433422] bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 sepia:bg-[#ebdcc0] sepia:hover:bg-[#dfd3b6] rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
            title="Copy Raw Markdown"
          >
            {copiedMd ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Copy MD</span>
          </button>

          {/* Toggle Fullscreen / Expand */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 sepia:text-[#7d6851] sepia:hover:text-[#433422] bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 sepia:bg-[#ebdcc0] sepia:hover:bg-[#dfd3b6] rounded-lg transition-colors cursor-pointer"
              title={isExpanded ? 'Minimize Preview' : 'Expand Preview'}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Close Panel */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 sepia:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer"
              title="Close Split Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-slate-800 dark:text-zinc-200 sepia:text-[#433422] select-text font-sans leading-relaxed custom-scrollbar">
        {!markdownText ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-zinc-500 sepia:text-[#7d6851] p-8 space-y-3">
            <Sparkles className="w-8 h-8 text-cyan-500/50 dark:text-cyan-400/50 sepia:text-amber-700/50 animate-pulse" />
            <p className="text-xs font-medium">
              Start typing in the notepad to render live Markdown formatting here!
            </p>
          </div>
        ) : viewMode === 'source' ? (
          <pre className="p-4 bg-slate-900 text-slate-100 dark:bg-zinc-900 dark:text-zinc-200 sepia:bg-[#32271a] sepia:text-[#f3e5c8] rounded-xl text-xs font-mono whitespace-pre-wrap break-words border border-slate-800 dark:border-zinc-800 sepia:border-[#4d3d2a] overflow-x-auto leading-relaxed">
            {markdownText}
          </pre>
        ) : (
          <div className="markdown-body space-y-4 text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sepia:text-[#2d2215] pb-2 border-b border-slate-200 dark:border-zinc-800 sepia:border-[#dfd3b6] mt-4 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-zinc-100 sepia:text-[#382b1b] pb-1.5 border-b border-slate-150 dark:border-zinc-850 sepia:border-[#dfd3b6] mt-4 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 sepia:text-[#433422] mt-3 mb-1.5">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-slate-700 dark:text-zinc-300 sepia:text-[#52412d] leading-relaxed mb-3">
                    {children}
                  </p>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-cyan-500 sepia:border-amber-700 pl-4 py-1.5 my-3 bg-cyan-500/5 dark:bg-cyan-500/10 sepia:bg-amber-700/10 italic rounded-r-lg text-slate-700 dark:text-zinc-300 sepia:text-[#52412d]">
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1.5 my-3 pl-2 text-slate-700 dark:text-zinc-300 sepia:text-[#52412d]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1.5 my-3 pl-2 text-slate-700 dark:text-zinc-300 sepia:text-[#52412d]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-normal">{children}</li>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <div className="my-3 rounded-xl overflow-hidden border border-slate-800 dark:border-zinc-800 sepia:border-[#4d3d2a] bg-slate-950 dark:bg-zinc-950 sepia:bg-[#281f15] text-slate-100 dark:text-zinc-200 sepia:text-[#f4ebd0] font-mono text-xs">
                      <div className="px-3 py-1.5 bg-slate-900 dark:bg-zinc-900 sepia:bg-[#362a1c] text-slate-400 dark:text-zinc-400 sepia:text-[#c4b397] font-mono text-[10px] flex justify-between items-center border-b border-slate-800 dark:border-zinc-800 sepia:border-[#4d3d2a]">
                        <span>{match[1].toUpperCase()}</span>
                      </div>
                      <pre className="p-3.5 overflow-x-auto whitespace-pre leading-relaxed">
                        <code>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-850 sepia:bg-[#ebdcc0] text-cyan-600 dark:text-cyan-400 sepia:text-amber-900 text-xs font-mono font-medium border border-slate-200 dark:border-zinc-800 sepia:border-[#dfd3b6]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-zinc-800 sepia:border-[#dfd3b6]">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 sepia:divide-[#dfd3b6] text-xs">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-100 dark:bg-zinc-900 sepia:bg-[#ebdcc0] text-slate-700 dark:text-zinc-300 sepia:text-[#433422] font-bold">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-bold">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 border-t border-slate-100 dark:border-zinc-850 sepia:border-[#e2d2b4]">
                    {children}
                  </td>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 sepia:text-amber-800 font-medium underline underline-offset-2 hover:text-cyan-500 sepia:hover:text-amber-700 transition-colors"
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="rounded-xl my-3 max-w-full shadow-md border border-slate-200 dark:border-zinc-800 sepia:border-[#dfd3b6]"
                    referrerPolicy="no-referrer"
                  />
                ),
              }}
            >
              {markdownText}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
