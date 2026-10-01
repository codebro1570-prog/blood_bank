import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  Droplet,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { adminApi } from '../api/admin.api';
import { bloodGroupsApi } from '../api/bloodGroups.api';
import { BloodGroupCode, CompatibleDonorsResponse, DashboardData } from '../types';
import { parseApiError } from '../api/client';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/ToastContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showErrorToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedGroupCompat, setSelectedGroupCompat] = useState<CompatibleDonorsResponse | null>(null);
  const [loadingCompat, setLoadingCompat] = useState<boolean>(false);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      if (isSilent) {
        showErrorToast(parsed.message, parsed.code);
      }
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Compatibility checker tool for staff
  const handleCheckCompatibility = async (group: BloodGroupCode) => {
    setLoadingCompat(true);
    try {
      const res = await bloodGroupsApi.getCompatibleDonors(group);
      setSelectedGroupCompat(res);
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoadingCompat(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded animate-pulse" />
        <CardSkeleton count={5} />
        <div className="h-64 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-12">
        <ErrorState error={error} onRetry={() => fetchDashboard()} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Red Emergency Banner (when emergencyPending > 0) */}
      {data.emergencyPending > 0 && (
        <section
          role="alert"
          aria-label="Critical Emergency Notification"
          className="bg-gradient-to-r from-[#B3203A] to-[#971930] text-white p-4 rounded shadow-md border-l-4 border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded bg-white/10 shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                  Critical Alert
                </span>
                <span className="font-bold text-sm sm:text-base tracking-tight">
                  {data.emergencyPending} Emergency Blood Request Pending Immediate Action
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Hospital emergency queue has trauma or critical surgery requests requiring expedited issuance.
              </p>
            </div>
          </div>

          <Link
            to="/requests"
            className="inline-flex items-center justify-center gap-1.5 bg-white text-[#B3203A] hover:bg-rose-50 text-xs font-bold px-4 py-2 rounded shadow-sm shrink-0 transition-colors focus-visible:outline-none"
          >
            <span>Review Request Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* Header controls & sync stamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Central Blood Bank Operations Console
          </h2>
          <p className="text-xs text-slate-500">
            Real-time inventory levels, operational throughput, and emergency triage.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="tabular-nums font-mono text-[11px]">
            Refreshed: {lastUpdated.toLocaleTimeString()} (60s cycle)
          </span>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <section aria-label="Key Performance Statistics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Pending Requests */}
          <Link
            to="/requests"
            className="group bg-white p-3.5 rounded border border-slate-200 hover:border-slate-300 shadow-xs transition-all hover:bg-slate-50/50"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium truncate">Pending Requests</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {data.pendingRequests}
              </span>
              {data.emergencyPending > 0 && (
                <span className="font-mono text-[10px] text-[#B3203A] font-bold">
                  ({data.emergencyPending} emg)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting review or dispatch</p>
          </Link>

          {/* Near-Expiry Units */}
          <Link
            to="/inventory"
            className="group bg-white p-3.5 rounded border border-slate-200 hover:border-amber-300 shadow-xs transition-all hover:bg-amber-50/20"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium truncate">Near-Expiry Units</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                {data.nearExpiryCount}
              </span>
              <span className="text-[11px] text-slate-500">units</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Within next 7 days</p>
          </Link>

          {/* Today's Donations */}
          <Link
            to="/donations"
            className="group bg-white p-3.5 rounded border border-slate-200 hover:border-slate-300 shadow-xs transition-all hover:bg-slate-50/50"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium truncate">Today’s Donations</span>
              <Droplet className="w-3.5 h-3.5 text-[#B3203A]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {data.todaysDonations}
              </span>
              <span className="text-[11px] text-slate-500">recorded</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Current collection session</p>
          </Link>

          {/* Issued This Month */}
          <Link
            to="/issues"
            className="group bg-white p-3.5 rounded border border-slate-200 hover:border-slate-300 shadow-xs transition-all hover:bg-slate-50/50"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium truncate">Issued This Month</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {data.issuedThisMonth}
              </span>
              <span className="text-[11px] text-slate-500">units</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Hospital dispatches</p>
          </Link>

          {/* Expired This Month */}
          <Link
            to="/inventory"
            className="group bg-white p-3.5 rounded border border-slate-200 hover:border-rose-300 shadow-xs transition-all hover:bg-rose-50/20 col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium truncate">Expired This Month</span>
              <Clock className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
                {data.expiredThisMonth}
              </span>
              <span className="text-[11px] text-slate-500">units</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Quarantined / Discard pending</p>
          </Link>
        </div>
      </section>

      {/* 3. 8 Stock Cards (one per blood group) */}
      <section aria-labelledby="stock-summary-heading">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 id="stock-summary-heading" className="text-sm font-bold text-slate-900 tracking-tight">
              Blood Stock By Group
            </h3>
            <p className="text-xs text-slate-500">
              Threshold alert triggered when inventory falls below 10 units. Click any group to verify compatible donors.
            </p>
          </div>
          <Link
            to="/inventory"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <span>Full Unit Inventory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {data.stockByGroup.map((item) => {
            const isLow = item.lowStock;
            return (
              <div
                key={item.bloodGroup}
                onClick={() => handleCheckCompatibility(item.bloodGroup)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckCompatibility(item.bloodGroup)}
                title={`Click to view compatibility for ${item.bloodGroup}`}
                className={`bg-white p-3 rounded transition-all cursor-pointer relative flex flex-col justify-between ${
                  isLow
                    ? 'border-2 border-[#B3203A] shadow-xs hover:bg-rose-50/20'
                    : 'border border-slate-200 hover:border-slate-400 hover:shadow-xs'
                }`}
              >
                {/* Low stock tag */}
                {isLow && (
                  <div className="absolute top-2 right-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-tight text-[#B3203A] bg-rose-50 px-1 py-0.5 rounded border border-[#B3203A]/30">
                      Low stock
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {item.bloodGroup}
                    </span>
                  </div>

                  <div className="my-2">
                    <span
                      className={`text-3xl font-mono font-bold tabular-nums block ${
                        isLow ? 'text-[#B3203A]' : 'text-slate-900'
                      }`}
                    >
                      {item.available}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      Available Units
                    </span>
                  </div>
                </div>

                {/* Small text for near-expiry and expired */}
                <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Near exp:</span>
                    <span
                      className={`tabular-nums font-semibold ${
                        item.nearExpiry > 0 ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      {item.nearExpiry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Expired:</span>
                    <span
                      className={`tabular-nums font-semibold ${
                        item.expired > 0 ? 'text-rose-700' : 'text-slate-600'
                      }`}
                    >
                      {item.expired}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Compatibility Quick Tool & Operational Guidelines */}
      <section className="bg-white rounded border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Compatibility & Cross-Matching Helper (Contract Section D)
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-1">Recipient:</span>
            {(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as BloodGroupCode[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleCheckCompatibility(g)}
                className={`font-mono text-xs px-2 py-0.5 rounded border transition-colors ${
                  selectedGroupCompat?.recipient === g
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loadingCompat ? (
          <div className="h-10 bg-slate-50 rounded animate-pulse" />
        ) : selectedGroupCompat ? (
          <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">
                Recipient <strong className="font-mono text-slate-900">{selectedGroupCompat.recipient}</strong> can receive red cells from:
              </span>
              <div className="flex items-center gap-1.5">
                {selectedGroupCompat.compatibleDonorGroups.map((cg) => (
                  <span
                    key={cg}
                    className="font-mono font-bold text-xs bg-white text-slate-900 border border-slate-300 px-2 py-0.5 rounded"
                  >
                    {cg}
                  </span>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-500 italic">
              Emergency substitution rule: Compatible donors may be dispatched when exact units are exhausted.
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Select any blood group card above or click a button to inspect compatible donor groups and safety protocols.
          </p>
        )}
      </section>

      {/* 5. Quick Action Links for Daily Operational Flow */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Hospital Request Queue</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Triage, approve, or issue units</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            Open Queue
          </button>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Record New Donation</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Collect and initiate screening</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/donations?action=new')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
          >
            New Donation
          </button>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Near-Expiry Quarantine</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Audit units approaching 42-day limit</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
          >
            Review Units
          </button>
        </div>
      </section>
    </div>
  );
};
