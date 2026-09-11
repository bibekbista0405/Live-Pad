import { useState, useEffect } from 'react';
import { GitPullRequest, CircleDot, PlayCircle, LogIn, LogOut, ExternalLink, Star, GitFork, User, Search } from 'lucide-react';
import { githubService } from '../../services/githubService';
import { GitHubRepository, GitHubPullRequest, GitHubIssue, GitHubActionRun } from '../../types/phase4';

export function GitHubPanel() {
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'repos' | 'prs' | 'issues' | 'actions'>('repos');
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [prs, setPrs] = useState<GitHubPullRequest[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [actionRuns, setActionRuns] = useState<GitHubActionRun[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    githubService.init().then(() => {
      setIsAuth(githubService.isAuthenticated());
      if (githubService.isAuthenticated()) {
        loadData();
      }
    });
  }, []);

  const loadData = async () => {
    setRepos(await githubService.getRepositories());
    setPrs(await githubService.getPullRequests());
    setIssues(await githubService.getIssues());
    setActionRuns(await githubService.getActionRuns());
  };

  const handleLogin = async () => {
    await githubService.loginWithGitHub();
    setIsAuth(true);
    loadData();
  };

  const handleLogout = async () => {
    await githubService.logout();
    setIsAuth(false);
  };

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="font-bold text-xs uppercase tracking-wide text-white">GitHub Enterprise</span>
        </div>

        {isAuth ? (
          <button
            onClick={handleLogout}
            className="p-1 text-[#858585] hover:text-red-400 rounded hover:bg-[#333333] transition-colors cursor-pointer"
            title="Sign Out GitHub"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="px-2 py-1 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <LogIn className="w-3 h-3" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {!isAuth ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <User className="w-10 h-10 text-[#858585]" />
          <div className="font-bold text-sm text-white">Sign in to GitHub</div>
          <div className="text-xs text-[#858585]">
            Connect your GitHub account to access repositories, manage pull requests, review code inline, and view workflow status.
          </div>
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
          >
            <LogIn className="w-4 h-4" />
            <span>Connect GitHub Account</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Subtabs */}
          <div className="flex border-b border-[#2d2d2d] bg-[#252526] text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('repos')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'repos' ? 'border-[#238636] text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
              }`}
            >
              Repos ({repos.length})
            </button>
            <button
              onClick={() => setActiveTab('prs')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'prs' ? 'border-[#238636] text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
              }`}
            >
              PRs ({prs.length})
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'issues' ? 'border-[#238636] text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
              }`}
            >
              Issues ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'actions' ? 'border-[#238636] text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
              }`}
            >
              Actions
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-[#2d2d2d] bg-[#181818] shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories, PRs, issues..."
                className="w-full pl-8 pr-3 py-1 bg-[#212121] border border-[#333333] rounded text-xs text-white outline-none focus:border-[#238636]"
              />
            </div>
          </div>

          {/* Main List Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {activeTab === 'repos' &&
              repos.map((repo) => (
                <div key={repo.id} className="p-3 bg-[#252526] rounded border border-[#333333] hover:border-[#444444] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#58a6ff] hover:underline cursor-pointer flex items-center gap-1">
                      {repo.fullName}
                      <ExternalLink className="w-3 h-3 text-[#858585]" />
                    </span>
                    {repo.isPrivate && <span className="text-[10px] bg-[#333333] text-amber-300 px-1.5 py-0.5 rounded">Private</span>}
                  </div>
                  <p className="text-[11px] text-[#858585] line-clamp-2">{repo.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#858585] pt-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-current"/> {repo.starsCount}</span>
                      <span className="flex items-center gap-1"><GitFork className="w-3 h-3"/> {repo.forksCount}</span>
                    </div>
                    <button className="px-2 py-0.5 bg-[#238636] text-white rounded font-semibold hover:bg-[#2ea043] cursor-pointer">
                      Clone
                    </button>
                  </div>
                </div>
              ))}

            {activeTab === 'prs' &&
              prs.map((pr) => (
                <div key={pr.id} className="p-3 bg-[#252526] rounded border border-[#333333] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-bold text-xs text-white hover:text-[#58a6ff] cursor-pointer">
                      #{pr.number} {pr.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#858585] flex items-center justify-between">
                    <span>Opened by {pr.author} {pr.createdAt}</span>
                    <span className="font-mono text-emerald-400">+{pr.additions} / -{pr.deletions}</span>
                  </div>
                </div>
              ))}

            {activeTab === 'issues' &&
              issues.map((issue) => (
                <div key={issue.id} className="p-3 bg-[#252526] rounded border border-[#333333] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs text-white">
                      #{issue.number} {issue.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {issue.labels.map((lbl, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-black" style={{ backgroundColor: lbl.color }}>
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

            {activeTab === 'actions' &&
              actionRuns.map((run) => (
                <div key={run.id} className="p-3 bg-[#252526] rounded border border-[#333333] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{run.name}</span>
                    </div>
                    <div className="text-[10px] text-[#858585] font-mono">{run.workflow} on branch {run.branch}</div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                    Passed
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
