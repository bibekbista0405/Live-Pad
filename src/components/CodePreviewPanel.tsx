import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  AlertTriangle,
  Globe,
  X,
} from 'lucide-react';
import { ProjectFile as CodeFile } from '../types/code';
import { ConsoleLogEntry } from './CodeWorkspace';

import { buildVirtualProject } from '../utils/virtualProjectBuilder';

export type DevicePreset = 'desktop' | 'laptop' | 'tablet' | 'mobile-p' | 'mobile-l';

export interface CodePreviewPanelProps {
  files?: CodeFile[];
  allFiles?: CodeFile[];
  activeFile: CodeFile;
  isAutoReload: boolean;
  onToggleAutoReload: () => void;
  devicePreset: DevicePreset;
  onSelectDevice?: (preset: DevicePreset) => void;
  onChangeDevicePreset?: (preset: DevicePreset) => void;
  zoomLevel: number;
  onZoomChange?: (level: number) => void;
  onChangeZoomLevel?: (level: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onAddToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  onConsoleLog?: (log: Omit<ConsoleLogEntry, 'id' | 'timestamp'>) => void;
  consoleLogs?: ConsoleLogEntry[];
  onClearConsoleLogs?: () => void;
  activeBottomTab?: string;
  onChangeBottomTab?: (tab: any) => void;
  onOpenExternalTab?: () => void;
  userRole?: 'teacher' | 'student';
  isTeacherSynced?: boolean;
  onToggleTeacherSync?: () => void;
  className?: string;
  onClosePreview?: () => void;
  refreshToken?: number;
}

export interface RuntimeErrorState {
  message: string;
  line?: number;
  column?: number;
  stack?: string;
}

const DEVICE_DIMENSIONS: Record<DevicePreset, { name: string; width: string; height: string; icon: any }> = {
  desktop: { name: 'Desktop (Fluid)', width: '100%', height: '100%', icon: Monitor },
  laptop: { name: 'Laptop (1280 × 800)', width: '1280px', height: '800px', icon: Laptop },
  tablet: { name: 'Tablet (768 × 1024)', width: '768px', height: '1024px', icon: Tablet },
  'mobile-p': { name: 'Mobile Portrait (375 × 812)', width: '375px', height: '812px', icon: Smartphone },
  'mobile-l': { name: 'Mobile Landscape (812 × 375)', width: '812px', height: '375px', icon: Smartphone }
};

export default function CodePreviewPanel(props: CodePreviewPanelProps) {
  const {
    files,
    allFiles,
    activeFile,
    isAutoReload,
    onToggleAutoReload,
    devicePreset,
    onSelectDevice,
    onChangeDevicePreset,
    zoomLevel,
    onZoomChange,
    onChangeZoomLevel,
    isFullscreen,
    onToggleFullscreen,
    onAddToast,
    onConsoleLog,
    onOpenExternalTab,
    className = '', 
    onClosePreview,
    refreshToken = 0
  } = props;

  const targetFiles = allFiles || files || [];
  const safeFiles = Array.isArray(targetFiles) ? targetFiles : [];
  const handleSelectDevice = onChangeDevicePreset || onSelectDevice || (() => {});
  const handleZoomChange = onChangeZoomLevel || onZoomChange || (() => {});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [runtimeError, setRuntimeError] = useState<RuntimeErrorState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const externalWindowRef = useRef<Window | null>(null);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [previewDocument, setPreviewDocument] = useState('');
  const hasInitializedPreview = useRef(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel for cross-window sync
  useEffect(() => {
    try {
      broadcastChannelRef.current = new BroadcastChannel('livepad_preview_sync');
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data?.type === 'REQUEST_PREVIEW_HTML') {
          sendToBroadcastChannel(previewBuild.html);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment');
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  const sendToBroadcastChannel = (html: string) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'UPDATE_PREVIEW_HTML', html });
      } catch (e) {
        // ignore fallback
      }
    }
  };

  const previewBuild = useMemo(() => buildVirtualProject(safeFiles, activeFile), [safeFiles, activeFile]);

