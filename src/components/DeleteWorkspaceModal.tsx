import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  roomCode: string;
  onConfirmDelete: () => Promise<void>;
}

export default function DeleteWorkspaceModal({
  isOpen,
  onClose,
  workspaceName,
  roomCode,
  onConfirmDelete,
}: DeleteWorkspaceModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim() === workspaceName.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await onConfirmDelete();
      setConfirmationInput('');
      onClose();
    } catch (err: any) {
      console.error('Failed to delete workspace:', err);
      setErrorMsg(err?.message || 'Failed to delete workspace. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-900 dark:text-zinc-100"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/30">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Delete Workspace</span>
                <span className="font-mono text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md uppercase border border-rose-500/20">
                  #{roomCode}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                This operation is permanent and cannot be undone.
              </p>
            </div>
          </div>

          {/* Alert Callout */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl mb-4">
            <div className="flex items-start gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>The following workspace data will be permanently deleted:</span>
            </div>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-rose-600 dark:text-rose-300/80 font-medium pl-6 list-disc">
              <li>Documents</li>
              <li>Code files</li>
              <li>Chat history</li>
              <li>Comments</li>
              <li>Attachments</li>
              <li>Version history</li>
              <li>Member list</li>
              <li>Workspace settings</li>
            </ul>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 mb-4">
              {errorMsg}
            </div>
          )}

          {/* Confirmation Form */}
          <form onSubmit={handleDelete} className="space-y-4">
            <div>
              <label htmlFor="confirm-workspace-name-input" className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                To confirm deletion, type <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">"{workspaceName}"</span> below:
              </label>
              <input
                id="confirm-workspace-name-input"
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={workspaceName}
                disabled={isDeleting}
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 focus:border-rose-500 dark:focus:border-rose-500 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden transition-all shadow-inner"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isConfirmed || isDeleting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isConfirmed && !isDeleting
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                }`}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
