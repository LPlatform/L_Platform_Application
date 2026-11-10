import React from 'react';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  isOnline: boolean;
  queuedCount: number;
  onSync: () => void;
  currentView: 'dashboard' | 'editor';
  onNavigateDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  isOnline,
  queuedCount,
  onSync,
  currentView,
  onNavigateDashboard,
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <span className="logo-badge">LP</span>
        <h1 className="header-title">L_Platform Student Workspace</h1>
        {currentView === 'editor' && (
          <button className="nav-link-btn" onClick={onNavigateDashboard}>
            ← Back to Assignments
          </button>
        )}
      </div>

      <div className="header-right">
        <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>

        {queuedCount > 0 && (
          <button
            className="sync-badge-btn"
            onClick={onSync}
            title="Click to sync queued submissions"
          >
            Pending Sync ({queuedCount})
          </button>
        )}

        {user && (
          <div className="user-profile">
            <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.email}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
