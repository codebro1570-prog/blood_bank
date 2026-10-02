/**
 * App Shell Top Navigation Header
 * Links: Dashboard, My donations, Eligibility, Notifications with unread badge
 * Profile Menu: Donor info, Change password, Test donor switcher, Logout
 * Fully responsive down to 360px.
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Heart,
  Calendar,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  KeyRound,
  Menu,
  X,
  ChevronDown,
  RefreshCw,
  Droplet,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { notificationsApi } from '../api/notifications';
import { ChangePasswordModal } from './ChangePasswordModal';

export const Header: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSwitchingDonor, setIsSwitchingDonor] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // Quiet fail if not yet authenticated
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    // The bell in the top navigation polls GET /notifications/unread-count every 60 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Convenient donor quick-switcher for reviewers
  const handleQuickSwitchDonor = async (targetEmail: string) => {
    if (user?.email === targetEmail) return;
    setIsSwitchingDonor(true);
    setIsProfileMenuOpen(false);
    try {
      await login({ email: targetEmail, password: 'AnyPassword123' });
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick switch failed', err);
    } finally {
      setIsSwitchingDonor(false);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Heart },
    { to: '/donations', label: 'My donations', icon: Calendar },
    { to: '/eligibility', label: 'Eligibility', icon: ShieldCheck },
    { to: '/compatibility', label: 'Compatibility', icon: Droplet },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <NavLink
                to="/dashboard"
                className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-[#B3203A] focus-visible:ring-offset-2 rounded-lg outline-none group"
                aria-label="Blood Line Donor Portal Home"
              >
                <div className="w-9 h-9 rounded-xl bg-[#B3203A] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-base tracking-tight text-neutral-900 leading-tight">
                    Blood Line
                  </span>
                  <span className="text-[11px] font-medium text-[#B3203A] tracking-wider uppercase leading-none">
                    Donor Portal
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Desktop Navigation Links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1 lg:gap-2"
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none ${
                        isActive
                          ? 'text-[#B3203A] bg-[#FDF2F4] font-semibold'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                    {link.badge !== null && (
                      <span
                        aria-label={`${link.badge} unread notifications`}
                        className="ml-1 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white bg-[#B3203A] rounded-full tabular-nums"
                      >
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Zone: User Profile Menu & Mobile Toggle */}
            <div className="flex items-center gap-2">
              {/* Profile dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  id="profile-menu-button"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-neutral-200/80 bg-white hover:bg-neutral-50 transition-colors focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FDF2F4] text-[#B3203A] font-semibold text-xs flex items-center justify-center border border-[#B3203A]/20">
                    {user?.fullName?.charAt(0) || 'D'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-neutral-900 leading-tight truncate max-w-[120px]">
                      {user?.fullName || 'Donor'}
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-none">
                      {user?.email || 'Logged in'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="profile-menu-button"
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-neutral-200/80 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2.5 border-b border-neutral-100">
                      <p className="text-xs font-medium text-neutral-400">Signed in as</p>
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    </div>

                    {/* Test Donor Quick Switcher */}
                    <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                          Switch Mock Donor
                        </span>
                        {isSwitchingDonor && (
                          <RefreshCw className="w-3 h-3 text-[#B3203A] animate-spin" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickSwitchDonor('ravi@example.com')}
                          className={`px-2 py-1.5 text-xs rounded-md text-left transition-colors cursor-pointer ${
                            user?.email === 'ravi@example.com'
                              ? 'bg-[#B3203A] text-white font-medium'
                              : 'bg-white hover:bg-neutral-200/60 text-neutral-700 border border-neutral-200'
                          }`}
                        >
                          <div className="font-medium truncate">Ravi (O+)</div>
                          <div className="text-[10px] opacity-80">Not eligible</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSwitchDonor('asha@example.com')}
                          className={`px-2 py-1.5 text-xs rounded-md text-left transition-colors cursor-pointer ${
                            user?.email === 'asha@example.com'
                              ? 'bg-[#B3203A] text-white font-medium'
                              : 'bg-white hover:bg-neutral-200/60 text-neutral-700 border border-neutral-200'
                          }`}
                        >
                          <div className="font-medium truncate">Asha (A+)</div>
                          <div className="text-[10px] opacity-80">Eligible</div>
                        </button>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-neutral-500" />
                        <span>My Profile</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-neutral-500" />
                        <span>Change Password</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-[#B3203A]" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200/80 bg-white px-4 pt-3 pb-4 space-y-1 shadow-lg">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-[#B3203A] bg-[#FDF2F4] font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== null && (
                    <span className="px-2 py-0.5 text-xs font-bold text-white bg-[#B3203A] rounded-full tabular-nums">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

export default Header;
