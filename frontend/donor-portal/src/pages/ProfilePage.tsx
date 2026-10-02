/**
 * Donor Profile Page (/profile)
 * View and edit: fullName, phone, weight, city.
 * Blood group and date of birth are read-only.
 * Save with PUT /donors/me, success toast.
 * Uses GET /donors/me and GET /donors/me/eligibility.
 * Handles loading skeleton and error with retry.
 */

import React, { useEffect, useState, useCallback, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Phone,
  Scale,
  MapPin,
  Calendar,
  Heart,
  Lock,
  Save,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { donorApi } from '../api/donor';
import { DonorProfile, Eligibility, ApiError } from '../types';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/Toast';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';
import { AxiosError } from 'axios';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  weightKg: z
    .number()
    .min(30, 'Please enter a realistic weight in kg')
    .max(250, 'Please enter a valid weight in kg'),
  city: z.string().min(2, 'City is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fullNameId = useId();
  const phoneId = useId();
  const weightKgId = useId();
  const cityId = useId();
  const dobId = useId();
  const bloodGroupId = useId();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError: setFieldError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const watchedWeight = watch('weightKg');

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [profileData, eligibilityData] = await Promise.all([
        donorApi.getProfile(),
        donorApi.getEligibility(),
      ]);
      setProfile(profileData);
      setEligibility(eligibilityData);
      reset({
        fullName: profileData.fullName,
        phone: profileData.phone,
        weightKg: profileData.weightKg,
        city: profileData.city,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unable to load donor profile.'));
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const updated = await donorApi.updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        weightKg: Number(data.weightKg),
        city: data.city,
      });
      setProfile(updated);
      reset({
        fullName: updated.fullName,
        phone: updated.phone,
        weightKg: updated.weightKg,
        city: updated.city,
      });
      showSuccess('Donor profile saved successfully.');
      await refreshUser();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiError>;
      const apiErr = axiosErr.response?.data;

      if (apiErr?.details && apiErr.details.length > 0) {
        apiErr.details.forEach((detail) => {
          if (detail.field in data) {
            setFieldError(detail.field as keyof ProfileFormData, {
              type: 'server',
              message: detail.message,
            });
          }
        });
      }
      showError(apiErr?.message || 'Failed to update donor profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-1/3 animate-pulse mb-4" />
        <CardSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorState
          title="Could not load your profile"
          message={error.message}
          onRetry={() => {
            setIsLoading(true);
            loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Donor Profile
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage your personal contact details, verified health parameters, and location
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            loadData();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>
      </div>

      {/* Summary Profile Header Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#B3203A] text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {profile?.bloodGroup}
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{profile?.fullName}</h2>
            <p className="text-xs text-neutral-500">{profile?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  eligibility?.eligible
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {eligibility?.eligible ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Eligible to Donate</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Cooldown Period</span>
                  </>
                )}
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-500">
                <span className="font-semibold text-neutral-800">{profile?.totalDonations}</span> donations completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900">
              Personal Information & Contact
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Keep your contact and weight updated so blood banks can reach you in emergencies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name (Editable) */}
            <div>
              <label
                htmlFor={fullNameId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id={fullNameId}
                  type="text"
                  autoComplete="name"
                  {...register('fullName')}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone (Editable) */}
            <div>
              <label
                htmlFor={phoneId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id={phoneId}
                  type="tel"
                  autoComplete="tel"
                  {...register('phone')}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Weight (Editable) */}
            <div>
              <label
                htmlFor={weightKgId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                Weight (kg)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Scale className="w-4 h-4" />
                </div>
                <input
                  id={weightKgId}
                  type="number"
                  step="0.5"
                  {...register('weightKg', { valueAsNumber: true })}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                />
              </div>
              {watchedWeight && Number(watchedWeight) < 50 && (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Below 50 kg requirement for whole blood donation</span>
                </p>
              )}
              {errors.weightKg && (
                <p className="text-xs text-red-600 mt-1">{errors.weightKg.message}</p>
              )}
            </div>

            {/* City (Editable) */}
            <div>
              <label
                htmlFor={cityId}
                className="block text-xs font-semibold text-neutral-700 mb-1"
              >
                City / District
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id={cityId}
                  type="text"
                  autoComplete="address-level2"
                  {...register('city')}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg placeholder-neutral-400 focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none transition-colors"
                />
              </div>
              {errors.city && (
                <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Read-Only Medical Attributes Section */}
          <div className="pt-4 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">
              Verified Medical Records (Read-Only)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Blood group and date of birth are verified by laboratory screening and cannot be modified online.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Blood Group (Read-Only) */}
              <div>
                <label
                  htmlFor={bloodGroupId}
                  className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5"
                >
                  <span>Blood Group</span>
                  <Lock className="w-3 h-3 text-neutral-400" />
                </label>
                <div className="relative">
                  <input
                    id={bloodGroupId}
                    type="text"
                    readOnly
                    disabled
                    value={profile?.bloodGroup || ''}
                    className="block w-full px-3 py-2 text-sm font-bold text-[#B3203A] bg-neutral-100/80 border border-neutral-200 rounded-lg cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Contact blood bank with certified test reports to update blood group.
                </p>
              </div>

              {/* Date of Birth (Read-Only) */}
              <div>
                <label
                  htmlFor={dobId}
                  className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5"
                >
                  <span>Date of Birth</span>
                  <Lock className="w-3 h-3 text-neutral-400" />
                </label>
                <div className="relative">
                  <input
                    id={dobId}
                    type="text"
                    readOnly
                    disabled
                    value={profile?.dob || ''}
                    className="block w-full px-3 py-2 text-sm font-mono text-neutral-800 bg-neutral-100/80 border border-neutral-200 rounded-lg cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Date of birth was verified with government ID at enrollment.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={() => {
                if (profile) {
                  reset({
                    fullName: profile.fullName,
                    phone: profile.phone,
                    weightKg: profile.weightKg,
                    city: profile.city,
                  });
                }
              }}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Discard Changes
            </button>

            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#B3203A] hover:bg-[#991B32] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
