import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Play,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  fetchAssessmentAttempt,
  fetchCourseAssessments,
  fetchStudentResults,
  saveCourseAssessmentAnswer,
  startCourseAssessment,
  submitCourseAssessment,
} from '../lib/api';
import { getQuestionInputKind } from '../lib/student-workspace';
import type { AssessmentResultRecord, CourseAssessment, CourseAssessmentQuestion } from '../types';

interface CourseAssessmentsProps {
  isOnline: boolean;
  onAttemptChanged: () => void;
  onOpenResults?: () => void;
  focusModuleId?: string | null;
  onClearFocusModule?: () => void;
}

type OptionEntry = string | { id?: string; text?: string; label?: string };

function optionValue(option: OptionEntry, index: number): string {
  if (typeof option === 'string') return option;
  return String(option.id ?? option.text ?? option.label ?? index);
}

function optionLabel(option: OptionEntry, index: number): string {
  if (typeof option === 'string') return option;
  return String(option.text ?? option.label ?? option.id ?? `Option ${index + 1}`);
}

export const CourseAssessments: React.FC<CourseAssessmentsProps> = ({
  isOnline,
  onAttemptChanged,
  onOpenResults,
  focusModuleId = null,
  onClearFocusModule,
}) => {
  const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
  const [results, setResults] = useState<AssessmentResultRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState<CourseAssessment | null>(null);
  const [active, setActive] = useState<{
    assessment: CourseAssessment;
    attemptId: string;
    questions: CourseAssessmentQuestion[];
  } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{
    status: string;
    score: number | null;
    totalMarks: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [list, attemptResults] = await Promise.all([
        fetchCourseAssessments(),
        fetchStudentResults().catch(() => [] as AssessmentResultRecord[]),
      ]);
      setAssessments(list);
      setResults(attemptResults);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Could not load course assessments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const latestAttemptByAssignment = new Map<string, AssessmentResultRecord>();
  for (const r of results) {
    const key =
      r.assignmentId ?? (r as AssessmentResultRecord & { assessmentId?: string }).assessmentId;
    if (key && !latestAttemptByAssignment.has(key)) {
      latestAttemptByAssignment.set(key, r);
    }
  }

  const resumeByAttemptId = async (assessment: CourseAssessment, attemptId: string) => {
    const detail = await fetchAssessmentAttempt(attemptId);
    const restoredSaved: Record<string, boolean> = {};
    for (const qId of Object.keys(detail.savedAnswers || {})) {
      restoredSaved[qId] = true;
    }
    setActive({
      assessment,
      attemptId: detail.attemptId,
      questions: detail.questions,
    });
    setAnswers(detail.savedAnswers ?? {});
    setSaved(restoredSaved);
    setCurrentQuestion(0);
    setResult(null);
  };

  const begin = async (assessment: CourseAssessment) => {
    setBusy(true);
    setActionError('');
    try {
      const started = await startCourseAssessment(assessment.id);
      if (Array.isArray(started.questions) && started.questions.length > 0) {
        setActive({
          assessment,
          attemptId: started.attemptId,
          questions: started.questions,
        });
        const resumedAnswers =
          (started as { savedAnswers?: Record<string, unknown> }).savedAnswers ?? {};
        setAnswers(resumedAnswers);
        setSaved(Object.fromEntries(Object.keys(resumedAnswers).map((qid) => [qid, true])));
        setCurrentQuestion(0);
        setResult(null);
      } else {
        await resumeByAttemptId(assessment, started.attemptId);
      }
      onAttemptChanged();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Unable to start assessment attempt.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (question: CourseAssessmentQuestion) => {
    if (!active) return;
    setBusy(true);
    setActionError('');
    try {
      await saveCourseAssessmentAnswer(active.attemptId, question.id, answers[question.id] ?? '');
      setSaved((old) => ({ ...old, [question.id]: true }));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not save answer.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!active) return;
    setBusy(true);
    setActionError('');
    try {
      for (const q of active.questions) {
        if (!saved[q.id] && answers[q.id] !== undefined) {
          await saveCourseAssessmentAnswer(active.attemptId, q.id, answers[q.id]);
        }
      }
      const res = await submitCourseAssessment(active.attemptId, answers);
      setResult(res);
      setActive(null);
      setSelectedAssessment(null);
      onAttemptChanged();
      void load();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not submit assessment.');
    } finally {
      setBusy(false);
    }
  };

  // Active Attempt Workspace
  if (active) {
    const question = active.questions[currentQuestion];
    const type = question?.type.toUpperCase() ?? '';
    const inputKind = getQuestionInputKind(type);
    const choice = inputKind === 'single' || inputKind === 'multiple';
    const multiple = inputKind === 'multiple';
    const options = Array.isArray(question?.options) ? question.options : [];
    const answerValue = question ? answers[question.id] : undefined;
    const questionAnswer = Array.isArray(answerValue) ? answerValue : [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="section-header-row">
          <div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: 10 }}
              onClick={() => setActive(null)}
            >
              <ArrowLeft size={14} />
              <span>Save &amp; Exit to Assessments List</span>
            </button>
            <h1>{active.assessment.title}</h1>
            <p>
              {active.assessment.totalMarks} total marks
              {active.assessment.durationMinutes
                ? ` · ${active.assessment.durationMinutes} minutes`
                : ''}
            </p>
          </div>
          <span className="pill pill-info">Attempt In Progress</span>
        </div>

        {actionError && (
          <div className="inline-banner danger" role="alert">
            <span>{actionError}</span>
          </div>
        )}

        {!question ? (
          <div className="empty-card">
            <h3>No questions loaded for this assessment</h3>
          </div>
        ) : (
          <div className="assessment-workspace">
            <article className="panel-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  paddingBottom: 12,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span className="eyebrow">
                  Question {currentQuestion + 1} of {active.questions.length}
                </span>
                <span className="pill pill-violet tabular-nums">{question.marks} marks</span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45 }}>{question.prompt}</h2>

              {choice ? (
                <fieldset
                  style={{
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <legend className="sr-only">Choose your answer</legend>
                  {options.map((opt, idx) => {
                    const value = optionValue(opt, idx);
                    const checked = multiple
                      ? questionAnswer.includes(value)
                      : answerValue === value;
                    return (
                      <label
                        key={`${question.id}-${value}`}
                        className={`answer-option ${checked ? 'selected' : ''}`}
                      >
                        <input
                          type={multiple ? 'checkbox' : 'radio'}
                          name={`answer-${question.id}`}
                          checked={checked}
                          onChange={() => {
                            setSaved((old) => ({ ...old, [question.id]: false }));
                            setAnswers((old) => ({
                              ...old,
                              [question.id]: multiple
                                ? checked
                                  ? (Array.isArray(old[question.id])
                                      ? (old[question.id] as unknown[])
                                      : []
                                    ).filter((entry) => entry !== value)
                                  : [
                                      ...(Array.isArray(old[question.id])
                                        ? (old[question.id] as unknown[])
                                        : []),
                                      value,
                                    ]
                                : value,
                            }));
                          }}
                        />
                        <span>{optionLabel(opt, idx)}</span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : (
                <div className="form-field">
                  <label htmlFor={`answer-${question.id}`}>
                    {type.includes('PRACTICAL') || type.includes('CODE')
                      ? 'Practical / Code Response'
                      : 'Written Response'}
                  </label>
                  <textarea
                    id={`answer-${question.id}`}
                    className="textarea-control"
                    value={String(answerValue ?? '')}
                    onChange={(event) => {
                      setSaved((old) => ({ ...old, [question.id]: false }));
                      setAnswers((old) => ({ ...old, [question.id]: event.target.value }));
                    }}
                    rows={type.includes('LONG') || type.includes('PRACTICAL') ? 8 : 5}
                    placeholder="Type your response here…"
                  />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <span className={`pill ${saved[question.id] ? 'pill-success' : ''}`}>
                  {saved[question.id] ? 'Saved to backend' : 'Unsaved changes'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busy || !isOnline}
                    onClick={() => void save(question)}
                  >
                    <Save size={14} />
                    <span>Save Answer</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={currentQuestion === 0 || busy}
                    onClick={() => setCurrentQuestion((i) => i - 1)}
                  >
                    Previous
                  </button>
                  {currentQuestion < active.questions.length - 1 ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busy}
                      onClick={() => setCurrentQuestion((i) => i + 1)}
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={busy || !isOnline}
                      onClick={() => void submit()}
                    >
                      {busy ? 'Submitting…' : 'Submit Assessment'}
                    </button>
                  )}
                </div>
              </div>
            </article>

            {/* Right Question Navigator */}
            <aside className="panel-card">
              <span className="eyebrow">Question Navigator</span>
              <div className="question-nav-grid">
                {active.questions.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`question-nav-pill ${
                      idx === currentQuestion ? 'current' : saved[item.id] ? 'saved' : ''
                    }`}
                    onClick={() => setCurrentQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <p className="muted-text" style={{ fontSize: 12 }}>
                Green indicates answers saved to your attempt. Save each response before final
                submission.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !isOnline}
                onClick={() => void submit()}
                style={{ width: '100%' }}
              >
                {busy ? 'Submitting…' : 'Submit Attempt →'}
              </button>
            </aside>
          </div>
        )}
      </div>
    );
  }

  // Post-Submission Honest Receipt
  if (result) {
    return (
      <div className="panel-card" style={{ maxWidth: 680 }}>
        <span className="pill pill-success" style={{ alignSelf: 'flex-start' }}>
          <FileCheck2 size={13} />
          Submission Recorded
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Assessment Submitted</h2>
        <p className="muted-text" style={{ lineHeight: 1.6 }}>
          Status: <strong>{result.status.replaceAll('_', ' ')}</strong>.{' '}
          {result.status === 'RELEASED' && result.score !== null
            ? `Score released: ${result.score} / ${result.totalMarks} marks.`
            : `Maximum marks: ${result.totalMarks}. Your final score and rubric feedback will appear in Results once reviewed and released by your teacher.`}
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setResult(null)}>
            Back to Assessments
          </button>
          {onOpenResults && (
            <button type="button" className="btn btn-primary" onClick={onOpenResults}>
              Open Results &amp; Feedback →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Instructions Screen
  if (selectedAssessment) {
    const existingAttempt = latestAttemptByAssignment.get(selectedAssessment.id);
    const isInProgress = existingAttempt?.status === 'IN_PROGRESS';
    const isAwaitingRelease =
      existingAttempt?.status === 'PENDING_REVIEW' || existingAttempt?.status === 'GRADED';
    const isReleased = existingAttempt?.status === 'RELEASED';
    const attemptLimit = selectedAssessment.attemptLimit ?? 1;
    const completedCount = results.filter(
      (r) =>
        (r.assignmentId ?? r.assessmentId) === selectedAssessment.id && r.status !== 'IN_PROGRESS',
    ).length;
    const limitReached = !isInProgress && completedCount >= attemptLimit;

    return (
      <div className="panel-card" style={{ maxWidth: 740 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setSelectedAssessment(null)}
        >
          <ArrowLeft size={14} />
          <span>Back to Assessments</span>
        </button>

        <span className="eyebrow">
          {selectedAssessment.moduleId.replaceAll('-', ' ')} · Assessment Instructions
        </span>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{selectedAssessment.title}</h2>
        <p className="muted-text" style={{ fontSize: 14, lineHeight: 1.65 }}>
          {selectedAssessment.instructions ||
            'Read each question carefully, save your answers as you progress, and submit once finished.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <span className="pill pill-violet tabular-nums">
            {selectedAssessment.totalMarks} Total Marks
          </span>
          {selectedAssessment.passingMarks !== null && (
            <span className="pill tabular-nums">
              Pass Threshold: {selectedAssessment.passingMarks}
            </span>
          )}
          {selectedAssessment.durationMinutes && (
            <span className="pill">
              <Clock size={12} />
              {selectedAssessment.durationMinutes} min
            </span>
          )}
          {selectedAssessment.dueAt && (
            <span className="pill">Due {new Date(selectedAssessment.dueAt).toLocaleString()}</span>
          )}
        </div>

        {actionError && (
          <div className="inline-banner danger" role="alert">
            <span>{actionError}</span>
          </div>
        )}

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}
        >
          {isAwaitingRelease && (
            <span className="pill pill-violet">
              {existingAttempt?.status === 'GRADED'
                ? 'Graded — Awaiting Teacher Score Release'
                : 'Submitted — Pending Teacher Review'}
            </span>
          )}
          {isReleased && existingAttempt && (
            <span className="pill pill-success">
              Latest Score: {existingAttempt.score ?? '—'} / {existingAttempt.totalMarks}
            </span>
          )}
          {!limitReached && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isOnline || busy}
              onClick={() =>
                void (isInProgress && existingAttempt
                  ? resumeByAttemptId(selectedAssessment, existingAttempt.attemptId)
                  : begin(selectedAssessment))
              }
            >
              <Play size={14} />
              <span>
                {busy
                  ? 'Opening…'
                  : isInProgress
                    ? 'Resume Attempt →'
                    : completedCount > 0
                      ? 'Start New Attempt →'
                      : 'Start Assessment →'}
              </span>
            </button>
          )}
          {limitReached && onOpenResults && (
            <button type="button" className="btn btn-secondary" onClick={onOpenResults}>
              Open Results &amp; Feedback →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Assessments Catalog & Filters
  const filteredAssessments = assessments.filter((a) => {
    if (focusModuleId && a.moduleId !== focusModuleId) return false;
    const attempt = latestAttemptByAssignment.get(a.id);
    if (filter === 'ALL') return true;
    if (filter === 'IN_PROGRESS') return attempt?.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') {
      return (
        attempt?.status === 'PENDING_REVIEW' ||
        attempt?.status === 'GRADED' ||
        attempt?.status === 'RELEASED'
      );
    }
    return !attempt;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Module Evaluations</span>
          <h1>Course Assessments</h1>
          <p>Attempt platform AI Readiness module evaluations and assigned class assessments.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {focusModuleId && onClearFocusModule && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClearFocusModule}>
              <span>Filter: {focusModuleId.replaceAll('-', ' ')} ✕</span>
            </button>
          )}
          <div className="tabs-bar">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'] as const).map((tabId) => (
              <button
                key={tabId}
                type="button"
                className={`tab-btn ${filter === tabId ? 'active' : ''}`}
                onClick={() => setFilter(tabId)}
              >
                {tabId === 'ALL'
                  ? 'All'
                  : tabId === 'OPEN'
                    ? 'Upcoming'
                    : tabId === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Submitted / Released'}
              </button>
            ))}
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="inline-banner danger" role="alert">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} />
            {loadError}
          </span>
        </div>
      )}

      {loading ? (
        <div className="panel-card">
          <p className="muted-text">Loading published assessments…</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="empty-card">
          <div className="empty-card-icon">
            <ClipboardCheck size={22} />
          </div>
          <h3>No assessments in this view</h3>
          <p className="muted-text">
            When your teacher publishes and assigns an assessment to your class, it will appear
            here.
          </p>
        </div>
      ) : (
        <div className="cards-grid-2">
          {filteredAssessments.map((assessment) => {
            const attempt = latestAttemptByAssignment.get(assessment.id);
            const inProgress = attempt?.status === 'IN_PROGRESS';
            const released = attempt?.status === 'RELEASED';
            const pendingReview = attempt?.status === 'PENDING_REVIEW';
            const gradedPendingRelease = attempt?.status === 'GRADED';

            return (
              <article className="panel-card" key={assessment.id}>
                <div className="course-card-top">
                  <div>
                    <span className="eyebrow">{assessment.moduleId.replaceAll('-', ' ')}</span>
                    <h3 style={{ fontSize: 17.5, fontWeight: 700, marginTop: 4 }}>
                      {assessment.title}
                    </h3>
                  </div>

                  {inProgress ? (
                    <span className="pill pill-info">In Progress</span>
                  ) : released ? (
                    <span className="pill pill-success">
                      <CheckCircle2 size={12} />
                      Score Released
                    </span>
                  ) : gradedPendingRelease ? (
                    <span className="pill pill-violet">Pending Release</span>
                  ) : pendingReview ? (
                    <span className="pill pill-violet">Pending Review</span>
                  ) : (
                    <span className="pill">Open</span>
                  )}
                </div>

                <p className="muted-text" style={{ lineHeight: 1.55 }}>
                  {assessment.instructions || 'Published course module assessment.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <span className="pill tabular-nums">{assessment.totalMarks} marks</span>
                  {assessment.durationMinutes && (
                    <span className="pill">{assessment.durationMinutes} min</span>
                  )}
                  {assessment.dueAt && (
                    <span className="pill">
                      Due {new Date(assessment.dueAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="course-card-footer">
                  <span className="muted-text" style={{ fontSize: 12 }}>
                    {released && attempt?.score !== null
                      ? `Score: ${attempt.score} / ${attempt.totalMarks}`
                      : pendingReview || gradedPendingRelease
                        ? 'Waiting for teacher release'
                        : 'Ready to begin'}
                  </span>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!isOnline || busy}
                    onClick={() => setSelectedAssessment(assessment)}
                  >
                    <span>
                      {inProgress
                        ? 'Resume Attempt'
                        : released
                          ? 'View / Revisit'
                          : 'View Instructions'}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
