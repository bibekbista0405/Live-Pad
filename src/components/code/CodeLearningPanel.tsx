import React, { useMemo } from 'react';
import { BookOpen, CheckCircle2, Code2, FileCode2, Palette, Play, ArrowRight } from 'lucide-react';
import { ProjectFile } from '../../types/code';

interface CodeLearningPanelProps {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  onSelectFile: (fileId: string) => void;
  isTeachingSession?: boolean;
  isTeacher?: boolean;
}

const lessons = [
  {
    key: 'html', label: 'HTML', title: 'Build the page', icon: FileCode2,
    fileName: 'index.html',
    explanation: 'HTML gives your page its structure: headings, text, buttons, images, and other elements.',
    tryIt: 'Change the heading text in index.html, then run the preview.'
  },
  {
    key: 'css', label: 'CSS', title: 'Style the page', icon: Palette,
    fileName: 'style.css',
    explanation: 'CSS controls how your HTML looks: colors, spacing, sizes, layout, and more.',
    tryIt: 'Change a color or spacing value in style.css, then run the preview.'
  },
  {
    key: 'js', label: 'JavaScript', title: 'Make it interactive', icon: Code2,
    fileName: 'app.js',
    explanation: 'JavaScript adds behavior: clicks, input handling, calculations, and dynamic changes.',
    tryIt: 'Change the message in app.js, then click the button in the preview.'
  }
] as const;

export function CodeLearningPanel({ files, activeFile, onSelectFile, isTeachingSession = false, isTeacher = false }: CodeLearningPanelProps) {
  const available = useMemo(() => lessons.map((lesson) => ({
    ...lesson,
    file: files.find((file) => file.name === lesson.fileName || file.extension === lesson.key)
  })), [files]);

  const current = available.find((lesson) => lesson.file?.id === activeFile?.id) || available[0];

  return (
    <div className="livepad-learning-panel flex-1 min-h-0 overflow-y-auto px-3 py-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-cyan-300" />
          <h2 className="text-sm font-semibold text-white">Learn web development</h2>
        </div>
        <p className="text-[11px] leading-relaxed text-white/45">
          Start with the three foundations. Read a small idea, change the code, and see what happens.
        </p>
      </div>

      <div className="space-y-2">
        {available.map((lesson, index) => {
          const Icon = lesson.icon;
          const isActive = lesson.file?.id === current.file?.id;
          return (
            <button
              key={lesson.key}
              type="button"
              disabled={!lesson.file}
              onClick={() => lesson.file && onSelectFile(lesson.file.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                isActive
                  ? 'border-cyan-400/35 bg-cyan-400/[0.07]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
              } ${!lesson.file ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <span className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isActive ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/[0.05] text-white/45'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{index + 1}. {lesson.label} · {lesson.title}</span>
                    {lesson.file && <ArrowRight className="w-3 h-3 text-white/25" />}
                  </span>
                  <span className="block mt-1 text-[10px] text-white/40 font-mono">{lesson.fileName}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px] font-semibold text-white">{current.label}: the idea</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/55">{current.explanation}</p>
          <div className="mt-3 rounded-md bg-black/20 border border-white/[0.05] p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 mb-1">
              <Play className="w-3 h-3 text-cyan-300" /> Try it
            </div>
            <p className="text-[10px] leading-relaxed text-white/40">{current.tryIt}</p>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] p-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-cyan-200/80">
          <Code2 className="w-3 h-3" />
          {isTeachingSession ? (isTeacher ? 'Teach one idea at a time' : 'Follow the class, then experiment') : 'Learn by building'}
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">
          {isTeachingSession
            ? 'Your teacher controls the shared Code Studio session. You can still edit when the workspace allows it.'
            : 'HTML is structure, CSS is presentation, and JavaScript is behavior. Everything else can come later.'}
        </p>
      </div>
    </div>
  );
}

export default CodeLearningPanel;
