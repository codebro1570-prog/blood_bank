import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  code?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, code?: string) => void;
  showErrorToast: (message: string, code?: string, title?: string) => void;
  showSuccessToast: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, code?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, message, code };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  const showErrorToast = useCallback(
    (message: string, code?: string, title = 'Operation Failed') => {
      showToast(message, 'error', title, code);
    },
    [showToast]
  );

  const showSuccessToast = useCallback(
    (message: string, title = 'Success') => {
      showToast(message, 'success', title);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showErrorToast, showSuccessToast }}>
      {children}
      {/* Toast container pinned to bottom right */}
      <aside
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded border shadow-lg transition-all text-sm ${
                isError
                  ? 'bg-white border-[#B3203A] text-slate-900 shadow-rose-950/10'
                  : isSuccess
                  ? 'bg-white border-emerald-500 text-slate-900 shadow-emerald-950/10'
                  : isWarning
                  ? 'bg-white border-amber-500 text-slate-900 shadow-amber-950/10'
                  : 'bg-white border-slate-300 text-slate-900 shadow-slate-900/10'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-4 h-4 text-[#B3203A]" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-slate-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-xs tracking-tight text-slate-900">
                    {toast.title || (isError ? 'Error' : 'Notification')}
                  </p>
                  {toast.code && (
                    <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                      {toast.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 text-slate-600 hover:text-slate-900 p-0.5 rounded focus-visible:outline-none"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
