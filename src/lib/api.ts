import { invoke, isTauri } from '@tauri-apps/api/core';
import type {
  AssessmentAttemptDetail,
  AssessmentResultRecord,
  Assignment,
  CatalogCourse,
  CourseAssessment,
  CourseAssessmentQuestion,
  JoinClassResult,
  LearningCourse,
  LessonProgressSnapshot,
  Question,
  StudentClass,
  Submission,
  User,
} from '../types';

export type { CourseAssessment, CourseAssessmentQuestion } from '../types';

const API_URL_KEY = 'lp_backend_url';
const USER_KEY = 'lp_user';
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let apiBaseUrl = localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
let authToken = '';
let refreshToken = '';
let credentialsLoaded: Promise<void> | null = null;
let sessionRefresh: Promise<StoredAuth> | null = null;

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
}

async function loadSecureCredentials(): Promise<void> {
  if (!credentialsLoaded) {
    credentialsLoaded = (async () => {
      if (!isTauri()) return;
      const raw = await invoke<string | null>('load_auth_session');
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredAuth;
      authToken = stored.accessToken;
      refreshToken = stored.refreshToken;
    })().catch((error: unknown) => {
      credentialsLoaded = null;
      throw error;
    });
  }
  await credentialsLoaded;
}

async function storeSecureCredentials(): Promise<void> {
  if (!isTauri()) return;
  const session: StoredAuth = { accessToken: authToken, refreshToken };
  try {
    await invoke('store_auth_session', { session: JSON.stringify(session) });
  } catch {
    // macOS/Linux: no OS credential store wired up yet. Keep the session in memory only,
    // so sign-in still works; the student signs in again after restarting the app.
  }
}

async function renewSession(): Promise<void> {
  if (!refreshToken) throw new Error('Your session expired. Please sign in again.');
  if (!sessionRefresh) {
    sessionRefresh = fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Your session expired. Please sign in again.');
        return (await response.json()) as StoredAuth;
      })
      .finally(() => {
        sessionRefresh = null;
      });
  }
  const tokens = await sessionRefresh;
  authToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await storeSecureCredentials();
}

