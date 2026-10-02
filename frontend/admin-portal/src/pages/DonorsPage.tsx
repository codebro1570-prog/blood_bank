import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  MapPin,
  RefreshCw,
  Plus,
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

export const DonorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<DonorProfile> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState<string>(''); // name or phone
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  const bloodGroups: BloodGroupCode[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const cities = ['Coimbatore', 'Chennai', 'Bangalore', 'Salem', 'Kochi', 'Madurai', 'Tiruppur', 'Pollachi'];

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await donorsApi.getDonors({
        q: search.trim() || undefined,
        bloodGroup: selectedGroup || undefined,
        city: selectedCity || undefined,
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
  }, [search, selectedGroup, selectedCity, page, size, showErrorToast]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  return (
    <div className="space-y-4">
      {/* Top Action & Filter Bar */}
      <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Registered Blood Donors Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Browse profiles, clinical eligibility, and historical whole blood intake sessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/donors/eligible"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              <span>Eligible On-Call Donors</span>
            </Link>

            <Link
              to="/donations/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Donation</span>
            </Link>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search donor by name or telephone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
            />
          </div>

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

          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus-visible:outline-none"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading && !data ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchDonors} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No donors match the current filters"
          description="Try broadening your search term or clearing the blood group or city filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedGroup('');
            setSelectedCity('');
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
                  <th scope="col" className="px-3 py-2.5">City</th>
                  <th scope="col" className="px-3 py-2.5">Phone Number</th>
                  <th scope="col" className="px-3 py-2.5">Last Donation</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Eligible (Yes/No)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {data.content.map((donor) => (
                  <tr
                    key={donor.id}
                    onClick={() => navigate(`/donors/${donor.id}`)}
                    className="hover:bg-slate-50/75 transition-colors cursor-pointer"
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-900 hover:text-[#B3203A] underline-offset-2">
                        {donor.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        #{donor.id} · {donor.gender} · {donor.weightKg}kg
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <BloodGroupBadge group={donor.bloodGroup} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{donor.city}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-800">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{donor.phone}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {donor.lastDonationDate || 'First-time donor'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {donor.eligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                          <XCircle className="w-3 h-3" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/donors/${donor.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors focus-visible:outline-none"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>View Profile</span>
                      </button>
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
