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

export interface QuestionOption {
  id: string;
  optionText: string;
  orderNum?: number;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  questionType?: string;
  difficulty?: string;
  topic?: string;
  courseModuleId?: string | null;
  sourcePage?: number | null;
  sourceReference?: string | null;
  estimatedMinutes?: number | null;
  options?: QuestionOption[];
  starterTemplates?: Record<string, string>;
  points: number;
  testCases?: TestCase[];
}

export interface Assignment {
  id: string;
  organizationId: string;
  sectionId: string;
  sectionName?: string;
  className?: string;
  title: string;
  description: string | null;
  assignmentType?: string;
  allowFileUpload?: boolean;
  attachmentInstructions?: string | null;
  maxFileSizeMb?: number | null;
  allowResubmit?: boolean;
  totalMarks?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
  startDate: string | null;
  dueDate: string | null;
  questions?: Question[];
  mySubmissions?: Submission[];
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
  studentId?: string;
  language: 'PYTHON' | 'JAVA' | 'CPP' | string;
  sourceCode: string;
  textResponse?: string | null;
  responseData?: Record<string, unknown> | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  attachmentSizeBytes?: number | null;
  status: 'PENDING' | 'PENDING_REVIEW' | 'EVALUATING' | 'COMPLETED' | 'GRADED' | 'FAILED';
  score?: number | null;
  teacherFeedback?: string | null;
  feedbackReleasedAt?: string | null;
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

export interface LearningLesson {
  id?: string;
  title: string;
  sourcePages?: string;
  estimatedMinutes?: number;
  learningOutcomes?: string[];
  content: string;
  examples?: string[];
  activity: string;
  keyTakeaways?: string[];
  supplementalNote?: { label: string; content: string } | null;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  attribution: string;
  sourceTitle: string;
  recommendedHours?: number;
  estimatedMinutes?: number;
  modules: Array<{
    id: string;
    moduleNumber?: number;
    title: string;
    sourcePages: string;
    estimatedMinutes?: number;
    assessmentId?: string | null;
    introduction: string;
    objectives: string[];
    concepts: string[];
    lessons: LearningLesson[];
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
  estimatedMinutes?: number | null;
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
  assignmentId?: string | null;
  assessmentId: string;
  moduleId: string;
  scope?: 'PLATFORM' | 'SECTION';
  title: string;
  instructions: string;
  totalMarks: number;
  passingMarks: number | null;
  durationMinutes: number | null;
  attemptLimit?: number;
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
  assignmentId: string | null;
  assessmentId: string;
  assessmentKey?: string;
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
  assignmentId: string | null;
  assessmentKey?: string;
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
