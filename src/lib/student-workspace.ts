import type { LearningCourse } from '../types';

export interface LessonPosition {
  moduleIndex: number;
  lessonIndex: number;
}

export function getAdjacentLesson(
  course: LearningCourse,
  current: LessonPosition,
  direction: -1 | 1,
): LessonPosition | null {
  const ordered = course.modules.flatMap((module, moduleIndex) =>
    module.lessons.map((_, lessonIndex) => ({ moduleIndex, lessonIndex })),
  );
  const index = ordered.findIndex(
    (item) => item.moduleIndex === current.moduleIndex && item.lessonIndex === current.lessonIndex,
  );
  if (index < 0) return ordered[0] ?? null;
  return ordered[index + direction] ?? null;
}

export function getCourseCompletionPercent(completed: number, total: number): number {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

export type QuestionInputKind = 'single' | 'multiple' | 'text';

export function getQuestionInputKind(type: string): QuestionInputKind {
  const normalized = type.toUpperCase();
  if (normalized.includes('MULTI')) return 'multiple';
  if (
    normalized.includes('MCQ') ||
    normalized.includes('CHOICE') ||
    normalized.includes('TRUE_FALSE') ||
    normalized === 'TF'
  )
    return 'single';
  return 'text';
}
