import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { notificationsApi } from '../api/notifications';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  PackageCheck,
  Bell,
  Building,
  KeyRound,
  LogOut,
  X,
  Droplet,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, approvalStatus } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch {
        // Ignore
      }
    };
    fetchCount();
    const timer = setInterval(fetchCount, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/requests/new',
      label: 'New request',
      icon: PlusCircle,
      badge: approvalStatus !== 'APPROVED' ? 'Locked' : undefined,
    },
    {
      to: '/requests',
      label: 'My requests',
      icon: ClipboardList,
    },
    {
      to: '/issued-units',
      label: 'Issued units',
      icon: PackageCheck,
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      unreadCount,
    },
  ];

  const secondaryNavItems = [
    {
      to: '/profile',
      label: 'Profile',
      icon: Building,
    },
    {
      to: '/change-password',
      label: 'Change password',
      icon: KeyRound,
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0A4B45] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary Portal Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-teal-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#0F6B63] flex items-center justify-center text-teal-100 shadow-sm border border-teal-500/30">
              <Droplet className="w-5 h-5 fill-teal-100" aria-hidden="true" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight">
                BLOOD LINE
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-teal-300">
                Hospital Portal
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-teal-200 hover:text-white rounded hover:bg-teal-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main navigation links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-teal-300/70">
            Clinical Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0F6B63] text-white font-semibold shadow-xs'
                      : 'text-teal-100/90 hover:bg-teal-800/50 hover:text-white'
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.unreadCount !== undefined && item.unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-bold bg-teal-400 text-teal-950 rounded-full">
                    {item.unreadCount}
                  </span>
                )}
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-900/60 text-amber-200 border border-amber-600/40 rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-teal-300/70">
            Desk Settings
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0F6B63] text-white font-semibold shadow-xs'
                      : 'text-teal-100/90 hover:bg-teal-800/50 hover:text-white'
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300`
                }
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-teal-800/80 bg-[#083c37]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-teal-200 hover:text-white hover:bg-teal-800/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
