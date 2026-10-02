/**
 * Blood Compatibility Info Page (/compatibility)
 * Uses GET /blood-groups/{code}/compatible-donors
 * Answers "Who can I give blood to?" and "Who can donate to me?".
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Heart,
  Droplet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  RotateCw,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { bloodGroupsApi } from '../api/bloodGroups';
import { donorApi } from '../api/donor';
import { BloodGroupCode, CompatibleDonorsResponse, DonorProfile } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorState } from '../components/ErrorState';

const ALL_BLOOD_GROUPS: BloodGroupCode[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

// Red cell giving compatibility mapping
// Who can donor D give red cells to?
const DONOR_GIVE_MAP: Record<BloodGroupCode, BloodGroupCode[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'], // Universal recipient for receiving, gives only to AB+
};

export const CompatibilityPage: React.FC = () => {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroupCode>('O+');
  const [recipientCompatibility, setRecipientCompatibility] = useState<CompatibleDonorsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadInitialData = useCallback(async () => {
    setError(null);
    try {
      const prof = await donorApi.getProfile();
      setProfile(prof);
      const donorGroup = prof.bloodGroup || 'O+';
      setSelectedGroup(donorGroup);
      const comp = await bloodGroupsApi.getCompatibleDonors(donorGroup);
      setRecipientCompatibility(comp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Unable to load compatibility records.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadInitialData();
  }, [loadInitialData]);

  // When selectedGroup changes, fetch who can donate to this group using the API endpoint
  const handleSelectGroup = async (group: BloodGroupCode) => {
    setSelectedGroup(group);
    try {
      const comp = await bloodGroupsApi.getCompatibleDonors(group);
      setRecipientCompatibility(comp);
    } catch (err) {
      console.error('Failed to get compatibility', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-1/3 animate-pulse mb-4" />
        <CardSkeleton rows={4} />
        <CardSkeleton rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ErrorState
          title="Could not load compatibility data"
          message={error.message}
          onRetry={loadInitialData}
        />
      </div>
    );
  }

  const whoICanGiveTo = DONOR_GIVE_MAP[selectedGroup] || [];
  const whoCanGiveToMe = recipientCompatibility?.compatibleDonorGroups || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Blood Type Compatibility
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Understand who can safely receive your blood and who you can receive blood from
          </p>
        </div>
        {profile && (
          <div className="text-xs text-neutral-600 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2">
            <span>Your Registered Group:</span>
            <span className="font-bold text-[#B3203A]">{profile.bloodGroup}</span>
          </div>
        )}
      </div>

      {/* Blood Group Selector Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
            Explore Blood Group:
          </span>
          <span className="text-xs text-neutral-500">
            Click any type to preview compatibility
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {ALL_BLOOD_GROUPS.map((bg) => {
            const isSelected = bg === selectedGroup;
            const isUserGroup = profile?.bloodGroup === bg;
            return (
              <button
                key={bg}
                type="button"
                onClick={() => handleSelectGroup(bg)}
                className={`py-2.5 px-2 rounded-xl text-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#B3203A] text-white shadow-sm ring-2 ring-[#B3203A] ring-offset-2'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200'
                }`}
              >
                <div className="text-base font-black">{bg}</div>
                {isUserGroup && (
                  <span
                    className={`block text-[9px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-white/90' : 'text-[#B3203A]'
                    }`}
                  >
                    You
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Compatibility Grid: Who can I give blood to? & Who can donate to me? */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: WHO CAN I GIVE BLOOD TO? */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F4] text-[#B3203A] flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Who can <span className="text-[#B3203A] font-extrabold">{selectedGroup}</span> give blood to?
                </h2>
                <p className="text-xs text-neutral-500">
                  Patient recipient groups who can safely receive your red cells
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-4">
              When you donate red blood cells as a <strong className="text-neutral-900">{selectedGroup}</strong> donor, your blood can save patients with:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {ALL_BLOOD_GROUPS.map((target) => {
                const canGive = whoICanGiveTo.includes(target);
                return (
                  <div
                    key={target}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                      canGive
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-neutral-50 border-neutral-200/60 text-neutral-400 opacity-60'
                    }`}
                  >
                    <span className="text-lg">{target}</span>
                    <span className="text-[10px] mt-0.5 font-semibold flex items-center gap-0.5">
                      {canGive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Can give</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-neutral-400" />
                          <span>Cannot give</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs text-neutral-600">
            {selectedGroup === 'O-' ? (
              <span className="font-semibold text-emerald-700">
                ★ Universal Red Cell Donor: O- can be given to patients of any blood group in emergencies!
              </span>
            ) : selectedGroup === 'AB+' ? (
              <span>
                AB+ donors can give red blood cells to AB+ recipients, and are universal plasma donors!
              </span>
            ) : (
              <span>
                Your red blood cells can treat patients in {whoICanGiveTo.length} out of 8 blood groups.
              </span>
            )}
          </div>
        </div>

        {/* Card 2: WHO CAN DONATE TO ME? */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 mb-4">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <Droplet className="w-5 h-5 text-[#B3203A]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Who can donate to <span className="text-[#B3203A] font-extrabold">{selectedGroup}</span>?
                </h2>
                <p className="text-xs text-neutral-500">
                  Verified with GET /blood-groups/{selectedGroup}/compatible-donors
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-4">
              If a <strong className="text-neutral-900">{selectedGroup}</strong> patient requires red blood cells, they can safely receive from:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {ALL_BLOOD_GROUPS.map((target) => {
                const canReceive = whoCanGiveToMe.includes(target);
                return (
                  <div
                    key={target}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${
                      canReceive
                        ? 'bg-blue-50/80 border-blue-200 text-blue-950 font-bold shadow-2xs'
                        : 'bg-neutral-50 border-neutral-200/60 text-neutral-400 opacity-60'
                    }`}
                  >
                    <span className="text-lg">{target}</span>
                    <span className="text-[10px] mt-0.5 font-semibold flex items-center gap-0.5">
                      {canReceive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>Compatible</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-neutral-400" />
                          <span>Incompatible</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs text-neutral-600">
            {selectedGroup === 'AB+' ? (
              <span className="font-semibold text-blue-700">
                ★ Universal Red Cell Recipient: AB+ patients can receive red blood cells from any blood group!
              </span>
            ) : selectedGroup === 'O-' ? (
              <span>
                O- patients can only safely receive O- red blood cells, making O- donors especially vital.
              </span>
            ) : (
              <span>
                {selectedGroup} patients can receive blood from {whoCanGiveToMe.length} compatible donor groups.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Universal Facts Section */}
      <div className="bg-gradient-to-r from-[#FDF2F4] to-neutral-50 border border-[#B3203A]/20 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#B3203A] flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Key Blood Compatibility Facts</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-700 leading-relaxed">
          <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80">
            <h4 className="font-bold text-neutral-900 mb-1">Universal Red Cell Donor: O Negative (O-)</h4>
            <p>
              O- red blood cells have neither A, B, nor Rh antigens on their surface. This means they can be transfused to patients of virtually any blood group in severe trauma or trauma emergencies when there is no time to test the patient's blood.
            </p>
          </div>
          <div className="p-3.5 bg-white rounded-xl border border-neutral-200/80">
            <h4 className="font-bold text-neutral-900 mb-1">Universal Red Cell Recipient: AB Positive (AB+)</h4>
            <p>
              People with AB+ blood have both A and B antigens and the Rh factor. Because their bodies recognize all these markers, they can safely receive red blood cells from all 8 blood groups (O-, O+, A-, A+, B-, B+, AB-, AB+).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityPage;
