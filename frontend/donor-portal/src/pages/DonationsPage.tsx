/**
 * My Donations Screen (Placeholder Shell & Live Data)
 * Tables with server-side paging shape, loading skeleton, error retry, empty states.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Droplet, ArrowRight, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { donorApi } from '../api/donor';
import { DonationForDonor, PageResponse } from '../types';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export const DonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [pagedData, setPagedData] = useState<PageResponse<DonationForDonor> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);

  const fetchDonations = useCallback(async (targetPage = 0) => {
    setError(null);
    try {
      const data = await donorApi.getMyDonations({ page: targetPage, size: 10, sort: 'donationDate,desc' });
      setPagedData(data);
      setPage(targetPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unable to retrieve donation history.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchDonations(0);
  }, [fetchDonations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            My Donations
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Your verified contribution history and lab screening records
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            fetchDonations(page);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : error ? (
        <ErrorState
          title="Could not load donations"
          message={error.message}
          onRetry={() => {
            setIsLoading(true);
            fetchDonations(page);
          }}
        />
      ) : !pagedData || pagedData.content.length === 0 ? (
        <EmptyState
          icon={Droplet}
          title="You haven't donated yet"
          description="Your donation history and laboratory screening records will appear here as soon as you complete your first whole blood donation at an authorized blood bank."
          actionText="Check My Eligibility"
          onAction={() => navigate('/eligibility')}
        />
      ) : (
        <div className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-neutral-200">
              <thead className="bg-neutral-50/70 text-neutral-600 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Donation Date</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Volume</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Screening Status</th>
                  <th scope="col" className="px-4 py-3.5 sm:px-6">Remarks / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                {pagedData.content.map((donation) => (
                  <tr key={donation.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-4 sm:px-6 font-mono tabular-nums text-neutral-900 font-semibold">
                      {donation.donationDate}
                    </td>
                    <td className="px-4 py-4 sm:px-6 tabular-nums text-neutral-800">
                      {donation.volumeMl} ml
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          donation.screeningStatus === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : donation.screeningStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {donation.screeningStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 text-xs">
                      {donation.screeningStatus === 'FAILED' ? (
                        <div className="flex items-center gap-1.5 text-red-700 font-medium">
                          <span className="font-semibold">Reason:</span>
                          <span>{donation.failureReason || 'Screening criteria not met'}</span>
                        </div>
                      ) : donation.screeningStatus === 'PASSED' ? (
                        <span className="text-neutral-500">Screening passed · safe for transfusion</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Lab screening in progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paging Footer */}
          <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 bg-neutral-50/40">
            <span>
              Showing <span className="font-semibold">{pagedData.content.length}</span> of{' '}
              <span className="font-semibold tabular-nums">{pagedData.totalElements}</span> donations
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagedData.page === 0}
                onClick={() => fetchDonations(pagedData.page - 1)}
                className="px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagedData.page >= pagedData.totalPages - 1}
                onClick={() => fetchDonations(pagedData.page + 1)}
                className="px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
