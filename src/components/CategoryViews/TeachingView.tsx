import React, { useState } from 'react';
import { 
  Users, 
  Hand, 
  Lock, 
  Unlock, 
  VolumeX, 
  Volume2, 
  Tv, 
  HelpCircle, 
  CheckCircle2, 
  MessageSquare, 
  ShieldAlert, 
  Plus, 
  BarChart3, 
  UserCheck, 
  Clock, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPresence, WorkspaceRole } from '../../types';
import { canPerformAction } from '../../utils/workspaceCategories';

interface TeachingViewProps {
  role?: WorkspaceRole;
  currentRole?: WorkspaceRole;
  activeUsers?: UserPresence[];
  currentTitle?: string;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  codeLanguage?: string;
  onChangeCodeLanguage?: (lang: string) => void;
  editingLocked?: boolean;
  onToggleEditingLock?: () => void;
  onMuteStudent?: (uid: string) => void;
  onGrantSpeaking?: (uid: string) => void;
  onRaiseHand?: () => void;
  handRaised?: boolean;
  raisedHandsQueue?: { uid: string; name: string; timestamp: number }[];
  onLowerHand?: (uid: string) => void;
  onStartQuiz?: (question: string, options: string[]) => void;
  activeQuiz?: { question: string; options: string[]; responses: Record<string, number> };
  onRespondQuiz?: (optionIndex: number) => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
}

export const TeachingView: React.FC<TeachingViewProps> = ({
  role = 'teacher',
  currentRole = role,
  activeUsers = [],
  editingLocked = false,
  onToggleEditingLock = () => {},
  onMuteStudent,
  onGrantSpeaking,
  onRaiseHand,
  handRaised = false,
  raisedHandsQueue = [],
  onLowerHand,
  onStartQuiz,
  activeQuiz,
  onRespondQuiz,
  isPresentationMode = false,
  onTogglePresentationMode
}) => {
  const activeRole = currentRole || role;
  const isTeacher = activeRole === 'teacher' || activeRole === 'admin' || activeRole === 'instructor';
  const isAssistant = (activeRole as string) === 'assistant_teacher' || (activeRole as string) === 'ta';
  const isStudent = activeRole === 'student' || activeRole === 'learner';

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['Option A', 'Option B', 'Option C']);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizQuestion.trim() || !onStartQuiz) return;
    onStartQuiz(quizQuestion.trim(), quizOptions.filter(o => o.trim()));
    setShowQuizModal(false);
    setQuizQuestion('');
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
      {/* Top Banner / Teacher Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Teaching Session Controls
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-medium">
                Role: {currentRole}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isTeacher ? 'Manage classroom permissions, lock editor, or launch quick quizzes.' : 'Follow the lesson, submit questions, or raise your hand.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lock Editing Toggle (Teacher only) */}
          {(isTeacher || isAssistant) && (
            <button
              onClick={onToggleEditingLock}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                editingLocked 
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400' 
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
              }`}
            >
              {editingLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {editingLocked ? 'Editor Locked' : 'Editor Unlocked'}
            </button>
          )}

          {/* Presentation Mode Toggle */}
          {onTogglePresentationMode && (
            <button
              onClick={onTogglePresentationMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                isPresentationMode
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-600'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              {isPresentationMode ? 'Exit Presentation' : 'Presentation Mode'}
            </button>
          )}

          {/* Teacher Launch Quiz */}
          {(isTeacher || isAssistant) && (
            <button
              onClick={() => setShowQuizModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Launch Quiz / Poll
            </button>
          )}

          {/* Student Raise Hand */}
          {isStudent && onRaiseHand && (
            <button
              onClick={onRaiseHand}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                handRaised 
                  ? 'bg-amber-500 text-white animate-pulse' 
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              {handRaised ? 'Hand Raised 🙋' : 'Raise Hand'}
            </button>
          )}
        </div>
      </div>

      {/* Active Class Quiz / Poll Banner */}
      {activeQuiz && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Live Class Poll
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Active Question
            </span>
          </div>

          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {activeQuiz.question}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeQuiz.options.map((opt, idx) => {
              const count = activeQuiz.responses?.[idx] || 0;
              const isSelected = myAnswer === idx;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setMyAnswer(idx);
                    if (onRespondQuiz) onRespondQuiz(idx);
                  }}
                  className={`p-2.5 text-left rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-purple-200 dark:border-zinc-700 hover:border-purple-400'
                  }`}
                >
                  <span>{opt}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-purple-700 text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'}`}>
                    {count} votes
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Raised Hands Queue (Teacher View) */}
      {(isTeacher || isAssistant) && raisedHandsQueue.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5" /> Raised Hands Queue ({raisedHandsQueue.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {raisedHandsQueue.map((student) => (
              <div 
                key={student.uid}
                className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-amber-200 dark:border-amber-800/50 text-xs text-slate-800 dark:text-zinc-200"
              >
                <span className="font-medium">{student.name}</span>
                {onGrantSpeaking && (
                  <button 
                    onClick={() => onGrantSpeaking(student.uid)}
                    className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    Grant Speaking
                  </button>
                )}
                {onLowerHand && (
                  <button 
                    onClick={() => onLowerHand(student.uid)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded hover:bg-slate-300"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance & Student Roster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5 flex items-center justify-between">
            <span>Classroom Attendance Roster</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
              {activeUsers.length} Students Present
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeUsers.map((user) => (
              <div 
                key={user.uid}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-800 dark:text-zinc-200">
                    {user.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                    {user.role || 'student'}
                  </span>
                </div>

                {isTeacher && (
                  <div className="flex items-center gap-1">
                    {onMuteStudent && (
                      <button 
                        onClick={() => onMuteStudent(user.uid)}
                        title="Mute student"
                        className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Lesson Metrics */}
        <div className="p-3 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60 flex flex-col justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
            Session Analytics
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-700/50">
              <span className="text-slate-500 dark:text-zinc-400">Editor State</span>
              <span className={`font-semibold ${editingLocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                {editingLocked ? 'Locked' : 'Open'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-zinc-700/50">
              <span className="text-slate-500 dark:text-zinc-400">Raised Hands</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {raisedHandsQueue.length}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 dark:text-zinc-400">Presentation</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {isPresentationMode ? 'Active' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Modal Popup */}
      <AnimatePresence>
        {showQuizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateQuiz}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" /> Launch Class Quiz
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Question
                </label>
                <input 
                  type="text"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="e.g. What is the complexity of binary search?"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Options
                </label>
                {quizOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...quizOptions];
                      next[i] = e.target.value;
                      setQuizOptions(next);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Broadcast Poll
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeachingView;
