import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Code2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Server,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { getApiBaseUrl, login, setApiBaseUrl } from '../lib/api';
import type { User } from '../types';

interface LoginProps {
  onSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backendUrl, setBackendUrl] = useState(getApiBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedUrl = backendUrl.trim() || 'http://localhost:3001';
      setApiBaseUrl(normalizedUrl);
      const data = await login(email.trim(), password);
      onSuccess(data.user);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to sign in. Check your credentials or server.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (studentEmail: string) => {
    if (!import.meta.env.DEV) return;
    setEmail(studentEmail);
    setPassword('Student@123');
    setError('');
  };

  return (
    <div className="login-shell">
      <header className="login-topbar">
        <div className="login-brand">
          <span className="brand-mark">LP</span>
          <div className="login-brand-text">
            <strong>L_Platform</strong>
            <span>Student app</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowServerConfig((v) => !v)}
        >
          <Server size={14} />
          <span>{showServerConfig ? 'Hide Server URL' : 'Server Configuration'}</span>
        </button>
      </header>

      <main className="login-grid">
        <section className="login-hero">
          <span className="pill pill-violet">
            <Sparkles size={12} />
            Student Learning &amp; Coding Environment
          </span>
          <h1>
            Learn, Code, and Master Skills{' '}
            <span className="gradient-phrase">Online or Offline</span>
          </h1>
          <p className="login-hero-copy">
            Join your school classes with an invite code, read structured interactive courses,
            complete assessments, and practice Python, Java, and C++ right from your desktop.
          </p>

          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <BookOpen size={16} />
              </div>
              <div>
                <strong>Structured Courses</strong>
                <span>Free platform courses &amp; school curriculum modules</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Code2 size={16} />
              </div>
              <div>
                <strong>Multi-Language IDE</strong>
                <span>Python 3, Java 21, and C++ with starter templates</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <GraduationCap size={16} />
              </div>
              <div>
                <strong>Assessments &amp; Grades</strong>
                <span>Autosaved attempts and teacher rubric feedback</span>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <WifiOff size={16} />
              </div>
              <div>
                <strong>Offline Resilience</strong>
                <span>Local draft autosave &amp; queued sync when reconnected</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <span className="eyebrow">Student Sign In</span>
            <h2>Welcome back</h2>
            <p className="muted-text">
              Sign in with your L_Platform student account to open your classes and coursework.
            </p>
          </div>

          {error && (
            <div className="inline-banner danger" role="alert" style={{ marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="student-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={15} className="leading-icon" />
                <input
                  id="student-email"
                  type="email"
                  className="input-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@school.edu"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="student-password">Password</label>
              <div className="input-with-icon">
                <Lock size={15} className="leading-icon" />
                <input
                  id="student-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {showServerConfig && (
              <div className="server-config-box">
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="backend-url-input">L_Platform API Endpoint</label>
                  <input
                    id="backend-url-input"
                    type="url"
                    className="input-control"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
              {loading ? 'Authenticating…' : 'Sign in'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="quick-accounts">
              <span className="quick-accounts-label">Local Seeded Student Accounts</span>
              <div className="quick-account-grid">
                <button
                  type="button"
                  className="quick-account-btn"
                  onClick={() => handleQuickFill('student1@riverside.edu')}
                >
                  <strong>Alice Student</strong>
                  <span>student1@riverside.edu</span>
                </button>
                <button
                  type="button"
                  className="quick-account-btn"
                  onClick={() => handleQuickFill('student2@riverside.edu')}
                >
                  <strong>Bob Smith</strong>
                  <span>student2@riverside.edu</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="login-topbar" style={{ justifyContent: 'center' }}>
        <span className="muted-text" style={{ fontSize: 12 }}>
          Connected API target: <code>{backendUrl}</code>
        </span>
      </footer>
    </div>
  );
};
