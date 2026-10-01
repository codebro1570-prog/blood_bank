import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  X,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { hospitalsApi } from '../api/hospitals.api';
import { ApprovalStatus, Hospital, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export const HospitalsPage: React.FC = () => {
  const { showSuccessToast, showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<Hospital> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusChip, setStatusChip] = useState<string>(''); // '' = All
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  // Selected Hospital for Slide-Over Side Panel
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Confirmation Action Modals
  const [confirmApproveOpen, setConfirmApproveOpen] = useState<boolean>(false);
  const [reasonModalOpen, setReasonModalOpen] = useState<boolean>(false);
  const [targetDecision, setTargetDecision] = useState<'REJECTED' | 'SUSPENDED'>('REJECTED');
  const [actionReason, setActionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hospitalsApi.getHospitals({
        q: search.trim() || undefined,
        status: statusChip || undefined,
        page,
        size,
      });
      setData(res);
      // Keep selected hospital in sync if open
      if (selectedHospital) {
        const found = res.content.find((h) => h.id === selectedHospital.id);
        if (found) setSelectedHospital(found);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [search, statusChip, page, size, selectedHospital, showErrorToast]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // Execute Approval
  const handleConfirmApprove = async () => {
    if (!selectedHospital || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await hospitalsApi.updateApproval(selectedHospital.id, 'APPROVED');
      showSuccessToast(`Accreditation APPROVED for ${updated.name}. Hospital is authorized to request blood.`);
      setSelectedHospital(updated);
      setConfirmApproveOpen(false);
      fetchHospitals();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Reject or Suspend with Mandatory Reason
  const handleConfirmDecisionWithReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || isProcessing) return;
    if (!actionReason.trim()) {
      showErrorToast('A decision reason is mandatory.', 'VALIDATION_ERROR');
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await hospitalsApi.updateApproval(
        selectedHospital.id,
        targetDecision,
        actionReason.trim()
      );
      showSuccessToast(`Hospital ${updated.name} status updated to ${updated.approvalStatus}.`);
      setSelectedHospital(updated);
      setReasonModalOpen(false);
      setActionReason('');
      fetchHospitals();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusChips = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending Verification', value: 'PENDING' },
    { label: 'Approved & Active', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Suspended', value: 'SUSPENDED' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
        {/* Top row: Status Chips + Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold mr-1">Filter:</span>
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
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={fetchHospitals}
            className="self-end sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Refresh Roster</span>
          </button>
        </div>

        {/* Bottom row: Search Box */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative max-w-md w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by hospital name, license number, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading && !data ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchHospitals} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No hospital facilities found"
          description="Adjust your search query or status filter to view registered healthcare institutions."
          actionLabel="Clear Filter"
          onAction={() => {
            setSearch('');
            setStatusChip('');
          }}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Hospital Name</th>
                  <th scope="col" className="px-3 py-2.5">License Number</th>
                  <th scope="col" className="px-3 py-2.5">Location</th>
                  <th scope="col" className="px-3 py-2.5">Contact Person / Telephone</th>
                  <th scope="col" className="px-3 py-2.5">Accreditation Status</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((h) => {
                  const isSelected = selectedHospital?.id === h.id;
                  const isPending = h.approvalStatus === 'PENDING';

                  return (
                    <tr
                      key={h.id}
                      onClick={() => setSelectedHospital(h)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-100/70' : isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="hover:text-[#B3203A]">{h.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono pl-5.5">
                          ID #{h.id}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        {h.licenseNo}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{h.city}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-slate-900 font-medium">{h.contactPerson}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{h.phone}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge status={h.approvalStatus} />
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospital(h);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
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

      {/* SLIDE-OVER SIDE PANEL WITH ALL HOSPITAL DETAILS AND ACTIONS */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedHospital(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 shadow-xs">
                    <Building2 className="w-4 h-4 text-slate-800" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {selectedHospital.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      License: {selectedHospital.licenseNo} · Facility ID #{selectedHospital.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHospital(null)}
                  className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Accreditation Status Banner */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Accreditation Status:</span>
                  <StatusBadge status={selectedHospital.approvalStatus} />
                </div>

                {/* Regulatory Rejection / Suspension Reason (if any) */}
                {selectedHospital.decisionReason && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded text-rose-950 space-y-1">
                    <span className="font-bold font-mono text-[10px] uppercase text-[#B3203A] block">
                      Compliance Audit Finding
                    </span>
                    <p className="text-[11px] leading-relaxed">{selectedHospital.decisionReason}</p>
                  </div>
                )}

                {/* Facility Details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Facility Specifications & Location
                  </h4>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Physical Street Address
                      </span>
                      <p className="text-slate-800 font-medium mt-0.5">{selectedHospital.address}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">
                          Jurisdiction / City
                        </span>
                        <p className="text-slate-800 font-medium mt-0.5">{selectedHospital.city}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">
                          Registration Date
                        </span>
                        <p className="font-mono text-slate-800 mt-0.5">
                          {new Date(selectedHospital.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authorized Contact & Communications */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Authorized Clinical Liaison
                  </h4>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Contact Person
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selectedHospital.contactPerson}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2">
                      <a
                        href={`tel:${selectedHospital.phone}`}
                        className="inline-flex items-center gap-2 text-slate-800 hover:text-[#B3203A] font-mono text-[11px]"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedHospital.phone} (Click to dial)</span>
                      </a>

                      <a
                        href={`mailto:${selectedHospital.email}`}
                        className="inline-flex items-center gap-2 text-slate-800 hover:text-slate-900 font-mono text-[11px]"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedHospital.email}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Administrative Governance Actions
                  </h4>

                  <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                    <p className="text-slate-600 text-[11px]">
                      Hospital status governs whether this facility can place blood requisitions through the portal.
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                      {/* Approve Button */}
                      {selectedHospital.approvalStatus !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => setConfirmApproveOpen(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Accreditation</span>
                        </button>
                      )}

                      {/* Reject Button (reason required) */}
                      {selectedHospital.approvalStatus !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetDecision('REJECTED');
                            setActionReason('');
                            setReasonModalOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-semibold text-xs transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-[#B3203A]" />
                          <span>Reject Hospital Requisition</span>
                        </button>
                      )}

                      {/* Suspend Button (reason required) */}
                      {selectedHospital.approvalStatus === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetDecision('SUSPENDED');
                            setActionReason('');
                            setReasonModalOpen(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Suspend Clinical Ordering Privileges</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>PATCH /hospitals/{selectedHospital.id}/approval</span>
                <button
                  type="button"
                  onClick={() => setSelectedHospital(null)}
                  className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: APPROVE HOSPITAL */}
      {confirmApproveOpen && selectedHospital && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Accreditation Approval</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to approve accreditation for{' '}
              <strong>{selectedHospital.name}</strong> (License: {selectedHospital.licenseNo})?
            </p>
            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
              ✓ This hospital will immediately be permitted to place blood requisitions and receive unit dispatches.
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
                onClick={handleConfirmApprove}
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

      {/* CONFIRMATION DIALOG WITH REASON: REJECT OR SUSPEND */}
      {reasonModalOpen && selectedHospital && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-md w-full shadow-xl animate-in fade-in">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                {targetDecision === 'REJECTED' ? (
                  <>
                    <XCircle className="w-4 h-4 text-[#B3203A]" />
                    <span>Reject Hospital Accreditation</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Suspend Hospital Facility</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setReasonModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDecisionWithReason} className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Document reason for setting <strong>{selectedHospital.name}</strong> to{' '}
                <strong className="font-mono">{targetDecision}</strong>. This finding will be recorded in the compliance audit trail:
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason Description <span className="text-[#B3203A]">* (Mandatory)</span>
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  required
                  placeholder={
                    targetDecision === 'REJECTED'
                      ? 'e.g. Invalid license credentials, unverified address, or facility failed inspection...'
                      : 'e.g. Cold storage non-compliance, outstanding verification, or hospital requested temporary pause...'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReasonModalOpen(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-3.5 py-1.5 rounded text-white font-bold flex items-center gap-1 disabled:opacity-50 ${
                    targetDecision === 'REJECTED'
                      ? 'bg-[#B3203A] hover:bg-[#971930]'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Confirm {targetDecision === 'REJECTED' ? 'Rejection' : 'Suspension'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
