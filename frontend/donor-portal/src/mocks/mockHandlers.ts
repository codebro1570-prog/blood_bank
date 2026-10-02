/**
 * In-Memory Mock API Handlers
 * Follows exact JSON shapes and error formats from the contract.
 * Simulates network latency (200-500 ms).
 */

import {
  ApiError,
  AuthUser,
  ChangePasswordRequest,
  DonationForDonor,
  DonorProfile,
  Eligibility,
  LoginRequest,
  LoginResponse,
  NotificationItem,
  PageResponse,
  RegisterDonor,
  UnreadCountResponse,
  UpdateDonorProfile,
} from '../types';
import {
  mockDonorsStore,
  tokenEmailMap,
  MockDonorRecord,
} from './mockData';

// Helper to simulate network latency between 200ms and 500ms
const simulateLatency = async (min = 200, max = 500): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, ms));
};

// Helper to generate ISO UTC timestamp
const getTimestamp = () => new Date().toISOString();

// Helper to throw contract-compliant ApiError
export class MockApiError extends Error {
  apiError: ApiError;

  constructor(status: number, code: string, message: string, path: string, details: Array<{ field: string; message: string }> = []) {
    super(message);
    this.name = 'MockApiError';
    this.apiError = {
      timestamp: getTimestamp(),
      status,
      code,
      message,
      details,
      path,
    };
  }
}

// Token extraction helper
function getDonorFromToken(authHeader?: string, path = '/api/v1'): MockDonorRecord {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new MockApiError(401, 'UNAUTHORIZED', 'Missing or invalid authorization token.', path);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const email = tokenEmailMap[token];
  if (!email || !mockDonorsStore[email]) {
    throw new MockApiError(401, 'UNAUTHORIZED', 'Session expired or token invalid.', path);
  }

  return mockDonorsStore[email];
}

