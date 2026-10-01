import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Trash2,
  Boxes,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { inventoryApi } from '../api/inventory.api';
import { BloodGroupCode, PageResponse, StockSummaryRow, Unit, UnitStatus } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/ToastContext';

type TabType = 'all' | 'near-expiry';
type DiscardReasonType = 'damaged' | 'contaminated' | 'other';

export const InventoryPage: React.FC = () => {
  const { showSuccessToast, showErrorToast } = useToast();

  // Summary State (Top Table)
  const [summaryData, setSummaryData] = useState<StockSummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // "All Units" Tab State
  const [allUnitsData, setAllUnitsData] = useState<PageResponse<Unit> | null>(null);
  const [loadingAllUnits, setLoadingAllUnits] = useState<boolean>(true);
  const [allUnitsError, setAllUnitsError] = useState<any>(null);

  // Filters for "All Units"
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [expiryFrom, setExpiryFrom] = useState<string>('');
  const [expiryTo, setExpiryTo] = useState<string>('');
  const [searchUnitNo, setSearchUnitNo] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  // "Near Expiry" Tab State
  const [nearExpiryDays, setNearExpiryDays] = useState<number>(7);
  const [nearExpiryUnits, setNearExpiryUnits] = useState<Unit[]>([]);
  const [loadingNearExpiry, setLoadingNearExpiry] = useState<boolean>(false);
  const [nearExpiryError, setNearExpiryError] = useState<any>(null);

  // Discard Dialog State
  const [discardUnitTarget, setDiscardUnitTarget] = useState<Unit | null>(null);
  const [reasonCategory, setReasonCategory] = useState<DiscardReasonType>('damaged');
  const [freeTextReason, setFreeTextReason] = useState<string>('');
  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);
  const [submittingDiscard, setSubmittingDiscard] = useState<boolean>(false);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await inventoryApi.getSummary();
      setSummaryData(res);
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoadingSummary(false);
    }
  }, [showErrorToast]);

  // Fetch all units paged
  const fetchAllUnits = useCallback(async () => {
    setLoadingAllUnits(true);
    setAllUnitsError(null);
    try {
      const res = await inventoryApi.getUnits({
        bloodGroup: selectedGroup || undefined,
        status: selectedStatus || undefined,
        expiryFrom: expiryFrom || undefined,
        expiryTo: expiryTo || undefined,
        q: searchUnitNo.trim() || undefined,
        page,
        size,
      });
      setAllUnitsData(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setAllUnitsError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoadingAllUnits(false);
    }
  }, [selectedGroup, selectedStatus, expiryFrom, expiryTo, searchUnitNo, page, size, showErrorToast]);

  // Fetch near-expiry units
  const fetchNearExpiry = useCallback(async () => {
    setLoadingNearExpiry(true);
    setNearExpiryError(null);
    try {
      const res = await inventoryApi.getNearExpiry(nearExpiryDays);
      setNearExpiryUnits(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setNearExpiryError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoadingNearExpiry(false);
    }
  }, [nearExpiryDays, showErrorToast]);

  // Initial load
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllUnits();
    } else {
      fetchNearExpiry();
    }
  }, [activeTab, fetchAllUnits, fetchNearExpiry]);

  // Helper for Days-to-Expiry cell styling
  // red under 3 days, amber under 7, normal otherwise
  const renderDaysToExpiryCell = (days: number) => {
    if (days < 0) {
      return (
        <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 tabular-nums">
          Expired ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (days < 3) {
      return (
        <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold text-[#B3203A] bg-rose-50 border border-[#B3203A]/30 tabular-nums animate-pulse">
          {days} days left
        </span>
      );
    }
    if (days < 7) {
      return (
        <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 tabular-nums">
          {days} days left
        </span>
      );
    }
    return (
      <span className="font-mono text-xs text-slate-700 tabular-nums font-medium">
        {days} days
      </span>
    );
  };

  // Open Discard Modal
  const openDiscardDialog = (unit: Unit) => {
    if (unit.status !== 'AVAILABLE') return;
    setDiscardUnitTarget(unit);
    setReasonCategory('damaged');
    setFreeTextReason('');
    setConfirmCheckbox(false);
  };

  // Handle Discard Submit
  const handleDiscardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discardUnitTarget) return;

    if (!confirmCheckbox) {
      showErrorToast('You must acknowledge that this disposal action cannot be undone.');
      return;
    }

    let finalReason = '';
    if (reasonCategory === 'damaged') {
      finalReason = 'Damaged: ' + (freeTextReason.trim() || 'Bag puncture, seal leak, or physical container damage');
    } else if (reasonCategory === 'contaminated') {
      finalReason = 'Contaminated: ' + (freeTextReason.trim() || 'Visual clot, hemolysis, or microbiological alert');
    } else {
      if (!freeTextReason.trim()) {
        showErrorToast('Please describe the specific reason for disposal under "Other".');
        return;
      }
      finalReason = 'Other: ' + freeTextReason.trim();
    }

    setSubmittingDiscard(true);
    try {
      await inventoryApi.discardUnit(discardUnitTarget.id, finalReason);
      showSuccessToast(
        `Unit ${discardUnitTarget.unitNumber} (${discardUnitTarget.bloodGroup}) discarded. Audit ledger updated.`
      );
      setDiscardUnitTarget(null);
      fetchSummary();
      if (activeTab === 'all') fetchAllUnits();
      else fetchNearExpiry();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setSubmittingDiscard(false);
    }
  };

  const bloodGroups: BloodGroupCode[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const unitStatuses: UnitStatus[] = ['AVAILABLE', 'ISSUED', 'EXPIRED', 'DISCARDED'];

  return (
    <div className="space-y-6">
      {/* 1. TOP TABLE: Inventory Summary (GET /inventory/summary) */}
      <section aria-labelledby="inventory-summary-heading" className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="inventory-summary-heading" className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-4 h-4 text-slate-700" />
              <span>Blood Group Stock Balance Summary</span>
            </h2>
            <p className="text-xs text-slate-500">
              Contract Section G summary. Threshold standard: 10 units. Groups with low stock highlighted in red.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSummary}
            className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors focus-visible:outline-none"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Refresh Summary</span>
          </button>
        </div>

        {loadingSummary && summaryData.length === 0 ? (
          <TableSkeleton rows={4} columns={6} />
        ) : (
          <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Blood Group</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Available</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Near Expiry (≤ 7d)</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Expired</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Safety Threshold</th>
                    <th scope="col" className="px-4 py-2.5 text-center">Low-Stock Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {summaryData.map((row) => {
                    const isLow = row.lowStock;
                    return (
                      <tr
                        key={row.bloodGroup}
                        className={`transition-colors ${
                          isLow
                            ? 'bg-rose-50/80 border-l-4 border-l-[#B3203A] text-rose-950 font-medium'
                            : 'hover:bg-slate-50/75 text-slate-800'
                        }`}
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <BloodGroupBadge group={row.bloodGroup} lowStock={isLow} />
                            {isLow && (
                              <span className="font-mono text-[10px] text-[#B3203A] font-bold uppercase">
                                Deficit Alert
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <span
                            className={`font-mono text-base font-bold tabular-nums ${
                              isLow ? 'text-[#B3203A]' : 'text-slate-900'
                            }`}
                          >
                            {row.available}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <span
                            className={`font-mono tabular-nums ${
                              row.nearExpiry > 0 ? 'text-amber-700 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {row.nearExpiry}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <span
                            className={`font-mono tabular-nums ${
                              row.expired > 0 ? 'text-rose-700 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {row.expired}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono tabular-nums text-slate-500">
                          {row.threshold} units
                        </td>
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#B3203A] bg-white px-2 py-0.5 rounded border border-[#B3203A]/40 shadow-xs">
                              <AlertCircle className="w-3 h-3 text-[#B3203A]" />
                              <span>LOW STOCK</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Adequate</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 2. TAB BAR: "All units" vs "Near expiry" */}
      <section className="space-y-4">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors focus-visible:outline-none flex items-center gap-2 ${
              activeTab === 'all'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>All Units</span>
            {allUnitsData && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                {allUnitsData.totalElements}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('near-expiry')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors focus-visible:outline-none flex items-center gap-2 ${
              activeTab === 'near-expiry'
                ? 'border-[#B3203A] text-[#B3203A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Near Expiry Quarantine</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
              {nearExpiryUnits.length > 0 ? nearExpiryUnits.length : 'Review'}
            </span>
          </button>
        </div>

        {/* TAB 1: ALL UNITS TAB */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {/* Filters bar for All Units */}
            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Search Unit Number */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search unit number (BB-...)"
                    value={searchUnitNo}
                    onChange={(e) => {
                      setSearchUnitNo(e.target.value);
                      setPage(0);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-900 placeholder:text-slate-400 focus-visible:outline-none"
                  />
                </div>

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

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(0);
                  }}
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus-visible:outline-none"
                >
                  <option value="">All Statuses</option>
                  {unitStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                {/* Reset Filters button */}
                {(selectedGroup || selectedStatus || expiryFrom || expiryTo || searchUnitNo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroup('');
                      setSelectedStatus('');
                      setExpiryFrom('');
                      setExpiryTo('');
                      setSearchUnitNo('');
                      setPage(0);
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              {/* Expiry Range Pickers */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Expiry Range:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">From</span>
                  <input
                    type="date"
                    value={expiryFrom}
                    onChange={(e) => {
                      setExpiryFrom(e.target.value);
                      setPage(0);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 focus-visible:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">To</span>
                  <input
                    type="date"
                    value={expiryTo}
                    onChange={(e) => {
                      setExpiryTo(e.target.value);
                      setPage(0);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 focus-visible:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Paged Table for All Units */}
            {loadingAllUnits && !allUnitsData ? (
              <TableSkeleton rows={8} columns={7} />
            ) : allUnitsError && !allUnitsData ? (
              <ErrorState error={allUnitsError} onRetry={fetchAllUnits} />
            ) : !allUnitsData || allUnitsData.content.length === 0 ? (
              <EmptyState
                title="No inventory units match criteria"
                description="Adjust your search filters or expiry dates to view stored units."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSelectedGroup('');
                  setSelectedStatus('');
                  setExpiryFrom('');
                  setExpiryTo('');
                  setSearchUnitNo('');
                }}
              />
            ) : (
              <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th scope="col" className="px-3.5 py-2.5">Unit Number</th>
                        <th scope="col" className="px-3 py-2.5">Blood Group</th>
                        <th scope="col" className="px-3 py-2.5">Collection Date</th>
                        <th scope="col" className="px-3 py-2.5">Expiry Date</th>
                        <th scope="col" className="px-3 py-2.5">Days to Expiry</th>
                        <th scope="col" className="px-3 py-2.5">Status</th>
                        <th scope="col" className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                      {allUnitsData.content.map((unit) => {
                        const isAvailable = unit.status === 'AVAILABLE';

                        return (
                          <tr key={unit.id} className="hover:bg-slate-50/75 transition-colors">
                            <td className="px-3.5 py-2.5 whitespace-nowrap font-mono font-bold text-slate-900">
                              {unit.unitNumber}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <BloodGroupBadge group={unit.bloodGroup} />
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                              {unit.collectionDate}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                              {unit.expiryDate}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {renderDaysToExpiryCell(unit.daysToExpiry)}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <StatusBadge status={unit.status} />
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              {isAvailable ? (
                                <button
                                  type="button"
                                  onClick={() => openDiscardDialog(unit)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors focus-visible:outline-none"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Discard</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200 opacity-60 cursor-not-allowed"
                                  title="Only AVAILABLE units can be discarded"
                                >
                                  <span>Non-available</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={allUnitsData.page}
                  size={allUnitsData.size}
                  totalElements={allUnitsData.totalElements}
                  totalPages={allUnitsData.totalPages}
                  onPageChange={(p) => setPage(p)}
                  onSizeChange={(s) => setSize(s)}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NEAR EXPIRY TAB (GET /inventory/near-expiry?days=...) */}
        {activeTab === 'near-expiry' && (
          <div className="space-y-4">
            {/* Days selector bar */}
            <div className="bg-white p-3.5 rounded border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-800">
                  Select Quarantine Horizon:
                </span>
                <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
                  {[3, 7, 14].map((d) => {
                    const isSelected = nearExpiryDays === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNearExpiryDays(d)}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors focus-visible:outline-none ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {d} Days
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Query: GET /inventory/near-expiry?days={nearExpiryDays}
                </span>
              </div>
            </div>

            {/* Near Expiry List */}
            {loadingNearExpiry ? (
              <TableSkeleton rows={5} columns={6} />
            ) : nearExpiryError ? (
              <ErrorState error={nearExpiryError} onRetry={fetchNearExpiry} />
            ) : nearExpiryUnits.length === 0 ? (
              <EmptyState
                title={`No units expiring within ${nearExpiryDays} days`}
                description="All active available stock has safe shelf-life duration remaining."
                actionLabel="Check 14-Day Horizon"
                onAction={() => setNearExpiryDays(14)}
              />
            ) : (
              <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th scope="col" className="px-3.5 py-2.5">Unit Number</th>
                        <th scope="col" className="px-3 py-2.5">Blood Group</th>
                        <th scope="col" className="px-3 py-2.5">Collection Date</th>
                        <th scope="col" className="px-3 py-2.5">Expiry Date</th>
                        <th scope="col" className="px-3 py-2.5">Days to Expiry</th>
                        <th scope="col" className="px-3 py-2.5">Status</th>
                        <th scope="col" className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                      {nearExpiryUnits.map((unit) => {
                        const isAvailable = unit.status === 'AVAILABLE';

                        return (
                          <tr key={unit.id} className="hover:bg-slate-50/75 transition-colors bg-amber-50/15">
                            <td className="px-3.5 py-2.5 whitespace-nowrap font-mono font-bold text-slate-900">
                              {unit.unitNumber}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <BloodGroupBadge group={unit.bloodGroup} />
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                              {unit.collectionDate}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                              {unit.expiryDate}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              {renderDaysToExpiryCell(unit.daysToExpiry)}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <StatusBadge status={unit.status} />
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              {isAvailable ? (
                                <button
                                  type="button"
                                  onClick={() => openDiscardDialog(unit)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors focus-visible:outline-none"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Discard</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200 opacity-60 cursor-not-allowed"
                                >
                                  <span>Non-available</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                  <span className="font-mono">
                    Showing {nearExpiryUnits.length} near-expiry units ordered by earliest expiry date.
                  </span>
                  <span className="italic">
                    Ensure older units are prioritized for dispatch before expiration.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. DISCARD DIALOG:
          - Only on AVAILABLE units
          - Reason: damaged, contaminated, other + free text
          - Confirmation: "This cannot be undone"
          - POST /inventory/units/{id}/discard
      */}
      {discardUnitTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded border border-slate-200 max-w-md w-full shadow-xl animate-in fade-in">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-rose-800">
                <Trash2 className="w-4 h-4 text-[#B3203A]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Dispose & Discard Blood Unit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDiscardUnitTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDiscardSubmit} className="p-4 space-y-4 text-xs">
              {/* Unit Summary Card */}
              <div className="bg-rose-50/50 p-3 rounded border border-rose-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {discardUnitTarget.unitNumber}
                  </span>
                  <BloodGroupBadge group={discardUnitTarget.bloodGroup} />
                </div>
                <div className="text-[11px] text-slate-600 font-mono flex items-center justify-between pt-1">
                  <span>Collected: {discardUnitTarget.collectionDate}</span>
                  <span>Expires: {discardUnitTarget.expiryDate}</span>
                </div>
              </div>

              {/* Reason Category Selection (damaged, contaminated, other) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Select Disposal Classification <span className="text-[#B3203A]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReasonCategory('damaged')}
                    className={`py-2 px-2.5 rounded border text-center font-medium transition-all ${
                      reasonCategory === 'damaged'
                        ? 'bg-rose-50 border-[#B3203A] text-rose-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Damaged
                  </button>

                  <button
                    type="button"
                    onClick={() => setReasonCategory('contaminated')}
                    className={`py-2 px-2.5 rounded border text-center font-medium transition-all ${
                      reasonCategory === 'contaminated'
                        ? 'bg-rose-50 border-[#B3203A] text-rose-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Contaminated
                  </button>

                  <button
                    type="button"
                    onClick={() => setReasonCategory('other')}
                    className={`py-2 px-2.5 rounded border text-center font-medium transition-all ${
                      reasonCategory === 'other'
                        ? 'bg-rose-50 border-[#B3203A] text-rose-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>

              {/* Free Text Reason Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Reason Description / Laboratory Notes {reasonCategory === 'other' && <span className="text-[#B3203A]">* (Required)</span>}
                </label>
                <textarea
                  value={freeTextReason}
                  onChange={(e) => setFreeTextReason(e.target.value)}
                  rows={2}
                  required={reasonCategory === 'other'}
                  placeholder={
                    reasonCategory === 'damaged'
                      ? 'e.g. Seal puncture, port defect, or transportation container fracture...'
                      : reasonCategory === 'contaminated'
                      ? 'e.g. Visual bacterial turbidity, abnormal hemolysis, or pathogen reactive notice...'
                      : 'Provide explicit regulatory explanation for discarding this unit...'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
                />
              </div>

              {/* Irreversible Confirmation Warning */}
              <div className="bg-rose-50 border-2 border-[#B3203A] p-3 rounded text-rose-950 space-y-2">
                <div className="flex items-center gap-2 text-[#B3203A] font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="uppercase tracking-wider font-mono text-[11px]">
                    Irreversible Regulatory Action
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  <strong>This cannot be undone.</strong> The selected blood unit will be permanently
                  de-indexed from available therapeutic inventory and logged as destroyed in the compliance audit trail.
                </p>

                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    className="mt-0.5 rounded text-[#B3203A] focus:ring-[#B3203A] border-slate-300"
                    required
                  />
                  <span className="font-semibold text-rose-900 text-xs">
                    I acknowledge that this action cannot be undone.
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDiscardUnitTarget(null)}
                  className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscard || !confirmCheckbox}
                  className="px-4 py-1.5 rounded bg-[#B3203A] hover:bg-[#971930] text-white font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{submittingDiscard ? 'Processing Discard...' : 'Confirm Discard'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
