import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  PackageCheck,
  Printer,
  RefreshCw,
  X,
  ShieldAlert,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { requestsApi } from '../api/requests.api';
import { Availability, BloodRequest, IssueResult } from '../types';
import { parseApiError } from '../api/client';
import { formatRelativeAge } from '../utils/time';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/ToastContext';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // In-flight processing state (disables buttons and shows spinner to prevent double-clicks)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Confirmation dialog states
  const [confirmApproveOpen, setConfirmApproveOpen] = useState<boolean>(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  const [confirmIssueOpen, setConfirmIssueOpen] = useState<boolean>(false);
  const [confirmEmergencyOpen, setConfirmEmergencyOpen] = useState<boolean>(false);

  // Result dialog after issuing
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null);

  const fetchRequestAndAvailability = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [reqData, availData] = await Promise.all([
        requestsApi.getById(Number(id)),
        requestsApi.getAvailability(Number(id)),
      ]);
      setRequest(reqData);
      setAvailability(availData);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [id, showErrorToast]);

  useEffect(() => {
    fetchRequestAndAvailability();
  }, [fetchRequestAndAvailability]);

  // Handle plain language errors
  const handleActionError = (err: any) => {
    const parsed = parseApiError(err);
    if (parsed.code === 'INSUFFICIENT_STOCK') {
      const match = parsed.message.match(/Only\s+(\d+)/i) || parsed.message.match(/(\d+)\s+of/i);
      const count = match ? match[1] : (availability?.exactAvailable ?? 0);
      showErrorToast(`Only ${count} units available. Nothing was issued.`, 'INSUFFICIENT_STOCK');
    } else if (parsed.code === 'INVALID_STATE') {
      showErrorToast('This request was already handled by someone else. Refresh.', 'INVALID_STATE');
    } else {
      showErrorToast(parsed.message, parsed.code);
    }
    // Refresh the request after error
    fetchRequestAndAvailability();
  };

  // Action: Approve
  const handleApprove = async () => {
    if (!request || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await requestsApi.approve(request.id);
      showSuccessToast(`Request ${updated.requestNo} approved for allocation.`);
      setConfirmApproveOpen(false);
      setRequest(updated);
      fetchRequestAndAvailability();
    } catch (err) {
      handleActionError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Reject
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || isProcessing) return;
    if (!rejectReason.trim()) {
      showErrorToast('A rejection reason is required.');
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await requestsApi.reject(request.id, rejectReason.trim());
      showSuccessToast(`Request ${updated.requestNo} rejected: ${updated.rejectionReason}`);
      setRejectDialogOpen(false);
      setRequest(updated);
      fetchRequestAndAvailability();
    } catch (err) {
      handleActionError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Issue
  const handleIssue = async () => {
    if (!request || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await requestsApi.issue(request.id);
      showSuccessToast(`Issued ${res.issuedUnits.length} units successfully!`);
      setConfirmIssueOpen(false);
      setIssueResult(res);
      fetchRequestAndAvailability();
    } catch (err) {
      handleActionError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Approve and Issue Now (EMERGENCY)
  const handleEmergencyApproveAndIssue = async () => {
    if (!request || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await requestsApi.approveAndIssue(request.id);
      showSuccessToast(`EMERGENCY DISPATCH: ${res.issuedUnits.length} units issued!`);
      setConfirmEmergencyOpen(false);
      setIssueResult(res);
      fetchRequestAndAvailability();
    } catch (err) {
      handleActionError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Print voucher
  const handlePrint = () => {
    window.print();
  };

  if (loading && !request) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <CardSkeleton count={3} />
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="py-8">
        <ErrorState error={error} onRetry={fetchRequestAndAvailability} title="Request Record Not Found" />
      </div>
    );
  }

  if (!request) return null;

  const isEmergency = request.priority === 'EMERGENCY';
  const isUrgent = request.priority === 'URGENT';
  const isPending = request.status === 'PENDING';
  const isApproved = request.status === 'APPROVED';

  // Availability Verdict computation
  const hasExact = availability?.sufficientExact ?? false;
  const onlyCompatible = !hasExact && (availability?.sufficientWithCompatible ?? false);
  const insufficientAll = !hasExact && !(availability?.sufficientWithCompatible ?? false);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors focus-visible:outline-none"
            aria-label="Back to requests queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight font-mono">
                {request.requestNo}
              </h2>
              {/* Priority badge */}
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                  isEmergency
                    ? 'bg-rose-50 text-[#B3203A] border-[#B3203A]'
                    : isUrgent
                    ? 'bg-amber-50 text-amber-800 border-amber-400'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {request.priority}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Received {formatRelativeAge(request.createdAt)} · Required by{' '}
              <strong className="font-mono text-slate-800">
                {new Date(request.requiredBy).toLocaleString()}
              </strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchRequestAndAvailability}
          disabled={isProcessing}
          className="self-start sm:self-auto p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors focus-visible:outline-none"
          title="Refresh record"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. CLEAR AVAILABILITY PANEL (from GET /requests/{id}/availability) */}
      {availability && (
        <section
          aria-labelledby="availability-panel-heading"
          className="bg-white rounded border border-slate-200 p-4 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h3 id="availability-panel-heading" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cross-Match Inventory Availability Panel
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              GET /requests/{request.id}/availability
            </span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Units Requested
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                  {availability.requested}
                </span>
                <span className="text-xs text-slate-500 font-mono">units of</span>
                <BloodGroupBadge group={availability.bloodGroup} size="sm" />
              </div>
            </div>

            <div
              className={`p-3 rounded border ${
                availability.sufficientExact
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/60 border-[#B3203A]/30 text-rose-950'
              }`}
            >
              <span className="text-[10px] uppercase font-mono font-bold block opacity-75">
                Exact-Match Available ({availability.bloodGroup})
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-mono font-bold tabular-nums ${
                    availability.sufficientExact ? 'text-emerald-800' : 'text-[#B3203A]'
                  }`}
                >
                  {availability.exactAvailable}
                </span>
                <span className="text-xs opacity-75 font-mono">units in storage</span>
              </div>
            </div>

            <div
              className={`p-3 rounded border ${
                availability.sufficientWithCompatible
                  ? 'bg-blue-50/60 border-blue-300 text-blue-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[10px] uppercase font-mono font-bold block opacity-75">
                Compatible Available Pool
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono font-bold text-blue-900 tabular-nums">
                  {availability.compatibleAvailable}
                </span>
                <span className="text-xs text-slate-500 font-mono">units total</span>
              </div>
            </div>
          </div>

          {/* Green or Red Verdict Banner */}
          {hasExact ? (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong className="font-bold">VERDICT: SUFFICIENT EXACT STOCK AVAILABLE</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Full requested quantity of {availability.requested} units ({availability.bloodGroup}) is available in clinical storage and ready for immediate allocation.
                </p>
              </div>
            </div>
          ) : onlyCompatible ? (
            <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 p-3 rounded space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>VERDICT: INSUFFICIENT EXACT MATCH (COMPATIBLE POOL AVAILABLE)</span>
              </div>
              <p className="text-[11px] text-amber-900 font-semibold bg-white/70 p-2 rounded border border-amber-200">
                "Compatible groups can be used for emergencies only"
              </p>
              <p className="text-[11px] text-amber-800">
                Exact {availability.bloodGroup} inventory has only {availability.exactAvailable} units. However, {availability.compatibleAvailable} units exist across compatible donor types.
              </p>
            </div>
          ) : (
            <div className="bg-rose-50 border-2 border-[#B3203A] text-rose-950 p-3 rounded flex items-center gap-2.5 text-xs">
              <XCircle className="w-5 h-5 text-[#B3203A] shrink-0" />
              <div>
                <strong className="font-bold text-[#B3203A]">VERDICT: CRITICAL STOCK SHORTAGE</strong>
                <p className="text-[11px] text-rose-900 mt-0.5">
                  Insufficient inventory across both exact match and compatible donor pools. Requires immediate donor on-call mobilization.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Hospital Request Metadata */}
      <section className="bg-white rounded border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Ordering Hospital & Clinical Requisition</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Hospital Facility</span>
            <div className="mt-1 font-bold text-slate-900">{request.hospital.name}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Hospital Facility ID #{request.hospital.id}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Required Timeframe</span>
            <div className="mt-1 font-mono font-bold text-slate-900">
              {new Date(request.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Date: {new Date(request.requiredBy).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Requisition Created</span>
            <div className="mt-1 font-mono font-bold text-slate-900">
              {formatRelativeAge(request.createdAt)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {new Date(request.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Dedicated Patient Status & Clinical Indication Card */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Patient Clinical Status & Indication
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                isEmergency
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : isUrgent
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              PATIENT STATUS: {isEmergency ? 'CRITICAL / EMERGENCY' : isUrgent ? 'URGENT / SURGERY' : 'ROUTINE TRANSFUSION'}
            </span>
          </div>

          <div className="text-slate-800">
            {request.patientNote ? (
              <div className="p-2.5 rounded bg-white border border-slate-200 font-sans text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Physician Order / OT Diagnosis:
                </span>
                <p className="font-medium text-slate-900 leading-relaxed">
                  “{request.patientNote}”
                </p>
              </div>
            ) : (
              <p className="text-slate-500 italic p-2 bg-white/60 rounded border border-slate-200">
                Standard transfusion order without special patient notes. Required blood units: {request.unitsRequested} x {request.bloodGroup}.
              </p>
            )}
          </div>
        </div>

        {request.rejectionReason && (
          <div className="bg-rose-50 border border-rose-300 p-3 rounded text-xs text-rose-950">
            <span className="text-[10px] text-[#B3203A] uppercase font-mono font-bold block mb-1">
              Official Rejection Finding
            </span>
            <p className="text-rose-900">{request.rejectionReason}</p>
          </div>
        )}

        {/* Fulfilled units summary if fulfilled */}
        {request.status === 'FULFILLED' && request.issuedUnits && request.issuedUnits.length > 0 && (
          <div className="bg-teal-50 border border-teal-300 p-3 rounded text-xs text-teal-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Dispatched Units ({request.issuedUnits.length})</span>
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-900 hover:text-teal-950 underline"
              >
                <Printer className="w-3 h-3" />
                <span>Print Dispatch Voucher</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {request.issuedUnits.map((u) => (
                <div key={u.unitNumber} className="bg-white p-2 rounded border border-teal-200 font-mono text-[11px]">
                  <div className="font-bold text-slate-900">{u.unitNumber}</div>
                  <div className="text-slate-500 text-[10px]">Group: {u.bloodGroup} · Exp: {u.expiryDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. ACTIONS PANEL (by status and priority with confirmation dialogs) */}
      <section className="bg-white rounded border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Current Phase: </span>
          {isPending && 'Clinical Authorization & Allocation Required'}
          {isApproved && 'Approved · Ready for Physical Bag Tagging & Dispatch'}
          {request.status === 'FULFILLED' && 'Dispatched and Delivered'}
          {request.status === 'REJECTED' && 'Rejected Requisition'}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PENDING + EMERGENCY: "Approve and issue now" primary red button */}
          {isPending && isEmergency && (
            <button
              type="button"
              onClick={() => setConfirmEmergencyOpen(true)}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#B3203A] hover:bg-[#971930] rounded shadow-sm transition-colors focus-visible:outline-none disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Approve and issue now</span>
            </button>
          )}

          {/* Regular PENDING actions */}
          {isPending && (
            <>
              <button
                type="button"
                onClick={() => setConfirmApproveOpen(true)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors focus-visible:outline-none disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Approve Request</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejectReason('');
                  setRejectDialogOpen(true);
                }}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded transition-colors focus-visible:outline-none disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-[#B3203A]" />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* APPROVED action: Issue blood */}
          {isApproved && (
            <button
              type="button"
              onClick={() => setConfirmIssueOpen(true)}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors focus-visible:outline-none disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PackageCheck className="w-3.5 h-3.5" />
              )}
              <span>Issue Blood</span>
            </button>
          )}
        </div>
      </section>

      {/* CONFIRMATION DIALOG: APPROVE */}
      {confirmApproveOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Approval</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Approve requisition <strong className="font-mono">{request.requestNo}</strong> for{' '}
              <strong>{request.hospital.name}</strong> ({request.unitsRequested} units of {request.bloodGroup})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmApproveOpen(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1 disabled:opacity-50"
              >
                {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Confirm Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: REJECT (Reason Required) */}
      {rejectDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-md w-full shadow-xl animate-in fade-in">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-rose-800">
                <XCircle className="w-4 h-4 text-[#B3203A]" />
                <span>Reject Requisition {request.requestNo}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectDialogOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Document reason for rejecting this blood request from <strong>{request.hospital.name}</strong>:
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rejection Reason <span className="text-[#B3203A]">* (Required)</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Inadequate inventory reserves, non-accredited emergency claim, or hospital cancelled request..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 rounded bg-[#B3203A] hover:bg-[#971930] text-white font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: ISSUE BLOOD */}
      {confirmIssueOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <PackageCheck className="w-5 h-5 text-slate-700" />
              <span>Confirm Unit Issuance & Dispatch</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Confirm packaging and dispatch of <strong>{request.unitsRequested} units</strong> ({request.bloodGroup}) to{' '}
              <strong>{request.hospital.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmIssueOpen(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssue}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1 disabled:opacity-50"
              >
                {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Confirm Issue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: APPROVE AND ISSUE NOW (EMERGENCY) */}
      {confirmEmergencyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border-2 border-[#B3203A] max-w-md w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-[#B3203A] font-bold text-sm">
              <Zap className="w-5 h-5 text-[#B3203A]" />
              <span>Emergency Immediate Dispatch Override</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Execute 1-click authorization and instant inventory allocation for emergency trauma requisition{' '}
              <strong className="font-mono">{request.requestNo}</strong> ({request.unitsRequested} units for {request.hospital.name})?
            </p>
            <div className="bg-rose-50 p-2.5 rounded border border-rose-200 text-rose-950 text-[11px]">
              Compatible donor groups will be used automatically if exact inventory reserves are insufficient.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmEmergencyOpen(false)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmergencyApproveAndIssue}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded bg-[#B3203A] hover:bg-[#971930] text-white font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Authorize & Dispatch Immediately</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULT DIALOG AFTER ISSUING: Lists every unit number, group and expiry date, with a Print button */}
      {issueResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs print:p-0 print:bg-white"
        >
          <div className="bg-white rounded border border-slate-200 max-w-lg w-full shadow-2xl p-5 space-y-4 text-xs animate-in fade-in print:shadow-none print:border-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Blood Issue Dispatch Voucher
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Requisition #{request.requestNo} · {request.hospital.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIssueResult(null)}
                className="text-slate-400 hover:text-slate-700 print:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Requisition and Recipient summary */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block font-mono">Recipient Hospital:</span>
                <span className="font-bold text-slate-900">{request.hospital.name}</span>
                <span className="text-slate-500 block font-mono">Facility ID #{request.hospital.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono">Dispatch Timestamp UTC:</span>
                <span className="font-mono text-slate-900">{new Date(issueResult.issuedAt).toLocaleString()}</span>
                <span className="text-emerald-700 font-bold block">Status: FULFILLED</span>
              </div>
            </div>

            {/* List of every unit number, group and expiry date */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                Allocated Units Manifest ({issueResult.issuedUnits.length} Units)
              </h4>
              <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden">
                {issueResult.issuedUnits.map((u, idx) => (
                  <div key={u.unitNumber} className="p-2.5 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-400">#{idx + 1}</span>
                      <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {u.unitNumber}
                      </span>
                      <BloodGroupBadge group={u.bloodGroup} size="sm" />
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <span className="text-slate-400">Expires: </span>
                      <strong className="text-slate-800">{u.expiryDate}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Printable & Dialog Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 print:hidden">
              <Link
                to="/issues"
                className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
              >
                View in Issue History Log →
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIssueResult(null)}
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
