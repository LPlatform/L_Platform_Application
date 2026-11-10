import type { User, Assignment, Question, Submission } from '../types';

let apiBaseUrl = localStorage.getItem('lp_backend_url') || 'http://localhost:3001';
let authToken = localStorage.getItem('lp_auth_token') || '';
let refreshToken = localStorage.getItem('lp_refresh_token') || '';

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url.replace(/\/+$/, '');
  localStorage.setItem('lp_backend_url', apiBaseUrl);
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setAuthTokens(access: string, refresh: string): void {
  authToken = access;
  refreshToken = refresh;
  localStorage.setItem('lp_auth_token', access);
  localStorage.setItem('lp_refresh_token', refresh);
}

export function clearAuthTokens(): void {
  authToken = '';
  refreshToken = '';
  localStorage.removeItem('lp_auth_token');
  localStorage.removeItem('lp_refresh_token');
  localStorage.removeItem('lp_user');
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; accessToken: string }> {
  const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Login failed with status ${res.status}`);
  }

  const data = await res.json();
  setAuthTokens(data.accessToken, data.refreshToken);
  localStorage.setItem('lp_user', JSON.stringify(data.user));
  return data;
}

export async function getStoredUser(): Promise<User | null> {
  const raw = localStorage.getItem('lp_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${apiBaseUrl}/api/assignments`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      await refreshAccessToken();
      return fetchAssignments();
    }
    throw new Error(`Failed to fetch assignments: ${res.statusText}`);
  }

  const data = await res.json();
  return data.assignments || [];
}

export async function fetchQuestion(questionId: string): Promise<Question> {
  const res = await fetch(`${apiBaseUrl}/api/questions/${questionId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch question: ${res.statusText}`);
  }

  const data = await res.json();
  return data.question;
}

export async function submitSolution(payload: {
  assignmentId: string;
  questionId: string;
  language: 'PYTHON' | 'JAVA' | 'CPP';
  sourceCode: string;
}): Promise<Submission> {
  const res = await fetch(`${apiBaseUrl}/api/submissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      await refreshAccessToken();
      return submitSolution(payload);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Submission failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.submission;
}

export async function fetchSubmissionsForAssignment(assignmentId: string): Promise<Submission[]> {
  const res = await fetch(`${apiBaseUrl}/api/submissions?assignmentId=${assignmentId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.submissions || [];
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) throw new Error('No refresh token available');
  const res = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearAuthTokens();
    throw new Error('Session expired');
  }

  const data = await res.json();
  setAuthTokens(data.accessToken, data.refreshToken);
}
