import { GitHubRepository, GitHubPullRequest, GitHubIssue, GitHubActionRun } from '../types/phase4';
import { Platform } from '../platform';

const API = 'https://api.github.com';

interface GitHubUser { login: string; avatar_url: string; name: string | null; }

export class GitHubService {
  private static instance: GitHubService;
  private token: string | null = null;
  private user: { login: string; avatarUrl: string; name: string } | null = null;
  private repositoriesCache: { value: GitHubRepository[]; expiresAt: number } | null = null;

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) GitHubService.instance = new GitHubService();
    return GitHubService.instance;
  }

  public async init() {
    const savedToken = await Platform.getNativeStorage('livepad_github_token');
    if (typeof savedToken !== 'string' || !savedToken.trim()) return;
    this.token = savedToken;
    try {
      await this.refreshUser();
    } catch {
      this.token = null;
      this.user = null;
      await Platform.setNativeStorage('livepad_github_token', null);
    }
  }

  public isAuthenticated(): boolean { return !!this.token && !!this.user; }

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    if (!this.token) throw new Error('Connect a GitHub account first.');
    const response = await fetch(`${API}${endpoint}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.headers || {}),
      },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`GitHub API ${response.status}: ${body || response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  private async refreshUser() {
    const user = await this.request<GitHubUser>('/user');
    this.user = { login: user.login, avatarUrl: user.avatar_url, name: user.name || user.login };
  }

  /** Accepts a GitHub fine-grained/classic PAT supplied by the user; no fake credentials are ever generated. */
  public async loginWithGitHub(token: string): Promise<boolean> {
    if (!token?.trim()) throw new Error('A GitHub personal access token is required.');
    this.token = token.trim();
    try {
      await this.refreshUser();
      await Platform.setNativeStorage('livepad_github_token', this.token);
      return true;
    } catch (error) {
      this.token = null;
      this.user = null;
      throw error;
    }
  }

  public async logout() {
    this.token = null;
    this.user = null;
    await Platform.setNativeStorage('livepad_github_token', null);
  }

  public getUser() { return this.user; }

  public async getRepositories(): Promise<GitHubRepository[]> {
    if (this.repositoriesCache && this.repositoriesCache.expiresAt > Date.now()) return this.repositoriesCache.value;
    const repos = await this.request<Array<Record<string, any>>>('/user/repos?sort=updated&per_page=50');
    const mapped = repos.map((repo) => ({
      id: repo.id, name: repo.name, fullName: repo.full_name, owner: repo.owner?.login || '',
      avatarUrl: repo.owner?.avatar_url || '', isPrivate: !!repo.private, description: repo.description || '',
      starsCount: repo.stargazers_count || 0, forksCount: repo.forks_count || 0, openIssuesCount: repo.open_issues_count || 0,
      defaultBranch: repo.default_branch || 'main', cloneUrl: repo.clone_url || repo.html_url, updatedAt: repo.updated_at || '',
    }));
    this.repositoriesCache = { value: mapped, expiresAt: Date.now() + 30_000 };
    return mapped;
  }

  public async getPullRequests(): Promise<GitHubPullRequest[]> {
    const repos = await this.getRepositories();
    const prs: GitHubPullRequest[] = [];
    for (const repo of repos.slice(0, 5)) {
      const items = await this.request<Array<Record<string, any>>>(`/repos/${encodeURIComponent(repo.fullName)}/pulls?state=all&per_page=10`);
      for (const pr of items) {
        const detail = await this.request<Record<string, any>>(`/repos/${encodeURIComponent(repo.fullName)}/pulls/${pr.number}`);
        prs.push({
          id: pr.id, number: pr.number, title: pr.title, author: pr.user?.login || 'unknown', authorAvatar: pr.user?.avatar_url || '',
          status: pr.merged_at ? 'merged' : pr.state === 'open' ? 'open' : 'closed', createdAt: pr.created_at || '',
          headBranch: pr.head?.ref || '', baseBranch: pr.base?.ref || '', additions: detail.additions || 0, deletions: detail.deletions || 0,
          changedFiles: detail.changed_files || 0, reviewers: (detail.requested_reviewers || []).map((r: any) => r.login),
        });
      }
    }
    return prs;
  }

  public async getIssues(): Promise<GitHubIssue[]> {
    const repos = await this.getRepositories();
    const issues: GitHubIssue[] = [];
    for (const repo of repos.slice(0, 5)) {
      const items = await this.request<Array<Record<string, any>>>(`/repos/${encodeURIComponent(repo.fullName)}/issues?state=all&per_page=20`);
      issues.push(...items.filter((issue) => !issue.pull_request).map((issue) => ({
        id: issue.id, number: issue.number, title: issue.title, author: issue.user?.login || 'unknown',
        status: issue.state === 'open' ? 'open' : 'closed', labels: (issue.labels || []).map((label: any) => ({ name: label.name, color: `#${label.color || '888888'}` })),
        createdAt: issue.created_at || '', commentsCount: issue.comments || 0, assignee: issue.assignee?.login,
      })));
    }
    return issues;
  }

  public async getActionRuns(): Promise<GitHubActionRun[]> {
    const repos = await this.getRepositories();
    const runs: GitHubActionRun[] = [];
    for (const repo of repos.slice(0, 5)) {
      const result = await this.request<{ workflow_runs: Array<Record<string, any>> }>(`/repos/${encodeURIComponent(repo.fullName)}/actions/runs?per_page=20`);
      runs.push(...result.workflow_runs.map((run) => ({
        id: run.id, name: run.name || run.display_title || 'Workflow run', workflow: run.path || '', branch: run.head_branch || '',
        status: run.status === 'completed' ? 'completed' : run.status === 'queued' ? 'queued' : 'in_progress',
        conclusion: run.conclusion === 'success' || run.conclusion === 'failure' || run.conclusion === 'cancelled' || run.conclusion === 'neutral' ? run.conclusion : null,
        createdAt: run.created_at || '', durationMs: run.run_started_at && run.updated_at ? Math.max(0, new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) : 0,
      })));
    }
    return runs;
  }
}

export const githubService = GitHubService.getInstance();
