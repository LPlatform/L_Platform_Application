import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  CloudOff,
  FileCode2,
  History,
  RotateCcw,
  Save,
  Send,
  TestTube2,
  XCircle,
} from 'lucide-react';
import type { Assignment, Question, Submission } from '../types';
import { submitSolution, fetchSubmissionsForAssignment } from '../lib/api';
import { saveDraft, getDraft, clearDraft, queueOfflineSubmission } from '../lib/storage';

interface EditorProps {
  assignment: Assignment;
  question: Question;
  isOnline: boolean;
  onBack: () => void;
}

const STARTER_CODE: Record<'PYTHON' | 'JAVA' | 'CPP', string> = {
  PYTHON: `# Write your Python solution here\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
  JAVA: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your Java solution here\n    }\n}\n`,
  CPP: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    return 0;\n}\n`,
};

export const Editor: React.FC<EditorProps> = ({ assignment, question, isOnline, onBack }) => {
  const [language, setLanguage] = useState<'PYTHON' | 'JAVA' | 'CPP'>('PYTHON');
  const [code, setCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'tests' | 'results' | 'history'>(
    'problem',
  );
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [previousSubmissions, setPreviousSubmissions] = useState<Submission[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);
  const [historyError, setHistoryError] = useState('');
  const [splitPercent, setSplitPercent] = useState(42);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  const loadSubmissions = useCallback(async () => {
    if (!isOnline) return;
    setHistoryError('');
    try {
      const subs = await fetchSubmissionsForAssignment(assignment.id);
      const filtered = subs.filter((s) => s.questionId === question.id);
      setPreviousSubmissions(filtered);
      if (filtered.length > 0 && !currentSubmission) {
        setCurrentSubmission(filtered[0] ?? null);
      }
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : 'Unable to load submission history.');
    }
  }, [assignment.id, currentSubmission, isOnline, question.id]);

  useEffect(() => {
    const draft = getDraft(assignment.id, question.id);
    if (draft) {
      setLanguage(draft.language);
      setCode(draft.code);
      setLastSaved(new Date(draft.updatedAt));
    } else {
      const starter =
        question.starterTemplates?.PYTHON ||
        question.starterTemplates?.[language] ||
        STARTER_CODE.PYTHON;
      setCode(starter);
    }
    void loadSubmissions();
  }, [assignment.id, language, loadSubmissions, question.id, question.starterTemplates]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    saveDraft(assignment.id, question.id, language, newCode, false);
    setLastSaved(new Date());
  };

  const handleSaveCheckpoint = () => {
    saveDraft(assignment.id, question.id, language, code, false);
    setLastSaved(new Date());
    setFeedbackMsg('Local draft checkpoint saved.');
  };

  const handleLanguageChange = (newLang: 'PYTHON' | 'JAVA' | 'CPP') => {
    setLanguage(newLang);
    const starter = question.starterTemplates?.[newLang] || STARTER_CODE[newLang];
    setCode(starter);
    saveDraft(assignment.id, question.id, newLang, starter, false);
    setLastSaved(new Date());
  };

  const handleResetToTemplate = () => {
    const starter = question.starterTemplates?.[language] || STARTER_CODE[language];
    setCode(starter);
    saveDraft(assignment.id, question.id, language, starter, false);
    setLastSaved(new Date());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSaveCheckpoint();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = `${code.substring(0, start)}    ${code.substring(end)}`;
      setCode(newVal);
      saveDraft(assignment.id, question.id, language, newVal, false);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setFeedbackMsg('');

    if (!isOnline) {
      queueOfflineSubmission({
        assignmentId: assignment.id,
        questionId: question.id,
        language,
        sourceCode: code,
      });
      saveDraft(assignment.id, question.id, language, code, true);
      window.dispatchEvent(new Event('lp-queue-updated'));
      setFeedbackMsg(
        'Offline mode: Submission saved locally and queued. It will upload automatically when reconnected.',
      );
      setSubmitting(false);
      return;
    }

    try {
      const submission = await submitSolution({
        assignmentId: assignment.id,
        questionId: question.id,
        language,
        sourceCode: code,
      });
      clearDraft(assignment.id, question.id);
      setLastSaved(null);
      setCurrentSubmission(submission);
      setActiveTab('results');
      setFeedbackMsg(
        'Solution saved cleanly. Execution stays PENDING until a sandbox evaluation worker processes the queue.',
      );
      void loadSubmissions();
    } catch (err: unknown) {
      queueOfflineSubmission({
        assignmentId: assignment.id,
        questionId: question.id,
        language,
        sourceCode: code,
      });
      window.dispatchEvent(new Event('lp-queue-updated'));
      setFeedbackMsg(
        `${err instanceof Error ? err.message : 'Network error'}: queued submission locally for retry.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const lineCount = Math.max(code.split('\n').length, 1);

  const resizeSplit = (clientX: number, container: HTMLElement | null) => {
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    if (!bounds.width) return;
    const rawPercent = ((clientX - bounds.left) / bounds.width) * 100;
    const minPercent = (310 / bounds.width) * 100;
    const maxPercent = 100 - (340 / bounds.width) * 100;
    setSplitPercent(Math.min(maxPercent, Math.max(minPercent, rawPercent)));
  };

  const visibleTests = (question.testCases ?? []).filter((tc) => !tc.isHidden);

  return (
    <div className="ide-shell">
      <div className="ide-subbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <strong
            style={{
              fontSize: 14,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {assignment.title} — {question.title}
          </strong>
          <span className="pill pill-violet tabular-nums">{question.points} Points</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isOnline && (
            <span className="pill pill-warning">
              <CloudOff size={12} />
              Offline Queue Active
            </span>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
            Back to Assignments
          </button>
        </div>
      </div>

      <div className="ide-split-container">
        {/* Left Reference & Submissions Pane */}
        <section className="ide-left-pane" style={{ width: `${splitPercent}%` }}>
          <div className="ide-tab-strip" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'problem'}
              className={`ide-tab ${activeTab === 'problem' ? 'active' : ''}`}
              onClick={() => setActiveTab('problem')}
            >
              <FileCode2 size={13} style={{ display: 'inline', marginRight: 5 }} />
              Problem
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'tests'}
              className={`ide-tab ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              <TestTube2 size={13} style={{ display: 'inline', marginRight: 5 }} />
              Test Cases ({visibleTests.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'results'}
              className={`ide-tab ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              <Clock size={13} style={{ display: 'inline', marginRight: 5 }} />
              Evaluation
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`ide-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={13} style={{ display: 'inline', marginRight: 5 }} />
              History ({previousSubmissions.length})
            </button>
          </div>

          <div className="ide-pane-scroll">
            {activeTab === 'problem' && (
              <>
                <span className="eyebrow">Problem Specification</span>
                <h2 style={{ fontSize: 19, fontWeight: 700 }}>{question.title}</h2>
                <p className="reader-prose" style={{ fontSize: 13.5 }}>
                  {question.description}
                </p>
              </>
            )}

            {activeTab === 'tests' && (
              <>
                <span className="eyebrow">Sample Test Cases</span>
                {visibleTests.length === 0 ? (
                  <p className="muted-text">No public sample test cases attached.</p>
                ) : (
                  visibleTests.map((tc, idx) => (
                    <div className="reader-box" key={tc.id || idx} style={{ padding: 12 }}>
                      <strong style={{ fontSize: 12.5, display: 'block', marginBottom: 8 }}>
                        Sample Case #{idx + 1}
                      </strong>
                      <div style={{ marginBottom: 8 }}>
                        <span className="muted-text" style={{ fontSize: 11.5 }}>
                          Input:
                        </span>
                        <pre className="pre-code" style={{ marginTop: 4 }}>
                          {tc.input || '(empty)'}
                        </pre>
                      </div>
                      <div>
                        <span className="muted-text" style={{ fontSize: 11.5 }}>
                          Expected Output:
                        </span>
                        <pre className="pre-code" style={{ marginTop: 4 }}>
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'results' && (
              <>
                <span className="eyebrow">Evaluation Status</span>
                {!currentSubmission ? (
                  <p className="muted-text" style={{ lineHeight: 1.6 }}>
                    Submit your code to record a submission. Automated evaluation remains{' '}
                    <code>PENDING</code> until processed by a sandbox worker.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="reader-box" style={{ padding: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <span className="muted-text">Status</span>
                        <span
                          className={`pill ${
                            currentSubmission.status === 'COMPLETED'
                              ? 'pill-success'
                              : currentSubmission.status === 'FAILED'
                                ? 'pill-danger'
                                : 'pill-warning'
                          }`}
                        >
                          {currentSubmission.status}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        <span className="muted-text">Score</span>
                        <strong className="tabular-nums">
                          {currentSubmission.score == null
                            ? 'Pending worker review'
                            : `${currentSubmission.score} / ${question.points} pts`}
                        </strong>
                      </div>
                    </div>

                    {currentSubmission.results && currentSubmission.results.length > 0 ? (
                      currentSubmission.results.map((res, idx) => (
                        <div className="reader-box" key={res.id || idx} style={{ padding: 12 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <span className={`pill ${res.passed ? 'pill-success' : 'pill-danger'}`}>
                              {res.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              Case #{idx + 1}: {res.passed ? 'PASSED' : 'FAILED'}
                            </span>
                            {res.executionTimeMs != null && (
                              <span className="muted-text tabular-nums" style={{ fontSize: 12 }}>
                                {res.executionTimeMs} ms
                              </span>
                            )}
                          </div>
                          {res.actualOutput && (
                            <pre className="pre-code" style={{ marginTop: 6 }}>
                              {res.actualOutput}
                            </pre>
                          )}
                          {res.errorMessage && (
                            <pre
                              className="pre-code"
                              style={{ marginTop: 6, borderColor: 'rgba(239, 68, 68, 0.35)' }}
                            >
                              {res.errorMessage}
                            </pre>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="muted-text">No per-case worker output recorded yet.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <>
                <span className="eyebrow">Prior Submissions</span>
                {!isOnline && (
                  <p className="muted-text">
                    Online connection required to fetch remote submission history.
                  </p>
                )}
                {historyError && (
                  <div className="inline-banner danger" role="alert">
                    <span>{historyError}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => void loadSubmissions()}
                    >
                      Retry
                    </button>
                  </div>
                )}
                {previousSubmissions.length === 0 ? (
                  <p className="muted-text">No previous submissions found for this problem.</p>
                ) : (
                  previousSubmissions.map((sub) => (
                    <button
                      type="button"
                      key={sub.id}
                      className="panel-item-row clickable"
                      onClick={() => {
                        setCurrentSubmission(sub);
                        setActiveTab('results');
                      }}
                      style={{ textAlign: 'left', width: '100%' }}
                    >
                      <div className="panel-item-meta">
                        <strong>
                          {sub.language} · {sub.status}
                        </strong>
                        <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="pill tabular-nums">
                        {sub.score == null ? 'Pending' : `${sub.score} pts`}
                      </span>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </section>

        <div
          className="ide-splitter"
          role="separator"
          tabIndex={0}
          aria-label="Resize problem and code panels"
          aria-orientation="vertical"
          aria-valuenow={Math.round(splitPercent)}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            resizeSplit(event.clientX, event.currentTarget.parentElement);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) resizeSplit(event.clientX, event.currentTarget.parentElement);
          }}
          onKeyDown={(event) => {
            const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
            if (!bounds) return;
            const minPercent = (310 / bounds.width) * 100;
            const maxPercent = 100 - (340 / bounds.width) * 100;
            if (event.key === 'ArrowLeft')
              setSplitPercent((value) => Math.max(minPercent, value - 2));
            if (event.key === 'ArrowRight')
              setSplitPercent((value) => Math.min(maxPercent, value + 2));
          }}
        />

        {/* Right Code Editor Pane */}
        <section className="ide-right-pane">
          <div className="ide-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                aria-label="Programming language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as 'PYTHON' | 'JAVA' | 'CPP')}
                className="select-control"
                style={{ width: 150, padding: '6px 10px', fontSize: 12.5 }}
              >
                <option value="PYTHON">Python 3</option>
                <option value="JAVA">Java 21</option>
                <option value="CPP">C++ (GCC)</option>
              </select>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFontSize((f) => Math.max(12, f - 2))}
                  title="Decrease font size"
                >
                  A-
                </button>
                <span
                  className="muted-text tabular-nums"
                  style={{ fontSize: 12, padding: '0 4px' }}
                >
                  {fontSize}px
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFontSize((f) => Math.min(22, f + 2))}
                  title="Increase font size"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetToTemplate}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastSaved && (
                <span className="muted-text" style={{ fontSize: 11.5 }}>
                  Draft {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveCheckpoint}
              >
                <Save size={13} />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                <Send size={13} />
                <span>{submitting ? 'Saving…' : 'Submit Solution'}</span>
              </button>
            </div>
          </div>

          {feedbackMsg && (
            <div
              className="inline-banner"
              style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}
            >
              <span>{feedbackMsg}</span>
            </div>
          )}

          <div className="ide-code-area">
            <div
              ref={lineNumbersRef}
              className="ide-line-numbers tabular-nums"
              style={{ fontSize: `${fontSize}px` }}
              aria-hidden
            >
              {Array.from({ length: lineCount }).map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>
            <textarea
              className="ide-textarea"
              style={{ fontSize: `${fontSize}px` }}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              onScroll={(e) => {
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Code editor"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
