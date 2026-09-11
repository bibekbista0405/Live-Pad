import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  Code2,
  Zap,
  Bug,
  TestTube,
  FileText,
  Check,
  Copy,
  ArrowRight,
  RefreshCw,
  Loader2,
  Wand2,
  Blocks
} from 'lucide-react';
import { ProjectFile } from '../../types/code';
import { extensionRegistry } from '../../services/extensionRegistry';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

interface AICopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: ProjectFile | null;
  allFiles?: ProjectFile[];
  onApplyCodeToEditor: (newCode: string) => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function AICopilotPanel({
  isOpen,
  onClose,
  activeFile,
  allFiles = [],
  onApplyCodeToEditor,
  onAddToast
}: AICopilotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: `Hello! I'm your **LivePad AI Copilot**. I analyze your full workspace context to generate, explain, refactor, debug, test, optimize code, and auto-write documentation in real time without interrupting your editing flow.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsGenerating(true);

    try {
      const response = await simulateAICopilotResponse(promptText, activeFile, allFiles);
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Sorry, I encountered an issue while generating a response: ${err?.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAction = (type: 'explain' | 'generate' | 'refactor' | 'audit' | 'test' | 'optimize' | 'jsdoc') => {
    if (!activeFile && type !== 'generate') {
      if (onAddToast) onAddToast('info', 'Please open a file in the editor first.');
      return;
    }

    const fname = activeFile?.name || 'project file';
    let prompt = '';
    if (type === 'explain') prompt = `Explain how the code in ${fname} works step-by-step.`;
    if (type === 'generate') prompt = `Generate functional boilerplate code matching current project architecture.`;
    if (type === 'refactor') prompt = `Refactor and clean up the code in ${fname} for better readability and structure.`;
    if (type === 'audit') prompt = `Audit ${fname} for potential runtime bugs, memory leaks, and logic issues.`;
    if (type === 'test') prompt = `Write comprehensive unit tests for ${fname}.`;
    if (type === 'optimize') prompt = `Optimize performance and algorithmic complexity in ${fname}.`;
    if (type === 'jsdoc') prompt = `Generate detailed JSDoc documentation comments and TypeScript types for ${fname}.`;

    handleSendPrompt(prompt);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    if (onAddToast) onAddToast('success', 'Copied AI code snippet to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-80 shrink-0 bg-[#0c0f17] border-l border-slate-800 flex flex-col h-full relative z-20 text-slate-200 select-none shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>AI Copilot</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                WORKSPACE-AWARE
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
              {activeFile ? activeFile.name : `${allFiles.length} project files`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close AI Copilot Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Pills */}
      <div className="p-2 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap gap-1 shrink-0">
        <button
          type="button"
          onClick={() => handleQuickAction('explain')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Explain code"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Explain</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction('generate')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Generate code"
        >
          <Code2 className="w-3 h-3 text-blue-400" />
          <span>Generate</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction('refactor')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Refactor"
        >
          <Wand2 className="w-3 h-3 text-purple-400" />
          <span>Refactor</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction('audit')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Fix bugs"
        >
          <Bug className="w-3 h-3 text-rose-400" />
          <span>Fix Bugs</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction('test')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Write tests"
        >
          <TestTube className="w-3 h-3 text-emerald-400" />
          <span>Tests</span>
        </button>

        {/* Extension AI Tools */}
        {extensionRegistry.getAllAITools().map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => {
              const codeToUse = activeFile ? activeFile.content : '';
              const prompt = tool.promptTemplate.replace('{code}', codeToUse).replace('{userPrompt}', 'Optimize code.');
              handleSendPrompt(prompt);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-lg text-[10px] font-mono transition-all cursor-pointer"
            title={tool.description}
          >
            <Blocks className="w-3 h-3 text-purple-400" />
            <span>{tool.name}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleQuickAction('optimize')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Optimize performance"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Optimize</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickAction('jsdoc')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 rounded-lg text-[10px] font-mono border border-slate-800 transition-all cursor-pointer"
          title="Generate documentation"
        >
          <FileText className="w-3 h-3 text-indigo-400" />
          <span>Docs</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${
                isAI ? 'items-start' : 'items-end'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 px-1">
                {isAI ? (
                  <>
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold text-cyan-400">AI Copilot</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-slate-400" />
                    <span>You</span>
                  </>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded-2xl max-w-[95%] font-sans text-xs leading-relaxed ${
                  isAI
                    ? 'bg-slate-900 border border-slate-800 text-slate-200'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Code Snippet Box with Apply Button */}
                {msg.codeSnippet && (
                  <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-[11px]">
                    <div className="px-2.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Code Recommendation
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                          title="Copy Code"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyCodeToEditor(msg.codeSnippet!);
                            if (onAddToast) onAddToast('success', 'Applied code changes to editor!');
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded text-[10px] font-bold shadow transition-all cursor-pointer"
                          title="Replace active file content with this code"
                        >
                          <span>Apply</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-2.5 overflow-x-auto text-cyan-200 max-h-48 custom-scrollbar">
                      {msg.codeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-cyan-400 font-mono animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI Copilot is analyzing document...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt(inputVal);
        }}
        className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask AI Copilot to code, fix, or explain..."
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isGenerating}
          className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl shadow cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

// Helper AI simulator with workspace context awareness
async function simulateAICopilotResponse(
  prompt: string,
  activeFile: ProjectFile | null,
  allFiles: ProjectFile[] = []
): Promise<ChatMessage> {
  await new Promise((res) => setTimeout(res, 600));

  const p = prompt.toLowerCase();
  const fileName = activeFile?.name || 'project file';
  const code = activeFile?.content || '';
  const contextSummary = allFiles.length > 0 
    ? `Analyzed ${allFiles.length} workspace file(s) for contextual integrity.`
    : `Analyzed active context buffer.`;

  if (p.includes('explain')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `### 🔍 Architectural Code Breakdown: **${fileName}**\n\n${contextSummary}\n\n1. **Core Purpose**: Encapsulates component render tree & state reactive bindings.\n2. **Logic Flow**: Implements event handlers with defensive error guards and fast state propagation.\n3. **Dependencies**: Integrated with workspace module system and layout trees.\n4. **Performance**: Memory footprint is minimal with zero unnecessary re-render loops.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  if (p.includes('generate')) {
    const generated = `// Auto-Generated Code Snippet by LivePad AI Copilot\n// ${contextSummary}\n\nexport function GeneratedFeature() {\n  return (\n    <div className="p-4 bg-slate-900 text-cyan-300 rounded-xl border border-slate-800 font-mono">\n      <h3 className="text-sm font-bold">✨ AI Generated Feature Block</h3>\n      <p className="text-xs text-slate-400 mt-1">Ready to integrate into ${fileName}</p>\n    </div>\n  );\n}\n`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Generated code tailored to your project structure:\n\n*${contextSummary}*`,
      codeSnippet: generated,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  if (p.includes('refactor')) {
    const refactoredCode = code
      ? `// Refactored by LivePad AI Copilot\n${code}\n\n// Added defensive guards & extracted clean modular sub-helpers`
      : `// Clean Modular Component Template\nexport function Component() {\n  return (\n    <div className="p-4 bg-slate-900 text-white rounded-xl shadow-lg">\n      <h2 className="text-lg font-bold">LivePad Refactored Component</h2>\n    </div>\n  );\n}`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Refactored **${fileName}** for enhanced readability, clean architecture, and type safety:\n\n*${contextSummary}*`,
      codeSnippet: refactoredCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  if (p.includes('bug') || p.includes('audit')) {
    const fixedCode = code
      ? `// Bug-Fixed & Audited Version of ${fileName}\n// Fixed potential null reference and added try-catch error boundary\n${code.replace(/const /g, '// verified: const ')}`
      : `// Defensive Guarded Component\nexport function SafeComponent() {\n  return <div>Audit Passed</div>;\n}`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `**Code Audit & Bug Fix Results for ${fileName}**:\n\n✓ Resolved potential null pointer access\n✓ Added boundary checks for async promises\n✓ Memory leak risk: Zero detected\n\n*${contextSummary}*`,
      codeSnippet: fixedCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  if (p.includes('test')) {
    const testCode = `// Comprehensive Vitest Suite for ${fileName}\nimport { describe, it, expect } from 'vitest';\n\ndescribe('${fileName} Test Suite', () => {\n  it('renders correctly and initializes state', () => {\n    expect(true).toBe(true);\n  });\n\n  it('handles edge cases gracefully without throwing exceptions', () => {\n    expect(true).toBe(true);\n  });\n});`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Here is a complete, production-ready unit test suite for **${fileName}**:\n\n*${contextSummary}*`,
      codeSnippet: testCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  if (p.includes('optimize')) {
    const optimized = code
      ? `// Optimized Version of ${fileName}\n// Applied React.memo / memoization & reduced algorithmic complexity\n${code}`
      : `// High-Performance Component\nexport function OptimizedComponent() {\n  return <div>Optimized 60fps execution</div>;\n}`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `⚡ **Performance Optimization Report for ${fileName}**:\n\n- Reduced re-render operations by ~40%\n- Memoized heavy calculations and callbacks\n- Optimized DOM reflows\n\n*${contextSummary}*`,
      codeSnippet: optimized,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  if (p.includes('doc') || p.includes('jsdoc')) {
    const docCode = code
      ? `/**\n * @module ${fileName}\n * @description High-performance module in LivePad AI workspace.\n */\n\n${code}`
      : `/**\n * @function ExampleFunction\n * @param {string} name - The item name\n * @returns {boolean}\n */\nexport function ExampleFunction(name: string): boolean {\n  return Boolean(name);\n}`;

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `Generated comprehensive JSDoc & TypeScript documentation for **${fileName}**:\n\n*${contextSummary}*`,
      codeSnippet: docCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Default response
  return {
    id: `ai-${Date.now()}`,
    sender: 'ai',
    text: `I analyzed **${fileName}** across your workspace context:\n\n*${contextSummary}*\n\nHere is the suggested implementation:`,
    codeSnippet: code ? `// AI Suggested Update\n${code}` : `console.log("Hello from LivePad AI Copilot!");`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export default AICopilotPanel;
