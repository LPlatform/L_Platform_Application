import { describe, expect, it } from 'vitest';
import type { Assignment } from '../types';
import { buildChallenges, filterChallenges, kindOf, type ChallengeFilters } from './challenges';

const asg = (
  id: string,
  questions: Assignment['questions'],
  subs: Assignment['mySubmissions'] = [],
): Assignment => ({
  id,
  organizationId: 'o',
  sectionId: 's',
  title: `Assignment ${id}`,
  description: null,
  status: 'PUBLISHED',
  startDate: null,
  dueDate: null,
  questions,
  mySubmissions: subs,
});

const base: ChallengeFilters = {
  query: '',
  status: 'all',
  kinds: [],
  difficulties: [],
  assignmentId: 'all',
};

describe('challenges', () => {
  const list = buildChallenges(
    [
      asg(
        'a1',
        [
          {
            id: 'q1',
            title: 'Sum of Two',
            description: '',
            points: 10,
            questionType: 'PROGRAMMING',
            difficulty: 'EASY',
          },
          {
            id: 'q2',
            title: 'What is AI',
            description: '',
            points: 5,
            questionType: 'SINGLE_MCQ',
            difficulty: 'MEDIUM',
          },
        ],
        [
          {
            id: 's1',
            assignmentId: 'a1',
            questionId: 'q2',
            language: 'PYTHON',
            sourceCode: '',
            status: 'GRADED',
            score: 5,
            feedbackReleasedAt: '2026-01-01',
            createdAt: '',
          },
        ],
      ),
      asg('a2', [
        {
          id: 'q3',
          title: 'Explain data',
          description: '',
          points: 8,
          questionType: 'SHORT_ANSWER',
        },
      ]),
    ],
    (_a, q) => q === 'q1',
  );

  it('derives kind and status', () => {
    expect(kindOf({ id: 'x', title: '', description: '', points: 1, questionType: 'CODING' })).toBe(
      'code',
    );
    expect(list.map((c) => [c.question.id, c.kind, c.status, c.score])).toEqual([
      ['q1', 'code', 'attempted', null],
      ['q2', 'mcq', 'solved', 5],
      ['q3', 'written', 'todo', null],
    ]);
  });

  it('filters by status, kind, difficulty, assignment and search', () => {
    expect(filterChallenges(list, { ...base, status: 'solved' }).map((c) => c.question.id)).toEqual(
      ['q2'],
    );
    expect(filterChallenges(list, { ...base, kinds: ['code', 'written'] })).toHaveLength(2);
    expect(
      filterChallenges(list, { ...base, difficulties: ['easy'] }).map((c) => c.question.id),
    ).toEqual(['q1']);
    expect(filterChallenges(list, { ...base, assignmentId: 'a2' })).toHaveLength(1);
    expect(filterChallenges(list, { ...base, query: 'sum' }).map((c) => c.question.id)).toEqual([
      'q1',
    ]);
  });
});
