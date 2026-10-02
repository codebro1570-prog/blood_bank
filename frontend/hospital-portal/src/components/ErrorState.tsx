import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ApiError } from '../types';

interface ErrorStateProps {
  error: ApiError | Error | string | null;
  onRetry?: () => void;
  title?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = 'System Request Failed',
}) => {
  let message = 'An unexpected system error occurred. Please verify your connection and retry.';
  let code: string | null = null;
  let details: { field: string; message: string }[] = [];

  if (typeof error === 'string') {
    message = error;
  } else if (error && 'code' in error && 'message' in error) {
    message = error.message;
    code = error.code;
    if (Array.isArray(error.details)) {
      details = error.details;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div
      role="alert"
      className="p-6 bg-red-50/50 border border-red-200 rounded-lg text-slate-800"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-red-100 text-[#B3203A] shrink-0">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-[#B3203A]">{title}</h4>
            {code && (
              <span className="font-mono text-xs px-2 py-0.5 bg-red-100/70 text-[#B3203A] rounded border border-red-200">
                {code}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-700 leading-relaxed">{message}</p>

          {details.length > 0 && (
            <ul className="mt-2 text-xs text-[#B3203A] list-disc list-inside space-y-0.5">
              {details.map((d, i) => (
                <li key={i}>
                  <strong className="font-medium">{d.field}:</strong> {d.message}
                </li>
              ))}
            </ul>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#B3203A] hover:bg-[#8F192E] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:ring-offset-2"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Retry Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
