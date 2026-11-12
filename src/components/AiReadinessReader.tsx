import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Lightbulb,
  ListChecks,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { completeCourseLesson, fetchAiReadinessCourse, fetchLessonProgress } from '../lib/api';
import {
  cacheAiReadinessCourse,
  cacheCompletedLessons,
  getCachedAiReadinessCourse,
  getCachedCompletedLessons,
  getLastOpenedLesson,
  setLastOpenedLesson,
} from '../lib/storage';
import { getAdjacentLesson, getCourseCompletionPercent } from '../lib/student-workspace';
import type { LearningCourse } from '../types';

interface AiReadinessReaderProps {
  isOnline: boolean;
  onProgressUpdated?: () => void;
  onOpenAssessments?: (moduleId?: string) => void;
}

function sanitizeHandbookTitle(text: string): string {
  return text
    .replace(/\bClass\s*(?:XI|11)\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const AiReadinessReader: React.FC<AiReadinessReaderProps> = ({
  isOnline,
  onProgressUpdated,
  onOpenAssessments,
}) => {
  const [course, setCourse] = useState<LearningCourse | null>(() => getCachedAiReadinessCourse());
  const [completedIds, setCompletedIds] = useState<string[]>(() => getCachedCompletedLessons());
  const [cursor, setCursor] = useState<{ moduleIndex: number; lessonIndex: number }>(() =>
    getLastOpenedLesson(),
  );
  const [loading, setLoading] = useState(!course);
  const [usingCache, setUsingCache] = useState(false);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      setError('');
      try {
        const [courseData, progressData] = await Promise.all([
          fetchAiReadinessCourse(),
          fetchLessonProgress('crs-ai-readiness-001').catch(() => null),
        ]);
        if (!active) return;
        setCourse(courseData);
        cacheAiReadinessCourse(courseData);
        setUsingCache(false);

        if (progressData && Array.isArray(progressData.completedLessonIds)) {
          setCompletedIds(progressData.completedLessonIds);
          cacheCompletedLessons(progressData.completedLessonIds);
        }
      } catch (err: unknown) {
        if (!active) return;
        const cached = getCachedAiReadinessCourse();
        if (cached) {
          setCourse(cached);
          setUsingCache(true);
        } else {
          setError(err instanceof Error ? err.message : 'Unable to load AI Readiness Course.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCourse();
    return () => {
      active = false;
    };
  }, [isOnline]);

  useEffect(() => {
    setLastOpenedLesson(cursor.moduleIndex, cursor.lessonIndex);
  }, [cursor]);

  if (loading) {
    return (
      <div className="panel-card">
        <p className="muted-text">Loading AI Readiness Course curriculum…</p>
      </div>
    );
  }

  if (!course || course.modules.length === 0) {
    return (
      <div className="empty-card">
        <div className="empty-card-icon">
          <BookOpen size={22} />
        </div>
        <h3>Course content unavailable</h3>
        <p className="muted-text">
          {error || 'Connect to the backend server once to download and cache course lessons.'}
        </p>
      </div>
    );
  }

  const safeModuleIdx = Math.min(cursor.moduleIndex, course.modules.length - 1);
  const currentModule = course.modules[safeModuleIdx] ?? course.modules[0];
  const safeLessonIdx = Math.min(
    cursor.lessonIndex,
    Math.max(0, (currentModule?.lessons.length ?? 1) - 1),
  );
  const currentLesson = currentModule?.lessons[safeLessonIdx] ?? currentModule?.lessons[0];

  const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completedSet = new Set(completedIds);
  const completedTotal = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.filter((_, idx) => completedSet.has(`${mod.id}:${idx}`)).length,
    0,
  );
  const overallPercent = getCourseCompletionPercent(completedTotal, totalLessons);

  const currentLessonKey = currentModule ? `${currentModule.id}:${safeLessonIdx}` : '';
  const isCurrentLessonDone = Boolean(currentLessonKey && completedSet.has(currentLessonKey));

  const prevTarget = getAdjacentLesson(
    course,
    { moduleIndex: safeModuleIdx, lessonIndex: safeLessonIdx },
    -1,
  );
  const nextTarget = getAdjacentLesson(
    course,
    { moduleIndex: safeModuleIdx, lessonIndex: safeLessonIdx },
    1,
  );

  const handleMarkComplete = async () => {
    if (!currentModule) return;
    setMarking(true);
    setStatusMessage('');
    try {
      await completeCourseLesson(currentModule.id, safeLessonIdx);
      const nextCompleted = Array.from(new Set([...completedIds, currentLessonKey]));
      setCompletedIds(nextCompleted);
      cacheCompletedLessons(nextCompleted);
      setStatusMessage('Lesson completion saved to your profile.');
      onProgressUpdated?.();
    } catch (err: unknown) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Could not sync completion (requires online connection and active allocation).',
      );
    } finally {
      setMarking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">
            {sanitizeHandbookTitle(course.sourceTitle) || 'Interactive Course Reader'}
          </span>
          <h1>{sanitizeHandbookTitle(course.title)}</h1>
          <p>{sanitizeHandbookTitle(course.description)}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="pill tabular-nums">
            {course.recommendedHours ?? 10} Hours ({course.estimatedMinutes ?? 600} min)
          </span>
          <span className="pill pill-violet tabular-nums">
            <CheckCircle2 size={13} />
            {completedTotal} / {totalLessons} Lessons ({overallPercent}%)
          </span>
          {onOpenAssessments && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenAssessments(currentModule?.id)}
            >
              <ListChecks size={14} />
              <span>
                {currentModule
                  ? `Take Module ${safeModuleIdx + 1} Assessment`
                  : 'Course Assessments'}
              </span>
            </button>
          )}
        </div>
      </div>

      {usingCache && (
        <div className="inline-banner warning">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <WifiOff size={15} />
            Reading offline cached copy of {course.title}. Reconnect to sync lesson completion.
          </span>
        </div>
      )}

      <div className="reader-layout">
        {/* Left Module & Lesson Outline */}
        <aside className="reader-sidebar" aria-label="Course Modules">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 6px 8px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span className="eyebrow">Curriculum Outline</span>
            <span className="muted-text tabular-nums" style={{ fontSize: 11.5 }}>
              {course.modules.length} Modules
            </span>
          </div>

          {course.modules.map((mod, mIdx) => {
            const modDoneCount = mod.lessons.filter((_, lIdx) =>
              completedSet.has(`${mod.id}:${lIdx}`),
            ).length;
            const isExpanded = mIdx === safeModuleIdx;

            return (
              <div key={mod.id} className="module-group">
                <button
                  type="button"
                  className={`module-btn ${isExpanded ? 'active' : ''}`}
                  onClick={() => setCursor({ moduleIndex: mIdx, lessonIndex: 0 })}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#e2e8f0', lineHeight: 1.35 }}>
                      {mIdx + 1}. {sanitizeHandbookTitle(mod.title)}
                    </div>
                    <span className="muted-text" style={{ fontSize: 11, fontWeight: 500 }}>
                      {modDoneCount}/{mod.lessons.length} done · Pages {mod.sourcePages}
                      {mod.estimatedMinutes ? ` · ${mod.estimatedMinutes}m` : ''}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="lesson-list">
                    {mod.lessons.map((lesson, lIdx) => {
                      const done = completedSet.has(`${mod.id}:${lIdx}`);
                      const isCurrent = lIdx === safeLessonIdx;
                      return (
                        <button
                          key={`${mod.id}-${lIdx}`}
                          type="button"
                          className={`lesson-item-btn ${isCurrent ? 'active' : ''}`}
                          onClick={() => setCursor({ moduleIndex: mIdx, lessonIndex: lIdx })}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lIdx + 1}. {lesson.title}
                          </span>
                          {done && (
                            <CheckCircle2 size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Right Reading Canvas */}
        <article className="reader-article-card">
          {currentModule && currentLesson && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span className="eyebrow">
                    Module {safeModuleIdx + 1} · Handbook Pages{' '}
                    {currentLesson.sourcePages || currentModule.sourcePages}
                    {currentLesson.estimatedMinutes
                      ? ` · ${currentLesson.estimatedMinutes} min`
                      : ''}
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                    {sanitizeHandbookTitle(currentLesson.title)}
                  </h2>
                  <p className="muted-text" style={{ marginTop: 2 }}>
                    {sanitizeHandbookTitle(currentModule.title)}
                  </p>
                </div>

                {isCurrentLessonDone ? (
                  <span className="pill pill-success">
                    <CheckCircle2 size={13} />
                    Completed
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={marking || !isOnline}
                    onClick={() => void handleMarkComplete()}
                  >
                    <CheckCircle2 size={14} />
                    <span>{marking ? 'Saving…' : 'Mark Lesson Complete'}</span>
                  </button>
                )}
              </div>

              {statusMessage && (
                <div className="inline-banner success">
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Module Introduction & Objectives (at first lesson or collapsible) */}
              {safeLessonIdx === 0 && (
                <div className="reader-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Compass size={15} style={{ color: '#a78bfa' }} />
                    <strong style={{ fontSize: 13.5 }}>Module Overview &amp; Objectives</strong>
                  </div>
                  <p className="reader-prose" style={{ fontSize: 13.5, marginBottom: 10 }}>
                    {currentModule.introduction}
                  </p>
                  {currentModule.objectives.length > 0 && (
                    <ul
                      style={{
                        paddingLeft: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        fontSize: 13,
                        color: '#cbd5e1',
                      }}
                    >
                      {currentModule.objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Lesson Learning Outcomes */}
              {currentLesson.learningOutcomes && currentLesson.learningOutcomes.length > 0 && (
                <div className="reader-box">
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Lesson Learning Outcomes
                  </strong>
                  <ul
                    style={{
                      paddingLeft: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#cbd5e1',
                    }}
                  >
                    {currentLesson.learningOutcomes.map((item, idx) => (
                      <li key={idx}>{sanitizeHandbookTitle(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lesson Narrative */}
              <div className="reader-prose">{sanitizeHandbookTitle(currentLesson.content)}</div>

              {/* Worked Examples */}
              {currentLesson.examples && currentLesson.examples.length > 0 && (
                <div className="reader-box">
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Real-World Examples
                  </strong>
                  <ul
                    style={{
                      paddingLeft: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#cbd5e1',
                    }}
                  >
                    {currentLesson.examples.map((ex, idx) => (
                      <li key={idx}>{sanitizeHandbookTitle(ex)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Guided Activity */}
              {currentLesson.activity && (
                <div className="reader-box activity">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Sparkles size={15} style={{ color: '#34d399' }} />
                    <strong style={{ fontSize: 13.5, color: '#a7f3d0' }}>
                      Hands-On Learning Activity
                    </strong>
                  </div>
                  <p className="reader-prose" style={{ fontSize: 13.5 }}>
                    {sanitizeHandbookTitle(currentLesson.activity)}
                  </p>
                </div>
              )}

              {/* Key Takeaways */}
              {currentLesson.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
                <div className="reader-box">
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Key Takeaways
                  </strong>
                  <ul
                    style={{
                      paddingLeft: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#cbd5e1',
                    }}
                  >
                    {currentLesson.keyTakeaways.map((item, idx) => (
                      <li key={idx}>{sanitizeHandbookTitle(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Supplemental Note */}
              {currentLesson.supplementalNote && (
                <div className="reader-box" style={{ borderColor: 'rgba(124, 58, 237, 0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="pill pill-violet">Supplemental</span>
                    <strong style={{ fontSize: 13.5 }}>
                      {sanitizeHandbookTitle(currentLesson.supplementalNote.label)}
                    </strong>
                  </div>
                  <p className="reader-prose" style={{ fontSize: 13 }}>
                    {sanitizeHandbookTitle(currentLesson.supplementalNote.content)}
                  </p>
                </div>
              )}

              {/* Key Concepts, Revision Notes & Practice at end of module */}
              {currentModule.concepts.length > 0 && (
                <div className="reader-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Lightbulb size={15} style={{ color: '#fbbf24' }} />
                    <strong style={{ fontSize: 13.5 }}>Key Concepts</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {currentModule.concepts.map((concept, idx) => (
                      <span key={idx} className="pill">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {safeLessonIdx === currentModule.lessons.length - 1 &&
                (currentModule.revisionNotes.length > 0 || currentModule.practice.length > 0) && (
                  <div className="cards-grid-2">
                    {currentModule.revisionNotes.length > 0 && (
                      <div className="reader-box">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <FileText size={15} style={{ color: '#93c5fd' }} />
                          <strong style={{ fontSize: 13.5 }}>Revision Notes</strong>
                        </div>
                        <ul
                          style={{
                            paddingLeft: 18,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            fontSize: 13,
                            color: '#cbd5e1',
                          }}
                        >
                          {currentModule.revisionNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentModule.practice.length > 0 && (
                      <div className="reader-box">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <ListChecks size={15} style={{ color: '#c4b5fd' }} />
                          <strong style={{ fontSize: 13.5 }}>Practice Checkpoints</strong>
                        </div>
                        <ul
                          style={{
                            paddingLeft: 18,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            fontSize: 13,
                            color: '#cbd5e1',
                          }}
                        >
                          {currentModule.practice.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              {/* Bottom Prev / Next Pager */}
              <footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={!prevTarget}
                  onClick={() => prevTarget && setCursor(prevTarget)}
                >
                  <ChevronLeft size={15} />
                  <span>Previous Lesson</span>
                </button>

                <span className="muted-text" style={{ fontSize: 12 }}>
                  {sanitizeHandbookTitle(course.attribution)}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {onOpenAssessments && currentModule && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenAssessments(currentModule.id)}
                    >
                      <ListChecks size={15} />
                      <span>Take Module {safeModuleIdx + 1} Assessment</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!nextTarget}
                    onClick={() => nextTarget && setCursor(nextTarget)}
                  >
                    <span>Next Lesson</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </article>
      </div>
    </div>
  );
};
