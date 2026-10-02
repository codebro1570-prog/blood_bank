import React from 'react';
import { useAuth } from '../auth/useAuth';
import { AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

export const StatusBanner: React.FC = () => {
  const { approvalStatus, hospital } = useAuth();

  if (!approvalStatus || approvalStatus === 'APPROVED') {
    return null;
  }

  if (approvalStatus === 'PENDING') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 sm:px-6 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
          <div className="p-1 rounded bg-amber-200/60 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              Hospital Registration Pending Verification
            </p>
            <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
              Your hospital account is awaiting administrative verification. You can review inventory
              and records, but you cannot request blood until your hospital license has been approved.
            </p>
          </div>
          <span className="hidden md:inline-flex shrink-0 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded">
            Read Only
          </span>
        </div>
      </div>
    );
  }

  if (approvalStatus === 'REJECTED') {
    const reason = hospital?.decisionReason || 'License document unclear';
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-red-50 border-b border-red-200 text-[#B3203A] px-4 py-3 sm:px-6 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
          <div className="p-1 rounded bg-red-100 text-[#B3203A] shrink-0 mt-0.5 sm:mt-0">
            <XCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              Hospital Registration Rejected
            </p>
            <p className="text-xs sm:text-sm text-red-800 mt-0.5">
              Reason: <span className="font-semibold">{reason}</span>. Blood request creation is
              disabled. Please contact the Blood Line administrator to update your credentials.
            </p>
          </div>
          <span className="hidden md:inline-flex shrink-0 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-red-200 text-[#B3203A] rounded">
            Registration Denied
          </span>
        </div>
      </div>
    );
  }

  if (approvalStatus === 'SUSPENDED') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-red-50 border-b border-red-200 text-[#B3203A] px-4 py-3 sm:px-6 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
          <div className="p-1 rounded bg-red-100 text-[#B3203A] shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              Hospital Account Suspended
            </p>
            <p className="text-xs sm:text-sm text-red-800 mt-0.5">
              Your hospital access has been suspended by Blood Line administration. Submitting blood
              requests is temporarily disabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
