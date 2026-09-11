import React, { useEffect, useRef } from 'react';
import {
  FilePlus,
  FolderPlus,
  Edit2,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Download,
  FolderInput,
  FolderOutput,
  Eye,
  ChevronDown,
  ChevronRight,
  Upload,
  Archive
} from 'lucide-react';
import { ContextMenuState } from '../../types/code';

interface FileContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
  onNewFile: (targetFolderId?: string | null) => void;
  onNewFolder: (targetFolderId?: string | null) => void;
  onRename: (id: string, type: 'file' | 'folder') => void;
  onDuplicate: (id: string, type: 'file' | 'folder') => void;
  onCopy: (ids: string[]) => void;
  onCut: (ids: string[]) => void;
  onPaste: (targetFolderId?: string | null) => void;
  hasClipboardItems: boolean;
  onDelete: (ids: string[], type: 'file' | 'folder') => void;
  onDownload: (id: string, type: 'file' | 'folder') => void;
  onReveal?: (id: string) => void;
  onToggleExpand?: (folderId: string) => void;
  onUploadFiles?: (targetFolderId?: string | null) => void;
  onUploadFolder?: (targetFolderId?: string | null) => void;
  onDownloadProjectZip?: () => void;
  selectedIds: string[];
}

export default function FileContextMenu({
  state,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDuplicate,
  onCopy,
  onCut,
  onPaste,
  hasClipboardItems,
  onDelete,
  onDownload,
  onReveal,
  onToggleExpand,
  onUploadFiles,
  onUploadFolder,
  onDownloadProjectZip,
  selectedIds
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!state) return null;

  const targetId = state.targetId;
  const targetType = state.targetType;
  const isMulti = selectedIds.length > 1 && selectedIds.includes(targetId || '');
  const activeIds = isMulti ? selectedIds : targetId ? [targetId] : [];

  // Adjust x and y to keep inside window viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = 220;
  const menuHeight = 320;

  const adjustedX = Math.min(state.x, viewportWidth - menuWidth - 10);
  const adjustedY = Math.min(state.y, viewportHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-[999] w-56 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {targetType === 'file' && (
        <>
          <button
            type="button"
            onClick={() => {
              if (targetId) onReveal?.(targetId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open / Focus File</span>
          </button>

          {!isMulti && (
            <button
              type="button"
              onClick={() => {
                if (targetId) onRename(targetId, 'file');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Rename (F2)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (targetId) onDuplicate(targetId, 'file');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Duplicate (Ctrl+D)</span>
          </button>

          <div className="h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              onCopy(activeIds);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy (Ctrl+C)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCut(activeIds);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            <span>Cut (Ctrl+X)</span>
          </button>

          <div className="h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              if (targetId) onDownload(targetId, 'file');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (targetId) onReveal?.(targetId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <FolderInput className="w-3.5 h-3.5 text-sky-400" />
            <span>Reveal in Explorer</span>
          </button>

          <div className="h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              onDelete(activeIds, 'file');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 text-left font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete (Del)</span>
          </button>
        </>
      )}

      {targetType === 'folder' && (
        <>
          <button
            type="button"
            onClick={() => {
              onNewFile(targetId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNewFolder(targetId);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder</span>
          </button>

          {hasClipboardItems && (
            <button
              type="button"
              onClick={() => {
                onPaste(targetId);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paste Here</span>
            </button>
          )}

          <div className="h-px bg-slate-800 my-1" />

          {!isMulti && (
            <button
              type="button"
              onClick={() => {
                if (targetId) onRename(targetId, 'folder');
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Rename</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (targetId) onDuplicate(targetId, 'folder');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Duplicate Folder</span>
          </button>

          {targetId && (
            <button
              type="button"
              onClick={() => {
                onToggleExpand?.(targetId);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Expand / Collapse</span>
            </button>
          )}

          <div className="h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              if (targetId) onDownload(targetId, 'folder');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Folder ZIP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(activeIds, 'folder');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 text-left font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Folder</span>
          </button>
        </>
      )}

      {targetType === 'root' && (
        <>
          <button
            type="button"
            onClick={() => {
              onNewFile(null);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNewFolder(null);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder</span>
          </button>

          {hasClipboardItems && (
            <button
              type="button"
              onClick={() => {
                onPaste(null);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paste</span>
            </button>
          )}

          <div className="h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              onUploadFiles?.(null);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Files</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onUploadFolder?.(null);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <FolderOutput className="w-3.5 h-3.5 text-sky-400" />
            <span>Upload Folder</span>
          </button>

          <div className="h-px bg-slate-800 my-1" />

          <button
            type="button"
            onClick={() => {
              onDownloadProjectZip?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left font-medium text-slate-200 cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Project ZIP</span>
          </button>
        </>
      )}
    </div>
  );
}
