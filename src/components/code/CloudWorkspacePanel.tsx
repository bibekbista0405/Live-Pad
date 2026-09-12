import React, { useState, useEffect } from 'react';
import { Cloud, HardDrive, RefreshCw, Layers, ShieldCheck, Laptop, History, Plus, CheckCircle2, Clock } from 'lucide-react';
import { cloudWorkspaceService } from '../../services/cloudWorkspaceService';
import { CloudWorkspace, WorkspaceSnapshot } from '../../types/phase4';

export function CloudWorkspacePanel() {
  const [workspace, setWorkspace] = useState<CloudWorkspace | null>(null);
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const loadWorkspaceData = async () => {
    const ws = await cloudWorkspaceService.getActiveWorkspace();
    const snaps = await cloudWorkspaceService.getSnapshots();
    setWorkspace(ws);
    setSnapshots(snaps);
    setPendingSyncCount(await cloudWorkspaceService.getPendingSyncCount());
    setLastSyncedAt(Date.now());
  };

  const handleModeChange = async (mode: 'local' | 'cloud' | 'hybrid') => {
    const updated = await cloudWorkspaceService.setWorkspaceMode(mode);
    setWorkspace({ ...updated });
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotLabel.trim()) return;
    const snap = await cloudWorkspaceService.createVersionSnapshot(snapshotLabel.trim());
    setSnapshots([snap, ...snapshots]);
    setSnapshotLabel('');
    loadWorkspaceData();
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await loadWorkspaceData();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!workspace) return null;

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#007acc]" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Workspace Sync</span>
        </div>
        <button
          onClick={handleTriggerSync}
          className={`p-1.5 rounded transition-colors ${
            isSyncing ? 'text-amber-400 bg-amber-500/10' : 'text-[#858585] hover:text-white hover:bg-[#333333]'
          }`}
          title="Trigger Manual Workspace Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Workspace Mode Selection */}
        <div className="bg-[#252526] p-3 rounded-lg border border-[#333333] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Workspace Mode</span>
            <span className="text-[10px] bg-[#007acc]/20 text-[#007acc] px-2 py-0.5 rounded font-mono font-semibold">
              {workspace.mode.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleModeChange('local')}
              className={`p-2 rounded text-center border transition-all cursor-pointer ${
                workspace.mode === 'local'
                  ? 'bg-[#007acc] text-white border-[#007acc]'
                  : 'bg-[#1e1e1e] border-[#333333] hover:border-[#444444] text-[#858585]'
              }`}
            >
              <HardDrive className="w-4 h-4 mx-auto mb-1" />
              <div className="text-[11px] font-bold">Local Only</div>
            </button>

            <button
              onClick={() => handleModeChange('cloud')}
              className={`p-2 rounded text-center border transition-all cursor-pointer ${
                workspace.mode === 'cloud'
                  ? 'bg-[#007acc] text-white border-[#007acc]'
                  : 'bg-[#1e1e1e] border-[#333333] hover:border-[#444444] text-[#858585]'
              }`}
            >
              <Cloud className="w-4 h-4 mx-auto mb-1" />
              <div className="text-[11px] font-bold">Cloud Only</div>
            </button>

            <button
              onClick={() => handleModeChange('hybrid')}
              className={`p-2 rounded text-center border transition-all cursor-pointer ${
                workspace.mode === 'hybrid'
                  ? 'bg-[#007acc] text-white border-[#007acc]'
                  : 'bg-[#1e1e1e] border-[#333333] hover:border-[#444444] text-[#858585]'
              }`}
            >
              <Layers className="w-4 h-4 mx-auto mb-1" />
              <div className="text-[11px] font-bold">Hybrid Sync</div>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="bg-[#252526] p-3 rounded-lg border border-[#333333] space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div className="text-xs font-bold text-white">Local-first sync is active</div>
          </div>
          <div className="text-[11px] text-[#858585]">
            Cloud mode is a real connection mode only when a configured cloud provider is available; this panel never invents remote snapshots.
            Last checked: <span className="text-slate-300 font-mono">{lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : '—'}</span>.
            {pendingSyncCount} pending offline change{pendingSyncCount === 1 ? '' : 's'}.
          </div>
        </div>

        {/* Create Version Snapshot */}
        <div className="bg-[#252526] p-3 rounded-lg border border-[#333333] space-y-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#007acc]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Version Snapshots</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              placeholder="Snapshot label (e.g., Stable Build)..."
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-[#007acc]"
            />
            <button
              onClick={handleCreateSnapshot}
              className="px-3 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            {snapshots.map((snap) => (
              <div key={snap.id} className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{snap.label}</div>
                  <div className="text-[10px] text-[#858585] flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(snap.timestamp).toLocaleTimeString()}</span>
                    <span>{snap.filesCount} files</span>
                  </div>
                </div>
                <span className="text-[10px] bg-[#333333] text-[#858585] px-2 py-0.5 rounded font-mono">
                  {snap.autoCreated ? 'Auto' : 'Manual'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
