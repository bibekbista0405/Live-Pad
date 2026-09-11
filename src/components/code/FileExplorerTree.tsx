import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  Trash2,
  Edit2,
  MoreVertical,
  Check,
  X,
  Upload,
  ShieldAlert,
  WifiOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ProjectFolder, ProjectFile, ContextMenuState } from '../../types/code';
import FileIcon from './FileIcon';

export interface SyncErrorState {
  title: string;
  message: string;
  reason?: string;
  type?: 'permission' | 'connectivity' | 'general';
}

interface FileExplorerTreeProps {
  folders: ProjectFolder[];
  files: ProjectFile[];
  activeFileId: string | null;
  selectedIds: string[];
  onSelectFile: (fileId: string, isMulti?: boolean, isRange?: boolean) => void;
  onSelectFolder: (folderId: string, isMulti?: boolean) => void;
  onToggleFolderExpand: (folderId: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string | null, type: 'file' | 'folder' | 'root') => void;
  onMoveItem: (sourceIds: string[], targetFolderId: string | null) => void;
  onCreateInlineFile: (folderId: string | null, name: string) => void;
  onCreateInlineFolder: (folderId: string | null, name: string) => void;
  onRenameItem: (id: string, type: 'file' | 'folder', newName: string) => void;
  inlineCreatingInFolder: { folderId: string | null; type: 'file' | 'folder' } | null;
  setInlineCreatingInFolder: (val: { folderId: string | null; type: 'file' | 'folder' } | null) => void;
  inlineRenamingItem: { id: string; type: 'file' | 'folder'; currentName: string } | null;
  setInlineRenamingItem: (val: { id: string; type: 'file' | 'folder'; currentName: string } | null) => void;
  onUploadDropFiles?: (files: FileList, targetFolderId: string | null) => void;
  syncError?: SyncErrorState | null;
  onRetrySync?: () => void;
  onDismissSyncError?: () => void;
  onOpenLocalFolder?: () => void;
  isPwaMounted?: boolean;
  pwaPath?: string;
}

