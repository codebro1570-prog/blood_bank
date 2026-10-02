/**
 * Toast Notification System
 * Listens for API errors and application notifications.
 * Displays title, message, and details list cleanly.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApiError } from '../types';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showError: (message: string, details?: Array<{ field: string; message: string }>) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, details }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, details }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const showError = useCallback(
    (message: string, details?: Array<{ field: string; message: string }>) => {
      showToast({ type: 'error', title: 'Error', message, details });
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string) => {
      showToast({ type: 'success', title: 'Success', message });
    },
    [showToast]
  );

  // Listen for global custom events from axios interceptor
  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<ApiError>;
      const error = customEvent.detail;
      if (error) {
        showToast({
          type: 'error',
          title: error.code || 'Request Failed',
          message: error.message || 'An unexpected error occurred.',
          details: error.details,
        });
      }
    };

    window.addEventListener('app:api-error', handleApiError);
    return () => {
      window.removeEventListener('app:api-error', handleApiError);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto rounded-lg border p-4 shadow-lg transition-all duration-200 ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-[#B3203A] shrink-0 mt-0.5" />
              )}
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <p className="text-sm font-semibold mb-0.5">{toast.title}</p>
                )}
                <p className="text-sm leading-snug">{toast.message}</p>
                {toast.details && toast.details.length > 0 && (
                  <ul className="mt-2 text-xs list-disc list-inside space-y-0.5 opacity-90">
                    {toast.details.map((d, i) => (
                      <li key={i}>
                        <span className="font-medium">{d.field}:</span> {d.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 p-1 -mr-1 -mt-1 rounded focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
