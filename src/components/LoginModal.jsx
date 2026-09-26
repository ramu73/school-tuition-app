import React, { useState, useEffect } from 'react';
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
  EyeOff,
  Clock,
  Unlock
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';
import { USER_ROLES, authenticateStaff, authenticateParent, setAuthSession, getLockoutStatus } from '../lib/auth';
import { fetchStaffAccountsFromSupabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export default function LoginModal({ onLoginSuccess, students = [] }) {
  // Detect if Admin access was explicitly requested via URL parameter or preserved in localStorage
  const detectInitialAdminAccess = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      if (params.get('admin') === 'true' || params.get('admin') === '1' || params.get('role') === 'admin' || hash.toLowerCase().includes('admin')) {
        return true;
      }
      if (localStorage.getItem('hayagriva_admin_unlocked') === 'true') {
        return true;
      }
    } catch (e) {
      // safe fallback
    }
    return false;
  };

  const initialAdminVisible = detectInitialAdminAccess();
  const [isAdminVisible, setIsAdminVisible] = useState(initialAdminVisible);
  const [activeRole, setActiveRole] = useState(initialAdminVisible ? USER_ROLES.ADMIN : USER_ROLES.PARENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parentIdentifier, setParentIdentifier] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Easter Egg 3-Click State on Logo
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [lastLogoClickTime, setLastLogoClickTime] = useState(0);
  const [adminUnlockToast, setAdminUnlockToast] = useState(false);

  // Fetch latest staff & admin credentials from Supabase on mount
  useEffect(() => {
    fetchStaffAccountsFromSupabase().catch(() => {});
  }, []);

  // Keyboard shortcut listener: Ctrl + Shift + A or Alt + A toggles Admin access
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        setIsAdminVisible(prev => {
          const next = !prev;
          if (next) {
            setActiveRole(USER_ROLES.ADMIN);
            setAdminUnlockToast(true);
            localStorage.setItem('hayagriva_admin_unlocked', 'true');
            logger.info(logger.CATEGORIES.AUTH, 'Admin login tab revealed via keyboard shortcut (Ctrl+Shift+A)');
            setTimeout(() => setAdminUnlockToast(false), 3500);
          } else {
            localStorage.removeItem('hayagriva_admin_unlocked');
            setActiveRole(USER_ROLES.PARENT);
            logger.info(logger.CATEGORIES.AUTH, 'Admin login tab hidden via keyboard shortcut');
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastLogoClickTime > 2500) {
      setLogoClickCount(1);
      setLastLogoClickTime(now);
    } else {
      const nextCount = logoClickCount + 1;
      setLogoClickCount(nextCount);
      setLastLogoClickTime(now);

      if (nextCount >= 3) {
        setIsAdminVisible(true);
        setActiveRole(USER_ROLES.ADMIN);
        setAdminUnlockToast(true);
        localStorage.setItem('hayagriva_admin_unlocked', 'true');
        logger.info(logger.CATEGORIES.AUTH, 'Admin login tab unlocked via Logo triple-click gesture');
        setTimeout(() => setAdminUnlockToast(false), 3500);
        setLogoClickCount(0);
      }
    }
  };

  const handleLockAdmin = () => {
    setIsAdminVisible(false);
    setActiveRole(USER_ROLES.PARENT);
    localStorage.removeItem('hayagriva_admin_unlocked');
    logger.info(logger.CATEGORIES.AUTH, 'Admin login tab hidden / re-locked');
  };

  // Check lockout countdown timer
  useEffect(() => {
    const cleanParentId = (parentIdentifier || '').trim().replace(/\D/g, '');
    const currentId = activeRole === USER_ROLES.PARENT 
      ? (cleanParentId.length >= 7 ? cleanParentId : parentIdentifier.trim().toLowerCase()) 
      : (username || '').trim().toLowerCase();
    const status = getLockoutStatus(currentId);
    setIsLocked(status.isLocked);
    setLockoutSeconds(status.remainingSeconds);

    if (status.isLocked && status.remainingSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeRole, username, parentIdentifier]);

  const handleRoleTabChange = (role) => {
    setActiveRole(role);
    setErrorMsg('');
    setFieldErrors({});
    setUsername('');
    setPassword('');
    setParentIdentifier('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const fErrors = {};

    if (isLocked) {
      setErrorMsg(`Account temporarily locked. Please retry in ${lockoutSeconds}s.`);
      return;
    }

    if (activeRole === USER_ROLES.PARENT) {
      const clean = (parentIdentifier || '').trim();
      if (!clean || clean.length < 3) {
        fErrors.parentIdentifier = 'Please enter a valid 10-digit mobile number or admission number.';
      }
    } else {
      if (!username || username.trim().length < 2) {
        fErrors.username = 'Please enter your username (min 2 characters).';
      }
      if (!password || password.length < 3) {
        fErrors.password = 'Please enter your password (min 3 characters).';
      }
    }

    if (Object.keys(fErrors).length > 0) {
      setFieldErrors(fErrors);
      logger.warn(logger.CATEGORIES.VALIDATION, `Login form validation failed for ${activeRole}`, fErrors);
      return;
    }

    if (activeRole === USER_ROLES.PARENT) {
      const res = authenticateParent(parentIdentifier, students);
      if (res.success) {
        const session = setAuthSession(res.user, rememberMe);
        logger.action(res.user, 'PARENT_LOGIN', `Parent authenticated successfully for student ${res.user.studentName}`);
        onLoginSuccess(session);
      } else {
        setErrorMsg(res.message);
        logger.warn(logger.CATEGORIES.AUTH, `Parent login failed: ${res.message}`, { identifier: parentIdentifier });
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 120);
        }
      }
    } else {
      const res = authenticateStaff(username, password, activeRole);
      if (res.success) {
        const session = setAuthSession(res.user, rememberMe);
        logger.action(res.user, 'STAFF_LOGIN', `Staff user "${res.user.name}" (${res.user.role}) authenticated successfully`);
        onLoginSuccess(session);
      } else {
        setErrorMsg(res.message);
        logger.warn(logger.CATEGORIES.AUTH, `Staff login failed for @${username} as ${activeRole}: ${res.message}`);
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 120);
        }
      }
    }
  };

  return (
    <div className="login-backdrop">
      <div className="login-card">
        {/* Header with Academy Branding */}
        <div className="login-header">
          <div 
            className="logo-center clickable-logo" 
            onClick={handleLogoClick}
            title={isAdminVisible ? "Hayagriva Tutorials (Admin Access Enabled)" : "Hayagriva Tutorials"}
          >
            <HayagrivaLogo size={52} showGlow={true} />
          </div>
          <h1 className="login-title">HAYAGRIVA TUTORIALS</h1>
          <p className="login-subtitle">Classes 1 to 10 Coaching & Tuition Academy</p>
          <div className="role-instruction">Select your portal to continue:</div>
        </div>

        {/* Role Selection Tabs (Admin tab is hidden by default) */}
        <div className={`role-tabs ${isAdminVisible ? 'has-admin' : 'two-tabs'}`}>
          {isAdminVisible && (
            <button
              type="button"
              className={`role-tab-btn admin-role-tab ${activeRole === USER_ROLES.ADMIN ? 'active' : ''}`}
              onClick={() => handleRoleTabChange(USER_ROLES.ADMIN)}
              title="Admin Management Portal"
            >
              <ShieldCheck size={18} />
              <span>Admin</span>
              <span className="admin-status-dot" title="Admin Portal Unlocked">●</span>
            </button>
          )}
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

        {/* Admin Unlock Notification Toast */}
        {adminUnlockToast && (
          <div className="admin-unlock-banner">
            <Unlock size={14} className="text-amber-400 flex-shrink-0" />
            <span>Admin Management Portal Unlocked! Press <strong>Ctrl+Shift+A</strong> anytime to toggle.</span>
          </div>
        )}

        {/* When Admin Tab is Revealed, provide discreet re-lock control */}
        {isAdminVisible && (
          <div className="admin-visible-bar">
            <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1">
              <Unlock size={12} /> Management Portal Enabled
            </span>
            <button
              type="button"
              className="hide-admin-link"
              onClick={handleLockAdmin}
              title="Hide Admin tab from this computer"
            >
              Hide Admin Tab
            </button>
          </div>
        )}

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
              <label className="form-label">Registered Mobile or Admission No. *</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter 10-digit mobile number"
                  value={parentIdentifier}
                  onChange={(e) => {
                    setParentIdentifier(e.target.value);
                    if (fieldErrors.parentIdentifier) setFieldErrors(prev => ({ ...prev, parentIdentifier: null }));
                  }}
                  disabled={isLocked}
                  className={`form-input with-left-icon ${fieldErrors.parentIdentifier ? 'input-error' : ''}`}
                />
              </div>
              {fieldErrors.parentIdentifier && (
                <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  {fieldErrors.parentIdentifier}
                </span>
              )}
              <p className="field-hint">E.g. 9876543210 or ADM-1001</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">
                  {activeRole === USER_ROLES.ADMIN ? 'Admin Username / Email *' : 'Teacher Username / Email *'}
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={activeRole === USER_ROLES.ADMIN ? "Enter admin username" : "Enter teacher username"}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: null }));
                    }}
                    disabled={isLocked}
                    className={`form-input with-left-icon ${fieldErrors.username ? 'input-error' : ''}`}
                  />
                </div>
                {fieldErrors.username && (
                  <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.username}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password / Security PIN *</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                    }}
                    disabled={isLocked}
                    className={`form-input with-left-icon with-right-icon ${fieldErrors.password ? 'input-error' : ''}`}
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
                {fieldErrors.password && (
                  <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {fieldErrors.password}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Remember Me & Session Duration Options */}
          <div className="login-options-row">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="remember-checkbox"
              />
              <span>Remember me (7 days)</span>
            </label>
            <span className="session-policy-hint" title="Sessions auto-lock after 45 minutes of inactivity for security.">
              45m auto-lock
            </span>
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary submit-login-btn ${isLocked ? 'disabled-btn' : ''}`}
            disabled={isLocked}
          >
            <span>{isLocked ? `Locked (${lockoutSeconds}s)` : `Login to ${activeRole === USER_ROLES.ADMIN ? 'Admin Dashboard' : activeRole === USER_ROLES.TEACHER ? 'Teacher Portal' : 'Parent Portal'}`}</span>
            <ArrowRight size={16} />
          </button>
        </form>


        <div className="login-security-footer">
          <ShieldCheck 
            size={13} 
            className="text-muted footer-shield-icon" 
            onClick={handleLogoClick}
            title={isAdminVisible ? "Admin Mode Active" : "Click to unlock Management Portal"}
          />
          <span 
            onDoubleClick={handleLogoClick} 
            title="Secure Tuition Portal • Hayagriva Tutorials"
            style={{ cursor: 'default' }}
          >
            Secure Tuition Portal • Hayagriva Tutorials
          </span>
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
        .clickable-logo {
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s ease, filter 0.2s ease;
        }
        .clickable-logo:hover {
          filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.5));
        }
        .clickable-logo:active {
          transform: scale(0.92);
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
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: rgba(15, 23, 42, 0.6);
          padding: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          margin-bottom: 20px;
          transition: all 0.25s ease;
        }
        .role-tabs.has-admin {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .admin-role-tab {
          position: relative;
        }
        .admin-status-dot {
          color: #F59E0B;
          font-size: 0.65rem;
          margin-left: 2px;
        }
        .admin-unlock-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #FCD34D;
          margin-bottom: 12px;
          animation: fadeIn 0.25s ease-out;
        }
        .admin-visible-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 6px;
          margin-top: -12px;
          margin-bottom: 14px;
        }
        .hide-admin-link {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.72rem;
          cursor: pointer;
          text-decoration: underline;
          padding: 2px 4px;
        }
        .hide-admin-link:hover {
          color: #f87171;
        }
        .footer-shield-icon {
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .footer-shield-icon:hover {
          color: #F59E0B;
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
        .login-lockout-alert {
          background: rgba(245, 158, 11, 0.15) !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
          color: #FBBF24 !important;
        }
        .login-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.775rem;
          color: var(--text-secondary);
          margin-top: -4px;
        }
        .remember-me-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
        }
        .remember-checkbox {
          accent-color: var(--primary-500, #6366F1);
          width: 14px;
          height: 14px;
          cursor: pointer;
        }
        .session-policy-hint {
          font-size: 0.7rem;
          color: var(--text-muted);
          border-bottom: 1px dotted var(--text-muted);
          cursor: help;
        }
        .disabled-btn {
          opacity: 0.55;
          cursor: not-allowed !important;
          filter: grayscale(0.5);
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
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.725rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-subtle);
          padding-top: 14px;
        }
      `}</style>
    </div>
  );
}
