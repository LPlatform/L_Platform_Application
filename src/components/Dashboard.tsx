import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Compass,
  FolderCode,
  Globe,
  Plus,
  RefreshCw,
  School,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  fetchAiReadinessCourse,
  fetchAssignments,
  fetchCourseAssessments,
  fetchCourseProgress,
  fetchCoursesCatalog,
  fetchLessonProgress,
  fetchStudentClasses,
  fetchStudentResults,
  fetchSubmissionsForAssignment,
  type CourseProgress,
} from '../lib/api';
import {
  cacheAiReadinessCourse,
  cacheCompletedLessons,
  cacheCoursesCatalog,
  getCachedAiReadinessCourse,
  getCachedCompletedLessons,
  getCachedCoursesCatalog,
  getDraft,
  getLastOpenedLesson,
} from '../lib/storage';
import { getCourseCompletionPercent } from '../lib/student-workspace';
import type {
  AssessmentResultRecord,
  Assignment,
  CatalogCourse,
  CourseAssessment,
  LearningCourse,
  Question,
  StudentClass,
  Submission,
  User,
} from '../types';
import { AiCourse } from './AiCourse';
import { aiExplorersCourse, PASS_MARK } from '../content/ai-explorers';
import { getCourseProgress } from '../lib/course-progress';
import { JoinClassModal, LearningLibraryView, MyClassesView } from './ClassesAndLibrary';
import { CourseAssessments } from './CourseAssessments';
import { MultiTypeAssignmentWorkspace } from './MultiTypeAssignmentWorkspace';
import { ProgressView, ResultsView, SettingsAndHelpView } from './ResultsAndProgress';

export type StudentSection =
  | 'overview'
  | 'classes'
  | 'learning'
  | 'assessments'
  | 'assignments'
  | 'results'
  | 'progress'
  | 'library'
  | 'settings'
  | 'help';

