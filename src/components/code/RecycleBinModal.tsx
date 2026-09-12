import React from 'react';
import { Trash2, RotateCcw, X, Folder, FileCode, AlertTriangle } from 'lucide-react';
import { TrashedItem } from '../../types/code';
import FileIcon from './FileIcon';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashedItem[];
  onRestore: (item: TrashedItem) => void;
  onDeletePermanent: (trashId: string) => void;
  onEmptyTrash: () => void;
}

export default function RecycleBinModal({
  isOpen,
  onClose,
  trashItems,
  onRestore,
  onDeletePermanent,
  onEmptyTrash
}: RecycleBinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="livepad-code-modal-backdrop">
      <div className="livepad-code-modal livepad-recycle-bin">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Project Recycle Bin / Trash</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Recover accidentally deleted files or empty the trash permanently.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashItems.length > 0 && (
              <button
                type="button"
                onClick={onEmptyTrash}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                Empty Trash
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trash List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {trashItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Trash2 className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
              <p className="text-xs font-mono text-slate-500">Recycle bin is clean and empty.</p>
            </div>
          ) : (
            trashItems.map((item) => {
              const name = item.originalItem.name;
              const isFolder = item.itemType === 'folder';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isFolder ? (
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <FileIcon name={name} extension={(item.originalItem as any).extension} className="w-4 h-4" />
                    )}

                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-white truncate">{name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Deleted {new Date(item.deletedAt).toLocaleTimeString()} by {item.deletedBy}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                      title="Restore Item"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeletePermanent(item.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
