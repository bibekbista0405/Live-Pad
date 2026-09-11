import React, { useState } from 'react';
import { 
  Code, 
  Terminal, 
  Play, 
  Eye, 
  GitCommit, 
  GitPullRequest, 
  RotateCcw, 
  Bug, 
  Sparkles, 
  Check, 
  Layers, 
  Plus, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceRole } from '../../types';

export interface GitCommitSnapshot {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  codeSnippet: string;
  status?: 'approved' | 'pending' | 'merged';
}

interface CodingSessionViewProps {
  role?: WorkspaceRole;
  currentRole?: WorkspaceRole;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  language?: string;
  codeLanguage?: string;
  onLanguageChange?: (lang: string) => void;
  onChangeCodeLanguage?: (lang: string) => void;
  onToggleCodeMode?: () => void;
  commits?: GitCommitSnapshot[];
  onCommitCode?: (message: string) => void;
  onRunCode?: () => void;
  isExecuting?: boolean;
  activeSubTab?: 'editor' | 'terminal' | 'preview' | 'git';
  onSubTabChange?: (tab: 'editor' | 'terminal' | 'preview' | 'git') => void;
  onSyncCodeToAll?: () => void;
}

export const CodingSessionView: React.FC<CodingSessionViewProps> = ({
  role = 'lead_dev',
  currentRole = role,
  language = 'typescript',
  codeLanguage = language,
  onLanguageChange,
  onChangeCodeLanguage,
  onToggleCodeMode,
  commits = [],
  onCommitCode,
  onRunCode,
  isExecuting = false,
  activeSubTab = 'editor',
  onSubTabChange,
  onSyncCodeToAll
}) => {
  const activeRole = currentRole || role;
  const activeLang = codeLanguage || language;
  const handleLangChange = onChangeCodeLanguage || onLanguageChange || (() => {});

  const isInstructor = activeRole === 'admin' || (activeRole as string) === 'lead_dev' || activeRole === 'instructor';
  const isDeveloper = (activeRole as string) === 'developer' || (activeRole as string) === 'pair_programmer';
  const isReviewer = (activeRole as string) === 'reviewer' || (activeRole as string) === 'code_reviewer';

  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitModal, setShowCommitModal] = useState(false);

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim() || !onCommitCode) return;
    onCommitCode(commitMessage.trim());
    setCommitMessage('');
    setShowCommitModal(false);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800">
      {/* Top Coding Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-zinc-800/90 rounded-xl border border-zinc-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              Coding Session Studio
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {currentRole}
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">
              Monaco Code Editor, Terminal Output, Git Snapshots & Code Review
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <select 
            value={activeLang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML / CSS</option>
            <option value="json">JSON</option>
          </select>

          {/* Sync Code to All (Instructor only) */}
          {isInstructor && onSyncCodeToAll && (
            <button
              onClick={onSyncCodeToAll}
              title="Push instructor code state to all connected clients"
              className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Sync Code
            </button>
          )}

          {/* Run Code Button */}
          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={isExecuting}
              className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isExecuting ? 'Running...' : 'Run Code'}
            </button>
          )}

          {/* Commit Snapshot Button */}
          {(isInstructor || isDeveloper) && onCommitCode && (
            <button
              onClick={() => setShowCommitModal(true)}
              className="px-2.5 py-1 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg flex items-center gap-1 border border-zinc-600"
            >
              <GitCommit className="w-3.5 h-3.5 text-purple-400" /> Snapshot Commit
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      {onSubTabChange && (
        <div className="flex items-center gap-1 px-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs">
          {[
            { id: 'editor', label: 'Code Editor', icon: Code },
            { id: 'terminal', label: 'Terminal / Console', icon: Terminal },
            { id: 'preview', label: 'Live Preview', icon: Eye },
            { id: 'git', label: `Git Panel (${commits.length})`, icon: GitPullRequest }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSubTabChange(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Git History Snapshot Panel */}
      {activeSubTab === 'git' && (
        <div className="p-4 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <GitCommit className="w-4 h-4" /> Git Version Snapshots & Code Review
            </h4>
            <span className="text-xs text-zinc-500">
              {commits.length} recorded commits
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {commits.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2 text-center">
                No git commits recorded yet. Take a version snapshot above!
              </p>
            ) : (
              commits.map((c) => (
                <div 
                  key={c.id}
                  className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-400 font-bold">{c.id.substring(0, 7)}</span>
                      <span className="font-semibold text-white">{c.message}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      By {c.author} • {new Date(c.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                    Merged
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Commit Modal */}
      <AnimatePresence>
        {showCommitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateCommit}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-purple-400" /> Create Version Snapshot
              </h3>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Commit Message
                </label>
                <input 
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="e.g. Implement binary tree search algorithm..."
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommitModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Record Snapshot
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodingSessionView;
