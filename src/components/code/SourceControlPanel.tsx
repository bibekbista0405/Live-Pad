import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Plus,
  Check,
  RotateCcw,
  FileCode,
  FolderGit2,
  UploadCloud,
  DownloadCloud,
  Eye,
  Trash2,
  ChevronRight,
  ChevronDown,
  GitMerge,
  History,
  Terminal,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  FolderPlus
} from 'lucide-react';
import { ProjectFile } from '../../types/code';
import { GitDiffModal } from './GitDiffModal';
import { Platform } from '../../platform';

interface GitCommitItem {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

interface SourceControlPanelProps {
  files: ProjectFile[];
  onSelectFile: (fileId: string) => void;
  onUpdateFileContent?: (fileId: string, content: string) => void;
  projectPath?: string;
}

export function SourceControlPanel({ files, onSelectFile, onUpdateFileContent, projectPath = '.' }: SourceControlPanelProps) {
  // Repository state
  const [isRepoInitialized, setIsRepoInitialized] = useState<boolean>(true);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [branches, setBranches] = useState<string[]>(['main', 'feature/auth', 'fix/ui-layout']);
  const [newBranchInput, setNewBranchInput] = useState<string>('');
  const [isCreatingBranch, setIsCreatingBranch] = useState<boolean>(false);

  // Staging state
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Tab mode: 'changes' | 'history' | 'clone'
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'clone'>('changes');

  // Clone repo input
  const [cloneUrl, setCloneUrl] = useState<string>('');
  const [isCloning, setIsCloning] = useState<boolean>(false);

  // Commit history list
  const [commits, setCommits] = useState<GitCommitItem[]>([
    {
      id: 'c1',
      hash: 'a8f9102',
      message: 'feat: add interactive terminal and language boilerplate support',
      author: 'LivePad Developer',
      date: '10 minutes ago',
      branch: 'main'
    },
    {
      id: 'c2',
      hash: '7e2b109',
      message: 'chore: configure monaco editor typescript language support',
      author: 'LivePad Developer',
      date: '1 hour ago',
      branch: 'main'
    },
    {
      id: 'c3',
      hash: '3d8a941',
      message: 'initial commit from workspace template',
      author: 'System',
      date: '1 day ago',
      branch: 'main'
    }
  ]);

  // Load real Git status when mounted or projectPath changed
  useEffect(() => {
    let isMounted = true;
    async function loadGitData() {
      if (!projectPath) return;
      try {
        const status = await Platform.getGitStatus(projectPath);
        if (isMounted && status.isGitRepo) {
          setIsRepoInitialized(true);
          if (status.branch) setCurrentBranch(status.branch);
        }
        const bList = await Platform.getGitBranches(projectPath);
        if (isMounted && bList.length > 0) {
          setBranches(bList);
        }
        const logs = await Platform.getGitLog(projectPath, 20);
        if (isMounted && logs.length > 0) {
          setCommits(
            logs.map((l, i) => ({
              id: `c-log-${i}`,
              hash: l.hash,
              message: l.message,
              author: l.author,
              date: l.date,
              branch: status.branch || 'main'
            }))
          );
        }
      } catch (err) {
        console.warn('Git status query failed:', err);
      }
    }
    loadGitData();
    return () => {
      isMounted = false;
    };
  }, [projectPath]);

  // Diff Modal State
  const [diffModalState, setDiffModalState] = useState<{
    isOpen: boolean;
    fileName: string;
    originalContent: string;
    modifiedContent: string;
    fileId?: string;
    hasConflict?: boolean;
  }>({
    isOpen: false,
    fileName: '',
    originalContent: '',
    modifiedContent: '',
    hasConflict: false
  });

  // Collapsible sections
  const [isStagedExpanded, setIsStagedExpanded] = useState<boolean>(true);
  const [isChangesExpanded, setIsChangesExpanded] = useState<boolean>(true);

  // Filter unsaved/modified files
  const changedFiles = files.filter((f) => f.isUnsaved || !stagedFileIds.has(f.id));
  const stagedFiles = files.filter((f) => stagedFileIds.has(f.id));

  // Toggle stage for individual file
  const handleToggleStage = (fileId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStagedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  // Stage All / Unstage All
  const handleStageAll = () => {
    setStagedFileIds(new Set(files.map((f) => f.id)));
  };

  const handleUnstageAll = () => {
    setStagedFileIds(new Set());
  };

  // Execute Commit
  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    const newCommit: GitCommitItem = {
      id: `c-${Date.now()}`,
      hash: Math.random().toString(16).substring(2, 9),
      message: commitMessage.trim(),
      author: 'LivePad Developer',
      date: 'Just now',
      branch: currentBranch
    };

    setCommits((prev) => [newCommit, ...prev]);
    setCommitMessage('');
    setStagedFileIds(new Set());
  };

  // Create Branch
  const handleCreateBranch = () => {
    const name = newBranchInput.trim();
    if (name && !branches.includes(name)) {
      setBranches((prev) => [...prev, name]);
      setCurrentBranch(name);
      setNewBranchInput('');
      setIsCreatingBranch(false);
    }
  };

  // Sync / Push / Pull
  const handleSyncRemote = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Clone Repo execution
  const handleCloneRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneUrl.trim()) return;
    setIsCloning(true);
    setTimeout(() => {
      setIsCloning(false);
      setIsRepoInitialized(true);
      setActiveTab('changes');
      setCloneUrl('');
    }, 1500);
  };

  // View Diff
  const handleOpenDiff = (file: ProjectFile, hasConflict = false) => {
    setDiffModalState({
      isOpen: true,
      fileName: file.name,
      originalContent: `// Original HEAD state of ${file.name}\n${file.content.substring(0, file.content.length / 2)}`,
      modifiedContent: file.content,
      fileId: file.id,
      hasConflict
    });
  };

  if (!isRepoInitialized) {
    return (
      <div className="flex-1 p-4 bg-[#1e1e1e] text-slate-300 flex flex-col items-center justify-center text-center font-sans space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#252526] border border-[#3c3c3c] flex items-center justify-center text-[#007acc]">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-xs">
          <h3 className="font-bold text-white text-sm">No Git Repository Detected</h3>
          <p className="text-xs text-[#858585]">
            Initialize a local Git repository or clone a remote Git repository to enable version control.
          </p>
        </div>

        <div className="space-y-2 w-full max-w-xs">
          <button
            type="button"
            onClick={() => setIsRepoInitialized(true)}
            className="w-full py-2 bg-[#007acc] hover:bg-[#0062a3] text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Initialize Repository
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRepoInitialized(true);
              setActiveTab('clone');
            }}
            className="w-full py-2 bg-[#252526] hover:bg-[#333333] border border-[#3c3c3c] text-slate-200 font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <DownloadCloud className="w-4 h-4 text-cyan-400" /> Clone Repository
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col select-none font-sans overflow-hidden border-r border-[#252526]">
      {/* Top Header Controls Bar */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#007acc]" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Source Control</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh / Fetch */}
          <button
            type="button"
            onClick={handleSyncRemote}
            className={`p-1.5 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors cursor-pointer ${
              isSyncing ? 'animate-spin text-[#007acc]' : ''
            }`}
            title="Fetch changes from remote"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Sync Changes Push/Pull */}
          <button
            type="button"
            onClick={handleSyncRemote}
            className="p-1.5 text-[#858585] hover:text-emerald-400 rounded hover:bg-[#333333] transition-colors cursor-pointer flex items-center gap-1"
            title="Push / Pull Sync Remote"
          >
            <UploadCloud className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs: Changes vs Commit History vs Clone */}
      <div className="flex items-center border-b border-[#2d2d2d] bg-[#181818] px-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('changes')}
          className={`px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'changes'
              ? 'border-[#007acc] text-white font-bold'
              : 'border-transparent text-[#858585] hover:text-[#cccccc]'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5 text-[#007acc]" />
          <span>Changes ({changedFiles.length + stagedFiles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-[#007acc] text-white font-bold'
              : 'border-transparent text-[#858585] hover:text-[#cccccc]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>History ({commits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clone')}
          className={`px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'clone'
              ? 'border-[#007acc] text-white font-bold'
              : 'border-transparent text-[#858585] hover:text-[#cccccc]'
          }`}
        >
          <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Clone</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {activeTab === 'changes' && (
          <>
            {/* Branch Selector & Create */}
            <div className="bg-[#252526] p-2.5 rounded border border-[#3c3c3c] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Branch:</span>
                  <select
                    value={currentBranch}
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    className="bg-[#1e1e1e] text-white border border-[#3c3c3c] rounded px-2 py-0.5 outline-none font-mono text-xs cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingBranch(!isCreatingBranch)}
                  className="p-1 text-[#007acc] hover:bg-[#333333] rounded"
                  title="New Branch"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isCreatingBranch && (
                <div className="flex items-center gap-1 pt-1">
                  <input
                    type="text"
                    value={newBranchInput}
                    onChange={(e) => setNewBranchInput(e.target.value)}
                    placeholder="feature/new-branch-name..."
                    className="flex-1 bg-[#1e1e1e] text-white border border-[#007acc] rounded px-2 py-1 text-xs outline-none font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                  />
                  <button
                    type="button"
                    onClick={handleCreateBranch}
                    className="px-2 py-1 bg-[#007acc] text-white font-bold rounded text-xs hover:bg-[#0062a3]"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>

            {/* Commit Message Box */}
            <div className="bg-[#252526] p-2.5 rounded border border-[#3c3c3c] space-y-2">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Message (Ctrl+Enter to commit)..."
                rows={3}
                className="w-full bg-[#1e1e1e] text-slate-100 border border-[#3c3c3c] rounded p-2 text-xs font-mono outline-none focus:border-[#007acc] resize-none"
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') handleCommit();
                }}
              />
              <button
                type="button"
                onClick={handleCommit}
                disabled={!commitMessage.trim()}
                className="w-full py-1.5 bg-[#007acc] hover:bg-[#0062a3] disabled:bg-[#2d2d2d] disabled:text-[#666] text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Commit ({stagedFiles.length > 0 ? stagedFiles.length : 'All'})
              </button>
            </div>

            {/* Staged Changes List */}
            <div className="space-y-1">
              <div
                onClick={() => setIsStagedExpanded(!isStagedExpanded)}
                className="flex items-center justify-between py-1 px-1 hover:bg-[#252526] rounded cursor-pointer text-xs font-bold text-[#cccccc]"
              >
                <div className="flex items-center gap-1">
                  {isStagedExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>STAGED CHANGES</span>
                  <span className="px-1.5 py-0.2 bg-[#2d2d2d] text-slate-300 rounded-full text-[10px]">
                    {stagedFiles.length}
                  </span>
                </div>
                {stagedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnstageAll();
                    }}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Unstage All
                  </button>
                )}
              </div>

              {isStagedExpanded &&
                (stagedFiles.length === 0 ? (
                  <div className="px-5 py-2 text-[11px] text-[#858585] italic">No staged files</div>
                ) : (
                  stagedFiles.map((file) => (
                    <div
                      key={`staged-${file.id}`}
                      onClick={() => onSelectFile(file.id)}
                      className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#2a2d2e] cursor-pointer text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate text-slate-200">{file.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDiff(file);
                          }}
                          className="p-1 text-[#858585] hover:text-cyan-400 rounded hover:bg-[#333333]"
                          title="View Staged Diff"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStage(file.id, e)}
                          className="p-1 text-rose-400 hover:bg-[#333333] rounded"
                          title="Unstage File"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ))}
            </div>

            {/* Working Tree Changes List */}
            <div className="space-y-1 pt-2">
              <div
                onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                className="flex items-center justify-between py-1 px-1 hover:bg-[#252526] rounded cursor-pointer text-xs font-bold text-[#cccccc]"
              >
                <div className="flex items-center gap-1">
                  {isChangesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>CHANGES</span>
                  <span className="px-1.5 py-0.2 bg-[#2d2d2d] text-slate-300 rounded-full text-[10px]">
                    {changedFiles.length}
                  </span>
                </div>
                {changedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageAll();
                    }}
                    className="text-[11px] text-[#007acc] hover:underline"
                  >
                    Stage All
                  </button>
                )}
              </div>

              {isChangesExpanded &&
                (changedFiles.length === 0 ? (
                  <div className="px-5 py-2 text-[11px] text-[#858585] italic">Working tree clean</div>
                ) : (
                  changedFiles.map((file) => (
                    <div
                      key={`changed-${file.id}`}
                      onClick={() => onSelectFile(file.id)}
                      className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#2a2d2e] cursor-pointer text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate text-slate-200">{file.name}</span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">M</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDiff(file);
                          }}
                          className="p-1 text-[#858585] hover:text-cyan-400 rounded hover:bg-[#333333]"
                          title="View Working Tree Diff"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStage(file.id, e)}
                          className="p-1 text-emerald-400 hover:bg-[#333333] rounded"
                          title="Stage File"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ))}
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3 font-sans">
            <div className="text-[11px] font-bold text-[#858585] uppercase tracking-wide">Recent Commits</div>
            <div className="space-y-2">
              {commits.map((c) => (
                <div key={c.id} className="p-2.5 bg-[#252526] rounded border border-[#3c3c3c] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#007acc] font-bold">{c.hash}</span>
                    <span className="text-[10px] text-[#858585]">{c.date}</span>
                  </div>
                  <p className="font-semibold text-white leading-snug">{c.message}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#858585]">
                    <span>{c.author}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#1e1e1e] rounded text-purple-300">
                      {c.branch}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clone Tab */}
        {activeTab === 'clone' && (
          <form onSubmit={handleCloneRepo} className="space-y-3 font-sans">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 block">Git Repository URL</label>
              <input
                type="url"
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                placeholder="https://github.com/username/repository.git"
                className="w-full bg-[#1e1e1e] text-slate-100 border border-[#3c3c3c] rounded p-2 text-xs font-mono outline-none focus:border-[#007acc]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isCloning || !cloneUrl.trim()}
              className="w-full py-2 bg-[#007acc] hover:bg-[#0062a3] disabled:bg-[#2d2d2d] text-white font-bold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isCloning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" /> Cloning Remote Repository...
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" /> Clone Repository
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Visual Diff Modal */}
      <GitDiffModal
        isOpen={diffModalState.isOpen}
        onClose={() => setDiffModalState((prev) => ({ ...prev, isOpen: false }))}
        fileName={diffModalState.fileName}
        originalContent={diffModalState.originalContent}
        modifiedContent={diffModalState.modifiedContent}
        hasConflict={diffModalState.hasConflict}
        onResolveConflict={(resolved) => {
          if (diffModalState.fileId && onUpdateFileContent) {
            onUpdateFileContent(diffModalState.fileId, resolved);
          }
        }}
      />
    </div>
  );
}
