import React from 'react';
import { RequestStatus, ApprovalStatus, UnitStatus } from '../types';

type AnyStatus = RequestStatus | ApprovalStatus | UnitStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-700';
  let bgColor = 'bg-slate-100';
  let label = status;

  switch (normalized) {
    // Request statuses
    case 'PENDING':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800';
      bgColor = 'bg-amber-50';
      label = 'Pending';
      break;
    case 'APPROVED':
      dotColor = 'bg-emerald-600';
      textColor = 'text-emerald-800';
      bgColor = 'bg-emerald-50';
      label = 'Approved';
      break;
    case 'FULFILLED':
      dotColor = 'bg-teal-600';
      textColor = 'text-teal-800';
      bgColor = 'bg-teal-50';
      label = 'Fulfilled';
      break;
    case 'REJECTED':
      dotColor = 'bg-[#B3203A]';
      textColor = 'text-[#B3203A]';
      bgColor = 'bg-red-50';
      label = 'Rejected';
      break;
    case 'CANCELLED':
      dotColor = 'bg-slate-400';
      textColor = 'text-slate-600';
      bgColor = 'bg-slate-100';
      label = 'Cancelled';
      break;
    case 'SUSPENDED':
      dotColor = 'bg-[#B3203A]';
      textColor = 'text-[#B3203A]';
      bgColor = 'bg-red-50';
      label = 'Suspended';
      break;
    // Unit statuses
    case 'AVAILABLE':
      dotColor = 'bg-emerald-600';
      textColor = 'text-emerald-800';
      bgColor = 'bg-emerald-50';
      label = 'Available';
      break;
    case 'ISSUED':
      dotColor = 'bg-teal-600';
      textColor = 'text-teal-800';
      bgColor = 'bg-teal-50';
      label = 'Issued';
      break;
    case 'EXPIRED':
      dotColor = 'bg-[#B3203A]';
      textColor = 'text-[#B3203A]';
      bgColor = 'bg-red-50';
      label = 'Expired';
      break;
    case 'DISCARDED':
      dotColor = 'bg-slate-500';
      textColor = 'text-slate-700';
      bgColor = 'bg-slate-100';
      label = 'Discarded';
      break;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded ${padding} ${bgColor} ${textColor} border border-black/5`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
