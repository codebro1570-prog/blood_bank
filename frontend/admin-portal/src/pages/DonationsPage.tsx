import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Droplet,
  Calendar,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { donationsApi } from '../api/donations.api';
import { Donation, PageResponse, ScreeningStatus } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export const DonationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<Donation> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Filters
  const [statusChip, setStatusChip] = useState<string>(''); // '' = ALL
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  // Mark Passed Confirmation Dialog
  const [passTargetDonation, setPassTargetDonation] = useState<Donation | null>(null);

  // Mark Failed Dialog with Reason
  const [failTargetDonation, setFailTargetDonation] = useState<Donation | null>(null);
  const [failureReason, setFailureReason] = useState<string>(
    'Low hemoglobin level (below 12.5 g/dL requirement)'
  );

  const [processing, setProcessing] = useState<boolean>(false);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await donationsApi.getDonations({
        status: statusChip || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        q: searchQuery.trim() || undefined,
        page,
        size,
      });
      setData(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [statusChip, fromDate, toDate, searchQuery, page, size, showErrorToast]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Handle Mark Passed after confirmation
  const handleConfirmPassed = async () => {
    if (!passTargetDonation) return;
    setProcessing(true);
    try {
      const res = await donationsApi.updateScreening(passTargetDonation.id, {
        result: 'PASSED',
      });
      showSuccessToast(
        `Screening PASSED: Unit ${res.unitNumber} (${res.donor.bloodGroup}) generated and added to inventory!`
      );
      setPassTargetDonation(null);
      fetchDonations();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setProcessing(false);
    }
  };

  // Handle Mark Failed after confirmation and reason entry
  const handleConfirmFailed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failTargetDonation) return;
    if (!failureReason.trim()) {
      showErrorToast('A failure reason is mandatory.');
      return;
    }

    setProcessing(true);
    try {
      await donationsApi.updateScreening(failTargetDonation.id, {
        result: 'FAILED',
        failureReason: failureReason.trim(),
      });
      showSuccessToast(
        `Donation #${failTargetDonation.id} marked as FAILED. Reason documented in regulatory audit log.`
      );
      setFailTargetDonation(null);
      fetchDonations();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setProcessing(false);
    }
  };

  const statusChips = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending Screening', value: 'PENDING' },
    { label: 'Passed & Stored', value: 'PASSED' },
    { label: 'Failed Screening', value: 'FAILED' },
  ];

  return (
    <div className="space-y-4">
      {/* Action Header & Filters */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
        {/* Top row: Status Chips + Record Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold mr-1">Status:</span>
            {statusChips.map((chip) => {
              const active = statusChip === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setStatusChip(chip.value);
                    setPage(0);
                  }}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors focus-visible:outline-none ${
                    active
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <Link
            to="/donations/new"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#B3203A] hover:bg-[#971930] rounded shadow-xs transition-colors shrink-0 focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Donation</span>
          </Link>
        </div>

        {/* Bottom row: Search + Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search donor name or unit number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 shrink-0">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 focus-visible:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 shrink-0">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 focus-visible:outline-none"
            />
            {(fromDate || toDate || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setSearchQuery('');
                  setPage(0);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Clear filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading && !data ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchDonations} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No donation records found"
          description="Adjust your search query or date range, or record a new donation session."
          actionLabel="Record Intake Session"
          onAction={() => navigate('/donations/new')}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">ID / Date</th>
                  <th scope="col" className="px-3 py-2.5">Donor</th>
                  <th scope="col" className="px-3 py-2.5">Blood Group</th>
                  <th scope="col" className="px-3 py-2.5">Volume</th>
                  <th scope="col" className="px-3 py-2.5">Allocated Unit</th>
                  <th scope="col" className="px-3 py-2.5">Screening Status</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Laboratory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((donation) => {
                  const isPending = donation.screeningStatus === 'PENDING';

                  return (
                    <tr
                      key={donation.id}
                      className={`hover:bg-slate-50/75 transition-colors ${
                        isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <Link
                          to={`/donations/${donation.id}`}
                          className="font-mono font-bold text-slate-900 hover:text-[#B3203A] underline"
                        >
                          #{donation.id}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {donation.donationDate}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/donors/${donation.donor.id}`}
                          className="font-semibold text-slate-900 hover:text-[#B3203A] underline block"
                        >
                          {donation.donor.fullName}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400">
                          Donor #{donation.donor.id}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <BloodGroupBadge group={donation.donor.bloodGroup} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono tabular-nums text-slate-800">
                        {donation.volumeMl} ml
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {donation.unitNumber ? (
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {donation.unitNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px] italic">
                            Unallocated
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={donation.screeningStatus} />
                          {donation.failureReason && (
                            <span className="text-[10px] text-rose-700 max-w-xs truncate" title={donation.failureReason}>
                              {donation.failureReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Mark Passed with confirmation dialog */}
                            <button
                              type="button"
                              onClick={() => setPassTargetDonation(donation)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors focus-visible:outline-none"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Mark Passed</span>
                            </button>

                            {/* Mark Failed with reason dialog */}
                            <button
                              type="button"
                              onClick={() => {
                                setFailTargetDonation(donation);
                                setFailureReason('Low hemoglobin level (below 12.5 g/dL requirement)');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded transition-colors focus-visible:outline-none"
                            >
                              <XCircle className="w-3 h-3 text-[#B3203A]" />
                              <span>Mark Failed</span>
                            </button>
                          </div>
                        ) : (
                          <Link
                            to={`/donations/${donation.id}`}
                            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline font-mono"
                          >
                            View Record →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            size={data.size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            onPageChange={(p) => setPage(p)}
            onSizeChange={(s) => setSize(s)}
          />
        </div>
      )}

      {/* Confirmation Dialog: Mark Passed */}
      {passTargetDonation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Serology Clearance</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Confirm that donation session #{passTargetDonation.id} for{' '}
              <strong>{passTargetDonation.donor.fullName}</strong> ({passTargetDonation.donor.bloodGroup})
              has passed all serological screening standards.
            </p>
            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
              ✓ This action will mint an inventory Unit Number and increment {passTargetDonation.donor.bloodGroup} available stock.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPassTargetDonation(null)}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPassed}
                disabled={processing}
                className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm Mark Passed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Mark Failed with Reason */}
      {failTargetDonation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-md w-full shadow-xl animate-in fade-in">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-rose-800">
                <XCircle className="w-4 h-4 text-[#B3203A]" />
                <span>Confirm Screening Rejection</span>
              </h3>
              <button
                type="button"
                onClick={() => setFailTargetDonation(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmFailed} className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Are you sure you want to mark donation #{failTargetDonation.id} for{' '}
                <strong>{failTargetDonation.donor.fullName}</strong> as FAILED? Please select or provide the laboratory finding:
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rejection Reason <span className="text-[#B3203A]">* (Mandatory)</span>
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none mb-2"
                >
                  <option value="Low hemoglobin level (below 12.5 g/dL requirement)">Low hemoglobin level (below 12.5 g/dL requirement)</option>
                  <option value="Serology test reactive for transmissible pathogens">Serology test reactive for transmissible pathogens</option>
                  <option value="Insufficient volume collected (< 300 ml)">Insufficient volume collected (&lt; 300 ml)</option>
                  <option value="Specimen hemolysis or clotting detected">Specimen hemolysis or clotting detected</option>
                  <option value="Cold chain breakdown prior to testing">Cold chain breakdown prior to testing</option>
                </select>

                <textarea
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFailTargetDonation(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-3.5 py-1.5 rounded bg-[#B3203A] hover:bg-[#971930] text-white font-bold disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Mark Failed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
