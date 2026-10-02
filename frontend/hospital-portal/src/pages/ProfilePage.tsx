import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { hospitalApi } from '../api/hospital';
import { Hospital, ApiError } from '../types';
import { parseApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { Building2, Save, RefreshCw, FileText, MapPin, Phone, User } from 'lucide-react';

const profileSchema = z.object({
  contactPerson: z.string().min(2, 'Contact person name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const { showSuccess, showApiError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hospitalData, setHospitalData] = useState<Hospital | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hospitalApi.getMyHospital();
      setHospitalData(data);
      reset({
        contactPerson: data.contactPerson,
        phone: data.phone,
        address: data.address,
        city: data.city,
      });
    } catch (err: any) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onSubmit = async (formData: ProfileFormData) => {
    setSaving(true);
    try {
      const updated = await hospitalApi.updateMyHospital(formData);
      setHospitalData(updated);
      await refreshUser();
      showSuccess('Hospital profile updated successfully', 'Changes Saved');
    } catch (err: any) {
      showApiError(parseApiError(err), 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hospital Desk Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Contract Section H · Facility licensing and contact officer details
          </p>
        </div>
        <button
          type="button"
          onClick={fetchProfile}
          disabled={loading}
          className="p-2 border border-slate-300 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
          title="Refresh Profile"
          aria-label="Refresh Profile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <ErrorState
          error={error}
          onRetry={fetchProfile}
          title="Failed to Load Hospital Profile"
        />
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : hospitalData ? (
        <div className="space-y-6">
          {/* Facility Status Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 text-[#0F6B63] flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{hospitalData.name}</h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Account Email: {hospitalData.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Verification Status
                </span>
                <StatusBadge status={hospitalData.approvalStatus} />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500">Government License:</span>{' '}
                  <strong className="font-mono text-slate-800">{hospitalData.licenseNo}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-500">Registration Date:</span>{' '}
                  <strong className="font-mono text-slate-800">
                    {new Date(hospitalData.createdAt).toLocaleDateString()}
                  </strong>
                </div>
              </div>
            </div>

            {hospitalData.decisionReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-[#B3203A]">
                <strong className="font-semibold uppercase tracking-wider block mb-0.5">
                  Administrative Note / Reason:
                </strong>
                {hospitalData.decisionReason}
              </div>
            )}
          </div>

          {/* Editable Contact Info Form */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
              Authorized Blood Desk Contacts
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactPerson"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Contact Person / Desk Lead *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="contactPerson"
                      type="text"
                      {...register('contactPerson')}
                      className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                        errors.contactPerson ? 'border-[#B3203A]' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.contactPerson && (
                    <p className="mt-1 text-xs text-[#B3203A]">
                      {errors.contactPerson.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Direct Desk Telephone *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="phone"
                      type="text"
                      {...register('phone')}
                      className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                        errors.phone ? 'border-[#B3203A]' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-[#B3203A]">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Hospital Street Address *
                  </label>
                  <input
                    id="address"
                    type="text"
                    {...register('address')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                      errors.address ? 'border-[#B3203A]' : 'border-slate-300'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-[#B3203A]">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    City / Municipality *
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('city')}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                      errors.city ? 'border-[#B3203A]' : 'border-slate-300'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-[#B3203A]">{errors.city.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6B63] hover:bg-[#0A4B45] text-white text-sm font-semibold rounded-md shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Hospital Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
