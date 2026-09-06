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
  BookOpen
} from 'lucide-react';

import HayagrivaLogo from './HayagrivaLogo';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, isSupabaseLive, isSyncing }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'batches', label: 'Batches & Timing', icon: CalendarDays },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'fees', label: 'Fee Management', icon: IndianRupee },
    { id: 'exams', label: 'Exams & Marks', icon: BookOpen }
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo & Name */}
        <div className="brand-wrapper" onClick={() => setActiveTab('dashboard')}>
          <HayagrivaLogo size={38} showGlow={true} />
          <div className="brand-text">
            <div className="brand-title">
              <span>HAYAGRIVA</span>
              <span className="brand-badge">TUTORIALS</span>
            </div>
            <div className="brand-tagline">Classes 1 to 10 Tuition Academy</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" role="tablist">
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

        {/* Live Status & Database Settings */}
        <div className="navbar-actions">
          <div 
            className={`live-status-pill ${isSyncing ? 'syncing' : ''}`} 
            title={isSupabaseLive ? (isSyncing ? 'Syncing to Supabase PostgreSQL...' : 'Connected to Supabase PostgreSQL Realtime') : 'Running on Local Storage'}
          >
            <Radio size={13} className={isSyncing ? "animate-pulse" : "pulse-dot"} />
            <span>{isSupabaseLive ? (isSyncing ? 'Syncing...' : 'Supabase Live') : 'Local Storage'}</span>
          </div>

          <button 
            onClick={onOpenSettings}
            className="btn btn-secondary btn-sm db-settings-btn"
            title="Database & Supabase Configuration"
          >
            <Database size={14} />
            <span>Database</span>
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
          align-items: center;
          justify-content: space-between;
          gap: 14px;
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
        }
        .brand-subtitle {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 4px;
          overflow-x: auto;
          padding: 2px;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .navbar-links::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .nav-tab-btn {
          display: flex;
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
        @media (max-width: 1080px) {
          .brand-subtitle { display: none; }
        }
        @media (max-width: 900px) {
          .nav-tab-btn span { display: none; }
          .nav-tab-btn { padding: 8px 10px; }
        }
      `}</style>
    </header>

  );
}
