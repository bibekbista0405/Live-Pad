import { useState, useEffect } from 'react';
import { Users, Eye, MessageSquarePlus, Radio } from 'lucide-react';
import { collaborationEngine, RemoteCollaborator } from '../../services/collaborationEngine';

export function LiveSessionBar({ onOpenComments }: { onOpenComments?: () => void }) {
  const [collaborators, setCollaborators] = useState<RemoteCollaborator[]>([]);
  const [presenter, setPresenter] = useState<RemoteCollaborator | undefined>();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    updateData();
    const unsubscribe = collaborationEngine.subscribe(() => {
      updateData();
    });
    return () => unsubscribe();
  }, []);

  const updateData = () => {
    setCollaborators(collaborationEngine.getCollaborators());
    setPresenter(collaborationEngine.getPresenter());
  };

  const toggleFollowPresenter = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="bg-[#181818] border-b border-[#2d2d2d] px-3 py-1.5 flex items-center justify-between text-xs font-sans text-slate-300 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider">Live Collab Session</span>
        </div>

        {/* Collaborators Avatars */}
        <div className="flex items-center -space-x-1.5">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="relative group cursor-pointer"
              title={`${c.name} (${c.activeFilePath || 'Idle'})`}
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="w-5 h-5 rounded-full border-2 object-cover"
                style={{ borderColor: c.color }}
              />
              <span
                className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full border border-[#181818] ${
                  c.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {presenter && (
          <button
            onClick={toggleFollowPresenter}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isFollowing
                ? 'bg-purple-600 text-white'
                : 'bg-[#252526] hover:bg-[#333333] text-slate-300 border border-[#333333]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{isFollowing ? 'Following ' + presenter.name.split(' ')[0] : 'Follow Presenter'}</span>
          </button>
        )}

        <button
          onClick={onOpenComments}
          className="px-2 py-0.5 bg-[#252526] hover:bg-[#333333] border border-[#333333] text-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <MessageSquarePlus className="w-3 h-3 text-cyan-400" />
          <span>Live Comment</span>
        </button>
      </div>
    </div>
  );
}
