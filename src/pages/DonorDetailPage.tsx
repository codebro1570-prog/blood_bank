import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Droplet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Clock,
  User,
} from 'lucide-react';
import { donorsApi } from '../api/donors.api';
import { DonorProfile } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton, CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

export const DonorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showErrorToast } = useToast();

  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchDonor = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await donorsApi.getDonorById(Number(id));
      setDonor(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [id, showErrorToast]);

  useEffect(() => {
    fetchDonor();
  }, [fetchDonor]);

  if (loading && !donor) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <CardSkeleton count={4} />
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

  if (error && !donor) {
    return (
      <div className="py-8">
        <ErrorState error={error} onRetry={fetchDonor} title="Donor Record Not Found" />
      </div>
    );
  }

  if (!donor) return null;

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/donors')}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors focus-visible:outline-none"
            aria-label="Back to donors list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {donor.fullName}
              </h2>
              <BloodGroupBadge group={donor.bloodGroup} size="sm" />
              <span className="font-mono text-[11px] text-slate-400">Donor #{donor.id}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Profile details, clinical eligibility status, and donation audit ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDonor}
            className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh details"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <Link
            to={`/donations/new?donorId=${donor.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors focus-visible:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Donation</span>
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded border border-slate-200 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Donor Biological & Contact Information
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Blood Group</span>
            <div className="mt-1">
              <BloodGroupBadge group={donor.bloodGroup} size="lg" />
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Eligibility Status</span>
            <div className="mt-1">
              {donor.eligible ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Eligible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                  <XCircle className="w-3 h-3" /> Ineligible
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">90-day interval rule</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Phone Number</span>
            <a
              href={`tel:${donor.phone}`}
              className="mt-1 font-mono font-bold text-slate-900 hover:text-[#B3203A] flex items-center gap-1 inline-flex"
            >
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{donor.phone}</span>
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">Click to call</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Email Address</span>
            <a
              href={`mailto:${donor.email}`}
              className="mt-1 font-mono text-slate-800 hover:text-slate-900 block truncate"
              title={donor.email}
            >
              {donor.email}
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">Direct contact</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Location</span>
            <div className="mt-1 font-medium text-slate-800 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{donor.city}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Bio Stats</span>
            <div className="mt-1 font-mono text-slate-800">
              {donor.weightKg} kg · {donor.gender}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">DOB: {donor.dob}</div>
          </div>
        </div>

        {/* Operational notes banner */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Last Donation: <strong className="font-mono text-slate-800">{donor.lastDonationDate || 'None recorded'}</strong>
            </span>
            <span>·</span>
            <span>
              Lifetime Units Donated: <strong className="font-mono font-bold text-slate-900">{donor.totalDonations}</strong>
            </span>
          </div>

          {!donor.eligible && (
            <span className="text-[11px] font-medium text-[#B3203A] bg-rose-50 px-2 py-0.5 rounded border border-[#B3203A]/20">
              Donor deferral period active. Next donation allowed after mandatory rest interval.
            </span>
          )}
        </div>
      </div>

      {/* Donation History Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-[#B3203A]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Historical Donation Ledger ({donor.donations?.length || 0} Sessions)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">GET /donors/{donor.id}</span>
        </div>

        {!donor.donations || donor.donations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No donation sessions recorded yet for {donor.fullName}.
            <div className="mt-3">
              <Link
                to={`/donations/new?donorId=${donor.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Initial Donation Session</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Session ID / Date</th>
                  <th scope="col" className="px-3 py-2.5">Volume (ml)</th>
                  <th scope="col" className="px-3 py-2.5">Allocated Unit</th>
                  <th scope="col" className="px-3 py-2.5">Laboratory Screening</th>
                  <th scope="col" className="px-3 py-2.5">Logged By</th>
                  <th scope="col" className="px-3 py-2.5 text-right">View Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {donor.donations.map((dn) => (
                  <tr key={dn.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="font-mono font-semibold text-slate-900">#{dn.id}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{dn.donationDate}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono tabular-nums font-medium text-slate-800">
                      {dn.volumeMl} ml
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {dn.unitNumber ? (
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {dn.unitNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px] italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <StatusBadge status={dn.screeningStatus} />
                        {dn.failureReason && (
                          <span className="text-[10px] text-rose-700 leading-tight">
                            {dn.failureReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {dn.recordedBy?.email || 'System'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <Link
                        to={`/donations/${dn.id}`}
                        className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                      >
                        Inspect Session
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
