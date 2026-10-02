import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Droplet,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { donationsApi } from '../api/donations.api';
import { donorsApi } from '../api/donors.api';
import { DonorProfile } from '../types';
import { parseApiError } from '../api/client';
import { BloodGroupBadge } from '../components/BloodGroupBadge';
import { useToast } from '../components/ToastContext';

const TODAY_DATE = '2026-10-01';

const donationFormSchema = z.object({
  donorId: z.number().min(1, 'Please select a registered donor'),
  donationDate: z
    .string()
    .min(1, 'Donation date is required')
    .refine((val) => val <= TODAY_DATE, {
      message: 'Donation date cannot be set in the future',
    }),
  volumeMl: z
    .number()
    .min(300, 'Volume must be between 300ml and 500ml')
    .max(500, 'Volume cannot exceed 500ml'),
  notes: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationFormSchema>;

export const NewDonationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [loadingDonors, setLoadingDonors] = useState<boolean>(true);
  const [donorSearch, setDonorSearch] = useState<string>('');
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(
    searchParams.get('donorId') ? Number(searchParams.get('donorId')) : null
  );

  // Ineligibility error state (HTTP 422)
  const [ineligibleError, setIneligibleError] = useState<{
    message: string;
    nextEligibleDate?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      donorId: selectedDonorId || 0,
      donationDate: TODAY_DATE,
      volumeMl: 450,
      notes: '',
    },
  });

  // Load donors list
  useEffect(() => {
    const loadDonors = async () => {
      try {
        const res = await donorsApi.getDonors({ size: 100 });
        setDonors(res.content);
        if (selectedDonorId) {
          setValue('donorId', selectedDonorId);
        }
      } catch (err) {
        const parsed = parseApiError(err);
        showErrorToast(parsed.message, parsed.code);
      } finally {
        setLoadingDonors(false);
      }
    };
    loadDonors();
  }, [selectedDonorId, setValue, showErrorToast]);

  // Filtered donor options
  const filteredDonors = useMemo(() => {
    const q = donorSearch.trim().toLowerCase();
    if (!q) return donors;
    return donors.filter(
      (d) =>
        d.fullName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.city.toLowerCase().includes(q)
    );
  }, [donors, donorSearch]);

  const activeDonor = useMemo(() => {
    return donors.find((d) => d.id === selectedDonorId);
  }, [donors, selectedDonorId]);

  const handleSelectDonor = (donor: DonorProfile) => {
    setSelectedDonorId(donor.id);
    setValue('donorId', donor.id, { shouldValidate: true });
    setIneligibleError(null);
  };

  const onSubmit = async (values: DonationFormValues) => {
    setSubmitting(true);
    setIneligibleError(null);
    try {
      const created = await donationsApi.createDonation(values);
      showSuccessToast(
        `Recorded donation #${created.id} for ${created.donor.fullName}. Proceed with serology screening.`
      );
      // Navigate to donation detail with prompt to set screening
      navigate(`/donations/${created.id}`, { state: { justRecorded: true } });
    } catch (err: any) {
      const parsed = parseApiError(err);
      if (parsed.status === 422 || parsed.code === 'DONOR_NOT_ELIGIBLE') {
        // Extract next eligible date from message (e.g. YYYY-MM-DD pattern)
        const dateMatch = parsed.message.match(/\d{4}-\d{2}-\d{2}/);
        setIneligibleError({
          message: parsed.message,
          nextEligibleDate: dateMatch ? dateMatch[0] : undefined,
        });
      } else {
        showErrorToast(parsed.message, parsed.code);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
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
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Record Blood Donation Intake
            </h2>
            <p className="text-xs text-slate-500">
              Collect whole blood donation session and submit for serological laboratory screening.
            </p>
          </div>
        </div>
      </div>

      {/* Red Ineligibility Panel (on 422 DONOR_NOT_ELIGIBLE) */}
      {ineligibleError && (
        <section
          role="alert"
          aria-label="Donor Ineligibility Alert"
          className="bg-white rounded border-2 border-[#B3203A] p-4 shadow-sm space-y-3 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-[#B3203A] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white bg-[#B3203A] px-1.5 py-0.2 rounded">
                  HTTP 422 Deferral
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Clinical Donor Deferral: Ineligible For Phlebotomy
                </h3>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {ineligibleError.message}
              </p>
            </div>
          </div>

          {ineligibleError.nextEligibleDate && (
            <div className="bg-rose-50/70 p-3 rounded border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B3203A]" />
                <span className="text-slate-800 font-medium">
                  Next Permissible Donation Date:
                </span>
              </div>
              <span className="font-mono font-bold text-[#B3203A] text-sm tabular-nums">
                {ineligibleError.nextEligibleDate}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 text-xs pt-1">
            <Link
              to="/donors/eligible"
              className="text-[#B3203A] font-semibold hover:underline flex items-center gap-1"
            >
              <span>View On-Call Eligible Donors Registry</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Step 1: Donor Picker */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>1. Select Registered Donor</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Search by full name, telephone, or city
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Type to filter donors (e.g. Ravi, 987654...)"
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus-visible:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Quick donor selection chips */}
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
            {loadingDonors ? (
              <div className="p-3 text-xs text-slate-400">Loading donor roster...</div>
            ) : filteredDonors.length === 0 ? (
              <div className="p-3 text-xs text-slate-400 italic">No donors found matching query.</div>
            ) : (
              filteredDonors.map((d) => {
                const isSelected = selectedDonorId === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDonor(d)}
                    className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BloodGroupBadge group={d.bloodGroup} size="sm" />
                      <span className="font-semibold">{d.fullName}</span>
                      <span className={`font-mono text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {d.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {d.city}
                      </span>
                      {d.eligible ? (
                        <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                          Eligible
                        </span>
                      ) : (
                        <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'}`}>
                          Ineligible
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {errors.donorId && (
            <p className="text-[11px] text-[#B3203A] font-medium">{errors.donorId.message}</p>
          )}

          {/* Active Donor Information Summary Box */}
          {activeDonor && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <BloodGroupBadge group={activeDonor.bloodGroup} size="lg" />
                <div>
                  <h4 className="font-bold text-slate-900">{activeDonor.fullName}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    #{activeDonor.id} · {activeDonor.phone} · {activeDonor.city} · {activeDonor.weightKg}kg
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Clinical Status:</span>
                {activeDonor.eligible ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Eligible for intake
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300 font-mono text-[11px]">
                    <AlertCircle className="w-3 h-3" /> Deferred / Ineligible
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Session Parameters */}
        <div className="bg-white rounded border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Droplet className="w-3.5 h-3.5 text-[#B3203A]" />
            <span>2. Session Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Donation Collection Date <span className="text-[#B3203A]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  max={TODAY_DATE}
                  {...register('donationDate')}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono text-slate-900 focus-visible:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cannot be in the future (Default: {TODAY_DATE})
              </span>
              {errors.donationDate && (
                <p className="text-[11px] text-[#B3203A] mt-1">{errors.donationDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Volume Collected (ml) <span className="text-[#B3203A]">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="10"
                  min="300"
                  max="500"
                  {...register('volumeMl', { valueAsNumber: true })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono text-slate-900 focus-visible:outline-none"
                />
                <span className="font-mono text-xs text-slate-500">ml</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Permissible clinical range: 300 ml to 500 ml (Default: 450 ml)
              </span>
              {errors.volumeMl && (
                <p className="text-[11px] text-[#B3203A] mt-1">{errors.volumeMl.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Phlebotomy & Intake Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Arm venipuncture site, bag batch lot, donor tolerance remarks..."
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/donations')}
            className="px-4 py-2 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Droplet className="w-3.5 h-3.5 text-[#B3203A]" />
            <span>{submitting ? 'Recording Intake...' : 'Submit Donation Session'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
