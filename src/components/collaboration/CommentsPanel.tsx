import React, { useState, useEffect } from 'react';
import { 
  MessageSquarePlus, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Send, 
  X, 
  Check, 
  CornerDownRight, 
  FileText, 
  Code2,
  Filter,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceRole } from '../../types';

export interface CommentReply {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole?: WorkspaceRole;
  text: string;
  timestamp: number;
}

export interface CodeCommentThread {
  id: string;
  fileId?: string;
  filePath?: string;
  lineNumber?: number;
  highlightedText?: string;
  authorUid: string;
  authorName: string;
  authorRole?: WorkspaceRole;
  text: string;
  status: 'open' | 'resolved';
  timestamp: number;
  replies: CommentReply[];
}

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  filePath?: string;
  activeLineNumber?: number;
  selectedText?: string;
  threads: CodeCommentThread[];
  onAddThread: (thread: Omit<CodeCommentThread, 'id' | 'timestamp' | 'replies'>) => void;
  onAddReply: (threadId: string, replyText: string) => void;
  onToggleResolveThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  currentUid: string;
  userName: string;
  currentRole: WorkspaceRole;
}

export function CommentsPanel({
  isOpen,
  onClose,
  fileId,
  filePath,
  activeLineNumber,
  selectedText,
  threads = [],
  onAddThread,
  onAddReply,
  onToggleResolveThread,
  onDeleteThread,
  currentUid,
  userName,
  currentRole
}: CommentsPanelProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [newCommentText, setNewCommentText] = useState('');
  const [replyInputText, setReplyInputText] = useState<Record<string, string>>({});
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const filteredThreads = threads.filter(t => {
    if (filterStatus === 'open') return t.status === 'open';
    if (filterStatus === 'resolved') return t.status === 'resolved';
    return true;
  });

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    onAddThread({
      fileId,
      filePath: filePath || 'active-file',
      lineNumber: activeLineNumber,
      highlightedText: selectedText,
      authorUid: currentUid,
      authorName: userName || 'Collaborator',
      authorRole: currentRole,
      text: newCommentText.trim(),
      status: 'open'
    });

    setNewCommentText('');
  };

  const handleCreateReply = (threadId: string) => {
    const replyText = replyInputText[threadId];
    if (!replyText || !replyText.trim()) return;

    onAddReply(threadId, replyText.trim());
    setReplyInputText(prev => ({ ...prev, [threadId]: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-16 bottom-16 z-40 w-80 md:w-96 bg-slate-900 dark:bg-zinc-900 border border-slate-700/80 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
      {/* Header */}
      <div className="p-3 bg-slate-950/80 dark:bg-black/50 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <MessageSquarePlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold flex items-center gap-1.5">
              Code & Document Comments
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {threads.length} Threads
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {filePath || 'Workspace Level'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          {(['all', 'open', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2 py-0.5 rounded-lg capitalize text-[10px] font-bold transition-colors ${
                filterStatus === st
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Creation Form for selected line or code block */}
      <form onSubmit={handleCreateThread} className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            {activeLineNumber ? `Line ${activeLineNumber} Comment` : 'Add File Comment'}
          </span>
          {selectedText && (
            <span className="text-[10px] text-slate-400 italic truncate max-w-[140px]">
              "{selectedText.substring(0, 20)}..."
            </span>
          )}
        </div>

        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Ask a question, suggest a code change, or leave feedback..."
          className="w-full h-16 bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
        />

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Post Thread
          </button>
        </div>
      </form>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs custom-scrollbar">
        {filteredThreads.length === 0 ? (
          <div className="text-center text-slate-500 italic py-8 text-xs">
            No comment threads matching filter.
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isResolved = thread.status === 'resolved';

            return (
              <div
                key={thread.id}
                className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                  isResolved
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {/* Thread Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <span>{thread.authorName}</span>
                      {thread.authorRole && (
                        <span className="px-1 py-0.2 bg-slate-800 text-[9px] uppercase font-mono rounded text-slate-400">
                          {thread.authorRole}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(thread.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {thread.lineNumber && ` • Line ${thread.lineNumber}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleResolveThread(thread.id)}
                      title={isResolved ? 'Re-open thread' : 'Mark thread resolved'}
                      className={`p-1 rounded-md transition-colors ${
                        isResolved
                          ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    {(thread.authorUid === currentUid || currentRole === 'owner' || currentRole === 'admin') && (
                      <button
                        onClick={() => onDeleteThread(thread.id)}
                        title="Delete comment thread"
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Highlighted text callout */}
                {thread.highlightedText && (
                  <div className="p-1.5 bg-slate-900 border-l-2 border-amber-500 text-[11px] font-mono text-slate-300 truncate">
                    "{thread.highlightedText}"
                  </div>
                )}

                {/* Main comment body */}
                <p className={`text-xs leading-relaxed ${isResolved ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                  {thread.text}
                </p>

                {/* Replies list */}
                {thread.replies && thread.replies.length > 0 && (
                  <div className="pl-3 border-l-2 border-slate-800 space-y-2 pt-1">
                    {thread.replies.map((reply) => (
                      <div key={reply.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="font-bold text-slate-300">{reply.authorName}</span>
                          <span>• {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {!isResolved && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={replyInputText[thread.id] || ''}
                      onChange={(e) => setReplyInputText({ ...replyInputText, [thread.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateReply(thread.id);
                        }
                      }}
                      placeholder="Reply to thread..."
                      className="flex-1 bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCreateReply(thread.id)}
                      disabled={!replyInputText[thread.id]?.trim()}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 rounded-lg transition-colors"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CommentsPanel;
