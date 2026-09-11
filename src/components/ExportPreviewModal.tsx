import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, X, Download, FileText, FileCode, Sparkles, Printer, BookOpen } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { ExportService } from '../services/exportService';
import { ensureHtmlContent } from '../lib/tiptapExtensions';
import PrintConfirmationModal from './PrintConfirmationModal';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  editorOrContent: Editor | string | null;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function ExportPreviewModal({
  isOpen,
  onClose,
  title,
  editorOrContent,
  addToast
}: ExportPreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const [showPrintConfirm, setShowPrintConfirm] = useState(false);

  if (!isOpen) return null;

  const htmlContent = typeof editorOrContent === 'string'
    ? ensureHtmlContent(editorOrContent)
    : (editorOrContent && 'getHTML' in editorOrContent ? editorOrContent.getHTML() : '');

  const timestamp = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleDownloadPdf = async () => {
    await ExportService.exportToPdf({
      title,
      content: editorOrContent,
      addToast
    });
  };

  const handleDownloadDocx = async () => {
    await ExportService.exportToDocx({
      title,
      content: editorOrContent,
      addToast
    });
  };

  const handleDownloadTxt = () => {
    ExportService.exportToTxt({
      title,
      content: editorOrContent,
      addToast
    });
  };

  const handleDownloadEpub = async () => {
    await ExportService.exportToEpub({
      title,
      content: editorOrContent,
      addToast
    });
  };

  const handlePrint = () => {
    setShowPrintConfirm(true);
  };

  const executePrint = () => {
    ExportService.printDocument({
      title,
      content: editorOrContent,
      addToast,
      skipConfirmation: true
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <span>Export Document Preview</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-mono border border-indigo-500/30">
                    PDF / A4 Layout
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Isolated document content view with exact print formatting
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Export Preview"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Container Body (Simulated A4 Paper Sheet inside dark viewer background) */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950/80 flex justify-center scrollbar-thin">
            <div 
              ref={previewRef}
              className="w-full max-w-[794px] min-h-[900px] bg-white text-slate-900 p-10 md:p-14 rounded-lg shadow-2xl border border-slate-200 text-left font-sans text-sm leading-relaxed"
              style={{
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Clean Document Export Header */}
              <div className="border-b-2 border-indigo-600 pb-3 mb-6">
                <h1 className="text-2xl font-black text-slate-900 m-0 tracking-tight">
                  {title || 'Untitled Document'}
                </h1>
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium mt-2">
                  <span>LivePad Document Export</span>
                  <span>{timestamp}</span>
                </div>
              </div>

              {/* Rendered Isolated Document HTML Content */}
              <div 
                className="ProseMirror prose max-w-none text-slate-800 font-sans leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-slate-400 italic">No document content to preview.</p>' }}
              />
            </div>
          </div>

          {/* Actions Bar Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Only document text, tables & media will be included in exports.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Text (.txt)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadEpub}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>EPUB (.epub)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDocx}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>Print Document</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <PrintConfirmationModal
        isOpen={showPrintConfirm}
        onClose={() => setShowPrintConfirm(false)}
        onConfirm={executePrint}
        title={title}
      />
    </AnimatePresence>
  );
}
