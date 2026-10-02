import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Phone,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Calendar,
  Droplet,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { donorsApi } from '../api/donors.api';
import { BloodGroupCode, DonorProfile, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { useToast } from '../components/ToastContext';

export const EligibleDonorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast } = useToast();

  const [selectedGroup, setSelectedGroup] = useState<BloodGroupCode>('O-');
  const [data, setData] = useState<PageResponse<DonorProfile> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  const bloodGroups: BloodGroupCode[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

  const fetchEligibleDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await donorsApi.getEligibleDonors({
        bloodGroup: selectedGroup,
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
  }, [selectedGroup, page, size, showErrorToast]);

  useEffect(() => {
    fetchEligibleDonors();
  }, [fetchEligibleDonors]);

  return (
    <div className="space-y-4">
      {/* Emergency Header Banner */}
      <div className="bg-[#B3203A] text-white p-4 rounded shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-white/10 shrink-0">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                Emergency Calling Queue
              </span>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                Eligible Donors On-Call Registry
              </h2>
            </div>
            <p className="text-xs text-rose-100 mt-0.5">
              Contact verified eligible donors immediately via telephone for acute shortage or trauma demand.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/donors')}
          className="self-start sm:self-auto inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Donors Directory</span>
        </button>
      </div>

      {/* Group Selector Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700">Target Blood Group:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {bloodGroups.map((bg) => {
              const isSelected = selectedGroup === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  onClick={() => {
                    setSelectedGroup(bg);
                    setPage(0);
                  }}
                  className={`font-mono text-xs px-2.5 py-1 rounded border font-bold transition-all focus-visible:outline-none ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {bg}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEligibleDonors}
          className="self-end sm:self-auto inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 border border-slate-200"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Main Table */}
      {loading && !data ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchEligibleDonors} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title={`No eligible ${selectedGroup} donors found`}
          description={`No donors with blood group ${selectedGroup} currently meet the 90-day rest criteria and minimum weight requirements.`}
          actionLabel="Try Universal Group (O-)"
          onAction={() => {
            setSelectedGroup('O-');
            setPage(0);
          }}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Donor Name</th>
                  <th scope="col" className="px-3 py-2.5">Blood Group</th>
                  <th scope="col" className="px-3 py-2.5">Emergency Phone (Click to Call)</th>
                  <th scope="col" className="px-3 py-2.5">Location</th>
                  <th scope="col" className="px-3 py-2.5">Weight / Gender</th>
                  <th scope="col" className="px-3 py-2.5">Last Donation</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((donor) => (
                  <tr key={donor.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <Link
                        to={`/donors/${donor.id}`}
                        className="font-semibold text-slate-900 hover:text-[#B3203A] underline-offset-2 hover:underline block"
                      >
                        {donor.fullName}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">ID #{donor.id}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <BloodGroupBadge group={donor.bloodGroup} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <a
                        href={`tel:${donor.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-mono font-bold text-xs border border-emerald-300 transition-colors focus-visible:outline-none"
                        title="Click to dial on phone or calling app"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{donor.phone}</span>
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{donor.city}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-700">
                      {donor.weightKg} kg · {donor.gender}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {donor.lastDonationDate || 'Ready for 1st session'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <Link
                        to={`/donations/new?donorId=${donor.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Record Intake</span>
                      </Link>
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
