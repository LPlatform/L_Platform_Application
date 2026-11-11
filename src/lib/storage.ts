import type { CatalogCourse, Draft, LearningCourse } from '../types';

const DRAFTS_KEY_PREFIX = 'lp_draft_';
const SYNC_QUEUE_KEY = 'lp_submission_sync_queue';
const CACHE_AI_COURSE_KEY = 'lp_cache_ai_readiness_v1';
const CACHE_CATALOG_KEY = 'lp_cache_courses_catalog_v1';
const CACHE_COMPLETED_LESSONS_KEY = 'lp_cache_completed_lessons_v1';
const LAST_LESSON_KEY = 'lp_last_lesson_cursor_v1';

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

export function countSavedDrafts(): number {
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(DRAFTS_KEY_PREFIX)) count += 1;
    }
    return count;
  } catch {
    return 0;
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

export function cacheAiReadinessCourse(course: LearningCourse): void {
  try {
    localStorage.setItem(CACHE_AI_COURSE_KEY, JSON.stringify(course));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedAiReadinessCourse(): LearningCourse | null {
  try {
    const raw = localStorage.getItem(CACHE_AI_COURSE_KEY);
    return raw ? (JSON.parse(raw) as LearningCourse) : null;
  } catch {
    return null;
  }
}

export function cacheCoursesCatalog(items: CatalogCourse[]): void {
  try {
    localStorage.setItem(CACHE_CATALOG_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedCoursesCatalog(): CatalogCourse[] {
  try {
    const raw = localStorage.getItem(CACHE_CATALOG_KEY);
    return raw ? (JSON.parse(raw) as CatalogCourse[]) : [];
  } catch {
    return [];
  }
}

export function cacheCompletedLessons(ids: string[]): void {
  try {
    localStorage.setItem(CACHE_COMPLETED_LESSONS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore quota errors
  }
}

export function getCachedCompletedLessons(): string[] {
  try {
    const raw = localStorage.getItem(CACHE_COMPLETED_LESSONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setLastOpenedLesson(moduleIndex: number, lessonIndex: number): void {
  try {
    localStorage.setItem(LAST_LESSON_KEY, JSON.stringify({ moduleIndex, lessonIndex }));
  } catch {
    // Ignore
  }
}

export function getLastOpenedLesson(): { moduleIndex: number; lessonIndex: number } {
  try {
    const raw = localStorage.getItem(LAST_LESSON_KEY);
    if (!raw) return { moduleIndex: 0, lessonIndex: 0 };
    const parsed = JSON.parse(raw) as { moduleIndex?: number; lessonIndex?: number };
    return {
      moduleIndex: Number.isInteger(parsed.moduleIndex) ? Math.max(0, parsed.moduleIndex!) : 0,
      lessonIndex: Number.isInteger(parsed.lessonIndex) ? Math.max(0, parsed.lessonIndex!) : 0,
    };
  } catch {
    return { moduleIndex: 0, lessonIndex: 0 };
  }
}
