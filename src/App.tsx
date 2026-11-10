import React, { useState, useEffect, useCallback } from 'react';
import type { User, Assignment, Question } from './types';
import { getStoredUser, clearAuthTokens, submitSolution } from './lib/api';
import { getQueuedSubmissions, clearQueuedSubmission } from './lib/storage';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [queuedCount, setQueuedCount] = useState<number>(0);

  // Check stored user session
  useEffect(() => {
    getStoredUser().then((stored) => {
      if (stored) {
        setUser(stored);
      }
      setLoading(false);
    });
  }, []);

  // Update queued submissions count
  const updateQueueCount = useCallback(() => {
    const queue = getQueuedSubmissions();
    setQueuedCount(queue.length);
  }, []);

  useEffect(() => {
    updateQueueCount();
  }, [updateQueueCount]);

  // Sync queued submissions when reconnected
  const syncQueuedSubmissions = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = getQueuedSubmissions();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        await submitSolution({
          assignmentId: item.assignmentId,
          questionId: item.questionId,
          language: item.language,
          sourceCode: item.sourceCode,
        });
        clearQueuedSubmission(item.id);
      } catch {
        // If error, leave in queue to retry next time
      }
    }
    updateQueueCount();
  }, [updateQueueCount]);

  // Monitor network online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedSubmissions();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueuedSubmissions]);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    void clearAuthTokens();
    setUser(null);
    setCurrentView('dashboard');
    setSelectedAssignment(null);
    setSelectedQuestion(null);
  };

  const handleSelectAssignment = (assignment: Assignment, question: Question) => {
    setSelectedAssignment(assignment);
    setSelectedQuestion(question);
    setCurrentView('editor');
  };

  const handleNavigateDashboard = () => {
    setCurrentView('dashboard');
    setSelectedAssignment(null);
    setSelectedQuestion(null);
  };

  if (loading) {
    return <div className="loading-screen">Initializing Workspace...</div>;
  }

  if (!user) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onLogout={handleLogout}
        isOnline={isOnline}
        queuedCount={queuedCount}
        onSync={syncQueuedSubmissions}
        currentView={currentView}
        onNavigateDashboard={handleNavigateDashboard}
      />

      {currentView === 'dashboard' && (
        <Dashboard onSelectAssignment={handleSelectAssignment} isOnline={isOnline} />
      )}

      {currentView === 'editor' && selectedAssignment && selectedQuestion && (
        <Editor
          assignment={selectedAssignment}
          question={selectedQuestion}
          isOnline={isOnline}
          onBack={handleNavigateDashboard}
        />
      )}
    </div>
  );
};
export default App;
