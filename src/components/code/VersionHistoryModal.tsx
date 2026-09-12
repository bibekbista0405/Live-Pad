import React, { useState, useEffect } from 'react';
import { History, RotateCcw, X, Clock, FileCode, Check, Eye } from 'lucide-react';
import { DiffEditor } from '@monaco-editor/react';
import { ProjectFile, FileVersion } from '../../types/code';
import { fetchFileVersionsDocs, saveFileVersionDoc } from '../../services/projectSyncService';
import { loadFileVersionHistoryLocal, saveFileVersionHistoryLocal } from '../../services/indexedDBService';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId: string;
  file: ProjectFile | null;
  onRestoreVersion: (content: string, versionNum: number) => void;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  file,
  onRestoreVersion
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) return;

    const loadVersions = async () => {
      setIsLoading(true);
      try {
        let fetched = await fetchFileVersionsDocs(workspaceId, projectId, file.id);
        if (fetched.length === 0) {
          fetched = await loadFileVersionHistoryLocal(file.id);
        }

        // Always ensure at least v1 snapshot exists
        if (fetched.length === 0) {
          const initialVersion: FileVersion = {
            id: `v1-${Date.now()}`,
            fileId: file.id,
            versionNumber: file.version || 1,
            content: file.content,
            updatedAt: file.updatedAt || Date.now(),
            authorName: file.createdBy || 'collaborator',
            summary: 'Initial File Snapshot'
          };
          fetched = [initialVersion];
          saveFileVersionDoc(workspaceId, projectId, file.id, initialVersion);
          saveFileVersionHistoryLocal(initialVersion);
        }

        setVersions(fetched);
        setSelectedVersion(fetched[0]);
      } catch (e) {
        console.warn('Error loading versions:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadVersions();
  }, [isOpen, file, workspaceId, projectId]);

  if (!isOpen || !file) return null;

  return (
    <div className="livepad-code-modal-backdrop">
      <div className="livepad-code-modal livepad-version-history">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span>Version History:</span>
                <span className="font-mono text-cyan-400">{file.name}</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Compare file snapshots & restore previous revisions cleanly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Sidebar History Timeline & Diff Viewer */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Timeline List */}
          <div className="w-72 bg-slate-950/60 border-r border-slate-800 p-3 overflow-y-auto space-y-2 shrink-0 custom-scrollbar">
            <div className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-2">
              File Snapshots ({versions.length})
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-xs font-mono text-slate-500 animate-pulse">
                Loading history...
              </div>
            ) : (
              versions.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                const isCurrent = ver.versionNumber === file.version;

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-white flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>v{ver.versionNumber}</span>
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {ver.summary || `Snapshot by ${ver.authorName}`}
                    </p>

                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>{new Date(ver.updatedAt).toLocaleDateString()}</span>
                      <span>{new Date(ver.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Diff / Preview Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
            {selectedVersion ? (
              <>
                <div className="h-10 bg-slate-950/80 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
                  <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                    <span className="text-slate-500">Comparing:</span>
                    <span className="font-bold text-amber-400">Selected (v{selectedVersion.versionNumber})</span>
                    <span className="text-slate-500">vs</span>
                    <span className="font-bold text-cyan-400">Current Editor State</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreVersion(selectedVersion.content, selectedVersion.versionNumber);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore v{selectedVersion.versionNumber}</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0 relative">
                  <DiffEditor
                    height="100%"
                    language={file.language}
                    theme="vs-dark"
                    original={selectedVersion.content}
                    modified={file.content}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      renderSideBySide: true,
                      fontSize: 13,
                      scrollBeyondLastLine: false
                    } as any}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
                Select a version snapshot to compare changes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
