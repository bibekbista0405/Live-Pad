import React, { useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  Plus, 
  Check, 
  Trash2, 
  Clock, 
  Folder, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceRole } from '../../types';

export interface StudyTask {
  id: string;
  title: string;
  assignedTo?: string;
  completed: boolean;
  createdAt: number;
}

interface StudyGroupViewProps {
  role?: WorkspaceRole;
  currentRole?: WorkspaceRole;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  tasks?: StudyTask[];
  onAddTask?: (title: string, assignedTo?: string) => void;
  onToggleTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  activeTab?: 'notes' | 'tasks' | 'discussion' | 'files';
  onTabChange?: (tab: 'notes' | 'tasks' | 'discussion' | 'files') => void;
}

export const StudyGroupView: React.FC<StudyGroupViewProps> = ({
  role = 'member',
  currentRole = role,
  tasks = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  activeTab = 'notes',
  onTabChange
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !onAddTask) return;
    onAddTask(newTaskTitle.trim());
    setNewTaskTitle('');
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col gap-3 p-3 bg-amber-50/50 dark:bg-zinc-900/60 rounded-2xl border border-amber-200/60 dark:border-zinc-800">
      {/* Group Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white dark:bg-zinc-800 rounded-xl border border-amber-200/50 dark:border-zinc-700/60">
        <div className="flex items-center gap-2">
          <span className="text-xl">👨‍🎓</span>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Study Group Workspace
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Equal collaboration & peer task division
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        {onTabChange && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg">
            {[
              { id: 'notes', label: 'Shared Notes', icon: BookOpen },
              { id: 'tasks', label: `Tasks (${completedCount}/${tasks.length})`, icon: CheckSquare },
              { id: 'files', label: 'Vault', icon: Paperclip }
            ].map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm'
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
      </div>

      {/* Task Checklist Panel (shown when 'tasks' tab active or expanded) */}
      {activeTab === 'tasks' && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white dark:bg-zinc-800/90 rounded-xl border border-amber-200/50 dark:border-zinc-700/60 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Group Task Checklist
            </h4>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {completedCount} of {tasks.length} completed
            </span>
          </div>

          {/* New Task Input */}
          <form onSubmit={handleCreateTask} className="flex items-center gap-2">
            <input 
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a new study task (e.g. Read Chapter 4, Draft Intro...)"
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </form>

          {/* Task List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic py-2 text-center">
                No tasks added yet. Create your first group task above!
              </p>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800 text-xs hover:border-amber-300 transition-colors"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input 
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask && onToggleTask(task.id)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className={`text-slate-800 dark:text-zinc-200 ${task.completed ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
                      {task.title}
                    </span>
                  </label>

                  {onDeleteTask && (
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200/50 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudyGroupView;
