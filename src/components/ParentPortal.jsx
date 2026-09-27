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
  Sparkles,
  Megaphone,
  LogOut,
  Target,
  TrendingUp,
  Brain,
  CheckSquare,
  AlertCircle,
  IndianRupee,
  FileText,
  Printer,
  X,
  Send,
  Layers,
  BarChart3,
  CalendarDays,
  Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { calculateStudentGoalProgress } from '../lib/storage';
import HayagrivaLogo from './HayagrivaLogo';

export default function ParentPortal({ currentUser, data = {}, onLogout }) {
  const safeData = data || {};
  const students = Array.isArray(safeData.students) ? safeData.students : [];
  const classes = Array.isArray(safeData.classes) ? safeData.classes : [];
  const batches = Array.isArray(safeData.batches) ? safeData.batches : [];
  const attendance = Array.isArray(safeData.attendance) ? safeData.attendance : [];
  const exams = Array.isArray(safeData.exams) ? safeData.exams : [];
  const marks = Array.isArray(safeData.marks) ? safeData.marks : [];
  const announcements = Array.isArray(safeData.announcements) ? safeData.announcements : [];
  const tutorFeedback = Array.isArray(safeData.tutorFeedback) ? safeData.tutorFeedback : [];
  const homework = Array.isArray(safeData.homework) ? safeData.homework : [];
  const fees = Array.isArray(safeData.fees) ? safeData.fees : [];
  const receipts = Array.isArray(safeData.receipts) ? safeData.receipts : [];

  // Find all children belonging to this parent phone or studentId
  const parentPhone = currentUser?.parentPhone;
  const myChildren = students.filter(s => {
    if (currentUser?.studentId && s.id === currentUser.studentId) return true;
    if (parentPhone && s.parentPhone && s.parentPhone.replace(/\D/g, '') === parentPhone.replace(/\D/g, '')) return true;
    return false;
  });

  const [selectedStudentId, setSelectedStudentId] = useState(
    myChildren[0]?.id || currentUser?.studentId || (students[0]?.id || 1)
  );

  const [activePortalSection, setActivePortalSection] = useState('overview'); // overview, attendance, exams, homework, feedback, progress
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [noticesModalOpen, setNoticesModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeScorecard, setActiveScorecard] = useState(null);
  const [downloadingScorecard, setDownloadingScorecard] = useState(false);

  const handleDownloadParentScorecard = async () => {
    const cardEl = document.getElementById('parent-scorecard-card');
    if (!cardEl) return;
    setDownloadingScorecard(true);
    try {
      const canvas = await html2canvas(cardEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('parent-scorecard-card');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.borderRadius = '12px';
            el.style.width = '560px';
            el.style.margin = '0 auto';
          }
        }
      });
      if (canvas) {
        const studentName = (activeScorecard?.student?.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
        const examTitle = (activeScorecard?.test?.examTitle || 'Exam').replace(/[^a-zA-Z0-9]/g, '_');
        const link = document.createElement('a');
        link.download = `Scorecard_${studentName}_${examTitle}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('Error downloading scorecard in parent portal:', e);
    } finally {
      setDownloadingScorecard(false);
    }
  };

  const currentStudent = students.find(s => s.id === Number(selectedStudentId)) || myChildren[0] || students[0];
  const studentClass = classes.find(c => c.code === currentStudent?.classCode);
  const studentBatch = batches.find(b => b.id === currentStudent?.batchId);

  // Student Attendance
  const studentAttendance = attendance.filter(a => a.studentId === currentStudent?.id);
  const presentDays = studentAttendance.filter(a => a.status === 'PRESENT').length;
  const absentDays = studentAttendance.filter(a => a.status === 'ABSENT').length;
  const totalMarkedDays = studentAttendance.length;
  const attendanceRate = totalMarkedDays > 0 ? Math.round((presentDays / totalMarkedDays) * 100) : 94;
  const recentAttendance = [...studentAttendance].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);

  // Student Exam Marks & Trends
  const studentMarks = marks.filter(m => m.studentId === currentStudent?.id).map(m => {
    const exam = exams.find(e => e.id === m.examId);
    return {
      ...m,
      examTitle: exam?.title || 'Class Unit Test',
      subject: m.subject || exam?.subject || 'Mathematics',
      totalMarks: exam?.totalMarks || 50,
      passingMarks: exam?.passingMarks || 18,
      date: exam?.date || 'Recent'
    };
  });

  const testsCount = studentMarks.length;
  const passedTests = studentMarks.filter(m => m.marksObtained >= m.passingMarks).length;
  const avgPercentage = testsCount > 0 
    ? Math.round(studentMarks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / testsCount)
    : 78;

  const latestTest = studentMarks.length > 0 ? studentMarks[studentMarks.length - 1] : null;
  const latestPct = latestTest ? Math.round((latestTest.marksObtained / latestTest.totalMarks) * 100) : 84;
  const prevTest = studentMarks.length >= 2 ? studentMarks[studentMarks.length - 2] : null;
  const prevPct = prevTest ? Math.round((prevTest.marksObtained / prevTest.totalMarks) * 100) : null;
  const scoreDiff = prevPct !== null ? (latestPct - prevPct) : null;

  // Tutor Feedback & Child Improvement Plan
  const studentFeedback = tutorFeedback.find(f => f.studentId === currentStudent?.id) || {
    monthYear: 'March 2026',
    strength: 'Concepts',
    improvementArea: 'Accuracy',
    nextStep: 'Practice 5 problems',
    academicPerformance: 'Good',
    conceptUnderstanding: 'Good',
    homeworkStatus: 'Regularly Completed',
    classParticipation: 'Active',
    regularity: 'Very Regular',
    monthlyProgress: 'Improving',
    focusArea: 'Problem Solving',
    autoMessage: `🌱 Child Improvement Plan: ${currentStudent?.name || 'Your child'} understands core concepts very well and shows strong curiosity. The primary focus this month is improving calculation accuracy and minimizing avoidable test mistakes. We recommend practicing 5 targeted problems daily, which will solidify understanding.`,
    tutorRemark: 'Very attentive during class lessons. Keeps pace with exercises.',
    goal: {
      subject: 'Mathematics',
      currentScore: 78,
      targetScore: 85,
      metric: 'accuracy',
      description: 'Improve Maths accuracy from 78% → 85%',
      status: 'IN_PROGRESS'
    },
    createdBy: studentBatch?.tutor || 'Faculty'
  };

  // Goal comparison status
  const evaluatedGoal = calculateStudentGoalProgress(studentFeedback.goal, marks.filter(m => m.studentId === currentStudent?.id), exams);

  // Homework & Topic Records
  const studentHomework = homework.filter(h => h.batchId === currentStudent?.batchId || h.classCode === currentStudent?.classCode);
  const currentHomework = studentHomework[0] || {
    subject: 'Mathematics',
    topic: 'Linear Equations in Two Variables (Elimination Method)',
    homeworkTask: 'Complete Exercise 3.3 Questions 1 to 4 in homework notebook.',
    weeklyStatus: studentFeedback.homeworkStatus || 'Regularly Completed',
    date: new Date().toISOString().split('T')[0]
  };

  // Weekly Homework Status Helper
  const getHomeworkBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('regular') || s.includes('complete')) {
      return { label: '🟢 Regularly Completed', class: 'badge-hw-green' };
    }
    if (s.includes('mostly')) {
      return { label: '🟡 Mostly Completed', class: 'badge-hw-yellow' };
    }
    if (s.includes('sometimes') || s.includes('pending')) {
      return { label: '🟠 Sometimes Pending', class: 'badge-hw-orange' };
    }
    return { label: '🔴 Needs Improvement', class: 'badge-hw-red' };
  };

  const homeworkBadge = getHomeworkBadge(studentFeedback.homeworkStatus || currentHomework.weeklyStatus);

  // Student Fees & Ledger
  const studentFees = fees.filter(f => f.studentId === currentStudent?.id);
  const totalDue = studentFees.reduce((sum, f) => sum + (Number(f.balance) || 0), 0);
  const studentReceipts = receipts.filter(r => r.studentId === currentStudent?.id);

  // Announcements
  const relevantAnnouncements = announcements.filter(a => {
    if (!a.targetType || a.targetType === 'ALL') return true;
    if (a.targetType === 'BATCH' && String(a.targetId) === String(currentStudent?.batchId)) return true;
    if (a.targetType === 'CLASS' && String(a.targetId) === String(currentStudent?.classCode)) return true;
    if (a.targetType === 'STUDENTS' && Array.isArray(a.targetId) && a.targetId.map(Number).includes(Number(currentStudent?.id))) return true;
    return false;
  });

  const facultyWhatsAppUrl = `https://wa.me/919848266892?text=${encodeURIComponent(
    `Hello Hayagriva Tutorials, I am ${currentUser?.name || currentStudent?.parentName || 'Parent'}, parent of ${currentStudent?.name || 'Student'} (${studentClass?.name || 'Class'}). I would like an update regarding my child's studies.`
  )}`;

  if (!currentStudent) {
    return (
      <div className="parent-portal-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '32px' }}>
          <HayagrivaLogo size={48} showGlow={false} />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '16px' }}>Student Profile Not Found</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
            We could not find active student records linked to mobile number <strong>{parentPhone || 'entered'}</strong>. Please contact academy administration to verify your registered number.
          </p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-portal-container">
      {/* Top Banner with Child Selector & Quick Navigation */}
      <div className="portal-header-card glass-card">
        <div className="portal-header-content">
          <div>
            <div className="parent-greeting">HAYAGRIVA TUTORIALS • PARENT PORTAL</div>
            <h1 className="parent-title">Welcome, {currentUser?.name || currentStudent?.parentName || 'Parent / Guardian'}</h1>
            <p className="parent-sub">Monitoring academic progress, homework, test scorecards & faculty improvement plans</p>
          </div>
          <div className="header-btn-row">
            <button
              onClick={() => setContactModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Phone size={13} className="text-emerald" />
              <span>Contact Tutor</span>
            </button>
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

      {/* Student Profile Identity Card */}
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
              <span><strong>School:</strong> {currentStudent?.school || 'High School'}</span>
              <span>•</span>
              <span><strong>Agreed Fee:</strong> ₹{currentStudent?.monthlyFee}/mo</span>
            </div>
          </div>
        </div>

        <div className="tuition-batch-info-box">
          <div className="text-3xs text-muted uppercase tracking-wider mb-1 font-bold">Assigned Batch & Faculty</div>
          <div className="batch-name-val">{studentBatch?.name || 'Standard Tuition Batch'}</div>
          <div className="batch-timing-val">
            <Clock size={13} />
            <span>{studentBatch?.timing || '05:30 PM - 07:30 PM'}</span>
          </div>
          <div className="batch-tutor-val">
            <User size={13} />
            <span>Faculty: {studentBatch?.tutor || 'Mr. R. Sharma'}</span>
          </div>
        </div>
      </div>

      {/* ⭐ Quick Overview KPI Highlights (User Specification) */}
      <div className="quick-overview-bar glass-card">
        <div className="overview-title-row">
          <span className="overview-label">⚡ Quick Overview</span>
          <span className="overview-sub text-muted text-3xs font-mono">{studentFeedback.monthYear}</span>
        </div>

        <div className="overview-kpis-grid">
          {/* KPI 1: Attendance */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('attendance')}>
            <div className="kpi-icon-mini bg-emerald-subtle text-emerald">
              <Calendar size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Attendance</div>
              <div className="overview-kpi-val text-emerald">{attendanceRate}%</div>
              <div className="overview-kpi-note">{presentDays} Present • {absentDays} Absent</div>
            </div>
          </div>

          {/* KPI 2: Latest Test */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('exams')}>
            <div className="kpi-icon-mini bg-primary-subtle text-primary">
              <Award size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Latest Test</div>
              <div className="overview-kpi-val text-primary">{latestPct}%</div>
              <div className="overview-kpi-note">
                {scoreDiff !== null ? (
                  <span className={scoreDiff >= 0 ? 'text-emerald' : 'text-rose'}>
                    {scoreDiff >= 0 ? `+${scoreDiff}% vs previous` : `${scoreDiff}% vs previous`}
                  </span>
                ) : (
                  <span>{latestTest?.subject || 'Unit Test'}</span>
                )}
              </div>
            </div>
          </div>

          {/* KPI 3: Homework */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('homework')}>
            <div className="kpi-icon-mini bg-amber-subtle text-amber">
              <CheckSquare size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Homework</div>
              <div className="overview-kpi-val text-white text-xs mt-1">
                <span className={`badge ${homeworkBadge.class}`}>{homeworkBadge.label}</span>
              </div>
              <div className="overview-kpi-note text-3xs mt-1">Consistency Tracked</div>
            </div>
          </div>

          {/* KPI 4: Tutor Feedback */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('feedback')}>
            <div className="kpi-icon-mini bg-sky-subtle text-sky">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Tutor Feedback</div>
              <div className="overview-kpi-val text-white text-xs mt-1 font-bold">
                🌟 {studentFeedback.monthlyProgress || 'Good Progress'}
              </div>
              <div className="overview-kpi-note text-3xs mt-1">Focus: {studentFeedback.focusArea || studentFeedback.improvementArea}</div>
            </div>
          </div>

          {/* KPI 5: Monthly Progress */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('progress')}>
            <div className="kpi-icon-mini bg-purple-subtle text-purple">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Monthly Progress</div>
              <div className="overview-kpi-val text-emerald text-xs mt-1 font-bold">
                🚀 {studentFeedback.monthlyProgress || 'Improving'}
              </div>
              <div className="overview-kpi-note text-3xs mt-1">Steady Academic Growth</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Pills */}
      <div className="section-pills-bar">
        {[
          { id: 'overview', label: 'All Sections', icon: Layers },
          { id: 'attendance', label: '1. Attendance', icon: Calendar },
          { id: 'exams', label: '2. Exam Results', icon: Award },
          { id: 'homework', label: '3. Homework & Learning', icon: CheckSquare },
          { id: 'feedback', label: '4. Tutor Feedback & Plan', icon: Sparkles },
          { id: 'progress', label: '5. Monthly Progress', icon: TrendingUp }
        ].map(pill => {
          const Icon = pill.icon;
          const active = activePortalSection === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActivePortalSection(pill.id)}
              className={`section-nav-pill ${active ? 'active' : ''}`}
            >
              <Icon size={14} />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 4. TUTOR FEEDBACK & CHILD IMPROVEMENT PLAN (Highlighted Top) */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* 4. TUTOR FEEDBACK & CHILD IMPROVEMENT PLAN (Highlighted Top) */}
      {/* ============================================================== */}
      {(activePortalSection === 'overview' || activePortalSection === 'feedback') && (
        <div className="portal-section-card glass-card feedback-highlight-card">
          <div className="section-title-row">
            <div className="section-title-group">
              <div className="title-icon-badge bg-amber-soft">
                <Sparkles size={18} className="text-amber" />
              </div>
              <h3 className="section-title">Tutor Feedback &amp; Child Improvement System</h3>
            </div>
            <span className="badge badge-primary font-mono text-xs">{studentFeedback.monthYear} Evaluation</span>
          </div>

          {/* 3 Pillars Summary */}
          <div className="three-pillars-grid mb-4">
            <div className="pillar-box pillar-strength">
              <div className="pillar-top-row">
                <span className="pillar-step-badge step-emerald">1</span>
                <span className="pillar-tag">STRENGTH (DOING WELL)</span>
              </div>
              <div className="pillar-val">
                <span className="pillar-emoji">🌟</span>
                <span>{studentFeedback.strength}</span>
              </div>
              <div className="pillar-sub">Active competence recognized by tutor</div>
            </div>

            <div className="pillar-box pillar-improvement">
              <div className="pillar-top-row">
                <span className="pillar-step-badge step-amber">2</span>
                <span className="pillar-tag">IMPROVEMENT AREA (FOCUS)</span>
              </div>
              <div className="pillar-val">
                <span className="pillar-emoji">🎯</span>
                <span>{studentFeedback.improvementArea}</span>
              </div>
              <div className="pillar-sub">Targeted skill growth for upcoming month</div>
            </div>

            <div className="pillar-box pillar-action">
              <div className="pillar-top-row">
                <span className="pillar-step-badge step-sky">3</span>
                <span className="pillar-tag">RECOMMENDED ACTION (NEXT STEP)</span>
              </div>
              <div className="pillar-val">
                <span className="pillar-emoji">📖</span>
                <span>{studentFeedback.nextStep}</span>
              </div>
              <div className="pillar-sub">Daily home routine for measurable boost</div>
            </div>
          </div>

          {/* 🤖 Auto-Generated Parent Message Box */}
          <div className="auto-parent-msg-box mb-4">
            <div className="advice-header-row">
              <div className="advice-icon-wrap">
                <MessageSquare size={16} className="text-primary" />
              </div>
              <div>
                <span className="advice-title">Personalized Tutor Advice for Parents</span>
                <span className="advice-sub">Auto-synthesized guidance for home reinforcement</span>
              </div>
            </div>

            <div className="parent-advice-content">
              <p className="parent-advice-text">
                {studentFeedback.autoMessage}
              </p>
            </div>

            {studentFeedback.tutorRemark && (
              <div className="faculty-remark-card">
                <span className="remark-badge">Faculty Remark:</span>
                <span className="remark-quote">"{studentFeedback.tutorRemark}"</span>
              </div>
            )}
          </div>

          {/* ⭐ "This Month's Goal" Tracker */}
          {studentFeedback.goal && (
            <div className="monthly-goal-box">
              <div className="goal-header-row">
                <div className="goal-title-group">
                  <div className="goal-icon-wrap">
                    <Target size={16} className="text-amber" />
                  </div>
                  <div>
                    <span className="goal-heading-text">This Month's Academic Goal</span>
                    <span className="goal-heading-sub">Targeted milestone tracked by upcoming tests</span>
                  </div>
                </div>
                {evaluatedGoal?.achieved ? (
                  <span className="badge badge-success text-xs font-bold">
                    🎉 Goal Achieved ({evaluatedGoal.currentProgress}%)
                  </span>
                ) : (
                  <span className="badge badge-warning text-xs font-mono">
                    Target in Progress
                  </span>
                )}
              </div>

              <div className="goal-content-grid">
                <div className="goal-desc-col">
                  <div className="goal-target-phrase">
                    {studentFeedback.goal.description || `Improve ${studentFeedback.goal.subject} from ${studentFeedback.goal.currentScore}% → ${studentFeedback.goal.targetScore}%`}
                  </div>
                  <div className="goal-note-text">
                    System tracks next test marks automatically to measure completion.
                  </div>
                </div>

                <div className="goal-metric-col">
                  <div className="goal-metric-badges">
                    <div className="metric-pill pill-current">
                      <span className="metric-label">Current:</span>
                      <span className="metric-value">{evaluatedGoal?.currentProgress || studentFeedback.goal.currentScore}%</span>
                    </div>
                    <div className="metric-pill pill-target">
                      <span className="metric-label">Target:</span>
                      <span className="metric-value">{studentFeedback.goal.targetScore}%</span>
                    </div>
                  </div>
                  <div className="goal-progress-bar-bg">
                    <div 
                      className={`goal-progress-bar-fill ${evaluatedGoal?.achieved ? 'fill-achieved' : ''}`}
                      style={{ width: `${Math.min(100, Math.round(((evaluatedGoal?.currentProgress || studentFeedback.goal.currentScore) / studentFeedback.goal.targetScore) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. EXAM RESULTS & SCORECARDS SECTION */}
      {/* ============================================================== */}
      {(activePortalSection === 'overview' || activePortalSection === 'exams') && (
        <div className="portal-section-card glass-card">
          <div className="section-title-row">
            <div className="section-title-group">
              <div className="title-icon-badge bg-primary-soft">
                <Award size={18} className="text-primary" />
              </div>
              <h3 className="section-title">Exam Results &amp; Slip Test Scores</h3>
            </div>
            <span className="badge badge-class font-mono text-xs">{studentMarks.length} Tests Recorded</span>
          </div>

          <div className="tests-list">
            {studentMarks.length === 0 ? (
              <div className="empty-state-box">
                <BookOpen size={32} className="text-muted mb-2" />
                <p>No tests recorded for this student yet.</p>
              </div>
            ) : (
              studentMarks.map((test, idx) => {
                const percentage = Math.round((test.marksObtained / test.totalMarks) * 100);
                const isPassed = test.marksObtained >= test.passingMarks;

                return (
                  <div key={idx} className="parent-test-item">
                    <div className="test-info-col">
                      <div className="test-name-bold">{test.examTitle}</div>
                      <div className="test-meta-text">
                        Subject: <strong>{test.subject}</strong> • {test.date}
                      </div>
                      {test.remarks && <div className="test-remark-pill">Remark: {test.remarks}</div>}
                    </div>

                    <div className="test-score-col">
                      <div className="flex items-center gap-2">
                        <div className={`score-badge ${isPassed ? 'score-pass' : 'score-fail'}`}>
                          {test.marksObtained} / {test.totalMarks}
                        </div>
                        <span className="text-xs text-white font-bold">{percentage}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setActiveScorecard({ test, student: currentStudent })}
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        >
                          <FileText size={11} />
                          <span>View Scorecard</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. HOMEWORK & LEARNING TRACKER SECTION */}
      {/* ============================================================== */}
      {(activePortalSection === 'overview' || activePortalSection === 'homework') && (
        <div className="portal-section-card glass-card">
          <div className="section-title-row">
            <div className="section-title-group">
              <div className="title-icon-badge bg-emerald-soft">
                <CheckSquare size={18} className="text-emerald" />
              </div>
              <h3 className="section-title">Homework &amp; Daily Learning</h3>
            </div>
            <span className={`badge ${homeworkBadge.class}`}>{homeworkBadge.label}</span>
          </div>

          <div className="homework-layout-grid">
            {/* Today's Ongoing Lesson & Task */}
            <div className="homework-item-card p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-3xs text-muted uppercase tracking-wider mb-1 font-bold">Classroom Topic Taught</div>
              <div className="text-sm font-bold text-white mb-2">{currentHomework.subject}: {currentHomework.topic}</div>

              <div className="text-3xs text-muted uppercase tracking-wider mb-1 font-bold">Homework Given</div>
              <p className="text-xs text-secondary leading-relaxed mb-3">
                {currentHomework.homeworkTask}
              </p>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-muted">Due Date: <strong>{currentHomework.dueDate || 'Next Class'}</strong></span>
                <span className="badge badge-success text-3xs font-semibold">Active Homework</span>
              </div>
            </div>

            {/* Weekly Consistency & Standards Note */}
            <div className="homework-consistency-box p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-3xs text-muted uppercase tracking-wider mb-1 font-bold">Weekly Homework Status</div>
              <div className="hw-status-prominent mb-2">
                <span className={`badge ${homeworkBadge.class}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  {homeworkBadge.label}
                </span>
              </div>
              <div className="hw-guidance-quote text-xs text-amber-200 bg-amber-950/20 p-2.5 rounded border border-amber-900/30 mb-2">
                💬 <em>"Homework completion needs regular consistency to retain class lessons."</em>
              </div>
              <div className="text-3xs text-muted">
                Tip: Completing homework on the same evening takes only 25 minutes and avoids backlog!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. ATTENDANCE SECTION */}
      {/* ============================================================== */}
      {(activePortalSection === 'overview' || activePortalSection === 'attendance') && (
        <div className="portal-section-card glass-card">
          <div className="section-title-row">
            <div className="section-title-group">
              <div className="title-icon-badge bg-emerald-soft">
                <Calendar size={18} className="text-emerald" />
              </div>
              <h3 className="section-title">Attendance &amp; Regularity Log</h3>
            </div>
            <span className="badge badge-success font-mono text-xs">{attendanceRate}% Present</span>
          </div>

          <div className="attendance-grid-layout">
            <div>
              <div className="text-xs font-semibold text-secondary mb-2">Recent Roll Call Records:</div>
              {recentAttendance.length === 0 ? (
                <div className="text-xs text-muted">Attendance records will appear here as daily roll calls are recorded.</div>
              ) : (
                <div className="attendance-log-pills">
                  {recentAttendance.map((rec, i) => (
                    <div key={i} className={`attendance-log-item ${rec.status === 'ABSENT' ? 'log-absent' : 'log-present'}`}>
                      <span className="log-date font-mono">{rec.date}</span>
                      <span className={`badge badge-sm ${rec.status === 'ABSENT' ? 'badge-danger' : 'badge-success'}`}>
                        {rec.status === 'ABSENT' ? '✕ Absent' : '✓ Present'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="attendance-stats-summary p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-xs font-bold text-white mb-2">Monthly Regularity Ratio</div>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <div className="text-2xl font-extrabold text-emerald">{presentDays}</div>
                  <div className="text-3xs text-muted">Classes Attended</div>
                </div>
                <div className="border-l border-slate-700 pl-4">
                  <div className="text-2xl font-extrabold text-rose">{absentDays}</div>
                  <div className="text-3xs text-muted">Leaves / Absent</div>
                </div>
              </div>
              <div className="text-xs text-secondary">
                Regular attendance is the key pillar for board and class syllabus mastery.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MONTHLY PROGRESS SUMMARY SECTION */}
      {/* ============================================================== */}
      {(activePortalSection === 'overview' || activePortalSection === 'progress') && (
        <div className="portal-section-card glass-card">
          <div className="section-title-row">
            <div className="section-title-group">
              <div className="title-icon-badge bg-purple-soft">
                <TrendingUp size={18} className="text-purple" />
              </div>
              <h3 className="section-title">Monthly Progress Summary Report</h3>
            </div>
            <span className="badge badge-success font-mono text-xs">Overall: Steady Growth</span>
          </div>

          <div className="progress-summary-table-box">
            <div className="progress-summary-row">
              <div className="summary-col-label">📅 Attendance</div>
              <div className="summary-col-status">
                <span className="font-bold text-emerald">{attendanceRate}%</span> ({presentDays} Present)
              </div>
              <div className="summary-col-verdict text-muted text-xs">Very regular attendance</div>
            </div>

            <div className="progress-summary-row">
              <div className="summary-col-label">📊 Exam Performance</div>
              <div className="summary-col-status">
                <span className="font-bold text-primary">{avgPercentage}%</span> Average ({passedTests}/{testsCount} Passed)
              </div>
              <div className="summary-col-verdict text-muted text-xs">Consistent test marks</div>
            </div>

            <div className="progress-summary-row">
              <div className="summary-col-label">📝 Homework</div>
              <div className="summary-col-status">
                <span className={`badge ${homeworkBadge.class}`}>{homeworkBadge.label}</span>
              </div>
              <div className="summary-col-verdict text-muted text-xs">Daily tasks submitted</div>
            </div>

            <div className="progress-summary-row">
              <div className="summary-col-label">👩‍🏫 Tutor Feedback</div>
              <div className="summary-col-status font-semibold text-white">
                🌟 {studentFeedback.strength} & Focus on {studentFeedback.improvementArea}
              </div>
              <div className="summary-col-verdict text-muted text-xs">Actionable plan active</div>
            </div>

            <div className="progress-summary-row overall-verdict-row">
              <div className="summary-col-label font-bold text-white">🚀 Overall Verdict</div>
              <div className="summary-col-status">
                <span className="badge badge-success text-xs font-bold">Good Academic Progress</span>
              </div>
              <div className="summary-col-verdict text-xs text-indigo-200">
                Continue the 15-minute daily revision for top exam results.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BOTTOM MENU / QUICK ACTIONS (User Specification) */}
      {/* ============================================================== */}
      <div className="portal-bottom-menu glass-card">
        <div className="bottom-menu-inner">
          <button 
            type="button" 
            className="bottom-menu-btn"
            onClick={() => setNoticesModalOpen(true)}
          >
            <Megaphone size={16} className="text-amber" />
            <span>Notifications ({relevantAnnouncements.length})</span>
          </button>

          <button 
            type="button" 
            className="bottom-menu-btn"
            onClick={() => setFeeModalOpen(true)}
          >
            <IndianRupee size={16} className={totalDue > 0 ? 'text-rose' : 'text-emerald'} />
            <span>Fees {totalDue > 0 ? `(₹${totalDue} Due)` : '(Cleared)'}</span>
          </button>

          <button 
            type="button" 
            className="bottom-menu-btn"
            onClick={() => setContactModalOpen(true)}
          >
            <Phone size={16} className="text-sky" />
            <span>Contact Tutor</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}

      {/* 1. Scorecard Modal */}
      {activeScorecard && (
        <div className="modal-overlay">
          <div className="modal-content report-card-modal">
            <div className="modal-header">
              <span className="badge badge-class">Academic Test Scorecard</span>
              <button className="close-btn" onClick={() => setActiveScorecard(null)}>
                <X size={20} />
              </button>
            </div>

            <div id="parent-scorecard-card" className="scorecard-paper">
              <div className="scorecard-banner">
                <h3 className="scorecard-inst">HAYAGRIVA TUTORIALS</h3>
                <div className="scorecard-sub">Student Performance Assessment Report</div>
              </div>

              <div className="scorecard-details">
                <div><strong>Student Name:</strong> {activeScorecard.student.name}</div>
                <div><strong>Admission No:</strong> {activeScorecard.student.admissionNo}</div>
                <div><strong>Standard:</strong> {studentClass?.name || 'Class 10'}</div>
                <div><strong>School:</strong> {activeScorecard.student.school || 'Unspecified'}</div>
              </div>

              <div className="scorecard-marks-highlight">
                <div className="score-circle">
                  <div className="score-num">{activeScorecard.test.marksObtained}</div>
                  <div className="score-denom">/ {activeScorecard.test.totalMarks}</div>
                </div>
                <div className="score-summary">
                  <div className="font-bold text-lg">{activeScorecard.test.examTitle}</div>
                  <div className="text-xs text-muted">
                    Subject: <strong>{activeScorecard.test.subject}</strong> • Date: {activeScorecard.test.date}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="badge badge-success">
                      Score: {Math.round((activeScorecard.test.marksObtained / activeScorecard.test.totalMarks) * 100)}%
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {activeScorecard.test.marksObtained >= activeScorecard.test.passingMarks ? 'Status: PASSED' : 'Status: Needs Revision'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="scorecard-teacher-remarks">
                <strong>Faculty Remarks:</strong> {activeScorecard.test.remarks || 'Consistent effort shown in tests. Regular revision recommended.'}
              </div>
            </div>

            <div className="modal-actions-flex mt-4" style={{ justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-primary"
                  disabled={downloadingScorecard}
                  onClick={handleDownloadParentScorecard}
                >
                  <Download size={14} />
                  <span>{downloadingScorecard ? 'Generating Image...' : 'Save Card (.PNG)'}</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setActiveScorecard(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Fees Modal */}
      {feeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <IndianRupee size={18} className="text-emerald" />
                <span>Tuition Fee Status & Receipts</span>
              </h3>
              <button className="close-btn" onClick={() => setFeeModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between p-3 rounded-lg mb-3" style={{ background: totalDue > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div className="text-3xs text-muted uppercase font-bold">Current Balance Due</div>
                  <div className={`text-xl font-extrabold ${totalDue > 0 ? 'text-rose' : 'text-emerald'}`}>
                    ₹{totalDue}
                  </div>
                </div>
                <span className={`badge ${totalDue > 0 ? 'badge-danger' : 'badge-success'}`}>
                  {totalDue > 0 ? 'Pending Dues' : 'Full Paid'}
                </span>
              </div>

              <div className="text-xs font-bold text-white mb-2">Monthly Fee Ledger:</div>
              <div className="mini-ledger-list">
                {studentFees.map((fee, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800 mb-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-white">{fee.monthYear}</span>
                      <div className="text-3xs text-muted">Status: {fee.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald">Paid: ₹{fee.amountPaid}</div>
                      {fee.balance > 0 && <div className="text-3xs text-rose font-bold">Due: ₹{fee.balance}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions-flex">
              <button type="button" className="btn btn-secondary" onClick={() => setFeeModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Notifications Modal */}
      {noticesModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Megaphone size={18} className="text-amber" />
                <span>Tuition Notices & Class Updates</span>
              </h3>
              <button className="close-btn" onClick={() => setNoticesModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-3">
              {relevantAnnouncements.length === 0 ? (
                <div className="text-xs text-muted text-center p-4">No new notices posted at this time.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {relevantAnnouncements.map(ann => (
                    <div key={ann.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">{ann.title}</span>
                        <span className="text-3xs text-muted font-mono">{ann.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-0">
                        {ann.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions-flex">
              <button type="button" className="btn btn-secondary" onClick={() => setNoticesModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Contact Tutor Modal */}
      {contactModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Phone size={18} className="text-sky" />
                <span>Contact Faculty / Academy</span>
              </h3>
              <button className="close-btn" onClick={() => setContactModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="text-xs text-secondary mb-3">
                Have questions regarding {currentStudent?.name || 'your child'}'s studies or attendance? Connect directly with faculty:
              </div>

              <div className="flex flex-col gap-2.5">
                <a 
                  href={facultyWhatsAppUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#10B981', color: 'white' }}
                >
                  <MessageSquare size={16} />
                  <span>WhatsApp Hayagriva Tutorials</span>
                </a>

                <a 
                  href="tel:9848266892" 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Phone size={16} />
                  <span>Call Academy Helpline (9848266892)</span>
                </a>
              </div>
            </div>

            <div className="modal-actions-flex">
              <button type="button" className="btn btn-secondary" onClick={() => setContactModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .parent-portal-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .portal-header-card { padding: 22px; }
        .parent-greeting {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #A5B4FC;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .parent-title { font-size: 1.45rem; font-weight: 800; color: white; margin-bottom: 4px; }
        .parent-sub { font-size: 0.825rem; color: var(--text-secondary); }
        .header-btn-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .portal-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }
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
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
        }
        .student-profile-main { display: flex; align-items: center; gap: 16px; }
        .student-avatar-box {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
        }
        .student-name-lg { font-size: 1.3rem; font-weight: 800; color: white; }
        .student-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .tuition-batch-info-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          min-width: 240px;
        }
        .batch-name-val { font-size: 0.925rem; font-weight: 700; color: white; }
        .batch-timing-val, .batch-tutor-val {
          display: flex; align-items: center; gap: 6px; font-size: 0.775rem; color: var(--text-secondary); margin-top: 3px;
        }

        /* Quick Overview Bar */
        .quick-overview-bar { padding: 18px; }
        .overview-title-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }
        .overview-label {
          font-size: 0.85rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .overview-kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .overview-kpi-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .overview-kpi-item:hover {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
        }
        .kpi-icon-mini {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .overview-kpi-lbl { font-size: 0.725rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .overview-kpi-val { font-size: 1.15rem; font-weight: 800; line-height: 1.2; margin: 2px 0; }
        .overview-kpi-note { font-size: 0.725rem; color: var(--text-secondary); }

        .bg-emerald-subtle { background: rgba(16, 185, 129, 0.12); }
        .bg-primary-subtle { background: rgba(99, 102, 241, 0.12); }
        .bg-amber-subtle { background: rgba(245, 158, 11, 0.12); }
        .bg-sky-subtle { background: rgba(14, 165, 233, 0.12); }
        .bg-purple-subtle { background: rgba(168, 85, 247, 0.12); }

        /* Section navigation pills */
        .section-pills-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .section-nav-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-full);
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .section-nav-pill:hover { color: white; background: rgba(255, 255, 255, 0.05); }
        .section-nav-pill.active {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-400);
        }

        /* Section Cards */
        .portal-section-card { 
          padding: 24px; 
          margin-bottom: 24px;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 16px;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .section-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .title-icon-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .bg-amber-soft {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.25);
        }
        .bg-primary-soft {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .bg-emerald-soft {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.25);
        }
        .bg-purple-soft {
          background: rgba(168, 85, 247, 0.12);
          border-color: rgba(168, 85, 247, 0.25);
        }
        .section-title { 
          font-size: 1.1rem; 
          font-weight: 700; 
          color: white; 
          margin: 0;
          line-height: 1.3;
        }

        /* Three Pillars Grid */
        .three-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 860px) {
          .three-pillars-grid {
            grid-template-columns: 1fr;
          }
        }
        .pillar-box {
          padding: 16px;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .pillar-box:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.18);
        }
        .pillar-strength { 
          border-top: 3px solid #10B981; 
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, rgba(15, 23, 42, 0.6) 100%);
        }
        .pillar-improvement { 
          border-top: 3px solid #F59E0B; 
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.06) 0%, rgba(15, 23, 42, 0.6) 100%);
        }
        .pillar-action { 
          border-top: 3px solid #0EA5E9; 
          background: linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, rgba(15, 23, 42, 0.6) 100%);
        }
        .pillar-top-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .pillar-step-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
        }
        .step-emerald { background: #10B981; }
        .step-amber { background: #F59E0B; }
        .step-sky { background: #0EA5E9; }

        .pillar-tag {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .pillar-val {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.15rem;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }
        .pillar-emoji {
          font-size: 1.25rem;
          line-height: 1;
        }
        .pillar-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Auto-Generated Parent Message Box */
        .auto-parent-msg-box {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-md);
          padding: 18px;
        }
        .advice-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
        }
        .advice-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.35);
          flex-shrink: 0;
        }
        .advice-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: block;
        }
        .advice-sub {
          font-size: 0.725rem;
          color: var(--text-muted);
          display: block;
        }
        .parent-advice-content {
          margin-bottom: 10px;
        }
        .parent-advice-text {
          font-size: 0.9rem;
          line-height: 1.65;
          color: #E0E7FF;
          font-weight: 450;
        }
        .faculty-remark-card {
          margin-top: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          background: rgba(15, 23, 42, 0.6);
          border-left: 3px solid #6366F1;
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .remark-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #818CF8;
          white-space: nowrap;
        }
        .remark-quote {
          font-size: 0.825rem;
          color: #CBD5E1;
          font-style: italic;
        }

        /* Monthly Goal Box */
        .monthly-goal-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-md);
          padding: 18px;
        }
        .goal-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(245, 158, 11, 0.15);
        }
        .goal-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .goal-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          flex-shrink: 0;
        }
        .goal-heading-text {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: block;
        }
        .goal-heading-sub {
          font-size: 0.725rem;
          color: var(--text-muted);
          display: block;
        }

        .goal-content-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .goal-content-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
        .goal-desc-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .goal-target-phrase {
          font-size: 1.05rem;
          font-weight: 800;
          color: #FBBF24;
          line-height: 1.4;
        }
        .goal-note-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .goal-metric-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .goal-metric-badges {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .metric-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
        }
        .pill-current {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .pill-target {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .metric-label {
          color: var(--text-muted);
          font-size: 0.725rem;
        }
        .metric-value {
          font-weight: 800;
          color: white;
        }
        .pill-target .metric-value {
          color: #34D399;
        }

        .goal-progress-bar-bg {
          height: 12px;
          background: rgba(0, 0, 0, 0.45);
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .goal-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #F59E0B, #10B981);
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
        .fill-achieved { background: #10B981 !important; }

        /* Tests List */
        .tests-list { display: flex; flex-direction: column; gap: 10px; }
        .parent-test-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
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
        .test-score-col { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .score-badge { font-size: 0.85rem; font-weight: 800; padding: 3px 8px; border-radius: var(--radius-sm); }
        .score-pass { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .score-fail { background: rgba(244, 63, 94, 0.15); color: #FB7185; border: 1px solid rgba(244, 63, 94, 0.3); }

        /* Homework Badges */
        .badge-hw-green { background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid #10B981; }
        .badge-hw-yellow { background: rgba(245, 158, 11, 0.2); color: #FBBF24; border: 1px solid #F59E0B; }
        .badge-hw-orange { background: rgba(249, 115, 22, 0.2); color: #FB923C; border: 1px solid #F97316; }
        .badge-hw-red { background: rgba(244, 63, 94, 0.2); color: #FB7185; border: 1px solid #F43F5E; }

        .homework-layout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 800px) {
          .homework-layout-grid { grid-template-columns: 1fr; }
        }

        /* Attendance Section */
        .attendance-grid-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }
        @media (max-width: 800px) {
          .attendance-grid-layout { grid-template-columns: 1fr; }
        }
        .attendance-log-pills { display: flex; flex-direction: column; gap: 6px; }
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

        /* Monthly Progress Report Card */
        .progress-summary-table-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progress-summary-row {
          display: grid;
          grid-template-columns: 180px 1fr 1fr;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          font-size: 0.8125rem;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .progress-summary-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
        .overall-verdict-row {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%);
          border-color: rgba(99, 102, 241, 0.3);
        }

        /* Bottom Menu */
        .portal-bottom-menu {
          position: sticky;
          bottom: 12px;
          z-index: 40;
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .bottom-menu-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 10px;
        }
        .bottom-menu-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .bottom-menu-btn:hover {
          background: var(--primary-600);
          border-color: var(--primary-500);
          transform: translateY(-1px);
        }

        /* Scorecard paper */
        .scorecard-paper {
          background: white;
          color: #0f172a;
          border-radius: var(--radius-md);
          padding: 24px;
          border: 1px solid #cbd5e1;
        }
        .scorecard-banner {
          text-align: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .scorecard-inst {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          color: #1e1b4b;
          font-weight: 800;
        }
        .scorecard-sub { font-size: 0.775rem; color: #475569; }
        .scorecard-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 0.8125rem;
          margin-bottom: 20px;
          background: #f8fafc;
          padding: 12px;
          border-radius: var(--radius-sm);
        }
        .scorecard-marks-highlight {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px;
          background: #f1f5f9;
          border-radius: var(--radius-md);
          margin-bottom: 16px;
        }
        .score-circle {
          width: 76px;
          height: 76px;
          border-radius: var(--radius-full);
          background: #4f46e5;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .score-num { font-size: 1.45rem; font-weight: 800; line-height: 1; }
        .score-denom { font-size: 0.75rem; opacity: 0.8; }
        .scorecard-teacher-remarks {
          padding: 12px;
          background: #f8fafc;
          border-left: 3px solid #4f46e5;
          font-size: 0.8125rem;
          color: #334155;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .portal-header-card { padding: 16px 14px; }
          .parent-title { font-size: 1.2rem; }
          .student-hero-card { flex-direction: column; align-items: flex-start; }
          .tuition-batch-info-box { width: 100%; }
          .overview-kpis-grid { grid-template-columns: 1fr 1fr; }
          .bottom-menu-inner { justify-content: space-between; }
          .bottom-menu-btn { padding: 6px 12px; font-size: 0.75rem; }
          .scorecard-details { grid-template-columns: 1fr; }
          .scorecard-marks-highlight { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
