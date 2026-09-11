import React, { memo } from 'react';
import {
  Files,
  Search,
  GitBranch,
  Play,
  Blocks,
  Sparkles,
  Settings,
  Bell,
  User,
  Trash2,
  FolderGit2,
  MessageSquare,
  Mic,
  MessageCircleCode,
  FlaskConical,
  Bug,
  Code2,
  Cpu
} from 'lucide-react';

export type ActivityBarTab = 'explorer' | 'search' | 'git' | 'run' | 'testing' | 'extensions' | 'ai' | 'trash' | 'chat' | 'voice' | 'comments' | 'outline' | 'tasks' | 'cloud' | 'github' | 'admin' | 'knowledge' | 'dashboard';

interface ActivityBarProps {
  activeTab: ActivityBarTab;
  onSelectTab: (tab: ActivityBarTab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings?: () => void;
  onOpenProjects?: () => void;
  unreadNotificationsCount?: number;
  unreadChatCount?: number;
}

export function ActivityBar({
  activeTab,
  onSelectTab,
  isSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenProjects,
  unreadNotificationsCount = 0,
  unreadChatCount = 0
}: ActivityBarProps) {
  const handleClick = (tab: ActivityBarTab) => {
    if (activeTab === tab && isSidebarOpen) {
      onToggleSidebar();
    } else {
      onSelectTab(tab);
      if (!isSidebarOpen) onToggleSidebar();
    }
  };

  return (
    <div className="w-[52px] shrink-0 bg-[#181818] border-r border-[#252526] flex flex-col items-center justify-between py-1 select-none z-30">
      {/* Top Main Navigation Icons */}
      <div className="flex flex-col items-center w-full">
        <button
          type="button"
          onClick={() => handleClick('explorer')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'explorer' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Explorer (Ctrl+Shift+E)"
        >
          {activeTab === 'explorer' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Files className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('search')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'search' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Search in Workspace (Ctrl+Shift+F)"
        >
          {activeTab === 'search' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Search className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('git')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'git' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Source Control / Git (Ctrl+Shift+G)"
        >
          {activeTab === 'git' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <GitBranch className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('run')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'run' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Run & Debug (Ctrl+Shift+D)"
        >
          {activeTab === 'run' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Bug className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('testing')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'testing' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Test Explorer & Coverage"
        >
          {activeTab === 'testing' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <FlaskConical className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('extensions')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'extensions' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Extensions Marketplace (Ctrl+Shift+X)"
        >
          {activeTab === 'extensions' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Blocks className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('outline')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'outline' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Outline & Symbols View"
        >
          {activeTab === 'outline' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Code2 className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('tasks')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'tasks' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Tasks & Build Runner"
        >
          {activeTab === 'tasks' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Cpu className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('ai')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'ai' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="AI Assistant & Copilot (Ctrl+I)"
        >
          {activeTab === 'ai' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Sparkles className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('chat')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'chat' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Team Chat"
        >
          {activeTab === 'chat' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <div className="relative">
            <MessageSquare className="w-6 h-6 stroke-[1.5]" />
            {unreadChatCount > 0 && !(activeTab === 'chat' && isSidebarOpen) && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full border border-rose-600 animate-bounce min-w-[15px] h-[15px] flex items-center justify-center leading-none">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleClick('voice')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'voice' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Voice Channel"
        >
          {activeTab === 'voice' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Mic className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('comments')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'comments' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Code Comments & Threads"
        >
          {activeTab === 'comments' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <MessageCircleCode className="w-6 h-6 stroke-[1.5]" />
        </button>

        <button
          type="button"
          onClick={() => handleClick('trash')}
          className={`relative w-full h-12 flex items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'trash' && isSidebarOpen
              ? 'text-white bg-[#252526]'
              : 'text-[#858585] hover:text-white'
          }`}
          title="Recycle Bin / Trashed Files"
        >
          {activeTab === 'trash' && isSidebarOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />
          )}
          <Trash2 className="w-6 h-6 stroke-[1.5]" />
        </button>
      </div>

      {/* Bottom Utility Icons */}
      <div className="flex flex-col items-center w-full">
        {onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            className="w-full h-12 flex items-center justify-center text-[#858585] hover:text-white transition-colors cursor-pointer"
            title="Manage Projects"
          >
            <FolderGit2 className="w-6 h-6 stroke-[1.5]" />
          </button>
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full h-12 flex items-center justify-center text-[#858585] hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-6 h-6 stroke-[1.5]" />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ActivityBar);
