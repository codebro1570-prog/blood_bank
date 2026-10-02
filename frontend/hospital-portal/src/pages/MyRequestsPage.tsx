import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../api/requests';
import { BloodRequest, RequestStatus, ApiError, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  XCircle,
  Eye,
  X,
} from 'lucide-react';

export const MyRequestsPage: React.FC = () => {
  const { approvalStatus } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showApiError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [pageData, setPageData] = useState<PageResponse<BloodRequest>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
  });

  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [inspectRequest, setInspectRequest] = useState<BloodRequest | null>(null);

  const fetchRequests = useCallback(
    async (pageIndex: number = pageData.page) => {
      setLoading(true);
      setError(null);
      try {
        const response = await requestsApi.getMyRequests({
          page: pageIndex,
          size: pageData.size,
          status: selectedStatus || undefined,
          q: searchQuery.trim() || undefined,
          sort: 'createdAt,desc',
        });
        setPageData(response);
      } catch (err: any) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [pageData.size, pageData.page, selectedStatus, searchQuery]
  );

  useEffect(() => {
    fetchRequests(0);
  }, [selectedStatus, searchQuery, fetchRequests]);

  const handleCancel = async (id: number) => {
    if (!window.confirm(`Are you sure you want to cancel Blood Request #${id}?`)) {
      return;
    }
    setCancellingId(id);
    try {
      await requestsApi.cancelRequest(id);
      showSuccess(`Request #${id} was cancelled successfully.`, 'Cancelled');
      fetchRequests(pageData.page);
    } catch (err: any) {
      showApiError(parseApiError(err), 'Cancel Failed');
    } finally {
      setCancellingId(null);
    }
  };

  const isApproved = approvalStatus === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            My Blood Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Requisition history, fulfillment tracking, and unit allocation
          </p>
        </div>
        {isApproved && (
          <button
            type="button"
            onClick={() => navigate('/requests/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6B63] hover:bg-[#0A4B45] text-white text-sm font-semibold rounded-md shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Request</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request ID, group, notes..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as RequestStatus | '')}
              className="text-xs sm:text-sm border border-slate-300 rounded-md py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
              aria-label="Filter requests by status"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(pageData.page)}
          disabled={loading}
          className="self-end md:self-center p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
          title="Refresh List"
          aria-label="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <ErrorState
          error={error}
          onRetry={() => fetchRequests(pageData.page)}
          title="Failed to Load Requests"
        />
      )}

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : pageData.content.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No Blood Requests Found"
              description={
                selectedStatus || searchQuery
                  ? 'No requests match your current search and filter criteria.'
                  : 'Your hospital has not registered any blood requests yet.'
              }
              actionLabel={isApproved ? 'Create Blood Request' : undefined}
              onAction={isApproved ? () => navigate('/requests/new') : undefined}
              secondaryActionLabel={
                selectedStatus || searchQuery ? 'Clear Filters' : undefined
              }
              onSecondaryAction={() => {
                setSelectedStatus('');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="w-full text-left text-sm divide-y divide-slate-200"
                aria-label="Blood Requests Table"
              >
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 sm:px-6">Request ID</th>
                    <th scope="col" className="px-4 py-3">Group</th>
                    <th scope="col" className="px-4 py-3">Units</th>
                    <th scope="col" className="px-4 py-3">Priority</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 hidden lg:table-cell">Required By</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pageData.content.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {req.requestNo}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
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
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 font-mono">
                        {new Date(req.requiredBy).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setInspectRequest(req)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F6B63] hover:text-[#0A4B45] p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
                          title="Inspect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleCancel(req.id)}
                            disabled={cancellingId === req.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#B3203A] p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B3203A]"
                            title="Cancel pending request"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-side Pagination Controls */}
            <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing page <strong className="font-mono">{pageData.page + 1}</strong> of{' '}
                <strong className="font-mono">{pageData.totalPages}</strong> (
                {pageData.totalElements} total requests)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchRequests(pageData.page - 1)}
                  disabled={pageData.page === 0 || loading}
                  className="px-2.5 py-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => fetchRequests(pageData.page + 1)}
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

      {/* Inspect Modal Dialog */}
      {inspectRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-500">Requisition Inspection</span>
                <h3 className="text-base font-bold text-slate-900">{inspectRequest.requestNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRequest(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-semibold">Blood Group</span>
                <p className="font-bold text-slate-900 text-sm">{inspectRequest.bloodGroup}</p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Units Requested</span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {inspectRequest.unitsRequested}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Priority</span>
                <div className="mt-0.5">
                  <PriorityBadge priority={inspectRequest.priority} />
                </div>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={inspectRequest.status} />
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 uppercase font-semibold">Required By</span>
                <p className="font-mono text-slate-800">
                  {new Date(inspectRequest.requiredBy).toLocaleString()}
                </p>
              </div>
              {inspectRequest.patientNote && (
                <div className="col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 uppercase font-semibold block mb-0.5">
                    Clinical / OT Note
                  </span>
                  <p className="text-slate-800">{inspectRequest.patientNote}</p>
                </div>
              )}
              {inspectRequest.rejectionReason && (
                <div className="col-span-2 bg-red-50 p-2.5 rounded border border-red-200 text-[#B3203A]">
                  <span className="uppercase font-semibold block mb-0.5">Rejection Reason</span>
                  <p>{inspectRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Issued Units (Section I contract: GET /requests/{id} returns issuedUnits without donor info) */}
            {inspectRequest.issuedUnits && inspectRequest.issuedUnits.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Allocated Blood Bags ({inspectRequest.issuedUnits.length})
                </h4>
                <div className="space-y-1.5">
                  {inspectRequest.issuedUnits.map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-teal-50/50 rounded border border-teal-100 font-mono"
                    >
                      <span className="font-bold text-slate-900">{u.unitNumber}</span>
                      <span className="text-slate-600">{u.bloodGroup}</span>
                      <span className="text-slate-500">Exp: {u.expiryDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
