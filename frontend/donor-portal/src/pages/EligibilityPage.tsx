/**
 * Eligibility Screen (/eligibility)
 * Lists each rule (age 18-65, weight at least 50 kg, 90 days since last donation)
 * with a tick or cross using checks and rules objects from GET /donors/me/eligibility,
 * plus the next eligible date and a plain-language summary.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Heart,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { donorApi } from '../api/donor';
import { Eligibility, DonorProfile } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';

export const EligibilityPage: React.FC = () => {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [elData, profData] = await Promise.all([
        donorApi.getEligibility(),
        donorApi.getProfile(),
      ]);
      setEligibility(elData);
      setProfile(profData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unable to retrieve eligibility rules.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  // Generate plain-language summary
  const getPlainLanguageSummary = (el: Eligibility, prof: DonorProfile | null) => {
    if (el.eligible) {
      return `You are currently eligible to donate blood! You meet all health parameters (age between ${el.rules.minAge} and ${el.rules.maxAge}, weight of ${prof?.weightKg || 50} kg meeting the ${el.rules.minWeightKg} kg threshold, and sufficient recovery interval of ≥${el.rules.gapDays} days). You can walk into any authorized donation center or mobile drive today.`;
    }

    const failedChecks = [];
    if (!el.checks.gap) {
      failedChecks.push(
        `your last donation was ${prof?.lastDonationDate || 'recently'} and requires a ${el.rules.gapDays}-day recovery interval to replenish iron stores`
      );
    }
    if (!el.checks.weight) {
      failedChecks.push(
        `your registered body weight of ${prof?.weightKg || 0} kg is below the minimum required ${el.rules.minWeightKg} kg`
      );
    }
    if (!el.checks.age) {
      failedChecks.push(
        `donor age must be within the standard ${el.rules.minAge}–${el.rules.maxAge} year bracket`
      );
    }

    const reasonText = failedChecks.join(', and ');
    const nextDateText = el.nextEligibleDate
      ? `You will become eligible again on ${el.nextEligibleDate}.`
      : 'Please contact medical staff to review your eligibility.';

    return `You are currently in a temporary waiting period because ${reasonText}. ${nextDateText}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-neutral-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
          Donation Eligibility
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Detailed check against blood banking safety standards, age, weight, and recovery intervals
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not evaluate eligibility"
          message={error.message}
          onRetry={loadData}
        />
      ) : eligibility ? (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border shadow-xs ${
              eligibility.eligible
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    eligibility.eligible ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {eligibility.eligible ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <Clock className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        eligibility.eligible
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {eligibility.eligible ? 'Eligible Now' : 'Cooldown Active'}
                    </span>
                    <span className="text-xs text-neutral-600">
                      Blood Group: <strong className="text-neutral-900">{profile?.bloodGroup}</strong>
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {eligibility.eligible
                      ? 'You are eligible to donate blood today!'
                      : 'Temporary Donation Waiting Period'}
                  </h2>
                </div>
              </div>

              {/* Next Eligible Date Pill */}
              <div className="bg-white/90 border border-neutral-200 px-4 py-2.5 rounded-xl shadow-xs shrink-0 text-left sm:text-right">
                <p className="text-xs font-medium text-neutral-500">Next Eligible Date</p>
                <p className="text-base font-bold text-neutral-900 font-mono mt-0.5">
                  {eligibility.eligible
                    ? 'Eligible Today'
                    : eligibility.nextEligibleDate || 'Pending medical review'}
                </p>
              </div>
            </div>
          </div>

          {/* Plain-Language Summary Box */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F4] text-[#B3203A] flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-neutral-900 mb-1">
                  Plain-Language Summary
                </h3>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {getPlainLanguageSummary(eligibility, profile)}
                </p>
              </div>
            </div>
          </div>

          {/* Rules Evaluation List with Tick or Cross */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 pb-3 border-b border-neutral-100 mb-5">
              Individual Rules & Criteria Checklist
            </h3>

            <div className="space-y-4">
              {/* Rule 1: Age 18-65 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    {eligibility.checks.age ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-label="Rule satisfied: Age" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" aria-label="Rule not satisfied: Age" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">
                        Age Criterion: {eligibility.rules.minAge}–{eligibility.rules.maxAge} years
                      </h4>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          eligibility.checks.age
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {eligibility.checks.age ? 'PASSED' : 'NOT MET'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Donors must be between {eligibility.rules.minAge} and {eligibility.rules.maxAge} years of age at the time of whole blood donation.
                    </p>
                    {profile?.dob && (
                      <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                        Donor DOB: {profile.dob}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-neutral-500">Rule: Age 18–65</span>
                </div>
              </div>

              {/* Rule 2: Weight at least 50 kg */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    {eligibility.checks.weight ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-label="Rule satisfied: Weight" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" aria-label="Rule not satisfied: Weight" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">
                        Body Weight: At least {eligibility.rules.minWeightKg} kg
                      </h4>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          eligibility.checks.weight
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {eligibility.checks.weight ? 'PASSED' : 'NOT MET'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Standard adult whole blood donation requires minimum weight of {eligibility.rules.minWeightKg} kg for safe circulatory volume extraction.
                    </p>
                    {profile?.weightKg && (
                      <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                        Current recorded weight: {profile.weightKg} kg
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-neutral-500">
                    Rule: Min {eligibility.rules.minWeightKg} kg
                  </span>
                </div>
              </div>

              {/* Rule 3: 90 days since last donation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    {eligibility.checks.gap ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-label="Rule satisfied: Gap" />
                    ) : (
                      <XCircle className="w-6 h-6 text-amber-600" aria-label="Rule not satisfied: Gap" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900">
                        Donation Recovery Interval: {eligibility.rules.gapDays} days gap
                      </h4>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          eligibility.checks.gap
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {eligibility.checks.gap ? 'PASSED' : 'COOLDOWN'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Donors must wait at least {eligibility.rules.gapDays} days between consecutive whole blood donations to ensure iron stores are replenished.
                    </p>
                    {profile?.lastDonationDate && (
                      <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                        Last donation date: {profile.lastDonationDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-neutral-500">
                    Rule: {eligibility.rules.gapDays} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Helpful Navigation Links */}
          <div className="p-5 bg-neutral-100/70 border border-neutral-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-[#B3203A]" />
              <p className="text-xs text-neutral-700">
                Want to know who can receive your blood type?
              </p>
            </div>
            <Link
              to="/compatibility"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#B3203A] hover:bg-[#991B32] rounded-lg transition-colors shadow-xs"
            >
              <span>Check Blood Compatibility</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EligibilityPage;
