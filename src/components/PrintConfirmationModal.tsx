import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, AlertCircle, X, FileText } from 'lucide-react';

interface PrintConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export default function PrintConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Document'
}: PrintConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  Confirm Document Print
                </h3>
                <p className="text-xs text-slate-400">
                  Ready to send to print queue
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Print Confirmation"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 text-left">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider font-semibold">
                  Target Document
                </div>
                <div className="text-sm font-extrabold text-white truncate mt-0.5">
                  {title || 'Untitled Document'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-slate-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <p>
                This action will trigger your browser's native print dialog. Are you sure you want to proceed with printing?
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-950/60 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
