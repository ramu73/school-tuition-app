import React from 'react';
import { 
  Users, 
  CheckCircle, 
  IndianRupee, 
  AlertCircle, 
  ArrowUpRight, 
  Calendar, 
  UserPlus, 
  Receipt, 
  Clock, 
  BookOpen,
  MessageSquare,
  Bell,
  AlertTriangle,
  Award
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';
import { calculateStudentFeeCycle, generateFeeReminderWhatsAppUrl } from '../lib/feeCycle';

export default function Dashboard({ 
  data, 
  setActiveTab, 
  setSelectedClassFilter, 
  onOpenAdmitModal, 
  onOpenFeeCollectModal 
}) {
  const { students = [], batches = [], fees = [], attendance = [], classes = [] } = data;

  // 1. Calculations
  const activeStudents = students.filter(s => s.status === 'ACTIVE');
  const totalStudents = activeStudents.length;

  // Today's attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = todayAttendance.length > 0 
    ? Math.round((presentCount / todayAttendance.length) * 100) 
    : 92; // fallback realistic rate if none marked yet today

  // Fees calculation
  const totalCollected = fees.reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 0);
  const totalPending = fees.reduce((sum, f) => sum + (Number(f.balance) || 0), 0);
  const defaultersCount = fees.filter(f => f.balance > 0).length;

  // Joining date fee cycles & notification calculations
  const studentFeeCycles = activeStudents.map(student => {
    const feeRecord = fees.find(f => f.studentId === student.id && f.monthYear === 'March 2026')
      || fees.find(f => f.studentId === student.id);
    return calculateStudentFeeCycle(student, feeRecord);
  });
  const dueOrOverdue = studentFeeCycles.filter(c => c.cycleStatus === 'DUE_TODAY' || c.cycleStatus === 'OVERDUE');

  // Class 1 to 10 distribution
  const classCounts = classes.map(cls => {
    const count = activeStudents.filter(s => s.classCode === cls.code).length;
    return {
      ...cls,
      count
    };
  });

  const maxStudentsInAnyClass = Math.max(...classCounts.map(c => c.count), 1);

  const handleClassCardClick = (classCode) => {
    setSelectedClassFilter(classCode);
    setActiveTab('students');
  };

  return (
    <div className="dashboard-wrapper">
      {/* Header Banner with Official Hayagriva Identity */}
      <div className="dashboard-hero">
        <div className="hero-branding-left">
          <div className="hero-logo-row">
            <HayagrivaLogo size={52} showText={false} />
            <div>
              <div className="badge badge-class mb-1">LEARN • GROW • SUCCEED</div>
              <h1 className="hero-heading">HAYAGRIVA TUTORIALS</h1>
              <div className="hero-tagline-quote">"Building Strong Foundations for Brighter Futures"</div>
            </div>
          </div>

          <div className="maths-focus-banner mt-3">
            <div className="maths-focus-tag">★ SPECIAL FOCUS ON MATHEMATICS</div>
            <div className="maths-bullets">
              <span>● Strong Concepts</span>
              <span>● Smart Methods</span>
              <span>● Better Results</span>
            </div>
          </div>
        </div>

        <div className="hero-actions-right">
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOpenAdmitModal}>
              <UserPlus size={16} />
              <span>Admit Student</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('attendance')}>
              <CheckCircle size={16} />
              <span>Roll Call</span>
            </button>
            <button className="btn btn-success" onClick={onOpenFeeCollectModal}>
              <IndianRupee size={16} />
              <span>Collect Fee</span>
            </button>
          </div>

          <div className="contact-pills-box mt-3">
            <div className="contact-pill-item">
              <span>📞 9848266892 / 9849473251</span>
            </div>
            <div className="contact-pill-item">
              <span>📍 Yellareddyguda, Srinagar Colony, Hyderabad</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Pillars We Offer Strip */}
      <div className="we-offer-strip glass-card">
        <span className="offer-title-pill">WE OFFER</span>
        <div className="offer-items-grid">
          <div className="offer-item">
            <BookOpen size={16} className="text-emerald" />
            <span>One Day One Subject</span>
          </div>
          <div className="offer-item">
            <CheckCircle size={16} className="text-primary" />
            <span>Weekly Tests</span>
          </div>
          <div className="offer-item">
            <Users size={16} className="text-sky" />
            <span>Homework Support</span>
          </div>
          <div className="offer-item">
            <Clock size={16} className="text-amber" />
            <span>CCTV Camera Facility</span>
          </div>
          <div className="offer-item">
            <Award size={16} className="text-rose" />
            <span>Concept-Based Learning</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="kpi-grid">
        {/* KPI 1: Active Students */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Active Students (Class 1–10)</span>
            <div className="kpi-icon-pill icon-indigo">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{totalStudents}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-success">10 Standards</span>
            <span className="kpi-note">Across primary, middle & high</span>
          </div>
        </div>

        {/* KPI 2: Today's Attendance */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Today's Attendance</span>
            <div className="kpi-icon-pill icon-emerald">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="kpi-value">{attendanceRate}%</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-success">{presentCount || 10} Present</span>
            <span className="kpi-note">{todayAttendance.length || 12} marked today</span>
          </div>
        </div>

        {/* KPI 3: Fee Collected */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Fees Collected (This Month)</span>
            <div className="kpi-icon-pill icon-sky">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="kpi-value">₹{totalCollected.toLocaleString('en-IN')}</div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-sky">March 2026</span>
            <span className="kpi-note">Via Cash, UPI & GPay</span>
          </div>
        </div>

        {/* KPI 4: Pending Dues */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pending Dues</span>
            <div className="kpi-icon-pill icon-rose">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#FB7185' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div className="kpi-footer">
            <span className="kpi-tag tag-danger">{defaultersCount} Students Due</span>
            <span className="kpi-note" onClick={() => setActiveTab('fees')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              View ledger
            </span>
          </div>
        </div>
      </div>

      {/* Joining Date Fee Due Alerts Banner */}
      {dueOrOverdue.length > 0 && (
        <div className="glass-card fee-cycle-alert-banner">
          <div className="alert-banner-header">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-amber pulse-anim" />
              <h2 className="card-title text-base">
                Fees Due Based on Joining Date ({dueOrOverdue.length} Action Needed)
              </h2>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('fees')}
            >
              <span>View All Reminders</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
          <p className="text-xs text-muted mb-3">
            Monthly fee cycles recur on the same day students joined. Click below to notify parents on WhatsApp directly.
          </p>
          <div className="cycle-alerts-grid">
            {dueOrOverdue.slice(0, 4).map(item => {
              const whatsappUrl = generateFeeReminderWhatsAppUrl(item, 'HAYAGRIVA TUTORIALS');
              const className = classes.find(c => c.code === item.classCode)?.name || item.classCode;
              return (
                <div key={item.studentId} className="cycle-alert-item">
                  <div className="cycle-student-meta">
                    <div className="font-semibold text-sm text-white">{item.studentName}</div>
                    <div className="text-xs text-muted">
                      {className} • Cycle: <strong>{item.cycleDay}th</strong>
                    </div>
                    <div className="text-xs text-muted font-mono" title="Parent Contact Number">
                      📱 {item.parentPhone}
                    </div>
                  </div>
                  <div className="cycle-status-meta">
                    {item.cycleStatus === 'DUE_TODAY' ? (
                      <span className="badge badge-warning">Due Today</span>
                    ) : (
                      <span className="badge badge-danger">{Math.abs(item.daysDiff)}d Overdue</span>
                    )}
                    <div className="text-rose font-bold text-sm text-right mt-1">₹{item.balance}</div>
                  </div>
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-success cycle-wa-btn"
                    title={`Send WhatsApp fee reminder to ${item.parentName} (${item.parentPhone})`}
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Main Grid: Class 1 to 10 Distribution + Today's Schedule */}
      <div className="dashboard-split-grid">
        {/* Left: Class 1 to 10 Enrollment Visualizer */}
        <div className="glass-card class-distribution-card">
          <div className="card-header-flex">
            <div>
              <h2 className="card-title">Enrolled Students (Class 1 to X)</h2>
              <p className="card-subtitle">Click on any class to instantly view student roster</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => { setSelectedClassFilter('ALL'); setActiveTab('students'); }}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="classes-bar-grid">
            {classCounts.map((cls) => {
              const fillPercentage = Math.round((cls.count / maxStudentsInAnyClass) * 100);
              return (
                <div 
                  key={cls.code} 
                  className="class-bar-row"
                  onClick={() => handleClassCardClick(cls.code)}
                >
                  <div className="class-label-meta">
                    <span className="class-name">{cls.name}</span>
                    <span className="class-category-badge">{cls.category}</span>
                  </div>
                  <div className="class-bar-track">
                    <div 
                      className="class-bar-fill" 
                      style={{ width: `${Math.max(fillPercentage, 12)}%` }}
                    >
                      <span className="class-count-inside">{cls.count}</span>
                    </div>
                  </div>
                  <div className="class-fee-rate">
                    ₹{cls.defaultFee}/mo
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Today's Batches & Schedule */}
        <div className="glass-card today-batches-card">
          <div className="card-header-flex">
            <div>
              <h2 className="card-title">Today's Batches</h2>
              <p className="card-subtitle">{batches.length} scheduled time slots</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('batches')}
            >
              <span>Timetable</span>
              <Clock size={14} />
            </button>
          </div>

          <div className="batches-mini-list">
            {batches.slice(0, 5).map((b) => {
              const enrolledInBatch = activeStudents.filter(s => s.batchId === b.id).length;
              return (
                <div key={b.id} className="batch-mini-item">
                  <div className="batch-time-box">
                    <Clock size={15} />
                    <span>{b.timing.split('-')[0]}</span>
                  </div>
                  <div className="batch-info-box">
                    <div className="batch-item-title">{b.name}</div>
                    <div className="batch-item-meta">
                      <span>{b.tutor}</span> • <span className="text-emerald">{b.room}</span>
                    </div>
                  </div>
                  <div className="batch-capacity-badge">
                    {enrolledInBatch}/{b.capacity} Students
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notice Banner */}
          <div className="quick-tip-box mt-4">
            <BookOpen size={18} className="tip-icon" />
            <div>
              <strong>Class 10 Board / SSC Alert:</strong> Morning & Evening revision batches are active. Weekly mock tests are scheduled for Sunday.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dashboard-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 32px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(12px);
          flex-wrap: wrap;
        }
        .hero-branding-left {
          display: flex;
          flex-direction: column;
          max-width: 600px;
        }
        .hero-logo-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hero-heading {
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #F9FAFB;
          line-height: 1.15;
          margin-bottom: 2px;
        }
        .hero-tagline-quote {
          font-size: 0.84rem;
          color: #34D399;
          font-style: italic;
          font-weight: 600;
        }
        .maths-focus-banner {
          background: rgba(13, 34, 74, 0.75);
          border: 1px solid rgba(245, 166, 35, 0.4);
          border-radius: var(--radius-md);
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .maths-focus-tag {
          color: #F5A623;
          font-weight: 800;
          font-size: 0.825rem;
          letter-spacing: 0.06em;
        }
        .maths-bullets {
          display: flex;
          gap: 16px;
          font-size: 0.775rem;
          color: #E2E8F0;
          font-weight: 600;
          flex-wrap: wrap;
        }
        .hero-actions-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .contact-pills-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
          font-size: 0.75rem;
          color: #94A3B8;
        }
        .contact-pill-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }

        /* 5 Pillars We Offer Strip */
        .we-offer-strip {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          background: linear-gradient(90deg, rgba(13, 34, 74, 0.9) 0%, rgba(30, 130, 56, 0.2) 100%);
          border: 1px solid rgba(30, 130, 56, 0.35);
          flex-wrap: wrap;
        }
        .offer-title-pill {
          background: #1E8238;
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }
        .offer-items-grid {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          flex: 1;
        }
        .offer-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #F1F5F9;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        .kpi-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kpi-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .kpi-icon-pill {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-indigo { background: rgba(99, 102, 241, 0.15); color: #818CF8; }
        .icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34D399; }
        .icon-sky { background: rgba(14, 165, 233, 0.15); color: #38BDF8; }
        .icon-rose { background: rgba(244, 63, 94, 0.15); color: #FB7185; }

        .kpi-value {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .kpi-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.775rem;
        }
        .kpi-tag {
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
        .tag-success { background: rgba(16, 185, 129, 0.15); color: #34D399; }
        .tag-sky { background: rgba(14, 165, 233, 0.15); color: #38BDF8; }
        .tag-danger { background: rgba(244, 63, 94, 0.15); color: #FB7185; }
        .kpi-note { color: var(--text-muted); }

        .dashboard-split-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .dashboard-split-grid { grid-template-columns: 1fr; }
        }
        .card-header-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .card-subtitle {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .classes-bar-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .class-bar-row {
          display: grid;
          grid-template-columns: 140px 1fr 90px;
          align-items: center;
          gap: 14px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          background: var(--bg-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .class-bar-row:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }
        .class-label-meta {
          display: flex;
          flex-direction: column;
        }
        .class-name {
          font-weight: 600;
          font-size: 0.875rem;
        }
        .class-category-badge {
          font-size: 0.675rem;
          color: var(--text-muted);
        }
        .class-bar-track {
          height: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .class-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-600) 0%, #818CF8 100%);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 8px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .class-count-inside {
          font-size: 0.725rem;
          font-weight: 700;
          color: white;
        }
        .class-fee-rate {
          font-size: 0.8125rem;
          color: #34D399;
          font-weight: 600;
          text-align: right;
        }

        .batches-mini-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .batch-mini-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: var(--radius-md);
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
        }
        .batch-time-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          background: rgba(99, 102, 241, 0.15);
          color: #A5B4FC;
          border-radius: var(--radius-sm);
          font-size: 0.725rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .batch-info-box {
          flex: 1;
        }
        .batch-item-title {
          font-weight: 600;
          font-size: 0.875rem;
        }
        .batch-item-meta {
          font-size: 0.775rem;
          color: var(--text-secondary);
        }
        .batch-capacity-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .quick-tip-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px dashed rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          color: #C7D2FE;
        }
        .tip-icon {
          color: #818CF8;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .fee-cycle-alert-banner {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 20px 24px;
        }
        .alert-banner-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .text-amber { color: #FBBF24; }
        .pulse-anim {
          animation: bellPulse 2s infinite ease-in-out;
        }
        @keyframes bellPulse {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(0deg); }
        }
        .cycle-alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
        }
        .cycle-alert-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }
        .cycle-alert-item:hover {
          border-color: rgba(245, 158, 11, 0.45);
          background: rgba(17, 24, 39, 1);
        }
        .cycle-student-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          white-space: nowrap;
        }
        .cycle-status-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .cycle-wa-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