async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  await loadSecureCredentials();
  const hasJsonBody =
    init.body !== undefined && init.body !== null && !(init.body instanceof FormData);
  const headers = new Headers(init.headers);
  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  let response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status === 401 && allowRefresh && refreshToken && path !== '/api/auth/refresh') {
    try {
      await renewSession();
      const retryHeaders = new Headers(init.headers);
      if (hasJsonBody && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      retryHeaders.set('Authorization', `Bearer ${authToken}`);
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      });
    } catch {
      await clearAuthTokens();
      window.dispatchEvent(new Event('lp-auth-expired'));
      throw new Error('Your session expired. Please sign in again.');
    }
  }
  if (response.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/refresh') {
    await clearAuthTokens();
    window.dispatchEvent(new Event('lp-auth-expired'));
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || payload.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url.replace(/\/+$/, '');
  localStorage.setItem(API_URL_KEY, apiBaseUrl);
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export async function clearAuthTokens(): Promise<void> {
  authToken = '';
  refreshToken = '';
  credentialsLoaded = Promise.resolve();
  localStorage.removeItem(USER_KEY);
  if (isTauri()) await invoke('delete_auth_session');
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; accessToken: string }> {
  const result = await request<{ user: User; accessToken: string; refreshToken: string }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
  authToken = result.accessToken;
  refreshToken = result.refreshToken;
  await storeSecureCredentials();
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result;
}

export async function getStoredUser(): Promise<User | null> {
  await loadSecureCredentials();
  if (!authToken) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function normalizeQuestion(raw: any): Question {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    questionType: raw.questionType ?? 'PROGRAMMING',
    difficulty: raw.difficulty,
    topic: raw.topic,
    courseModuleId: raw.courseModuleId ?? null,
    sourcePage: raw.sourcePage ?? null,
    sourceReference: raw.sourceReference ?? null,
    estimatedMinutes: raw.estimatedMinutes ?? null,
    options: Array.isArray(raw.options) ? raw.options : [],
    points: raw.marks ?? raw.points ?? 0,
    starterTemplates: raw.starterTemplates ?? {},
    testCases: raw.testCases ?? [],
  };
}

function normalizeSubmission(raw: any): Submission {
  return {
    id: raw.id,
    assignmentId: raw.assignmentId,
    questionId: raw.questionId,
    studentId: raw.studentId,
    language: raw.language ?? 'PYTHON',
    sourceCode: raw.code ?? raw.sourceCode ?? '',
    textResponse: raw.textResponse ?? null,
    responseData: raw.responseData ?? null,
    attachmentName: raw.attachmentName ?? null,
    attachmentMime: raw.attachmentMime ?? null,
    attachmentSizeBytes: raw.attachmentSizeBytes ?? null,
    status: raw.status,
    score: raw.score ?? null,
    teacherFeedback: raw.teacherFeedback ?? null,
    feedbackReleasedAt: raw.feedbackReleasedAt ?? null,
    createdAt: raw.submittedAt ?? raw.createdAt ?? new Date().toISOString(),
    results: raw.results ?? [],
  };
}

function normalizeAssignment(raw: any): Assignment {
  return {
    id: raw.id,
    organizationId: raw.organizationId,
    sectionId: raw.sectionId,
    sectionName: raw.sectionName,
    className: raw.className,
    title: raw.title,
    description: raw.description ?? null,
    assignmentType: raw.assignmentType ?? 'PROGRAMMING',
    allowFileUpload: Boolean(raw.allowFileUpload),
    attachmentInstructions: raw.attachmentInstructions ?? null,
    maxFileSizeMb: raw.maxFileSizeMb ?? null,
    allowResubmit: raw.allowResubmit ?? true,
    totalMarks: raw.totalMarks ?? null,
    status: raw.status,
    startDate: raw.startDate ?? null,
    dueDate: raw.dueDate ?? null,
    questions: (raw.questions ?? []).filter(Boolean).map(normalizeQuestion),
    mySubmissions: Array.isArray(raw.mySubmissions)
      ? raw.mySubmissions.map((s: any) => normalizeSubmission({ ...s, assignmentId: raw.id }))
      : [],
  };
}

export async function fetchAssignments(): Promise<Assignment[]> {
  const list = await request<{ items?: any[] }>('/api/assignments?page=1&pageSize=100');
  return Promise.all(
    (list.items ?? []).map(async (item) => {
      const detail = await request<any>(`/api/assignments/${encodeURIComponent(item.id)}`);
      return normalizeAssignment(detail);
    }),
  );
}

export function fetchAiReadinessCourse(): Promise<LearningCourse> {
  return request<LearningCourse>('/api/learning/ai-readiness');
}

export async function fetchCoursesCatalog(): Promise<CatalogCourse[]> {
  const result = await request<{ items?: CatalogCourse[] }>('/api/learning/courses');
  return Array.isArray(result.items) ? result.items : [];
}

export async function fetchStudentClasses(): Promise<StudentClass[]> {
  const result = await request<{ items?: StudentClass[] }>('/api/learning/classes');
  return Array.isArray(result.items) ? result.items : [];
}

export function joinClassByCode(code: string): Promise<JoinClassResult> {
  return request<JoinClassResult>('/api/learning/classes/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function fetchLessonProgress(
  courseId = 'crs-ai-readiness-001',
): Promise<LessonProgressSnapshot> {
  return request<LessonProgressSnapshot>(
    `/api/learning/lesson-progress?courseId=${encodeURIComponent(courseId)}`,
  );
}

export function fetchAssessmentAttempt(attemptId: string): Promise<AssessmentAttemptDetail> {
  return request<AssessmentAttemptDetail>(
    `/api/learning/attempts/${encodeURIComponent(attemptId)}`,
  );
}

export async function fetchStudentResults(): Promise<AssessmentResultRecord[]> {
  const result = await request<{ items?: AssessmentResultRecord[] }>('/api/learning/results');
  return Array.isArray(result.items) ? result.items : [];
}

export async function fetchCourseAssessments(): Promise<CourseAssessment[]> {
  const result = await request<unknown>('/api/learning/assessments');
  if (!Array.isArray(result))
    throw new Error('Assessment service returned an unexpected response.');
  return result as CourseAssessment[];
}

export function startCourseAssessment(assignmentId: string): Promise<{
  attemptId: string;
  status?: string;
  questions?: CourseAssessmentQuestion[];
  savedAnswers?: Record<string, unknown>;
}> {
  return request<{
    attemptId: string;
    status?: string;
    questions?: CourseAssessmentQuestion[];
    savedAnswers?: Record<string, unknown>;
  }>(`/api/learning/assessments/${encodeURIComponent(assignmentId)}/attempts`, {
    method: 'POST',
  });
}

export function saveCourseAssessmentAnswer(
  attemptId: string,
  questionId: string,
  response: unknown,
) {
  return request<{ saved: boolean; gradingStatus: string }>(
    `/api/learning/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(questionId)}`,
    { method: 'PUT', body: JSON.stringify({ response }) },
  );
}

export function submitCourseAssessment(attemptId: string, answers?: Record<string, unknown>) {
  const hasAnswers = Boolean(answers && Object.keys(answers).length > 0);
  return request<{
    status: string;
    score: number | null;
    totalMarks: number;
    passed?: boolean | null;
  }>(
    `/api/learning/attempts/${encodeURIComponent(attemptId)}/submit`,
    hasAnswers ? { method: 'POST', body: JSON.stringify({ answers }) } : { method: 'POST' },
  );
}

export function completeCourseLesson(moduleId: string, lessonIndex: number) {
  return request<{ completed: boolean; lessonTitle: string }>('/api/learning/progress/lessons', {
    method: 'POST',
    body: JSON.stringify({ moduleId, lessonIndex }),
  });
}

export interface CourseProgress {
  lessonsCompleted: number;
  attempts: number;
  pendingReview: number;
  graded: number;
  earnedMarks: number;
}

export function fetchCourseProgress(): Promise<CourseProgress> {
  return request<CourseProgress>('/api/learning/progress');
}

export async function fetchQuestion(questionId: string): Promise<Question> {
  const raw = await request<any>(`/api/questions/${encodeURIComponent(questionId)}`);
  return normalizeQuestion(raw);
}

export async function authorizeAttachmentUpload(payload: {
  assignmentId: string;
  fileName: string;
  contentType?: string;
  sizeBytes?: number;
}): Promise<{
  objectKey: string;
  uploadUrl: string;
  headers?: Record<string, string>;
}> {
  return request('/api/submissions/attachment-upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitAssignmentResponse(payload: {
  assignmentId: string;
  questionId: string;
  code?: string;
  language?: 'PYTHON' | 'JAVA' | 'CPP';
  textResponse?: string;
  responseData?: Record<string, unknown>;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMime?: string;
  attachmentSizeBytes?: number;
}): Promise<Submission> {
  const raw = await request<any>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeSubmission({ ...raw, code: payload.code ?? raw.code ?? '' });
}

export async function submitSolution(payload: {
  assignmentId: string;
  questionId: string;
  language: 'PYTHON' | 'JAVA' | 'CPP';
  sourceCode: string;
}): Promise<Submission> {
  const raw = await request<any>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify({
      assignmentId: payload.assignmentId,
      questionId: payload.questionId,
      language: payload.language,
      code: payload.sourceCode,
    }),
  });
  return normalizeSubmission({ ...raw, code: payload.sourceCode });
}

export async function fetchSubmissionsForAssignment(assignmentId: string): Promise<Submission[]> {
  const result = await request<{ items?: any[] }>(
    `/api/submissions?assignmentId=${encodeURIComponent(assignmentId)}`,
  );
  return (result.items ?? []).map(normalizeSubmission);
}

export async function refreshAccessToken(): Promise<void> {
  await loadSecureCredentials();
  if (!refreshToken) throw new Error('No refresh token available');
  const result = await request<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  authToken = result.accessToken;
  refreshToken = result.refreshToken;
  await storeSecureCredentials();
}
