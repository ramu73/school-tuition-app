import React, { useState, useMemo } from 'react';
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
  Download,
  ChevronLeft,
  ChevronRight,
  Check
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
    myChildren[0]?.id || currentUser?.studentId || null
  );

  const [activePortalSection, setActivePortalSection] = useState('overview'); // overview, attendance, exams, homework, feedback, progress
  const [calDate, setCalDate] = useState(() => new Date());
  const [attendanceDisplayMode, setAttendanceDisplayMode] = useState('calendar'); // 'calendar' | 'list'
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

  const currentStudent = myChildren.find(s => s.id === Number(selectedStudentId)) || myChildren[0] || (currentUser?.studentId ? students.find(s => s.id === currentUser.studentId) : null);
  const studentClass = classes.find(c => c.code === currentStudent?.classCode);
  const studentBatch = batches.find(b => b.id === currentStudent?.batchId);

  const todayStr = new Date().toISOString().split('T')[0];
  const admissionDateStr = (currentStudent?.admissionDate || currentStudent?.joiningDate || '').split('T')[0];

  // Calendar calculations for selected month
  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth(); // 0 to 11
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const calMonthLabel = `${monthNames[calMonth]} ${calYear}`;
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sunday

  // Fast map for student attendance records
  const studentAttendanceMap = useMemo(() => {
    const map = new Map();
    (attendance || []).forEach(a => {
      if (a.studentId === currentStudent?.id && a.date) {
        map.set(a.date, a);
      }
    });
    return map;
  }, [attendance, currentStudent?.id]);

  // Selected Month Attendance Calculations
  // In Hayagriva Tutorials, classes run Mon–Sat and students are PRESENT by default unless marked ABSENT
  const {
    monthPresentCount,
    monthAbsentCount,
    monthTotalCount,
    monthPercentage,
    monthAbsenceList
  } = useMemo(() => {
    let classDays = 0;
    let absCount = 0;
    const absList = [];

    for (let day = 1; day <= daysInCalMonth; day++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(calYear, calMonth, day).getDay();
      const isSunday = dayOfWeek === 0;
      const isFuture = dateStr > todayStr;
      const isBeforeAdmission = Boolean(admissionDateStr && dateStr < admissionDateStr);

      if (!isSunday && !isFuture && !isBeforeAdmission) {
        classDays++;
        const rec = studentAttendanceMap.get(dateStr);
        if (rec && rec.status === 'ABSENT') {
          absCount++;
          absList.push(rec);
        }
      }
    }

    const presCount = Math.max(0, classDays - absCount);
    const pct = classDays > 0 ? Math.round((presCount / classDays) * 100) : null;
    absList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
      monthPresentCount: presCount,
      monthAbsentCount: absCount,
      monthTotalCount: classDays,
      monthPercentage: pct,
      monthAbsenceList: absList
    };
  }, [calYear, calMonth, daysInCalMonth, todayStr, admissionDateStr, studentAttendanceMap]);

  // All-time attendance & recent attendance roll call history
  const { presentDays, absentDays, totalMarkedDays, attendanceRate, recentAttendance } = useMemo(() => {
    const termStartDate = '2026-09-01';
    const effectiveStartDate = admissionDateStr && admissionDateStr > termStartDate ? admissionDateStr : termStartDate;

    let totalWorkDays = 0;
    let totalAbs = 0;

    const curr = new Date(effectiveStartDate + 'T00:00:00');
    const end = new Date(todayStr + 'T00:00:00');

    while (curr <= end) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek !== 0) { // Mon-Sat
        totalWorkDays++;
        const dStr = curr.toISOString().split('T')[0];
        const rec = studentAttendanceMap.get(dStr);
        if (rec && rec.status === 'ABSENT') {
          totalAbs++;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    const totalPres = Math.max(0, totalWorkDays - totalAbs);
    const rate = totalWorkDays > 0 ? Math.round((totalPres / totalWorkDays) * 100) : null;

    // Build recent attendance list (last 12 working days from today backwards)
    const recent = [];
    const checkDate = new Date(todayStr + 'T00:00:00');
    let daysChecked = 0;
    while (daysChecked < 30 && recent.length < 12) {
      const dayOfWeek = checkDate.getDay();
      const dStr = checkDate.toISOString().split('T')[0];
      if (dayOfWeek !== 0 && (!admissionDateStr || dStr >= admissionDateStr) && dStr >= termStartDate) {
        const rec = studentAttendanceMap.get(dStr);
        recent.push({
          date: dStr,
          status: rec?.status === 'ABSENT' ? 'ABSENT' : 'PRESENT',
          remarks: rec?.remarks || ''
        });
      }
      checkDate.setDate(checkDate.getDate() - 1);
      daysChecked++;
    }

    return {
      presentDays: totalPres,
      absentDays: totalAbs,
      totalMarkedDays: totalWorkDays,
      attendanceRate: rate,
      recentAttendance: recent
    };
  }, [admissionDateStr, todayStr, studentAttendanceMap]);

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
    : null;

  const latestTest = studentMarks.length > 0 ? studentMarks[studentMarks.length - 1] : null;
  const latestPct = latestTest ? Math.round((latestTest.marksObtained / latestTest.totalMarks) * 100) : null;
  const prevTest = studentMarks.length >= 2 ? studentMarks[studentMarks.length - 2] : null;
  const prevPct = prevTest ? Math.round((prevTest.marksObtained / prevTest.totalMarks) * 100) : null;
  const scoreDiff = (latestPct !== null && prevPct !== null) ? (latestPct - prevPct) : null;

  // Tutor Feedback & Child Improvement Plan
  const studentFeedback = tutorFeedback.find(f => f.studentId === currentStudent?.id) || null;

  // Goal comparison status
  const evaluatedGoal = studentFeedback?.goal ? calculateStudentGoalProgress(studentFeedback.goal, marks.filter(m => m.studentId === currentStudent?.id), exams) : null;

  // Homework & Topic Records
  const studentHomework = homework.filter(h => h.batchId === currentStudent?.batchId || h.classCode === currentStudent?.classCode);
  const currentHomework = studentHomework[0] || null;

  // Weekly Homework Status Helper
  const getHomeworkBadge = (status = '') => {
    if (!status) return { label: '⚪ No Status', class: 'badge-secondary' };
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

  const homeworkBadge = currentHomework 
    ? getHomeworkBadge(studentFeedback?.homeworkStatus || currentHomework.weeklyStatus)
    : { label: '⚪ No Active Homework', class: 'badge-secondary' };

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
              <span><strong>Admission No:</strong> {currentStudent?.admissionNo || 'N/A'}</span>
              <span>•</span>
              <span><strong>School:</strong> {currentStudent?.school || 'N/A'}</span>
              <span>•</span>
              <span><strong>Agreed Fee:</strong> ₹{currentStudent?.monthlyFee || 0}/mo</span>
            </div>
          </div>
        </div>

        <div className="tuition-batch-info-box">
          <div className="text-3xs text-muted uppercase tracking-wider mb-1 font-bold">Assigned Batch & Faculty</div>
          <div className="batch-name-val">{studentBatch?.name || 'Classroom Batch'}</div>
          <div className="batch-timing-val">
            <Clock size={13} />
            <span>{studentBatch?.timing || 'Tuition Hours'}</span>
          </div>
          <div className="batch-tutor-val">
            <User size={13} />
            <span>Faculty: {studentBatch?.tutor || 'Hayagriva Faculty'}</span>
          </div>
        </div>
      </div>

      {/* ⭐ Quick Overview KPI Highlights (User Specification) */}
      <div className="quick-overview-bar glass-card">
        <div className="overview-title-row">
          <span className="overview-label">⚡ Quick Overview</span>
          {studentFeedback?.monthYear && (
            <span className="overview-sub text-muted text-3xs font-mono">{studentFeedback.monthYear}</span>
          )}
        </div>

        <div className="overview-kpis-grid">
          {/* KPI 1: Attendance */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('attendance')}>
            <div className="kpi-icon-mini bg-emerald-subtle text-emerald">
              <Calendar size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Attendance</div>
              <div className="overview-kpi-val text-emerald">
                {attendanceRate !== null ? `${attendanceRate}%` : 'N/A'}
              </div>
              <div className="overview-kpi-note">
                {totalMarkedDays > 0 ? `${presentDays} Present • ${absentDays} Absent` : 'No attendance recorded yet'}
              </div>
            </div>
          </div>

          {/* KPI 2: Latest Test */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('exams')}>
            <div className="kpi-icon-mini bg-primary-subtle text-primary">
              <Award size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Latest Test</div>
              <div className="overview-kpi-val text-primary">
                {latestPct !== null ? `${latestPct}%` : 'N/A'}
              </div>
              <div className="overview-kpi-note">
                {latestTest ? (
                  scoreDiff !== null ? (
                    <span className={scoreDiff >= 0 ? 'text-emerald' : 'text-rose'}>
                      {scoreDiff >= 0 ? `+${scoreDiff}% vs previous` : `${scoreDiff}% vs previous`}
                    </span>
                  ) : (
                    <span>{latestTest?.subject || 'Unit Test'}</span>
                  )
                ) : (
                  <span>No tests recorded yet</span>
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
              <div className="overview-kpi-note text-3xs mt-1">
                {currentHomework ? 'Consistency Tracked' : 'No active homework'}
              </div>
            </div>
          </div>

          {/* KPI 4: Tutor Feedback */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('feedback')}>
            <div className="kpi-icon-mini bg-sky-subtle text-sky">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Tutor Feedback</div>
              {studentFeedback ? (
                <>
                  <div className="overview-kpi-val text-white text-xs mt-1 font-bold">
                    🌟 {studentFeedback.monthlyProgress || 'Good Progress'}
                  </div>
                  <div className="overview-kpi-note text-3xs mt-1">Focus: {studentFeedback.focusArea || studentFeedback.improvementArea}</div>
                </>
              ) : (
                <>
                  <div className="overview-kpi-val text-muted text-xs mt-1">
                    Pending
                  </div>
                  <div className="overview-kpi-note text-3xs mt-1">Awaiting evaluation</div>
                </>
              )}
            </div>
          </div>

          {/* KPI 5: Monthly Progress */}
          <div className="overview-kpi-item" onClick={() => setActivePortalSection('progress')}>
            <div className="kpi-icon-mini bg-purple-subtle text-purple">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="overview-kpi-lbl">Monthly Progress</div>
              {studentFeedback ? (
                <>
                  <div className="overview-kpi-val text-emerald text-xs mt-1 font-bold">
                    🚀 {studentFeedback.monthlyProgress || 'Improving'}
                  </div>
                  <div className="overview-kpi-note text-3xs mt-1">Steady Academic Growth</div>
                </>
              ) : (
                <>
                  <div className="overview-kpi-val text-muted text-xs mt-1">
                    Ongoing
                  </div>
                  <div className="overview-kpi-note text-3xs mt-1">Monthly cycle active</div>
                </>
              )}
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
            {studentFeedback?.monthYear && (
              <span className="badge badge-primary font-mono text-xs">{studentFeedback.monthYear} Evaluation</span>
            )}
          </div>

          {!studentFeedback ? (
            <div className="empty-state-box" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <Sparkles size={36} className="text-amber" style={{ opacity: 0.6, margin: '0 auto 12px' }} />
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>No Tutor Feedback Filed Yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', maxWidth: '460px', margin: '0 auto', lineHeight: '1.6' }}>
                Your child's faculty evaluation and individualized improvement plan will be published here once the tutor records the monthly assessment.
              </p>
            </div>
          ) : (
            <>
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
            </>
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

          {!currentHomework ? (
            <div className="empty-state-box" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <CheckSquare size={36} className="text-emerald" style={{ opacity: 0.6, margin: '0 auto 12px' }} />
              <h4 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>No Active Homework Assigned</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', maxWidth: '460px', margin: '0 auto', lineHeight: '1.6' }}>
                There are no active homework assignments for this batch at this time. Classroom lesson tasks and updates will appear here when posted by faculty.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. ATTENDANCE SECTION (Interactive Calendar with Absence Highlights) */}
      {/* ============================================================== */}
      {(activePortalSection === 'overview' || activePortalSection === 'attendance') && (
        <div className="portal-section-card glass-card">
          <div className="section-title-row">
            <div className="section-title-group">
              <div className="title-icon-badge bg-emerald-soft">
                <Calendar size={18} className="text-emerald" />
              </div>
              <div>
                <h3 className="section-title">Attendance &amp; Regularity Calendar</h3>
                <p className="text-3xs text-secondary mt-0.5">Monthly calendar view with highlighted absence days and tutor remarks</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="attendance-view-toggle">
                <button
                  type="button"
                  className={`btn-toggle-view ${attendanceDisplayMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => setAttendanceDisplayMode('calendar')}
                >
                  <Calendar size={12} />
                  <span>Calendar</span>
                </button>
                <button
                  type="button"
                  className={`btn-toggle-view ${attendanceDisplayMode === 'list' ? 'active' : ''}`}
                  onClick={() => setAttendanceDisplayMode('list')}
                >
                  <FileText size={12} />
                  <span>List</span>
                </button>
              </div>
              <span className={`badge ${monthAbsentCount > 0 ? 'badge-warning' : 'badge-success'} font-mono text-xs`}>
                {monthTotalCount > 0 ? `${monthPercentage}% ${monthNames[calMonth]}` : (attendanceRate !== null ? `${attendanceRate}% Overall` : 'No Records')}
              </span>
            </div>
          </div>

          {/* 🚨 Prominent High-Visibility Absence Alert */}
          {monthAbsentCount > 0 ? (
            <div className="absence-banner-card mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="absence-pulsing-dot" />
                  <span className="font-bold text-rose text-sm">
                    {monthAbsentCount} {monthAbsentCount === 1 ? 'Day' : 'Days'} Absent Highlighted in {calMonthLabel}
                  </span>
                </div>
                <span className="badge badge-danger text-xs font-mono font-bold">
                  {monthAbsentCount} {monthAbsentCount === 1 ? 'Missed Class' : 'Missed Classes'}
                </span>
              </div>
              <div className="absence-chip-list">
                {monthAbsenceList.map((rec, i) => (
                  <div key={i} className="absence-day-chip">
                    <span className="chip-cross-icon">✕</span>
                    <span className="chip-date-text">
                      {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {rec.remarks ? (
                      <span className="chip-reason-tag">Note: {rec.remarks}</span>
                    ) : (
                      <span className="chip-reason-tag muted">Uninformed leave</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="absence-action-hint text-3xs text-secondary mt-2">
                📌 <strong>Parent Tip:</strong> Regular attendance directly correlates with exam scores. Check the <em>Homework &amp; Daily Learning</em> tab to catch up on lessons taught on these dates.
              </div>
            </div>
          ) : monthTotalCount > 0 ? (
            <div className="perfect-attendance-banner mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald" />
                <span className="text-xs font-semibold text-emerald">
                  🌟 100% Perfect Attendance in {calMonthLabel}! {currentStudent?.name} has attended all scheduled sessions.
                </span>
              </div>
            </div>
          ) : null}

          {/* Quick Metrics Bar for Selected Month */}
          <div className="cal-metrics-bar mb-3">
            <div className="cal-metric-box">
              <span className="cal-metric-lbl">Total Recorded</span>
              <span className="cal-metric-num text-white">{monthTotalCount}</span>
            </div>
            <div className="cal-metric-box metric-present">
              <span className="cal-metric-lbl">Present Days</span>
              <span className="cal-metric-num text-emerald">{monthPresentCount}</span>
            </div>
            <div className={`cal-metric-box metric-absent ${monthAbsentCount > 0 ? 'highlight-box' : ''}`}>
              <span className="cal-metric-lbl">Absent Days</span>
              <span className="cal-metric-num text-rose font-bold">{monthAbsentCount}</span>
            </div>
            <div className="cal-metric-box">
              <span className="cal-metric-lbl">Monthly Ratio</span>
              <span className="cal-metric-num text-sky">{monthTotalCount > 0 ? `${monthPercentage}%` : '—'}</span>
            </div>
          </div>

          {attendanceDisplayMode === 'calendar' ? (
            <div className="parent-calendar-container">
              {/* Calendar Controls */}
              <div className="cal-controls-row mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm cal-nav-btn"
                    onClick={() => setCalDate(new Date(calYear, calMonth - 1, 1))}
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="cal-current-month-heading">
                    {calMonthLabel}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm cal-nav-btn"
                    onClick={() => setCalDate(new Date(calYear, calMonth + 1, 1))}
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setCalDate(new Date())}
                  style={{ fontSize: '0.72rem', padding: '3px 9px' }}
                >
                  Current Month
                </button>
              </div>

              {/* Day of week headers */}
              <div className="cal-week-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                  <div key={idx} className={`cal-week-head ${idx === 0 ? 'text-rose-head' : ''}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="cal-days-grid">
                {/* Empty cells for leading offset */}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="cal-cell cal-cell-empty" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInCalMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayOfWeek = new Date(calYear, calMonth, dayNum).getDay();
                  const isSunday = dayOfWeek === 0;
                  const isToday = dateStr === todayStr;
                  const isFuture = dateStr > todayStr;
                  const isBeforeAdmission = Boolean(admissionDateStr && dateStr < admissionDateStr);
                  const record = studentAttendanceMap.get(dateStr);
                  const isAbsent = record && record.status === 'ABSENT';
                  const isHoliday = record && (record.status === 'HOLIDAY' || record.status === 'NO_CLASS');
                  
                  // In Hayagriva Tutorials, students are PRESENT by default on all scheduled class days (Mon-Sat)
                  const isPresent = !isAbsent && !isHoliday && (
                    (record && (record.status === 'PRESENT' || record.status === 'LATE')) ||
                    (!isSunday && !isFuture && !isBeforeAdmission)
                  );

                  let cellClass = 'cal-cell';
                  if (isAbsent) cellClass += ' cell-absent';
                  else if (isPresent) cellClass += ' cell-present';
                  else if (isSunday) cellClass += ' cell-weekend';
                  else if (isFuture) cellClass += ' cell-future';
                  else cellClass += ' cell-future';

                  if (isToday) cellClass += ' cell-today';

                  return (
                    <div key={dayNum} className={cellClass}>
                      <div className="cell-top-bar">
                        <span className={`cell-day-number ${isToday ? 'today-pill' : ''}`}>
                          {dayNum}
                        </span>
                        {isToday && <span className="today-badge">Today</span>}
                      </div>

                      <div className="cell-status-content">
                        {isAbsent ? (
                          <div className="absent-marker-box">
                            <span className="badge-absent-glow">✕ ABSENT</span>
                            {record?.remarks && (
                              <span className="cell-remark-text" title={record.remarks}>
                                {record.remarks}
                              </span>
                            )}
                          </div>
                        ) : isPresent ? (
                          <div className="present-marker-box">
                            <span className="badge-present-subtle">✓ Present</span>
                          </div>
                        ) : isSunday ? (
                          <span className="cell-dim-label">Weekend</span>
                        ) : (
                          <span className="cell-dim-label">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="cal-legend-bar mt-3">
                <div className="legend-item">
                  <span className="legend-dot dot-present" />
                  <span>Present (Default on Class Days)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-absent" />
                  <span className="font-bold text-rose">Absent (Highlighted in Red)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-weekend" />
                  <span>Sunday / Weekend</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-today" />
                  <span>Today</span>
                </div>
              </div>
            </div>
          ) : (
            /* Traditional List View Fallback */
            <div className="attendance-grid-layout">
              <div>
                <div className="text-xs font-semibold text-secondary mb-2">Roll Call History:</div>
                {recentAttendance.length === 0 ? (
                  <div className="text-xs text-muted">No attendance marked for this student yet.</div>
                ) : (
                  <div className="attendance-log-pills">
                    {recentAttendance.map((rec, i) => (
                      <div key={i} className={`attendance-log-item ${rec.status === 'ABSENT' ? 'log-absent' : 'log-present'}`}>
                        <div className="flex items-center gap-2">
                          <span className="log-date font-mono">{rec.date}</span>
                          {rec.remarks && <span className="text-3xs text-secondary italic">({rec.remarks})</span>}
                        </div>
                        <span className={`badge badge-sm ${rec.status === 'ABSENT' ? 'badge-danger' : 'badge-success'}`}>
                          {rec.status === 'ABSENT' ? '✕ Absent' : '✓ Present'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="attendance-stats-summary p-3 rounded-lg" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}>
                <div className="text-xs font-bold text-white mb-2">All-Time Attendance Ratio</div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <div className="text-2xl font-extrabold text-emerald">{presentDays}</div>
                    <div className="text-3xs text-muted">Total Present</div>
                  </div>
                  <div className="border-l border-slate-700 pl-4">
                    <div className="text-2xl font-extrabold text-rose">{absentDays}</div>
                    <div className="text-3xs text-muted">Total Absent</div>
                  </div>
                </div>
                <div className="text-xs text-secondary">
                  Regular attendance is the key pillar for board and class syllabus mastery.
                </div>
              </div>
            </div>
          )}
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
                {attendanceRate !== null ? (
                  <>
                    <span className="font-bold text-emerald">{attendanceRate}%</span> ({presentDays} Present)
                  </>
                ) : (
                  <span className="text-muted text-xs">No records yet</span>
                )}
              </div>
              <div className="summary-col-verdict text-muted text-xs">
                {attendanceRate !== null ? (attendanceRate >= 85 ? 'Very regular attendance' : 'Needs improved consistency') : 'Pending roll call'}
              </div>
            </div>

            <div className="progress-summary-row">
              <div className="summary-col-label">📊 Exam Performance</div>
              <div className="summary-col-status">
                {avgPercentage !== null ? (
                  <>
                    <span className="font-bold text-primary">{avgPercentage}%</span> Average ({passedTests}/{testsCount} Passed)
                  </>
                ) : (
                  <span className="text-muted text-xs">No tests recorded yet</span>
                )}
              </div>
              <div className="summary-col-verdict text-muted text-xs">
                {avgPercentage !== null ? 'Consistent test marks' : 'Pending exams'}
              </div>
            </div>

            <div className="progress-summary-row">
              <div className="summary-col-label">📝 Homework</div>
              <div className="summary-col-status">
                <span className={`badge ${homeworkBadge.class}`}>{homeworkBadge.label}</span>
              </div>
              <div className="summary-col-verdict text-muted text-xs">
                {currentHomework ? 'Daily tasks submitted' : 'No active homework'}
              </div>
            </div>

            <div className="progress-summary-row">
              <div className="summary-col-label">👩‍🏫 Tutor Feedback</div>
              <div className="summary-col-status font-semibold text-white">
                {studentFeedback ? (
                  `🌟 ${studentFeedback.strength} & Focus on ${studentFeedback.improvementArea}`
                ) : (
                  <span className="text-muted text-xs font-normal">Awaiting monthly evaluation</span>
                )}
              </div>
              <div className="summary-col-verdict text-muted text-xs">
                {studentFeedback ? 'Actionable plan active' : 'Evaluation pending'}
              </div>
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

        /* Attendance Section & Calendar */
        .attendance-view-toggle {
          display: inline-flex;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 2px;
          gap: 2px;
        }
        .btn-toggle-view {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-toggle-view:hover { color: #FFF; }
        .btn-toggle-view.active {
          background: var(--primary-600);
          color: #FFF;
          box-shadow: 0 1px 4px rgba(79, 70, 229, 0.4);
        }

        /* Absence Highlight Banner */
        .absence-banner-card {
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.16) 0%, rgba(30, 27, 46, 0.7) 100%);
          border: 1.5px solid rgba(244, 63, 94, 0.45);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          box-shadow: 0 0 20px rgba(244, 63, 94, 0.15);
        }
        .absence-pulsing-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #F43F5E;
          box-shadow: 0 0 10px #F43F5E;
          animation: pulseDot 1.5s infinite;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .absence-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        .absence-day-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(244, 63, 94, 0.22);
          border: 1px solid rgba(244, 63, 94, 0.55);
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          color: #FFF;
        }
        .chip-cross-icon {
          color: #FDA4AF;
          font-weight: 800;
        }
        .chip-date-text {
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .chip-reason-tag {
          font-size: 0.7rem;
          background: rgba(0, 0, 0, 0.35);
          padding: 2px 6px;
          border-radius: 4px;
          color: #FECDD3;
        }
        .chip-reason-tag.muted {
          color: #94A3B8;
        }

        .perfect-attendance-banner {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          padding: 10px 14px;
        }

        /* Quick Metrics Bar */
        .cal-metrics-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 600px) {
          .cal-metrics-bar { grid-template-columns: repeat(2, 1fr); }
        }
        .cal-metric-box {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cal-metric-box.highlight-box {
          background: rgba(244, 63, 94, 0.12);
          border-color: rgba(244, 63, 94, 0.4);
        }
        .cal-metric-lbl {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 600;
        }
        .cal-metric-num {
          font-size: 1.15rem;
          font-weight: 800;
          font-family: var(--font-heading);
        }

        /* Calendar Layout */
        .parent-calendar-container {
          background: rgba(11, 15, 25, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .cal-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cal-current-month-heading {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 800;
          color: #FFF;
          min-width: 160px;
          text-align: center;
        }
        .cal-nav-btn {
          padding: 4px 10px !important;
        }
        .cal-week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          margin-bottom: 6px;
        }
        .cal-week-head {
          text-align: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .text-rose-head { color: #FB7185 !important; }

        .cal-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .cal-cell {
          min-height: 72px;
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 6px 7px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        @media (max-width: 600px) {
          .cal-cell { min-height: 56px; padding: 4px; }
        }
        .cal-cell-empty {
          background: transparent;
          border-color: transparent;
        }
        .cell-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cell-day-number {
          font-size: 0.8rem;
          font-weight: 700;
          color: #CBD5E1;
        }
        .today-pill {
          background: var(--primary-500);
          color: #FFF;
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 0.72rem;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
        }
        .today-badge {
          font-size: 0.6rem;
          color: #A5B4FC;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Absent Cell Highlight (HIGH VISIBILITY) */
        .cell-absent {
          background: rgba(244, 63, 94, 0.18) !important;
          border: 1.5px solid #F43F5E !important;
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.3) !important;
        }
        .absent-marker-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
        }
        .badge-absent-glow {
          background: #F43F5E;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
          display: inline-block;
          text-align: center;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 6px rgba(244, 63, 94, 0.5);
        }
        .cell-remark-text {
          font-size: 0.62rem;
          color: #FECDD3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-style: italic;
        }

        /* Present Cell */
        .cell-present {
          background: rgba(16, 185, 129, 0.09) !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }
        .present-marker-box {
          margin-top: 2px;
        }
        .badge-present-subtle {
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 4px;
          display: inline-block;
        }

        /* Weekend / Future / No Session */
        .cell-weekend {
          background: rgba(15, 23, 42, 0.25);
          opacity: 0.65;
        }
        .cell-future {
          background: rgba(15, 23, 42, 0.15);
          opacity: 0.4;
          border-style: dashed;
        }
        .cell-no-session {
          background: rgba(15, 23, 42, 0.25);
        }
        .cell-dim-label {
          font-size: 0.62rem;
          color: var(--text-muted);
        }

        /* Calendar Legend */
        .cal-legend-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
        .dot-present { background: #10B981; }
        .dot-absent { background: #F43F5E; box-shadow: 0 0 6px rgba(244, 63, 94, 0.6); }
        .dot-weekend { background: rgba(255, 255, 255, 0.2); }
        .dot-today { background: var(--primary-500); }

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
