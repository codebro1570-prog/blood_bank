/**
 * In-memory Mock Data for Donor Portal
 * Follows the exact contract schemas for sections B, E, K, and A.
 */

import {
  AuthUser,
  DonorProfile,
  Eligibility,
  DonationForDonor,
  NotificationItem,
} from '../types';

export interface MockDonorRecord {
  user: AuthUser;
  password: string; // stored for demo verification, allows any password in relaxed login mode
  profile: DonorProfile;
  eligibility: Eligibility;
  donations: DonationForDonor[];
  notifications: NotificationItem[];
}

// Initial Mock Donors
export const INITIAL_MOCK_DONORS: Record<string, MockDonorRecord> = {
  'ravi@example.com': {
    user: {
      id: 7,
      email: 'ravi@example.com',
      fullName: 'Ravi Kumar',
      role: 'DONOR',
      active: true,
      hospitalApprovalStatus: null,
    },
    password: 'Password123',
    profile: {
      id: 12,
      fullName: 'Ravi Kumar',
      email: 'ravi@example.com',
      phone: '9876543210',
      dob: '1998-04-12',
      gender: 'MALE',
      weightKg: 68,
      bloodGroup: 'O+',
      city: 'Coimbatore',
      lastDonationDate: '2026-08-17', // exactly 45 days before 2026-10-01
      totalDonations: 4,
      eligible: false,
    },
    eligibility: {
      eligible: false,
      nextEligibleDate: '2026-11-15',
      reasons: ['Last donation was 45 days ago; 90 days required'],
      rules: {
        minAge: 18,
        maxAge: 65,
        minWeightKg: 50,
        gapDays: 90,
      },
      checks: {
        age: true,
        weight: true,
        gap: false,
      },
    },
    donations: [
      {
        id: 31,
        donationDate: '2026-08-17',
        volumeMl: 450,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
      {
        id: 22,
        donationDate: '2026-05-10',
        volumeMl: 450,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
      {
        id: 15,
        donationDate: '2026-01-28',
        volumeMl: 450,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
      {
        id: 8,
        donationDate: '2025-10-15',
        volumeMl: 450,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
    ],
    notifications: [
      {
        id: 401,
        type: 'LOW_STOCK',
        title: 'Urgent need for O+ blood',
        message: 'City Medical Hospital has an urgent requirement for O+ blood units in your area.',
        read: false,
        refType: null,
        refId: null,
        createdAt: '2026-09-30T14:20:00Z',
      },
      {
        id: 388,
        type: 'DONATION_RECORDED',
        title: 'Donation recorded successfully',
        message: 'Your donation of 450ml on 2026-08-17 was screened and passed. Thank you for saving lives!',
        read: false,
        refType: 'Donation',
        refId: 31,
        createdAt: '2026-08-17T11:45:00Z',
      },
      {
        id: 320,
        type: 'DONATION_RECORDED',
        title: 'Donation recorded',
        message: 'Your donation on 2026-05-10 has been processed.',
        read: true,
        refType: 'Donation',
        refId: 22,
        createdAt: '2026-05-10T12:00:00Z',
      },
    ],
  },
  'asha@example.com': {
    user: {
      id: 8,
      email: 'asha@example.com',
      fullName: 'Asha Patel',
      role: 'DONOR',
      active: true,
      hospitalApprovalStatus: null,
    },
    password: 'Password123',
    profile: {
      id: 18,
      fullName: 'Asha Patel',
      email: 'asha@example.com',
      phone: '9812345678',
      dob: '1996-08-24',
      gender: 'FEMALE',
      weightKg: 58,
      bloodGroup: 'A+',
      city: 'Coimbatore',
      lastDonationDate: '2026-06-12', // 111 days ago (>90 days), now eligible!
      totalDonations: 3,
      eligible: true,
    },
    eligibility: {
      eligible: true,
      nextEligibleDate: null,
      reasons: [],
      rules: {
        minAge: 18,
        maxAge: 65,
        minWeightKg: 50,
        gapDays: 90,
      },
      checks: {
        age: true,
        weight: true,
        gap: true,
      },
    },
    donations: [
      {
        id: 28,
        donationDate: '2026-06-12',
        volumeMl: 350,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
      {
        id: 19,
        donationDate: '2026-02-18',
        volumeMl: 350,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
      {
        id: 11,
        donationDate: '2025-11-04',
        volumeMl: 350,
        screeningStatus: 'PASSED',
        failureReason: null,
      },
    ],
    notifications: [
      {
        id: 395,
        type: 'DONOR_ELIGIBLE_AGAIN',
        title: "You're eligible to donate again!",
        message: 'It has been 90 days since your last donation. Schedule your next blood donation today.',
        read: false,
        refType: null,
        refId: null,
        createdAt: '2026-09-11T09:00:00Z',
      },
      {
        id: 350,
        type: 'DONATION_RECORDED',
        title: 'Donation processed',
        message: 'Your donation of 350ml on 2026-06-12 was successfully screened and passed.',
        read: true,
        refType: 'Donation',
        refId: 28,
        createdAt: '2026-06-12T10:30:00Z',
      },
    ],
  },
};

// In-memory clone of donors data that can be updated during session
export const mockDonorsStore: Record<string, MockDonorRecord> = JSON.parse(
  JSON.stringify(INITIAL_MOCK_DONORS)
);

// Map token to email
export const tokenEmailMap: Record<string, string> = {
  'mock-token-ravi-7': 'ravi@example.com',
  'mock-token-asha-8': 'asha@example.com',
};

export function resetMockData() {
  const reset = JSON.parse(JSON.stringify(INITIAL_MOCK_DONORS));
  Object.keys(mockDonorsStore).forEach((key) => delete mockDonorsStore[key]);
  Object.assign(mockDonorsStore, reset);
}
