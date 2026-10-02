/**
 * API Contract Types (Single Source of Truth)
 * Follows sections A (Shared formats), B (Authentication), E (Donor), K (Notifications)
 */

// --- Section A: Shared formats ---

export type Role = 'ADMIN' | 'STAFF' | 'DONOR' | 'HOSPITAL';

export type BloodGroupCode = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type ScreeningStatus = 'PENDING' | 'PASSED' | 'FAILED';

export type UnitStatus = 'AVAILABLE' | 'ISSUED' | 'EXPIRED' | 'DISCARDED';

export type RequestPriority = 'EMERGENCY' | 'URGENT' | 'NORMAL';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED' | 'CANCELLED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type NotificationType =
  | 'DONATION_RECORDED'
  | 'SCREENING_FAILED'
  | 'DONOR_ELIGIBLE_AGAIN'
  | 'HOSPITAL_REGISTERED'
  | 'HOSPITAL_DECIDED'
  | 'REQUEST_CREATED'
  | 'EMERGENCY_REQUEST'
  | 'REQUEST_DECIDED'
  | 'BLOOD_ISSUED'
  | 'LOW_STOCK'
  | 'UNIT_NEAR_EXPIRY';

export interface PageRequestParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  path: string;
}

// --- Section B: Authentication ---

export interface RegisterDonor {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  weightKg: number;
  bloodGroup: BloodGroupCode;
  city: string;
}

export interface RegisterHospital {
  email: string;
  password: string;
  name: string;
  licenseNo: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  hospitalApprovalStatus: ApprovalStatus | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// --- Section E: Donor ---

export interface DonorProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  weightKg: number;
  bloodGroup: BloodGroupCode;
  city: string;
  lastDonationDate: string | null; // YYYY-MM-DD
  totalDonations: number;
  eligible: boolean;
}

export interface UpdateDonorProfile {
  fullName: string;
  phone: string;
  weightKg: number;
  city: string;
}

export interface EligibilityRules {
  minAge: number;
  maxAge: number;
  minWeightKg: number;
  gapDays: number;
}

export interface EligibilityChecks {
  age: boolean;
  weight: boolean;
  gap: boolean;
}

export interface Eligibility {
  eligible: boolean;
  nextEligibleDate: string | null; // YYYY-MM-DD
  reasons: string[];
  rules: EligibilityRules;
  checks: EligibilityChecks;
}

export interface DonationForDonor {
  id: number;
  donationDate: string; // YYYY-MM-DD
  volumeMl: number;
  screeningStatus: ScreeningStatus;
  failureReason: string | null;
}

// --- Section K: Notifications ---

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  refType: string | null;
  refId: number | null;
  createdAt: string; // ISO-8601 UTC
}

export interface UnreadCountResponse {
  count: number;
}

// --- Section D: Blood groups ---

export interface BloodGroupItem {
  id: number;
  code: BloodGroupCode;
}

export interface CompatibleDonorsResponse {
  recipient: BloodGroupCode;
  compatibleDonorGroups: BloodGroupCode[];
}
