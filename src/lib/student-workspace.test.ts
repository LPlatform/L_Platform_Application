import { describe, expect, it } from 'vitest';
import type { LearningCourse } from '../types';
import {
  getAdjacentLesson,
  getCourseCompletionPercent,
  getQuestionInputKind,
} from './student-workspace';

const sampleCourse: LearningCourse = {
  id: 'course',
  title: 'AI Readiness Course',
  description: '',
  attribution: '',
  sourceTitle: '',
  modules: [
    {
      id: 'm1',
      title: 'Module 1',
      sourcePages: '1-2',
      introduction: '',
      objectives: [],
      concepts: [],
      lessons: [
        { title: 'One', content: '', activity: '' },
        { title: 'Two', content: '', activity: '' },
      ],
      revisionNotes: [],
      practice: [],
    },
    {
      id: 'm2',
      title: 'Module 2',
      sourcePages: '3-4',
      introduction: '',
      objectives: [],
      concepts: [],
      lessons: [{ title: 'Three', content: '', activity: '' }],
      revisionNotes: [],
      practice: [],
    },
  ],
};

describe('student workspace view logic', () => {
  it('moves between lessons and across module boundaries', () => {
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 0, lessonIndex: 0 }, 1)).toEqual({
      moduleIndex: 0,
      lessonIndex: 1,
    });
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 0, lessonIndex: 1 }, 1)).toEqual({
      moduleIndex: 1,
      lessonIndex: 0,
    });
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 0, lessonIndex: 0 }, -1)).toBeNull();
    expect(getAdjacentLesson(sampleCourse, { moduleIndex: 1, lessonIndex: 0 }, 1)).toBeNull();
  });

  it('clamps actual lesson completion to a valid percentage', () => {
    expect(getCourseCompletionPercent(3, 10)).toBe(30);
    expect(getCourseCompletionPercent(12, 10)).toBe(100);
    expect(getCourseCompletionPercent(-1, 10)).toBe(0);
    expect(getCourseCompletionPercent(0, 0)).toBe(0);
  });

  it('maps supported backend question kinds to the appropriate answer control', () => {
    expect(getQuestionInputKind('MCQ')).toBe('single');
    expect(getQuestionInputKind('TRUE_FALSE')).toBe('single');
    expect(getQuestionInputKind('MULTI_SELECT')).toBe('multiple');
    expect(getQuestionInputKind('FILL_BLANK')).toBe('text');
    expect(getQuestionInputKind('PRACTICAL')).toBe('text');
  });
});
