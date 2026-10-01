import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSizeChange?: (newSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  onSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = '',
}) => {
  if (totalElements === 0) return null;

  const start = page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  // Generate visible page numbers
  const maxButtons = 5;
  let startPage = Math.max(0, page - 2);
  let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(0, endPage - maxButtons + 1);
  }

  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      className={`px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          Showing <strong className="font-semibold text-slate-800">{start}</strong>–
          <strong className="font-semibold text-slate-800">{end}</strong> of{' '}
          <strong className="font-semibold text-slate-800">{totalElements}</strong>
        </span>

        {onSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-300 pl-3">
            <span>Per page:</span>
            <select
              value={size}
              onChange={(e) => {
                onSizeChange(Number(e.target.value));
                onPageChange(0);
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-medium focus-visible:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors focus-visible:outline-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pageNumbers.map((p) => {
          const isActive = p === page;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-6 h-6 px-1.5 rounded font-mono text-xs tabular-nums transition-colors focus-visible:outline-none ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {p + 1}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors focus-visible:outline-none"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
