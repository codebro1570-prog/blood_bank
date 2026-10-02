import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ApiError } from '../types';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  code?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, code?: string) => void;
  showApiError: (err: ApiError | unknown, customTitle?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, code?: string) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, title, message, code }]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [dismissToast]
  );

  const showApiError = useCallback(
    (err: any, customTitle?: string) => {
      let message = 'An unexpected system error occurred.';
      let code: string | undefined = undefined;

      if (err?.code && err?.message) {
        message = err.message;
        code = err.code;
      } else if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }

      showToast(message, 'error', customTitle || (code ? `Error: ${code}` : 'Request Error'), code);
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Success') => {
      showToast(message, 'success', title);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showApiError, showSuccess, dismissToast }}>
      {children}
      {/* Toast container */}
      <aside
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto p-4 rounded-lg shadow-lg border text-sm transition-all animate-in slide-in-from-bottom-2 ${
                isError
                  ? 'bg-red-900 text-white border-red-800'
                  : isSuccess
                  ? 'bg-[#0F6B63] text-white border-[#0A4B45]'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {isError && <AlertCircle className="w-5 h-5 text-red-200" aria-hidden="true" />}
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-teal-200" aria-hidden="true" />}
                  {!isError && !isSuccess && <Info className="w-5 h-5 text-slate-300" aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-0">
                  {toast.title && <p className="font-semibold leading-tight">{toast.title}</p>}
                  <p className="mt-0.5 text-xs opacity-90 leading-relaxed">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 text-white/70 hover:text-white p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