export default function FileExplorerTree({
  folders,
  files,
  activeFileId,
  selectedIds,
  onSelectFile,
  onSelectFolder,
  onToggleFolderExpand,
  onContextMenu,
  onMoveItem,
  onCreateInlineFile,
  onCreateInlineFolder,
  onRenameItem,
  inlineCreatingInFolder,
  setInlineCreatingInFolder,
  inlineRenamingItem,
  setInlineRenamingItem,
  onUploadDropFiles,
  syncError,
  onRetrySync,
  onDismissSyncError,
  onOpenLocalFolder,
  isPwaMounted = false,
  pwaPath
}: FileExplorerTreeProps) {
  const safeFolders = Array.isArray(folders) ? folders : [];
  const safeFiles = Array.isArray(files) ? files : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  const [explorerFilter, setExplorerFilter] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null);
  const hoverExpandTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to prevent dropping folder into its own descendant
  const isDescendantFolder = (parentFolderId: string, targetFolderId: string): boolean => {
    let curr: string | null = targetFolderId;
    while (curr) {
      if (curr === parentFolderId) return true;
      const found = safeFolders.find((f) => f && f.id === curr);
      curr = found ? found.parentId : null;
    }
    return false;
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    const idsToMove = safeSelectedIds.includes(id) ? safeSelectedIds : [id];
    setDraggedIds(idsToMove);
    e.dataTransfer.setData('text/plain', JSON.stringify(idsToMove));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);

      // Auto expand collapsed folder on drag hover
      if (folderId) {
        if (hoverExpandTimerRef.current) clearTimeout(hoverExpandTimerRef.current);
        hoverExpandTimerRef.current = setTimeout(() => {
          const f = folders.find((item) => item.id === folderId);
          if (f && !f.isExpanded) {
            onToggleFolderExpand(folderId);
          }
        }, 600);
      }
    }
  };

  const handleDragLeaveFolder = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverExpandTimerRef.current) clearTimeout(hoverExpandTimerRef.current);
    setDragOverFolderId(null);
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverExpandTimerRef.current) clearTimeout(hoverExpandTimerRef.current);
    setDragOverFolderId(null);

    // Check if dragging external OS files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadDropFiles?.(e.dataTransfer.files, targetFolderId);
      return;
    }

    if (draggedIds.length === 0) return;

    // Validate moves
    const validIds = draggedIds.filter((id) => {
      const isFolder = folders.some((f) => f.id === id);
      if (isFolder && targetFolderId) {
        if (id === targetFolderId || isDescendantFolder(id, targetFolderId)) {
          return false;
        }
      }
      return true;
    });

    if (validIds.length > 0) {
      onMoveItem(validIds, targetFolderId);
    }
    setDraggedIds([]);
  };

  const handleInlineCreateSubmit = (e: React.FormEvent, folderId: string | null) => {
    e.preventDefault();
    if (!inlineName.trim()) {
      setInlineCreatingInFolder(null);
      return;
    }

    if (inlineCreatingInFolder?.type === 'folder') {
      onCreateInlineFolder(folderId, inlineName.trim());
    } else {
      onCreateInlineFile(folderId, inlineName.trim());
    }

    setInlineName('');
    setInlineCreatingInFolder(null);
  };

  const handleInlineRenameSubmit = (e: React.FormEvent, id: string, type: 'file' | 'folder') => {
    e.preventDefault();
    if (!renameValue.trim()) {
      setInlineRenamingItem(null);
      return;
    }
    onRenameItem(id, type, renameValue.trim());
    setInlineRenamingItem(null);
  };

  // Render Recursive Tree Node
  const renderFolderContent = (parentId: string | null, depth = 0) => {
    const filterTerm = explorerFilter.trim().toLowerCase();
    const currentFolders = safeFolders.filter((f) => f && f.parentId === parentId && (!filterTerm || f.name.toLowerCase().includes(filterTerm)));
    const currentFiles = safeFiles.filter((f) => f && f.parentId === parentId && (!filterTerm || f.name.toLowerCase().includes(filterTerm)));

    return (
      <div className="space-y-0.5">
        {/* Render Folders */}
        {currentFolders.map((folder) => {
          const isSelected = safeSelectedIds.includes(folder.id);
          const isExpanded = !!folder.isExpanded;
          const isDragOver = dragOverFolderId === folder.id;
          const isRenaming = inlineRenamingItem?.id === folder.id;

          return (
            <div key={folder.id} className="select-none">
              <div
                draggable={!isRenaming}
                onDragStart={(e) => handleDragStart(e, folder.id)}
                onDragOver={(e) => handleDragOverFolder(e, folder.id)}
                onDragLeave={handleDragLeaveFolder}
                onDrop={(e) => handleDropOnFolder(e, folder.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFolder(folder.id, e.ctrlKey || e.metaKey);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onToggleFolderExpand(folder.id);
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  onContextMenu(e, folder.id, 'folder');
                }}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
                className={`group flex items-center justify-between py-1 pr-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isDragOver
                    ? 'bg-cyan-500/30 border border-cyan-400 font-bold'
                    : isSelected
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFolderExpand(folder.id);
                    }}
                    className="p-0.5 text-slate-500 hover:text-slate-300 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <FileIcon name={folder.name} isFolder isExpanded={isExpanded} className="w-4 h-4" />

                  {isRenaming ? (
                    <form
                      onSubmit={(e) => handleInlineRenameSubmit(e, folder.id, 'folder')}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 flex-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full bg-slate-900 text-xs font-mono text-white px-1 py-0.5 rounded border border-amber-500 outline-none"
                      />
                      <button type="submit" className="text-emerald-400 p-0.5">
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <span className="font-mono text-xs truncate">{folder.name}</span>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInlineCreatingInFolder({ folderId: folder.id, type: 'file' });
                      setInlineName('');
                      if (!folder.isExpanded) onToggleFolderExpand(folder.id);
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                    title="New File inside"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInlineCreatingInFolder({ folderId: folder.id, type: 'folder' });
                      setInlineName('');
                      if (!folder.isExpanded) onToggleFolderExpand(folder.id);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-400 rounded"
                    title="New Subfolder"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Folder Inline Creator */}
              {inlineCreatingInFolder?.folderId === folder.id && (
                <form
                  onSubmit={(e) => handleInlineCreateSubmit(e, folder.id)}
                  style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
                  className="flex items-center gap-1 py-1 pr-2 my-0.5 bg-slate-950/80 rounded-xl border border-cyan-500/50"
                >
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                    +{inlineCreatingInFolder.type}:
                  </span>
                  <input
                    type="text"
                    autoFocus
                    placeholder={inlineCreatingInFolder.type === 'file' ? 'e.g. Button.tsx' : 'folder name'}
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-white outline-none px-1"
                  />
                  <button type="submit" className="text-emerald-400 p-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineCreatingInFolder(null)}
                    className="text-slate-400 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Recursive Children */}
              {isExpanded && renderFolderContent(folder.id, depth + 1)}
            </div>
          );
        })}

        {/* Render Files */}
        {currentFiles.map((file) => {
          const isActive = file.id === activeFileId;
          const isSelected = safeSelectedIds.includes(file.id);
          const isRenaming = inlineRenamingItem?.id === file.id;

          return (
            <div
              key={file.id}
              draggable={!isRenaming}
              onDragStart={(e) => handleDragStart(e, file.id)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFile(file.id, e.ctrlKey || e.metaKey, e.shiftKey);
              }}
              onContextMenu={(e) => {
                e.stopPropagation();
                onContextMenu(e, file.id, 'file');
              }}
              style={{ paddingLeft: `${depth * 14 + 18}px` }}
              className={`group flex items-center justify-between py-1 pr-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                  : isSelected
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileIcon name={file.name} extension={file.extension} className="w-4 h-4" />

                {isRenaming ? (
                  <form
                    onSubmit={(e) => handleInlineRenameSubmit(e, file.id, 'file')}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 flex-1"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-full bg-slate-900 text-xs font-mono text-white px-1 py-0.5 rounded border border-cyan-500 outline-none"
                    />
                    <button type="submit" className="text-emerald-400 p-0.5">
                      <Check className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <span className="font-mono text-xs truncate">{file.name}</span>
                )}
              </div>

              {file.isUnsaved && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse ml-2" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      onDragOver={(e) => handleDragOverFolder(e, null)}
      onDragLeave={handleDragLeaveFolder}
      onDrop={(e) => handleDropOnFolder(e, null)}
      onContextMenu={(e) => onContextMenu(e, null, 'root')}
      className={`h-full overflow-y-auto p-2 space-y-2 select-none custom-scrollbar ${
        dragOverFolderId === null ? 'bg-cyan-500/5' : ''
      }`}
    >
      {/* Root Header Actions */}
      <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider px-2 py-1">
        <span>Project Explorer</span>
        <div className="flex items-center gap-1">
          {onOpenLocalFolder && (
            <button
              type="button"
              onClick={onOpenLocalFolder}
              className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isPwaMounted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
              }`}
              title="Open Local Directory from Computer Disk (PWA)"
            >
              <Upload className="w-3 h-3" />
              <span>{isPwaMounted ? 'Local Disk' : 'Open Folder'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setInlineCreatingInFolder({ folderId: null, type: 'file' });
              setInlineName('');
            }}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer"
            title="New Root File"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setInlineCreatingInFolder({ folderId: null, type: 'folder' });
              setInlineName('');
            }}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
            title="New Root Folder"
          >
            <FolderPlus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Explorer Search Filter Bar */}
      <div className="px-1 py-1">
        <input
          type="text"
          value={explorerFilter}
          onChange={(e) => setExplorerFilter(e.target.value)}
          placeholder="Filter files in tree..."
          className="w-full px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Actionable Sync Error / Connectivity Banner */}
      {syncError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              {syncError.type === 'permission' ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              ) : syncError.type === 'connectivity' ? (
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{syncError.title}</span>
            </div>
            {onDismissSyncError && (
              <button
                type="button"
                onClick={onDismissSyncError}
                className="p-0.5 hover:bg-amber-500/20 rounded text-amber-400/70 hover:text-amber-200"
                title="Dismiss Notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-amber-200/90 leading-tight">
            {syncError.message}
          </p>

          {syncError.reason && (
            <p className="text-[10px] font-mono text-amber-300/80 bg-black/30 p-1.5 rounded border border-amber-500/20">
              {syncError.reason}
            </p>
          )}

          <div className="flex items-center gap-1.5 pt-0.5">
            {onRetrySync && (
              <button
                type="button"
                onClick={onRetrySync}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition-all cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Sync</span>
              </button>
            )}
            <span className="text-[10px] text-slate-400 italic">Saved locally to IndexedDB</span>
          </div>
        </div>
      )}

      {/* Root Level Inline Creator */}
      {inlineCreatingInFolder?.folderId === null && (
        <form
          onSubmit={(e) => handleInlineCreateSubmit(e, null)}
          className="flex items-center gap-1 py-1.5 px-2 my-1 bg-slate-950 rounded-xl border border-cyan-500/50"
        >
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
            +{inlineCreatingInFolder.type}:
          </span>
          <input
            type="text"
            autoFocus
            placeholder={inlineCreatingInFolder.type === 'file' ? 'e.g. App.tsx' : 'src'}
            value={inlineName}
            onChange={(e) => setInlineName(e.target.value)}
            className="w-full bg-transparent text-xs font-mono text-white outline-none px-1"
          />
          <button type="submit" className="text-emerald-400 p-0.5">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setInlineCreatingInFolder(null)}
            className="text-slate-400 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Folder Tree Root */}
      {folders.length === 0 && files.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-2xl">
          Empty Project. Click + above to create a file or folder, or drag files here to upload.
        </div>
      ) : (
        renderFolderContent(null, 0)
      )}
    </div>
  );
}
