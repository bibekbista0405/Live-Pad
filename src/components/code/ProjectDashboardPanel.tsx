import { useState } from 'react';
import { Kanban, MessageSquare, BarChart3, Plus, Send } from 'lucide-react';
import { ProjectTask, ChatMessage } from '../../types/phase4';

export function ProjectDashboardPanel() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'chat' | 'analytics'>('kanban');

  // Kanban tasks state
  const [tasks, setTasks] = useState<ProjectTask[]>([
    {
      id: 'task-1',
      title: 'Implement Phase 4 Cloud Workspaces',
      description: 'Add hybrid sync engine and version snapshots',
      status: 'in_progress',
      priority: 'urgent',
      assignee: 'Alex Rivera',
      tags: ['cloud', 'storage'],
      subtasks: [
        { id: 'st-1', title: 'Local storage caching', completed: true },
        { id: 'st-2', title: 'Firestore trigger sync', completed: true },
      ],
    },
    {
      id: 'task-2',
      title: 'GitHub Pull Request Inline Reviews',
      description: 'Support commenting on specific diff lines in Monaco editor',
      status: 'todo',
      priority: 'high',
      assignee: 'Sarah Chen',
      tags: ['github', 'editor'],
      subtasks: [{ id: 'st-3', title: 'Diff line hover widget', completed: false }],
    },
    {
      id: 'task-3',
      title: 'Multi-device cursor presence sync',
      description: 'Broadcast active file and cursor positions via Firestore',
      status: 'done',
      priority: 'medium',
      assignee: 'Devon Vance',
      tags: ['collaboration', 'presence'],
      subtasks: [{ id: 'st-4', title: 'Presence broadcast timer', completed: true }],
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Chat messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      channelId: 'dev-team',
      senderName: 'Sarah Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      timestamp: Date.now() - 3600000,
      content: 'Phase 4 architecture services look solid. Ready for deployment testing.',
    },
    {
      id: 'msg-2',
      channelId: 'dev-team',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      timestamp: Date.now() - 1800000,
      content: 'I verified the Granular Permission Service matrix with owner/developer roles.',
    },
  ]);

  const [chatInput, setChatInput] = useState('');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: 'User created task',
      status: 'todo',
      priority: 'medium',
      tags: ['feature'],
      subtasks: [],
    };
    setTasks([...tasks, task]);
    setNewTaskTitle('');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: 'dev-team',
      senderName: 'You (Developer)',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      timestamp: Date.now(),
      content: chatInput.trim(),
    };
    setMessages([...messages, msg]);
    setChatInput('');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Kanban className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Project Dashboard & Team Planning</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2d2d2d] bg-[#252526] text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'kanban' ? 'border-emerald-400 text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Kanban</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'chat' ? 'border-emerald-400 text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Team Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'analytics' ? 'border-emerald-400 text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'kanban' && (
          <div className="space-y-3">
            {/* Quick Add Task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New project task..."
                className="flex-1 bg-[#252526] border border-[#333333] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleAddTask}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskStatus(task.id)}
                  className="p-3 bg-[#252526] rounded border border-[#333333] hover:border-[#444444] cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{task.title}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        task.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : task.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-[#333333] text-slate-300'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#858585]">{task.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#666666] pt-1">
                    <span>Assignee: {task.assignee || 'Unassigned'}</span>
                    <span className="uppercase text-amber-400 font-bold">{task.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col justify-between space-y-2">
            <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
              {messages.map((msg) => (
                <div key={msg.id} className="p-2.5 bg-[#252526] rounded border border-[#333333] space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={msg.senderAvatar} alt={msg.senderName} className="w-4 h-4 rounded-full object-cover" />
                      <span className="font-bold text-xs text-white">{msg.senderName}</span>
                    </div>
                    <span className="text-[9px] text-[#858585]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-6">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2d2d2d]">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Message #dev-team channel..."
                className="flex-1 bg-[#252526] border border-[#333333] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleSendMessage}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#252526] rounded border border-[#333333] space-y-1">
              <div className="text-[#858585]">Total Lines of Code</div>
              <div className="text-xl font-bold text-white font-mono">14,280 LOC</div>
            </div>
            <div className="p-3 bg-[#252526] rounded border border-[#333333] space-y-1">
              <div className="text-[#858585]">Active Contributors</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">4 Engineers</div>
            </div>
            <div className="p-3 bg-[#252526] rounded border border-[#333333] space-y-1">
              <div className="text-[#858585]">Languages Breakdown</div>
              <div className="text-xs font-mono text-slate-300 pt-1 space-y-1">
                <div>TypeScript — 78%</div>
                <div>React / TSX — 18%</div>
                <div>JSON / Shell — 4%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
