import { Platform } from '../platform';

export interface TaskDefinition {
  id: string;
  name: string;
  command: string;
  category: 'build' | 'test' | 'run' | 'watch' | 'clean' | 'deploy' | 'custom';
  source: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'system';
}

export interface TaskRunState {
  taskId: string;
  processId?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: string[];
  exitCode?: number;
}

export class TaskRunnerService {
  private static instance: TaskRunnerService;
  private tasks: TaskDefinition[] = [];
  private taskStates = new Map<string, TaskRunState>();
  private activeListeners = new Map<string, (state: TaskRunState) => void>();

  public static getInstance(): TaskRunnerService {
    if (!TaskRunnerService.instance) {
      TaskRunnerService.instance = new TaskRunnerService();
    }
    return TaskRunnerService.instance;
  }

  // Discover tasks from package.json or project directory
  public async discoverTasks(projectPath?: string): Promise<TaskDefinition[]> {
    const discovered: TaskDefinition[] = [];

    // Default System Tasks
    discovered.push(
      { id: 'task-build', name: 'npm run build', command: 'npm run build', category: 'build', source: 'npm' },
      { id: 'task-test', name: 'npm test', command: 'npm test', category: 'test', source: 'npm' },
      { id: 'task-dev', name: 'npm run dev', command: 'npm run dev', category: 'run', source: 'npm' },
      { id: 'task-lint', name: 'npm run lint', command: 'npm run clean', category: 'clean', source: 'npm' }
    );

    if (projectPath) {
      try {
        const pkgData = await Platform.readFile(`${projectPath}/package.json`);
        if (pkgData) {
          const parsed = JSON.parse(pkgData.content);
          if (parsed.scripts) {
            Object.keys(parsed.scripts).forEach((scriptKey) => {
              const cmd = `npm run ${scriptKey}`;
              let cat: TaskDefinition['category'] = 'custom';
              if (scriptKey.includes('build')) cat = 'build';
              else if (scriptKey.includes('test')) cat = 'test';
              else if (scriptKey.includes('dev') || scriptKey.includes('start')) cat = 'run';
              else if (scriptKey.includes('lint') || scriptKey.includes('clean')) cat = 'clean';

              discovered.push({
                id: `pkg-${scriptKey}`,
                name: `npm: ${scriptKey}`,
                command: cmd,
                category: cat,
                source: 'npm',
              });
            });
          }
        }
      } catch {
        // Fallback to default
      }
    }

    this.tasks = discovered;
    return this.tasks;
  }

  // Execute Task
  public async runTask(taskId: string, cwd?: string, onLog?: (log: string) => void): Promise<TaskRunState> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task '${taskId}' not found`);
    }

    const state: TaskRunState = {
      taskId,
      status: 'running',
      logs: [`[Task Runner] Starting '${task.name}' (${task.command})...\n`],
    };

    this.taskStates.set(taskId, state);

    try {
      const res = await Platform.executeCommand(task.command, cwd);
      state.processId = res.processId;

      const outputSub = Platform.onTerminalOutput((data) => {
        if (data.processId === res.processId) {
          state.logs.push(data.data);
          if (onLog) onLog(data.data);
          const listener = this.activeListeners.get(taskId);
          if (listener) listener({ ...state });
        }
      });

      const exitSub = Platform.onTerminalExit((data) => {
        if (data.processId === res.processId) {
          state.status = data.code === 0 ? 'completed' : 'failed';
          state.exitCode = data.code;
          state.logs.push(`\n[Task Runner] Task exited with code ${data.code}\n`);
          outputSub();
          exitSub();
          const listener = this.activeListeners.get(taskId);
          if (listener) listener({ ...state });
        }
      });
    } catch (e: any) {
      state.status = 'failed';
      state.logs.push(`\n[Task Runner Error] ${e.message}\n`);
    }

    return state;
  }

  // Kill running task process
  public async killTask(taskId: string): Promise<boolean> {
    const state = this.taskStates.get(taskId);
    if (state && state.processId) {
      await Platform.killProcess(state.processId);
      state.status = 'failed';
      state.logs.push('\n[Task Runner] Task terminated by user.\n');
      return true;
    }
    return false;
  }

  public getTaskState(taskId: string): TaskRunState | undefined {
    return this.taskStates.get(taskId);
  }

  public onTaskStateChange(taskId: string, callback: (state: TaskRunState) => void) {
    this.activeListeners.set(taskId, callback);
    return () => this.activeListeners.delete(taskId);
  }
}

export const taskRunnerService = TaskRunnerService.getInstance();
