import React, { useState, useEffect } from 'react';
import { Network, Route, FileText, Sparkles, Copy, Check } from 'lucide-react';
import { workspaceAIKnowledgeService } from '../../services/workspaceAIKnowledgeService';
import { ArchitectureNode, RouteMapItem } from '../../types/phase4';

export function WorkspaceKnowledgePanel() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'routes' | 'readme'>('architecture');
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [routes, setRoutes] = useState<RouteMapItem[]>([]);
  const [readme, setReadme] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNodes(workspaceAIKnowledgeService.getArchitectureOverview());
    setRoutes(workspaceAIKnowledgeService.getRouteMap());
    setReadme(workspaceAIKnowledgeService.generateProjectDocumentation());
  }, []);

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(readme);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Workspace AI Knowledge Base</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2d2d2d] bg-[#252526] text-xs font-semibold shrink-0">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'architecture' ? 'border-cyan-400 text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Nodes</span>
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'routes' ? 'border-cyan-400 text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>API Routes</span>
        </button>
        <button
          onClick={() => setActiveTab('readme')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'readme' ? 'border-cyan-400 text-white bg-[#1e1e1e]' : 'border-transparent text-[#858585] hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Doc Gen</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'architecture' && (
          <div className="space-y-2">
            <div className="text-xs text-[#858585]">Discovered codebase architectural components & dependencies:</div>
            <div className="grid grid-cols-1 gap-2">
              {nodes.map((node) => (
                <div key={node.id} className="p-2.5 bg-[#252526] rounded border border-[#333333] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{node.name}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      {node.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#858585] font-mono">{node.filePath}</div>
                  {node.exportedSymbols.length > 0 && (
                    <div className="text-[10px] text-[#666666] pt-1">
                      Exports: <span className="text-slate-400 font-mono">{node.exportedSymbols.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-2">
            <div className="text-xs text-[#858585]">Mapped Express & IPC API Endpoints:</div>
            <div className="space-y-2">
              {routes.map((rt, idx) => (
                <div key={idx} className="p-2.5 bg-[#252526] rounded border border-[#333333] space-y-1">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-emerald-400">{rt.method} {rt.path}</span>
                    <span className="text-[9px] bg-[#333333] text-slate-300 px-1.5 py-0.5 rounded">
                      {rt.isProtected ? 'Protected' : 'Public'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#858585] flex items-center justify-between">
                    <span>Handler: <code className="text-cyan-300">{rt.handlerName}</code></span>
                    <span>File: <code className="text-slate-400">{rt.filePath}</code></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'readme' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#858585]">Auto-generated LivePad README.md</span>
              <button
                onClick={handleCopyReadme}
                className="px-2 py-1 bg-[#333333] hover:bg-[#444444] text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy MD'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#181818] rounded border border-[#333333] text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed">
              {readme}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
