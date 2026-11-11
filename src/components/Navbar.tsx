import React, { useState } from 'react';
import { Bell, CloudOff, LogOut, RefreshCw, Settings, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

export interface NavbarNotification {
  id: string;
  title: string;
  detail: string;
}

interface NavbarProps {
  user: User;
  onLogout: () => void;
  isOnline: boolean;
  queuedCount: number;
  onSync: () => Promise<void> | void;
  currentView: string;
  onNavigateDashboard: () => void;
  onOpenSettings?: () => void;
  notifications?: NavbarNotification[];
}

const VIEW_LABELS: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Student Overview', subtitle: 'Courses, upcoming coursework & progress' },
  classes: { title: 'My Classes', subtitle: 'Enrolled sections, teachers & invite codes' },
  learning: { title: 'AI Readiness Course', subtitle: 'Interactive curriculum & module reader' },
  assessments: { title: 'Assessments', subtitle: 'Published quizzes & module evaluations' },
  assignments: { title: 'Coding Assignments', subtitle: 'Practice & graded programming tasks' },
  results: {
    title: 'Results & Feedback',
    subtitle: 'Released scores, rubrics & submission status',
  },
  progress: { title: 'Learning Progress', subtitle: 'Modules completed & assessment metrics' },
  library: { title: 'Learning Library', subtitle: 'Platform free courses & school allocations' },
  settings: { title: 'Settings', subtitle: 'API connection, drafts & offline storage' },
  help: { title: 'Help & Support', subtitle: 'Shortcuts, offline sync & workspace guide' },
  editor: { title: 'Coding Workspace', subtitle: 'Python 3 · Java 21 · C++' },
};

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  isOnline,
  queuedCount,
  onSync,
  currentView,
  onNavigateDashboard: _onNavigateDashboard,
  onOpenSettings,
  notifications = [],
}) => {
  const [syncing, setSyncing] = useState(false);
  const [showBell, setShowBell] = useState(false);

  const meta = VIEW_LABELS[currentView] ?? {
    title: 'Student Workspace',
    subtitle: 'L_Platform Desktop',
  };

  const initials =
    user.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'ST';

  const handleSyncClick = async () => {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title-block">
          <strong>{meta.title}</strong>
          <span>{meta.subtitle}</span>
        </div>
      </div>

      <div className="topbar-right">
        {queuedCount > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!isOnline || syncing}
            onClick={() => void handleSyncClick()}
            title="Upload queued offline submissions to backend"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing…' : `Sync ${queuedCount} queued`}</span>
          </button>
        )}

        <div
          className={`connection-pill ${isOnline ? 'online' : 'offline'}`}
          title={
            isOnline
              ? 'Connected to L_Platform backend'
              : 'Offline mode: local drafts and course reader cache active'
          }
        >
          {isOnline ? <span className="status-dot" /> : <CloudOff size={13} />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>

        <div className="popover-anchor">
          <button
            type="button"
            className="icon-btn"
            aria-label="Workspace notifications"
            onClick={() => setShowBell((v) => !v)}
          >
            <Bell size={16} />
            {(queuedCount > 0 || notifications.length > 0) && <span className="icon-btn-dot" />}
          </button>

          {showBell && (
            <div className="popover-menu" role="dialog" aria-label="Notifications">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <strong style={{ fontSize: 13 }}>Workspace Status</strong>
                <button type="button" className="link-btn" onClick={() => setShowBell(false)}>
                  Close
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {queuedCount > 0 && (
                  <div className="panel-item-row">
                    <div className="panel-item-meta">
                      <strong>{queuedCount} offline submission(s) waiting</strong>
                      <span>Will sync automatically when network returns.</span>
                    </div>
                  </div>
                )}
                {notifications.length > 0 ? (
                  notifications.slice(0, 4).map((item) => (
                    <div className="panel-item-row" key={item.id}>
                      <div className="panel-item-meta">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </div>
                  ))
                ) : queuedCount === 0 ? (
                  <p className="muted-text" style={{ fontSize: 12 }}>
                    All synced. No pending offline alerts.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="user-pill">
          <div className="user-avatar" aria-hidden>
            {initials}
          </div>
          <div className="user-meta">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Open Settings"
              style={{ padding: 5 }}
            >
              <Settings size={14} />
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{ padding: 5, color: '#fca5a5' }}
          >
            <LogOut size={14} />
          </button>
        </div>
        <span className="sr-only">
          <UserIcon size={12} /> {user.role}
        </span>
      </div>
    </header>
  );
};
