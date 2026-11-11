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

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  attribution: string;
  sourceTitle: string;
  modules: Array<{
    id: string;
    title: string;
    sourcePages: string;
    introduction: string;
    objectives: string[];
    concepts: string[];
    lessons: Array<{ title: string; content: string; activity: string }>;
    revisionNotes: string[];
    practice: string[];
  }>;
}

export interface CatalogCourse {
  id: string;
  title: string;
  category: string;
  description: string;
  language: string;
  difficulty: string;
  status: string;
  version: number;
  isPlatformCourse: boolean;
  scopeType: 'PLATFORM_FREE' | 'SCHOOL';
  accessEnabled: boolean;
  hasInteractiveReader: boolean;
}

export interface ClassTeacherSummary {
  id: string;
  name: string;
  email: string;
  teacherRole: 'PRIMARY' | 'CO_TEACHER';
}

export interface StudentClass {
  id: string;
  joinCode: string;
  sectionName: string;
  classId: string;
  className: string;
  grade: string | null;
  academicYear: string | null;
  organizationName: string;
  maxStudents: number | null;
  studentCount: number;
  teachers: ClassTeacherSummary[];
  courses: Array<{ id: string; title: string; language: string }>;
}

export interface JoinClassResult {
  joined: boolean;
  alreadyEnrolled: boolean;
  sectionId: string;
  sectionName: string;
  className: string;
}

export interface LessonProgressSnapshot {
  courseId: string;
  completedLessonIds: string[];
  items: Array<{ lessonId: string; moduleId: string; completedAt: string }>;
}

export interface CourseAssessment {
  id: string;
  assessmentId: string;
  moduleId: string;
  title: string;
  instructions: string;
  totalMarks: number;
  passingMarks: number | null;
  durationMinutes: number | null;
  dueAt: string | null;
}

export interface CourseAssessmentQuestion {
  id: string;
  type: string;
  prompt: string;
  title?: string;
  options: Array<string | { id?: string; text?: string; label?: string }>;
  marks: number;
}

export interface AssessmentAttemptDetail {
  attemptId: string;
  assignmentId: string;
  assessmentId: string;
  title: string;
  instructions: string;
  durationMinutes: number | null;
  totalMarks: number;
  passingMarks: number | null;
  status: string;
  questions: CourseAssessmentQuestion[];
  savedAnswers: Record<string, unknown>;
}

export interface AssessmentResultBreakdownItem {
  questionId: string;
  prompt: string;
  type: string;
  maxMarks: number;
  marksAwarded: number | null;
  feedback: string;
  status: string;
  studentResponse: unknown;
}

export interface AssessmentResultRecord {
  attemptId: string;
  assessmentId: string;
  assignmentId: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  totalMarks: number;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  releasedAt: string | null;
  feedbackReleased: boolean;
  title: string;
  moduleId: string;
  passingMarks: number | null;
  breakdown: AssessmentResultBreakdownItem[];
}
