import React, { useState } from 'react';
import { X, Pin, PinOff, RotateCcw, MoreHorizontal, Columns2, Columns, Save } from 'lucide-react';
import { ProjectFile } from '../../types/code';
import FileIcon from './FileIcon';

interface FileTabsBarProps {
  openFiles: ProjectFile[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onCloseOthers: (fileId: string) => void;
  onTogglePinTab: (fileId: string) => void;
  onReorderTabs?: (draggedId: string, targetId: string) => void;
  onRestoreClosedTab?: () => void;
  canRestoreTab?: boolean;
  isSplitView?: boolean;
  onToggleSplitView?: () => void;
  isAutoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
}

export default function FileTabsBar({
  openFiles,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onCloseOthers,
  onTogglePinTab,
  onReorderTabs,
  onRestoreClosedTab,
  canRestoreTab,
  isSplitView,
  onToggleSplitView,
  isAutoSaveEnabled,
  onToggleAutoSave
}: FileTabsBarProps) {
  const [contextMenuFileId, setContextMenuFileId] = useState<string | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenuFileId(fileId);
    setContextPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedTabId(fileId);
    e.dataTransfer.setData('text/plain', fileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabId !== fileId) {
      setDragOverTabId(fileId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedTabId || e.dataTransfer.getData('text/plain');
    if (sourceId && targetId && sourceId !== targetId && onReorderTabs) {
      onReorderTabs(sourceId, targetId);
    }
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  // Sort pinned tabs to front visually if required
  const sortedFiles = [...openFiles].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="livepad-code-tabs h-9 border-b flex items-center px-0 gap-0 overflow-x-auto shrink-0 select-none no-scrollbar relative">
      <div className="flex items-center h-full min-w-0 flex-1 overflow-x-auto no-scrollbar">
        {sortedFiles.map((file) => {
          const isActive = file.id === activeFileId;
          const isPinned = !!file.isPinned;
          const isDragged = file.id === draggedTabId;
          const isDragTarget = file.id === dragOverTabId;

          return (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => handleDragStart(e, file.id)}
              onDragOver={(e) => handleDragOver(e, file.id)}
              onDragLeave={() => setDragOverTabId(null)}
              onDrop={(e) => handleDrop(e, file.id)}
              onClick={() => onSelectTab(file.id)}
              onContextMenu={(e) => handleContextMenu(e, file.id)}
              className={`livepad-code-tab group relative flex items-center gap-2 px-3 h-full text-xs cursor-pointer border-r shrink-0 max-w-[200px] transition-all ${
                isDragged ? 'opacity-40 bg-slate-800' : ''
              } ${isDragTarget ? 'border-l-2 border-l-[#007acc] bg-[#2a2d2e]' : ''} ${isActive ? 'is-active text-white font-medium' : 'text-slate-400'}`}
            >
              {isPinned && <Pin className="w-3 h-3 text-[#007acc] shrink-0 transform -rotate-45" />}

              <FileIcon name={file.name} extension={file.extension} className="w-3.5 h-3.5 shrink-0" />

              <span className="truncate min-w-0">{file.name}</span>

              {/* Unsaved indicator / Hover Close Button */}
              <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                {file.isUnsaved ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:hidden" title="Unsaved changes" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(file.id);
                      }}
                      className="hidden group-hover:flex items-center justify-center p-0.5 rounded hover:bg-[#333333] text-[#969696] hover:text-white"
                      title="Close Tab"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(file.id);
                    }}
                    className={`p-0.5 rounded hover:bg-[#333333] text-[#969696] hover:text-white transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Close Tab"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar controls on tab bar right side */}
      <div className="flex items-center gap-1 px-2 border-l border-[#1e1e1e] bg-[#252526] shrink-0 h-full">
        {onToggleAutoSave && (
          <button
            type="button"
            onClick={onToggleAutoSave}
            className={`p-1 rounded flex items-center gap-1 text-[11px] px-1.5 transition-colors ${
              isAutoSaveEnabled
                ? 'bg-[#007acc]/20 text-[#007acc] font-medium'
                : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
            title={isAutoSaveEnabled ? 'Auto Save: ON' : 'Auto Save: OFF'}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">AutoSave</span>
          </button>
        )}

        {onToggleSplitView && (
          <button
            type="button"
            onClick={onToggleSplitView}
            className={`p-1.5 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e] transition-colors ${
              isSplitView ? 'text-[#007acc] bg-[#2a2d2e]' : ''
            }`}
            title={isSplitView ? 'Close Split Editor' : 'Split Editor (Side-by-Side)'}
          >
            {isSplitView ? <Columns className="w-3.5 h-3.5 text-[#007acc]" /> : <Columns2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {canRestoreTab && onRestoreClosedTab && (
          <button
            type="button"
            onClick={onRestoreClosedTab}
            className="p-1.5 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
            title="Restore Closed Tab (Ctrl+Shift+T)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab Context Menu */}
      {contextMenuFileId && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setContextMenuFileId(null)} />
          <div
            style={{ top: `${contextPos.y}px`, left: `${contextPos.x}px` }}
            className="fixed z-[100] w-52 bg-[#252526] border border-[#454545] rounded-md shadow-2xl p-1 text-xs text-[#cccccc] select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
          >
            <button
              type="button"
              onClick={() => {
                onCloseTab(contextMenuFileId);
                setContextMenuFileId(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#04395e] hover:text-white text-left cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Close Tab</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCloseOthers(contextMenuFileId);
                setContextMenuFileId(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#04395e] hover:text-white text-left cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Close Other Tabs</span>
            </button>

            <div className="h-px bg-[#3c3c3c] my-1" />

            <button
              type="button"
              onClick={() => {
                onTogglePinTab(contextMenuFileId);
                setContextMenuFileId(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#04395e] hover:text-white text-left cursor-pointer"
            >
              {openFiles.find((f) => f.id === contextMenuFileId)?.isPinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unpin Tab</span>
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5 text-[#007acc]" />
                  <span>Pin Tab</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

