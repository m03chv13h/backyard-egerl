import type {
  Token,
  UserBase,
  EventCreate,
  EventPublic,
  RunnerCreate,
  RunnerPublic,
  RegistrationUpdate,
  RegistrationPublic,
  RegistrationRunnerCreate,
  RegistrationRunnerPublic,
  TimingCreate,
  TimingPublic,
  LapTimingCreate,
  LiveTimingRow,
  TagInfoPublic,
  TagInfoUpdate,
  ScannerStatus,
} from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return null as unknown as T;
}

/* ── Auth ── */
export async function login(
  username: string,
  password: string,
): Promise<Token> {
  const url = `${API_BASE}/token`;
  const body = new URLSearchParams({ username, password, grant_type: 'password' });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json() as Promise<Token>;
}

export function getMe(): Promise<UserBase> {
  return request<UserBase>('/users/me');
}

/* ── Events ── */
export function getEvents(): Promise<EventPublic[]> {
  return request<EventPublic[]>('/events');
}

export function getEvent(id: number): Promise<EventPublic | null> {
  return request<EventPublic | null>(`/event/${id}`);
}

export function createEvent(data: EventCreate): Promise<EventPublic> {
  return request<EventPublic>('/event', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteEvent(id: number): Promise<void> {
  return request<void>(`/event/${id}`, { method: 'DELETE' });
}

/* ── Runners ── */
export function addRunner(data: RunnerCreate): Promise<RunnerPublic> {
  return request<RunnerPublic>('/runner', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getRunner(id: number): Promise<RunnerPublic | null> {
  return request<RunnerPublic | null>(`/runner/${id}`);
}

/* ── Registrations ── */
export function getRegistrations(
  eventId: number,
): Promise<RegistrationRunnerPublic[]> {
  return request<RegistrationRunnerPublic[]>(
    `/event/${eventId}/registrations`,
  );
}

export function addRunnerAndRegistration(
  eventId: number,
  data: RegistrationRunnerCreate,
): Promise<RegistrationRunnerPublic> {
  return request<RegistrationRunnerPublic>(`/event/${eventId}/runner`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRegistration(
  eventId: number,
  runnerId: number,
  data: RegistrationUpdate,
): Promise<RegistrationPublic> {
  return request<RegistrationPublic>(
    `/event/${eventId}/registration/${runnerId}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export function deleteRegistration(
  eventId: number,
  runnerId: number,
): Promise<void> {
  return request<void>(`/event/${eventId}/registration/${runnerId}`, {
    method: 'DELETE',
  });
}

/* ── Timing ── */
export function addTiming(
  eventId: number,
  data: TimingCreate,
): Promise<TimingPublic> {
  return request<TimingPublic>(`/event/${eventId}/timing`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function addLapTiming(
  eventId: number,
  data: LapTimingCreate,
): Promise<void> {
  return request<void>(`/event/${eventId}/lap_timing`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ── Live Data ── */
export function getLiveData(eventId: number): Promise<LiveTimingRow[]> {
  return request<LiveTimingRow[]>(`/event/${eventId}/live_data`);
}

/* ── Tag Info ── */
export function getTagInfo(): Promise<TagInfoPublic | null> {
  return request<TagInfoPublic | null>('/tag-info');
}

export function addTagInfo(data: TagInfoUpdate): Promise<TagInfoPublic> {
  return request<TagInfoPublic>('/tag-info', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/* ── Scanner ── */
export function getScannerStatus(): Promise<ScannerStatus> {
  return request<ScannerStatus>('/scanner/status');
}
