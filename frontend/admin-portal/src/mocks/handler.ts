import {
  ApiError,
  AuditLog,
  AuthUser,
  BloodGroupCode,
  BloodRequest,
  DashboardData,
  Donation,
  DonorProfile,
  Hospital,
  IssueRecord,
  LoginResponse,
  NotificationItem,
  PageResponse,
  StockSummaryRow,
  Unit,
} from '../types';
import {
  INITIAL_STOCK,
  MOCK_AUDIT_LOGS,
  MOCK_DONATIONS,
  MOCK_DONORS,
  MOCK_HOSPITALS,
  MOCK_ISSUES,
  MOCK_NOTIFICATIONS,
  MOCK_REQUESTS,
  MOCK_UNITS,
  MOCK_USERS,
} from './data';

// Compatibility matrix
export const COMPATIBLE_DONORS: Record<BloodGroupCode, BloodGroupCode[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

// In-memory mutable states
let users = [...MOCK_USERS];
let stockSummary = [...INITIAL_STOCK];
let donors = [...MOCK_DONORS];
let donations = [...MOCK_DONATIONS];
let units = [...MOCK_UNITS];
let hospitals = [...MOCK_HOSPITALS];
let requests = [...MOCK_REQUESTS];
let issues = [...MOCK_ISSUES];
let auditLogs = [...MOCK_AUDIT_LOGS];
let notifications = [...MOCK_NOTIFICATIONS];

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const makeError = (
  status: number,
  code: string,
  message: string,
  path: string,
  details?: { field: string; message: string }[]
): ApiError => ({
  timestamp: new Date().toISOString(),
  status,
  code,
  message,
  path,
  details,
});

export async function handleMockRequest(
  method: string,
  path: string,
  body?: any,
  params?: Record<string, string>,
  currentUser?: AuthUser | null
): Promise<any> {
  await delay(220);
  const normalizedMethod = method.toUpperCase();
  const cleanPath = path.split('?')[0];

  // Helper for pagination
  function paginate<T>(items: T[], page = 0, size = 20): PageResponse<T> {
    const pageNum = Number(page) || 0;
    const sizeNum = Number(size) || 20;
    const totalElements = items.length;
    const totalPages = Math.ceil(totalElements / sizeNum) || 1;
    const start = pageNum * sizeNum;
    const content = items.slice(start, start + sizeNum);
    return {
      content,
      page: pageNum,
      size: sizeNum,
      totalElements,
      totalPages,
    };
  }

  // Helper to recompute stockByGroup
  function recalculateStock(): StockSummaryRow[] {
    const groups: BloodGroupCode[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
    return groups.map((bg) => {
      const groupUnits = units.filter((u) => u.bloodGroup === bg);
      const available = groupUnits.filter((u) => u.status === 'AVAILABLE').length;
      const nearExpiry = groupUnits.filter(
        (u) => u.status === 'AVAILABLE' && u.daysToExpiry <= 7 && u.daysToExpiry >= 0
      ).length;
      const expired = groupUnits.filter((u) => u.status === 'EXPIRED').length;
      const threshold = 10;
      return {
        bloodGroup: bg,
        available,
        nearExpiry,
        expired,
        lowStock: available < threshold,
        threshold,
      };
    });
  }

  // --- Auth endpoints ---
  if (normalizedMethod === 'POST' && cleanPath === '/auth/login') {
    const email = body?.email?.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      throw makeError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.', cleanPath);
    }
    if (!user.active) {
      throw makeError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated by an administrator.', cleanPath);
    }

    const response: LoginResponse = {
      accessToken: `mock-jwt-token-for-user-${user.id}-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user,
    };
    return response;
  }

  if (normalizedMethod === 'GET' && cleanPath === '/auth/me') {
    if (!currentUser) {
      throw makeError(401, 'UNAUTHORIZED', 'Missing or expired token.', cleanPath);
    }
    return currentUser;
  }

  if (normalizedMethod === 'POST' && cleanPath === '/auth/change-password') {
    return { success: true };
  }

  // --- Admin endpoints ---
  if (normalizedMethod === 'GET' && cleanPath === '/admin/dashboard') {
    const currentStock = recalculateStock();
    const pendingReqs = requests.filter((r) => r.status === 'PENDING').length;
    const emergencyPending = requests.filter((r) => r.status === 'PENDING' && r.priority === 'EMERGENCY').length;
    const nearExpiryUnits = units.filter(
      (u) => u.status === 'AVAILABLE' && u.daysToExpiry <= 7 && u.daysToExpiry >= 0
    ).length;
    const todaysDonations = donations.filter((d) => d.donationDate === '2026-10-01').length;
    const issuedThisMonth = issues.length + 28; // Including past archive
    const expiredThisMonth = units.filter((u) => u.status === 'EXPIRED').length;

    const data: DashboardData = {
      stockByGroup: currentStock,
      pendingRequests: pendingReqs,
      emergencyPending,
      nearExpiryCount: nearExpiryUnits,
      todaysDonations,
      issuedThisMonth,
      expiredThisMonth,
    };
    return data;
  }

  if (normalizedMethod === 'GET' && cleanPath === '/admin/users') {
    let result = [...users];
    if (params?.role) {
      result = result.filter((u) => u.role === params.role);
    }
    if (params?.active !== undefined && params?.active !== '') {
      const isActive = params.active === 'true';
      result = result.filter((u) => u.active === isActive);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      result = result.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  if (normalizedMethod === 'POST' && cleanPath === '/admin/staff') {
    if (!body?.email || !body?.fullName || !body?.password) {
      throw makeError(400, 'VALIDATION_ERROR', 'All fields are required.', cleanPath, [
        { field: 'email', message: 'Email cannot be blank' },
        { field: 'fullName', message: 'Full name is required' },
      ]);
    }
    if (users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      throw makeError(409, 'EMAIL_EXISTS', 'A user with this email already exists.', cleanPath);
    }
    const newUser: AuthUser = {
      id: users.length + 1,
      email: body.email,
      fullName: body.fullName,
      role: 'STAFF',
      active: true,
      hospitalApprovalStatus: null,
      createdAt: new Date().toISOString(),
    };
    users.unshift(newUser);

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 1, email: currentUser?.email || 'admin@bloodbank.org' },
      action: 'STAFF_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      details: `Added new staff member: ${newUser.fullName} (${newUser.email})`,
      createdAt: new Date().toISOString(),
    });

    return newUser;
  }

  const userActiveMatch = cleanPath.match(/^\/admin\/users\/(\d+)\/active$/);
  if (normalizedMethod === 'PATCH' && userActiveMatch) {
    const id = Number(userActiveMatch[1]);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw makeError(404, 'NOT_FOUND', 'User not found.', cleanPath);
    }
    users[idx] = { ...users[idx], active: Boolean(body?.active) };

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 1, email: currentUser?.email || 'admin@bloodbank.org' },
      action: users[idx].active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: id,
      details: `User status changed to ${users[idx].active ? 'Active' : 'Inactive'} for ${users[idx].email}`,
      createdAt: new Date().toISOString(),
    });

    return users[idx];
  }

  if (normalizedMethod === 'GET' && (cleanPath === '/admin/audit-logs' || cleanPath === '/audit-logs' || cleanPath === '/audit')) {
    let result = [...auditLogs];
    if (params?.actor) {
      const actorQ = params.actor.toLowerCase();
      result = result.filter((l) => l.actor.email.toLowerCase().includes(actorQ));
    }
    if (params?.action) {
      result = result.filter((l) => l.action.toLowerCase() === params.action.toLowerCase());
    }
    if (params?.from) {
      result = result.filter((l) => l.createdAt.slice(0, 10) >= params.from!);
    }
    if (params?.to) {
      result = result.filter((l) => l.createdAt.slice(0, 10) <= params.to!);
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  // --- Blood Groups ---
  if (normalizedMethod === 'GET' && cleanPath === '/blood-groups') {
    const groups: BloodGroupCode[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return groups.map((g, idx) => ({ id: idx + 1, code: g }));
  }

  const compatibleMatch = cleanPath.match(/^\/blood-groups\/([^/]+)\/compatible-donors$/);
  if (normalizedMethod === 'GET' && compatibleMatch) {
    const code = decodeURIComponent(compatibleMatch[1]) as BloodGroupCode;
    const compatible = COMPATIBLE_DONORS[code] || [];
    return { recipient: code, compatibleDonorGroups: compatible };
  }

  // --- Donors ---
  if (normalizedMethod === 'GET' && cleanPath === '/donors') {
    let result = [...donors];
    if (params?.bloodGroup) {
      result = result.filter((d) => d.bloodGroup === params.bloodGroup);
    }
    if (params?.city) {
      result = result.filter((d) => d.city.toLowerCase().includes(params.city.toLowerCase()));
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      result = result.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.city.toLowerCase().includes(q)
      );
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  if (normalizedMethod === 'GET' && cleanPath === '/donors/eligible') {
    let result = donors.filter((d) => d.eligible);
    if (params?.bloodGroup) {
      result = result.filter((d) => d.bloodGroup === params.bloodGroup);
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  const donorIdMatch = cleanPath.match(/^\/donors\/(\d+)$/);
  if (normalizedMethod === 'GET' && donorIdMatch) {
    const id = Number(donorIdMatch[1]);
    const donor = donors.find((d) => d.id === id);
    if (!donor) {
      throw makeError(404, 'NOT_FOUND', 'Donor not found.', cleanPath);
    }
    const donorDonations = donations.filter((dn) => dn.donor.id === id);
    return { ...donor, donations: donorDonations };
  }

  // --- Donations ---
  if (normalizedMethod === 'GET' && cleanPath === '/donations') {
    let result = [...donations];
    if (params?.donorId) {
      result = result.filter((d) => d.donor.id === Number(params.donorId));
    }
    if (params?.status) {
      result = result.filter((d) => d.screeningStatus === params.status);
    }
    if (params?.from) {
      result = result.filter((d) => d.donationDate >= params.from!);
    }
    if (params?.to) {
      result = result.filter((d) => d.donationDate <= params.to!);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      result = result.filter(
        (d) =>
          d.donor.fullName.toLowerCase().includes(q) ||
          (d.unitNumber && d.unitNumber.toLowerCase().includes(q))
      );
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  const donationIdMatch = cleanPath.match(/^\/donations\/(\d+)$/);
  if (normalizedMethod === 'GET' && donationIdMatch) {
    const id = Number(donationIdMatch[1]);
    const donation = donations.find((d) => d.id === id);
    if (!donation) {
      throw makeError(404, 'NOT_FOUND', 'Donation record not found.', cleanPath);
    }
    return donation;
  }

  if (normalizedMethod === 'POST' && cleanPath === '/donations') {
    const donorId = Number(body?.donorId);
    const donor = donors.find((d) => d.id === donorId);
    if (!donor) {
      throw makeError(404, 'NOT_FOUND', 'Selected donor does not exist.', cleanPath);
    }

    if (!donor.eligible) {
      let nextDate = '2026-12-14';
      if (donor.lastDonationDate) {
        const d = new Date(donor.lastDonationDate);
        d.setDate(d.getDate() + 90);
        nextDate = d.toISOString().split('T')[0];
      }
      throw makeError(
        422,
        'DONOR_NOT_ELIGIBLE',
        `Donor is not eligible to donate. Next eligible date: ${nextDate}. Minimum 90-day interval between donations required.`,
        cleanPath
      );
    }

    if (!body?.volumeMl || body.volumeMl < 200 || body.volumeMl > 550) {
      throw makeError(400, 'VALIDATION_ERROR', 'Donation volume must be between 200ml and 550ml.', cleanPath, [
        { field: 'volumeMl', message: 'Volume must be between 200ml and 550ml' },
      ]);
    }

    const newDonation: Donation = {
      id: donations.length + 1,
      donor: { id: donor.id, fullName: donor.fullName, bloodGroup: donor.bloodGroup },
      donationDate: body.donationDate || '2026-10-01',
      volumeMl: Number(body.volumeMl),
      screeningStatus: 'PENDING',
      failureReason: null,
      unitNumber: null,
      recordedBy: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      createdAt: new Date().toISOString(),
    };
    donations.unshift(newDonation);

    // Update donor last donation date and total
    donor.lastDonationDate = newDonation.donationDate;
    donor.totalDonations += 1;
    donor.eligible = false; // Need 90 days gap

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      action: 'DONATION_RECORDED',
      entityType: 'Donation',
      entityId: newDonation.id,
      details: `Collected ${newDonation.volumeMl}ml from donor ${donor.fullName} (${donor.bloodGroup})`,
      createdAt: new Date().toISOString(),
    });

    return newDonation;
  }

  const screeningMatch = cleanPath.match(/^\/donations\/(\d+)\/screening$/);
  if (normalizedMethod === 'PATCH' && screeningMatch) {
    const id = Number(screeningMatch[1]);
    const idx = donations.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw makeError(404, 'NOT_FOUND', 'Donation not found.', cleanPath);
    }

    const result = body?.result; // 'PASSED' | 'FAILED'
    if (result !== 'PASSED' && result !== 'FAILED') {
      throw makeError(400, 'VALIDATION_ERROR', 'Result must be PASSED or FAILED.', cleanPath);
    }

    const donation = donations[idx];
    if (result === 'FAILED') {
      donation.screeningStatus = 'FAILED';
      donation.failureReason = body?.failureReason || 'Screening serology non-reactive check failed';
      donation.unitNumber = null;

      notifications.unshift({
        id: notifications.length + 400,
        type: 'SCREENING_FAILED',
        title: 'Screening Test Failed',
        message: `Donation #${donation.id} for donor ${donation.donor.fullName} failed screening: ${donation.failureReason}`,
        read: false,
        refType: 'Donation',
        refId: donation.id,
        createdAt: new Date().toISOString(),
      });
    } else {
      donation.screeningStatus = 'PASSED';
      donation.failureReason = null;
      const unitNum = `BB-20261001-00${String(units.length + 1).padStart(2, '0')}`;
      donation.unitNumber = unitNum;

      // Add to inventory units
      const newUnit: Unit = {
        id: units.length + 100,
        unitNumber: unitNum,
        bloodGroup: donation.donor.bloodGroup,
        donationId: donation.id,
        collectionDate: donation.donationDate,
        expiryDate: '2026-11-12', // 42 days shelf life
        status: 'AVAILABLE',
        daysToExpiry: 42,
      };
      units.unshift(newUnit);

      notifications.unshift({
        id: notifications.length + 400,
        type: 'DONATION_RECORDED',
        title: 'New Unit Available',
        message: `Unit ${unitNum} (${newUnit.bloodGroup}) successfully screened and placed into inventory.`,
        read: false,
        refType: 'Unit',
        refId: newUnit.id,
        createdAt: new Date().toISOString(),
      });
    }

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      action: result === 'PASSED' ? 'SCREENING_PASSED' : 'SCREENING_FAILED',
      entityType: 'Donation',
      entityId: donation.id,
      details: `Screening marked as ${result} for donation #${donation.id}${donation.failureReason ? `: ${donation.failureReason}` : ''}`,
      createdAt: new Date().toISOString(),
    });

    return donation;
  }

  // --- Inventory ---
  if (normalizedMethod === 'GET' && cleanPath === '/inventory/summary') {
    return recalculateStock();
  }

  if (normalizedMethod === 'GET' && cleanPath === '/inventory/units') {
    let result = [...units];
    if (params?.bloodGroup) {
      result = result.filter((u) => u.bloodGroup === params.bloodGroup);
    }
    if (params?.status) {
      result = result.filter((u) => u.status === params.status);
    }
    if (params?.expiryFrom) {
      result = result.filter((u) => u.expiryDate >= params.expiryFrom!);
    }
    if (params?.expiryTo) {
      result = result.filter((u) => u.expiryDate <= params.expiryTo!);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      result = result.filter((u) => u.unitNumber.toLowerCase().includes(q));
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  if (normalizedMethod === 'GET' && cleanPath === '/inventory/near-expiry') {
    const days = Number(params?.days || 7);
    const nearExpiry = units
      .filter((u) => u.status === 'AVAILABLE' && u.daysToExpiry <= days && u.daysToExpiry >= 0)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    return nearExpiry;
  }

  const discardMatch = cleanPath.match(/^\/inventory\/units\/(\d+)\/discard$/);
  if (normalizedMethod === 'POST' && discardMatch) {
    const id = Number(discardMatch[1]);
    const unit = units.find((u) => u.id === id);
    if (!unit) {
      throw makeError(404, 'NOT_FOUND', 'Unit not found.', cleanPath);
    }
    if (unit.status !== 'AVAILABLE' && unit.status !== 'EXPIRED') {
      throw makeError(409, 'INVALID_STATE', `Unit in state ${unit.status} cannot be discarded.`, cleanPath);
    }

    unit.status = 'DISCARDED';

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 1, email: currentUser?.email || 'admin@bloodbank.org' },
      action: 'UNIT_DISCARDED',
      entityType: 'Unit',
      entityId: unit.id,
      details: `Unit ${unit.unitNumber} (${unit.bloodGroup}) discarded: ${body?.reason || 'Protocol discard'}`,
      createdAt: new Date().toISOString(),
    });

    return unit;
  }

  // --- Hospitals ---
  if (normalizedMethod === 'GET' && cleanPath === '/hospitals') {
    let result = [...hospitals];
    if (params?.status) {
      result = result.filter((h) => h.approvalStatus === params.status);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.licenseNo.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q)
      );
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  const hospitalApprovalMatch = cleanPath.match(/^\/hospitals\/(\d+)\/approval$/);
  if (normalizedMethod === 'PATCH' && hospitalApprovalMatch) {
    const id = Number(hospitalApprovalMatch[1]);
    const hospital = hospitals.find((h) => h.id === id);
    if (!hospital) {
      throw makeError(404, 'NOT_FOUND', 'Hospital record not found.', cleanPath);
    }
    const decision = body?.decision || body?.status;
    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(decision)) {
      throw makeError(400, 'VALIDATION_ERROR', 'Decision must be APPROVED, REJECTED, or SUSPENDED.', cleanPath);
    }
    if ((decision === 'REJECTED' || decision === 'SUSPENDED') && !body?.reason?.trim()) {
      throw makeError(400, 'VALIDATION_ERROR', 'A decision reason is mandatory for rejection or suspension.', cleanPath, [
        { field: 'reason', message: 'Reason cannot be blank' },
      ]);
    }

    hospital.approvalStatus = decision;
    hospital.decisionReason = body?.reason || null;

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 1, email: currentUser?.email || 'admin@bloodbank.org' },
      action: `HOSPITAL_${decision}`,
      entityType: 'Hospital',
      entityId: hospital.id,
      details: `Hospital status set to ${decision} for ${hospital.name}${hospital.decisionReason ? `: ${hospital.decisionReason}` : ''}`,
      createdAt: new Date().toISOString(),
    });

    return hospital;
  }

  // --- Requests ---
  if (normalizedMethod === 'GET' && cleanPath === '/requests/queue') {
    let result = [...requests];
    if (params?.status) {
      const allowed = params.status.split(',');
      result = result.filter((r) => allowed.includes(r.status));
    }
    if (params?.priority) {
      result = result.filter((r) => r.priority === params.priority);
    }

    // Default sorting: EMERGENCY first, then URGENT, then NORMAL, then requiredBy
    const priorityWeight: Record<string, number> = { EMERGENCY: 3, URGENT: 2, NORMAL: 1 };
    result.sort((a, b) => {
      const pwA = priorityWeight[a.priority] || 0;
      const pwB = priorityWeight[b.priority] || 0;
      if (pwA !== pwB) return pwB - pwA;
      return new Date(a.requiredBy).getTime() - new Date(b.requiredBy).getTime();
    });

    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  const requestIdMatch = cleanPath.match(/^\/requests\/(\d+)$/);
  if (normalizedMethod === 'GET' && requestIdMatch) {
    const id = Number(requestIdMatch[1]);
    const req = requests.find((r) => r.id === id);
    if (!req) {
      throw makeError(404, 'NOT_FOUND', 'Blood request not found.', cleanPath);
    }
    return req;
  }

  const reqAvailabilityMatch = cleanPath.match(/^\/requests\/(\d+)\/availability$/);
  if (normalizedMethod === 'GET' && reqAvailabilityMatch) {
    const id = Number(reqAvailabilityMatch[1]);
    const req = requests.find((r) => r.id === id);
    if (!req) {
      throw makeError(404, 'NOT_FOUND', 'Blood request not found.', cleanPath);
    }

    const exactUnits = units.filter((u) => u.bloodGroup === req.bloodGroup && u.status === 'AVAILABLE');
    const compatibleGroups = COMPATIBLE_DONORS[req.bloodGroup as BloodGroupCode] || [];
    const compatibleUnits = units.filter(
      (u) => compatibleGroups.includes(u.bloodGroup) && u.status === 'AVAILABLE'
    );

    const exactAvailable = exactUnits.length;
    const compatibleAvailable = compatibleUnits.length;
    const sufficientExact = exactAvailable >= req.unitsRequested;
    const sufficientWithCompatible = compatibleAvailable >= req.unitsRequested;

    return {
      bloodGroup: req.bloodGroup,
      requested: req.unitsRequested,
      exactAvailable,
      compatibleAvailable,
      sufficientExact,
      sufficientWithCompatible,
      emergencyOnlyCompatible: true,
    };
  }

  const reqApproveMatch = cleanPath.match(/^\/requests\/(\d+)\/approve$/);
  if (normalizedMethod === 'POST' && reqApproveMatch) {
    const id = Number(reqApproveMatch[1]);
    const req = requests.find((r) => r.id === id);
    if (!req) {
      throw makeError(404, 'NOT_FOUND', 'Blood request not found.', cleanPath);
    }
    if (req.status !== 'PENDING') {
      throw makeError(409, 'INVALID_STATE', `Request in state ${req.status} cannot be approved.`, cleanPath);
    }
    req.status = 'APPROVED';
    req.decidedAt = new Date().toISOString();

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      action: 'REQUEST_APPROVED',
      entityType: 'BloodRequest',
      entityId: req.id,
      details: `Approved request ${req.requestNo} for ${req.unitsRequested} units of ${req.bloodGroup} from ${req.hospital.name}`,
      createdAt: new Date().toISOString(),
    });

    return req;
  }

  const reqRejectMatch = cleanPath.match(/^\/requests\/(\d+)\/reject$/);
  if (normalizedMethod === 'POST' && reqRejectMatch) {
    const id = Number(reqRejectMatch[1]);
    const req = requests.find((r) => r.id === id);
    if (!req) {
      throw makeError(404, 'NOT_FOUND', 'Blood request not found.', cleanPath);
    }
    if (req.status !== 'PENDING' && req.status !== 'APPROVED') {
      throw makeError(409, 'INVALID_STATE', `Request in state ${req.status} cannot be rejected.`, cleanPath);
    }
    req.status = 'REJECTED';
    req.rejectionReason = body?.reason || 'Clinical or inventory constraint.';
    req.decidedAt = new Date().toISOString();

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      action: 'REQUEST_REJECTED',
      entityType: 'BloodRequest',
      entityId: req.id,
      details: `Rejected request ${req.requestNo}: ${req.rejectionReason}`,
      createdAt: new Date().toISOString(),
    });

    return req;
  }

  // Issue units endpoint
  const reqIssueMatch = cleanPath.match(/^\/requests\/(\d+)\/issue$/);
  if (normalizedMethod === 'POST' && reqIssueMatch) {
    const id = Number(reqIssueMatch[1]);
    const req = requests.find((r) => r.id === id);
    if (!req) {
      throw makeError(404, 'NOT_FOUND', 'Blood request not found.', cleanPath);
    }
    if (req.status !== 'APPROVED') {
      throw makeError(409, 'INVALID_STATE', `Request must be in APPROVED state to issue units (currently ${req.status}).`, cleanPath);
    }

    // Find available units: first try exact match, then compatible if emergency
    let candidateUnits = units.filter((u) => u.bloodGroup === req.bloodGroup && u.status === 'AVAILABLE');
    if (candidateUnits.length < req.unitsRequested && req.priority === 'EMERGENCY') {
      const compatibleGroups = COMPATIBLE_DONORS[req.bloodGroup as BloodGroupCode] || [];
      const compatibleUnits = units.filter(
        (u) => compatibleGroups.includes(u.bloodGroup) && u.status === 'AVAILABLE' && !candidateUnits.includes(u)
      );
      candidateUnits = [...candidateUnits, ...compatibleUnits];
    }

    if (candidateUnits.length < req.unitsRequested) {
      throw makeError(
        409,
        'INSUFFICIENT_STOCK',
        `Only ${candidateUnits.length} of ${req.unitsRequested} requested units are available.`,
        cleanPath,
        [{ field: 'unitsRequested', message: `Available stock is ${candidateUnits.length}` }]
      );
    }

    const selectedUnits = candidateUnits.slice(0, req.unitsRequested);
    const issuedUnitsList: { unitNumber: string; bloodGroup: BloodGroupCode; expiryDate: string }[] = [];

    const nowIso = new Date().toISOString();
    selectedUnits.forEach((u) => {
      u.status = 'ISSUED';
      issuedUnitsList.push({
        unitNumber: u.unitNumber,
        bloodGroup: u.bloodGroup,
        expiryDate: u.expiryDate,
      });

      issues.unshift({
        id: issues.length + 100,
        requestId: req.id,
        requestNo: req.requestNo,
        hospital: req.hospital,
        unitNumber: u.unitNumber,
        bloodGroup: u.bloodGroup,
        expiryDate: u.expiryDate,
        issuedBy: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
        issuedAt: nowIso,
      });
    });

    req.status = 'FULFILLED';
    req.issuedUnits = issuedUnitsList;

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      action: 'BLOOD_ISSUED',
      entityType: 'BloodRequest',
      entityId: req.id,
      details: `${req.unitsRequested} units issued for ${req.requestNo} to ${req.hospital.name}`,
      createdAt: nowIso,
    });

    notifications.unshift({
      id: notifications.length + 400,
      type: 'BLOOD_ISSUED',
      title: 'Blood Units Issued',
      message: `${req.unitsRequested} units issued for ${req.requestNo} (${req.hospital.name}).`,
      read: false,
      refType: 'BloodRequest',
      refId: req.id,
      createdAt: nowIso,
    });

    return {
      requestId: req.id,
      status: 'FULFILLED' as const,
      issuedAt: nowIso,
      issuedUnits: issuedUnitsList,
    };
  }

  // Emergency approve-and-issue endpoint
  const reqApproveIssueMatch = cleanPath.match(/^\/requests\/(\d+)\/approve-and-issue$/);
  if (normalizedMethod === 'POST' && reqApproveIssueMatch) {
    const id = Number(reqApproveIssueMatch[1]);
    const req = requests.find((r) => r.id === id);
    if (!req) {
      throw makeError(404, 'NOT_FOUND', 'Blood request not found.', cleanPath);
    }
    if (req.priority !== 'EMERGENCY') {
      throw makeError(400, 'VALIDATION_ERROR', 'One-click Approve and Issue is strictly reserved for EMERGENCY requests.', cleanPath);
    }
    if (req.status !== 'PENDING' && req.status !== 'APPROVED') {
      throw makeError(409, 'INVALID_STATE', `Request in state ${req.status} cannot be issued.`, cleanPath);
    }

    // Compatible units allowed in emergency
    const compatibleGroups = COMPATIBLE_DONORS[req.bloodGroup as BloodGroupCode] || [];
    const candidateUnits = units.filter(
      (u) => compatibleGroups.includes(u.bloodGroup) && u.status === 'AVAILABLE'
    );

    if (candidateUnits.length < req.unitsRequested) {
      throw makeError(
        409,
        'INSUFFICIENT_STOCK',
        `Only ${candidateUnits.length} of ${req.unitsRequested} requested units are available across compatible groups.`,
        cleanPath,
        [{ field: 'unitsRequested', message: `Available stock is ${candidateUnits.length}` }]
      );
    }

    const selectedUnits = candidateUnits.slice(0, req.unitsRequested);
    const issuedUnitsList: { unitNumber: string; bloodGroup: BloodGroupCode; expiryDate: string }[] = [];
    const nowIso = new Date().toISOString();

    selectedUnits.forEach((u) => {
      u.status = 'ISSUED';
      issuedUnitsList.push({
        unitNumber: u.unitNumber,
        bloodGroup: u.bloodGroup,
        expiryDate: u.expiryDate,
      });

      issues.unshift({
        id: issues.length + 100,
        requestId: req.id,
        requestNo: req.requestNo,
        hospital: req.hospital,
        unitNumber: u.unitNumber,
        bloodGroup: u.bloodGroup,
        expiryDate: u.expiryDate,
        issuedBy: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
        issuedAt: nowIso,
      });
    });

    req.status = 'FULFILLED';
    req.decidedAt = nowIso;
    req.issuedUnits = issuedUnitsList;

    auditLogs.unshift({
      id: auditLogs.length + 900,
      actor: { id: currentUser?.id || 2, email: currentUser?.email || 'staff1@bb.org' },
      action: 'EMERGENCY_DISPATCH',
      entityType: 'BloodRequest',
      entityId: req.id,
      details: `EMERGENCY DISPATCH: ${req.unitsRequested} units immediately issued for ${req.requestNo} to ${req.hospital.name}`,
      createdAt: nowIso,
    });

    notifications.unshift({
      id: notifications.length + 400,
      type: 'BLOOD_ISSUED',
      title: 'Emergency Blood Dispatched',
      message: `${req.unitsRequested} units dispatched immediately for ${req.requestNo}.`,
      read: false,
      refType: 'BloodRequest',
      refId: req.id,
      createdAt: nowIso,
    });

    return {
      requestId: req.id,
      status: 'FULFILLED' as const,
      issuedAt: nowIso,
      issuedUnits: issuedUnitsList,
    };
  }

  // --- Issues ---
  if (normalizedMethod === 'GET' && cleanPath === '/issues') {
    let result = [...issues];
    if (params?.bloodGroup) {
      result = result.filter((i) => i.bloodGroup === params.bloodGroup);
    }
    if (params?.hospitalId) {
      result = result.filter((i) => i.hospital.id === Number(params.hospitalId));
    }
    if (params?.from) {
      result = result.filter((i) => i.issuedAt.slice(0, 10) >= params.from!);
    }
    if (params?.to) {
      result = result.filter((i) => i.issuedAt.slice(0, 10) <= params.to!);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      result = result.filter(
        (i) =>
          i.requestNo.toLowerCase().includes(q) ||
          i.unitNumber.toLowerCase().includes(q) ||
          i.hospital.name.toLowerCase().includes(q)
      );
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  // --- Notifications ---
  if (normalizedMethod === 'GET' && cleanPath === '/notifications') {
    let result = [...notifications];
    if (params?.unreadOnly === 'true') {
      result = result.filter((n) => !n.read);
    }
    return paginate(result, Number(params?.page || 0), Number(params?.size || 20));
  }

  if (normalizedMethod === 'GET' && cleanPath === '/notifications/unread-count') {
    const unread = notifications.filter((n) => !n.read).length;
    return { count: unread };
  }

  const notificationReadMatch = cleanPath.match(/^\/notifications\/(\d+)\/read$/);
  if (normalizedMethod === 'PATCH' && notificationReadMatch) {
    const id = Number(notificationReadMatch[1]);
    const n = notifications.find((item) => item.id === id);
    if (n) n.read = true;
    return { success: true };
  }

  if (normalizedMethod === 'PATCH' && cleanPath === '/notifications/read-all') {
    notifications.forEach((n) => (n.read = true));
    return { success: true };
  }

  // Fallback 404
  throw makeError(404, 'NOT_FOUND', `Route ${normalizedMethod} ${cleanPath} not found.`, cleanPath);
}
