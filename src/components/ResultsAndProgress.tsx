import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Database,
  HelpCircle,
  Keyboard,
  RefreshCw,
  Server,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../lib/api';
import { countSavedDrafts, getCachedCoursesCatalog, getQueuedSubmissions } from '../lib/storage';
import { getCourseCompletionPercent } from '../lib/student-workspace';
import type { AssessmentResultRecord, Assignment, LearningCourse, Submission } from '../types';

interface ResultsViewProps {
  results: AssessmentResultRecord[];
  submissions: Submission[];
  assignments: Assignment[];
  onRefresh: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  submissions,
  assignments,
  onRefresh,
}) => {
  const [tab, setTab] = useState<'assessments' | 'coding'>('assessments');
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  const assignmentTitleById = new Map(assignments.map((a) => [a.id, a.title]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Academic Record</span>
          <h1>Results &amp; Teacher Feedback</h1>
          <p>
            Review released assessment scores, question-level rubric feedback, and coding submission
            statuses.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="tabs-bar">
            <button
              type="button"
              className={`tab-btn ${tab === 'assessments' ? 'active' : ''}`}
              onClick={() => setTab('assessments')}
            >
              Assessments ({results.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${tab === 'coding' ? 'active' : ''}`}
              onClick={() => setTab('coding')}
            >
              Coding Submissions ({submissions.length})
            </button>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {tab === 'assessments' ? (
        results.length === 0 ? (
          <div className="empty-card">
            <div className="empty-card-icon">
              <Award size={22} />
            </div>
            <h3>No assessment attempts recorded yet</h3>
            <p className="muted-text">
              Once you start or submit a published assessment, its status and released score will
              appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((item) => {
              const isReleased = item.feedbackReleased && item.score !== null;
              const isExpanded = expandedAttemptId === item.attemptId;

              return (
                <article className="panel-card" key={item.attemptId}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                      >
                        <span
                          className={`pill ${
                            isReleased
                              ? item.passed
                                ? 'pill-success'
                                : 'pill-warning'
                              : item.status === 'IN_PROGRESS'
                                ? 'pill-info'
                                : 'pill-violet'
                          }`}
                        >
                          {item.status.replaceAll('_', ' ')}
                        </span>
                        <span className="pill">Attempt #{item.attemptNumber}</span>
                        <span className="muted-text" style={{ fontSize: 12 }}>
                          {item.moduleId.replaceAll('-', ' ')}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{item.title}</h3>
                      <span className="muted-text" style={{ fontSize: 12 }}>
                        Started {new Date(item.startedAt).toLocaleString()}
                        {item.submittedAt
                          ? ` · Submitted ${new Date(item.submittedAt).toLocaleString()}`
                          : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {isReleased ? (
                        <div style={{ textAlign: 'right' }}>
                          <strong
                            className="tabular-nums"
                            style={{ fontSize: 22, color: item.passed ? '#34d399' : '#fbbf24' }}
                          >
                            {item.score} / {item.totalMarks}
                          </strong>
                          <div className="muted-text" style={{ fontSize: 11.5 }}>
                            {item.passed === null
                              ? 'Released'
                              : item.passed
                                ? 'Passed'
                                : 'Below passing marks'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <span className="pill">Score Hidden Until Release</span>
                          <div className="muted-text" style={{ fontSize: 11.5, marginTop: 4 }}>
                            {item.totalMarks} max marks
                          </div>
                        </div>
                      )}

                      {isReleased && item.breakdown.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setExpandedAttemptId(isExpanded ? null : item.attemptId)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isExpanded ? 'Hide Feedback' : 'View Breakdown'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && isReleased && item.breakdown.length > 0 && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {item.breakdown.map((q, idx) => (
                        <div className="reader-box" key={q.questionId} style={{ padding: 12 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <strong style={{ fontSize: 13 }}>
                              Q{idx + 1}: {q.prompt}
                            </strong>
                            <span className="pill pill-violet tabular-nums">
                              {q.marksAwarded ?? 0} / {q.maxMarks} marks
                            </span>
                          </div>
                          <div className="muted-text" style={{ fontSize: 12 }}>
                            Your response:{' '}
                            <code>
                              {typeof q.studentResponse === 'string'
                                ? q.studentResponse
                                : JSON.stringify(q.studentResponse ?? '—')}
                            </code>
                          </div>
                          {q.feedback && (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12.5,
                                color: '#a7f3d0',
                              }}
                            >
                              Teacher feedback: {q.feedback}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
      ) : submissions.length === 0 ? (
        <div className="empty-card">
          <div className="empty-card-icon">
            <Code2 size={22} />
          </div>
          <h3>No coding submissions yet</h3>
          <p className="muted-text">
            Open an assignment in the Coding IDE to submit Python, Java, or C++ solutions.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {submissions.map((sub) => (
            <article className="panel-item-row" key={sub.id} style={{ padding: '14px 16px' }}>
              <div className="panel-item-meta">
                <strong>{assignmentTitleById.get(sub.assignmentId) || 'Coding Assignment'}</strong>
                <span>
                  {sub.language} · Submitted {new Date(sub.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className={`pill ${
                    sub.status === 'COMPLETED'
                      ? 'pill-success'
                      : sub.status === 'FAILED'
                        ? 'pill-danger'
                        : 'pill-warning'
                  }`}
                >
                  {sub.status}
                </span>
                <strong className="tabular-nums" style={{ fontSize: 13.5 }}>
                  {sub.score == null ? 'Pending worker evaluation' : `${sub.score} pts`}
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

interface ProgressViewProps {
  course: LearningCourse | null;
  completedLessonIds: string[];
  results: AssessmentResultRecord[];
  lessonsCompletedCount: number;
  pendingReviewCount: number;
  gradedCount: number;
  earnedMarks: number;
  onOpenCourseReader: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  course,
  completedLessonIds,
  results,
  lessonsCompletedCount,
  pendingReviewCount,
  gradedCount,
  earnedMarks,
  onOpenCourseReader,
}) => {
  const completedSet = new Set(completedLessonIds);
  const totalLessons = course ? course.modules.reduce((acc, m) => acc + m.lessons.length, 0) : 0;
  const completedFromCourse = course
    ? course.modules.reduce(
        (acc, m) => acc + m.lessons.filter((_, idx) => completedSet.has(`${m.id}:${idx}`)).length,
        0,
      )
    : lessonsCompletedCount;

  const percent =
    totalLessons > 0 ? getCourseCompletionPercent(completedFromCourse, totalLessons) : 0;
  const completedModulesCount = course
    ? course.modules.filter(
        (m) =>
          m.lessons.length > 0 && m.lessons.every((_, idx) => completedSet.has(`${m.id}:${idx}`)),
      ).length
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Real-Time Telemetry</span>
          <h1>Learning Progress</h1>
          <p>
            Computed exclusively from your persisted lesson completions and released assessments.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={onOpenCourseReader}>
          Open Course Reader →
        </button>
      </div>

      <div className="quick-actions-grid">
        <div className="panel-card">
          <span className="eyebrow">Lessons Completed</span>
          <strong className="tabular-nums" style={{ fontSize: 28 }}>
            {completedFromCourse}
            {totalLessons > 0 ? ` / ${totalLessons}` : ''}
          </strong>
          <span className="muted-text">{percent}% of interactive lessons</span>
        </div>

        <div className="panel-card">
          <span className="eyebrow">Modules Finished</span>
          <strong className="tabular-nums" style={{ fontSize: 28 }}>
            {completedModulesCount}
            {course ? ` / ${course.modules.length}` : ''}
          </strong>
          <span className="muted-text">Full curriculum modules</span>
        </div>

        <div className="panel-card">
          <span className="eyebrow">Earned Marks</span>
          <strong className="tabular-nums" style={{ fontSize: 28 }}>
            {earnedMarks}
          </strong>
          <span className="muted-text">{gradedCount} released assessment(s)</span>
        </div>

        <div className="panel-card">
          <span className="eyebrow">Pending Review</span>
          <strong className="tabular-nums" style={{ fontSize: 28 }}>
            {pendingReviewCount}
          </strong>
          <span className="muted-text">{results.length} total assessment attempt(s)</span>
        </div>
      </div>

      {course && (
        <section className="panel-card">
          <div className="panel-card-header">
            <h3>
              <CheckCircle2 size={16} style={{ color: '#34d399' }} />
              <span>AI Readiness Course — Module Breakdown</span>
            </h3>
            <span className="pill pill-violet tabular-nums">{percent}% overall</span>
          </div>

          <div className="cards-grid-2">
            {course.modules.map((mod, idx) => {
              const done = mod.lessons.filter((_, lIdx) =>
                completedSet.has(`${mod.id}:${lIdx}`),
              ).length;
              const pct = getCourseCompletionPercent(done, mod.lessons.length);

              return (
                <div className="reader-box" key={mod.id} style={{ padding: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>
                      Module {idx + 1}: {mod.title}
                    </strong>
                    <span className="pill tabular-nums">
                      {done}/{mod.lessons.length}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 7,
                      width: '100%',
                      borderRadius: 999,
                      background: '#090d16',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 999,
                        background:
                          pct === 100
                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                            : 'linear-gradient(90deg, #7c3aed, #3b82f6)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

interface SettingsAndHelpViewProps {
  mode: 'settings' | 'help';
  isOnline: boolean;
  onSync: () => Promise<void> | void;
}

export const SettingsAndHelpView: React.FC<SettingsAndHelpViewProps> = ({
  mode,
  isOnline,
  onSync,
}) => {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [savedNotice, setSavedNotice] = useState('');

  const queuedCount = getQueuedSubmissions().length;
  const draftCount = countSavedDrafts();
  const cachedCatalogCount = getCachedCoursesCatalog().length;

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(apiUrl.trim() || 'http://localhost:3001');
    setSavedNotice('API server URL updated. Reload or re-authenticate if changing hosts.');
  };

  if (mode === 'help') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="section-header-row">
          <div>
            <span className="eyebrow">Student Guide</span>
            <h1>Help &amp; Support</h1>
            <p>How offline work, class invite codes, assessments, and code evaluation work.</p>
          </div>
        </div>

        <div className="cards-grid-2">
          <div className="panel-card">
            <div className="panel-card-header">
              <h3>
                <WifiOff size={16} style={{ color: '#fbbf24' }} />
                <span>Working Offline</span>
              </h3>
            </div>
            <p className="muted-text" style={{ lineHeight: 1.6 }}>
              Your coding drafts are automatically saved locally on this device as you type. If you
              submit code while offline, it is placed into the local sync queue and uploaded
              automatically when connectivity returns.
            </p>
          </div>

          <div className="panel-card">
            <div className="panel-card-header">
              <h3>
                <Keyboard size={16} style={{ color: '#a78bfa' }} />
                <span>IDE Shortcuts</span>
              </h3>
            </div>
            <p className="muted-text" style={{ lineHeight: 1.6 }}>
              Inside the Coding IDE: press <code>Tab</code> to insert 4 spaces, drag the vertical
              splitter or use Left/Right arrows when focused on the splitter to resize panes, and
              press <code>Ctrl+S</code> / <code>Cmd+S</code> to save a local draft checkpoint.
            </p>
          </div>

          <div className="panel-card">
            <div className="panel-card-header">
              <h3>
                <Clock size={16} style={{ color: '#38bdf8' }} />
                <span>Assessment Grading &amp; Score Release</span>
              </h3>
            </div>
            <p className="muted-text" style={{ lineHeight: 1.6 }}>
              Objective questions are scored when submitted, while written and practical answers are
              reviewed by your teacher. Total scores remain hidden until your teacher releases the
              graded attempt.
            </p>
          </div>

          <div className="panel-card">
            <div className="panel-card-header">
              <h3>
                <HelpCircle size={16} style={{ color: '#34d399' }} />
                <span>Joining a School Class</span>
              </h3>
            </div>
            <p className="muted-text" style={{ lineHeight: 1.6 }}>
              Open <strong>My Classes</strong> and click <strong>Join a Class</strong> to enter a
              section code or paste a teacher-shared link. Joining links your account to the class
              roster and allocated school courses immediately.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Desktop Configuration</span>
          <h1>Workspace Settings</h1>
          <p>Configure backend server connectivity and inspect offline local storage.</p>
        </div>
      </div>

      <div className="cards-grid-2">
        <form className="panel-card" onSubmit={handleSaveApi}>
          <div className="panel-card-header">
            <h3>
              <Server size={16} style={{ color: '#a78bfa' }} />
              <span>Backend API Connection</span>
            </h3>
            <span className={`pill ${isOnline ? 'pill-success' : 'pill-warning'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {savedNotice && (
            <div className="inline-banner success">
              <span>{savedNotice}</span>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="settings-api-url">Backend Base URL</label>
            <input
              id="settings-api-url"
              type="url"
              className="input-control"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-sm">
              <ShieldCheck size={14} />
              <span>Save Endpoint</span>
            </button>
          </div>
        </form>

        <div className="panel-card">
          <div className="panel-card-header">
            <h3>
              <Database size={16} style={{ color: '#38bdf8' }} />
              <span>Offline Storage &amp; Sync Queue</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="ring-metric-row">
              <span>Saved Coding Drafts</span>
              <strong className="tabular-nums">{draftCount}</strong>
            </div>
            <div className="ring-metric-row">
              <span>Queued Offline Submissions</span>
              <strong className="tabular-nums">{queuedCount}</strong>
            </div>
            <div className="ring-metric-row">
              <span>Cached Catalog Entries</span>
              <strong className="tabular-nums">{cachedCatalogCount}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!isOnline || queuedCount === 0}
              onClick={() => void onSync()}
            >
              <RefreshCw size={13} />
              <span>Sync Offline Queue Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
