import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Code2, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/** Application-safe React error boundary. Keeps the shell alive when a feature crashes. */
export class ErrorBoundary extends Component<Props, State> {
  public declare readonly props: Readonly<Props>;
  public declare readonly setState: (
    state: State | Partial<State> | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Partial<State>),
    callback?: () => void,
  ) => void;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LivePad Error Boundary]', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleResetLocalStorage = () => {
    try {
      localStorage.removeItem('livepad_code_workspace');
      localStorage.removeItem('livepad_active_project_id');
    } catch (error) {
      console.warn('[LivePad Error Boundary] Could not clear local workspace state', error);
    }
    this.handleReload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full h-full min-h-[300px] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1 max-w-md">
          <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <span>{this.props.fallbackTitle || 'LivePad recovered from an error'}</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            This feature crashed, but LivePad itself is still running. Reload the view first; reset local workspace state only if the problem persists.
          </p>
        </div>
        {this.state.error && (
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32 text-left">
            {this.state.error.toString()}
          </div>
        )}
        <div className="flex items-center gap-2 pt-2">
          <button type="button" onClick={this.handleReload} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
          <button type="button" onClick={this.handleResetLocalStorage} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all active:scale-95">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Local Workspace State</span>
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
