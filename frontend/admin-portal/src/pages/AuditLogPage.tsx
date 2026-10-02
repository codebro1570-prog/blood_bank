import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  X,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { adminApi } from '../api/admin.api';
import { AuditLog, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { formatRelativeAge } from '../utils/time';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/ToastContext';

export const AuditLogPage: React.FC = () => {
  const { showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Filters: actor, action, date range (from, to)
  const [actorFilter, setActorFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs({
        actor: actorFilter.trim() || undefined,
        action: actionFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
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
  }, [actorFilter, actionFilter, fromDate, toDate, page, size, showErrorToast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const auditActions = [
    'BLOOD_ISSUED',
    'DONATION_RECORDED',
    'SCREENING_PASSED',
    'SCREENING_FAILED',
    'UNIT_DISCARDED',
    'REQUEST_APPROVED',
    'REQUEST_REJECTED',
    'EMERGENCY_DISPATCH',
    'HOSPITAL_APPROVED',
    'HOSPITAL_REJECTED',
    'HOSPITAL_SUSPENDED',
    'STAFF_REGISTERED',
    'USER_ACTIVATED',
    'USER_DEACTIVATED',
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>Compliance & Regulatory Audit Ledger</span>
            </h2>
            <p className="text-xs text-slate-500">
              Read-only tamper-evident chronological journal tracking every clinical, administrative, and inventory event.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAuditLogs}
            className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Filters grid: Actor, Action, Date Range (From, To) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Actor search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by operator email..."
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            />
          </div>

          {/* Action type */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus-visible:outline-none"
          >
            <option value="">All Action Types</option>
            {auditActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {/* Date Range: From */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] shrink-0">From:</span>
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

          {/* Date Range: To */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] shrink-0">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Clear filters shortcut */}
        {(actorFilter || actionFilter || fromDate || toDate) && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setActorFilter('');
                setActionFilter('');
                setFromDate('');
                setToDate('');
                setPage(0);
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-3 h-3" />
              <span>Reset Audit Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table: (time, actor, action, entity, details) */}
      {loading && !data ? (
        <TableSkeleton rows={8} columns={5} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchAuditLogs} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No audit log entries found"
          description="Adjust your operator email, action type, or date range filters to view historical entries."
          actionLabel="Clear Filters"
          onAction={() => {
            setActorFilter('');
            setActionFilter('');
            setFromDate('');
            setToDate('');
          }}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Time (UTC)</th>
                  <th scope="col" className="px-3 py-2.5">Actor</th>
                  <th scope="col" className="px-3 py-2.5">Action</th>
                  <th scope="col" className="px-3 py-2.5">Entity</th>
                  <th scope="col" className="px-3.5 py-2.5">Audit Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Time */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="font-mono text-slate-900 font-medium">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()} ({formatRelativeAge(log.createdAt)})
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 font-semibold">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.actor?.email || 'System'}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px]">
                      <span className="font-semibold text-slate-800">{log.entityType}</span>
                      <span className="text-slate-400 ml-1">#{log.entityId}</span>
                    </td>

                    {/* Details */}
                    <td className="px-3.5 py-2.5 text-slate-700 text-xs font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))}
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
