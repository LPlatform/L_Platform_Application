import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Save,
  Send,
  Terminal,
  XCircle,
} from 'lucide-react';
import type { Assignment, Question, Submission } from '../types';
import { submitSolution, fetchSubmissionsForAssignment } from '../lib/api';
import { CodeEditor, type CodeLanguage } from './CodeEditor';
import { saveDraft, getDraft, clearDraft, queueOfflineSubmission } from '../lib/storage';
import { runAgainstTests, runPython, type TestRun } from '../lib/python-runner';

interface EditorProps {
  assignment: Assignment;
  question: Question;
  isOnline: boolean;
  onBack: () => void;
}

const STARTER_CODE: Record<CodeLanguage, string> = {
  PYTHON: `# Read input, then print the answer.\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
  JAVA: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your Java solution here\n    }\n}\n`,
  CPP: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    return 0;\n}\n`,
};

const LANG_LABEL: Record<CodeLanguage, string> = { PYTHON: 'Python 3', JAVA: 'Java', CPP: 'C++' };

type LeftTab = 'problem' | 'submissions';
type ConsoleTab = 'tests' | 'custom';

export const Editor: React.FC<EditorProps> = ({ assignment, question, isOnline, onBack }) => {
  const [language, setLanguage] = useState<CodeLanguage>('PYTHON');
  const [code, setCode] = useState('');
  const [leftTab, setLeftTab] = useState<LeftTab>('problem');
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('tests');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testRuns, setTestRuns] = useState<TestRun[] | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState<{ out: string; err: string } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'warn' | 'err'; text: string } | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fontSize, setFontSize] = useState(14);

  const sampleTests = (question.testCases ?? []).filter((tc) => !tc.isHidden);
  const canRun = language === 'PYTHON';

  const loadHistory = useCallback(async () => {
    if (!isOnline) return;
    try {
      const subs = await fetchSubmissionsForAssignment(assignment.id);
      setHistory(subs.filter((s) => s.questionId === question.id));
    } catch {
      /* history is optional */
    }
  }, [assignment.id, isOnline, question.id]);

  useEffect(() => {
    const draft = getDraft(assignment.id, question.id);
    if (draft) {
      setLanguage(draft.language as CodeLanguage);
      setCode(draft.code);
      setLastSaved(new Date(draft.updatedAt));
    } else {
      setCode(question.starterTemplates?.PYTHON || STARTER_CODE.PYTHON);
    }
    void loadHistory();
  }, [assignment.id, question.id, question.starterTemplates, loadHistory]);

  const persist = (next: string, lang = language) => {
    saveDraft(assignment.id, question.id, lang, next, false);
    setLastSaved(new Date());
  };

  const handleCodeChange = (next: string) => {
    setCode(next);
    persist(next);
  };

  const switchLanguage = (lang: CodeLanguage) => {
    setLanguage(lang);
    const starter = question.starterTemplates?.[lang] || STARTER_CODE[lang];
    setCode(starter);
    persist(starter, lang);
    setTestRuns(null);
  };

  const resetCode = () => {
    const starter = question.starterTemplates?.[language] || STARTER_CODE[language];
    setCode(starter);
    persist(starter);
  };

  const runTests = async () => {
    if (!canRun) return;
    setConsoleOpen(true);
    setRunning(true);
    setNotice(null);
    try {
      if (consoleTab === 'custom') {
        const r = await runPython(code, customInput);
        setCustomOutput({ out: r.stdout, err: r.stderr });
      } else if (sampleTests.length === 0) {
        setConsoleTab('custom');
        const r = await runPython(code, customInput);
        setCustomOutput({ out: r.stdout, err: r.stderr });
      } else {
        setTestRuns(await runAgainstTests(code, sampleTests));
      }
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'Could not run code.' });
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setNotice(null);
    const payload = {
      assignmentId: assignment.id,
      questionId: question.id,
      language,
      sourceCode: code,
    };
    if (!isOnline) {
      queueOfflineSubmission(payload);
      saveDraft(assignment.id, question.id, language, code, true);
      window.dispatchEvent(new Event('lp-queue-updated'));
      setNotice({
        kind: 'warn',
        text: 'You are offline. Saved and queued — it uploads automatically when you reconnect.',
      });
      setSubmitting(false);
      return;
    }
    try {
      await submitSolution(payload);
      clearDraft(assignment.id, question.id);
      setLastSaved(null);
      setNotice({
        kind: 'ok',
        text: 'Submitted! Your teacher will review and release your score.',
      });
      void loadHistory();
    } catch (err) {
      queueOfflineSubmission(payload);
      window.dispatchEvent(new Event('lp-queue-updated'));
      setNotice({
        kind: 'warn',
        text: `${err instanceof Error ? err.message : 'Network error'} — queued to retry automatically.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const passedCount = testRuns?.filter((t) => t.passed).length ?? 0;

  return (
    <div className="hr-workspace">
      <header className="hr-ws-bar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Challenges
        </button>
        <div className="hr-ws-title">
          <strong>{question.title}</strong>
          <span>
            {assignment.title}
            {question.difficulty ? ` · ${question.difficulty.toLowerCase()}` : ''} ·{' '}
            {question.points} pts
          </span>
        </div>
        <div className="hr-ws-actions">
          {lastSaved && (
            <span className="hr-saved">
              <Save size={12} /> Saved{' '}
              {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      <div className="hr-ws-body">
        <section className="hr-pane hr-problem">
          <div className="hr-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'problem'}
              onClick={() => setLeftTab('problem')}
            >
              Problem
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === 'submissions'}
              onClick={() => setLeftTab('submissions')}
            >
              Submissions {history.length > 0 && <span className="hr-count">{history.length}</span>}
            </button>
          </div>

          <div className="hr-pane-scroll">
            {leftTab === 'problem' ? (
              <>
                <h2 className="hr-problem-title">{question.title}</h2>
                <div className="hr-chip-row">
                  {question.difficulty && (
                    <span className={`hr-diff hr-diff-${question.difficulty.toLowerCase()}`}>
                      {question.difficulty.toLowerCase()}
                    </span>
                  )}
                  <span className="hr-chip">{question.points} points</span>
                  {question.topic && <span className="hr-chip">{question.topic}</span>}
                </div>
                <div className="hr-statement">{question.description}</div>
                {sampleTests.map((tc, i) => (
                  <div className="hr-sample" key={tc.id || i}>
                    <h4>Sample {i + 1}</h4>
                    <div className="hr-sample-grid">
                      <div>
                        <span>Input</span>
                        <pre>{tc.input || '(empty)'}</pre>
                      </div>
                      <div>
                        <span>Expected output</span>
                        <pre>{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : history.length === 0 ? (
              <p className="muted-text">No submissions yet.</p>
            ) : (
              <ul className="hr-history">
                {history.map((s) => (
                  <li key={s.id}>
                    <span>
                      <strong>{LANG_LABEL[s.language as CodeLanguage] ?? s.language}</strong>
                      <small>{new Date(s.createdAt).toLocaleString()}</small>
                    </span>
                    <span className="hr-chip">
                      {s.feedbackReleasedAt && s.score != null
                        ? `${s.score} pts`
                        : s.status.replaceAll('_', ' ').toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="hr-pane hr-code">
          <div className="hr-code-bar">
            <select
              aria-label="Language"
              className="select-control hr-lang"
              value={language}
              onChange={(e) => switchLanguage(e.target.value as CodeLanguage)}
            >
              {(Object.keys(LANG_LABEL) as CodeLanguage[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_LABEL[l]}
                </option>
              ))}
            </select>
            <div className="hr-code-tools">
              <button
                type="button"
                className="icon-btn"
                title="Smaller text"
                onClick={() => setFontSize((f) => Math.max(12, f - 1))}
              >
                A-
              </button>
              <button
                type="button"
                className="icon-btn"
                title="Bigger text"
                onClick={() => setFontSize((f) => Math.min(22, f + 1))}
              >
                A+
              </button>
              <button
                type="button"
                className="icon-btn"
                title="Reset to starter code"
                onClick={resetCode}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <div className="hr-editor">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
              fontSize={fontSize}
              onSave={() => persist(code)}
              onRun={() => void runTests()}
            />
          </div>

          <div className={`hr-console ${consoleOpen ? 'open' : ''}`}>
            <div className="hr-console-bar">
              <button
                type="button"
                className="hr-console-toggle"
                onClick={() => setConsoleOpen((o) => !o)}
              >
                <Terminal size={14} /> Console
              </button>
              {consoleOpen && (
                <div className="hr-tabs hr-tabs-sm">
                  <button
                    type="button"
                    aria-selected={consoleTab === 'tests'}
                    onClick={() => setConsoleTab('tests')}
                  >
                    Test cases
                  </button>
                  <button
                    type="button"
                    aria-selected={consoleTab === 'custom'}
                    onClick={() => setConsoleTab('custom')}
                  >
                    Custom input
                  </button>
                </div>
              )}
              <div className="hr-run-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void runTests()}
                  disabled={!canRun || running}
                  title={
                    canRun ? 'Run against sample tests (Ctrl+Enter)' : 'Run is available for Python'
                  }
                >
                  <Play size={13} /> {running ? 'Running…' : 'Run code'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void submit()}
                  disabled={submitting}
                >
                  <Send size={13} /> {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>

            {notice && <div className={`hr-notice hr-notice-${notice.kind}`}>{notice.text}</div>}

            {consoleOpen && (
              <div className="hr-console-body">
                {!canRun && (
                  <p className="muted-text">
                    Running code in the app is available for Python. Java and C++ answers are
                    checked by your teacher after you submit.
                  </p>
                )}
                {canRun && consoleTab === 'tests' && (
                  <>
                    {testRuns == null ? (
                      <p className="muted-text">
                        {sampleTests.length > 0
                          ? 'Click “Run code” to check your solution against the sample test cases.'
                          : 'This problem has no sample tests. Use “Custom input” to try your code.'}
                      </p>
                    ) : (
                      <>
                        <div
                          className={`hr-summary ${passedCount === testRuns.length ? 'all' : ''}`}
                        >
                          {passedCount === testRuns.length ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <XCircle size={16} />
                          )}
                          {passedCount}/{testRuns.length} sample tests passed
                        </div>
                        <div className="hr-cases">
                          {testRuns.map((t) => (
                            <details
                              key={t.index}
                              className={`hr-case ${t.passed ? 'pass' : 'fail'}`}
                              open={!t.passed}
                            >
                              <summary>
                                {t.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />} Test
                                case {t.index + 1}
                                <span className="hr-ms">
                                  <Clock size={11} /> {t.ms} ms
                                </span>
                              </summary>
                              <div className="hr-io">
                                <div>
                                  <span>Input</span>
                                  <pre>{t.input || '(empty)'}</pre>
                                </div>
                                <div>
                                  <span>Your output</span>
                                  <pre>{t.actual || '(nothing printed)'}</pre>
                                </div>
                                <div>
                                  <span>Expected</span>
                                  <pre>{t.expected}</pre>
                                </div>
                              </div>
                              {t.error && <pre className="hr-err">{t.error}</pre>}
                            </details>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
                {canRun && consoleTab === 'custom' && (
                  <div className="hr-custom">
                    <label>
                      <span>Input (stdin)</span>
                      <textarea
                        className="textarea-control"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Type the input your program reads with input()"
                      />
                    </label>
                    <div>
                      <span>Output</span>
                      <pre>
                        {customOutput
                          ? customOutput.out || '(nothing printed)'
                          : 'Run your code to see output.'}
                      </pre>
                      {customOutput?.err && <pre className="hr-err">{customOutput.err}</pre>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
