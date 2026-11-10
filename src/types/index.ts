export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'TEACHER' | 'ORGANIZATION_ADMIN' | 'PLATFORM_ADMIN';
  organizationId: string | null;
}

export interface TestCase {
  id: string;
  questionId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  starterTemplates?: Record<string, string>;
  points: number;
  testCases?: TestCase[];
}

export interface Assignment {
  id: string;
  organizationId: string;
  sectionId: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  startDate: string | null;
  dueDate: string | null;
  questions?: Question[];
}

export interface SubmissionResult {
  id: string;
  submissionId: string;
  testCaseId: string;
  passed: boolean;
  actualOutput?: string | null;
  executionTimeMs?: number | null;
  memoryKb?: number | null;
  errorMessage?: string | null;
}

export interface Submission {
  id: string;
  assignmentId: string;
  questionId: string;
  studentId: string;
  language: 'PYTHON' | 'JAVA' | 'CPP';
  sourceCode: string;
  status: 'PENDING' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  score?: number | null;
  createdAt: string;
  results?: SubmissionResult[];
}

export interface Draft {
  assignmentId: string;
  questionId: string;
  language: 'PYTHON' | 'JAVA' | 'CPP';
  code: string;
  updatedAt: number;
  synced: boolean;
}

