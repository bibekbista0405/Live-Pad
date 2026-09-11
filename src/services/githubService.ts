import { GitHubRepository, GitHubPullRequest, GitHubIssue, GitHubActionRun } from '../types/phase4';
import { Platform } from '../platform';

export class GitHubService {
  private static instance: GitHubService;
  private token: string | null = null;
  private user: { login: string; avatarUrl: string; name: string } | null = null;

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  public async init() {
    const savedToken = await Platform.getNativeStorage('livepad_github_token');
    if (savedToken && typeof savedToken === 'string') {
      this.token = savedToken;
      this.user = {
        login: 'octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
        name: 'The Octocat',
      };
    }
  }

  public isAuthenticated(): boolean {
    return !!this.token || !!this.user;
  }

  public async loginWithGitHub(token?: string): Promise<boolean> {
    this.token = token || 'gho_mock_token_livepad_dev';
    this.user = {
      login: 'developer-user',
      avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
      name: 'Senior Developer',
    };
    await Platform.setNativeStorage('livepad_github_token', this.token);
    return true;
  }

  public async logout() {
    this.token = null;
    this.user = null;
    await Platform.setNativeStorage('livepad_github_token', null);
  }

  public getUser() {
    return this.user;
  }

  // Repositories
  public async getRepositories(): Promise<GitHubRepository[]> {
    return [
      {
        id: 101,
        name: 'livepad-ide',
        fullName: 'livepad/livepad-ide',
        owner: 'livepad',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
        isPrivate: false,
        description: 'Next-Generation Full-Stack IDE for Web, Desktop & Mobile',
        starsCount: 1420,
        forksCount: 230,
        openIssuesCount: 12,
        defaultBranch: 'main',
        cloneUrl: 'https://github.com/livepad/livepad-ide.git',
        updatedAt: '2 hours ago',
      },
      {
        id: 102,
        name: 'ai-code-agents',
        fullName: 'livepad/ai-code-agents',
        owner: 'livepad',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
        isPrivate: true,
        description: 'Autonomous multi-file code editing & refactoring agent engine',
        starsCount: 890,
        forksCount: 45,
        openIssuesCount: 4,
        defaultBranch: 'main',
        cloneUrl: 'https://github.com/livepad/ai-code-agents.git',
        updatedAt: 'Yesterday',
      },
      {
        id: 103,
        name: 'react-monaco-tree',
        fullName: 'livepad/react-monaco-tree',
        owner: 'livepad',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
        isPrivate: false,
        description: 'High-performance virtualized file tree component for Monaco editor',
        starsCount: 340,
        forksCount: 18,
        openIssuesCount: 2,
        defaultBranch: 'main',
        cloneUrl: 'https://github.com/livepad/react-monaco-tree.git',
        updatedAt: '3 days ago',
      },
    ];
  }

  // Pull Requests
  public async getPullRequests(): Promise<GitHubPullRequest[]> {
    return [
      {
        id: 201,
        number: 42,
        title: 'feat(core): Phase 4 Cloud Workspaces & GitHub Sync Engine',
        author: 'alex-dev',
        authorAvatar: 'https://avatars.githubusercontent.com/u/1021?v=4',
        status: 'open',
        createdAt: '3 hours ago',
        headBranch: 'feature/phase-4-cloud',
        baseBranch: 'main',
        additions: 840,
        deletions: 120,
        changedFiles: 18,
        reviewers: ['sarah-lead', 'chen-security'],
      },
      {
        id: 202,
        number: 41,
        title: 'fix(terminal): Node pty buffer overflow on heavy log streaming',
        author: 'sarah-lead',
        authorAvatar: 'https://avatars.githubusercontent.com/u/1022?v=4',
        status: 'merged',
        createdAt: 'Yesterday',
        headBranch: 'fix/terminal-pty-buf',
        baseBranch: 'main',
        additions: 45,
        deletions: 12,
        changedFiles: 3,
        reviewers: ['alex-dev'],
      },
    ];
  }

  // Issues
  public async getIssues(): Promise<GitHubIssue[]> {
    return [
      {
        id: 301,
        number: 89,
        title: 'Add support for custom Monaco language servers via LSP protocol',
        author: 'community-member',
        status: 'open',
        labels: [
          { name: 'enhancement', color: '#a2eeef' },
          { name: 'help wanted', color: '#008672' },
        ],
        createdAt: '2 days ago',
        commentsCount: 5,
        assignee: 'alex-dev',
      },
      {
        id: 302,
        number: 88,
        title: 'Dark theme high-contrast mode for accessible code inspection',
        author: 'sarah-lead',
        status: 'open',
        labels: [{ name: 'accessibility', color: '#1d76db' }],
        createdAt: '4 days ago',
        commentsCount: 2,
      },
    ];
  }

  // Actions Workflow Runs
  public async getActionRuns(): Promise<GitHubActionRun[]> {
    return [
      {
        id: 401,
        name: 'CI Build & Cross-Platform Tests',
        workflow: 'ci.yml',
        branch: 'main',
        status: 'completed',
        conclusion: 'success',
        createdAt: '10 mins ago',
        durationMs: 42000,
      },
      {
        id: 402,
        name: 'Electron Desktop Artifact Build',
        workflow: 'release-desktop.yml',
        branch: 'main',
        status: 'completed',
        conclusion: 'success',
        createdAt: '1 hour ago',
        durationMs: 180000,
      },
      {
        id: 403,
        name: 'Security Audit & Dependency Scan',
        workflow: 'security.yml',
        branch: 'feature/phase-4-cloud',
        status: 'completed',
        conclusion: 'success',
        createdAt: '2 hours ago',
        durationMs: 24000,
      },
    ];
  }
}

export const githubService = GitHubService.getInstance();
