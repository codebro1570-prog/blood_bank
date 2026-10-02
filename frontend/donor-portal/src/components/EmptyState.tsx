/**
 * Reusable Empty State Component
 * Shows friendly icon, title, description, and an actionable button.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-neutral-200/80 rounded-xl shadow-xs">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#FDF2F4] text-[#B3203A] flex items-center justify-center mb-4 shrink-0">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-900 mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-4 py-2 text-sm font-medium text-white bg-[#B3203A] hover:bg-[#991B32] rounded-lg transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:ring-offset-2 outline-none"
          >
            {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 outline-none"
          >
            {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
