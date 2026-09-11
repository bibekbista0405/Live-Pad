import React from 'react';
import {
  FileCode,
  FileText,
  Code2,
  FileJson,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  FileArchive,
  Database,
  Terminal,
  Layers,
  FileCheck,
  Folder,
  FolderOpen
} from 'lucide-react';

interface FileIconProps {
  name: string;
  extension?: string;
  isFolder?: boolean;
  isExpanded?: boolean;
  className?: string;
}

export default function FileIcon({ name, extension, isFolder, isExpanded, className = 'w-4 h-4' }: FileIconProps) {
  if (isFolder) {
    if (isExpanded) {
      return <FolderOpen className={`${className} text-amber-400 shrink-0`} />;
    }
    return <Folder className={`${className} text-amber-400/90 shrink-0`} />;
  }

  const ext = (extension || name.split('.').pop() || '').toLowerCase();

  switch (ext) {
    case 'html':
    case 'htm':
      return <FileCode className={`${className} text-orange-500 shrink-0`} />;
    case 'css':
    case 'scss':
    case 'less':
      return <FileCode className={`${className} text-cyan-400 shrink-0`} />;
    case 'js':
    case 'mjs':
    case 'cjs':
      return <Code2 className={`${className} text-yellow-400 shrink-0`} />;
    case 'jsx':
    case 'tsx':
      return <Code2 className={`${className} text-sky-400 shrink-0`} />;
    case 'ts':
      return <Code2 className={`${className} text-blue-400 shrink-0`} />;
    case 'vue':
      return <Code2 className={`${className} text-emerald-400 shrink-0`} />;
    case 'py':
    case 'pyw':
      return <Terminal className={`${className} text-emerald-400 shrink-0`} />;
    case 'java':
      return <Code2 className={`${className} text-rose-500 shrink-0`} />;
    case 'c':
    case 'h':
      return <Code2 className={`${className} text-blue-500 shrink-0`} />;
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return <Code2 className={`${className} text-indigo-400 shrink-0`} />;
    case 'cs':
      return <Code2 className={`${className} text-purple-400 shrink-0`} />;
    case 'go':
      return <Code2 className={`${className} text-cyan-300 shrink-0`} />;
    case 'rs':
      return <Code2 className={`${className} text-amber-500 shrink-0`} />;
    case 'php':
      return <Code2 className={`${className} text-violet-400 shrink-0`} />;
    case 'rb':
      return <Code2 className={`${className} text-red-400 shrink-0`} />;
    case 'swift':
      return <Code2 className={`${className} text-orange-400 shrink-0`} />;
    case 'kt':
    case 'kts':
      return <Code2 className={`${className} text-purple-500 shrink-0`} />;
    case 'dart':
      return <Code2 className={`${className} text-sky-500 shrink-0`} />;
    case 'sql':
      return <Database className={`${className} text-amber-400 shrink-0`} />;
    case 'json':
    case 'json5':
      return <FileJson className={`${className} text-amber-300 shrink-0`} />;
    case 'yaml':
    case 'yml':
      return <FileText className={`${className} text-red-400 shrink-0`} />;
    case 'md':
    case 'markdown':
      return <FileText className={`${className} text-indigo-300 shrink-0`} />;
    case 'xml':
      return <FileCode className={`${className} text-emerald-300 shrink-0`} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <ImageIcon className={`${className} text-emerald-300 shrink-0`} />;
    case 'mp4':
    case 'webm':
    case 'mov':
      return <Video className={`${className} text-rose-400 shrink-0`} />;
    case 'pdf':
      return <FileCheck className={`${className} text-red-400 shrink-0`} />;
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
    case '7z':
      return <FileArchive className={`${className} text-amber-500 shrink-0`} />;
    case 'sh':
    case 'bash':
      return <Terminal className={`${className} text-slate-300 shrink-0`} />;
    default:
      return <FileText className={`${className} text-slate-400 shrink-0`} />;
  }
}
