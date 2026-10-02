import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Droplet,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Layers,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { donationsApi } from '../api/donations.api';
import { Donation } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export const DonationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccessToast, showErrorToast } = useToast();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Dialog states for screening
  const [confirmPassOpen, setConfirmPassOpen] = useState<boolean>(false);
  const [failDialogOpen, setFailDialogOpen] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>(
    'Low hemoglobin level (below 12.5 g/dL requirement)'
  );
  const [submittingScreening, setSubmittingScreening] = useState<boolean>(false);

  const fetchDonation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await donationsApi.getDonationById(Number(id));
      setDonation(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [id, showErrorToast]);

  useEffect(() => {
    fetchDonation();
  }, [fetchDonation]);

  const handleMarkPassed = async () => {
    if (!donation) return;
    setSubmittingScreening(true);
    try {
      const updated = await donationsApi.updateScreening(donation.id, {
        result: 'PASSED',
      });
      setDonation(updated);
      setConfirmPassOpen(false);
      showSuccessToast(
        `Screening PASSED: Unit ${updated.unitNumber} (${updated.donor.bloodGroup}) generated and placed into clinical inventory!`
      );
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setSubmittingScreening(false);
    }
  };

  const handleMarkFailed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donation) return;
    if (!failureReason.trim()) {
      showErrorToast('A failure reason is required.');
      return;
    }

    setSubmittingScreening(true);
    try {
      const updated = await donationsApi.updateScreening(donation.id, {
        result: 'FAILED',
        failureReason,
      });
      setDonation(updated);
      setFailDialogOpen(false);
      showSuccessToast(`Donation #${donation.id} marked as FAILED with documented reason.`);
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setSubmittingScreening(false);
    }
  };

  if (loading && !donation) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="h-32 bg-slate-200 rounded animate-pulse" />
        <TableSkeleton rows={3} columns={4} />
      </div>
    );
  }

  if (error && !donation) {
    return (
      <div className="py-8">
        <ErrorState error={error} onRetry={fetchDonation} title="Donation Session Not Found" />
      </div>
    );
  }

  if (!donation) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/donations')}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors focus-visible:outline-none"
            aria-label="Back to donations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Donation Session #{donation.id}
              </h2>
              <BloodGroupBadge group={donation.donor.bloodGroup} size="sm" />
              <StatusBadge status={donation.screeningStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Collected on <span className="font-mono">{donation.donationDate}</span> · Logged by {donation.recordedBy.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDonation}
          className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          title="Refresh record"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prompt to Set Screening (when PENDING) */}
      {donation.screeningStatus === 'PENDING' && (
        <section
          role="alert"
          aria-label="Screening Pending Action Prompt"
          className="bg-amber-50 border-2 border-amber-400 text-amber-950 p-4 rounded shadow-xs space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-amber-100 text-amber-900 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded">
                  Screening Required
                </span>
                <h3 className="text-sm font-bold">
                  Laboratory Serology Verification Pending
                </h3>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                This whole blood unit is quarantined until serological viral screening (HIV, HBV, HCV, Syphilis)
                and blood group confirmation are completed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-200">
            <button
              type="button"
              onClick={() => setFailDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 text-xs font-semibold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Mark Screening Failed</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmPassOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Screening Passed</span>
            </button>
          </div>
        </section>
      )}

      {/* Unit Created Success Banner */}
      {donation.screeningStatus === 'PASSED' && donation.unitNumber && (
        <section className="bg-emerald-50 border border-emerald-300 p-3.5 rounded text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Clinical Inventory Stocked</p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Official Unit Number <strong className="font-mono text-emerald-950 font-bold">{donation.unitNumber}</strong> has been allocated with 42-day shelf life.
              </p>
            </div>
          </div>

          <Link
            to="/inventory"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shrink-0"
          >
            <span>View in Inventory</span>
            <span>→</span>
          </Link>
        </section>
      )}

      {/* Failure Reason Banner */}
      {donation.screeningStatus === 'FAILED' && donation.failureReason && (
        <section className="bg-rose-50 border border-rose-300 p-3.5 rounded text-rose-950 text-xs space-y-1">
          <div className="flex items-center gap-2 text-rose-800 font-bold">
            <XCircle className="w-4 h-4 text-[#B3203A]" />
            <span>Screening Rejection Documented</span>
          </div>
          <p className="text-rose-900 pl-6">{donation.failureReason}</p>
        </section>
      )}

      {/* Details Grid */}
      <div className="bg-white rounded border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Session Ledger Metrics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Donor</span>
            <Link
              to={`/donors/${donation.donor.id}`}
              className="mt-1 font-bold text-slate-900 hover:text-[#B3203A] underline block"
            >
              {donation.donor.fullName}
            </Link>
            <span className="text-[10px] text-slate-400 font-mono">#{donation.donor.id}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Blood Group</span>
            <div className="mt-1">
              <BloodGroupBadge group={donation.donor.bloodGroup} size="lg" />
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Volume Collected</span>
            <div className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
              {donation.volumeMl} ml
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Allocated Unit</span>
            <div className="mt-1 font-mono font-bold text-xs text-blue-700">
              {donation.unitNumber || 'Pending clearance'}
            </div>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 font-mono flex flex-wrap gap-4">
          <span>Created UTC: {new Date(donation.createdAt).toLocaleString()}</span>
          <span>·</span>
          <span>Logged by: {donation.recordedBy.email}</span>
        </div>
      </div>

      {/* Confirmation Dialog for Mark Passed */}
      {confirmPassOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-sm w-full p-4 shadow-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Serology PASSED</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to mark donation #{donation.id} for <strong>{donation.donor.fullName}</strong> as PASSED?
              This will officially mint a new inventory blood unit and increment available stock.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmPassOpen(false)}
                className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkPassed}
                disabled={submittingScreening}
                className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
              >
                {submittingScreening ? 'Processing...' : 'Confirm Passed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for Mark Failed with Reason */}
      {failDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-md w-full shadow-xl animate-in fade-in">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-rose-800">
                <XCircle className="w-4 h-4 text-[#B3203A]" />
                <span>Mark Screening Test As FAILED</span>
              </h3>
              <button
                type="button"
                onClick={() => setFailDialogOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkFailed} className="p-4 space-y-3.5 text-xs">
              <p className="text-slate-600">
                Marking screening as FAILED requires documenting the clinical or laboratory reason in the audit ledger.
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rejection Reason <span className="text-[#B3203A]">*</span>
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
                  <option value="Bacterial contamination detected on culture">Bacterial contamination detected on culture</option>
                </select>

                <textarea
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  rows={2}
                  placeholder="Or enter custom laboratory finding..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFailDialogOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingScreening}
                  className="px-3.5 py-1.5 rounded bg-[#B3203A] hover:bg-[#971930] text-white font-bold disabled:opacity-50"
                >
                  {submittingScreening ? 'Processing...' : 'Confirm Failed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
