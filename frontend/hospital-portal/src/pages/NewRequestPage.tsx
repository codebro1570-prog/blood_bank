import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { requestsApi } from '../api/requests';
import { BloodGroupCode, RequestPriority } from '../types';
import { useToast } from '../components/Toast';
import { parseApiError } from '../api/client';
import { EmptyState } from '../components/EmptyState';
import {
  AlertTriangle,
  Send,
  ArrowLeft,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroupCode[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface CreateRequestFormData {
  bloodGroup: BloodGroupCode;
  unitsRequested: number;
  priority: RequestPriority;
  requiredBy: string;
  patientNote?: string;
}

const createRequestSchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const, {
    message: 'Valid blood group required',
  }),
  unitsRequested: z
    .number()
    .min(1, 'At least 1 unit must be requested')
    .max(20, 'Maximum 20 units per request'),
  priority: z.enum(['EMERGENCY', 'URGENT', 'NORMAL'] as const, {
    message: 'Priority is required',
  }),
  requiredBy: z.string().min(1, 'Required by date and time is mandatory'),
  patientNote: z.string().max(200, 'Note cannot exceed 200 characters').optional(),
});

export const NewRequestPage: React.FC = () => {
  const { approvalStatus } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showApiError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Default requiredBy to 4 hours from now in ISO format for clinical convenience
  const defaultRequiredBy = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      bloodGroup: 'O+',
      unitsRequested: 2,
      priority: 'NORMAL',
      requiredBy: defaultRequiredBy,
      patientNote: '',
    },
  });

  const selectedPriority = watch('priority');

  const onSubmit = async (data: CreateRequestFormData) => {
    setSubmitting(true);
    setFieldErrors({});
    try {
      // Convert datetime-local string to ISO UTC format
      const requiredByUtc = new Date(data.requiredBy).toISOString();
      const res = await requestsApi.createRequest({
        bloodGroup: data.bloodGroup,
        unitsRequested: data.unitsRequested,
        priority: data.priority,
        requiredBy: requiredByUtc,
        patientNote: data.patientNote?.trim() || undefined,
      });

      showSuccess(`Blood request ${res.requestNo} placed successfully!`, 'Request Submitted');
      navigate('/requests');
    } catch (err: any) {
      const parsed = parseApiError(err);
      showApiError(parsed, 'Submission Error');
      if (parsed.details && parsed.details.length > 0) {
        const detailsMap: Record<string, string> = {};
        parsed.details.forEach((d) => {
          detailsMap[d.field] = d.message;
        });
        setFieldErrors(detailsMap);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // If hospital is not approved, show empty/blocked state
  if (approvalStatus !== 'APPROVED') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            New Blood Requisition
          </h1>
        </div>

        <EmptyState
          icon={AlertTriangle}
          title="Blood Request Feature Restricted"
          description={`Your hospital approval status is currently ${approvalStatus}. Blood Bank regulations (API Section I) require an APPROVED hospital license before blood units can be ordered.`}
          actionLabel="Return to Dashboard"
          onAction={() => navigate('/dashboard')}
          secondaryActionLabel="Check Profile Status"
          onSecondaryAction={() => navigate('/profile')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Blood Request
            </h1>
            <p className="text-xs text-slate-500">
              Contract Section I · Header Idempotency-Key attached
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Blood Group and Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="bloodGroup"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Required Blood Group *
              </label>
              <select
                id="bloodGroup"
                {...register('bloodGroup')}
                className={`mt-1.5 block w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                  errors.bloodGroup || fieldErrors.bloodGroup
                    ? 'border-[#B3203A]'
                    : 'border-slate-300'
                }`}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
              {(errors.bloodGroup || fieldErrors.bloodGroup) && (
                <p className="mt-1 text-xs text-[#B3203A]">
                  {errors.bloodGroup?.message || fieldErrors.bloodGroup}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="unitsRequested"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Units Requested (Bags) *
              </label>
              <input
                id="unitsRequested"
                type="number"
                min={1}
                max={20}
                {...register('unitsRequested', { valueAsNumber: true })}
                className={`mt-1.5 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                  errors.unitsRequested || fieldErrors.unitsRequested
                    ? 'border-[#B3203A]'
                    : 'border-slate-300'
                }`}
              />
              {(errors.unitsRequested || fieldErrors.unitsRequested) && (
                <p className="mt-1 text-xs text-[#B3203A]">
                  {errors.unitsRequested?.message || fieldErrors.unitsRequested}
                </p>
              )}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Clinical Priority *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 border rounded-lg cursor-pointer flex items-start gap-2.5 transition-colors ${
                  selectedPriority === 'NORMAL'
                    ? 'border-[#0F6B63] bg-teal-50/40 ring-1 ring-[#0F6B63]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  value="NORMAL"
                  {...register('priority')}
                  className="mt-0.5 text-[#0F6B63] focus:ring-[#0F6B63]"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    NORMAL
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Scheduled surgery or routine care</p>
                </div>
              </label>

              <label
                className={`p-3 border rounded-lg cursor-pointer flex items-start gap-2.5 transition-colors ${
                  selectedPriority === 'URGENT'
                    ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  value="URGENT"
                  {...register('priority')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    URGENT
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Required within 2-4 hours</p>
                </div>
              </label>

              <label
                className={`p-3 border rounded-lg cursor-pointer flex items-start gap-2.5 transition-colors ${
                  selectedPriority === 'EMERGENCY'
                    ? 'border-[#B3203A] bg-red-50/60 ring-1 ring-[#B3203A]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  value="EMERGENCY"
                  {...register('priority')}
                  className="mt-0.5 text-[#B3203A] focus:ring-[#B3203A]"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B3203A]">
                    <Flame className="w-3.5 h-3.5 text-[#B3203A]" />
                    EMERGENCY
                  </div>
                  <p className="text-[11px] text-red-700 mt-0.5">Immediate trauma / life threat</p>
                </div>
              </label>
            </div>
            {(errors.priority || fieldErrors.priority) && (
              <p className="mt-1 text-xs text-[#B3203A]">
                {errors.priority?.message || fieldErrors.priority}
              </p>
            )}
          </div>

          {/* Required By Date/Time */}
          <div>
            <label
              htmlFor="requiredBy"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Required By (Date & Time) *
            </label>
            <input
              id="requiredBy"
              type="datetime-local"
              {...register('requiredBy')}
              className={`mt-1.5 block w-full sm:w-80 px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                errors.requiredBy || fieldErrors.requiredBy
                  ? 'border-[#B3203A]'
                  : 'border-slate-300'
              }`}
            />
            {(errors.requiredBy || fieldErrors.requiredBy) && (
              <p className="mt-1 text-xs text-[#B3203A]">
                {errors.requiredBy?.message || fieldErrors.requiredBy}
              </p>
            )}
          </div>

          {/* Patient Note */}
          <div>
            <label
              htmlFor="patientNote"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Clinical Reason / OT Note (Optional)
            </label>
            <textarea
              id="patientNote"
              rows={3}
              {...register('patientNote')}
              placeholder="e.g., Trauma OT 2, active obstetric bleed, patient bed #14"
              className={`mt-1.5 block w-full px-3 py-2 border rounded-md text-sm placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                errors.patientNote || fieldErrors.patientNote
                  ? 'border-[#B3203A]'
                  : 'border-slate-300'
              }`}
            />
            {(errors.patientNote || fieldErrors.patientNote) && (
              <p className="mt-1 text-xs text-[#B3203A]">
                {errors.patientNote?.message || fieldErrors.patientNote}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-md shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                selectedPriority === 'EMERGENCY'
                  ? 'bg-[#B3203A] hover:bg-[#8F192E] focus-visible:ring-[#B3203A]'
                  : 'bg-[#0F6B63] hover:bg-[#0A4B45] focus-visible:ring-[#0F6B63]'
              } disabled:opacity-60`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Requisition...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Place Requisition</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