export const mockHandlers = {
  // POST /auth/login
  async login(body: LoginRequest, path = '/api/v1/auth/login'): Promise<LoginResponse> {
    await simulateLatency();

    let normalizedEmail = body.email?.trim().toLowerCase();
    if (normalizedEmail === 'ravi' || normalizedEmail === 'ravi kumar') {
      normalizedEmail = 'ravi@example.com';
    } else if (normalizedEmail === 'asha' || normalizedEmail === 'asha patel') {
      normalizedEmail = 'asha@example.com';
    }

    const password = body.password || 'Password123';

    if (!normalizedEmail) {
      throw new MockApiError(400, 'VALIDATION_ERROR', 'Email is required.', path, [
        { field: 'email', message: 'Email cannot be blank' },
      ]);
    }

    // Contract Section L: Seed data Admin support
    if (normalizedEmail === 'admin@bloodbank.org') {
      const adminToken = 'mock-token-admin-1';
      tokenEmailMap[adminToken] = 'admin@bloodbank.org';
      return {
        accessToken: adminToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 1,
          email: 'admin@bloodbank.org',
          fullName: 'System Administrator',
          role: 'ADMIN',
          active: true,
          hospitalApprovalStatus: null,
        },
      };
    }

    const donor = mockDonorsStore[normalizedEmail];
    if (!donor) {
      throw new MockApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.', path);
    }

    if (!donor.user.active) {
      throw new MockApiError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated. Please contact support.', path);
    }

    // Contract: Any password allowed for mock testing for Ravi and Asha
    const token = `mock-token-${donor.user.email.split('@')[0]}-${donor.user.id}`;
    tokenEmailMap[token] = donor.user.email;

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: donor.user,
    };
  },

  // POST /auth/register/donor
  async registerDonor(body: RegisterDonor, path = '/api/v1/auth/register/donor'): Promise<AuthUser> {
    await simulateLatency();

    const normalizedEmail = body.email?.trim().toLowerCase();
    if (mockDonorsStore[normalizedEmail]) {
      throw new MockApiError(409, 'EMAIL_EXISTS', 'An account with this email address already exists.', path, [
        { field: 'email', message: 'Email is already registered' },
      ]);
    }

    const details: Array<{ field: string; message: string }> = [];
    if (!body.fullName?.trim()) details.push({ field: 'fullName', message: 'Full name is required' });
    if (!body.phone?.trim()) details.push({ field: 'phone', message: 'Phone number is required' });
    if (!body.dob) details.push({ field: 'dob', message: 'Date of birth is required' });
    if (!body.weightKg || body.weightKg <= 0) details.push({ field: 'weightKg', message: 'Valid weight in kg is required' });
    if (!body.bloodGroup) details.push({ field: 'bloodGroup', message: 'Blood group is required' });
    if (!body.city?.trim()) details.push({ field: 'city', message: 'City is required' });

    if (details.length > 0) {
      throw new MockApiError(400, 'VALIDATION_ERROR', 'Validation failed on one or more fields.', path, details);
    }

    const newUserId = 100 + Object.keys(mockDonorsStore).length;
    const newProfileId = 200 + Object.keys(mockDonorsStore).length;

    const newUser: AuthUser = {
      id: newUserId,
      email: normalizedEmail,
      fullName: body.fullName,
      role: 'DONOR',
      active: true,
      hospitalApprovalStatus: null,
    };

    const newProfile: DonorProfile = {
      id: newProfileId,
      fullName: body.fullName,
      email: normalizedEmail,
      phone: body.phone,
      dob: body.dob,
      gender: body.gender,
      weightKg: body.weightKg,
      bloodGroup: body.bloodGroup,
      city: body.city,
      lastDonationDate: null,
      totalDonations: 0,
      eligible: body.weightKg >= 50,
    };

    const newEligibility: Eligibility = {
      eligible: body.weightKg >= 50,
      nextEligibleDate: body.weightKg >= 50 ? null : null,
      reasons: body.weightKg < 50 ? ['Weight must be at least 50 kg'] : [],
      rules: { minAge: 18, maxAge: 65, minWeightKg: 50, gapDays: 90 },
      checks: { age: true, weight: body.weightKg >= 50, gap: true },
    };

    mockDonorsStore[normalizedEmail] = {
      user: newUser,
      password: body.password,
      profile: newProfile,
      eligibility: newEligibility,
      donations: [],
      notifications: [
        {
          id: 500 + newUserId,
          type: 'DONOR_ELIGIBLE_AGAIN',
          title: 'Welcome to Blood Bank Donor Portal',
          message: 'Thank you for registering as a blood donor! You are ready to save lives.',
          read: false,
          refType: null,
          refId: null,
          createdAt: getTimestamp(),
        },
      ],
    };

    return newUser;
  },

  // GET /auth/me
  async getMe(authHeader?: string, path = '/api/v1/auth/me'): Promise<AuthUser> {
    await simulateLatency(150, 300);
    const donor = getDonorFromToken(authHeader, path);
    return donor.user;
  },

  // POST /auth/change-password
  async changePassword(body: ChangePasswordRequest, authHeader?: string, path = '/api/v1/auth/change-password'): Promise<void> {
    await simulateLatency();
    const donor = getDonorFromToken(authHeader, path);

    if (!body.currentPassword) {
      throw new MockApiError(400, 'VALIDATION_ERROR', 'Current password is required.', path, [
        { field: 'currentPassword', message: 'Current password cannot be blank' },
      ]);
    }

    if (!body.newPassword || body.newPassword.length < 6) {
      throw new MockApiError(400, 'VALIDATION_ERROR', 'New password must be at least 6 characters.', path, [
        { field: 'newPassword', message: 'New password must be at least 6 characters' },
      ]);
    }

    // Update stored password
    donor.password = body.newPassword;
  },

  // GET /donors/me
  async getDonorProfile(authHeader?: string, path = '/api/v1/donors/me'): Promise<DonorProfile> {
    await simulateLatency();
    const donor = getDonorFromToken(authHeader, path);
    return donor.profile;
  },

  // PUT /donors/me
  async updateDonorProfile(body: UpdateDonorProfile, authHeader?: string, path = '/api/v1/donors/me'): Promise<DonorProfile> {
    await simulateLatency();
    const donor = getDonorFromToken(authHeader, path);

    const details: Array<{ field: string; message: string }> = [];
    if (!body.fullName?.trim()) details.push({ field: 'fullName', message: 'Full name is required' });
    if (!body.phone?.trim()) details.push({ field: 'phone', message: 'Phone number is required' });
    if (!body.weightKg || body.weightKg <= 0) details.push({ field: 'weightKg', message: 'Valid weight in kg is required' });
    if (!body.city?.trim()) details.push({ field: 'city', message: 'City is required' });

    if (details.length > 0) {
      throw new MockApiError(400, 'VALIDATION_ERROR', 'Validation failed on profile update.', path, details);
    }

    // Update in-memory
    donor.profile.fullName = body.fullName.trim();
    donor.user.fullName = body.fullName.trim();
    donor.profile.phone = body.phone.trim();
    donor.profile.weightKg = body.weightKg;
    donor.profile.city = body.city.trim();

    // Recheck weight eligibility check
    donor.eligibility.checks.weight = body.weightKg >= donor.eligibility.rules.minWeightKg;
    if (body.weightKg < donor.eligibility.rules.minWeightKg) {
      donor.eligibility.eligible = false;
      if (!donor.eligibility.reasons.some((r) => r.includes('Weight'))) {
        donor.eligibility.reasons.push(`Weight is below required ${donor.eligibility.rules.minWeightKg} kg`);
      }
    }

    return donor.profile;
  },

  // GET /donors/me/eligibility
  async getEligibility(authHeader?: string, path = '/api/v1/donors/me/eligibility'): Promise<Eligibility> {
    await simulateLatency();
    const donor = getDonorFromToken(authHeader, path);
    return donor.eligibility;
  },

  // GET /donors/me/donations
  async getMyDonations(
    params?: { page?: number; size?: number; sort?: string },
    authHeader?: string,
    path = '/api/v1/donors/me/donations'
  ): Promise<PageResponse<DonationForDonor>> {
    await simulateLatency();
    const donor = getDonorFromToken(authHeader, path);

    const page = Math.max(0, Number(params?.page || 0));
    const size = Math.min(100, Math.max(1, Number(params?.size || 20)));

    let donations = [...donor.donations];

    // Sorting support (e.g. donationDate,desc)
    if (params?.sort) {
      const [field, order] = params.sort.split(',');
      donations.sort((a, b) => {
        if (field === 'donationDate') {
          return order === 'asc'
            ? a.donationDate.localeCompare(b.donationDate)
            : b.donationDate.localeCompare(a.donationDate);
        }
        return 0;
      });
    }

    const totalElements = donations.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = donations.slice(start, start + size);

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };
  },

  // GET /notifications
  async getNotifications(
    params?: { unreadOnly?: boolean; page?: number; size?: number; sort?: string },
    authHeader?: string,
    path = '/api/v1/notifications'
  ): Promise<PageResponse<NotificationItem>> {
    await simulateLatency();
    const donor = getDonorFromToken(authHeader, path);

    const page = Math.max(0, Number(params?.page || 0));
    const size = Math.min(100, Math.max(1, Number(params?.size || 20)));
    const unreadOnly = params?.unreadOnly === true || params?.unreadOnly === ('true' as unknown as boolean);

    let list = [...donor.notifications];
    if (unreadOnly) {
      list = list.filter((n) => !n.read);
    }

    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = list.slice(start, start + size);

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };
  },

  // GET /notifications/unread-count
  async getUnreadCount(authHeader?: string, path = '/api/v1/notifications/unread-count'): Promise<UnreadCountResponse> {
    await simulateLatency(150, 300);
    const donor = getDonorFromToken(authHeader, path);
    const count = donor.notifications.filter((n) => !n.read).length;
    return { count };
  },

  // PATCH /notifications/:id/read
  async markAsRead(id: number, authHeader?: string, path = `/api/v1/notifications/${id}/read`): Promise<void> {
    await simulateLatency(150, 300);
    const donor = getDonorFromToken(authHeader, path);
    const notification = donor.notifications.find((n) => n.id === id);
    if (!notification) {
      throw new MockApiError(404, 'NOT_FOUND', `Notification #${id} not found.`, path);
    }
    notification.read = true;
  },

  // PATCH /notifications/read-all
  async markAllAsRead(authHeader?: string, path = '/api/v1/notifications/read-all'): Promise<void> {
    await simulateLatency(150, 300);
    const donor = getDonorFromToken(authHeader, path);
    donor.notifications.forEach((n) => {
      n.read = true;
    });
  },

  // GET /blood-groups
  async getBloodGroups(): Promise<Array<{ id: number; code: string }>> {
    await simulateLatency(100, 200);
    return [
      { id: 1, code: 'A+' },
      { id: 2, code: 'A-' },
      { id: 3, code: 'B+' },
      { id: 4, code: 'B-' },
      { id: 5, code: 'AB+' },
      { id: 6, code: 'AB-' },
      { id: 7, code: 'O+' },
      { id: 8, code: 'O-' },
    ];
  },

  // GET /blood-groups/:code/compatible-donors
  async getCompatibleDonors(rawCode: string): Promise<{ recipient: string; compatibleDonorGroups: string[] }> {
    await simulateLatency(100, 250);
    const code = decodeURIComponent(rawCode).trim().toUpperCase();

    const compatibilityMap: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-'],
    };

    const compatibleDonorGroups = compatibilityMap[code];
    if (!compatibleDonorGroups) {
      throw new MockApiError(404, 'NOT_FOUND', `Unknown blood group: ${code}`, `/api/v1/blood-groups/${rawCode}/compatible-donors`);
    }

    return {
      recipient: code,
      compatibleDonorGroups,
    };
  },
};
