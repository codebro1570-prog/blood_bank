import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full bg-white p-8 rounded border border-slate-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-[#B3203A] flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#B3203A] bg-rose-50 px-2 py-0.5 rounded border border-[#B3203A]/20 mb-2">
          403 · FORBIDDEN ACCESS
        </div>

        <h1 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          Restricted Administrator Section
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Your current session role (<strong className="font-mono text-slate-900">{user?.role || 'STAFF'}</strong>)
          does not possess sufficient clinical accreditation or system clearance to inspect or mutate this resource.
        </p>

        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 mb-6 text-left space-y-1">
          <p className="font-semibold text-slate-800">Switching Roles for Evaluation:</p>
          <p className="text-[11px] text-slate-500">
            You can elevate to ADMIN credentials to test hospital verification, operator management, and compliance ledgers.
          </p>
          <button
            type="button"
            onClick={async () => {
              await switchDemoRole('ADMIN');
              navigate(-1);
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Elevate to ADMIN Demo Session</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Previous Screen</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded bg-[#1F2A3C] hover:bg-[#151D2A] text-white text-xs font-semibold"
          >
            Portal Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
