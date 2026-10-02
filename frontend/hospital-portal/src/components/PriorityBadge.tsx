import React from 'react';
import { RequestPriority } from '../types';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: RequestPriority;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  switch (priority) {
    case 'EMERGENCY':
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase bg-red-100 text-[#B3203A] border border-red-300 rounded"
          title="Emergency Priority: Immediate transfusion required"
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-[#B3203A]" aria-hidden="true" />}
          <span>Emergency</span>
        </span>
      );
    case 'URGENT':
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded"
          title="Urgent Priority: Needed within 2-4 hours"
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />}
          <span>Urgent</span>
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200 rounded"
          title="Normal Priority: Scheduled / elective"
        >
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />}
          <span>Normal</span>
        </span>
      );
  }
};
