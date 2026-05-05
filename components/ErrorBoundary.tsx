
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Terminal, Bot, Settings, HelpCircle, Home } from 'lucide-react';
import clsx from 'clsx';
import { getLandingConfig } from '../services/api';
import { LandingPageConfig } from '../types';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  config: LandingPageConfig | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    config: null
  };

  public componentDidMount() {
    this.fetchConfig();
  }

  private async fetchConfig() {
    try {
      const config = await getLandingConfig();
      if (config) {
        this.setState({ config });
      }
    } catch (e) {
      console.error("Failed to fetch landing config in ErrorBoundary", e);
    }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false, config: null as any };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    const { config } = this.state;
    if (this.state.hasError) {
      const title = config?.errorTitle || 'কিছু ভুল হয়েছে';
      const subtitle = config?.errorSubtitle || 'ওহ না! আপনার অনুরোধটি সম্পন্ন করতে একটি সমস্যা হয়েছে।';
      const message = config?.errorMessage || 'দয়া করে কয়েক মুহূর্ত অপেক্ষা করুন এবং আবার চেষ্টা করুন।';
      const tryAgainLabel = config?.errorTryAgainLabel || 'আবার চেষ্টা করুন';
      const homeLabel = config?.errorHomeLabel || 'হোম পেজে ফিরে যান';
      const footerText = config?.errorFooterText || 'আপনি এই পেজে ফিরে আসতে পারেন বা সার্চ চেষ্টা করতে পারেন।';

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#E6F3FF] dark:bg-slate-950 p-4 transition-colors overflow-x-hidden">
          <div className="max-w-xl w-full flex flex-col items-center">
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 text-center drop-shadow-sm">
              {title}
            </h1>

            {/* Illustration Area */}
            <div className="relative w-full aspect-[16/10] max-w-sm mb-6 flex items-center justify-center">
              {/* Backglow/Background Element */}
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 rounded-[1.5rem] transform -rotate-1 skew-x-1"></div>
              
              {/* Complex Robot Illustration with Lucide Icons */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="relative z-20 w-28 h-28 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl border-4 border-[#B8E2FF] dark:border-slate-700 overflow-hidden">
                    <Bot size={70} className="text-slate-400 dark:text-slate-500 animate-bounce-slow" />
                  </div>
                  {/* Floating Gear Icons */}
                  <Settings size={24} className="absolute -top-2 -left-6 text-slate-400 dark:text-slate-600 animate-spin-slow opacity-60" />
                  <Settings size={18} className="absolute bottom-4 -right-8 text-slate-400 dark:text-slate-600 animate-spin-slow-reverse opacity-40" />
                  
                  {/* 404 Text - Enhanced visibility */}
                  <div className="absolute top-1/2 -right-12 -translate-y-1/2 text-6xl font-black text-[#5CC48C]/40 dark:text-emerald-500/25 select-none tracking-tighter">
                    404
                  </div>
                  
                  {/* Question Bubble */}
                  <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500/20">
                     <HelpCircle size={22} className="text-[#5CC48C] dark:text-emerald-400" />
                  </div>
                </div>
                
                {/* Wiring lines abstraction */}
                <div className="flex gap-4 mt-2">
                   <div className="h-1 w-6 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                   <div className="h-1 w-10 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                   <div className="h-1 w-5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            <div className="text-center space-y-2 mb-8 w-full px-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {subtitle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-bold text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B9E5A] hover:bg-[#16894d] text-white py-2.5 px-5 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-lg active:scale-95"
              >
                <RefreshCw size={18} />
                {tryAgainLabel}
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-5 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-lg active:scale-95"
              >
                <Home size={18} />
                {homeLabel}
              </button>
            </div>

            {/* Footer Text */}
            <p className="mt-6 text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-500 text-center px-6">
              {footerText}
            </p>

            {/* Diagnostics Toggle */}
            <div className="mt-12 w-full pt-8 border-t border-slate-200 dark:border-slate-800">
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
