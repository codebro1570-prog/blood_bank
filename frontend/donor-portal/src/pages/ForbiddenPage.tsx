/**
 * Forbidden (403) Page
 * Shown when user role is not DONOR or access is denied.
 */

import React from 'react';
import { ShieldX, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export const ForbiddenPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6">
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Access Restricted</h1>
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
          The Donor Portal is exclusively available for registered blood donors.
          {user && (
            <span className="block mt-2 font-medium text-neutral-800">
              Current account role: <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-xs">{user.role}</code>
            </span>
          )}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-white bg-[#B3203A] hover:bg-[#991B32] transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign in as a Donor</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 outline-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
