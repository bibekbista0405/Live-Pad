import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  CornerDownRight, 
  ArrowDown, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Circle, 
  AlertCircle,
  Settings2,
  Bug,
  Eye,
  Layers,
  Code2,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { 
  Breakpoint, 
  VariableScope, 
  WatchExpression, 
  StackFrame, 
  RunConfiguration, 
  DebugStatus 
} from '../../types/debug';

interface DebugPanelProps {
  debugStatus: DebugStatus;
  runConfigurations: RunConfiguration[];
  activeConfigId: string;
  onSelectConfig: (id: string) => void;
  onStartDebug: () => void;
  onPauseDebug: () => void;
  onResumeDebug: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onRestartDebug: () => void;
  onStopDebug: () => void;
  breakpoints: Breakpoint[];
  onToggleBreakpoint: (id: string) => void;
  onRemoveBreakpoint: (id: string) => void;
  onAddBreakpointByLine: (filePath: string, line: number) => void;
  variableScopes: VariableScope[];
  watchExpressions: WatchExpression[];
  onAddWatchExpression: (expr: string) => void;
  onRemoveWatchExpression: (id: string) => void;
  callStack: StackFrame[];
  activeStackFrameId: string | null;
  onSelectStackFrame: (frame: StackFrame) => void;
  onClose?: () => void;
  activeFilePath?: string;
  activeLineNumber?: number;
}

