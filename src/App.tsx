import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Code2,
  GraduationCap,
  HelpCircle,
  Home,
  Library,
  School,
  Settings,
  TrendingUp,
} from 'lucide-react';
import type { User, Assignment, Question } from './types';
import { getStoredUser, clearAuthTokens, submitSolution } from './lib/api';
import { getQueuedSubmissions, clearQueuedSubmission } from './lib/storage';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Dashboard, type StudentSection } from './components/Dashboard';
import { Editor } from './components/Editor';

const primaryNav: Array<{
  id: StudentSection;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: 'overview', label: 'Overview', Icon: Home },
  { id: 'classes', label: 'My Classes', Icon: School },
  { id: 'learning', label: 'My Learning', Icon: BookOpen },
  { id: 'assessments', label: 'Assessments', Icon: ClipboardCheck },
  { id: 'assignments', label: 'Assignments', Icon: Code2 },
  { id: 'results', label: 'Results', Icon: BarChart3 },
  { id: 'progress', label: 'Progress', Icon: TrendingUp },
];

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
    <div className="desktop-shell">
      {currentView !== 'editor' && (
        <aside className="sidebar-nav" aria-label="Student Workspace navigation">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">LP</div>
            <div>
              <strong>L_Platform</strong>
              <span>Student Workspace</span>
            </div>
          </div>

          <span className="sidebar-section-label">Workspace</span>
          <nav className="sidebar-menu">
            {primaryNav.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`sidebar-item ${currentView === id ? 'active' : ''}`}
                aria-current={currentView === id ? 'page' : undefined}
                onClick={() => goTo(id)}
              >
                <span className="sidebar-item-left">
                  <Icon size={16} />
                  <span>{label}</span>
                </span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            className={`sidebar-library-callout ${currentView === 'library' ? 'active' : ''}`}
            onClick={() => goTo('library')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Library size={15} style={{ color: '#c4b5fd' }} />
              <strong>Learning Library</strong>
            </div>
            <span>Browse free platform courses &amp; school modules</span>
          </button>

          <div className="sidebar-footer">
            <button
              type="button"
              className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => goTo('settings')}
            >
              <span className="sidebar-item-left">
                <Settings size={16} />
                <span>Settings</span>
              </span>
            </button>
            <button
              type="button"
              className={`sidebar-item ${currentView === 'help' ? 'active' : ''}`}
              onClick={() => goTo('help')}
            >
              <span className="sidebar-item-left">
                <HelpCircle size={16} />
                <span>Help &amp; Support</span>
              </span>
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px 2px',
                fontSize: 11,
                color: '#64748b',
              }}
            >
              <GraduationCap size={13} />
              <span>{user.role.replaceAll('_', ' ')}</span>
            </div>
          </div>
        </aside>
      )}

      <div className="main-column">
        <Navbar
          user={user}
          onLogout={logout}
          isOnline={isOnline}
          queuedCount={queuedCount}
          onSync={syncQueuedSubmissions}
          currentView={currentView}
          onNavigateDashboard={() => goTo('assignments')}
          onOpenSettings={() => goTo('settings')}
        />

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
      </div>
    </div>
  );
};

export default App;
