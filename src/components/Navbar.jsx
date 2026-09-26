import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  Award, 
  Database,
  Radio,
  CalendarDays,
  CheckSquare,
  IndianRupee,
  BookOpen,
  LogOut,
  ShieldCheck,
  Settings,
  Megaphone,
  ChevronDown,
  Shield,
  Info,
  Terminal
} from 'lucide-react';

import HayagrivaLogo from './HayagrivaLogo';
import { USER_ROLES } from '../lib/auth';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  onOpenLogs,
  isSupabaseLive, 
  isSyncing,
  currentUser,
  onLogout 
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'students', label: 'Students', icon: Users, roles: [USER_ROLES.ADMIN] },
    { id: 'batches', label: 'Batches & Timing', icon: CalendarDays, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'fees', label: 'Fee Management', icon: IndianRupee, roles: [USER_ROLES.ADMIN] },
    { id: 'exams', label: 'Exams & Marks', icon: BookOpen, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'notifications', label: 'Broadcast & Notices', icon: Megaphone, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] }
  ];

  // Filter navigation items by role
  const navItems = currentUser?.role === USER_ROLES.PARENT 
    ? [{ id: 'parent-portal', label: 'Student Portal', icon: Users }]
    : allNavItems.filter(item => item.roles.includes(currentUser?.role || USER_ROLES.ADMIN));

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo & Name (Left) */}
        <div className="navbar-brand" onClick={() => currentUser?.role !== USER_ROLES.PARENT && setActiveTab('dashboard')}>
          <div className="brand-logo-box">
            <HayagrivaLogo size={36} showGlow={true} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              <span>HAYAGRIVA TUTORIALS</span>
              <span className="brand-tag">Class 1 to X</span>
            </div>
            <div className="brand-subtitle">Classes 1 to 10 Tuition Academy</div>
          </div>
        </div>

        {/* Navigation Tabs (Middle) */}
        <nav className="navbar-links" role="tablist">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile, Live Status & Actions (Far Right in Web View) */}
        <div className="navbar-actions">
          {/* Supabase Live Pill */}
          <div 
            className={`live-status-pill ${isSyncing ? 'syncing' : ''}`} 
            title={isSupabaseLive ? (isSyncing ? 'Syncing to Supabase PostgreSQL...' : 'Connected to Supabase PostgreSQL Realtime') : 'Running on Local Storage'}
          >
            <Radio size={12} className={isSyncing ? "animate-pulse" : "pulse-dot"} />
            <span className="live-pill-text">{isSupabaseLive ? (isSyncing ? 'Syncing...' : 'Live') : 'Local'}</span>
          </div>

          {/* Runtime & Exception Logs (Admin & Staff) */}
          {currentUser && currentUser.role !== USER_ROLES.PARENT && (
            <button 
              onClick={onOpenLogs}
              className="btn btn-secondary btn-sm logs-nav-btn"
              title="Application Runtime Logs & Exception Console"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Terminal size={14} className="text-emerald" />
              <span className="btn-label-text">Logs</span>
            </button>
          )}

          {/* System Settings & Database (Admin Only) */}
          {currentUser?.role === USER_ROLES.ADMIN && (
            <button 
              onClick={onOpenSettings}
              className="btn btn-secondary btn-sm db-settings-btn"
              title="Database, Staff Passwords & System Settings"
            >
              <Settings size={14} />
              <span className="btn-label-text">Settings</span>
            </button>
          )}

          {/* Current User Badge with Session Metadata & Dropdown Menu */}
          {currentUser && (
            <div className="profile-badge-wrapper" ref={profileMenuRef}>
              <div 
                className={`current-user-badge ${profileMenuOpen ? 'active' : ''}`}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                role="button"
                tabIndex={0}
                title="Click to view User Profile & Session details"
              >
                {currentUser.role === USER_ROLES.ADMIN && <ShieldCheck size={13} className="text-primary" />}
                {currentUser.role === USER_ROLES.TEACHER && <GraduationCap size={13} className="text-emerald" />}
                {currentUser.role === USER_ROLES.PARENT && <Users size={13} className="text-amber" />}
                <span className="user-badge-name">{currentUser.name}</span>
                <span className={`user-role-tag role-${currentUser.role?.toLowerCase()}`}>{currentUser.role}</span>
                <ChevronDown size={12} className={`profile-chevron ${profileMenuOpen ? 'rotate' : ''}`} />
              </div>

              {profileMenuOpen && (
                <div className="profile-dropdown-menu">
                  {/* Header */}
                  <div className="profile-menu-header">
                    <div className="profile-avatar">
                      {currentUser.role === USER_ROLES.ADMIN && <ShieldCheck size={20} className="text-primary" />}
                      {currentUser.role === USER_ROLES.TEACHER && <GraduationCap size={20} className="text-emerald" />}
                      {currentUser.role === USER_ROLES.PARENT && <Users size={20} className="text-amber" />}
                    </div>
                    <div className="profile-meta">
                      <div className="profile-name">{currentUser.name}</div>
                      <div className="profile-title">{currentUser.title || currentUser.role}</div>
                      {currentUser.email && <div className="profile-email">{currentUser.email}</div>}
                      {currentUser.parentPhone && <div className="profile-email">Phone: {currentUser.parentPhone}</div>}
                    </div>
                  </div>

                  {/* Session Status Section */}
                  <div className="profile-menu-section">
                    <div className="section-subtitle">
                      <Clock size={12} />
                      <span>Active Session</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Session Mode:</span>
                      <span className="info-value font-mono">
                        {currentUser.rememberMe ? 'Persistent (7 Days)' : 'Standard (2 Hours)'}
                      </span>
                    </div>
                    <div className="profile-info-row">
                      <span className="info-label">Inactivity Lock:</span>
                      <span className="info-value font-mono">45 mins auto-lock</span>
                    </div>
                  </div>

                  {/* RBAC Scope Section */}
                  <div className="profile-menu-section">
                    <div className="section-subtitle">
                      <Shield size={12} />
                      <span>Role & Permissions</span>
                    </div>
                    <div className="rbac-desc">
                      {currentUser.role === USER_ROLES.ADMIN && (
                        <span>Full Administrative Control (Students, Fees, Batches, Exams, Staff, Settings)</span>
                      )}
                      {currentUser.role === USER_ROLES.TEACHER && (
                        <span>
                          Teacher Access • Assigned to{' '}
                          <strong>{currentUser.assignedBatchIds?.length || 0} batches</strong>
                          {currentUser.subject ? ` (${currentUser.subject})` : ''}
                        </span>
                      )}
                      {currentUser.role === USER_ROLES.PARENT && (
                        <span>Parent Portal • {currentUser.studentName ? `Student: ${currentUser.studentName}` : 'Child Records (Read-Only)'}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="profile-menu-footer">
                    {currentUser.role !== USER_ROLES.PARENT && (
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm w-full mb-2"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}
                        onClick={() => {
                          setProfileMenuOpen(false);
                          if (typeof onOpenLogs === 'function') onOpenLogs();
                        }}
                      >
                        <Terminal size={14} className="text-emerald" />
                        <span>System Diagnostics & Logs</span>
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm w-full profile-logout-btn"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onLogout();
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logout Button (Always on the far right!) */}
          <button 
            onClick={onLogout}
            className="btn btn-secondary btn-sm logout-nav-btn"
            title="Sign out"
          >
            <LogOut size={14} />
            <span className="btn-label-text">Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        .navbar-container {
          background: rgba(17, 24, 39, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          width: 100%;
          max-width: 100vw;
        }
        .navbar-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 10px 20px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
          min-width: 0;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
          order: 1;
        }
        .brand-logo-box {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.25s ease;
        }
        .navbar-brand:hover .brand-logo-box {
          transform: scale(1.08);
        }
        .brand-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.2;
        }
        .brand-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #A5B4FC;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          white-space: nowrap;
        }
        .brand-subtitle {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }
        .navbar-links {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding: 2px;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          min-width: 0;
          order: 2;
        }
        .navbar-links::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .nav-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          font-family: var(--font-body);
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .nav-tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-subtle);
        }
        .nav-tab-btn.active {
          color: white;
          background: rgba(99, 102, 241, 0.18);
          border-color: rgba(99, 102, 241, 0.35);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          order: 3;
          margin-left: auto;
        }
        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-full);
          font-size: 0.725rem;
          font-weight: 600;
          color: #34D399;
          white-space: nowrap;
        }
        .pulse-dot {
          color: #10B981;
          animation: pulseAnim 2s infinite ease-in-out;
        }
        @keyframes pulseAnim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .db-settings-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 11px;
          font-size: 0.775rem;
          white-space: nowrap;
        }
        .profile-badge-wrapper {
          position: relative;
        }
        .current-user-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.775rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }
        .current-user-badge:hover, .current-user-badge.active {
          background: rgba(30, 41, 59, 0.85);
          border-color: rgba(99, 102, 241, 0.45);
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.15);
        }
        .profile-chevron {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }
        .profile-chevron.rotate {
          transform: rotate(180deg);
        }
        .user-badge-name {
          font-weight: 600;
          color: white;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-role-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .user-role-tag.role-admin {
          background: rgba(99, 102, 241, 0.25);
          color: #A5B4FC;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }
        .user-role-tag.role-teacher {
          background: rgba(16, 185, 129, 0.2);
          color: #6EE7B7;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }
        .user-role-tag.role-parent {
          background: rgba(245, 158, 11, 0.2);
          color: #FCD34D;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        /* Profile Dropdown Menu */
        .profile-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 290px;
          background: rgba(17, 24, 39, 0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(99, 102, 241, 0.12);
          z-index: 1000;
          padding: 16px;
          animation: dropDownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropDownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .profile-menu-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 12px;
        }
        .profile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .profile-meta {
          min-width: 0;
          flex: 1;
        }
        .profile-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .profile-title {
          font-size: 0.75rem;
          color: #A5B4FC;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .profile-email {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }
        .profile-menu-section {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md, 8px);
          padding: 10px 12px;
          margin-bottom: 10px;
        }
        .section-subtitle {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .profile-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          margin-bottom: 4px;
        }
        .profile-info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          color: var(--text-secondary);
        }
        .info-value {
          color: white;
          font-weight: 600;
        }
        .rbac-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .rbac-desc strong {
          color: #34D399;
        }
        .profile-menu-footer {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
        .profile-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #FB7185;
          border-color: rgba(244, 63, 94, 0.35);
        }
        .profile-logout-btn:hover {
          background: rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.6);
          color: #FDA4AF;
        }
        .logout-nav-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .logout-nav-btn:hover {
          color: #FB7185;
          border-color: rgba(244, 63, 94, 0.4);
          background: rgba(244, 63, 94, 0.1);
        }

        /* Mobile & Tablet Responsive Layout */
        @media (max-width: 960px) {
          .navbar-inner {
            display: grid;
            grid-template-columns: 1fr auto;
            grid-template-areas:
              "brand actions"
              "links links";
            align-items: center;
            gap: 6px 10px;
            padding: 8px 12px;
          }
          .navbar-brand {
            grid-area: brand;
            min-width: 0;
            gap: 8px;
          }
          .brand-logo-box {
            flex-shrink: 0;
          }
          .brand-title {
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .brand-tag {
            display: none;
          }
          .brand-subtitle {
            display: none;
          }
          .navbar-actions {
            grid-area: actions;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
            justify-self: end;
          }
          .navbar-links {
            grid-area: links;
            width: 100%;
            padding: 4px 0 2px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            overflow-x: auto;
          }
          .btn-label-text { display: none; }
          .user-badge-name { display: none; }
          .db-settings-btn, .logout-nav-btn {
            padding: 6px 8px;
          }
          .nav-tab-btn {
            padding: 6px 10px;
            font-size: 0.775rem;
          }
        }

        @media (max-width: 480px) {
          .navbar-inner {
            padding: 6px 10px;
            gap: 4px 6px;
          }
          .navbar-brand {
            gap: 6px;
          }
          .brand-title {
            font-size: 0.85rem;
          }
          .navbar-actions {
            gap: 4px;
          }
          .live-status-pill {
            padding: 3px 6px;
            font-size: 0.65rem;
          }
          .current-user-badge {
            padding: 2px 6px;
            font-size: 0.675rem;
          }
          .user-role-tag {
            font-size: 0.575rem;
            padding: 1px 4px;
          }
          .logout-nav-btn {
            padding: 4px 6px;
          }
        }
      `}</style>
    </header>
  );
}
