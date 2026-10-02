import React, { useState, useEffect, useCallback } from 'react';
import { issuesApi } from '../api/issues';
import { IssueRecord, PageResponse, ApiError } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PackageCheck, RefreshCw, ChevronLeft, ChevronRight, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IssuedUnitsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pageData, setPageData] = useState<PageResponse<IssueRecord>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
  });

  const fetchIssues = useCallback(
    async (pageIndex: number = pageData.page) => {
      setLoading(true);
      setError(null);
      try {
        const response = await issuesApi.getMyIssues({
          page: pageIndex,
          size: pageData.size,
          sort: 'issuedAt,desc',
        });
        setPageData(response);
      } catch (err: any) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [pageData.size, pageData.page]
  );

  useEffect(() => {
    fetchIssues(0);
  }, [fetchIssues]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Issued Blood Units
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Section J · Blood bag barcode numbers, expiration dates, and fulfillment receipts
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchIssues(pageData.page)}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Bag Manifest</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          error={error}
          onRetry={() => fetchIssues(pageData.page)}
          title="Failed to Load Issued Units"
        />
      )}

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : pageData.content.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={PackageCheck}
              title="No Issued Blood Units"
              description="No blood units have been dispatched to your hospital blood desk yet. Once a requisition is fulfilled, unit barcodes will appear here."
              actionLabel="Check My Requests"
              onAction={() => {}}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="w-full text-left text-sm divide-y divide-slate-200"
                aria-label="Issued Blood Units Table"
              >
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 sm:px-6">Unit Number / Barcode</th>
                    <th scope="col" className="px-4 py-3">Blood Group</th>
                    <th scope="col" className="px-4 py-3">Linked Requisition</th>
                    <th scope="col" className="px-4 py-3">Expiry Date</th>
                    <th scope="col" className="px-4 py-3">Issued Timestamp</th>
                    <th scope="col" className="px-4 py-3 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pageData.content.map((unit) => (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {unit.unitNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold px-2 py-0.5 bg-teal-50 text-[#0F6B63] rounded border border-teal-200 text-xs">
                          {unit.bloodGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        <Link
                          to="/requests"
                          className="hover:underline text-[#0F6B63] font-semibold"
                        >
                          {unit.requestNo}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">
                        {unit.expiryDate}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {new Date(unit.issuedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Dispatched & Sealed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing page <strong className="font-mono">{pageData.page + 1}</strong> of{' '}
                <strong className="font-mono">{pageData.totalPages}</strong> ({pageData.totalElements}{' '}
                total units)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchIssues(pageData.page - 1)}
                  disabled={pageData.page === 0 || loading}
                  className="px-2.5 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => fetchIssues(pageData.page + 1)}
                  disabled={pageData.page >= pageData.totalPages - 1 || loading}
                  className="px-2.5 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
