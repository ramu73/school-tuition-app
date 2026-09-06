import React from 'react';
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
  ShieldCheck
} from 'lucide-react';

import HayagrivaLogo from './HayagrivaLogo';
import { USER_ROLES } from '../lib/auth';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  isSupabaseLive, 
  isSyncing,
  currentUser,
  onLogout 
}) {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'students', label: 'Students', icon: Users, roles: [USER_ROLES.ADMIN] },
    { id: 'batches', label: 'Batches & Timing', icon: CalendarDays, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] },
    { id: 'fees', label: 'Fee Management', icon: IndianRupee, roles: [USER_ROLES.ADMIN] },
    { id: 'exams', label: 'Exams & Marks', icon: BookOpen, roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER] }
  ];

  // Filter navigation items by role
  const navItems = currentUser?.role === USER_ROLES.PARENT 
    ? [{ id: 'parent-portal', label: 'Student Portal', icon: Users }]
    : allNavItems.filter(item => item.roles.includes(currentUser?.role || USER_ROLES.ADMIN));

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo & Name */}
        <div className="navbar-brand" onClick={() => currentUser?.role !== USER_ROLES.PARENT && setActiveTab('dashboard')}>
          <div className="brand-logo-box">
            <HayagrivaLogo size={38} showGlow={true} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              <span>HAYAGRIVA TUTORIALS</span>
              <span className="brand-tag">Class 1 to X</span>
            </div>
            <div className="brand-subtitle">Classes 1 to 10 Tuition Academy</div>
          </div>
        </div>

        {/* Navigation Tabs */}
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

        {/* User Profile, Live Status & Actions */}
        <div className="navbar-actions">
          {/* Supabase Live Pill */}
          <div 
            className={`live-status-pill ${isSyncing ? 'syncing' : ''}`} 
            title={isSupabaseLive ? (isSyncing ? 'Syncing to Supabase PostgreSQL...' : 'Connected to Supabase PostgreSQL Realtime') : 'Running on Local Storage'}
          >
            <Radio size={13} className={isSyncing ? "animate-pulse" : "pulse-dot"} />
            <span>{isSupabaseLive ? (isSyncing ? 'Syncing...' : 'Supabase Live') : 'Local Storage'}</span>
          </div>

          {/* Database Settings (Admin Only) */}
          {currentUser?.role === USER_ROLES.ADMIN && (
            <button 
              onClick={onOpenSettings}
              className="btn btn-secondary btn-sm db-settings-btn"
              title="Database & Supabase Configuration"
            >
              <Database size={14} />
              <span>Database</span>
            </button>
          )}

          {/* Current User Badge */}
          {currentUser && (
            <div className="current-user-badge">
              {currentUser.role === USER_ROLES.ADMIN && <ShieldCheck size={14} className="text-primary" />}
              {currentUser.role === USER_ROLES.TEACHER && <GraduationCap size={14} className="text-emerald" />}
              {currentUser.role === USER_ROLES.PARENT && <Users size={14} className="text-amber" />}
              <span className="user-badge-name">{currentUser.name}</span>
              <span className="user-role-tag">{currentUser.role}</span>
            </div>
          )}

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="btn btn-secondary btn-sm logout-nav-btn"
            title="Sign out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </div>


      <style>{`
        .navbar-container {
          background: rgba(17, 24, 39, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .navbar-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 10px 20px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .navbar-brand,
        .brand-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }
        .brand-logo-box {
          display: flex;
          align-items: center;
          justify-content: center;
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
        .brand-tag,
        .brand-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #A5B4FC;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }
        .brand-subtitle,
        .brand-tagline {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }
        .navbar-links,
        .nav-tabs {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 6px;
          overflow-x: auto;
          padding: 2px;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .navbar-links::-webkit-scrollbar,
        .nav-tabs::-webkit-scrollbar {
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
        .current-user-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.775rem;
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
          padding: 1px 6px;
          border-radius: var(--radius-full);
          background: rgba(99, 102, 241, 0.2);
          color: #C7D2FE;
          text-transform: uppercase;
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
        @media (max-width: 1080px) {
          .brand-subtitle { display: none; }
          .user-badge-name { display: none; }
        }
        @media (max-width: 900px) {
          .nav-tab-btn span { display: none; }
          .nav-tab-btn { padding: 8px 10px; }
        }
      `}</style>
    </header>


  );
}
