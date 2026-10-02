/**
 * Loading Skeleton Components
 * Accessible, smooth pulsing placeholders matching final layouts.
 */

import React from 'react';

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div
      role="status"
      aria-label="Loading content"
      className="p-6 bg-white border border-neutral-200/80 rounded-xl shadow-xs animate-pulse space-y-4"
    >
      <div className="h-5 bg-neutral-200 rounded w-1/3" />
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 bg-neutral-100 rounded"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 4,
  cols = 4,
}) => {
  return (
    <div
      role="status"
      aria-label="Loading table rows"
      className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-xs animate-pulse"
    >
      <div className="border-b border-neutral-100 bg-neutral-50/70 p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-neutral-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-neutral-100 rounded flex-1"
                style={{ opacity: 1 - c * 0.15 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MetricSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading metric"
      className="p-5 bg-white border border-neutral-200/80 rounded-xl shadow-xs animate-pulse space-y-3"
    >
      <div className="h-3.5 bg-neutral-200 rounded w-1/2" />
      <div className="h-8 bg-neutral-200 rounded w-3/4" />
      <div className="h-3 bg-neutral-100 rounded w-2/3" />
    </div>
  );
};
