import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';
import { USER_ROLES, authenticateStaff, authenticateParent, setAuthSession } from '../lib/auth';

export default function LoginModal({ onLoginSuccess, students = [] }) {
  const [activeRole, setActiveRole] = useState(USER_ROLES.ADMIN);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [parentIdentifier, setParentIdentifier] = useState('9876543210');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleTabChange = (role) => {
    setActiveRole(role);
    setErrorMsg('');
    if (role === USER_ROLES.ADMIN) {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === USER_ROLES.TEACHER) {
      setUsername('teacher');
      setPassword('teacher123');
    } else if (role === USER_ROLES.PARENT) {
      setParentIdentifier(students[0]?.parentPhone || '9876543210');
    }
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

  // One-click quick login shortcuts
  const handleQuickLogin = (role) => {
    if (role === USER_ROLES.ADMIN) {
      const res = authenticateStaff('admin', 'admin123', USER_ROLES.ADMIN);
      if (res.success) {
        setAuthSession(res.user);
        onLoginSuccess(res.user);
      }
    } else if (role === USER_ROLES.TEACHER) {
      const res = authenticateStaff('teacher', 'teacher123', USER_ROLES.TEACHER);
      if (res.success) {
        setAuthSession(res.user);
        onLoginSuccess(res.user);
      }
    } else if (role === USER_ROLES.PARENT) {
      const defaultPhone = students[0]?.parentPhone || '9876543210';
      const res = authenticateParent(defaultPhone, students);
      if (res.success) {
        setAuthSession(res.user);
        onLoginSuccess(res.user);
      } else {
        // Fallback parent profile if students list is empty
        const fallbackParent = {
          id: 'parent-demo',
          name: 'Rajesh Kumar (Parent)',
          role: USER_ROLES.PARENT,
          parentPhone: '9876543210',
          studentId: 1,
          studentName: 'Aarav Kumar',
          allChildren: [{ id: 1, name: 'Aarav Kumar', classCode: 'CLASS_10' }]
        };
        setAuthSession(fallbackParent);
        onLoginSuccess(fallbackParent);
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
                  placeholder="e.g. 9876543210 or ADM-1001"
                  value={parentIdentifier}
                  onChange={(e) => setParentIdentifier(e.target.value)}
                  className="form-input with-left-icon"
                />
              </div>
              <p className="field-hint">Enter the phone number provided during your child's tuition admission.</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  {activeRole === USER_ROLES.ADMIN ? 'Admin Username / Email' : 'Teacher ID / Email'}
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
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
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input with-left-icon"
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary submit-login-btn">
            <span>Login to {activeRole === USER_ROLES.ADMIN ? 'Admin Dashboard' : activeRole === USER_ROLES.TEACHER ? 'Teacher Portal' : 'Parent Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login One-Click Buttons */}
        <div className="quick-login-divider">
          <span>OR ONE-CLICK DEMO ACCESS</span>
        </div>

        <div className="quick-login-grid">
          <button 
            type="button" 
            className="quick-btn admin-quick"
            onClick={() => handleQuickLogin(USER_ROLES.ADMIN)}
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
          <button 
            type="button" 
            className="quick-btn teacher-quick"
            onClick={() => handleQuickLogin(USER_ROLES.TEACHER)}
          >
            <GraduationCap size={14} />
            <span>Teacher</span>
          </button>
          <button 
            type="button" 
            className="quick-btn parent-quick"
            onClick={() => handleQuickLogin(USER_ROLES.PARENT)}
          >
            <Users size={14} />
            <span>Parent</span>
          </button>
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
        .quick-login-divider {
          position: relative;
          text-align: center;
          margin: 24px 0 16px;
        }
        .quick-login-divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: var(--border-subtle);
        }
        .quick-login-divider span {
          position: relative;
          background: #111827;
          padding: 0 12px;
          font-size: 0.675rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .quick-login-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        .quick-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          font-size: 0.775rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-btn:hover {
          color: white;
          transform: translateY(-1px);
        }
        .admin-quick:hover {
          border-color: #6366F1;
          background: rgba(99, 102, 241, 0.15);
        }
        .teacher-quick:hover {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.15);
        }
        .parent-quick:hover {
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.15);
        }
      `}</style>
    </div>
  );
}
