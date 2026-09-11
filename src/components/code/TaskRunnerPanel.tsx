import React, { useState, useEffect } from 'react';
import { Play, Square, Terminal as TerminalIcon, CheckCircle2, AlertCircle, RefreshCw, Cpu, Layers } from 'lucide-react';
import { taskRunnerService, TaskDefinition, TaskRunState } from '../../services/taskRunnerService';

interface TaskRunnerPanelProps {
  projectPath?: string;
}

export function TaskRunnerPanel({ projectPath = '.' }: TaskRunnerPanelProps) {
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<TaskRunState | null>(null);

  useEffect(() => {
    taskRunnerService.discoverTasks(projectPath).then(setTasks);
  }, [projectPath]);

  useEffect(() => {
    if (!activeTaskId) return;
    const unsub = taskRunnerService.onTaskStateChange(activeTaskId, (state) => {
      setActiveState({ ...state });
    });
    return () => {
      unsub();
    };
  }, [activeTaskId]);

  const handleRunTask = async (task: TaskDefinition) => {
    setActiveTaskId(task.id);
    const state = await taskRunnerService.runTask(task.id, projectPath);
    setActiveState(state);
  };

  const handleStopTask = async (taskId: string) => {
    await taskRunnerService.killTask(taskId);
    if (activeTaskId === taskId) {
      setActiveState(taskRunnerService.getTaskState(taskId) || null);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#007acc]" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Tasks & Build System</span>
        </div>
        <button
          onClick={() => taskRunnerService.discoverTasks(projectPath).then(setTasks)}
          className="p-1 text-[#858585] hover:text-white rounded hover:bg-[#333333] transition-colors"
          title="Refresh tasks"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Split: Task List & Output Log */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Task Cards */}
        <div className="p-2 border-b border-[#2d2d2d] bg-[#181818] grid grid-cols-2 gap-2 shrink-0">
          {tasks.map((task) => {
            const state = taskRunnerService.getTaskState(task.id);
            const isRunning = state?.status === 'running';

            return (
              <div
                key={task.id}
                className={`p-2.5 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                  activeTaskId === task.id
                    ? 'bg-[#252526] border-[#007acc]'
                    : 'bg-[#212121] border-[#333333] hover:border-[#444444]'
                }`}
                onClick={() => {
                  setActiveTaskId(task.id);
                  setActiveState(state || null);
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Layers className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                  <div className="truncate">
                    <div className="font-medium text-xs text-white truncate">{task.name}</div>
                    <div className="text-[10px] text-[#858585] font-mono truncate">{task.command}</div>
                  </div>
                </div>

                <div>
                  {isRunning ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStopTask(task.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded cursor-pointer"
                      title="Stop Task"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunTask(task);
                      }}
                      className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded cursor-pointer"
                      title="Run Task"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Console Logs */}
        <div className="flex-1 bg-[#181818] p-3 font-mono text-xs overflow-y-auto space-y-1">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2a2a] mb-2 text-[#858585]">
            <div className="flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>Task Execution Console</span>
            </div>
            {activeState && (
              <div className="flex items-center gap-1.5 text-[11px]">
                {activeState.status === 'running' && <span className="text-amber-400 animate-pulse">Running...</span>}
                {activeState.status === 'completed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed</span>}
                {activeState.status === 'failed' && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Failed</span>}
              </div>
            )}
          </div>

          {activeState && activeState.logs.length > 0 ? (
            activeState.logs.map((log, idx) => (
              <pre key={idx} className="whitespace-pre-wrap text-slate-300">
                {log}
              </pre>
            ))
          ) : (
            <div className="text-[#656565] italic py-8 text-center">
              Select or run a task above to stream build output & logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
