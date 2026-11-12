import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Globe,
  GraduationCap,
  Layers,
  Plus,
  School,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { joinClassByCode } from '../lib/api';
import type { CatalogCourse, StudentClass } from '../types';

interface JoinClassModalProps {
  open: boolean;
  isOnline: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({
  open,
  isOnline,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await joinClassByCode(code.trim());
      setCode('');
      onSuccess(
        res.alreadyEnrolled
          ? `Already enrolled in ${res.className} — ${res.sectionName}.`
          : `Joined ${res.className} — ${res.sectionName} successfully!`,
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to join class with that code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Join a Class">
      <div className="modal-panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <span className="eyebrow">Class Enrollment</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>Join a Class</h2>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <p className="muted-text" style={{ marginBottom: 16 }}>
          Enter the section invite code (for example <code>CLS-10A</code>) or paste a class invite
          link shared by your teacher or school admin.
        </p>

        {error && (
          <div className="inline-banner danger" role="alert" style={{ marginBottom: 12 }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="join-class-input">Invite Code or Link</label>
            <input
              id="join-class-input"
              type="text"
              className="input-control"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CLS-SEC-10A or https://lplatform.local/join?code=..."
              required
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 18,
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isOnline || busy || !code.trim()}
            >
              {busy ? 'Joining…' : 'Join Class →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface MyClassesViewProps {
  classes: StudentClass[];
  isOnline: boolean;
  onRefresh: () => void;
  onOpenJoinModal: () => void;
  onOpenCourseReader: () => void;
}

export const MyClassesView: React.FC<MyClassesViewProps> = ({
  classes,
  isOnline,
  onOpenJoinModal,
  onOpenCourseReader,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Enrolled Sections</span>
          <h1>My Classes</h1>
          <p>
            View your active classes, primary &amp; co-teachers, allocated courses, or join a new
            class using an invite code.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!isOnline}
          onClick={onOpenJoinModal}
        >
          <Plus size={15} />
          <span>Join a Class</span>
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="empty-card">
          <div className="empty-card-icon">
            <School size={22} />
          </div>
          <h3>No class enrollments yet</h3>
          <p className="muted-text" style={{ maxWidth: 460 }}>
            Use an invite code or join link from your teacher to join your school class and unlock
            section assignments and assessments.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isOnline}
            onClick={onOpenJoinModal}
          >
            <Plus size={15} />
            <span>Enter Class Invite Code</span>
          </button>
        </div>
      ) : (
        <div className="cards-grid-2">
          {classes.map((cls) => {
            const primaryTeacher = cls.teachers.find((t) => t.teacherRole === 'PRIMARY');
            const coTeachers = cls.teachers.filter((t) => t.teacherRole !== 'PRIMARY');

            return (
              <article className="panel-card" key={cls.id}>
                <div className="course-card-top">
                  <div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                    >
                      <span className="pill pill-school">{cls.organizationName}</span>
                      {cls.academicYear && <span className="pill">{cls.academicYear}</span>}
                    </div>
                    <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 8 }}>
                      {cls.className} — {cls.sectionName}
                    </h2>
                    {cls.grade && (
                      <p className="muted-text" style={{ marginTop: 2 }}>
                        Level: {cls.grade}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(cls.id, cls.joinCode)}
                    title="Copy section join code"
                  >
                    {copiedId === cls.id ? <Check size={13} /> : <Copy size={13} />}
                    <code>{cls.joinCode}</code>
                  </button>
                </div>

                {/* Teachers Roster */}
                <div className="reader-box" style={{ padding: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ fontSize: 12.5 }}>Assigned Faculty</strong>
                    <span className="muted-text tabular-nums" style={{ fontSize: 12 }}>
                      <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {cls.studentCount}
                      {cls.maxStudents ? ` / ${cls.maxStudents}` : ''} students
                    </span>
                  </div>

                  {cls.teachers.length === 0 ? (
                    <span className="muted-text" style={{ fontSize: 12 }}>
                      No teachers assigned to this section yet.
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {primaryTeacher && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            fontSize: 12.5,
                          }}
                        >
                          <span>{primaryTeacher.name}</span>
                          <span className="pill pill-violet">Primary Teacher</span>
                        </div>
                      )}
                      {coTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            fontSize: 12.5,
                          }}
                        >
                          <span>{teacher.name}</span>
                          <span className="pill">Co-Teacher</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Courses */}
                <div>
                  <span className="eyebrow" style={{ marginBottom: 8 }}>
                    Allocated Courses ({cls.courses.length})
                  </span>
                  {cls.courses.length === 0 ? (
                    <p className="muted-text" style={{ fontSize: 12.5 }}>
                      No school courses allocated directly to this section yet.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {cls.courses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (course.id === 'crs-ai-readiness-001') {
                              onOpenCourseReader();
                            }
                          }}
                        >
                          <BookOpen size={13} />
                          <span>{course.title}</span>
                          <span className="muted-text" style={{ fontSize: 11 }}>
                            ({course.language})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface LearningLibraryViewProps {
  courses: CatalogCourse[];
  onOpenReader: () => void;
}

export const LearningLibraryView: React.FC<LearningLibraryViewProps> = ({
  courses,
  onOpenReader,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PLATFORM_FREE' | 'SCHOOL'>('ALL');

  const filtered = courses.filter((course) =>
    filter === 'ALL' ? true : course.scopeType === filter,
  );

  const platformCourses = filtered.filter((c) => c.scopeType === 'PLATFORM_FREE');
  const schoolCourses = filtered.filter((c) => c.scopeType === 'SCHOOL');
  const platformCount = courses.filter((c) => c.scopeType === 'PLATFORM_FREE').length;
  const schoolCount = courses.filter((c) => c.scopeType === 'SCHOOL').length;

  const renderCourseCard = (course: CatalogCourse) => (
    <article className="course-card" key={course.id}>
      <div className="course-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {course.scopeType === 'PLATFORM_FREE' ? (
            <span className="pill pill-free">
              <Globe size={11} />
              Platform Free
            </span>
          ) : (
            <span className="pill pill-school">
              <GraduationCap size={11} />
              School Course
            </span>
          )}
          <span className="pill">{course.language}</span>
          {course.estimatedMinutes ? (
            <span className="pill tabular-nums">
              {Math.round(course.estimatedMinutes / 60)} hrs
            </span>
          ) : null}
        </div>
        <span className="pill">{course.difficulty}</span>
      </div>

      <div>
        <h3 style={{ fontSize: 16.5, fontWeight: 700 }}>{course.title}</h3>
        <span className="muted-text" style={{ fontSize: 11.5 }}>
          {course.category} · v{course.version}
        </span>
      </div>

      <p>{course.description || 'Structured L_Platform course curriculum.'}</p>

      <div className="course-card-footer">
        {course.accessEnabled ? (
          <span className="pill pill-success">
            {course.scopeType === 'PLATFORM_FREE' ? 'Open to All Students' : 'Access Enabled'}
          </span>
        ) : (
          <span className="pill pill-warning">Requires School Allocation</span>
        )}

        {course.hasInteractiveReader ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenReader}>
            <Sparkles size={13} />
            <span>Open Reader →</span>
          </button>
        ) : (
          <span className="muted-text" style={{ fontSize: 11.5 }}>
            {course.accessEnabled ? 'Curriculum overview only' : 'Join a school class to unlock'}
          </span>
        )}
      </div>
    </article>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <span className="eyebrow">Course Catalog</span>
          <h1>Learning Library</h1>
          <p>
            Explore free platform-wide courses available immediately alongside school courses
            allocated by your institution.
          </p>
        </div>

        <div className="tabs-bar" role="tablist" aria-label="Course catalog scope filter">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'ALL'}
            className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Courses ({courses.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'PLATFORM_FREE'}
            className={`tab-btn ${filter === 'PLATFORM_FREE' ? 'active' : ''}`}
            onClick={() => setFilter('PLATFORM_FREE')}
          >
            Platform Free ({platformCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'SCHOOL'}
            className={`tab-btn ${filter === 'SCHOOL' ? 'active' : ''}`}
            onClick={() => setFilter('SCHOOL')}
          >
            School Courses ({schoolCount})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-card">
          <div className="empty-card-icon">
            <Layers size={22} />
          </div>
          <h3>No courses match this filter</h3>
          <p className="muted-text">
            Switch tabs above or join a school class to view allocated courses.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {platformCourses.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Explore Platform Courses</h2>
                <span className="pill pill-free">Available without class enrollment</span>
              </div>
              <div className="cards-grid-3">{platformCourses.map(renderCourseCard)}</div>
            </section>
          )}

          {schoolCourses.length > 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>My School Courses</h2>
                <span className="pill pill-school">Organization &amp; Section Allocations</span>
              </div>
              <div className="cards-grid-3">{schoolCourses.map(renderCourseCard)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
