import React, { useEffect, useRef, useState } from 'react';
import { CloudOff, HelpCircle, LogOut, RefreshCw, Settings } from 'lucide-react';
import type { User } from '../types';
import type { StudentSection } from './Dashboard';

export const NAV_ITEMS: Array<{ id: StudentSection; label: string }> = [
  { id: 'overview', label: 'Dashboard' },
  { id: 'learning', label: 'AI Course' },
  { id: 'assignments', label: 'Challenges' },
  { id: 'assessments', label: 'Tests' },
  { id: 'classes', label: 'Classes' },
  { id: 'results', label: 'Results' },
  { id: 'library', label: 'Library' },
];

interface TopNavProps {
  user: User;
  active: StudentSection | 'editor';
  isOnline: boolean;
  queuedCount: number;
  onNavigate: (section: StudentSection) => void;
  onSync: () => Promise<void> | void;
  onLogout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  user,
  active,
  isOnline,
  queuedCount,
  onNavigate,
  onSync,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const current = active === 'editor' ? 'assignments' : active;

  return (
    <header className="hr-topnav">
      <button type="button" className="hr-brand" onClick={() => onNavigate('overview')}>
        <span className="hr-brand-mark">LP</span>
        <span>L Platform</span>
      </button>

      <nav className="hr-nav" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={current === item.id ? 'active' : ''}
            aria-current={current === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="hr-nav-right">
        {!isOnline ? (
          <span className="hr-pill-offline">
            <CloudOff size={13} /> Offline
          </span>
        ) : queuedCount > 0 ? (
          <button
            type="button"
            className="hr-pill-sync"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              await onSync();
              setSyncing(false);
            }}
          >
            <RefreshCw size={13} /> Sync {queuedCount}
          </button>
        ) : null}

        <div className="hr-user" ref={menuRef}>
          <button
            type="button"
            className="hr-avatar"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            title={user.email}
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="hr-menu" role="menu">
              <div className="hr-menu-head">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => (setMenuOpen(false), onNavigate('settings'))}
              >
                <Settings size={14} /> Settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => (setMenuOpen(false), onNavigate('help'))}
              >
                <HelpCircle size={14} /> Help
              </button>
              <button type="button" role="menuitem" onClick={onLogout}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
