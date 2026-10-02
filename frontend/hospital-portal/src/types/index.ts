// Section A: Shared Enums and Types
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

// Paging
export interface PageRequest {
  page?: number; // 0-based
  size?: number; // default 20
  sort?: string; // e.g. "createdAt,desc"
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Error format
export interface ErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  details?: ErrorDetail[];
  path?: string;
}

// Section B: Auth Types
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  hospitalApprovalStatus: ApprovalStatus | null; // only set when role = HOSPITAL
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

export interface RegisterHospitalRequest {
  email: string;
  password: string;
  name: string;
  licenseNo: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
}

// Section H: Hospital Types
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

export interface UpdateHospitalProfileRequest {
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
}

// Section I: Requests
export interface CreateRequest {
  bloodGroup: BloodGroupCode;
  unitsRequested: number;
  priority: RequestPriority;
  requiredBy: string; // ISO UTC "2026-10-01T18:00:00Z"
  patientNote?: string;
}

export interface IssuedUnitSummary {
  unitNumber: string;
  bloodGroup: BloodGroupCode;
  expiryDate: string; // YYYY-MM-DD
}

export interface BloodRequest {
  id: number;
  requestNo: string;
  hospital: {
    id: number;
    name: string;
  };
  bloodGroup: BloodGroupCode;
  unitsRequested: number;
  priority: RequestPriority;
  status: RequestStatus;
  requiredBy: string;
  patientNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
  issuedUnits: IssuedUnitSummary[];
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
  status: RequestStatus;
  issuedAt: string;
  issuedUnits: IssuedUnitSummary[];
}

// Section J: Issues
export interface IssueRecord {
  id: number;
  requestId: number;
  requestNo: string;
  hospital: {
    id: number;
    name: string;
  };
  unitNumber: string;
  bloodGroup: BloodGroupCode;
  expiryDate: string;
  issuedBy?: {
    id: number;
    email: string;
  };
  issuedAt: string;
}

// Section K: Notifications
export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  refType: string | null;
  refId: number | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

// Section D: Blood Groups
export interface BloodGroupRef {
  id: number;
  code: BloodGroupCode;
}

export interface CompatibleDonorsResponse {
  recipient: BloodGroupCode;
  compatibleDonorGroups: BloodGroupCode[];
}
