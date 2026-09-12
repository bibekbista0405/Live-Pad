import React, { memo } from 'react';
import {
  Files,
  Search,
  Bug,
  FlaskConical,
  MessageSquare,
  Mic,
  MessageCircleCode,
  GraduationCap,
  Trash2,
  Settings,
  FolderGit2,
  BookOpen
} from 'lucide-react';

export type ActivityBarTab = 'explorer' | 'search' | 'git' | 'run' | 'testing' | 'extensions' | 'ai' | 'trash' | 'chat' | 'voice' | 'comments' | 'outline' | 'tasks' | 'cloud' | 'github' | 'admin' | 'knowledge' | 'dashboard';

type LearningRole = 'teacher' | 'student' | 'peer';

interface ActivityBarProps {
  activeTab: ActivityBarTab;
  onSelectTab: (tab: ActivityBarTab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings?: () => void;
  onOpenProjects?: () => void;
  unreadNotificationsCount?: number;
  unreadChatCount?: number;
  learningRole?: LearningRole;
}

const primaryTabs: Array<{ id: ActivityBarTab; label: string; icon: React.ElementType; title: string }> = [
  { id: 'explorer', label: 'Files', icon: Files, title: 'Files & project' },
  { id: 'knowledge', label: 'Learn', icon: BookOpen, title: 'Lessons & learning' },
  { id: 'run', label: 'Run', icon: Bug, title: 'Run your code' },
  { id: 'testing', label: 'Check', icon: FlaskConical, title: 'Checks & tests' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, title: 'Learn together' },
  { id: 'comments', label: 'Discuss', icon: MessageCircleCode, title: 'Discuss code' },
];

const teacherTabs: Array<{ id: ActivityBarTab; label: string; icon: React.ElementType; title: string }> = [
  { id: 'admin', label: 'Class', icon: GraduationCap, title: 'Class controls & members' },
];

export function ActivityBar({
  activeTab,
  onSelectTab,
  isSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenProjects,
  unreadNotificationsCount = 0,
  unreadChatCount = 0,
  learningRole = 'peer'
}: ActivityBarProps) {
  const handleClick = (tab: ActivityBarTab) => {
    if (activeTab === tab && isSidebarOpen) onToggleSidebar();
    else {
      onSelectTab(tab);
      if (!isSidebarOpen) onToggleSidebar();
    }
  };

  const renderTab = (item: typeof primaryTabs[number]) => {
    const Icon = item.icon;
    const active = activeTab === item.id && isSidebarOpen;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleClick(item.id)}
        className={`livepad-code-activity-btn relative w-full h-10 flex items-center justify-center transition-colors cursor-pointer ${active ? 'is-active' : ''}`}
        title={`${item.title}${item.id === 'search' ? ' (Ctrl+Shift+F)' : ''}`}
        aria-label={item.title}
        aria-pressed={active}
      >
        {active && <div className="livepad-code-activity-indicator absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" />}
        <Icon className="w-[18px] h-[18px] stroke-[1.7]" />
        {item.id === 'chat' && unreadChatCount > 0 && !active && (
          <span className="absolute top-1 right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-cyan-500 text-white text-[8px] font-bold flex items-center justify-center">
            {unreadChatCount > 9 ? '9+' : unreadChatCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="livepad-code-activity w-11 shrink-0 flex flex-col items-center justify-between py-2 select-none z-30 border-r border-white/[0.04]">
      <div className="flex flex-col items-center w-full gap-0.5">
        {primaryTabs.map(renderTab)}

        {learningRole === 'teacher' && (
          <>
            <div className="w-5 h-px bg-white/[0.08] my-2" />
            <div className="w-full px-1.5 mb-1 text-[7px] uppercase tracking-[0.14em] text-white/25 text-center">Lead</div>
            {teacherTabs.map(renderTab)}
          </>
        )}
      </div>

      <div className="flex flex-col items-center w-full gap-0.5">
        {onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            className="w-full h-9 flex items-center justify-center text-white/35 hover:text-white/75 transition-colors cursor-pointer"
            title="Projects"
            aria-label="Projects"
          >
            <FolderGit2 className="w-[17px] h-[17px] stroke-[1.7]" />
          </button>
        )}
        <button
          type="button"
          onClick={() => handleClick('trash')}
          className={`w-full h-9 flex items-center justify-center transition-colors cursor-pointer ${activeTab === 'trash' && isSidebarOpen ? 'text-white' : 'text-white/25 hover:text-white/65'}`}
          title="Deleted files"
          aria-label="Deleted files"
        >
          <Trash2 className="w-[16px] h-[16px] stroke-[1.7]" />
        </button>
      </div>
    </div>
  );
}

export default memo(ActivityBar);
