import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Filter,
} from 'lucide-react';
import { requestsApi } from '../api/requests.api';
import { BloodRequest, PageResponse, RequestPriority, RequestStatus } from '../types';
import { parseApiError } from '../api/client';
import { formatRelativeAge } from '../utils/time';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<BloodRequest> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Status Filter Chips: default to "PENDING,APPROVED" or single chip
  const [statusFilter, setStatusFilter] = useState<string>('PENDING,APPROVED');
  const [priorityFilter, setPriorityFilter] = useState<string>(
    searchParams.get('priority') || ''
  );
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  // Auto-refresh countdown tracking
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchQueue = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError(null);
      try {
        const res = await requestsApi.getQueue({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          page,
          size,
        });
        setData(res);
        setLastRefreshed(new Date());
      } catch (err) {
        const parsed = parseApiError(err);
        setError(parsed);
        if (!isSilent) {
          showErrorToast(parsed.message, parsed.code);
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, priorityFilter, page, size, showErrorToast]
  );

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Helper for priority badges
  const renderPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'EMERGENCY':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-[#B3203A] bg-rose-50 text-[#B3203A]">
            <AlertCircle className="w-3 h-3 text-[#B3203A]" />
            <span>Emergency</span>
          </span>
        );
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-400 bg-amber-50 text-amber-800">
            <span>Urgent</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700">
            <span>Normal</span>
          </span>
        );
    }
  };

  const statusChips = [
    { label: 'Pending & Approved', value: 'PENDING,APPROVED' },
    { label: 'Pending Only', value: 'PENDING' },
    { label: 'Approved Only', value: 'APPROVED' },
    { label: 'All Requests', value: '' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Bar with Status Chips & Priority Filter */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold mr-1">Status:</span>
            {statusChips.map((chip) => {
              const active = statusFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(chip.value);
                    setPage(0);
                  }}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors focus-visible:outline-none ${
                    active
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Sync indicator & manual refresh */}
          <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
            <span className="font-mono text-[11px] tabular-nums">
              Refreshed: {lastRefreshed.toLocaleTimeString()} (30s cycle)
            </span>
            <button
              type="button"
              onClick={() => fetchQueue(false)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Priority Filter & Order Note */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Filter Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 font-mono focus-visible:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="EMERGENCY">EMERGENCY (Red)</option>
              <option value="URGENT">URGENT (Orange)</option>
              <option value="NORMAL">NORMAL (Grey)</option>
            </select>
          </div>

          <span className="text-slate-400 font-mono text-[11px]">
            Queue Sorting: EMERGENCY first → URGENT → NORMAL → Earliest Required
          </span>
        </div>
      </div>

      {/* Main Queue Table */}
      {loading && !data ? (
        <TableSkeleton rows={8} columns={8} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => fetchQueue(false)} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No hospital requests match criteria"
          description="The clinical queue is currently clear for the chosen filter configuration."
          actionLabel="View All Requests"
          onAction={() => {
            setStatusFilter('');
            setPriorityFilter('');
          }}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Request Number</th>
                  <th scope="col" className="px-3 py-2.5">Hospital</th>
                  <th scope="col" className="px-3 py-2.5">Blood Group</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Units</th>
                  <th scope="col" className="px-3 py-2.5">Priority</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">Required By</th>
                  <th scope="col" className="px-3 py-2.5">Age</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((req) => {
                  const isEmergency = req.priority === 'EMERGENCY';

                  return (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isEmergency ? 'border-l-4 border-l-[#B3203A] bg-rose-50/25' : ''
                      }`}
                    >
                      {/* Request Number */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 hover:text-[#B3203A] underline-offset-2 hover:underline">
                          {req.requestNo}
                        </div>
                        {req.patientNote && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-xs mt-0.5">
                            “{req.patientNote}”
                          </div>
                        )}
                      </td>

                      {/* Hospital */}
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.hospital.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Hospital #{req.hospital.id}
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <BloodGroupBadge group={req.bloodGroup} />
                      </td>

                      {/* Units */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap font-mono font-bold text-sm tabular-nums text-slate-900">
                        {req.unitsRequested}
                      </td>

                      {/* Priority Badge */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {renderPriorityBadge(req.priority)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Required By */}
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        <div>{new Date(req.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(req.requiredBy).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Age (e.g. "12 min ago") */}
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {formatRelativeAge(req.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/requests/${req.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors focus-visible:outline-none"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Details</span>
                        </button>
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
    </div>
  );
};
