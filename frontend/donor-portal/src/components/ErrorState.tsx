/**
 * Reusable Error State Component with Retry
 */

import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { ApiError } from '../types';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: ApiError | Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load content',
  message,
  error,
  onRetry,
  isRetrying = false,
}) => {
  const displayMessage =
    message ||
    (error && 'message' in error ? error.message : 'An error occurred while connecting to the blood bank service.');

  const errorDetails = error && 'details' in error && Array.isArray((error as ApiError).details)
    ? (error as ApiError).details
    : undefined;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-red-200 rounded-xl shadow-xs"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 text-[#B3203A] flex items-center justify-center mb-4 shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-600 max-w-md mb-4 leading-relaxed">
        {displayMessage}
      </p>

      {errorDetails && errorDetails.length > 0 && (
        <div className="bg-red-50/60 border border-red-100 rounded-lg p-3 text-left max-w-md w-full mb-6 text-xs text-red-800">
          <p className="font-semibold mb-1">Details:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errorDetails.map((detail, idx) => (
              <li key={idx}>
                <span className="font-medium">{detail.field}:</span> {detail.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B3203A] hover:bg-[#991B32] disabled:opacity-60 rounded-lg transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:ring-offset-2 outline-none cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