  useEffect(() => {
    if (previewBuild.errors.length > 0) {
      const firstErr = previewBuild.errors[0];
      setRuntimeError({
        message: `${firstErr.type.toUpperCase()} ERROR in ${firstErr.fileName}${firstErr.line ? ` (${firstErr.line}:${firstErr.column || 1})` : ''}: ${firstErr.message}`,
        line: firstErr.line,
        column: firstErr.column
      });
    } else {
      setRuntimeError(null);
    }
  }, [previewBuild]);

  // Update iframe & external window when compiled code changes
  const refreshPreview = () => {
    setIsRefreshing(true);
    setRuntimeError(null);

    const html = previewBuild.html;
    setPreviewDocument(html);

    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }

    // Sync external window if open
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      try {
        externalWindowRef.current.document.open();
        externalWindowRef.current.document.write(html);
        externalWindowRef.current.document.close();
      } catch (e) {
        // Fallback to BroadcastChannel
        sendToBroadcastChannel(html);
      }
    }

    sendToBroadcastChannel(html);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  // Load once immediately, then only refresh automatically when Auto Reload is enabled.
  useEffect(() => {
    if (hasInitializedPreview.current) return;
    hasInitializedPreview.current = true;
    setPreviewDocument(previewBuild.html);
  }, [previewBuild.html]);

  useEffect(() => {
    if (!isAutoReload) return;
    const timer = window.setTimeout(() => refreshPreview(), 300);
    return () => window.clearTimeout(timer);
  }, [previewBuild.html, isAutoReload]);

  useEffect(() => {
    if (refreshToken > 0) refreshPreview();
  }, [refreshToken]);

  // Listen for iframe postMessages (console logs & runtime errors)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'livepad-preview') return;

      if (event.data.type === 'CONSOLE_LOG') {
        const { level, message } = event.data.payload;
        if (typeof onConsoleLog === 'function') {
          onConsoleLog({
            type: level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'info' ? 'info' : 'log',
            message: message
          });
        }
      } else if (event.data.type === 'RUNTIME_ERROR') {
        const { message, line, column, stack } = event.data.payload;
        setRuntimeError({ message, line, column, stack });
        if (typeof onConsoleLog === 'function') {
          onConsoleLog({
            type: 'error',
            message: `Preview Error [Line ${line || 1}]: ${message}`
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleLog]);

  // Open external preview window
  const handleOpenExternal = () => {
    if (onOpenExternalTab) {
      onOpenExternalTab();
      return;
    }
    const html = previewBuild.html;
    const externalWin = window.open('', '_blank', 'width=1100,height=750,menubar=no,toolbar=no,status=no,resizable=yes');

    if (externalWin) {
      externalWindowRef.current = externalWin;
      externalWin.document.open();
      externalWin.document.write(html);
      externalWin.document.close();
      if (typeof onAddToast === 'function') {
        onAddToast('success', 'Preview opened in external window!');
      }
    } else {
      if (typeof onAddToast === 'function') {
        onAddToast('error', 'Pop-up blocked. Please allow pop-ups for LivePad.');
      }
    }
  };


  const SelectedDeviceIcon = DEVICE_DIMENSIONS[devicePreset].icon;

  return (
    <div className={`flex flex-col h-full w-full bg-slate-950/95 border-l border-slate-800 relative overflow-hidden select-none ${className}`}>
      {/* Top Preview Browser Toolbar */}
      <div className="h-11 bg-slate-900 border-b border-slate-800/90 px-3 flex items-center justify-between shrink-0 gap-2 z-20">
        {/* Left Controls: Back, Forward, Refresh, Address Bar, Auto Reload */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={refreshPreview}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
            title="Refresh Preview (Ctrl+R)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Preview URL Bar */}
          <div className="flex-1 max-w-xs md:max-w-sm bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-2 text-xs text-slate-300 overflow-hidden">
            <Globe className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate text-slate-300">Local preview · {activeFile?.name || 'index.html'}</span>
          </div>

          <button
            type="button"
            onClick={onToggleAutoReload}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 hidden lg:flex ${
              isAutoReload
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Auto-Reload"
          >
            <span className={`w-2 h-2 rounded-full ${isAutoReload ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Auto Reload</span>
          </button>
        </div>

        {/* Middle Controls: Device Preset Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDeviceMenu(!showDeviceMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 text-xs font-bold transition-all cursor-pointer"
            title="Select Preview Viewport"
          >
            <SelectedDeviceIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] hidden md:inline">{DEVICE_DIMENSIONS[devicePreset].name}</span>
          </button>

          {/* Device Preset Dropdown */}
          <AnimatePresence>
            {showDeviceMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDeviceMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5"
                >
                  <div className="px-2 py-1 text-[10px] font-mono font-black uppercase text-slate-400 border-b border-slate-800 mb-1">
                    Viewport Presets
                  </div>
                  {(Object.keys(DEVICE_DIMENSIONS) as DevicePreset[]).map((key) => {
                    const dev = DEVICE_DIMENSIONS[key];
                    const IconComp = dev.icon;
                    const isSelected = devicePreset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          handleSelectDevice(key);
                          setShowDeviceMenu(false);
                          if (typeof onAddToast === 'function') {
                            onAddToast('info', `Switched layout to ${dev.name}`);
                          }
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{dev.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right Controls: Zoom, External Window, Copy, Fullscreen, Close */}
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60 text-slate-300 text-xs">
            <button
              type="button"
              onClick={() => handleZoomChange(Math.max(50, zoomLevel - 10))}
              className="p-1 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[10px] font-mono font-bold text-cyan-400">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => handleZoomChange(Math.min(150, zoomLevel + 10))}
              className="p-1 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Open External Window */}
          <button
            type="button"
            onClick={handleOpenExternal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Open Preview in External Standalone Window"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => onToggleFullscreen && onToggleFullscreen()}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
            title={isFullscreen ? 'Exit Fullscreen Preview' : 'Fullscreen Application Preview'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Optional Close Preview */}
          {onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer ml-1"
              title="Collapse Preview Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Device & Iframe Canvas Wrapper */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-auto relative no-scrollbar">
        <div
          className={`transition-all duration-300 relative flex flex-col ${
            devicePreset !== 'desktop'
              ? 'bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl p-2'
              : 'w-full h-full'
          }`}
          style={{
            width: devicePreset === 'desktop' ? '100%' : DEVICE_DIMENSIONS[devicePreset].width,
            height: devicePreset === 'desktop' ? '100%' : DEVICE_DIMENSIONS[devicePreset].height,
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: 'center center'
          }}
        >
          {/* Preview Viewport Header */}
          {devicePreset !== 'desktop' && (
            <div className="h-6 shrink-0 flex items-center justify-between px-3 text-[10px] font-mono text-slate-400 border-b border-slate-800/80 mb-1">
              <span className="flex items-center gap-1 font-bold text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                LivePad Preview
              </span>
              <span>{DEVICE_DIMENSIONS[devicePreset].name}</span>
            </div>
          )}

          {/* Actual Iframe Preview */}
          <div className="flex-1 w-full h-full bg-white rounded-xl overflow-hidden relative shadow-inner">
            <iframe
              ref={iframeRef}
              title="LivePad Code Sandbox Preview"
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
              srcDoc={previewDocument}
            />

            {/* Error Overlay Panel if runtime exception occurs */}
            <AnimatePresence>
              {runtimeError && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="absolute inset-x-3 bottom-3 bg-slate-950/95 backdrop-blur-md border border-rose-500/50 rounded-2xl p-4 shadow-2xl text-slate-100 z-30 space-y-2.5 max-h-[80%] overflow-y-auto no-scrollbar"
                >
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Runtime Error Captured</span>
                      {runtimeError.line ? (
                        <span className="bg-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                          Line {runtimeError.line}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRuntimeError(null)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="font-mono text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60 whitespace-pre-wrap leading-relaxed">
                    {runtimeError.message}
                  </p>

                  {runtimeError.stack && (
                    <details className="text-[10px] font-mono text-slate-400 space-y-1">
                      <summary className="cursor-pointer hover:text-slate-200">View Stack Trace</summary>
                      <pre className="p-2 bg-slate-900 rounded-lg overflow-x-auto text-[10px] leading-tight text-slate-300 no-scrollbar">
                        {runtimeError.stack}
                      </pre>
                    </details>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Check the editor or console for the reported error.</span>
                    <button
                      type="button"
                      onClick={refreshPreview}
                      className="px-2.5 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-Run</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
