import {
  AuthUser,
  Hospital,
  BloodRequest,
  IssueRecord,
  NotificationItem,
  PageResponse,
  ApiError,
  LoginResponse,
  BloodGroupCode,
} from '../types';
import {
  MOCK_ACCOUNTS,
  INITIAL_MOCK_REQUESTS,
  INITIAL_MOCK_ISSUES,
  INITIAL_MOCK_NOTIFICATIONS,
} from './mockData';

// Mutable in-memory state for mock sessions
let mockRequests: BloodRequest[] = JSON.parse(JSON.stringify(INITIAL_MOCK_REQUESTS));
let mockIssues: IssueRecord[] = JSON.parse(JSON.stringify(INITIAL_MOCK_ISSUES));
let mockNotifications: NotificationItem[] = JSON.parse(JSON.stringify(INITIAL_MOCK_NOTIFICATIONS));
let hospitalsData: Record<number, Hospital> = {
  5: JSON.parse(JSON.stringify(MOCK_ACCOUNTS['desk@cmch.org'].hospital)),
  8: JSON.parse(JSON.stringify(MOCK_ACCOUNTS['new@hospital.org'].hospital)),
  11: JSON.parse(JSON.stringify(MOCK_ACCOUNTS['rej@hospital.org'].hospital)),
};

function randomDelay(): Promise<void> {
  const ms = Math.floor(Math.random() * (450 - 200 + 1)) + 200;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseToken(authHeader?: string): { user: AuthUser; hospital: Hospital } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  for (const acc of Object.values(MOCK_ACCOUNTS)) {
    if (acc.token === token) {
      const liveHospital = hospitalsData[acc.hospital.id] || acc.hospital;
      return {
        user: {
          ...acc.user,
          hospitalApprovalStatus: liveHospital.approvalStatus,
        },
        hospital: liveHospital,
      };
    }
  }
  return null;
}

function createError(status: number, code: string, message: string, path: string, details?: any[]): Error {
  const error: ApiError = {
    timestamp: new Date().toISOString(),
    status,
    code,
    message,
    details,
    path,
  };
  const errObj: any = new Error(message);
  errObj.response = { status, data: error };
  return errObj;
}

