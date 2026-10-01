import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '../types';

interface ErrorStateProps {
  error?: ApiError | Error | string | null;
  onRetry: () => void;
  title?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = 'Failed to load data',
  className = '',
}) => {
  let message = 'An unexpected network error occurred while loading this section.';
  let code: string | undefined;
  let status: number | undefined;

  if (typeof error === 'string') {
    message = error;
  } else if (error && 'message' in error) {
    message = error.message;
    if ('code' in error && typeof (error as any).code === 'string') {
      code = (error as any).code;
    }
    if ('status' in error && typeof (error as any).status === 'number') {
      status = (error as any).status;
    }
  }

  return (
    <div
      role="alert"
      className={`bg-white rounded border border-[#B3203A]/30 p-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto shadow-sm ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#B3203A] mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {code && (
          <span className="font-mono text-[10px] text-[#B3203A] bg-rose-50 px-1.5 py-0.5 rounded border border-[#B3203A]/20">
            {status ? `${status} · ${code}` : code}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-600 max-w-sm mb-4 leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#B3203A] hover:bg-[#971930] rounded transition-colors focus-visible:outline-none"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry Request
      </button>
    </div>
  );
};
