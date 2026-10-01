import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, X, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { parseApiError } from '../api/client';
import { useToast } from './ToastContext';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { showSuccessToast, showErrorToast } = useToast();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: ChangePasswordForm) => {
    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showSuccessToast('Your password was updated successfully.');
      reset();
      onClose();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div className="bg-white rounded border border-slate-200 max-w-sm w-full shadow-xl animate-in fade-in">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Change Account Password</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3.5 text-xs">
          <p className="text-slate-600">
            Enter your current password followed by your desired new password.
          </p>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Current Password <span className="text-[#B3203A]">*</span>
            </label>
            <input
              type="password"
              placeholder="Enter current credentials"
              {...register('currentPassword')}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none font-mono"
            />
            {errors.currentPassword && (
              <p className="text-[11px] text-[#B3203A] mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              New Password <span className="text-[#B3203A]">*</span>
            </label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              {...register('newPassword')}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none font-mono"
            />
            {errors.newPassword && (
              <p className="text-[11px] text-[#B3203A] mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Confirm New Password <span className="text-[#B3203A]">*</span>
            </label>
            <input
              type="password"
              placeholder="Re-type new password"
              {...register('confirmPassword')}
              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-900 focus-visible:outline-none font-mono"
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-[#B3203A] mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>{submitting ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
