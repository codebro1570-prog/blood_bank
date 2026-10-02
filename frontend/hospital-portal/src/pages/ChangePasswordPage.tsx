import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { parseApiError } from '../api/client';
import { useToast } from '../components/Toast';
import { KeyRound, ShieldCheck, Lock } from 'lucide-react';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const { showSuccess, showApiError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showSuccess('Your password has been updated successfully', 'Password Changed');
      reset();
    } catch (err: any) {
      showApiError(parseApiError(err), 'Password Change Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Change Account Password
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Contract Section B · Update hospital blood desk authentication credentials
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Current Password *
            </label>
            <div className="mt-1 relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                placeholder="••••••••"
                className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                  errors.currentPassword ? 'border-[#B3203A]' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-[#B3203A]">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              New Password *
            </label>
            <div className="mt-1 relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                placeholder="••••••••"
                className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                  errors.newPassword ? 'border-[#B3203A]' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-[#B3203A]">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Confirm New Password *
            </label>
            <div className="mt-1 relative rounded-md shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className={`block w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] ${
                  errors.confirmPassword ? 'border-[#B3203A]' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-[#B3203A]">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6B63] hover:bg-[#0A4B45] text-white text-sm font-semibold rounded-md shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
