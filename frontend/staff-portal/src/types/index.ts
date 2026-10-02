// API Contract: Single source of truth types

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
  path?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  hospitalApprovalStatus: ApprovalStatus | null;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface StockSummaryRow {
  bloodGroup: BloodGroupCode;
  available: number;
  nearExpiry: number;
  expired: number;
  lowStock: boolean;
  threshold: number;
}

export interface DashboardData {
  stockByGroup: StockSummaryRow[];
  pendingRequests: number;
  emergencyPending: number;
  nearExpiryCount: number;
  todaysDonations: number;
  issuedThisMonth: number;
  expiredThisMonth: number;
}

export interface AuditLog {
  id: number;
  actor: { id: number; email: string };
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  createdAt: string;
}

export interface BloodGroupRef {
  id: number;
  code: BloodGroupCode;
}

export interface CompatibleDonorsResponse {
  recipient: BloodGroupCode;
  compatibleDonorGroups: BloodGroupCode[];
}

export interface DonorProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
  weightKg: number;
  bloodGroup: BloodGroupCode;
  city: string;
  lastDonationDate: string | null;
  totalDonations: number;
  eligible: boolean;
  donations?: Donation[];
}

export interface Eligibility {
  eligible: boolean;
  nextEligibleDate: string | null;
  reasons: string[];
  rules: { minAge: number; maxAge: number; minWeightKg: number; gapDays: number };
  checks: { age: boolean; weight: boolean; gap: boolean };
}

export interface Donation {
  id: number;
  donor: { id: number; fullName: string; bloodGroup: BloodGroupCode };
  donationDate: string;
  volumeMl: number;
  screeningStatus: ScreeningStatus;
  failureReason: string | null;
  unitNumber: string | null;
  recordedBy: { id: number; email: string };
  createdAt: string;
}

export interface Unit {
  id: number;
  unitNumber: string;
  bloodGroup: BloodGroupCode;
  donationId: number;
  collectionDate: string;
  expiryDate: string;
  status: UnitStatus;
  daysToExpiry: number;
}

export interface Hospital {
  id: number;
  name: string;
  licenseNo: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  approvalStatus: ApprovalStatus;
  decisionReason: string | null;
  createdAt: string;
}

export interface BloodRequest {
  id: number;
  requestNo: string;
  hospital: { id: number; name: string };
  bloodGroup: BloodGroupCode;
  unitsRequested: number;
  priority: RequestPriority;
  status: RequestStatus;
  requiredBy: string;
  patientNote?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  issuedUnits?: { unitNumber: string; bloodGroup: BloodGroupCode; expiryDate: string }[];
}

export interface Availability {
  bloodGroup: BloodGroupCode;
  requested: number;
  exactAvailable: number;
  compatibleAvailable: number;
  sufficientExact: boolean;
  sufficientWithCompatible: boolean;
  emergencyOnlyCompatible: boolean;
}

export interface IssueResult {
  requestId: number;
  status: 'FULFILLED';
  issuedAt: string;
  issuedUnits: { unitNumber: string; bloodGroup: BloodGroupCode; expiryDate: string }[];
}

export interface IssueRecord {
  id: number;
  requestId: number;
  requestNo: string;
  hospital: { id: number; name: string };
  unitNumber: string;
  bloodGroup: BloodGroupCode;
  expiryDate: string;
  issuedBy?: { id: number; email: string };
  issuedAt: string;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  refType: string;
  refId: number;
  createdAt: string;
}
