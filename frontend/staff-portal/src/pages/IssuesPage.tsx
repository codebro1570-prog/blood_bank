import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Building2,
  Calendar,
  X,
  User,
  Clock,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { issuesApi } from '../api/issues.api';
import { hospitalsApi } from '../api/hospitals.api';
import { BloodGroupCode, Hospital, IssueRecord, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { formatRelativeAge } from '../utils/time';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { useToast } from '../components/ToastContext';

export const IssuesPage: React.FC = () => {
  const { showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<IssueRecord> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Filters: hospital, blood group, date range, search query
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  // Load hospitals for filter dropdown
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const res = await hospitalsApi.getHospitals({ size: 50 });
        setHospitals(res.content);
      } catch {
        // quiet fallback
      }
    };
    loadHospitals();
  }, []);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await issuesApi.getIssues({
        hospitalId: selectedHospitalId ? Number(selectedHospitalId) : undefined,
        bloodGroup: selectedGroup || undefined,
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
  }, [selectedHospitalId, selectedGroup, fromDate, toDate, searchQuery, page, size, showErrorToast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const bloodGroups: BloodGroupCode[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <span>Blood Issue & Hospital Dispatch Manifest</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit log of all physical blood units issued and delivered to clinical hospital partners.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchIssues}
            className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Refresh Manifest</span>
          </button>
        </div>

        {/* Filters grid: Hospital, Blood Group, Date Range, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Hospital Filter */}
          <select
            value={selectedHospitalId}
            onChange={(e) => {
              setSelectedHospitalId(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus-visible:outline-none"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Blood Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus-visible:outline-none"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
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

        {/* Free search & reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search request number, unit number, hospital..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            />
          </div>

          {(selectedHospitalId || selectedGroup || fromDate || toDate || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedHospitalId('');
                setSelectedGroup('');
                setFromDate('');
                setToDate('');
                setSearchQuery('');
                setPage(0);
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 self-end sm:self-auto"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading && !data ? (
        <TableSkeleton rows={8} columns={7} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchIssues} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No blood issue records found"
          description="Adjust your hospital, blood group, or date filters to inspect issued dispatches."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedHospitalId('');
            setSelectedGroup('');
            setFromDate('');
            setToDate('');
            setSearchQuery('');
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
                  <th scope="col" className="px-3 py-2.5">Unit Number</th>
                  <th scope="col" className="px-3 py-2.5">Group</th>
                  <th scope="col" className="px-3 py-2.5">Expiry Date</th>
                  <th scope="col" className="px-3 py-2.5">Issued By</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Issued At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/75 transition-colors">
                    {/* Request Number */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <Link
                        to={`/requests/${rec.requestId}`}
                        className="font-mono font-bold text-slate-900 hover:text-[#B3203A] underline"
                      >
                        {rec.requestNo}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Issue #{rec.id}
                      </div>
                    </td>

                    {/* Hospital */}
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.hospital.name}</span>
                      </div>
                    </td>

                    {/* Unit Number */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {rec.unitNumber}
                      </span>
                    </td>

                    {/* Group */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <BloodGroupBadge group={rec.bloodGroup} />
                    </td>

                    {/* Expiry */}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                      {rec.expiryDate}
                    </td>

                    {/* Issued By */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{rec.issuedBy?.email || 'System'}</span>
                      </div>
                    </td>

                    {/* Issued At */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="font-mono text-[11px] text-slate-900 font-medium">
                        {new Date(rec.issuedAt).toLocaleString()}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {formatRelativeAge(rec.issuedAt)}
                      </div>
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
