
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 selection:bg-red-100 selection:text-red-900 transition-colors">
          <div className="max-w-2xl w-full">
            {/* Visual Header */}
            <div className="mb-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-6 animate-pulse">
                <AlertTriangle size={48} strokeWidth={1.5} />
              </div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                SOMETHING<br />WENT WRONG
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-md mx-auto">
                The application encountered an unexpected state. Our team has been notified.
              </p>
            </div>

            {/* Error Container */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] rounded-3xl overflow-hidden transition-all">
              <div className="p-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 inline-flex items-center justify-center gap-3 bg-red-600 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-lg"
                  >
                    <RefreshCw size={18} className="animate-spin-slow" />
                    Reload Application
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 inline-flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    Return Home
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {this.state.showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  </button>

                  <div className={clsx(
                    "mt-4 overflow-hidden transition-all duration-500",
                    this.state.showDetails ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-xs overflow-auto border border-white/5 shadow-inner">
                      <div className="flex items-center gap-2 text-red-400 mb-4 pb-4 border-b border-white/10">
                        <Terminal size={14} />
                        <span className="font-bold">System Exception Output</span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-white/40 mb-1"># Error Message</p>
                          <p className="text-red-300 break-words">{this.state.error?.toString()}</p>
                        </div>
                        {this.state.errorInfo && (
                          <div>
                            <p className="text-white/40 mb-1"># Component Stack</p>
                            <pre className="whitespace-pre-wrap leading-relaxed opacity-80 overflow-x-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                Support Reference: {Date.now().toString(16).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
