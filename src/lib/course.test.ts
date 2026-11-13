import { beforeEach, describe, expect, it } from 'vitest';
import { CompletionContext } from '@codemirror/autocomplete';
import { EditorState } from '@codemirror/state';
import { aiExplorersCourse, PASS_MARK } from '../content/ai-explorers';
import { getCourseProgress, isLessonUnlocked, saveLessonScore } from './course-progress';
import { pythonCompletions } from './python-completions';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

describe('AI Explorers course content', () => {
  it('has lessons with cards, an activity and a 4-question MCQ quiz with valid answers', () => {
    expect(aiExplorersCourse.lessons.length).toBeGreaterThanOrEqual(6);
    const ids = new Set<string>();
    for (const lesson of aiExplorersCourse.lessons) {
      expect(ids.has(lesson.id)).toBe(false);
      ids.add(lesson.id);
      expect(lesson.cards.length).toBeGreaterThan(0);
      expect(lesson.activity.items.length).toBeGreaterThan(0);
      expect(lesson.quiz).toHaveLength(4);
      for (const q of lesson.quiz) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    }
  });

  it('covers the core topics: what is AI, LLM, how AI works', () => {
    const titles = aiExplorersCourse.lessons.map((l) => l.title.toLowerCase()).join(' ');
    expect(titles).toContain('what is ai');
    expect(titles).toContain('llm');
    expect(titles).toContain('how ai works');
  });
});

describe('course progress', () => {
  const lessons = aiExplorersCourse.lessons;

  it('unlocks the next lesson only after passing', () => {
    expect(isLessonUnlocked(0, lessons, {})).toBe(true);
    expect(isLessonUnlocked(1, lessons, {})).toBe(false);
    saveLessonScore(lessons[0]!.id, PASS_MARK - 1);
    expect(isLessonUnlocked(1, lessons, getCourseProgress())).toBe(false);
    saveLessonScore(lessons[0]!.id, PASS_MARK);
    expect(isLessonUnlocked(1, lessons, getCourseProgress())).toBe(true);
  });

  it('keeps the best score', () => {
    saveLessonScore('x', 4);
    expect(saveLessonScore('x', 1).x).toBe(4);
  });
});

describe('python completions', () => {
  const complete = (doc: string) =>
    pythonCompletions(new CompletionContext(EditorState.create({ doc }), doc.length, false));

  it('suggests builtins and snippets while typing', () => {
    const labels = complete('pri')?.options.map((o) => o.label) ?? [];
    expect(labels).toContain('print');
    expect(labels).toContain('def');
  });

  it('suggests module members after a dot', () => {
    const result = complete('math.sq');
    expect(result?.options.map((o) => o.label)).toContain('sqrt');
    expect(result?.from).toBe(5);
  });
});

describe('course modules', () => {
  it('include every lesson exactly once, in course order', async () => {
    const { aiExplorersModules } = await import('../content/ai-explorers');
    const ids = aiExplorersModules.flatMap((m) => m.lessonIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(aiExplorersCourse.lessons.map((l) => l.id).sort());
  });
});
