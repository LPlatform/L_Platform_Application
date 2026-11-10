import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Assignment, Question, Submission } from '../types';
import { saveDraft, getDraft, queueOfflineSubmission } from '../lib/storage';
import { submitSolution, fetchSubmissionsForAssignment } from '../lib/api';

interface EditorProps {
  assignment: Assignment;
  question: Question;
  isOnline: boolean;
  onBack: () => void;
}

const DEFAULT_STARTERS: Record<string, string> = {
  PYTHON: `# Write your Python solution here\nimport sys\n\ndef main():\n    line = sys.stdin.read().strip()\n    if not line:\n        return\n    # Process input\n    print(line)\n\nif __name__ == '__main__':\n    main()\n`,
  JAVA: `import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if (scanner.hasNextLine()) {\n            String line = scanner.nextLine();\n            System.out.println(line);\n        }\n    }\n}\n`,
  CPP: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    string line;\n    if (getline(cin, line)) {\n        cout << line << endl;\n    }\n    return 0;\n}\n`,
};

export const Editor: React.FC<EditorProps> = ({ assignment, question, isOnline, onBack }) => {
  const [language, setLanguage] = useState<'PYTHON' | 'JAVA' | 'CPP'>('PYTHON');
  const [code, setCode] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [previousSubmissions, setPreviousSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'problem' | 'tests' | 'results' | 'history'>(
    'problem',
  );
  const [fontSize, setFontSize] = useState<number>(14);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load starter or existing draft
  useEffect(() => {
    const draft = getDraft(assignment.id, question.id);
    if (draft) {
      setLanguage(draft.language);
      setCode(draft.code);
      setLastSaved(new Date(draft.updatedAt));
    } else {
      const template = question.starterTemplates?.[language] || DEFAULT_STARTERS[language];
      setCode(template);
    }
  }, [assignment.id, question.id, question.starterTemplates, language]);

  // Load previous submissions
  const loadSubmissions = useCallback(async () => {
    if (!isOnline) return;
    try {
      const allSubs = await fetchSubmissionsForAssignment(assignment.id);
      const filtered = allSubs.filter((s) => s.questionId === question.id);
      setPreviousSubmissions(filtered);
    } catch {
      // ignore
    }
  }, [assignment.id, question.id, isOnline]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Handle code change and draft auto-save
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    saveDraft(assignment.id, question.id, language, val, false);
    setLastSaved(new Date());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.substring(0, start) + '    ' + code.substring(end);
      setCode(updated);
      saveDraft(assignment.id, question.id, language, updated, false);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleLanguageChange = (newLang: 'PYTHON' | 'JAVA' | 'CPP') => {
    setLanguage(newLang);
    const template = question.starterTemplates?.[newLang] || DEFAULT_STARTERS[newLang];
    setCode(template);
    saveDraft(assignment.id, question.id, newLang, template, false);
    setLastSaved(new Date());
  };

  const handleResetToTemplate = () => {
    if (confirm('Reset code to the original template? Current changes will be overwritten.')) {
      const template = question.starterTemplates?.[language] || DEFAULT_STARTERS[language];
      setCode(template);
      saveDraft(assignment.id, question.id, language, template, false);
      setLastSaved(new Date());
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedbackMsg(null);

    if (!isOnline) {
      queueOfflineSubmission({
        assignmentId: assignment.id,
        questionId: question.id,
        language,
        sourceCode: code,
      });
      setFeedbackMsg('Offline: submission saved to sync queue. Will execute when connected.');
      setSubmitting(false);
      return;
    }

    try {
      const result = await submitSolution({
        assignmentId: assignment.id,
        questionId: question.id,
        language,
        sourceCode: code,
      });
      setCurrentSubmission(result);
      setActiveTab('results');
      loadSubmissions();
      setFeedbackMsg('Submission evaluated successfully.');
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Evaluation submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Line numbers calculation
  const lineCount = useMemo(() => {
    return Math.max(code.split('\n').length, 1);
  }, [code]);

  return (
    <div className="workspace-container">
      {/* Sidebar / Left Pane: Problem Description & Test Cases */}
      <div className="workspace-left">
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'problem' ? 'active' : ''}`}
            onClick={() => setActiveTab('problem')}
          >
            Problem Description
          </button>
          <button
            className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            Sample Cases
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Execution Results {currentSubmission ? `(${currentSubmission.score ?? 0}%)` : ''}
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History ({previousSubmissions.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'problem' && (
            <div className="problem-view">
              <h2>{question.title}</h2>
              <div className="badge-row">
                <span className="badge badge-info">{question.points} Points</span>
                <span className="badge badge-secondary">{assignment.title}</span>
              </div>
              <div className="problem-body">
                <p>{question.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="testcases-view">
              <h3>Visible Test Cases</h3>
              {question.testCases && question.testCases.length > 0 ? (
                question.testCases
                  .filter((tc) => !tc.isHidden)
                  .map((tc, i) => (
                    <div key={tc.id || i} className="case-card">
                      <span className="case-title">Sample Case #{i + 1}</span>
                      <div className="io-group">
                        <label>Input:</label>
                        <pre>{tc.input || '(empty)'}</pre>
                      </div>
                      <div className="io-group">
                        <label>Expected Output:</label>
                        <pre>{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="no-cases">No visible sample test cases provided.</p>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="results-view">
              <h3>Evaluation Results</h3>
              {currentSubmission ? (
                <div>
                  <div className="result-summary">
                    <div className="summary-item">
                      <span>Status:</span>
                      <strong className={`status-${currentSubmission.status.toLowerCase()}`}>
                        {currentSubmission.status}
                      </strong>
                    </div>
                    <div className="summary-item">
                      <span>Score:</span>
                      <strong>{currentSubmission.score ?? 0} / 100</strong>
                    </div>
                    <div className="summary-item">
                      <span>Language:</span>
                      <strong>{currentSubmission.language}</strong>
                    </div>
                  </div>

                  <div className="test-results-list">
                    <h4>Test Case Execution:</h4>
                    {currentSubmission.results && currentSubmission.results.length > 0 ? (
                      currentSubmission.results.map((res, i) => (
                        <div
                          key={res.id || i}
                          className={`test-result-item ${res.passed ? 'passed' : 'failed'}`}
                        >
                          <div className="result-header">
                            <span className="result-indicator">
                              {res.passed ? '✓ PASSED' : '✗ FAILED'}
                            </span>
                            <span className="case-label">Case #{i + 1}</span>
                            {res.executionTimeMs != null && (
                              <span className="time-label">{res.executionTimeMs}ms</span>
                            )}
                          </div>
                          {res.actualOutput && (
                            <div className="output-diff">
                              <label>Actual Output:</label>
                              <pre>{res.actualOutput}</pre>
                            </div>
                          )}
                          {res.errorMessage && (
                            <div className="output-err">
                              <label>Error / Stderr:</label>
                              <pre>{res.errorMessage}</pre>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No test results available.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="empty-results">
                  Click &apos;Run &amp; Submit Code&apos; to evaluate your solution.
                </p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-view">
              <h3>Submission History</h3>
              {previousSubmissions.length === 0 ? (
                <p>No previous submissions found for this question.</p>
              ) : (
                <div className="history-list">
                  {previousSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="history-card"
                      onClick={() => {
                        setCurrentSubmission(sub);
                        setActiveTab('results');
                      }}
                    >
                      <div className="history-card-header">
                        <span className={`status-${sub.status.toLowerCase()}`}>{sub.status}</span>
                        <span className="history-score">Score: {sub.score ?? 0}%</span>
                      </div>
                      <div className="history-meta">
                        <span>{sub.language}</span>
                        <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor / Right Pane: Code Area */}
      <div className="workspace-right">
        {/* Editor Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as 'PYTHON' | 'JAVA' | 'CPP')}
              className="lang-select"
            >
              <option value="PYTHON">Python 3</option>
              <option value="JAVA">Java 21</option>
              <option value="CPP">C++ (GCC)</option>
            </select>

            <div className="font-controls">
              <button
                type="button"
                className="font-btn"
                onClick={() => setFontSize((f) => Math.max(12, f - 2))}
                title="Decrease Font"
              >
                A-
              </button>
              <span className="font-label">{fontSize}px</span>
              <button
                type="button"
                className="font-btn"
                onClick={() => setFontSize((f) => Math.min(22, f + 2))}
                title="Increase Font"
              >
                A+
              </button>
            </div>

            <button type="button" className="btn btn-outline-sm" onClick={handleResetToTemplate}>
              Reset Template
            </button>
          </div>

          <div className="toolbar-right">
            {lastSaved && (
              <span className="draft-saved">Draft saved: {lastSaved.toLocaleTimeString()}</span>
            )}
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Evaluating...' : 'Run & Submit Solution →'}
            </button>
          </div>
        </div>

        {feedbackMsg && <div className="feedback-banner">{feedbackMsg}</div>}

        {/* Code Input Area with Line Numbers */}
        <div className="editor-container">
          <div className="line-numbers" style={{ fontSize: `${fontSize}px` }}>
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="line-no">
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            className="code-textarea"
            style={{ fontSize: `${fontSize}px` }}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </div>
  );
};
