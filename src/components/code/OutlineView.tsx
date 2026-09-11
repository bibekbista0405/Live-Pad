import React, { useState, useEffect } from 'react';
import { Search, Code2, Box, Cpu, FileCode, Hash, Braces } from 'lucide-react';
import { languageService } from '../../services/languageService';
import { projectIndexEngine, IndexedSymbol } from '../../services/projectIndexEngine';

interface OutlineViewProps {
  activeFileContent?: string;
  activeFilePath?: string;
  onNavigateToSymbol?: (line: number) => void;
}

export function OutlineView({ activeFileContent, activeFilePath, onNavigateToSymbol }: OutlineViewProps) {
  const [docSymbols, setDocSymbols] = useState<any[]>([]);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IndexedSymbol[]>([]);

  useEffect(() => {
    if (activeFileContent && activeFilePath) {
      const syms = languageService.parseDocumentSymbols(activeFileContent, activeFilePath);
      setDocSymbols(syms);
    }
  }, [activeFileContent, activeFilePath]);

  useEffect(() => {
    if (symbolQuery.trim()) {
      const results = projectIndexEngine.searchSymbols(symbolQuery.trim());
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [symbolQuery]);

  const getSymbolIcon = (kindStr?: string) => {
    switch (kindStr) {
      case 'class':
        return <Box className="w-3.5 h-3.5 text-amber-400" />;
      case 'function':
        return <Code2 className="w-3.5 h-3.5 text-[#007acc]" />;
      case 'interface':
      case 'type':
        return <Braces className="w-3.5 h-3.5 text-purple-400" />;
      case 'route':
        return <Hash className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-[#858585]" />;
    }
  };

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header Search */}
      <div className="p-2.5 bg-[#252526] border-b border-[#2d2d2d] flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#007acc]" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Document Outline & Symbols</span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={symbolQuery}
            onChange={(e) => setSymbolQuery(e.target.value)}
            placeholder="Search symbols across workspace..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] rounded text-xs text-white outline-none"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {symbolQuery.trim() ? (
          <div>
            <div className="text-[11px] font-bold text-[#858585] uppercase tracking-wider mb-2 px-1">
              Workspace Symbols ({searchResults.length})
            </div>
            {searchResults.length > 0 ? (
              searchResults.map((sym, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateToSymbol && onNavigateToSymbol(sym.line)}
                  className="p-2 bg-[#252526] hover:bg-[#2a2d2e] rounded border border-[#2d2d2d] mb-1.5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getSymbolIcon(sym.kind)}
                      <span className="font-semibold text-xs text-white">{sym.name}</span>
                    </div>
                    <span className="text-[10px] text-[#858585] font-mono">Line {sym.line}</span>
                  </div>
                  <div className="text-[10px] text-[#858585] truncate font-mono">{sym.relativePath}</div>
                </div>
              ))
            ) : (
              <div className="text-[#656565] text-xs p-4 text-center italic">No matching symbols found.</div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-bold text-[#858585] uppercase tracking-wider mb-2 px-1">
              Current File Outline ({docSymbols.length})
            </div>
            {docSymbols.length > 0 ? (
              docSymbols.map((sym, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateToSymbol && onNavigateToSymbol(sym.range.startLineNumber)}
                  className="flex items-center justify-between p-2 hover:bg-[#2a2d2e] rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    {getSymbolIcon(sym.detail)}
                    <span className="text-xs text-slate-200 font-medium truncate">{sym.name}</span>
                  </div>
                  <span className="text-[10px] text-[#858585] font-mono">Line {sym.range.startLineNumber}</span>
                </div>
              ))
            ) : (
              <div className="text-[#656565] text-xs p-4 text-center italic">
                No symbols detected in active document.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