interface DashboardProps {
  user: User;
  section: StudentSection;
  onNavigate: (section: StudentSection) => void;
  onSelectAssignment: (assignment: Assignment, question: Question) => void;
  isOnline: boolean;
  onSync?: () => Promise<void> | void;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  section,
  onNavigate,
  onSelectAssignment,
  isOnline,
  onSync = () => Promise.resolve(),
}) => {
  const [course, setCourse] = useState<LearningCourse | null>(() => getCachedAiReadinessCourse());
  const [catalog, setCatalog] = useState<CatalogCourse[]>(() => getCachedCoursesCatalog());
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() =>
    getCachedCompletedLessons(),
  );
  const [lessonTimeline, setLessonTimeline] = useState<
    Array<{ lessonId: string; moduleId: string; completedAt: string }>
  >([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
  const [results, setResults] = useState<AssessmentResultRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [focusAssessmentModuleId, setFocusAssessmentModuleId] = useState<string | null>(null);
  const [activeMultiAssignment, setActiveMultiAssignment] = useState<{
    assignment: Assignment;
    questionId?: string;
  } | null>(null);

  const loadWorkspaceData = useCallback(async () => {
    setSyncError('');
    try {
      const [
        courseRes,
        catalogRes,
        classesRes,
        lessonProgRes,
        progressRes,
        assessmentsRes,
        resultsRes,
        assignmentsRes,
      ] = await Promise.all([
        fetchAiReadinessCourse().catch(() => getCachedAiReadinessCourse()),
        fetchCoursesCatalog().catch(() => getCachedCoursesCatalog()),
        fetchStudentClasses().catch(() => [] as StudentClass[]),
        fetchLessonProgress('crs-ai-readiness-001').catch(() => null),
        fetchCourseProgress().catch(() => null),
        fetchCourseAssessments().catch(() => [] as CourseAssessment[]),
        fetchStudentResults().catch(() => [] as AssessmentResultRecord[]),
        fetchAssignments().catch(() => [] as Assignment[]),
      ]);

      if (courseRes) {
        setCourse(courseRes);
        cacheAiReadinessCourse(courseRes);
      }
      if (catalogRes && catalogRes.length > 0) {
        setCatalog(catalogRes);
        cacheCoursesCatalog(catalogRes);
      } else if (catalogRes) {
        setCatalog(catalogRes);
      }
      setClasses(classesRes);
      if (lessonProgRes) {
        setCompletedLessonIds(lessonProgRes.completedLessonIds);
        setLessonTimeline(lessonProgRes.items ?? []);
        cacheCompletedLessons(lessonProgRes.completedLessonIds);
      }
      if (progressRes) setProgress(progressRes);
      setAssessments(assessmentsRes);
      setResults(resultsRes);
      setAssignments(assignmentsRes);

      if (assignmentsRes.length > 0) {
        const allSubs = await Promise.all(
          assignmentsRes
            .slice(0, 12)
            .map((a) => fetchSubmissionsForAssignment(a.id).catch(() => [])),
        );
        setSubmissions(
          allSubs
            .flat()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
      } else {
        setSubmissions([]);
      }
    } catch (err: unknown) {
      setSyncError(
        err instanceof Error ? err.message : 'Unable to refresh workspace data from server.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaceData();
  }, [isOnline, loadWorkspaceData]);

  useEffect(() => {
    if (section !== 'assignments') {
      setActiveMultiAssignment(null);
    }
  }, [section]);

  const lastCursor = getLastOpenedLesson();
  const continueModule = course?.modules[lastCursor.moduleIndex] ?? course?.modules[0];
  const continueLesson =
    continueModule?.lessons[lastCursor.lessonIndex] ?? continueModule?.lessons[0];

  const completedSet = new Set(completedLessonIds);
  const totalLessons = course ? course.modules.reduce((s, m) => s + m.lessons.length, 0) : 0;
  const completedLessonsCount = course
    ? course.modules.reduce(
        (s, m) => s + m.lessons.filter((_, idx) => completedSet.has(`${m.id}:${idx}`)).length,
        0,
      )
    : (progress?.lessonsCompleted ?? 0);
  const completedModulesCount = course
    ? course.modules.filter(
        (m) =>
          m.lessons.length > 0 && m.lessons.every((_, idx) => completedSet.has(`${m.id}:${idx}`)),
      ).length
    : 0;

  const overallPercent =
    totalLessons > 0 ? getCourseCompletionPercent(completedLessonsCount, totalLessons) : 0;
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - overallPercent / 100);

  const upcomingWork = [
    ...assignments.map((a) => ({
      id: `asg-${a.id}`,
      kind: 'assignment' as const,
      typeLabel: a.assignmentType ? a.assignmentType.replaceAll('_', ' ') : 'Assignment',
      title: a.title,
      meta: `${a.questions?.length ?? 0} problem(s)`,
      dueDate: a.dueDate,
      onOpen: () => onNavigate('assignments'),
    })),
    ...assessments.map((ass) => ({
      id: `asm-${ass.id}`,
      kind: 'assessment' as const,
      typeLabel: 'Assessment',
      title: ass.title,
      meta: `${ass.totalMarks} marks`,
      dueDate: ass.dueAt,
      onOpen: () => onNavigate('assessments'),
    })),
  ].slice(0, 4);

  const recentActivity = [
    ...lessonTimeline.slice(0, 3).map((l) => ({
      id: `les-${l.lessonId}-${l.completedAt}`,
      title: `Completed lesson (${l.lessonId.replace(':', ' #')})`,
      time: new Date(l.completedAt).toLocaleString(),
      sortAt: new Date(l.completedAt).getTime(),
      tone: 'success' as const,
    })),
    ...results.slice(0, 3).map((r) => ({
      id: `res-${r.attemptId}`,
      title:
        r.status === 'RELEASED' && r.score !== null
          ? `Released: ${r.title} — ${r.score}/${r.totalMarks}`
          : `Attempt ${r.status.replaceAll('_', ' ')}: ${r.title}`,
      time: new Date(r.submittedAt || r.startedAt).toLocaleString(),
      sortAt: new Date(r.submittedAt || r.startedAt).getTime(),
      tone: 'violet' as const,
    })),
    ...submissions.slice(0, 2).map((s) => ({
      id: `sub-${s.id}`,
      title: `Submitted ${s.language} solution (${s.status})`,
      time: new Date(s.createdAt).toLocaleString(),
      sortAt: new Date(s.createdAt).getTime(),
      tone: 'info' as const,
    })),
  ]
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 4);

  const platformFeaturedCourses = catalog
    .filter((c) => c.scopeType === 'PLATFORM_FREE')
    .slice(0, 3);

  const aiScores = getCourseProgress();
  const aiDone = aiExplorersCourse.lessons.filter((l) => (aiScores[l.id] ?? 0) >= PASS_MARK).length;

  return (
    <div className="workspace-scroll">
      <div className="workspace-container">
        {bannerMsg && (
          <div className="inline-banner success">
            <span>{bannerMsg}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBannerMsg('')}>
              Dismiss
            </button>
          </div>
        )}

        {syncError && (
          <div className="inline-banner warning">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} />
              {syncError}
            </span>
          </div>
        )}

        {section === 'overview' && (
          <>
            {/* Top Greeting Row */}
            <div className="section-header-row">
              <div>
                <span className="eyebrow">Student Dashboard</span>
                <h1>
                  {getTimeGreeting()}, {user.name}
                </h1>
                <p>Continue your learning, complete classwork, and track your progress.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void loadWorkspaceData()}
                >
                  <RefreshCw size={13} />
                  <span>{loading ? 'Refreshing…' : 'Sync Workspace'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!isOnline}
                  onClick={() => setJoinOpen(true)}
                >
                  <Plus size={14} />
                  <span>Join a Class</span>
                </button>
              </div>
            </div>

            <section className="hero-learning-card">
              <span className="eyebrow">AI course</span>
              <h2>{aiExplorersCourse.title}</h2>
              <p className="hero-lesson-meta">
                {aiDone} of {aiExplorersCourse.lessons.length} lessons complete · short lessons, a
                fun activity and a quiz in each
              </p>
              <div className="progress-bar">
                <span style={{ width: `${(aiDone / aiExplorersCourse.lessons.length) * 100}%` }} />
              </div>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate('learning')}
                >
                  {aiDone === 0 ? 'Start the course' : 'Continue learning'}
                </button>
              </div>
            </section>

            {/* 4 Quick Action Cards */}
            <section className="quick-actions-grid" aria-label="Quick Actions">
              <button type="button" className="quick-action-card" onClick={() => setJoinOpen(true)}>
                <div className="quick-action-left">
                  <div className="quick-action-icon violet">
                    <School size={18} />
                  </div>
                  <div>
                    <strong>Join a Class</strong>
                    <span>Enter class code or link</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => onNavigate('library')}
              >
                <div className="quick-action-left">
                  <div className="quick-action-icon blue">
                    <Compass size={18} />
                  </div>
                  <div>
                    <strong>Explore Courses</strong>
                    <span>Platform free &amp; school courses</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => onNavigate('assignments')}
              >
                <div className="quick-action-left">
                  <div className="quick-action-icon emerald">
                    <Code2 size={18} />
                  </div>
                  <div>
                    <strong>My Assignments</strong>
                    <span>{assignments.length} coding assignment(s)</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => onNavigate('assessments')}
              >
                <div className="quick-action-left">
                  <div className="quick-action-icon amber">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <strong>Take an Assessment</strong>
                    <span>{assessments.length} published quiz(zes)</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </button>
            </section>

            {/* 3-Column Overview Panels */}
            <section className="overview-mid-grid">
              {/* My Classes */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <h3>
                    <Users size={16} style={{ color: '#2563eb' }} />
                    <span>My Classes</span>
                  </h3>
                  <button type="button" className="link-btn" onClick={() => onNavigate('classes')}>
                    View All →
                  </button>
                </div>

                {classes.length === 0 ? (
                  <p className="muted-text">
                    No classes joined yet. Use &ldquo;Join a Class&rdquo; to enroll with an invite
                    code.
                  </p>
                ) : (
                  classes.slice(0, 3).map((cls) => (
                    <button
                      type="button"
                      key={cls.id}
                      className="panel-item-row clickable"
                      onClick={() => onNavigate('classes')}
                      style={{ textAlign: 'left', width: '100%' }}
                    >
                      <div className="panel-item-meta">
                        <strong>
                          {cls.className} — {cls.sectionName}
                        </strong>
                        <span>
                          {cls.studentCount} students · {cls.teachers.length} teacher(s)
                        </span>
                      </div>
                      <ChevronRight size={15} style={{ color: '#64748b' }} />
                    </button>
                  ))
                )}
              </div>

              {/* Upcoming Work */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <h3>
                    <CalendarClock size={16} style={{ color: '#2563eb' }} />
                    <span>Upcoming Work</span>
                  </h3>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => onNavigate('assignments')}
                  >
                    View All →
                  </button>
                </div>

                {upcomingWork.length === 0 ? (
                  <p className="muted-text">No active assignments or assessments assigned yet.</p>
                ) : (
                  upcomingWork.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="panel-item-row clickable"
                      onClick={item.onOpen}
                      style={{ textAlign: 'left', width: '100%' }}
                    >
                      <div className="panel-item-meta">
                        <strong>{item.title}</strong>
                        <span>
                          {item.typeLabel} · {item.meta}
                        </span>
                      </div>
                      <span className="pill">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Open'}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Recent Activity */}
              <div className="panel-card">
                <div className="panel-card-header">
                  <h3>
                    <Activity size={16} style={{ color: '#15803d' }} />
                    <span>Recent Activity</span>
                  </h3>
                  <button type="button" className="link-btn" onClick={() => onNavigate('results')}>
                    View All →
                  </button>
                </div>

                {recentActivity.length === 0 ? (
                  <p className="muted-text">
                    No activity recorded yet. Complete a lesson or attempt an assessment to start.
                  </p>
                ) : (
                  recentActivity.map((act) => (
                    <div className="panel-item-row" key={act.id}>
                      <div className="panel-item-meta">
                        <strong>{act.title}</strong>
                        <span>{act.time}</span>
                      </div>
                      <CheckCircle2
                        size={15}
                        style={{
                          color: act.tone === 'success' ? '#15803d' : '#2563eb',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Explore Platform Courses */}
            <section className="panel-card">
              <div className="panel-card-header">
                <div>
                  <h3>
                    <BookOpen size={16} style={{ color: '#2563eb' }} />
                    <span>Explore Platform Courses</span>
                  </h3>
                  <p className="muted-text" style={{ fontSize: 12.5, marginTop: 2 }}>
                    Free platform-wide courses available across L_Platform alongside your school
                    curriculum.
                  </p>
                </div>
                <button type="button" className="link-btn" onClick={() => onNavigate('library')}>
                  View Library →
                </button>
              </div>

              {platformFeaturedCourses.length === 0 ? (
                <p className="muted-text">No published platform-wide courses available yet.</p>
              ) : (
                <div className="cards-grid-3">
                  {platformFeaturedCourses.map((c) => (
                    <div className="reader-box" key={c.id} style={{ padding: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <strong style={{ fontSize: 14 }}>{c.title}</strong>
                        <span className="pill pill-free">
                          <Globe size={11} />
                          Free
                        </span>
                      </div>
                      <p className="muted-text" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                        {c.description || `${c.category} · ${c.language}`}
                      </p>
                      <div style={{ marginTop: 10 }}>
                        {c.hasInteractiveReader ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onNavigate('learning')}
                          >
                            Open Reader →
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onNavigate('library')}
                          >
                            View in Library
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {section === 'classes' && (
          <MyClassesView
            classes={classes}
            isOnline={isOnline}
            onRefresh={() => void loadWorkspaceData()}
            onOpenJoinModal={() => setJoinOpen(true)}
            onOpenCourseReader={() => onNavigate('learning')}
          />
        )}

        {section === 'library' && (
          <LearningLibraryView courses={catalog} onOpenReader={() => onNavigate('learning')} />
        )}

        {section === 'learning' && <AiCourse />}

        {section === 'assessments' && (
          <CourseAssessments
            isOnline={isOnline}
            onAttemptChanged={() => void loadWorkspaceData()}
            onOpenResults={() => onNavigate('results')}
            focusModuleId={focusAssessmentModuleId}
            onClearFocusModule={() => setFocusAssessmentModuleId(null)}
          />
        )}

        {section === 'assignments' && activeMultiAssignment ? (
          <MultiTypeAssignmentWorkspace
            assignment={
              assignments.find((a) => a.id === activeMultiAssignment.assignment.id) ??
              activeMultiAssignment.assignment
            }
            initialQuestionId={activeMultiAssignment.questionId}
            isOnline={isOnline}
            onBack={() => setActiveMultiAssignment(null)}
            onSubmitted={() => void loadWorkspaceData()}
          />
        ) : (
          section === 'assignments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="section-header-row">
                <div>
                  <span className="eyebrow">Practice &amp; Graded Tasks</span>
                  <h1>Course &amp; Class Assignments</h1>
                  <p>
                    Complete coding challenges in the IDE and submit conceptual, short-answer, case
                    study, or practical tasks from your classes.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void loadWorkspaceData()}
                >
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="empty-card">
                  <div className="empty-card-icon">
                    <FolderCode size={22} />
                  </div>
                  <h3>No published assignments yet</h3>
                  <p className="muted-text">
                    When your teacher publishes tasks to your section, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="cards-grid-2">
                  {assignments.map((asg) => {
                    const typeLabel = (asg.assignmentType || 'PROGRAMMING').replaceAll('_', ' ');
                    return (
                      <article className="panel-card" key={asg.id}>
                        <div className="course-card-top">
                          <div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span className="pill pill-info">{asg.status}</span>
                              <span className="pill pill-violet">{typeLabel}</span>
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                              {asg.title}
                            </h3>
                          </div>
                          {asg.dueDate && (
                            <span className="pill">
                              Due {new Date(asg.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <p className="muted-text" style={{ lineHeight: 1.55 }}>
                          {asg.description || 'Complete the assigned questions.'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(asg.questions ?? []).length === 0 ? (
                            <span className="muted-text" style={{ fontSize: 12.5 }}>
                              No questions attached to this assignment yet.
                            </span>
                          ) : (
                            (asg.questions ?? []).map((q, qIdx) => {
                              const isCodeQ = ['PROGRAMMING', 'CODE'].includes(
                                (q.questionType ?? '').toUpperCase(),
                              );
                              const hasDraft = isCodeQ && Boolean(getDraft(asg.id, q.id));
                              const latestSub = (asg.mySubmissions ?? []).find(
                                (s) => s.questionId === q.id,
                              );
                              return (
                                <div className="panel-item-row" key={q.id}>
                                  <div className="panel-item-meta">
                                    <strong>
                                      {qIdx + 1}. {q.title}
                                    </strong>
                                    <span>
                                      {q.points} pts ·{' '}
                                      {(q.questionType ?? 'PROGRAMMING').replaceAll('_', ' ')}
                                      {hasDraft ? ' · Local Draft Saved' : ''}
                                      {latestSub
                                        ? latestSub.feedbackReleasedAt && latestSub.score !== null
                                          ? ` · Score ${latestSub.score}/${q.points}`
                                          : ` · ${latestSub.status.replaceAll('_', ' ')}`
                                        : ''}
                                    </span>
                                  </div>
                                  {isCodeQ ? (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => onSelectAssignment(asg, q)}
                                    >
                                      <Code2 size={13} />
                                      <span>Open IDE</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() =>
                                        setActiveMultiAssignment({
                                          assignment: asg,
                                          questionId: q.id,
                                        })
                                      }
                                    >
                                      <ClipboardCheck size={13} />
                                      <span>{latestSub ? 'View / Submit' : 'Open Task'}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}

        {section === 'results' && (
          <ResultsView
            results={results}
            submissions={submissions}
            assignments={assignments}
            onRefresh={() => void loadWorkspaceData()}
          />
        )}

        {section === 'progress' && (
          <ProgressView
            course={course}
            completedLessonIds={completedLessonIds}
            results={results}
            lessonsCompletedCount={progress?.lessonsCompleted ?? completedLessonsCount}
            pendingReviewCount={progress?.pendingReview ?? 0}
            gradedCount={progress?.graded ?? 0}
            earnedMarks={progress?.earnedMarks ?? 0}
            onOpenCourseReader={() => onNavigate('learning')}
          />
        )}

        {(section === 'settings' || section === 'help') && (
          <SettingsAndHelpView mode={section} isOnline={isOnline} onSync={onSync} />
        )}
      </div>

      <JoinClassModal
        open={joinOpen}
        isOnline={isOnline}
        onClose={() => setJoinOpen(false)}
        onSuccess={(msg) => {
          setBannerMsg(msg);
          void loadWorkspaceData();
        }}
      />
    </div>
  );
};
