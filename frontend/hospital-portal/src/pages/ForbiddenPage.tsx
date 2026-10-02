import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export const ForbiddenPage: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-xs p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 text-[#B3203A] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <span className="font-mono text-xs uppercase px-2.5 py-1 bg-red-50 text-[#B3203A] border border-red-200 rounded">
          HTTP 403 · FORBIDDEN
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">
          Access Restricted / Not Allowed
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your current account credentials ({user?.email || 'authenticated user'} with role{' '}
          <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">{user?.role || 'UNKNOWN'}</code>)
          do not have permission to access the Hospital Blood Desk interface. Only authorized clinical hospital
          accounts with role <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">HOSPITAL</code> are permitted.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B3203A] hover:bg-[#8F192E] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B3203A]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log In with Hospital Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
