import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  BookOpen, 
  Award, 
  LogOut,
  Sparkles
} from 'lucide-react';
import HayagrivaLogo from './HayagrivaLogo';

export default function ParentPortal({ currentUser, data, onLogout }) {
  const { students = [], classes = [], batches = [], attendance = [], exams = [], marks = [] } = data;

  // Find all children belonging to this parent phone or ID
  const parentPhone = currentUser?.parentPhone;
  const myChildren = students.filter(s => {
    if (currentUser?.studentId && s.id === currentUser.studentId) return true;
    if (parentPhone && s.parentPhone && s.parentPhone.replace(/\D/g, '') === parentPhone.replace(/\D/g, '')) return true;
    return false;
  });

  const [selectedStudentId, setSelectedStudentId] = useState(
    myChildren[0]?.id || currentUser?.studentId || (students[0]?.id || 1)
  );

  const currentStudent = students.find(s => s.id === Number(selectedStudentId)) || myChildren[0] || students[0];
  const studentClass = classes.find(c => c.code === currentStudent?.classCode);
  const studentBatch = batches.find(b => b.id === currentStudent?.batchId);

  // Student Attendance
  const studentAttendance = attendance.filter(a => a.studentId === currentStudent?.id);
  const presentDays = studentAttendance.filter(a => a.status === 'PRESENT').length;
  const absentDays = studentAttendance.filter(a => a.status === 'ABSENT').length;
  const totalMarkedDays = studentAttendance.length;
  const attendanceRate = totalMarkedDays > 0 ? Math.round((presentDays / totalMarkedDays) * 100) : 100;

  // Recent attendance records (sorted latest first)
  const recentAttendance = [...studentAttendance].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 7);

  // Student Exam Marks
  const studentMarks = marks.filter(m => m.studentId === currentStudent?.id).map(m => {
    const exam = exams.find(e => e.id === m.examId);
    return {
      ...m,
      examTitle: exam?.title || 'Class Unit Test',
      subject: exam?.subject || 'General',
      totalMarks: exam?.totalMarks || 50,
      passingMarks: exam?.passingMarks || 18,
      date: exam?.date || 'Recent'
    };
  });

  const testsCount = studentMarks.length;
  const passedTests = studentMarks.filter(m => m.marksObtained >= m.passingMarks).length;
  const avgPercentage = testsCount > 0 
    ? Math.round(studentMarks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / testsCount)
    : null;

  const tuitionWhatsAppUrl = `https://wa.me/919848266892?text=${encodeURIComponent(
    `Hello Hayagriva Tutorials, I am ${currentUser?.name || currentStudent?.parentName || 'Parent'}, parent of ${currentStudent?.name} (${studentClass?.name || 'Class'}). I would like an update regarding my child's studies.`
  )}`;

  return (
    <div className="parent-portal-container">
      {/* Top Banner with Child Selector */}
      <div className="portal-header-card glass-card">
        <div className="portal-header-content">
          <div>
            <div className="parent-greeting">Parent & Guardian Portal</div>
            <h1 className="parent-title">Welcome, {currentUser?.name || currentStudent?.parentName || 'Parent'}</h1>
            <p className="parent-sub">Monitoring academic performance, tests & attendance at Hayagriva Tutorials</p>
          </div>

          <div className="portal-header-actions">
            {onLogout && (
              <button onClick={onLogout} className="btn btn-secondary btn-sm logout-portal-btn">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* If parent has multiple children enrolled */}
        {myChildren.length > 1 && (
          <div className="children-switcher">
            <span className="switcher-label">Select Child:</span>
            <div className="switcher-pills">
              {myChildren.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedStudentId(c.id)}
                  className={`child-pill ${c.id === currentStudent?.id ? 'active' : ''}`}
                >
                  <User size={13} />
                  <span>{c.name} ({classes.find(cls => cls.code === c.classCode)?.name || c.classCode})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student Profile Overview Card */}
      <div className="student-hero-card glass-card">
        <div className="student-profile-main">
          <div className="student-avatar-box">
            {currentStudent?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="student-name-lg">{currentStudent?.name}</h2>
              <span className="badge badge-class">{studentClass?.name || 'Class 10'}</span>
            </div>
            <div className="student-meta-row">
              <span><strong>Admission No:</strong> {currentStudent?.admissionNo}</span>
              <span>•</span>
              <span><strong>Day School:</strong> {currentStudent?.school || 'High School'}</span>
            </div>
          </div>
        </div>

        <div className="tuition-batch-info-box">
          <div className="text-xs text-muted mb-1">Assigned Tuition Batch:</div>
          <div className="batch-name-val">{studentBatch?.name || 'Standard Batch'}</div>
          <div className="batch-timing-val">
            <Clock size={13} />
            <span>{studentBatch?.timing || '05:30 PM - 07:30 PM'}</span>
          </div>
          <div className="batch-tutor-val">
            <User size={13} />
            <span>Faculty: {studentBatch?.tutor || 'Mr. R. Sharma (Maths & Physics)'}</span>
          </div>
        </div>
      </div>

      {/* 3 Academic Summary KPI Cards */}
      <div className="portal-kpis-grid">
        {/* KPI 1: Attendance Record */}
        <div className="glass-card portal-kpi-card">
          <div className="kpi-icon-wrap bg-emerald-subtle">
            <Calendar size={22} className="text-emerald" />
          </div>
          <div>
            <div className="kpi-lbl">Attendance Record</div>
            <div className="kpi-val text-emerald">{attendanceRate}%</div>
            <div className="kpi-note">{presentDays} present • {absentDays} absent ({totalMarkedDays || 1} classes)</div>
          </div>
        </div>

        {/* KPI 2: Academic & Test Score Performance */}
        <div className="glass-card portal-kpi-card">
          <div className="kpi-icon-wrap bg-primary-subtle">
            <Award size={22} className="text-primary" />
          </div>
          <div>
            <div className="kpi-lbl">Test Performance</div>
            <div className="kpi-val text-primary">
              {avgPercentage !== null ? `${avgPercentage}%` : 'Tests Active'}
            </div>
            <div className="kpi-note">{testsCount} tests recorded • {passedTests} passed</div>
          </div>
        </div>

        {/* KPI 3: Support Helpdesk */}
        <div className="glass-card portal-kpi-card contact-kpi">
          <div className="kpi-icon-wrap bg-sky-subtle">
            <MessageSquare size={22} className="text-sky" />
          </div>
          <div>
            <div className="kpi-lbl">Need Academic Help?</div>
            <div className="flex gap-2 mt-2">
              <a 
                href={tuitionWhatsAppUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-success btn-sm whatsapp-portal-btn"
              >
                <MessageSquare size={13} />
                <span>WhatsApp Tutor</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Details Grid: Test Scores & Academic Progress */}
      <div className="portal-details-grid">
        {/* Left Column: Weekly Tests & Examination Progress */}
        <div className="glass-card portal-section">
          <div className="section-title-row">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-primary" />
              <h3 className="section-title">Unit Tests & Slip Test Scores</h3>
            </div>
            <span className="badge badge-class">{studentMarks.length} Tests</span>
          </div>

          <div className="tests-list">
            {studentMarks.length === 0 ? (
              <div className="empty-state-box">
                <BookOpen size={32} className="text-muted mb-2" />
                <p>No test marks recorded for this student yet.</p>
              </div>
            ) : (
              studentMarks.map((test, idx) => {
                const percentage = Math.round((test.marksObtained / test.totalMarks) * 100);
                const isPassed = test.marksObtained >= test.passingMarks;

                return (
                  <div key={idx} className="parent-test-item">
                    <div className="test-info-col">
                      <div className="test-name-bold">{test.examTitle}</div>
                      <div className="test-meta-text">{test.subject} • {test.date}</div>
                      {test.remarks && <div className="test-remark-pill">Tutor Remark: {test.remarks}</div>}
                    </div>
                    <div className="test-score-col">
                      <div className={`score-badge ${isPassed ? 'score-pass' : 'score-fail'}`}>
                        {test.marksObtained} / {test.totalMarks}
                      </div>
                      <span className="text-xs text-muted font-bold">{percentage}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Attendance History & Tuition Pillars */}
        <div className="glass-card portal-section">
          <div className="section-title-row">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald" />
              <h3 className="section-title">Recent Attendance & Academics</h3>
            </div>
            <span className="badge badge-success">{attendanceRate}% Attendance</span>
          </div>

          {/* Recent Attendance Breakdown */}
          <div className="recent-attendance-box mb-4">
            <div className="text-xs font-semibold text-secondary mb-2">Recent Roll Call Log:</div>
            {recentAttendance.length === 0 ? (
              <div className="text-xs text-muted">Attendance records will appear here as roll calls are taken.</div>
            ) : (
              <div className="attendance-log-pills">
                {recentAttendance.map((rec, i) => (
                  <div key={i} className={`attendance-log-item ${rec.status === 'ABSENT' ? 'log-absent' : 'log-present'}`}>
                    <span className="log-date">{rec.date}</span>
                    <span className={`badge badge-sm ${rec.status === 'ABSENT' ? 'badge-danger' : 'badge-success'}`}>
                      {rec.status === 'ABSENT' ? '✕ Absent' : '✓ Present'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Highlights & Safety */}
          <div className="academy-features-box">
            <div className="text-xs font-semibold text-secondary mb-2">Hayagriva Academic Standards:</div>
            <div className="features-mini-list">
              <div className="feature-mini-item">
                <BookOpen size={14} className="text-emerald" />
                <span><strong>One Day One Subject:</strong> In-depth dedicated subject focus daily.</span>
              </div>
              <div className="feature-mini-item">
                <CheckCircle2 size={14} className="text-primary" />
                <span><strong>Weekly Tests:</strong> Regular syllabus assessments to measure progress.</span>
              </div>
              <div className="feature-mini-item">
                <Sparkles size={14} className="text-amber" />
                <span><strong>Concept-Based Learning:</strong> Strong fundamental maths & science clarity.</span>
              </div>
              <div className="feature-mini-item">
                <Clock size={14} className="text-sky" />
                <span><strong>CCTV Surveillance:</strong> 24/7 monitored safe learning environment.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .parent-portal-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .portal-header-card { padding: 24px; }
        .parent-greeting {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #A5B4FC;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .parent-title { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 4px; }
        .parent-sub { font-size: 0.84rem; color: var(--text-secondary); }
        .children-switcher { margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .switcher-label { font-size: 0.775rem; font-weight: 600; color: var(--text-muted); }
        .child-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
        }
        .child-pill.active { background: var(--primary-600); color: white; border-color: var(--primary-500); }
        .student-hero-card {
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .student-profile-main { display: flex; align-items: center; gap: 16px; }
        .student-avatar-box {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
        }
        .student-name-lg { font-size: 1.35rem; font-weight: 800; color: white; }
        .student-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .tuition-batch-info-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          min-width: 240px;
        }
        .batch-name-val { font-size: 0.95rem; font-weight: 700; color: white; }
        .batch-timing-val, .batch-tutor-val {
          display: flex; align-items: center; gap: 6px; font-size: 0.775rem; color: var(--text-secondary); margin-top: 3px;
        }
        .portal-kpis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .portal-kpi-card { padding: 20px; display: flex; align-items: center; gap: 16px; }
        .kpi-icon-wrap {
          width: 50px; height: 50px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .bg-emerald-subtle { background: rgba(16, 185, 129, 0.12); }
        .bg-primary-subtle { background: rgba(99, 102, 241, 0.12); }
        .bg-sky-subtle { background: rgba(14, 165, 233, 0.12); }
        .kpi-lbl { font-size: 0.775rem; color: var(--text-muted); font-weight: 600; }
        .kpi-val { font-size: 1.4rem; font-weight: 800; line-height: 1.2; margin: 2px 0; }
        .kpi-note { font-size: 0.75rem; color: var(--text-secondary); }
        .portal-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .portal-details-grid { grid-template-columns: 1fr; } }
        .portal-section { padding: 22px; }
        .section-title-row {
          display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px; margin-bottom: 16px;
        }
        .section-title { font-size: 1.05rem; font-weight: 700; color: white; }
        .tests-list { display: flex; flex-direction: column; gap: 10px; }
        .parent-test-item {
          display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: var(--radius-md); background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-subtle);
        }
        .test-name-bold { font-weight: 700; font-size: 0.875rem; color: white; }
        .test-meta-text { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .test-remark-pill {
          display: inline-block;
          font-size: 0.725rem;
          color: #C7D2FE;
          background: rgba(99, 102, 241, 0.15);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          margin-top: 4px;
        }
        .test-score-col {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .score-badge {
          font-size: 0.85rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
        .score-pass {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .score-fail {
          background: rgba(244, 63, 94, 0.15);
          color: #FB7185;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .recent-attendance-box {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .attendance-log-pills {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .attendance-log-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid var(--border-subtle);
          font-size: 0.8rem;
        }
        .log-present { border-left: 3px solid #10B981; }
        .log-absent { border-left: 3px solid #F43F5E; background: rgba(244, 63, 94, 0.05); }
        .log-date { font-family: monospace; color: var(--text-secondary); }
        .academy-features-box { margin-top: 8px; }
        .features-mini-list { display: flex; flex-direction: column; gap: 8px; }
        .feature-mini-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.775rem;
          color: var(--text-secondary);
        }
        .empty-state-box {
          text-align: center;
          padding: 36px 20px;
          color: var(--text-muted);
        }
        .whatsapp-portal-btn,
        .logout-portal-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        /* Mobile Responsive for Parent Portal */
        @media (max-width: 768px) {
          .portal-header-card {
            padding: 16px 14px;
          }
          .portal-header-content {
            display: flex;
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }
          .portal-header-actions {
            flex-shrink: 0;
          }
          .parent-title {
            font-size: 1.25rem;
          }
          .parent-sub {
            font-size: 0.775rem;
          }
          .logout-portal-btn {
            padding: 5px 10px;
            font-size: 0.75rem;
            white-space: nowrap;
          }
          .student-hero-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 16px 14px;
          }
          .tuition-batch-info-box {
            width: 100%;
          }
          .portal-kpis-grid {
            grid-template-columns: 1fr !important;
            gap: 10px;
          }
          .portal-details-grid {
            grid-template-columns: 1fr !important;
            gap: 14px;
          }
          .parent-test-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .test-score-col {
            align-items: flex-start;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
