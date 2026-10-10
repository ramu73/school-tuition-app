import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Phone
} from 'lucide-react';

import HayagrivaLogo from './HayagrivaLogo';
import { USER_ROLES } from '../lib/auth';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  onOpenInquiries,
  inquiriesCount = 0,
  isSupabaseLive, 
  isSyncing,
  currentUser,
  onLogout 
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parentActiveSection, setParentActiveSection] = useState('overview');
  const profileMenuRef = useRef(null);

  // Synchronize active section with ParentPortal when parent navigates
  useEffect(() => {
    const handleSectionChange = (e) => {
      if (e.detail) {
        setParentActiveSection(e.detail);
      }
    };
    window.addEventListener('parent-section-changed', handleSectionChange);
    return () => window.removeEventListener('parent-section-changed', handleSectionChange);
  }, []);

  const parentNavSections = [
    { id: 'overview', label: 'All Sections / Overview', icon: LayoutDashboard },
    { id: 'attendance', label: '1. Attendance & Calendar', icon: CalendarDays },
    { id: 'exams', label: '2. Exam Results & Scorecards', icon: BookOpen },
    { id: 'homework', label: '3. Homework & Learning', icon: CheckSquare },
    { id: 'feedback', label: '4. Tutor Feedback & Plan', icon: Sparkles },
    { id: 'progress', label: '5. Monthly Progress Report', icon: CheckCircle2 }
  ];

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

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

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
    <>
      <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo & Name (Left) + Mobile Sidebar Hamburger Toggle */}
        <div className="navbar-brand-group">
          <button 
            type="button" 
            className="mobile-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Navigation Sidebar"
            title="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="navbar-brand" onClick={() => currentUser?.role !== USER_ROLES.PARENT && setActiveTab('dashboard')}>
            <div className="brand-logo-box">
              <HayagrivaLogo size={36} showGlow={true} />
            </div>
            <div className="brand-text">
              <div className="brand-title">
                <span className="brand-plaque navbar-brand-plaque">
                  <span className="brand-name-hayagriva">HAYAGRIVA</span>
                  <span className="brand-name-tutorials">TUTORIALS</span>
                </span>
                <span className="brand-tag">Class 1 to X</span>
              </div>
              <div className="brand-subtitle">Classes 1 to 10 Tuition Academy</div>
            </div>
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


          {/* Website Leads & Demo Inquiries (Admin Only) */}
          {currentUser?.role === USER_ROLES.ADMIN && (
            <button 
              onClick={onOpenInquiries}
              className="btn btn-secondary btn-sm db-settings-btn leads-btn-wrap"
              style={{ position: 'relative' }}
              title="Website Inquiries, Student Demos & Teacher Applications"
            >
              <Sparkles size={14} className="text-amber" />
              <span className="btn-label-text">Leads</span>
              {inquiriesCount > 0 && (
                <span 
                  className="leads-unread-count"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#F43F5E',
                    color: '#FFF',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  {inquiriesCount}
                </span>
              )}
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
    </header>

    {/* Mobile Off-Canvas Navigation Sidebar & Backdrop Overlay (Rendered directly to document.body via Portal to prevent containing block trap) */}
    {typeof document !== 'undefined' && createPortal(
      <>
        <div 
          className={`mobile-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />

        <aside 
          className={`mobile-nav-sidebar ${sidebarOpen ? 'open' : ''}`}
          aria-label="Mobile Navigation Sidebar"
          aria-hidden={!sidebarOpen}
        >
          {/* Sidebar Header */}
          <div className="sidebar-drawer-header">
            <div className="sidebar-drawer-brand">
              <HayagrivaLogo size={32} showGlow={true} />
              <div className="sidebar-drawer-title-wrap">
                <div className="sidebar-drawer-title">
                  <span className="brand-plaque" style={{ padding: '2px 8px', fontSize: '0.85rem' }}>
                    <span className="brand-name-hayagriva">HAYAGRIVA</span>
                    <span className="brand-name-tutorials">TUTORIALS</span>
                  </span>
                </div>
                <div className="sidebar-drawer-subtitle">Academy Portal • Class 1–X</div>
              </div>
            </div>
            <button 
              type="button" 
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          {currentUser && (
            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar">
                {currentUser.role === USER_ROLES.ADMIN && <ShieldCheck size={20} className="text-primary" />}
                {currentUser.role === USER_ROLES.TEACHER && <GraduationCap size={20} className="text-emerald" />}
                {currentUser.role === USER_ROLES.PARENT && <Users size={20} className="text-amber" />}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{currentUser.name}</div>
                <div className="sidebar-user-meta">
                  <span className={`user-role-tag role-${currentUser.role?.toLowerCase()}`}>
                    {currentUser.role}
                  </span>
                  <span className="sidebar-live-pill">
                    <Radio size={10} className={isSyncing ? "animate-pulse" : "pulse-dot"} />
                    <span>{isSupabaseLive ? (isSyncing ? 'Syncing...' : 'Realtime Cloud') : 'Local'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tab Links & Parent Portal Section Switcher */}
          <div className="sidebar-nav-container">
            {currentUser?.role === USER_ROLES.PARENT ? (
              <>
                <div className="sidebar-section-label">Parent Portal Sections</div>
                <nav className="sidebar-nav-list" role="tablist">
                  {parentNavSections.map((item) => {
                    const Icon = item.icon;
                    const isActive = parentActiveSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setParentActiveSection(item.id);
                          setSidebarOpen(false);
                          window.dispatchEvent(new CustomEvent('switch-parent-section', { detail: item.id }));
                        }}
                        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <div className="sidebar-item-left">
                          <span className="sidebar-item-icon-wrap">
                            <Icon size={18} />
                          </span>
                          <span className="sidebar-item-label">{item.label}</span>
                        </div>
                        {isActive ? (
                          <span className="sidebar-active-pill">Viewing</span>
                        ) : (
                          <ChevronRight size={15} className="sidebar-item-arrow" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="sidebar-section-label mt-4">Direct Communications &amp; Quick Actions</div>
                <div className="sidebar-admin-tools">
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      window.dispatchEvent(new CustomEvent('open-parent-notices'));
                    }}
                    className="sidebar-tool-btn"
                  >
                    <div className="sidebar-item-left">
                      <span className="sidebar-item-icon-wrap text-amber">
                        <Megaphone size={17} />
                      </span>
                      <span className="sidebar-item-label">Academy Notifications</span>
                    </div>
                    <ChevronRight size={15} className="sidebar-item-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      window.dispatchEvent(new CustomEvent('open-parent-fees'));
                    }}
                    className="sidebar-tool-btn"
                  >
                    <div className="sidebar-item-left">
                      <span className="sidebar-item-icon-wrap text-emerald">
                        <IndianRupee size={17} />
                      </span>
                      <span className="sidebar-item-label">Fee Details &amp; Receipts</span>
                    </div>
                    <ChevronRight size={15} className="sidebar-item-arrow" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      window.dispatchEvent(new CustomEvent('open-parent-contact'));
                    }}
                    className="sidebar-tool-btn"
                  >
                    <div className="sidebar-item-left">
                      <span className="sidebar-item-icon-wrap text-sky">
                        <Phone size={17} />
                      </span>
                      <span className="sidebar-item-label">Contact Academy Tutor</span>
                    </div>
                    <ChevronRight size={15} className="sidebar-item-arrow" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="sidebar-section-label">Academy Navigation</div>
                <nav className="sidebar-nav-list" role="tablist">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <div className="sidebar-item-left">
                          <span className="sidebar-item-icon-wrap">
                            <Icon size={18} />
                          </span>
                          <span className="sidebar-item-label">{item.label}</span>
                        </div>
                        {isActive ? (
                          <span className="sidebar-active-pill">Active</span>
                        ) : (
                          <ChevronRight size={15} className="sidebar-item-arrow" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Admin Management Shortcuts */}
                {currentUser?.role === USER_ROLES.ADMIN && (
                  <>
                    <div className="sidebar-section-label mt-4">Management &amp; Controls</div>
                    <div className="sidebar-admin-tools">
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          onOpenInquiries();
                        }}
                        className="sidebar-tool-btn"
                      >
                        <div className="sidebar-item-left">
                          <span className="sidebar-item-icon-wrap text-amber">
                            <Sparkles size={17} />
                          </span>
                          <span className="sidebar-item-label">Website Leads &amp; Demos</span>
                        </div>
                        {inquiriesCount > 0 ? (
                          <span className="sidebar-leads-badge">{inquiriesCount} new</span>
                        ) : (
                          <ChevronRight size={15} className="sidebar-item-arrow" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSidebarOpen(false);
                          onOpenSettings();
                        }}
                        className="sidebar-tool-btn"
                      >
                        <div className="sidebar-item-left">
                          <span className="sidebar-item-icon-wrap">
                            <Settings size={17} />
                          </span>
                          <span className="sidebar-item-label">System &amp; DB Settings</span>
                        </div>
                        <ChevronRight size={15} className="sidebar-item-arrow" />
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="sidebar-drawer-footer">
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={() => {
                setSidebarOpen(false);
                onLogout();
              }}
            >
              <LogOut size={16} />
              <span>Sign Out ({currentUser?.name?.split(' ')[0] || 'User'})</span>
            </button>
            <div className="sidebar-footer-note">
              Classes 1 to 10 Tuition Academy • Hayagriva
            </div>
          </div>
        </aside>
      </>,
      document.body
    )}

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
        .navbar-brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          order: 1;
        }
        .mobile-sidebar-toggle-btn {
          display: none;
        }
        .navbar-brand {
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
        .navbar-brand-plaque {
          font-size: 0.95rem;
          padding: 3px 8px;
        }
        .navbar-brand-plaque .brand-name-hayagriva {
          font-size: 0.98rem;
        }
        .navbar-brand-plaque .brand-name-tutorials {
          font-size: 0.88rem;
        }
        .brand-title-short {
          display: none;
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

        /* ============================================================== */
        /* MOBILE OFF-CANVAS SIDEBAR & OVERLAY                            */
        /* ============================================================== */
        .mobile-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: rgba(7, 11, 20, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 99998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
        }
        .mobile-sidebar-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .mobile-nav-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 310px;
          max-width: 86vw;
          height: 100vh;
          height: 100dvh;
          background: #0B1120;
          background: linear-gradient(180deg, #0F172A 0%, #0B1120 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.85);
          z-index: 99999;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .mobile-nav-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .sidebar-drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sidebar-drawer-title-wrap {
          display: flex;
          flex-direction: column;
        }
        .sidebar-drawer-title {
          font-size: 0.92rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: #F8FAFC;
          font-family: var(--font-heading);
          white-space: nowrap;
        }
        .sidebar-drawer-subtitle {
          font-size: 0.68rem;
          color: #94A3B8;
        }
        .sidebar-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .sidebar-close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #F87171;
        }

        .sidebar-user-card {
          margin: 12px 14px 4px 14px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sidebar-user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-user-info {
          min-width: 0;
          flex: 1;
        }
        .sidebar-user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #F8FAFC;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-user-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .sidebar-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          color: #94A3B8;
        }

        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          -webkit-overflow-scrolling: touch;
        }
        .sidebar-section-label {
          font-size: 0.675rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #64748B;
          margin-bottom: 8px;
          padding-left: 6px;
        }
        .sidebar-nav-list,
        .sidebar-admin-tools {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-nav-item,
        .sidebar-tool-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: #94A3B8;
          cursor: pointer;
          font-size: 0.825rem;
          font-weight: 500;
          transition: all 0.18s ease;
          text-align: left;
          touch-action: manipulation;
          -webkit-tap-highlight-color: rgba(99, 102, 241, 0.2);
          user-select: none;
        }
        .sidebar-nav-item > *,
        .sidebar-tool-btn > * {
          pointer-events: none;
        }
        .sidebar-nav-item:hover,
        .sidebar-tool-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #F8FAFC;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .sidebar-nav-item.active {
          background: rgba(99, 102, 241, 0.16);
          border-color: rgba(99, 102, 241, 0.4);
          color: #A5B4FC;
          font-weight: 600;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.12);
        }
        .sidebar-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .sidebar-item-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-nav-item.active .sidebar-item-icon-wrap {
          color: #818CF8;
        }
        .sidebar-item-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-active-pill {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          background: rgba(99, 102, 241, 0.3);
          color: #C7D2FE;
          padding: 2px 7px;
          border-radius: 9999px;
        }
        .sidebar-item-arrow {
          color: #475569;
        }
        .sidebar-leads-badge {
          background: #F43F5E;
          color: #FFF;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
          box-shadow: 0 0 8px rgba(244, 63, 94, 0.5);
        }

        .sidebar-drawer-footer {
          padding: 14px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .sidebar-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #FB7185;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-logout-btn:hover {
          background: rgba(244, 63, 94, 0.2);
          border-color: rgba(244, 63, 94, 0.5);
          color: #FDA4AF;
        }
        .sidebar-footer-note {
          text-align: center;
          font-size: 0.65rem;
          color: #64748B;
          margin-top: 8px;
        }

        /* Mobile & Tablet Responsive Layout */
        @media (max-width: 960px) {
          .navbar-inner {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
            padding: 8px 12px !important;
          }
          .mobile-sidebar-toggle-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #E2E8F0;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }
          .mobile-sidebar-toggle-btn:hover,
          .mobile-sidebar-toggle-btn:active {
            background: rgba(99, 102, 241, 0.2);
            border-color: rgba(99, 102, 241, 0.5);
            color: #A5B4FC;
          }
          /* Eliminate horizontal scrolling navigation row completely on mobile */
          .navbar-links {
            display: none !important;
          }
          .navbar-brand-group {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            flex: 1;
            overflow: hidden;
          }
          .navbar-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            overflow: hidden;
          }
          .brand-logo-box {
            flex-shrink: 0;
          }
          .brand-text {
            min-width: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .brand-title {
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
          }
          .brand-tag {
            display: none;
          }
          .brand-subtitle {
            display: none;
          }
          .navbar-actions {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-shrink: 0;
            margin-left: auto;
          }
          .btn-label-text { display: none; }
          .user-badge-name { display: none; }
          .db-settings-btn, .logout-nav-btn {
            padding: 6px 8px;
          }
        }

        /* Mobile Screens (Under 640px) - Clean, Uncluttered Top Bar */
        @media (max-width: 640px) {
          .navbar-inner {
            padding: 8px 10px !important;
            gap: 8px !important;
          }
          .mobile-sidebar-toggle-btn {
            width: 34px !important;
            height: 34px !important;
          }
          .brand-title-full {
            display: inline !important;
            font-size: 0.88rem !important;
            font-weight: 800 !important;
            letter-spacing: 0.01em !important;
            color: #FFFFFF !important;
            white-space: nowrap !important;
          }
          /* Hide secondary pills from mobile header to prevent collisions - all available in sidebar drawer */
          .live-status-pill {
            display: none !important;
          }
          .db-settings-btn {
            display: none !important;
          }
          .logout-nav-btn {
            display: none !important;
          }
          .current-user-badge {
            padding: 4px 8px !important;
            gap: 5px !important;
            background: rgba(15, 23, 42, 0.75) !important;
          }
          .user-role-tag {
            font-size: 0.65rem !important;
            font-weight: 800 !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>
    </>
  );
}
