import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';
import { USER_ROLES, authenticateStaff, authenticateParent, setAuthSession } from '../lib/auth';

export default function LoginModal({ onLoginSuccess, students = [] }) {
  const [activeRole, setActiveRole] = useState(USER_ROLES.ADMIN);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parentIdentifier, setParentIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleTabChange = (role) => {
    setActiveRole(role);
    setErrorMsg('');
    setUsername('');
    setPassword('');
    setParentIdentifier('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeRole === USER_ROLES.PARENT) {
      const res = authenticateParent(parentIdentifier, students);
      if (res.success) {
        setAuthSession(res.user);
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = authenticateStaff(username, password, activeRole);
      if (res.success) {
        setAuthSession(res.user);
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="login-backdrop">
      <div className="login-card">
        {/* Header with Academy Branding */}
        <div className="login-header">
          <div className="logo-center">
            <HayagrivaLogo size={52} showGlow={true} />
          </div>
          <h1 className="login-title">HAYAGRIVA TUTORIALS</h1>
          <p className="login-subtitle">Classes 1 to 10 Coaching & Tuition Academy</p>
          <div className="role-instruction">Select your portal to continue:</div>
        </div>

        {/* 3 Role Selection Tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab-btn ${activeRole === USER_ROLES.ADMIN ? 'active' : ''}`}
            onClick={() => handleRoleTabChange(USER_ROLES.ADMIN)}
          >
            <ShieldCheck size={18} />
            <span>Admin</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${activeRole === USER_ROLES.TEACHER ? 'active' : ''}`}
            onClick={() => handleRoleTabChange(USER_ROLES.TEACHER)}
          >
            <GraduationCap size={18} />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${activeRole === USER_ROLES.PARENT ? 'active' : ''}`}
            onClick={() => handleRoleTabChange(USER_ROLES.PARENT)}
          >
            <Users size={18} />
            <span>Parent</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="login-error-alert">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {activeRole === USER_ROLES.PARENT ? (
            <div className="form-group">
              <label className="form-label">Registered Mobile or Admission No.</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter 10-digit mobile number"
                  value={parentIdentifier}
                  onChange={(e) => setParentIdentifier(e.target.value)}
                  className="form-input with-left-icon"
                />
              </div>
              <p className="field-hint">
                Enter the mobile number given during your child's tuition admission. No password needed.
              </p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  {activeRole === USER_ROLES.ADMIN ? 'Admin Username or Email' : 'Teacher Username or Email'}
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={activeRole === USER_ROLES.ADMIN ? 'Enter admin username' : 'Enter teacher username'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input with-left-icon"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password / Security PIN</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input with-left-icon with-right-icon"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary submit-login-btn">
            <span>Login to {activeRole === USER_ROLES.ADMIN ? 'Admin Dashboard' : activeRole === USER_ROLES.TEACHER ? 'Teacher Portal' : 'Parent Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-security-footer">
          <ShieldCheck size={13} className="text-muted" />
          <span>Secure Tuition Portal • Hayagriva Tutorials</span>
        </div>
      </div>

      <style>{`
        .login-backdrop {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at 50% 20%, rgba(30, 41, 59, 0.95), rgba(11, 15, 25, 0.98));
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }
        .login-card {
          width: 100%;
          max-width: 460px;
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15);
          padding: 32px 28px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo-center {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }
        .login-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: white;
          margin-bottom: 4px;
        }
        .login-subtitle {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-bottom: 14px;
        }
        .role-instruction {
          font-size: 0.775rem;
          color: #A5B4FC;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .role-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          background: rgba(15, 23, 42, 0.6);
          padding: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }
        .role-tab-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-tab-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .role-tab-btn.active {
          color: white;
          background: var(--primary-600);
          box-shadow: 0 2px 10px rgba(79, 70, 229, 0.4);
        }
        .login-error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(244, 63, 94, 0.14);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #FB7185;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          margin-bottom: 16px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .with-left-icon {
          padding-left: 38px !important;
        }
        .field-hint {
          font-size: 0.725rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .submit-login-btn {
          width: 100%;
          padding: 11px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }
        .with-right-icon {
          padding-right: 38px !important;
        }
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: color 0.2s ease;
        }
        .password-toggle-btn:hover {
          color: white;
        }
        .login-security-footer {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.725rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
        }
      `}</style>
    </div>
  );
}
