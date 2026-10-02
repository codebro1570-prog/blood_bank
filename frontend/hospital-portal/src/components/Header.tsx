import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { notificationsApi } from '../api/notifications';
import { Bell, Menu, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, hospital, switchAccount } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnread = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Hospital Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-teal-50 border border-teal-200 text-[#0F6B63] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                {hospital?.name || user?.fullName || 'Hospital Blood Desk'}
              </h2>
              {hospital?.licenseNo && (
                <p className="text-xs text-slate-500 font-mono truncate">
                  Lic: {hospital.licenseNo} · {hospital.city}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Test Switcher + Notification Bell + User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Account Switcher for Evaluators */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-md border border-slate-200/80 text-xs">
            <span className="text-[11px] font-medium text-slate-500 px-1.5 uppercase tracking-wider">
              Test As:
            </span>
            <button
              type="button"
              onClick={() => switchAccount('desk@cmch.org')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                user?.email === 'desk@cmch.org'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
              title="Approved: CMCH (Can create requests)"
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => switchAccount('new@hospital.org')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                user?.email === 'new@hospital.org'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
              title="Pending: Metro Hospital (Awaiting approval)"
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => switchAccount('rej@hospital.org')}
              className={`px-2 py-1 font-medium rounded transition-colors ${
                user?.email === 'rej@hospital.org'
                  ? 'bg-[#B3203A] text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
              title="Rejected: Apex Speciality Care (Document unclear)"
            >
              Rejected
            </button>
          </div>

          {/* Notifications Button */}
          <Link
            to="/notifications"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-[#0F6B63] rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Staff Info */}
          <Link
            to="/profile"
            className="flex items-center gap-2 pl-2 border-l border-slate-200 text-slate-700 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63] rounded-sm"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {hospital?.contactPerson || user?.fullName || 'Desk Officer'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                {user?.role}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
