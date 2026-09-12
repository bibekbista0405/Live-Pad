import { Users, MessageSquarePlus, Radio } from 'lucide-react';
import { UserPresence } from '../../types';

interface LiveSessionBarProps {
  activeUsers: UserPresence[];
  isTeacher?: boolean;
  onOpenComments?: () => void;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (parts[0]?.slice(0, 2) || 'U').toUpperCase();
}

export function LiveSessionBar({ activeUsers, isTeacher = false, onOpenComments }: LiveSessionBarProps) {
  const visibleUsers = activeUsers.filter((user) => user?.uid && user?.name).slice(0, 6);
  const onlineCount = activeUsers.filter((user) => user?.isOnline).length;

  return (
    <div className="livepad-live-session-bar shrink-0 border-b px-3 py-1.5 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center gap-1.5 font-semibold shrink-0">
          <Radio className="w-3.5 h-3.5" />
          {isTeacher ? 'Teaching live' : 'Live session'}
        </span>
        <span className="hidden sm:inline text-white/35">·</span>
        <span className="hidden sm:inline text-white/45 truncate">{onlineCount} online</span>
        <div className="flex items-center -space-x-1.5 shrink-0" aria-label="People in this workspace">
          {visibleUsers.map((user) => (
            <span
              key={user.uid}
              title={`${user.name}${user.role ? ` · ${user.role}` : ''}`}
              className="w-6 h-6 rounded-full border-2 border-[#181818] flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: user.color || '#475569' }}
            >
              {initials(user.name)}
            </span>
          ))}
          {activeUsers.length > visibleUsers.length && (
            <span className="w-6 h-6 rounded-full border-2 border-[#181818] bg-white/10 text-white/55 flex items-center justify-center text-[8px] font-semibold">
              +{activeUsers.length - visibleUsers.length}
            </span>
          )}
          {visibleUsers.length === 0 && (
            <span className="inline-flex items-center gap-1 text-white/35"><Users className="w-3 h-3" /> Waiting for participants</span>
          )}
        </div>
      </div>

      {onOpenComments && (
        <button
          type="button"
          onClick={onOpenComments}
          className="livepad-live-session-comment-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-semibold shrink-0"
        >
          <MessageSquarePlus className="w-3 h-3" />
          Discuss code
        </button>
      )}
    </div>
  );
}

export default LiveSessionBar;