export async function handleMockRequest(config: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}): Promise<{ status: number; data: any }> {
  await randomDelay();

  const method = (config.method || 'GET').toUpperCase();
  const rawUrl = config.url || '';
  // Normalize url by stripping base URL if present
  let path = rawUrl.replace(/^https?:\/\/[^/]+/, '');
  path = path.replace(/^\/api\/v1/, '');
  const [urlPath, queryString] = path.split('?');
  const searchParams = new URLSearchParams(queryString || '');

  // Extract query params from params object or searchParams
  const getParam = (key: string) =>
    config.params?.[key] !== undefined ? String(config.params[key]) : searchParams.get(key);

  const authHeader = config.headers?.['Authorization'] || config.headers?.['authorization'];
  const session = parseToken(authHeader);

  // --- Auth endpoints ---
  if (method === 'POST' && urlPath === '/auth/login') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const { email } = body;
    const account = MOCK_ACCOUNTS[email?.toLowerCase()];

    if (!account) {
      throw createError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.', urlPath);
    }

    const liveHospital = hospitalsData[account.hospital.id] || account.hospital;
    const responseUser: AuthUser = {
      ...account.user,
      hospitalApprovalStatus: liveHospital.approvalStatus,
    };

    const loginRes: LoginResponse = {
      accessToken: account.token,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: responseUser,
    };
    return { status: 200, data: loginRes };
  }

  if (method === 'GET' && urlPath === '/auth/me') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    return { status: 200, data: session.user };
  }

  if (method === 'POST' && urlPath === '/auth/change-password') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    return { status: 204, data: null };
  }

  // --- Hospital endpoints ---
  if (method === 'GET' && urlPath === '/hospitals/me') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    return { status: 200, data: session.hospital };
  }

  if (method === 'PUT' && urlPath === '/hospitals/me') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const updated: Hospital = {
      ...session.hospital,
      contactPerson: body.contactPerson || session.hospital.contactPerson,
      phone: body.phone || session.hospital.phone,
      address: body.address || session.hospital.address,
      city: body.city || session.hospital.city,
    };
    hospitalsData[session.hospital.id] = updated;
    return { status: 200, data: updated };
  }

  // --- Requests endpoints ---
  if (method === 'POST' && urlPath === '/requests') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    if (session.hospital.approvalStatus !== 'APPROVED') {
      throw createError(
        403,
        'HOSPITAL_NOT_APPROVED',
        'Hospital registration is not approved. Blood requests are restricted.',
        urlPath
      );
    }
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const errors = [];
    if (!body.bloodGroup) {
      errors.push({ field: 'bloodGroup', message: 'Blood group is required.' });
    }
    if (!body.unitsRequested || body.unitsRequested <= 0) {
      errors.push({ field: 'unitsRequested', message: 'Units requested must be at least 1.' });
    }
    if (!body.priority) {
      errors.push({ field: 'priority', message: 'Priority is required.' });
    }
    if (!body.requiredBy) {
      errors.push({ field: 'requiredBy', message: 'Required by date and time is required.' });
    }

    if (errors.length > 0) {
      throw createError(400, 'VALIDATION_ERROR', 'Input validation failed.', urlPath, errors);
    }

    const newId = Math.max(...mockRequests.map((r) => r.id), 100) + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newRequest: BloodRequest = {
      id: newId,
      requestNo: `REQ-${dateStr}-${String(newId).padStart(4, '0')}`,
      hospital: { id: session.hospital.id, name: session.hospital.name },
      bloodGroup: body.bloodGroup,
      unitsRequested: Number(body.unitsRequested),
      priority: body.priority,
      status: 'PENDING',
      requiredBy: body.requiredBy,
      patientNote: body.patientNote || null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      decidedAt: null,
      issuedUnits: [],
    };
    mockRequests.unshift(newRequest);

    // Also add a notification
    mockNotifications.unshift({
      id: Math.max(...mockNotifications.map((n) => n.id), 500) + 1,
      type: body.priority === 'EMERGENCY' ? 'EMERGENCY_REQUEST' : 'REQUEST_CREATED',
      title: body.priority === 'EMERGENCY' ? 'Emergency Request Placed' : 'Blood Request Placed',
      message: `Request ${newRequest.requestNo} for ${newRequest.unitsRequested} unit(s) of ${newRequest.bloodGroup} placed.`,
      read: false,
      refType: 'BloodRequest',
      refId: newId,
      createdAt: new Date().toISOString(),
    });

    return { status: 201, data: newRequest };
  }

  if (method === 'GET' && urlPath === '/requests/mine') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const statusFilter = getParam('status');
    const q = getParam('q')?.toLowerCase();
    const page = parseInt(getParam('page') || '0', 10);
    const size = parseInt(getParam('size') || '20', 10);

    let filtered = mockRequests.filter((r) => r.hospital.id === session.hospital.id);

    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.requestNo.toLowerCase().includes(q) ||
          r.bloodGroup.toLowerCase().includes(q) ||
          (r.patientNote && r.patientNote.toLowerCase().includes(q))
      );
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = filtered.slice(start, start + size);

    const response: PageResponse<BloodRequest> = {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };
    return { status: 200, data: response };
  }

  const requestDetailMatch = urlPath.match(/^\/requests\/(\d+)$/);
  if (method === 'GET' && requestDetailMatch) {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const id = parseInt(requestDetailMatch[1], 10);
    const item = mockRequests.find((r) => r.id === id);
    if (!item || item.hospital.id !== session.hospital.id) {
      throw createError(404, 'NOT_FOUND', `Request #${id} not found.`, urlPath);
    }
    return { status: 200, data: item };
  }

  const requestCancelMatch = urlPath.match(/^\/requests\/(\d+)\/cancel$/);
  if (method === 'POST' && requestCancelMatch) {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const id = parseInt(requestCancelMatch[1], 10);
    const index = mockRequests.findIndex((r) => r.id === id);
    if (index === -1 || mockRequests[index].hospital.id !== session.hospital.id) {
      throw createError(404, 'NOT_FOUND', `Request #${id} not found.`, urlPath);
    }
    if (mockRequests[index].status !== 'PENDING') {
      throw createError(
        409,
        'INVALID_STATE',
        `Only PENDING requests can be cancelled. Current status is ${mockRequests[index].status}.`,
        urlPath
      );
    }
    mockRequests[index].status = 'CANCELLED';
    return { status: 200, data: mockRequests[index] };
  }

  // --- Issues endpoints ---
  if (method === 'GET' && urlPath === '/issues/mine') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const page = parseInt(getParam('page') || '0', 10);
    const size = parseInt(getParam('size') || '20', 10);

    const filtered = mockIssues.filter((i) => i.hospital.id === session.hospital.id);
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = filtered.slice(start, start + size);

    const response: PageResponse<IssueRecord> = {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };
    return { status: 200, data: response };
  }

  // --- Notifications endpoints ---
  if (method === 'GET' && urlPath === '/notifications') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const unreadOnly = getParam('unreadOnly') === 'true';
    const page = parseInt(getParam('page') || '0', 10);
    const size = parseInt(getParam('size') || '20', 10);

    let filtered = [...mockNotifications];
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = filtered.slice(start, start + size);

    const response: PageResponse<NotificationItem> = {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };
    return { status: 200, data: response };
  }

  if (method === 'GET' && urlPath === '/notifications/unread-count') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const unreadCount = mockNotifications.filter((n) => !n.read).length;
    return { status: 200, data: { count: unreadCount } };
  }

  const notifReadMatch = urlPath.match(/^\/notifications\/(\d+)\/read$/);
  if (method === 'PATCH' && notifReadMatch) {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    const id = parseInt(notifReadMatch[1], 10);
    const n = mockNotifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
    }
    return { status: 204, data: null };
  }

  if (method === 'PATCH' && urlPath === '/notifications/read-all') {
    if (!session) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication token is missing or invalid.', urlPath);
    }
    mockNotifications.forEach((n) => {
      n.read = true;
    });
    return { status: 204, data: null };
  }

  // --- Blood Groups endpoints ---
  if (method === 'GET' && urlPath === '/blood-groups') {
    const groups: { id: number; code: BloodGroupCode }[] = [
      { id: 1, code: 'A+' },
      { id: 2, code: 'A-' },
      { id: 3, code: 'B+' },
      { id: 4, code: 'B-' },
      { id: 5, code: 'AB+' },
      { id: 6, code: 'AB-' },
      { id: 7, code: 'O+' },
      { id: 8, code: 'O-' },
    ];
    return { status: 200, data: groups };
  }

  // Fallback 404
  throw createError(404, 'NOT_FOUND', `Endpoint not found: ${method} ${urlPath}`, urlPath);
}
