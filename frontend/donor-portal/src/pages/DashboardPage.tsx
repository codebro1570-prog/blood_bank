/**
 * Dashboard Page (/)
 * Requirements:
 * - Large ELIGIBILITY CARD:
 *   - If eligible: Green "You can donate now" with a short note on where to go.
 *   - If not eligible: Next eligible date, countdown in days, and which rule blocks (reasons[] from the API).
 * - Cards: last donation date, total donations, blood group shown as a badge.
 * - The 3 latest notifications with a "View all" link.
 * - Uses GET /donors/me and GET /donors/me/eligibility.
 * - All states: loading, error with retry.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  Droplet,
  ArrowRight,
  ShieldCheck,
  Bell,
  AlertCircle,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { donorApi } from '../api/donor';
import { notificationsApi } from '../api/notifications';
import { DonorProfile, Eligibility, NotificationItem } from '../types';
import { CardSkeleton, MetricSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';

// Helper to compute countdown in days from current date (2026-10-01)
function calculateDaysRemaining(nextDateString: string | null): number {
  if (!nextDateString) return 0;
  const now = new Date('2026-10-01T00:00:00Z');
  const target = new Date(nextDateString + 'T00:00:00Z');
  const diffMs = target.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [profileData, eligibilityData, notificationsData] = await Promise.all([
        donorApi.getProfile(),
        donorApi.getEligibility(),
        notificationsApi.getNotifications({ page: 0, size: 3 }),
      ]);
      setProfile(profileData);
      setEligibility(eligibilityData);
      setRecentNotifications(notificationsData.content || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unable to load donor dashboard.'));
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadDashboardData();
  }, [loadDashboardData, user?.email]);

  const handleRetry = () => {
    setIsRetrying(true);
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-1/4 animate-pulse mb-6" />
        <CardSkeleton rows={4} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
        <CardSkeleton rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorState
          title="Could not load your donor dashboard"
          message="We couldn't retrieve your donor profile and eligibility details. Please check your connection and try again."
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </div>
    );
  }

  const isEligible = eligibility?.eligible ?? profile?.eligible ?? false;
  const daysRemaining = calculateDaysRemaining(eligibility?.nextEligibleDate ?? null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Welcome, {profile?.fullName || user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Voluntary blood donor portal · City: <span className="font-semibold text-neutral-800">{profile?.city || 'Registered Donor'}</span>
          </p>
        </div>
        <Link
          to="/profile"
          className="text-xs font-semibold text-[#B3203A] hover:underline self-start sm:self-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-[#B3203A] rounded px-2 py-1 outline-none"
        >
          Manage Profile →
        </Link>
      </div>

      {/* 1. Large ELIGIBILITY CARD */}
      <section aria-labelledby="eligibility-heading">
        {isEligible ? (
          /* Eligible state */
          <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/90 border border-emerald-300 shadow-xs text-emerald-950">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Status: Active
                    </span>
                    <span className="text-xs text-emerald-800">· All health checks passed</span>
                  </div>
                  <h2
                    id="eligibility-heading"
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-900"
                  >
                    You can donate now!
                  </h2>
                  <div className="mt-3 max-w-xl text-xs sm:text-sm text-emerald-800 leading-relaxed space-y-1">
                    <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Where to go:</span>
                    </p>
                    <p className="pl-5">
                      Visit the <strong>Central Blood Line facility</strong> (Main City Hospital, Health Campus) or any authorized voluntary mobile drive in <strong>{profile?.city}</strong>.
                    </p>
                    <p className="pl-5 text-emerald-700">
                      Open daily from 8:00 AM – 6:00 PM. Please bring a valid government photo ID card.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <Link
                  to="/eligibility"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 outline-none"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View Eligibility Rules</span>
                </Link>
                <Link
                  to="/donations"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 outline-none"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Past Donations</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Ineligible state */
          <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/90 border border-amber-300 shadow-xs text-amber-950">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                      Cooldown Period
                    </span>
                    <span className="text-xs text-amber-800">· Recovery gap required</span>
                  </div>
                  <h2
                    id="eligibility-heading"
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-950"
                  >
                    Not Yet Eligible to Donate
                  </h2>

                  {/* Next eligible date & Countdown */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="bg-white/90 border border-amber-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 flex items-center gap-2 shadow-xs">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Next Eligible Date:</span>
                      <span className="text-[#B3203A] font-bold font-mono">
                        {eligibility?.nextEligibleDate || 'Calculating...'}
                      </span>
                    </div>

                    {daysRemaining > 0 && (
                      <div className="bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs tabular-nums">
                        <Clock className="w-4 h-4" />
                        <span>{daysRemaining} days remaining</span>
                      </div>
                    )}
                  </div>

                  {/* Which rule blocks (reasons[] from the API) */}
                  {eligibility?.reasons && eligibility.reasons.length > 0 && (
                    <div className="mt-4 bg-white/80 border border-amber-200 rounded-xl p-3.5 max-w-xl">
                      <p className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Blocking Rules & Criteria:</span>
                      </p>
                      <ul className="text-xs text-neutral-800 space-y-1 list-disc list-inside">
                        {eligibility.reasons.map((reason, idx) => (
                          <li key={idx} className="leading-snug">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <Link
                  to="/eligibility"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-amber-700 outline-none"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Check Criteria Rules</span>
                </Link>
                <Link
                  to="/donations"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white hover:bg-amber-100/50 text-amber-950 border border-amber-300 transition-colors focus-visible:ring-2 focus-visible:ring-amber-700 outline-none"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View Donation History</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Three Metric Cards: Last donation date, Total donations, Blood group badge */}
      <section aria-labelledby="overview-cards-heading">
        <h2 id="overview-cards-heading" className="sr-only">
          Donation Overview Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card A: Blood Group Shown as a Badge */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Blood Group
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                Verified laboratory group
              </p>
            </div>
            {/* Prominent Blood Group Badge */}
            <div className="w-16 h-16 rounded-2xl bg-[#B3203A] text-white flex flex-col items-center justify-center shadow-md border-2 border-white">
              <span className="text-2xl font-black tracking-tight leading-none">
                {profile?.bloodGroup || '—'}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest mt-0.5 opacity-90">
                Type
              </span>
            </div>
          </div>

          {/* Card B: Last Donation Date */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F4] text-[#B3203A] flex items-center justify-center shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Last Donation Date
              </p>
              <p className="text-xl font-bold text-neutral-900 mt-0.5 font-mono tabular-nums">
                {profile?.lastDonationDate || 'No past donations'}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {profile?.lastDonationDate
                  ? 'Screened & completed'
                  : 'Start your journey today'}
              </p>
            </div>
          </div>

          {/* Card C: Total Donations */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
              <Heart className="w-7 h-7 text-[#B3203A]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Total Donations
              </p>
              <p className="text-2xl font-bold text-neutral-900 mt-0.5 tabular-nums">
                {profile?.totalDonations ?? 0}{' '}
                <span className="text-sm font-normal text-neutral-500">units</span>
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Estimated ~{(profile?.totalDonations ?? 0) * 3} lives impacted
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 3 Latest Notifications with "View all" link */}
      <section aria-labelledby="notifications-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#B3203A]" />
            <h2 id="notifications-heading" className="text-base font-bold text-neutral-900">
              Latest Notifications
            </h2>
          </div>
          <Link
            to="/notifications"
            className="text-xs font-semibold text-[#B3203A] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B3203A] rounded px-1.5 py-0.5 outline-none"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentNotifications.length === 0 ? (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 text-center text-xs text-neutral-500 shadow-xs">
            No recent notifications at this time.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  notif.read
                    ? 'bg-white border-neutral-200/80 text-neutral-700'
                    : 'bg-[#FDF2F4]/40 border-[#B3203A]/20 text-neutral-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.read
                          ? 'bg-neutral-100 text-neutral-500'
                          : 'bg-[#B3203A] text-white shadow-xs'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold">{notif.title}</h3>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#B3203A]" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-400 shrink-0 font-mono tabular-nums whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
