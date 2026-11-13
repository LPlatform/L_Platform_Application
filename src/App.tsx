import React, { useCallback, useEffect, useState } from 'react';
import type { User, Assignment, Question } from './types';
import { getStoredUser, clearAuthTokens, submitSolution } from './lib/api';
import { getQueuedSubmissions, clearQueuedSubmission } from './lib/storage';
import { TopNav } from './components/TopNav';
import { Login } from './components/Login';
import { Dashboard, type StudentSection } from './components/Dashboard';
import { Editor } from './components/Editor';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [currentView, setCurrentView] = useState<StudentSection | 'editor'>('overview');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    getStoredUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setCurrentView('overview');
      setSelectedAssignment(null);
      setSelectedQuestion(null);
    };
    window.addEventListener('lp-auth-expired', handleExpired);
    return () => window.removeEventListener('lp-auth-expired', handleExpired);
  }, []);

  const updateQueueCount = useCallback(() => setQueuedCount(getQueuedSubmissions().length), []);

  useEffect(() => {
    updateQueueCount();
    window.addEventListener('lp-queue-updated', updateQueueCount);
    return () => window.removeEventListener('lp-queue-updated', updateQueueCount);
  }, [updateQueueCount]);

  const syncQueuedSubmissions = useCallback(async () => {
    if (!navigator.onLine) return;
    for (const item of getQueuedSubmissions()) {
      try {
        await submitSolution({
          assignmentId: item.assignmentId,
          questionId: item.questionId,
          language: item.language,
          sourceCode: item.sourceCode,
        });
        clearQueuedSubmission(item.id);
      } catch {
        break;
      }
    }
    updateQueueCount();
  }, [updateQueueCount]);

  useEffect(() => {
    const online = () => {
      setIsOnline(true);
      void syncQueuedSubmissions();
    };
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [syncQueuedSubmissions]);

  function goTo(section: StudentSection) {
    setCurrentView(section);
    setSelectedAssignment(null);
    setSelectedQuestion(null);
  }

  function logout() {
    void clearAuthTokens();
    setUser(null);
    setCurrentView('overview');
    setSelectedAssignment(null);
    setSelectedQuestion(null);
  }

  function selectAssignment(assignment: Assignment, question: Question) {
    setSelectedAssignment(assignment);
    setSelectedQuestion(question);
    setCurrentView('editor');
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="brand-mark">LP</span>
        <p>Opening Student Workspace…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          goTo('overview');
        }}
      />
    );
  }

  const section: StudentSection = currentView === 'editor' ? 'assignments' : currentView;

  return (
    <div className="hr-app">
      <TopNav
        user={user}
        active={currentView}
        isOnline={isOnline}
        queuedCount={queuedCount}
        onNavigate={goTo}
        onSync={syncQueuedSubmissions}
        onLogout={logout}
      />
      <main className="hr-main">
        {currentView === 'editor' && selectedAssignment && selectedQuestion ? (
          <Editor
            assignment={selectedAssignment}
            question={selectedQuestion}
            isOnline={isOnline}
            onBack={() => goTo('assignments')}
          />
        ) : (
          <Dashboard
            user={user}
            section={section}
            onNavigate={goTo}
            onSelectAssignment={selectAssignment}
            isOnline={isOnline}
            onSync={syncQueuedSubmissions}
          />
        )}
      </main>
    </div>
  );
};

export default App;
