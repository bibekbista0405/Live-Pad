import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Check, X, ArrowRight, FolderCode, Globe2 } from 'lucide-react';
import { CodingProject } from '../../types/code';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: CodingProject[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, template?: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const TEMPLATES = [
  { id: 'web-starter', name: 'Web foundations', desc: 'HTML for structure, CSS for style, and JavaScript for behavior.' }
];

export default function ProjectManagerModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject
}: ProjectManagerModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('web-starter');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), selectedTemplate);
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    onRenameProject(projectId, editingName.trim());
    setEditingProjectId(null);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#101820] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0d141c] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Your coding projects</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Simple projects for learning and building on the web.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md cursor-pointer hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  New web project
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Portfolio Website, Python Sandbox..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Start with</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedTemplate === tmpl.id
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                          : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-mono">{tmpl.name}</div>
                      <div className="text-[9px] text-slate-500 mt-1 leading-tight">{tmpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-md hover:bg-cyan-400 transition-all cursor-pointer"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-wider">
              Projects ({projects.length})
            </span>

            <div className="space-y-2">
              {projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                const isEditing = editingProjectId === proj.id;

                return (
                  <div
                    key={proj.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500/40 shadow-lg text-cyan-300 font-bold'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                        <FolderCode className="w-4 h-4" />
                      </div>

                      {isEditing ? (
                        <form onSubmit={(e) => handleRenameSubmit(e, proj.id)} className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 bg-slate-900 border border-cyan-500 rounded-lg text-xs font-mono text-white outline-none w-full"
                          />
                          <button type="submit" className="p-1 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => setEditingProjectId(null)} className="p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                        </form>
                      ) : (
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-bold text-white truncate flex items-center gap-2">
                            <span>{proj.name}</span>
                            {isActive && (
                              <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-md">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Updated {new Date(proj.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(proj.id);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/80 text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingProjectId(proj.id);
                            setEditingName(proj.name);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Rename Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDuplicateProject(proj.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Duplicate Project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {projects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteProject(proj.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
