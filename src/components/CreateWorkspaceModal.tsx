import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Shield, 
  Users, 
  Lock, 
  Globe, 
  Sparkles, 
  BookOpen, 
  Code, 
  FileText, 
  Briefcase,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceCategory, CATEGORY_DEFINITIONS } from '../utils/workspaceCategories';
import { WorkspacePrivacy } from '../types';
import { useModalA11y } from '../hooks/useModalA11y';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (data: {
    name: string;
    category: WorkspaceCategory;
    privacy: WorkspacePrivacy;
    permissions: {
      editingPolicy: 'everyone' | 'owner_only' | 'role_based';
      codeExecution: boolean;
      voiceChat: boolean;
      chatEnabled: boolean;
      defaultRole: any;
      lifespan: 'indefinite' | '24_hours' | '7_days' | '30_days';
    };
  }) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkspace
}) => {
  const [step, setStep] = useState<number>(1);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [category, setCategory] = useState<WorkspaceCategory>('team');
  const [privacy, setPrivacy] = useState<WorkspacePrivacy>('public');
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const currentCategoryDef = CATEGORY_DEFINITIONS[category];

  const handleNext = () => {
    if (step === 1 && !workspaceName.trim()) return;
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    onCreateWorkspace({
      name: workspaceName.trim(),
      category,
      privacy,
      permissions: {
        editingPolicy: category === 'teaching' ? 'owner_only' : 'role_based',
        codeExecution: true,
        voiceChat: true,
        chatEnabled: true,
        defaultRole: currentCategoryDef.defaultRole,
        lifespan: 'indefinite'
      }
    });
    // Reset state
    setStep(1);
    setWorkspaceName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="livepad-create-workspace-title"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="livepad-create-workspace-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Create New Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Step {step} of 4 — {step === 1 ? 'Workspace Name' : step === 2 ? 'Category Selection' : step === 3 ? 'Visibility & Access' : 'Role Summary & Launch'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close workspace creation"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1">
          <motion.div 
            className="bg-indigo-600 dark:bg-indigo-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* STEP 1: Workspace Name */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-zinc-200 mb-2">
                  What would you like to call your workspace?
                </label>
                <input 
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. CS101 Advanced Algorithms, Q3 Marketing Sprint, CS Thesis Notes..."
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2">
                  Quick Name Suggestions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '📚 CS101 Lecture Notes',
                    '👨‍🎓 Biology Study Group',
                    '💻 React App Playground',
                    '📝 Daily Productive Journal',
                    '👥 Product Engineering Team'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWorkspaceName(preset.replace(/^[^\s]+\s/, ''))}
                      className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg transition-colors border border-slate-200/60 dark:border-zinc-700/60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Workspace Category */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Choose a purpose-built workspace category. Each category configures its own roles, UI layout, permissions, and tools automatically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(CATEGORY_DEFINITIONS) as WorkspaceCategory[]).map((catKey) => {
                  const def = CATEGORY_DEFINITIONS[catKey];
                  const isSelected = category === catKey;

                  return (
                    <div
                      key={catKey}
                      onClick={() => setCategory(catKey)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{def.emoji}</span>
                          {isSelected && (
                            <span className="p-1 bg-indigo-600 text-white rounded-full">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {def.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                          {def.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/50 flex flex-wrap gap-1">
                        {def.roles.map(r => (
                          <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300">
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Workspace Visibility */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Select access visibility for this workspace.
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: 'public',
                    title: 'Public (Room Code)',
                    desc: 'Anyone with the unique LP Room Code can join instantly.',
                    icon: Globe,
                    color: 'text-emerald-500'
                  },
                  {
                    id: 'invite-only',
                    title: 'Invite Only',
                    desc: 'Only users specifically invited or approved by the owner can join.',
                    icon: Users,
                    color: 'text-blue-500'
                  },
                  {
                    id: 'private',
                    title: 'Private',
                    desc: 'Strictly visible and accessible only to you.',
                    icon: Lock,
                    color: 'text-amber-500'
                  }
                ].map((item) => {
                  const IconComp = item.icon;
                  const isSelected = privacy === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setPrivacy(item.id as WorkspacePrivacy)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 ${item.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          {isSelected && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Permission Summary & Role Structure */}
          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Generated Role Hierarchy for {currentCategoryDef.emoji} {currentCategoryDef.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                    Workspace: <strong className="text-indigo-600 dark:text-indigo-400">{workspaceName || 'Untitled Workspace'}</strong> ({privacy} access)
                  </p>
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Role Permissions Matrix:
                </h5>

                {currentCategoryDef.roles.map((role) => (
                  <div 
                    key={role.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${role.badgeColor}`}>
                        {role.name}
                      </span>
                      {role.isOwner && (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          👑 Creator Role
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mb-2">
                      {role.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.capabilities.map((cap, i) => (
                        <span 
                          key={i} 
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-200/70 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !workspaceName.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md hover:shadow-indigo-500/20"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Launch {currentCategoryDef.name}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CreateWorkspaceModal;