export function DebugPanel({
  debugStatus,
  runConfigurations,
  activeConfigId,
  onSelectConfig,
  onStartDebug,
  onPauseDebug,
  onResumeDebug,
  onStepOver,
  onStepInto,
  onStepOut,
  onRestartDebug,
  onStopDebug,
  breakpoints,
  onToggleBreakpoint,
  onRemoveBreakpoint,
  onAddBreakpointByLine,
  variableScopes,
  watchExpressions,
  onAddWatchExpression,
  onRemoveWatchExpression,
  callStack,
  activeStackFrameId,
  onSelectStackFrame,
  onClose,
  activeFilePath,
  activeLineNumber
}: DebugPanelProps) {
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    variables: false,
    watch: false,
    callStack: false,
    breakpoints: false
  });

  // Watch input
  const [newWatchInput, setNewWatchInput] = useState('');
  const [showAddWatch, setShowAddWatch] = useState(false);

  // Expandable variables state
  const [expandedVarPaths, setExpandedVarPaths] = useState<Record<string, boolean>>({
    'Local.req': true,
    'Local.res': false
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleVarExpand = (path: string) => {
    setExpandedVarPaths(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleAddWatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchInput.trim()) return;
    onAddWatchExpression(newWatchInput.trim());
    setNewWatchInput('');
    setShowAddWatch(false);
  };

  // Render object node in variables tree
  const renderVarValue = (val: any, path: string, depth = 0): React.ReactNode => {
    if (val === null) return <span className="text-amber-400 font-mono">null</span>;
    if (val === undefined) return <span className="text-slate-500 font-mono">undefined</span>;
    if (typeof val === 'boolean') return <span className="text-purple-400 font-mono">{String(val)}</span>;
    if (typeof val === 'number') return <span className="text-cyan-400 font-mono">{val}</span>;
    if (typeof val === 'string') return <span className="text-amber-300 font-mono">"{val}"</span>;

    if (typeof val === 'object') {
      const isExpanded = !!expandedVarPaths[path];
      const keys = Object.keys(val);
      const isArray = Array.isArray(val);

      return (
        <div className="space-y-0.5">
          <button
            onClick={() => toggleVarExpand(path)}
            className="flex items-center gap-1 hover:text-white text-slate-300 font-mono text-[11px]"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className="text-slate-400 font-sans">{isArray ? `Array(${keys.length})` : 'Object'}</span>
          </button>

          {isExpanded && (
            <div className="pl-3 border-l border-slate-800 space-y-0.5">
              {keys.map(k => (
                <div key={k} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-sky-300 font-mono shrink-0">{k}:</span>
                  {renderVarValue(val[k], `${path}.${k}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="text-slate-300 font-mono">{String(val)}</span>;
  };

  const activeConfig = runConfigurations.find(c => c.id === activeConfigId) || runConfigurations[0];

  return (
    <div className="w-full h-full bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col select-none text-slate-200 font-sans text-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">Run & Debug</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[#333333] text-slate-400 hover:text-white rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Configuration & Controls Section */}
      <div className="p-3 bg-[#181818] border-b border-[#2d2d2d] space-y-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={activeConfigId}
            onChange={(e) => onSelectConfig(e.target.value)}
            className="flex-1 bg-[#252526] border border-[#3c3c3c] text-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 truncate"
          >
            {runConfigurations.map(cfg => (
              <option key={cfg.id} value={cfg.id}>
                {cfg.name} ({cfg.type})
              </option>
            ))}
          </select>

          {debugStatus === 'idle' || debugStatus === 'stopped' ? (
            <button
              onClick={onStartDebug}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold flex items-center gap-1 shadow transition-colors"
              title="Start Debugging (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={onStopDebug}
              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-bold flex items-center gap-1 shadow transition-colors"
              title="Stop Debugging (Shift+F5)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>

        {/* Execution Floating Control Bar */}
        {debugStatus !== 'idle' && debugStatus !== 'stopped' && (
          <div className="p-1.5 bg-[#252526] border border-[#3c3c3c] rounded-lg flex items-center justify-around shadow-lg text-slate-300">
            {debugStatus === 'paused' ? (
              <button
                onClick={onResumeDebug}
                className="p-1 hover:text-emerald-400 hover:bg-[#333333] rounded transition-colors"
                title="Continue (F5)"
              >
                <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
              </button>
            ) : (
              <button
                onClick={onPauseDebug}
                className="p-1 hover:text-amber-400 hover:bg-[#333333] rounded transition-colors"
                title="Pause (F6)"
              >
                <Pause className="w-4 h-4 text-amber-400" />
              </button>
            )}

            <button
              onClick={onStepOver}
              className="p-1 hover:text-sky-400 hover:bg-[#333333] rounded transition-colors"
              title="Step Over (F10)"
            >
              <CornerDownRight className="w-4 h-4" />
            </button>

            <button
              onClick={onStepInto}
              className="p-1 hover:text-sky-400 hover:bg-[#333333] rounded transition-colors"
              title="Step Into (F11)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            <button
              onClick={onStepOut}
              className="p-1 hover:text-sky-400 hover:bg-[#333333] rounded transition-colors"
              title="Step Out (Shift+F11)"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={onRestartDebug}
              className="p-1 hover:text-emerald-400 hover:bg-[#333333] rounded transition-colors"
              title="Restart (Ctrl+Shift+F5)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onStopDebug}
              className="p-1 hover:text-rose-400 hover:bg-[#333333] rounded transition-colors"
              title="Stop (Shift+F5)"
            >
              <Square className="w-4 h-4 fill-rose-500 text-rose-500" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>STATUS:</span>
          <span className={`uppercase font-bold px-1.5 py-0.5 rounded ${
            debugStatus === 'paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
            debugStatus === 'running' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            'bg-slate-800 text-slate-400'
          }`}>
            {debugStatus}
          </span>
        </div>
      </div>

      {/* Main Debug Accordion Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#2d2d2d]">
        
        {/* 1. VARIABLES SCOPE */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('variables')}
            className="w-full px-3 py-2 bg-[#252526] hover:bg-[#2a2d2e] flex items-center justify-between text-[11px] font-bold tracking-wide uppercase text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              {collapsedSections.variables ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              Variables
            </span>
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {!collapsedSections.variables && (
            <div className="p-3 bg-[#1e1e1e] space-y-2">
              {variableScopes.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">Not paused on breakpoint.</p>
              ) : (
                variableScopes.map((scope) => (
                  <div key={scope.name} className="space-y-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      {scope.name} Scope
                    </span>
                    <div className="pl-2 border-l border-slate-800 space-y-1">
                      {Object.keys(scope.variables).map((varName) => (
                        <div key={varName} className="flex items-start gap-1.5 text-[11px]">
                          <span className="text-slate-300 font-mono shrink-0">{varName}:</span>
                          {renderVarValue(scope.variables[varName], `${scope.name}.${varName}`)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. WATCH EXPRESSIONS */}
        <div className="flex flex-col">
          <div className="w-full px-3 py-2 bg-[#252526] flex items-center justify-between text-[11px] font-bold tracking-wide uppercase text-slate-300">
            <button
              onClick={() => toggleSection('watch')}
              className="flex items-center gap-1.5 flex-1 text-left"
            >
              {collapsedSections.watch ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              Watch
            </button>
            <button
              onClick={() => setShowAddWatch(!showAddWatch)}
              className="p-1 hover:bg-[#3a3d3e] text-slate-400 hover:text-white rounded"
              title="Add Watch Expression"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {!collapsedSections.watch && (
            <div className="p-3 bg-[#1e1e1e] space-y-2">
              {showAddWatch && (
                <form onSubmit={handleAddWatchSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newWatchInput}
                    onChange={(e) => setNewWatchInput(e.target.value)}
                    placeholder="Expression (e.g. user.id)"
                    className="flex-1 bg-[#252526] border border-[#3c3c3c] text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-bold">
                    Add
                  </button>
                </form>
              )}

              {watchExpressions.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No watch expressions added.</p>
              ) : (
                watchExpressions.map((w) => (
                  <div key={w.id} className="flex items-center justify-between group p-1 hover:bg-[#2a2d2e] rounded font-mono text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-200">{w.expression}:</span>
                      {w.error ? (
                        <span className="text-rose-400 italic text-[10px]">{w.error}</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">{w.value || 'unavailable'}</span>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveWatchExpression(w.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 3. CALL STACK */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('callStack')}
            className="w-full px-3 py-2 bg-[#252526] hover:bg-[#2a2d2e] flex items-center justify-between text-[11px] font-bold tracking-wide uppercase text-slate-300"
          >
            <span className="flex items-center gap-1.5">
              {collapsedSections.callStack ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              Call Stack
            </span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {!collapsedSections.callStack && (
            <div className="p-1 bg-[#1e1e1e] space-y-0.5">
              {callStack.length === 0 ? (
                <p className="p-2 text-[11px] text-slate-500 italic">Call stack empty.</p>
              ) : (
                callStack.map((frame) => {
                  const isActive = activeStackFrameId === frame.id;
                  return (
                    <button
                      key={frame.id}
                      onClick={() => onSelectStackFrame(frame)}
                      className={`w-full p-2 text-left rounded transition-colors flex items-center justify-between font-mono text-[11px] ${
                        isActive
                          ? 'bg-sky-600/30 border border-sky-500/50 text-white'
                          : 'hover:bg-[#2a2d2e] text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-sky-300 block truncate">{frame.name}</span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {frame.filePath}:{frame.lineNumber}
                        </span>
                      </div>
                      {isActive && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 4. BREAKPOINTS */}
        <div className="flex flex-col">
          <div className="w-full px-3 py-2 bg-[#252526] flex items-center justify-between text-[11px] font-bold tracking-wide uppercase text-slate-300">
            <button
              onClick={() => toggleSection('breakpoints')}
              className="flex items-center gap-1.5 flex-1 text-left"
            >
              {collapsedSections.breakpoints ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              Breakpoints ({breakpoints.length})
            </button>
            {activeFilePath && activeLineNumber && (
              <button
                onClick={() => onAddBreakpointByLine(activeFilePath, activeLineNumber)}
                className="text-[10px] px-1.5 py-0.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded flex items-center gap-1"
                title={`Toggle breakpoint on line ${activeLineNumber}`}
              >
                <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> + Line {activeLineNumber}
              </button>
            )}
          </div>

          {!collapsedSections.breakpoints && (
            <div className="p-2 bg-[#1e1e1e] space-y-1">
              {breakpoints.length === 0 ? (
                <p className="p-2 text-[11px] text-slate-500 italic">No breakpoints set. Click editor gutter to add.</p>
              ) : (
                breakpoints.map((bp) => (
                  <div
                    key={bp.id}
                    className="flex items-center justify-between p-1.5 hover:bg-[#2a2d2e] rounded group text-[11px] font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => onToggleBreakpoint(bp.id)}
                        className="p-0.5 text-rose-500 hover:text-rose-400 shrink-0"
                      >
                        <Circle className={`w-3.5 h-3.5 ${bp.enabled ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                      </button>
                      <div className="min-w-0">
                        <span className={`block truncate ${bp.enabled ? 'text-slate-200 font-bold' : 'text-slate-500 line-through'}`}>
                          {bp.filePath}
                        </span>
                        <span className="text-[10px] text-rose-400 font-mono">
                          Line {bp.lineNumber} {bp.condition ? `[Cond: ${bp.condition}]` : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveBreakpoint(bp.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default DebugPanel;
