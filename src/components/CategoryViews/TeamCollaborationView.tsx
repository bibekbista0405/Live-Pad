import React, { useState } from 'react';
import { 
  Users, 
  Folder, 
  FolderPlus, 
  CheckSquare, 
  Activity, 
  Paperclip, 
  Shield, 
  Plus, 
  ChevronRight, 
  FileText, 
  Clock, 
  MoreVertical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceRole, WorkspaceParticipant } from '../../types';

export interface TeamFolder {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: number;
}

export interface ActivityLogItem {
  id: string;
  user: string;
  action: string;
  timestamp: number;
}

interface TeamCollaborationViewProps {
  role?: WorkspaceRole;
  currentRole?: WorkspaceRole;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  participants?: WorkspaceParticipant[];
  onUpdateRole?: (uid: string, newRole: WorkspaceRole) => void;
  folders?: TeamFolder[];
  onCreateFolder?: (name: string) => void;
  activities?: ActivityLogItem[];
  activeSubTab?: 'projects' | 'tasks' | 'activity' | 'members' | 'files';
  onSubTabChange?: (tab: 'projects' | 'tasks' | 'activity' | 'members' | 'files') => void;
}

export const TeamCollaborationView: React.FC<TeamCollaborationViewProps> = ({
  role = 'editor',
  currentRole = role,
  participants = [],
  onUpdateRole,
  folders = [],
  onCreateFolder,
  activities = [],
  activeSubTab = 'projects',
  onSubTabChange
}) => {
  const activeRole = currentRole || role;
  const isManager = activeRole === 'admin' || activeRole === 'owner' || (activeRole as string) === 'manager';
  const isEditor = activeRole === 'editor';

  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !onCreateFolder) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowFolderModal(false);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-zinc-800">
      {/* Team Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Team Collaboration Hub
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 font-medium">
                Role: {currentRole}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Folder hierarchies, task workflows, activity audit logs & team members
            </p>
          </div>
        </div>

        {/* Action Button */}
        {isManager && onCreateFolder && (
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Folder
          </button>
        )}
      </div>

      {/* Sub Tabs */}
      {onSubTabChange && (
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-zinc-900 rounded-xl text-xs font-medium">
          {[
            { id: 'projects', label: `Folders (${folders.length})`, icon: Folder },
            { id: 'activity', label: 'Activity Feed', icon: Activity },
            { id: 'members', label: `Members (${participants.length})`, icon: Users },
            { id: 'files', label: 'Team Files', icon: Paperclip }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Folders Tab Content */}
      {activeSubTab === 'projects' && (
        <div className="p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Project Folders & Assets
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {folders.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-2 col-span-full text-center">
                No custom folders created yet. Click "New Folder" to organize documents.
              </p>
            ) : (
              folders.map(f => (
                <div 
                  key={f.id}
                  className="p-2.5 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-violet-500" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{f.name}</span>
                      <p className="text-[10px] text-slate-400">{f.itemCount} items</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Members & Roles Management Tab */}
      {activeSubTab === 'members' && (
        <div className="p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
            Team Members & Roles Matrix
          </h4>

          <div className="space-y-1.5">
            {participants.map(p => (
              <div 
                key={p.uid}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'}`} />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{p.name}</span>
                    <span className="ml-2 text-[10px] text-slate-400 dark:text-zinc-500">
                      Joined {new Date(p.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isManager ? (
                  <select
                    value={p.role}
                    onChange={(e) => onUpdateRole && onUpdateRole(p.uid, e.target.value as WorkspaceRole)}
                    className="px-2 py-0.5 text-[11px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-slate-800 dark:text-zinc-200"
                  >
                    <option value="manager">Manager</option>
                    <option value="editor">Editor</option>
                    <option value="contributor">Contributor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium">
                    {p.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Audit Feed Tab */}
      {activeSubTab === 'activity' && (
        <div className="p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
            Real-Time Audit & Activity Stream
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-2 text-center">
                No recent team activity recorded yet.
              </p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300 py-1 border-b border-slate-100 dark:border-zinc-800">
                  <Activity className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span className="font-semibold">{act.user}</span>
                  <span>{act.action}</span>
                  <span className="ml-auto text-[10px] text-slate-400">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Folder Creation Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateFolder}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-violet-600" /> Create Project Folder
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Folder Name
                </label>
                <input 
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Q3 Design Assets, Client Proposals..."
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm"
                >
                  Create Folder
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamCollaborationView;
