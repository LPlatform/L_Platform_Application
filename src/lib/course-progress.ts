import { PASS_MARK, type Lesson } from '../content/ai-explorers';

const KEY = 'lp.aiExplorers.scores';

export type ScoreMap = Record<string, number>;

export function getCourseProgress(): ScoreMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScoreMap) : {};
  } catch {
    return {};
  }
}

/** Keeps the best score per lesson. */
export function saveLessonScore(lessonId: string, score: number): ScoreMap {
  const current = getCourseProgress();
  const next = { ...current, [lessonId]: Math.max(score, current[lessonId] ?? 0) };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory only */
  }
  return next;
}

/** A lesson unlocks when the previous lesson's quiz was passed. */
export function isLessonUnlocked(index: number, lessons: Lesson[], scores: ScoreMap): boolean {
  if (index === 0) return true;
  const prev = lessons[index - 1];
  return prev ? (scores[prev.id] ?? 0) >= PASS_MARK : false;
}
