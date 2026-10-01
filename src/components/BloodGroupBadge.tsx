import React from 'react';
import { BloodGroupCode } from '../types';

interface BloodGroupBadgeProps {
  group: BloodGroupCode | string;
  size?: 'sm' | 'md' | 'lg';
  lowStock?: boolean;
}

export const BloodGroupBadge: React.FC<BloodGroupBadgeProps> = ({
  group,
  size = 'md',
  lowStock = false,
}) => {
  let sizeClasses = 'text-xs px-2 py-0.5';
  if (size === 'sm') sizeClasses = 'text-[11px] px-1.5 py-0.2';
  if (size === 'lg') sizeClasses = 'text-base font-bold px-3 py-1';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-tight rounded border tabular-nums ${sizeClasses} ${
        lowStock
          ? 'bg-rose-50 text-[#B3203A] border-[#B3203A]'
          : 'bg-slate-100 text-slate-800 border-slate-300'
      }`}
    >
      {group}
    </span>
  );
};
