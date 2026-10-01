import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Droplet,
  Boxes,
  ClipboardList,
  History,
  Bell,
  Building2,
  UserCheck,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  AlertCircle,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { notificationsApi } from '../api/notifications.api';
import { adminApi } from '../api/admin.api';
import { hospitalsApi } from '../api/hospitals.api';
import { ChangePasswordModal } from './ChangePasswordModal';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [emergencyPending, setEmergencyPending] = useState<number>(0);
  const [pendingHospitalsCount, setPendingHospitalsCount] = useState<number>(0);
  const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);

  // Poll notifications count, emergency count & pending hospitals periodically
  const fetchCounts = async () => {
    try {
      const promises: Promise<any>[] = [
        notificationsApi.getUnreadCount(),
        adminApi.getDashboard(),
      ];
      if (user?.role === 'ADMIN') {
        promises.push(hospitalsApi.getHospitals({ status: 'PENDING', size: 1 }));
      }
      const [notifRes, dashRes, hospRes] = await Promise.all(promises);
      setUnreadCount(notifRes.count);
      setEmergencyPending(dashRes.emergencyPending);
      if (hospRes) {
        setPendingHospitalsCount(hospRes.totalElements);
      }
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close mobile sidebar on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === 'ADMIN';

  // Breadcrumbs title helper
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Operational Overview';
    if (path === '/donors/eligible') return 'Emergency On-Call Eligible Donors';
    if (path.startsWith('/donors/') && path !== '/donors') return 'Donor Profile & Ledger';
    if (path === '/donors') return 'Donor Registry';
    if (path === '/donations/new') return 'Record Blood Donation Intake';
    if (path.startsWith('/donations/') && path !== '/donations') return 'Donation Session & Screening';
    if (path === '/donations') return 'Donations & Screening';
    if (path.startsWith('/inventory')) return 'Blood Inventory & Expiry';
    if (path.startsWith('/requests/') && path !== '/requests') return 'Hospital Requisition & Availability';
    if (path === '/requests') return 'Hospital Requests Queue';
    if (path.startsWith('/issues')) return 'Blood Issue Dispatch Log';
    if (path.startsWith('/notifications')) return 'System Notifications';
    if (path.startsWith('/hospitals')) return 'Hospital Verification & Accreditations';
    if (path.startsWith('/users')) return 'Staff & Operator Management';
    if (path.startsWith('/audit')) return 'Compliance & Regulatory Audit Log';
    return 'Blood Bank Portal';
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
      isActive
        ? 'bg-[#2A3A52] text-white font-semibold'
        : 'text-slate-300 hover:bg-[#253347] hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1F2A3C] text-white border-b border-slate-700 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#B3203A] flex items-center justify-center text-white font-bold text-xs">
            +
          </div>
          <span className="font-bold text-sm tracking-tight">HEMA-PORTAL</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {emergencyPending > 0 && (
            <button
              onClick={() => navigate('/requests')}
              className="flex items-center gap-1 bg-[#B3203A] text-white text-[11px] font-semibold px-2 py-1 rounded animate-pulse"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{emergencyPending} EMERGENCY</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#2A3A52]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Slate #1F2A3C) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#1F2A3C] text-slate-200 flex flex-col justify-between shrink-0 z-40 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand header */}
          <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#B3203A] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                +
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                  HEMA-BANK
                </h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                  OPERATIONS & ADMIN
                </p>
              </div>
            </div>
            {/* Quick demo role badge */}
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                isAdmin
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}
            >
              {user?.role}
            </span>
          </div>

          {/* Role quick toggle demo toolbar */}
          <div className="px-3 py-2 bg-[#17202E] border-b border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span>Switch active role:</span>
              <span className="font-mono text-[10px] text-slate-500">contract demo</span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-[#1F2A3C] p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onClick={() => switchDemoRole('STAFF')}
                className={`py-1 text-[11px] font-medium rounded transition-colors ${
                  !isAdmin ? 'bg-[#2A3A52] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Staff View
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('ADMIN')}
                className={`py-1 text-[11px] font-medium rounded transition-colors ${
                  isAdmin ? 'bg-[#2A3A52] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin View
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 flex-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Clinical & Operations
            </div>

            <NavLink to="/" end className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </div>
            </NavLink>

            <NavLink to="/donors" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Donors</span>
              </div>
            </NavLink>

            <NavLink to="/donations" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <Droplet className="w-4 h-4 text-slate-400" />
                <span>Donations</span>
              </div>
            </NavLink>

            <NavLink to="/inventory" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-slate-400" />
                <span>Inventory</span>
              </div>
            </NavLink>

            <NavLink to="/requests" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <span>Requests</span>
              </div>
              {emergencyPending > 0 && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#B3203A] text-white animate-pulse">
                  {emergencyPending}
                </span>
              )}
            </NavLink>

            <NavLink to="/issues" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-slate-400" />
                <span>Issue History</span>
              </div>
            </NavLink>

            <NavLink to="/notifications" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {unreadCount}
                </span>
              )}
            </NavLink>

            {/* Admin-Only Navigation Section */}
            {isAdmin && (
              <>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-3 pb-1">
                  Administration
                </div>

                <NavLink to="/hospitals" className={navLinkClasses}>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>Hospitals</span>
                  </div>
                  {pendingHospitalsCount > 0 && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {pendingHospitalsCount}
                    </span>
                  )}
                </NavLink>

                <NavLink to="/users" className={navLinkClasses}>
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Users & Staff</span>
                  </div>
                </NavLink>

                <NavLink to="/audit" className={navLinkClasses}>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Audit Log</span>
                  </div>
                </NavLink>
              </>
            )}
          </nav>

          {/* Current User & Logout */}
          <div className="p-3 border-t border-slate-700/80 bg-[#1A2332]">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  title="Change account password"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors focus-visible:outline-none"
                  aria-label="Change account password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={logout}
                  title="Log out session"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors focus-visible:outline-none"
                  aria-label="Log out session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      {/* Main Content Area (White / Slate-50) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Page Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Portal / {isAdmin ? 'Admin' : 'Staff'}
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none mt-0.5">
                {getHeaderTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {emergencyPending > 0 && (
              <button
                type="button"
                onClick={() => navigate('/requests')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#B3203A] hover:bg-[#971930] rounded shadow-xs animate-pulse transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{emergencyPending} Emergency Pending</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchCounts}
              title="Sync Status"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors focus-visible:outline-none"
              aria-label="Sync status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
