import type { Draft } from '../types';

const DRAFTS_KEY_PREFIX = 'lp_draft_';
const SYNC_QUEUE_KEY = 'lp_submission_sync_queue';

export function saveDraft(
  assignmentId: string,
  questionId: string,
  language: 'PYTHON' | 'JAVA' | 'CPP',
  code: string,
  synced = false,
): void {
  const key = `${DRAFTS_KEY_PREFIX}${assignmentId}_${questionId}`;
  const draft: Draft = {
    assignmentId,
    questionId,
    language,
    code,
    updatedAt: Date.now(),
    synced,
  };
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Local storage limit or unavailable
  }
}

export function getDraft(assignmentId: string, questionId: string): Draft | null {
  const key = `${DRAFTS_KEY_PREFIX}${assignmentId}_${questionId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function clearDraft(assignmentId: string, questionId: string): void {
  const key = `${DRAFTS_KEY_PREFIX}${assignmentId}_${questionId}`;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore error
  }
}

export interface QueuedSubmission {
  id: string;
  assignmentId: string;
  questionId: string;
  language: 'PYTHON' | 'JAVA' | 'CPP';
  sourceCode: string;
  queuedAt: number;
}

export function queueOfflineSubmission(sub: Omit<QueuedSubmission, 'id' | 'queuedAt'>): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue: QueuedSubmission[] = raw ? JSON.parse(raw) : [];
    queue.push({
      ...sub,
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queuedAt: Date.now(),
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export function getQueuedSubmissions(): QueuedSubmission[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearQueuedSubmission(id: string): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return;
    const queue: QueuedSubmission[] = JSON.parse(raw);
    const updated = queue.filter((item) => item.id !== id);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
