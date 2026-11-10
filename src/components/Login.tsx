import React, { useState } from 'react';
import { login, setApiBaseUrl, getApiBaseUrl } from '../lib/api';
import type { User } from '../types';

interface LoginProps {
  onSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('student1@riverside.edu');
  const [password, setPassword] = useState('Student@123');
  const [backendUrl, setBackendUrl] = useState(getApiBaseUrl());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setApiBaseUrl(backendUrl);
      const res = await login(email, password);
      onSuccess(res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Student@123');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">L</div>
          <h2>Student Desktop Workspace</h2>
          <p>Sign in to access your coding assignments and run solutions</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Student Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="student1@riverside.edu"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="backendUrl">Backend Server URL</label>
            <input
              id="backendUrl"
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              required
              placeholder="http://localhost:3001"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="demo-accounts">
          <span className="demo-title">Quick Demo Logins:</span>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-outline-sm"
              onClick={() => handleDemoFill('student1@riverside.edu')}
            >
              student1@riverside.edu
            </button>
            <button
              type="button"
              className="btn btn-outline-sm"
              onClick={() => handleDemoFill('student2@riverside.edu')}
            >
              student2@riverside.edu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
