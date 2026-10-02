/**
 * Change Password Modal Component
 * Accessible modal using React Hook Form + Zod validation.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useToast } from './Toast';
import { AxiosError } from 'axios';
import { ApiError } from '../types';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { changePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const watchedNewPassword = watch('newPassword', '');

  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Not entered', color: 'bg-neutral-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(watchedNewPassword);

  if (!isOpen) return null;

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccessMessage('Password changed successfully.');
      showSuccess('Your password has been updated.');
      reset();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiError>;
      const apiErr = axiosErr.response?.data;
      if (apiErr?.details && apiErr.details.length > 0) {
        apiErr.details.forEach((detail) => {
          if (detail.field === 'currentPassword' || detail.field === 'newPassword') {
            setError(detail.field as 'currentPassword' | 'newPassword', {
              type: 'server',
              message: detail.message,
            });
          }
        });
      } else {
        showError(apiErr?.message || 'Failed to change password. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 p-1 rounded-md focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F4] text-[#B3203A] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 id="change-password-title" className="text-lg font-semibold text-neutral-900">
              Change Password
            </h2>
            <p className="text-xs text-neutral-500">Update your donor portal account password</p>
          </div>
        </div>

        {successMessage ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-medium text-neutral-700 mb-1"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:border-transparent outline-none transition-colors"
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-medium text-neutral-700 mb-1"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...register('newPassword')}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:border-transparent outline-none transition-colors"
                placeholder="At least 6 characters"
              />
              {watchedNewPassword && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength.score >= 1 ? strength.color : 'bg-neutral-200'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength.score >= 2 ? strength.color : 'bg-neutral-200'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength.score >= 3 ? strength.color : 'bg-neutral-200'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500">
                    Strength: {strength.label}
                  </span>
                </div>
              )}
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-neutral-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:border-transparent outline-none transition-colors"
                placeholder="Re-type new password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#B3203A] hover:bg-[#991B32] disabled:opacity-50 rounded-lg transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Save Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
