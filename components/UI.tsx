
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Loader2, X, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';

// Fix: Support ref for Card component to resolve TS error in Dashboard.tsx
export const Card = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={clsx("bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm", className)}>
      {children}
    </div>
  )
);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean; variant?: 'primary' | 'secondary' | 'danger' | 'outline' }>(
  ({ className, isLoading, variant = 'primary', children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-100 active:scale-95",
      secondary: "bg-slate-900 dark:bg-slate-800 text-white hover:bg-black dark:hover:bg-slate-700 focus:ring-slate-700 shadow-lg shadow-slate-100 active:scale-95",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-100 active:scale-95",
      outline: "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-slate-500 active:scale-95"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center px-6 py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string }>(
  ({ className, label, error, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          "w-full px-4 py-3.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600",
          error ? "border-red-300 bg-red-50/50 dark:bg-red-950/20" : "border-slate-100 dark:border-slate-700",
          className
        )}
        {...props}
      />
      {error && <p className="mt-2 text-[10px] text-red-600 font-black uppercase tracking-tighter">{error}</p>}
    </div>
  )
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ className, label, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 ml-1">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          "w-full px-4 py-3.5 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-100 cursor-pointer font-medium appearance-none",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
);

// Fix: Converted to React.FC to handle internal props like key correctly in TS
export const Badge: React.FC<{ children?: React.ReactNode, color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple', className?: string }> = ({ children, color = 'blue', className }) => {
  const colors = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
    gray: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
  };
  return (
    <span className={clsx("inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter", colors[color], className)}>
      {children}
    </span>
  );
};

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, message, isLoading, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-0 rounded-xl">
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full text-red-600 dark:text-red-400 mb-6 shadow-inner transition-colors">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter transition-colors">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium transition-colors">{message}</p>
          
          {children && <div className="w-full mb-8 text-left">{children}</div>}

          <div className="flex gap-4 w-full">
            <Button 
              variant="danger" 
              className="flex-1" 
              onClick={onConfirm} 
              isLoading={isLoading}
            >
              Confirm
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Global Toast System (Sweet Alert alternative)
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const Toast: React.FC<{
  message: string;
  type: ToastType;
  onClose: () => void;
  isVisible: boolean;
}> = ({ message, type, onClose, isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: "bg-white dark:bg-slate-900 border-green-500 text-green-700 dark:text-green-400 transition-colors",
    error: "bg-white dark:bg-slate-900 border-red-500 text-red-700 dark:text-red-400 transition-colors",
    info: "bg-white dark:bg-slate-900 border-blue-500 text-blue-700 dark:text-blue-400 transition-colors",
    warning: "bg-white dark:bg-slate-900 border-yellow-500 text-yellow-700 dark:text-yellow-400 transition-colors"
  };

  const Icons = {
    success: <CheckCircle2 className="text-green-500" />,
    error: <AlertCircle className="text-red-500" />,
    info: <Info className="text-blue-500" />,
    warning: <AlertTriangle className="text-yellow-500" />
  };

  return (
    <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-right-10 duration-300">
      <Card className={clsx("flex items-center gap-4 p-4 pr-6 border-l-4 shadow-2xl rounded-lg", styles[type])}>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">{Icons[type]}</div>
        <p className="text-sm font-black tracking-tight transition-colors">{message}</p>
        <button onClick={onClose} className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors ml-4">
          <X size={16} />
        </button>
      </Card>
    </div>
  );
};

export const useToast = () => {
  const [state, setState] = useState<{ message: string, type: ToastType, isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setState({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setState(prev => ({ ...prev, isVisible: false }));
  };

  return { toastState: state, showToast, hideToast };
};
