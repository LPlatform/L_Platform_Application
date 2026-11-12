import { describe, expect, it } from 'vitest';
import {
  getAdjacentLesson,
  getCourseCompletionPercent,
  getQuestionInputKind,
} from './student-workspace';
import type { LearningCourse } from '../types';

const sampleCourse: LearningCourse = {
  id: 'crs-ai-readiness-001',
  title: 'AI Readiness Course',
  description: 'Curriculum',
  attribution: 'CBSE',
  sourceTitle: 'Handbook',
  modules: [
    {
      id: 'm1',
      title: 'Module 1',
      sourcePages: '1-10',
      introduction: '',
      objectives: [],
      concepts: [],
      lessons: [
        { title: 'L1', content: 'C1', activity: 'A1' },
        { title: 'L2', content: 'C2', activity: 'A2' },
      ],
      revisionNotes: [],
      practice: [],
    },
    {
      id: 'm2',
      title: 'Module 2',
      sourcePages: '11-20',
      introduction: '',
      objectives: [],
      concepts: [],
      lessons: [{ title: 'L3', content: 'C3', activity: 'A3' }],
      revisionNotes: [],
      practice: [],
    },
  ],
};

describe('student-workspace helpers', () => {
  it('computes lesson adjacency across module boundaries and edges', () => {
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 0, lessonIndex: 0 }, -1)).toBeNull();
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 0, lessonIndex: 1 }, 1)).toEqual({
      moduleIndex: 1,
      lessonIndex: 0,
    });
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 1, lessonIndex: 0 }, -1)).toEqual({
      moduleIndex: 0,
      lessonIndex: 1,
    });
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 1, lessonIndex: 0 }, 1)).toBeNull();
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 9, lessonIndex: 9 }, 1)).toEqual({
      moduleIndex: 0,
      lessonIndex: 0,
    });
  });

  it('clamps course completion percentage safely for zero and out-of-range totals', () => {
    expect(getCourseCompletionPercent(0, 0)).toBe(0);
    expect(getCourseCompletionPercent(-3, 10)).toBe(0);
    expect(getCourseCompletionPercent(3, 8)).toBe(38);
    expect(getCourseCompletionPercent(15, 10)).toBe(100);
  });

  it('classifies question input kinds across all supported question types', () => {
    expect(getQuestionInputKind('SINGLE_MCQ')).toBe('single');
    expect(getQuestionInputKind('TRUE_FALSE')).toBe('single');
    expect(getQuestionInputKind('MULTI_SELECT')).toBe('multiple');
    expect(getQuestionInputKind('FILL_BLANK')).toBe('text');
    expect(getQuestionInputKind('SHORT_ANSWER')).toBe('text');
    expect(getQuestionInputKind('LONG_CASE')).toBe('text');
    expect(getQuestionInputKind('PRACTICAL')).toBe('text');
  });
});
