import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full bg-white rounded border border-slate-200 overflow-hidden divide-y divide-slate-100">
      <div className="bg-slate-50/75 px-4 py-2.5 flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/6 animate-pulse" />
      </div>
      <div className="p-0 divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="px-4 py-3 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3.5 bg-slate-100 rounded animate-pulse"
                style={{
                  width: `${Math.max(15, (100 / columns) - 3 + ((rIdx + cIdx) % 3) * 5)}%`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white p-4 rounded border border-slate-200 animate-pulse space-y-3">
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-7 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
};
