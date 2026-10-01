import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MinusCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  ApprovalStatus,
  RequestPriority,
  RequestStatus,
  ScreeningStatus,
  UnitStatus,
} from '../types';

interface StatusBadgeProps {
  status:
    | UnitStatus
    | RequestStatus
    | ApprovalStatus
    | ScreeningStatus
    | RequestPriority
    | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = status.toUpperCase();

  let text = s;
  let bg = 'bg-slate-100';
  let border = 'border-slate-300';
  let textColor = 'text-slate-700';
  let Icon = Clock;

  switch (s) {
    // Priorities
    case 'EMERGENCY':
      text = 'EMERGENCY';
      bg = 'bg-rose-50';
      border = 'border-[#B3203A]';
      textColor = 'text-[#B3203A] font-semibold';
      Icon = AlertCircle;
      break;
    case 'URGENT':
      text = 'URGENT';
      bg = 'bg-amber-50';
      border = 'border-amber-400';
      textColor = 'text-amber-800 font-semibold';
      Icon = AlertTriangle;
      break;
    case 'NORMAL':
      text = 'NORMAL';
      bg = 'bg-slate-50';
      border = 'border-slate-200';
      textColor = 'text-slate-600';
      Icon = Clock;
      break;

    // Unit Statuses
    case 'AVAILABLE':
      text = 'AVAILABLE';
      bg = 'bg-emerald-50';
      border = 'border-emerald-300';
      textColor = 'text-emerald-800';
      Icon = CheckCircle2;
      break;
    case 'ISSUED':
      text = 'ISSUED';
      bg = 'bg-blue-50';
      border = 'border-blue-300';
      textColor = 'text-blue-800';
      Icon = ShieldCheck;
      break;
    case 'EXPIRED':
      text = 'EXPIRED';
      bg = 'bg-rose-50';
      border = 'border-rose-300';
      textColor = 'text-rose-700';
      Icon = AlertCircle;
      break;
    case 'DISCARDED':
      text = 'DISCARDED';
      bg = 'bg-stone-100';
      border = 'border-stone-300';
      textColor = 'text-stone-600';
      Icon = MinusCircle;
      break;

    // Request & Approval Statuses
    case 'PENDING':
      text = 'PENDING';
      bg = 'bg-amber-50';
      border = 'border-amber-300';
      textColor = 'text-amber-800';
      Icon = Clock;
      break;
    case 'APPROVED':
      text = 'APPROVED';
      bg = 'bg-emerald-50';
      border = 'border-emerald-300';
      textColor = 'text-emerald-800';
      Icon = CheckCircle2;
      break;
    case 'FULFILLED':
      text = 'FULFILLED';
      bg = 'bg-teal-50';
      border = 'border-teal-300';
      textColor = 'text-teal-800';
      Icon = ShieldCheck;
      break;
    case 'REJECTED':
      text = 'REJECTED';
      bg = 'bg-rose-50';
      border = 'border-rose-300';
      textColor = 'text-rose-700';
      Icon = XCircle;
      break;
    case 'CANCELLED':
      text = 'CANCELLED';
      bg = 'bg-slate-100';
      border = 'border-slate-300';
      textColor = 'text-slate-600';
      Icon = MinusCircle;
      break;
    case 'SUSPENDED':
      text = 'SUSPENDED';
      bg = 'bg-red-50';
      border = 'border-red-400';
      textColor = 'text-red-800 font-semibold';
      Icon = ShieldAlert;
      break;

    // Screening Statuses
    case 'PASSED':
      text = 'PASSED';
      bg = 'bg-emerald-50';
      border = 'border-emerald-300';
      textColor = 'text-emerald-800';
      Icon = CheckCircle2;
      break;
    case 'FAILED':
      text = 'FAILED';
      bg = 'bg-rose-50';
      border = 'border-rose-300';
      textColor = 'text-rose-700';
      Icon = XCircle;
      break;

    default:
      text = s;
      bg = 'bg-slate-50';
      border = 'border-slate-200';
      textColor = 'text-slate-700';
      Icon = Clock;
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${bg} ${border} ${textColor} ${padding} font-mono tracking-tight whitespace-nowrap`}
    >
      <Icon className={`${iconSize} shrink-0`} aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
};
