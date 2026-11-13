import type { Assignment, Question } from '../types';

export interface Challenge {
  assignment: Assignment;
  question: Question;
  kind: 'code' | 'mcq' | 'written';
  difficulty: string | null;
  status: 'todo' | 'attempted' | 'solved';
  score: number | null;
}

export interface ChallengeFilters {
  query: string;
  status: 'all' | Challenge['status'];
  kinds: string[];
  difficulties: string[];
  assignmentId: string;
}

export function kindOf(question: Question): Challenge['kind'] {
  const t = (question.questionType ?? 'PROGRAMMING').toUpperCase();
  if (['PROGRAMMING', 'CODE', 'CODING'].includes(t)) return 'code';
  if (t.includes('MCQ') || t.includes('MULTI') || t === 'TRUE_FALSE') return 'mcq';
  return 'written';
}

/** Flattens assignments into one challenge per question, with solve status. */
export function buildChallenges(
  assignments: Assignment[],
  hasDraft: (assignmentId: string, questionId: string) => boolean,
): Challenge[] {
  return assignments.flatMap((assignment) =>
    (assignment.questions ?? []).map((question) => {
      const sub = (assignment.mySubmissions ?? []).find((s) => s.questionId === question.id);
      const score = sub?.feedbackReleasedAt && sub.score != null ? sub.score : null;
      const status: Challenge['status'] = sub
        ? 'solved'
        : hasDraft(assignment.id, question.id)
          ? 'attempted'
          : 'todo';
      return {
        assignment,
        question,
        kind: kindOf(question),
        difficulty: question.difficulty ? question.difficulty.toLowerCase() : null,
        status,
        score,
      };
    }),
  );
}

export function filterChallenges(list: Challenge[], f: ChallengeFilters): Challenge[] {
  const q = f.query.trim().toLowerCase();
  return list.filter(
    (c) =>
      (f.status === 'all' || c.status === f.status) &&
      (f.kinds.length === 0 || f.kinds.includes(c.kind)) &&
      (f.difficulties.length === 0 ||
        (c.difficulty != null && f.difficulties.includes(c.difficulty))) &&
      (f.assignmentId === 'all' || c.assignment.id === f.assignmentId) &&
      (!q ||
        c.question.title.toLowerCase().includes(q) ||
        c.assignment.title.toLowerCase().includes(q) ||
        (c.question.topic ?? '').toLowerCase().includes(q)),
  );
}
