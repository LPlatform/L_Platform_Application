import React, { useEffect, useState, useCallback } from 'react';
import { fetchAssignments } from '../lib/api';
import type { Assignment, Question } from '../types';

interface DashboardProps {
  onSelectAssignment: (assignment: Assignment, question: Question) => void;
  isOnline: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectAssignment, isOnline }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignments();
      setAssignments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>Your Assigned Work</h2>
          <p className="subtitle">
            Select a problem to open the student workspace, code, test, and submit.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={loadAssignments}
          disabled={loading || !isOnline}
        >
          {loading ? 'Refreshing...' : 'Refresh Assignments'}
        </button>
      </div>

      {!isOnline && (
        <div className="alert alert-warning">
          You are currently in offline mode. Cached drafts can still be edited locally and will sync
          when reconnected.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading your assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <h3>No assignments found</h3>
          <p>You have no active assignments right now. Check back later or contact your teacher.</p>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="assignment-card">
              <div className="card-header">
                <div>
                  <span className="badge badge-published">{assignment.status}</span>
                  <h3>{assignment.title}</h3>
                </div>
                {assignment.dueDate && (
                  <span className="due-date">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {assignment.description && (
                <p className="assignment-desc">{assignment.description}</p>
              )}

              <div className="questions-section">
                <h4>Questions ({assignment.questions?.length || 0}):</h4>
                <div className="question-list">
                  {assignment.questions && assignment.questions.length > 0 ? (
                    assignment.questions.map((q, idx) => (
                      <div key={q.id} className="question-row">
                        <div className="q-info">
                          <span className="q-number">#{idx + 1}</span>
                          <span className="q-title">{q.title}</span>
                          <span className="q-points">({q.points} pts)</span>
                        </div>
                        <button
                          className="btn btn-primary-sm"
                          onClick={() => onSelectAssignment(assignment, q)}
                        >
                          Open Workspace →
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-questions">No problems attached to this assignment.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
