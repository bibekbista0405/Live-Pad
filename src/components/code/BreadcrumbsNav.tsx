import React, { useMemo } from 'react';
import { ChevronRight, Folder, FileCode, Layers, Code, FunctionSquare } from 'lucide-react';
import { ProjectFolder, ProjectFile } from '../../types/code';
import FileIcon from './FileIcon';

interface BreadcrumbsNavProps {
  projectName: string;
  activeFile: ProjectFile | null;
  folders: ProjectFolder[];
  onSelectFolder?: (folderId: string | null) => void;
  onSelectFile?: (fileId: string) => void;
  currentSymbol?: string;
}

export default function BreadcrumbsNav({
  projectName,
  activeFile,
  folders,
  onSelectFolder,
  onSelectFile,
  currentSymbol
}: BreadcrumbsNavProps) {
  // Extract primary symbols (functions/classes/exports) from active file if not explicitly passed
  const detectedSymbols = useMemo(() => {
    if (!activeFile || !activeFile.content) return [];
    const symbols: string[] = [];
    const lines = activeFile.content.split('\n');
    for (const line of lines) {
      const funcMatch = line.match(/(?:function|const|let|var|class|interface|type)\s+([A-Za-z0-9_$]+)/);
      if (funcMatch && funcMatch[1] && !['if', 'for', 'while', 'switch', 'return', 'import', 'export'].includes(funcMatch[1])) {
        if (!symbols.includes(funcMatch[1])) {
          symbols.push(funcMatch[1]);
        }
      }
      if (symbols.length >= 3) break;
    }
    return symbols;
  }, [activeFile?.content]);

  if (!activeFile) {
    return (
      <div className="h-6 bg-[#1e1e1e] border-b border-[#252526] px-3 flex items-center gap-1.5 text-[11px] font-sans text-[#858585] select-none overflow-x-auto no-scrollbar shrink-0">
        <Layers className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
        <span className="font-semibold text-[#cccccc]">{projectName}</span>
      </div>
    );
  }

  // Build trail of folders leading to active file
  const pathFolders: ProjectFolder[] = [];
  let currentParentId = activeFile.parentId;

  while (currentParentId) {
    const found = folders.find((f) => f.id === currentParentId);
    if (found) {
      pathFolders.unshift(found);
      currentParentId = found.parentId;
    } else {
      break;
    }
  }

  const activeSymbolName = currentSymbol || (detectedSymbols.length > 0 ? detectedSymbols[0] : null);

  return (
    <div className="h-6 bg-[#1e1e1e] border-b border-[#252526] px-3 flex items-center gap-1.5 text-[11px] font-sans text-[#858585] select-none overflow-x-auto no-scrollbar shrink-0">
      <button
        type="button"
        onClick={() => onSelectFolder?.(null)}
        className="flex items-center gap-1 hover:text-[#cccccc] font-medium text-[#969696] transition-colors cursor-pointer shrink-0"
      >
        <Layers className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
        <span>{projectName}</span>
      </button>

      {pathFolders.map((folder) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-3 h-3 text-[#555555] shrink-0" />
          <button
            type="button"
            onClick={() => onSelectFolder?.(folder.id)}
            className="flex items-center gap-1 hover:text-[#cccccc] text-[#969696] transition-colors cursor-pointer shrink-0"
          >
            <Folder className="w-3 h-3 text-[#dcb67a] shrink-0" />
            <span>{folder.name}</span>
          </button>
        </React.Fragment>
      ))}

      <ChevronRight className="w-3 h-3 text-[#555555] shrink-0" />

      <button
        type="button"
        onClick={() => onSelectFile?.(activeFile.id)}
        className="flex items-center gap-1.5 text-[#ffffff] font-medium hover:text-[#007acc] cursor-pointer shrink-0 transition-colors"
      >
        <FileIcon name={activeFile.name} extension={activeFile.extension} className="w-3.5 h-3.5 shrink-0" />
        <span>{activeFile.name}</span>
      </button>

      {activeSymbolName && (
        <>
          <ChevronRight className="w-3 h-3 text-[#555555] shrink-0" />
          <div className="flex items-center gap-1 text-[#b5ce43] font-mono text-[10px] bg-[#252526] px-1.5 py-0.5 rounded border border-[#3c3c3c] shrink-0">
            <FunctionSquare className="w-3 h-3 text-[#b5ce43] shrink-0" />
            <span>{activeSymbolName}</span>
          </div>
        </>
      )}
    </div>
  );
}

