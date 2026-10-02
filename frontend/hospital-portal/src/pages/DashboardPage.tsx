import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { requestsApi } from '../api/requests';
import { issuesApi } from '../api/issues';
import { BloodRequest, PageResponse, ApiError } from '../types';
import { parseApiError } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Skeleton, TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  PlusCircle,
  Clock,
  AlertCircle,
  PackageCheck,
  Building2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, hospital, approvalStatus } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [issuedUnitsCount, setIssuedUnitsCount] = useState<number>(0);
  const [stats, setStats] = useState({
    pending: 0,
    emergency: 0,
    fulfilled: 0,
    total: 0,
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch own requests with paging
      const reqResponse: PageResponse<BloodRequest> = await requestsApi.getMyRequests({
        page: 0,
        size: 5,
        sort: 'createdAt,desc',
      });
      setRecentRequests(reqResponse.content);

      // Compute quick stats
      const allMine = await requestsApi.getMyRequests({ page: 0, size: 50 });
      const pendingCount = allMine.content.filter((r) => r.status === 'PENDING').length;
      const emergencyPending = allMine.content.filter(
        (r) => r.status === 'PENDING' && r.priority === 'EMERGENCY'
      ).length;
      const fulfilledCount = allMine.content.filter((r) => r.status === 'FULFILLED').length;

      setStats({
        pending: pendingCount,
        emergency: emergencyPending,
        fulfilled: fulfilledCount,
        total: allMine.totalElements,
      });

      // Fetch issued units count
      const issuesResponse = await issuesApi.getMyIssues({ page: 0, size: 1 });
      setIssuedUnitsCount(issuesResponse.totalElements);
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const isApproved = approvalStatus === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Hospital Clinical Profile Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Hospital Portal Shell
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-mono text-[#0F6B63] font-semibold">
              Live Connected Mock Node
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {hospital?.name || 'Blood Desk Operation Center'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
            <span>License: <strong className="font-mono text-slate-700">{hospital?.licenseNo || 'N/A'}</strong></span>
            <span>·</span>
            <span>Contact Officer: <strong>{hospital?.contactPerson || user?.fullName}</strong></span>
            <span>·</span>
            <span>City: {hospital?.city || 'Tamil Nadu'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] transition-colors"
            title="Refresh Dashboard Data"
            aria-label="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isApproved ? (
            <Link
              to="/requests/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F6B63] hover:bg-[#0A4B45] text-white text-sm font-semibold rounded-md shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] focus-visible:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Blood Request</span>
            </Link>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 border border-slate-200 text-xs font-medium rounded-md cursor-not-allowed"
              title="Requests locked until hospital approval is granted"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Requests Locked ({approvalStatus})</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 border border-slate-200 rounded-lg space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Pending */}
          <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Requests
              </span>
              <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {stats.pending}
            </div>
            <p className="mt-1 text-xs text-slate-500">Awaiting blood bank review</p>
          </div>

          {/* Metric 2: Emergency Pending (uses crimson #B3203A strictly for emergency!) */}
          <div className={`p-5 border rounded-lg shadow-xs ${stats.emergency > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${stats.emergency > 0 ? 'text-[#B3203A]' : 'text-slate-500'}`}>
                Emergency Pending
              </span>
              <AlertCircle className={`w-4 h-4 ${stats.emergency > 0 ? 'text-[#B3203A]' : 'text-slate-400'}`} aria-hidden="true" />
            </div>
            <div className={`mt-2 text-2xl font-bold font-mono ${stats.emergency > 0 ? 'text-[#B3203A]' : 'text-slate-900'}`}>
              {stats.emergency}
            </div>
            <p className={`mt-1 text-xs ${stats.emergency > 0 ? 'text-[#B3203A] font-medium' : 'text-slate-500'}`}>
              Immediate OT / Trauma dispatch
            </p>
          </div>

          {/* Metric 3: Fulfilled */}
          <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Fulfilled Requests
              </span>
              <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {stats.fulfilled}
            </div>
            <p className="mt-1 text-xs text-slate-500">Completed & dispatched</p>
          </div>

          {/* Metric 4: Total Issued Units */}
          <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Issued Units Received
              </span>
              <PackageCheck className="w-4 h-4 text-[#0F6B63]" aria-hidden="true" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">
              {issuedUnitsCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">Verified bag barcodes</p>
          </div>
        </div>
      )}

      {/* Error state with Retry if request failed */}
      {error && (
        <ErrorState
          error={error}
          onRetry={loadDashboardData}
          title="Failed to Load Hospital Records"
        />
      )}

      {/* Recent Requests Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Blood Requests
            </h2>
            <p className="text-xs text-slate-500">
              Active requisition tracking from your hospital blood desk
            </p>
          </div>
          <Link
            to="/requests"
            className="text-xs font-semibold text-[#0F6B63] hover:text-[#0A4B45] flex items-center gap-1 focus:outline-none focus-visible:underline"
          >
            <span>View All ({stats.total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={4} columns={6} />
        ) : recentRequests.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No Blood Requests on File"
              description="Your hospital blood desk has not submitted any blood requisitions yet."
              actionLabel={isApproved ? 'Create First Request' : undefined}
              onAction={isApproved ? () => navigate('/requests/new') : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-200" aria-label="Recent Blood Requests">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6">Request ID</th>
                  <th scope="col" className="px-4 py-3">Group</th>
                  <th scope="col" className="px-4 py-3">Units</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 hidden md:table-cell">Required By</th>
                  <th scope="col" className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 sm:px-6 font-mono text-xs font-bold text-slate-900">
                      {req.requestNo}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <span className="font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono">
                      {req.unitsRequested} {req.unitsRequested === 1 ? 'unit' : 'units'}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500 font-mono">
                      {req.requiredBy ? new Date(req.requiredBy).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/requests"
                        className="inline-flex items-center text-xs font-semibold text-[#0F6B63] hover:text-[#0A4B45] focus:outline-none focus-visible:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fast Links & Quick Hospital Clinical Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/requests"
          className="p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0F6B63] transition-colors">
              Order Requisition Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter by status, priority, and date</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F6B63] transition-colors" />
        </Link>

        <Link
          to="/issued-units"
          className="p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0F6B63] transition-colors">
              Issued Blood Units
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Track bag barcode IDs & unit expiry</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F6B63] transition-colors" />
        </Link>

        <Link
          to="/profile"
          className="p-4 bg-white border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0F6B63] transition-colors">
              Hospital Profile & License
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Review contact and facility records</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F6B63] transition-colors" />
        </Link>
      </div>
    </div>
  );
};
