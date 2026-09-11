import React from 'react';
import { 
  FileText, 
  Tag, 
  Sparkles, 
  Lock, 
  Download, 
  Eye, 
  Clock, 
  Layers 
} from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface PersonalWorkspaceViewProps {
  role?: WorkspaceRole;
  currentRole?: WorkspaceRole;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  label?: string;
  onLabelChange?: (newLabel: string) => void;
  wordCount?: number;
  charCount?: number;
  readingTime?: number;
  onExportPdf?: () => void;
  onExportDocx?: () => void;
  onExportTxt?: () => void;
  onExportMarkdown?: () => void;
}

export const PersonalWorkspaceView: React.FC<PersonalWorkspaceViewProps> = ({
  role = 'owner',
  currentRole = role,
  title = '',
  onTitleChange,
  label = '',
  onLabelChange,
  wordCount = 0,
  charCount = 0,
  readingTime = 1,
  onExportPdf,
  onExportDocx,
  onExportTxt,
  onExportMarkdown
}) => {
  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
      {/* Distraction-Free Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-zinc-800/90 rounded-xl border border-slate-200 dark:border-zinc-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Personal Productivity Canvas
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                Private Focus Mode
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              {wordCount} words • {charCount} chars • {readingTime} min read
            </p>
          </div>
        </div>

        {/* Export Quick Bar */}
        <div className="flex items-center gap-1.5 text-xs">
          {onExportPdf && (
            <button 
              onClick={onExportPdf}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors"
            >
              PDF
            </button>
          )}
          {onExportDocx && (
            <button 
              onClick={onExportDocx}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors"
            >
              DOCX
            </button>
          )}
          {onExportMarkdown && (
            <button 
              onClick={onExportMarkdown}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors"
            >
              MD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalWorkspaceView;
