import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Zap, 
  MessageSquare, 
  Users, 
  Check, 
  X, 
  AlertTriangle, 
  Search, 
  RotateCcw, 
  Copy, 
  ArrowRight,
  Filter,
  Sparkles,
  ListChecks,
  CheckCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { generateNextId } from '../lib/storage';
import { USER_ROLES } from '../lib/auth';

export default function Attendance({ 
  data, 
  currentUser, 
  onSaveData, 
  viewMode: propViewMode, 
  onViewModeChange,
  selectedBatchId: propSelectedBatchId,
  onSelectedBatchChange
}) {
  const { students = [], batches = [], classes = [], attendance = [] } = data;
  const isTeacher = currentUser?.role === USER_ROLES.TEACHER;
  const assignedBatchIds = Array.isArray(currentUser?.assignedBatchIds) 
    ? currentUser.assignedBatchIds.map(String) 
    : [];
  const assignedStudentIds = Array.isArray(currentUser?.assignedStudentIds)
    ? currentUser.assignedStudentIds.map(String)
    : [];

  // Scoped datasets for teacher
  const accessibleBatches = isTeacher 
    ? batches.filter(b => {
        const inBatch = assignedBatchIds.includes(String(b.id));
        const hasAssignedStudent = assignedStudentIds.length > 0 && 
          students.some(s => assignedStudentIds.includes(String(s.id)) && String(s.batchId) === String(b.id));
        return inBatch || hasAssignedStudent;
      })
    : batches;

  const accessibleStudents = isTeacher 
    ? students.filter(s => {
        const inBatch = s.batchId && assignedBatchIds.includes(String(s.batchId));
        const directStudent = assignedStudentIds.includes(String(s.id));
        return inBatch || directStudent;
      })
    : students;

  // Classes represented among accessible students
  const accessibleClassCodes = new Set(accessibleStudents.map(s => s.classCode));
  const accessibleClasses = isTeacher && accessibleClassCodes.size > 0
    ? classes.filter(c => accessibleClassCodes.has(c.code))
    : classes;

  // View Mode: 'all-absentees' (Consolidated master list) vs 'batch' (Batch-by-batch roll call)
  const [internalViewMode, setInternalViewMode] = useState(propViewMode || (isTeacher ? 'batch' : 'all-absentees'));
  const currentViewMode = propViewMode !== undefined ? propViewMode : internalViewMode;

  const setViewMode = (mode) => {
    setInternalViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  // Date selection (Defaults to Today)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayDateStr = yesterdayDateObj.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayDateStr);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Holiday Declaration Modal State
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayModalDate, setHolidayModalDate] = useState(todayDateStr);
  const [holidayModalReason, setHolidayModalReason] = useState('');

  // Declared Center Holiday detection for selected date
  const declaredHolidayRec = useMemo(() => {
    return (attendance || []).find(a => a.date === selectedDate && (a.status === 'HOLIDAY' || a.status === 'NO_CLASS'));
  }, [attendance, selectedDate]);

  const isDeclaredHoliday = Boolean(declaredHolidayRec);
  const activeHolidayTitle = declaredHolidayRec?.remarks || 'Tuition Holiday';

  // Map of all declared tuition holidays across the center
  const centerHolidaysMap = useMemo(() => {
    const map = new Map();
    (attendance || []).forEach(a => {
      if ((a.status === 'HOLIDAY' || a.status === 'NO_CLASS') && a.date) {
        if (!map.has(a.date)) {
          map.set(a.date, a.remarks || 'Tuition Holiday');
        }
      }
    });
    return map;
  }, [attendance]);

  // Calendar View Specific States
  const [calDate, setCalDate] = useState(() => new Date());
  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const calMonthLabel = calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Monthly stats for Calendar view
  const calendarMonthStats = useMemo(() => {
    let workingDays = 0;
    let holidayDays = 0;
    let sundayExtraClasses = 0;
    let totalAbsences = 0;

    for (let d = 1; d <= daysInCalMonth; d++) {
      const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(calYear, calMonth, d).getDay();
      const isSun = dayOfWeek === 0;
      const isDeclaredHol = centerHolidaysMap.has(dStr);
      const dayRecords = (attendance || []).filter(a => a.date === dStr);
      const hasSundayExtra = isSun && dayRecords.some(a => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'ABSENT');

      if (isDeclaredHol) {
        holidayDays++;
      } else if (isSun) {
        if (hasSundayExtra) {
          sundayExtraClasses++;
          workingDays++;
        }
      } else {
        workingDays++;
      }

      if (!isDeclaredHol && (!isSun || hasSundayExtra)) {
        const absCount = dayRecords.filter(a => a.status === 'ABSENT').length;
        totalAbsences += absCount;
      }
    }

    return {
      workingDays,
      holidayDays,
      sundayExtraClasses,
      totalAbsences
    };
  }, [calYear, calMonth, daysInCalMonth, centerHolidaysMap, attendance]);

  // Compute sensible default batch ID
  const defaultBatchId = useMemo(() => {
    if (!isTeacher) return accessibleBatches[0]?.id ? String(accessibleBatches[0].id) : '';
    // If teacher: find first accessible batch that actually has assigned students
    const batchWithStudents = accessibleBatches.find(b => 
      accessibleStudents.some(s => String(s.batchId) === String(b.id))
    );
    if (batchWithStudents) return String(batchWithStudents.id);
    if (accessibleBatches[0]?.id) return String(accessibleBatches[0].id);
    if (assignedStudentIds.length > 0) return 'DIRECT_ASSIGNED';
    return '';
  }, [isTeacher, accessibleBatches, accessibleStudents, assignedStudentIds]);

  // Batch View Specific States (Batch-Centric: Students can be from ANY class!)
  const [internalSelectedBatchId, setInternalSelectedBatchId] = useState(
    propSelectedBatchId || defaultBatchId
  );

  // Sync internal selected batch if teacher scope changes
  useEffect(() => {
    if (isTeacher) {
      const validBatchIds = accessibleBatches.map(b => String(b.id));
      if (assignedStudentIds.length > 0) validBatchIds.push('DIRECT_ASSIGNED');
      if (validBatchIds.length > 0 && (!internalSelectedBatchId || !validBatchIds.includes(String(internalSelectedBatchId)))) {
        setInternalSelectedBatchId(defaultBatchId);
      }
    }
  }, [isTeacher, accessibleBatches, assignedStudentIds, defaultBatchId, internalSelectedBatchId]);

  const selectedBatchId = propSelectedBatchId !== undefined && propSelectedBatchId !== ''
    ? propSelectedBatchId
    : internalSelectedBatchId;

  const handleSelectBatch = (bId) => {
    setInternalSelectedBatchId(bId);
    if (onSelectedBatchChange) onSelectedBatchChange(bId);
    setBatchClassFilter('ALL');
  };

  const [batchClassFilter, setBatchClassFilter] = useState('ALL');
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  // All Absentees View Specific States
  const [absenteeBatchFilter, setAbsenteeBatchFilter] = useState('ALL');
  const [absenteeClassFilter, setAbsenteeClassFilter] = useState('ALL');
  const [absenteeSearchQuery, setAbsenteeSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [saveIndicator, setSaveIndicator] = useState(false);

  const triggerSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2200);
  };

  // Sunday detection & Extra Class State
  const isSelectedDateSunday = useMemo(() => {
    if (!selectedDate) return false;
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return false;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.getDay() === 0;
  }, [selectedDate]);

  const hasSundayRecords = useMemo(() => {
    if (!isSelectedDateSunday) return false;
    return attendance.some(a => a.date === selectedDate && (a.status === 'PRESENT' || a.status === 'ABSENT' || a.status === 'LATE'));
  }, [isSelectedDateSunday, attendance, selectedDate]);

  const [sundayExtraClassActive, setSundayExtraClassActive] = useState(false);

  useEffect(() => {
    setSundayExtraClassActive(false);
  }, [selectedDate]);

  const isSundayExtraClass = isSelectedDateSunday && (hasSundayRecords || sundayExtraClassActive);
  const isTuitionHoliday = isDeclaredHoliday || (isSelectedDateSunday && !isSundayExtraClass);

  // Helper: Get student status on selected date
  const getStudentStatus = (studentId) => {
    const record = attendance.find(a => a.studentId === studentId && a.date === selectedDate);
    if (record) return record.status || 'PRESENT';
    if (isDeclaredHoliday) {
      return 'HOLIDAY';
    }
    if (isSelectedDateSunday && !isSundayExtraClass) {
      return 'HOLIDAY';
    }
    return 'PRESENT';
  };

  // 1-Tap Toggle: Present ↔ Absent (Works across any view and auto-detects student batch)
  const handleToggleAbsent = (studentId) => {
    const student = students.find(s => s.id === studentId);
    const currentStatus = getStudentStatus(studentId);
    let newStatus;
    if (currentStatus === 'HOLIDAY') {
      newStatus = 'PRESENT';
    } else if (currentStatus === 'ABSENT') {
      newStatus = 'PRESENT';
    } else {
      newStatus = 'ABSENT';
    }

    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    let updated = [...attendance];
    const remarks = isSelectedDateSunday ? 'Sunday Extra Class' : '';

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: newStatus,
        remarks: updated[existingIndex].remarks || remarks,
        batchId: student?.batchId || updated[existingIndex]?.batchId
      };
    } else {
      updated.push({
        id: generateNextId(updated),
        studentId,
        date: selectedDate,
        status: newStatus,
        remarks,
        batchId: student?.batchId
      });
    }

    if (isSelectedDateSunday && !sundayExtraClassActive) {
      setSundayExtraClassActive(true);
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // Optional: Set specific status (Present, Absent, Late)
  const handleSetStatus = (studentId, status) => {
    const student = students.find(s => s.id === studentId);
    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    let updated = [...attendance];
    const remarks = isSelectedDateSunday ? 'Sunday Extra Class' : '';

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        remarks: updated[existingIndex].remarks || remarks,
        batchId: student?.batchId || updated[existingIndex]?.batchId
      };
    } else {
      updated.push({
        id: generateNextId(updated),
        studentId,
        date: selectedDate,
        status,
        remarks,
        batchId: student?.batchId
      });
    }

    if (isSelectedDateSunday && !sundayExtraClassActive) {
      setSundayExtraClassActive(true);
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // Reset entire batch to Present (or Mark All Attended for Sunday Extra Class)
  const handleResetAllPresent = () => {
    let updated = [...attendance];
    const remarks = isSelectedDateSunday ? 'Sunday Extra Class' : '';

    eligibleBatchStudents.forEach(student => {
      const existingIndex = updated.findIndex(a => a.studentId === student.id && a.date === selectedDate);
      if (existingIndex >= 0) {
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          status: 'PRESENT',
          remarks: updated[existingIndex].remarks || remarks
        };
      } else {
        updated.push({
          id: generateNextId(updated),
          studentId: student.id,
          date: selectedDate,
          status: 'PRESENT',
          remarks,
          batchId: student.batchId
        });
      }
    });

    if (isSelectedDateSunday && !sundayExtraClassActive) {
      setSundayExtraClassActive(true);
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // Revert Sunday to default weekly holiday
  const handleRevertSundayHoliday = () => {
    if (window.confirm(`Revert ${formattedSelectedDate} to default Weekly Holiday? Any Sunday extra class attendance records for this date will be cleared.`)) {
      const remainingAttendance = attendance.filter(a => a.date !== selectedDate);
      onSaveData({ ...data, attendance: remainingAttendance });
      setSundayExtraClassActive(false);
      triggerSaveIndicator();
    }
  };

  // Declare center-wide holiday on a specific date
  const handleDeclareHoliday = (dateToDeclare, holidayReason) => {
    const targetDate = dateToDeclare || selectedDate;
    const reason = (holidayReason || 'Tuition Holiday').trim();

    // Filter out previous records for that date
    let updated = attendance.filter(a => a.date !== targetDate);

    // Create holiday records for active students so that per-student queries reflect the holiday
    const activeStudentsList = students.filter(s => s.status === 'ACTIVE');
    if (activeStudentsList.length === 0) {
      updated.push({
        id: generateNextId(updated),
        studentId: 'CENTER_WIDE',
        date: targetDate,
        status: 'HOLIDAY',
        remarks: reason
      });
    } else {
      activeStudentsList.forEach(st => {
        updated.push({
          id: generateNextId(updated),
          studentId: st.id,
          batchId: st.batchId,
          classCode: st.classCode,
          date: targetDate,
          status: 'HOLIDAY',
          remarks: reason
        });
      });
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
    setHolidayModalOpen(false);
  };

  // Revert declared holiday back to regular working day
  const handleRevertHoliday = (dateToRevert) => {
    const targetDate = dateToRevert || selectedDate;
    const dateFormatted = new Date(targetDate + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    if (window.confirm(`Revert ${dateFormatted} to normal working day? All students will be marked Present by default.`)) {
      const remainingAttendance = attendance.filter(a => !(a.date === targetDate && (a.status === 'HOLIDAY' || a.status === 'NO_CLASS')));
      onSaveData({ ...data, attendance: remainingAttendance });
      triggerSaveIndicator();
    }
  };

  // ==========================================
  // MASTER "ALL ABSENTEES" CALCULATIONS
  // ==========================================
  const activeStudentsTotal = accessibleStudents.filter(s => s.status === 'ACTIVE').length;

  const allAbsenteesForDate = isTuitionHoliday 
    ? []
    : attendance
        .filter(a => a.date === selectedDate && a.status === 'ABSENT')
        .map(record => {
          const student = accessibleStudents.find(s => s.id === record.studentId);
          if (!student || student.status !== 'ACTIVE') return null;
          const studentClass = classes.find(c => c.code === student.classCode);
          const studentBatch = batches.find(b => b.id === (record.batchId || student.batchId));
          return {
            ...student,
            attendanceRecordId: record.id,
            recordDate: record.date,
            recordStatus: record.status,
            className: studentClass?.name || student.classCode,
            classCategory: studentClass?.category || '',
            batchName: studentBatch?.name || 'Main Batch',
            batchTiming: studentBatch?.timing || 'Tuition Hours'
          };
        })
        .filter(Boolean);

  const overallTurnout = activeStudentsTotal > 0 
    ? (isTuitionHoliday ? null : Math.max(0, Math.round(((activeStudentsTotal - allAbsenteesForDate.length) / activeStudentsTotal) * 100)))
    : 100;

  // Filtered All Absentees list for table
  const filteredAllAbsentees = allAbsenteesForDate.filter(s => {
    if (absenteeBatchFilter !== 'ALL' && String(s.batchId) !== String(absenteeBatchFilter)) return false;
    if (absenteeClassFilter !== 'ALL' && s.classCode !== absenteeClassFilter) return false;
    if (absenteeSearchQuery.trim()) {
      const q = absenteeSearchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchRoll = s.admissionNo && s.admissionNo.toLowerCase().includes(q);
      const matchSchool = s.school && s.school.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchSchool) return false;
    }
    return true;
  });

  // Copy formatted absentee summary for staff WhatsApp group or notice board
  const handleCopyAbsenteeSummary = () => {
    if (allAbsenteesForDate.length === 0) return;
    const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    let text = isSelectedDateSunday
      ? `📌 *HAYAGRIVA TUTORIALS — SUNDAY EXTRA CLASS ABSENTEE REGISTER*\n`
      : `📌 *HAYAGRIVA TUTORIALS — ABSENTEE REGISTER*\n`;
    text += `📅 Date: ${dateFormatted}\n`;
    text += `Total Absentees: ${allAbsenteesForDate.length} of ${activeStudentsTotal} (Turnout: ${overallTurnout}%)\n\n`;

    // Group by Tuition Batch (since batches contain multiple classes)
    text += `*BATCH-WISE ABSENTEES:*\n`;
    accessibleBatches.forEach(b => {
      const bAbs = allAbsenteesForDate.filter(s => Number(s.batchId) === Number(b.id));
      if (bAbs.length > 0) {
        text += `⏰ *${b.name}* (${b.timing}) — ${bAbs.length} absent:\n`;
        bAbs.forEach((s, idx) => {
          text += `  ${idx + 1}. ${s.name} (${s.className || s.classCode}) - Roll: ${s.admissionNo || '-'}\n`;
        });
        text += `\n`;
      }
    });

    // Also summary by Standard
    text += `*CLASS-WISE BREAKDOWN:*\n`;
    accessibleClasses.forEach(cls => {
      const classAbs = allAbsenteesForDate.filter(s => s.classCode === cls.code);
      if (classAbs.length > 0) {
        text += `• *${cls.name}*: ${classAbs.length} absent\n`;
      }
    });
    text += `\n_Generated from Hayagriva Management App_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2200);
    });
  };

  // ==========================================
  // BATCH VIEW CALCULATIONS (BATCH-CENTRIC, NOT CLASSWISE!)
  // Students in this batch can belong to ANY class!
  // ==========================================
  const currentBatch = accessibleBatches.find(b => String(b.id) === String(selectedBatchId)) || accessibleBatches[0];

  // All active students enrolled in this batch across any class
  const studentsInSelectedBatch = accessibleStudents.filter(s => {
    if (!s) return false;
    const st = String(s.status || '').toUpperCase();
    if (st === 'INACTIVE' || st === 'DISABLED' || st === 'DELETED') return false;
    if (selectedBatchId === 'DIRECT_ASSIGNED') {
      return assignedStudentIds.includes(String(s.id));
    }
    if (!selectedBatchId) return true;
    return String(s.batchId) === String(selectedBatchId);
  });

  // Distinct classes represented among students in this batch
  const classesInSelectedBatchCodes = [...new Set(studentsInSelectedBatch.map(s => s.classCode))];
  const classesInSelectedBatch = classes.filter(c => classesInSelectedBatchCodes.includes(c.code));

  // Eligible students for the batch roll call (filtered by optional class filter & search)
  const eligibleBatchStudents = studentsInSelectedBatch.filter(s => {
    if (batchClassFilter !== 'ALL' && s.classCode !== batchClassFilter) return false;
    if (batchSearchQuery.trim()) {
      const q = batchSearchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchRoll = s.admissionNo && s.admissionNo.toLowerCase().includes(q);
      const matchSchool = s.school && s.school.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchSchool) return false;
    }
    return true;
  });

  const batchAbsentStudents = eligibleBatchStudents.filter(s => getStudentStatus(s.id) === 'ABSENT');
  const batchLateStudents = eligibleBatchStudents.filter(s => getStudentStatus(s.id) === 'LATE');
  const batchPresentStudents = eligibleBatchStudents.filter(s => getStudentStatus(s.id) === 'PRESENT');
  const batchPresentCount = isTuitionHoliday ? 0 : batchPresentStudents.length;
  const batchAbsentCount = isTuitionHoliday ? 0 : batchAbsentStudents.length;
  const batchLateCount = isTuitionHoliday ? 0 : batchLateStudents.length;
  const batchAttendancePercentage = eligibleBatchStudents.length > 0 
    ? (isTuitionHoliday ? null : Math.round((batchPresentCount / eligibleBatchStudents.length) * 100))
    : 100;

  const displayBatchStudents = eligibleBatchStudents;

  return (
    <div className="attendance-page">
      {isTeacher && (
        <div className="teacher-scope-banner glass-card mb-3" style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-emerald flex-shrink-0" />
            <span className="font-semibold text-white text-xs">
              Faculty Scoped Attendance:
            </span>
            <span className="text-xs text-muted">
              {accessibleBatches.length > 0 || accessibleStudents.length > 0
                ? `Showing your ${accessibleBatches.length} assigned ${accessibleBatches.length === 1 ? 'batch' : 'batches'} (${activeStudentsTotal} active ${activeStudentsTotal === 1 ? 'student' : 'students'}).`
                : 'No batches assigned to your account yet. Please contact Administrator.'}
            </span>
          </div>
        </div>
      )}

      {/* Top Header & Dual Mode Switcher */}
      <div className="attendance-header-card glass-card">
        <div className="header-meta-left">
          <div className="flex items-center gap-2">
            <h1 className="page-title">
              {currentViewMode === 'calendar'
                ? 'Tuition Calendar & Schedule'
                : currentViewMode === 'all-absentees'
                ? 'All Absentees Register'
                : 'Daily Roll Call'}
            </h1>
            {saveIndicator && (
              <span className="save-badge-pill animate-fade-in">
                <Check size={13} /> Auto-Saved ✓
              </span>
            )}
          </div>
          <p className="page-subtitle mb-0">
            {currentViewMode === 'calendar'
              ? 'Monthly calendar schedule, declared tuition holidays, and Sunday extra classes.'
              : currentViewMode === 'all-absentees'
              ? 'Consolidated single view of every student marked absent across all classes and batches.'
              : 'Fast roll call: All students default to Present. Tap any student to mark them Absent.'}
          </p>
        </div>

        {/* Segmented View Mode Switcher */}
        <div className="mode-toggle-group">
          <button
            type="button"
            className={`mode-btn ${currentViewMode === 'all-absentees' ? 'active' : ''}`}
            onClick={() => setViewMode('all-absentees')}
            title="Consolidated master list of all absentees across all classes"
          >
            <AlertTriangle size={15} className={allAbsenteesForDate.length > 0 ? 'text-rose' : ''} />
            <span>All Absentees Register</span>
            <span className={`mode-badge ${allAbsenteesForDate.length > 0 ? 'badge-rose' : 'badge-emerald'}`}>
              {allAbsenteesForDate.length}
            </span>
          </button>

          <button
            type="button"
            className={`mode-btn ${currentViewMode === 'batch' ? 'active' : ''}`}
            onClick={() => setViewMode('batch')}
            title="Standard class & batch roll call"
          >
            <ListChecks size={15} />
            <span>Take Batch Attendance</span>
          </button>

          <button
            type="button"
            className={`mode-btn ${currentViewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            title="Tuition Attendance & Schedule Calendar with Holidays"
          >
            <Calendar size={15} />
            <span>Tuition Calendar &amp; Holidays</span>
            {calendarMonthStats.holidayDays > 0 && (
              <span className="mode-badge badge-amber" title={`${calendarMonthStats.holidayDays} holidays this month`}>
                🌴 {calendarMonthStats.holidayDays}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SINGLE UNIFIED ALL ABSENTEES REGISTER                             */}
      {/* ========================================================================= */}
      {currentViewMode === 'all-absentees' && (
        <div className="all-absentees-container">
          {/* Declared Holiday Banner if current date is holiday */}
          {isDeclaredHoliday && (
            <div className="holiday-declared-banner glass-card mb-3">
              <div className="banner-content-row flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="holiday-banner-icon">🌴</div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 mb-0.5">
                      Tuition Holiday Declared: {activeHolidayTitle}
                    </h3>
                    <p className="text-xs text-secondary mb-0">
                      Tuition classes are closed on <strong>{formattedSelectedDate}</strong>. Students are not counted absent, and this date is marked on all student calendars.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex items-center gap-1.5"
                    onClick={() => {
                      setHolidayModalDate(selectedDate);
                      setHolidayModalReason(activeHolidayTitle);
                      setHolidayModalOpen(true);
                    }}
                  >
                    Edit Reason
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm flex items-center gap-1.5"
                    onClick={() => handleRevertHoliday(selectedDate)}
                  >
                    <RotateCcw size={13} />
                    <span>Revert to Working Day</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date Selector & Center-wide Stats Card */}
          <div className="glass-card absentees-toolbar-card">
            <div className="toolbar-top-row">
              {/* Date Controls */}
              <div className="date-controls-group">
                <span className="control-label">Attendance Date:</span>
                <div className="quick-date-pills">
                  <button
                    type="button"
                    className={`quick-date-btn ${selectedDate === todayDateStr ? 'active' : ''}`}
                    onClick={() => setSelectedDate(todayDateStr)}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`quick-date-btn ${selectedDate === yesterdayDateStr ? 'active' : ''}`}
                    onClick={() => setSelectedDate(yesterdayDateStr)}
                  >
                    Yesterday
                  </button>
                </div>
                <div className="date-input-wrapper">
                  <Calendar size={15} className="date-input-icon" />
                  <input
                    type="date"
                    className="form-input date-picker-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <span className="selected-date-text font-mono text-xs text-secondary">
                  {formattedSelectedDate}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="toolbar-actions-group flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary flex items-center gap-1.5"
                  onClick={() => {
                    setHolidayModalDate(selectedDate);
                    setHolidayModalReason(isDeclaredHoliday ? activeHolidayTitle : '');
                    setHolidayModalOpen(true);
                  }}
                  title="Declare or manage tuition holiday for this date"
                >
                  <span>🌴</span>
                  <span>{isDeclaredHoliday ? 'Holiday Set' : 'Declare Holiday'}</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${copiedSummary ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopyAbsenteeSummary}
                  disabled={allAbsenteesForDate.length === 0}
                  title="Copy formatted absentee list to share with staff or notice board"
                >
                  {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setViewMode('batch')}
                  title="Switch to batch-wise roll call"
                >
                  <ListChecks size={14} />
                  <span>Take Roll Call</span>
                </button>
              </div>
            </div>

            {/* Overall Attendance KPIs Bar */}
            <div className="absentees-metrics-bar mt-3">
              <div className={`metric-pill ${allAbsenteesForDate.length > 0 ? 'metric-has-absentees' : 'metric-all-present'}`}>
                <AlertTriangle size={15} />
                <span>
                  Total Absentees: <strong>{allAbsenteesForDate.length}</strong>
                </span>
              </div>

              <div className="metric-pill">
                <Users size={15} />
                <span>
                  Active Enrolled: <strong>{activeStudentsTotal}</strong>
                </span>
              </div>

              <div className="metric-pill">
                <CheckCircle2 size={15} className={isTuitionHoliday ? 'text-amber' : 'text-emerald'} />
                <span>
                  Center Turnout:{' '}
                  <strong>
                    {isDeclaredHoliday
                      ? `🌴 Holiday (${activeHolidayTitle})`
                      : isSelectedDateSunday && !isSundayExtraClass
                      ? '🌴 Weekly Holiday'
                      : `${overallTurnout}%`}
                  </strong>
                </span>
              </div>

              <div className="metric-pill text-muted text-xs">
                <span>
                  {isDeclaredHoliday
                    ? `🌴 Tuition Closed: ${activeHolidayTitle}`
                    : isSelectedDateSunday && !isSundayExtraClass
                    ? '🌴 Sunday Default Holiday (No classes scheduled)'
                    : `${accessibleClasses.filter(c => allAbsenteesForDate.some(a => a.classCode === c.code)).length} of ${accessibleClasses.length} classes have absentees`
                  }
                </span>
              </div>
            </div>

            {/* Sunday Default Holiday Banner */}
            {isSelectedDateSunday && !isSundayExtraClass && (
              <div className="sunday-holiday-banner mt-3">
                <div className="banner-left">
                  <div className="sunday-pill-tag">🌴 Sunday Default Holiday</div>
                  <div className="sunday-banner-text">
                    <h3 className="text-sm font-bold text-white mb-0">Tuition batches are off today by default</h3>
                    <p className="text-xs text-muted mb-0">
                      Regular batches do not run on Sunday. If you conducted a special revision session, mock test, or extra batch, you can take attendance below.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setSundayExtraClassActive(true);
                    setViewMode('batch');
                  }}
                >
                  <Zap size={14} />
                  <span>Take Sunday Extra Class Attendance</span>
                </button>
              </div>
            )}

            {/* Sunday Extra Class Active Banner */}
            {isSelectedDateSunday && isSundayExtraClass && (
              <div className="sunday-active-banner mt-3">
                <div className="banner-left">
                  <div className="sunday-active-tag">⚡ Sunday Extra Class Active</div>
                  <div className="sunday-banner-text">
                    <h3 className="text-sm font-bold text-white mb-0">Sunday Extra Class Attendance Active</h3>
                    <p className="text-xs text-muted mb-0">
                      Students attending this session are credited in their attendance records and monthly percentage.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleRevertSundayHoliday}
                >
                  <RotateCcw size={13} />
                  <span>Revert to Weekly Holiday</span>
                </button>
              </div>
            )}
          </div>

          {/* Filters Bar: Batch Filter + Class Dropdown + Search Input */}
          <div className="glass-card absentees-filters-card">
            <div className="filters-row">
              {/* Batch Filter */}
              <div className="filter-group">
                <Clock size={15} className="text-muted" />
                <label className="text-xs text-muted font-medium">Batch:</label>
                <select
                  className="form-select filter-select font-semibold"
                  value={absenteeBatchFilter}
                  onChange={(e) => setAbsenteeBatchFilter(e.target.value)}
                >
                  <option value="ALL">All Batches ({accessibleBatches.length})</option>
                  {accessibleBatches.map(b => {
                    const countInB = allAbsenteesForDate.filter(s => String(s.batchId) === String(b.id)).length;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} ({countInB} absent)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Class Filter */}
              <div className="filter-group">
                <Filter size={15} className="text-muted" />
                <label className="text-xs text-muted font-medium">Standard:</label>
                <select
                  className="form-select filter-select"
                  value={absenteeClassFilter}
                  onChange={(e) => setAbsenteeClassFilter(e.target.value)}
                >
                  <option value="ALL">All Standards ({accessibleClasses.length} Classes)</option>
                  {accessibleClasses.map(cls => {
                    const countInClass = allAbsenteesForDate.filter(s => s.classCode === cls.code).length;
                    return (
                      <option key={cls.code} value={cls.code}>
                        {cls.name} ({countInClass} absent)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Live Search */}
              <div className="search-group flex-1">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="Search absent student by name, roll number, or school..."
                  value={absenteeSearchQuery}
                  onChange={(e) => setAbsenteeSearchQuery(e.target.value)}
                />
                {absenteeSearchQuery && (
                  <button className="search-clear-btn" onClick={() => setAbsenteeSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="filter-count-text text-xs text-muted">
                Showing {filteredAllAbsentees.length} of {allAbsenteesForDate.length} absent students
              </div>
            </div>
          </div>

          {/* Master Absentees Table / Empty State */}
          {allAbsenteesForDate.length === 0 ? (
            <div className="glass-card perfect-attendance-card">
              <div className="celebration-icon-box">
                {isDeclaredHoliday ? (
                  <span style={{ fontSize: '42px', lineHeight: 1 }}>🌴</span>
                ) : isSelectedDateSunday && !isSundayExtraClass ? (
                  <span style={{ fontSize: '42px', lineHeight: 1 }}>🌴</span>
                ) : (
                  <CheckCircle2 size={46} className="text-emerald" />
                )}
              </div>
              <h2 className="celebration-title">
                {isDeclaredHoliday
                  ? `Tuition Holiday — ${activeHolidayTitle}`
                  : isSelectedDateSunday && !isSundayExtraClass
                  ? `Sunday Weekly Holiday (${formattedSelectedDate})`
                  : `100% Attendance on ${formattedSelectedDate}!`}
              </h2>
              <p className="celebration-subtitle">
                {isDeclaredHoliday
                  ? `Tuition classes are closed on ${formattedSelectedDate} for ${activeHolidayTitle}. No absences recorded and students are not penalized.`
                  : isSelectedDateSunday && !isSundayExtraClass
                  ? 'Sundays are configured as weekly holidays for all tuition batches. Attendance is not marked and students are not marked absent.'
                  : 'No students across Classes 1 to 10 are marked absent for this date. All enrolled students are marked Present.'}
              </p>
              <div className="celebration-actions">
                {isDeclaredHoliday ? (
                  <button 
                    type="button" 
                    className="btn btn-warning flex items-center gap-1.5"
                    onClick={() => handleRevertHoliday(selectedDate)}
                  >
                    <RotateCcw size={15} />
                    <span>Revert to Working Day</span>
                  </button>
                ) : isSelectedDateSunday && !isSundayExtraClass ? (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      setSundayExtraClassActive(true);
                      setViewMode('batch');
                    }}
                  >
                    <Zap size={15} />
                    <span>Take Sunday Extra Class Attendance</span>
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => setViewMode('batch')}
                  >
                    <ListChecks size={15} />
                    <span>Open Roll Call Register</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredAllAbsentees.length === 0 ? (
            <div className="glass-card empty-filter-card">
              <p className="text-muted text-sm mb-2">No absentees match your search filter.</p>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setAbsenteeClassFilter('ALL');
                  setAbsenteeSearchQuery('');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="table-container glass-card absentees-table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px' }}>#</th>
                    <th style={{ width: '110px' }}>Roll No</th>
                    <th>Student Name</th>
                    <th>Standard / Class</th>
                    <th>Batch & Timing</th>
                    {!isTeacher && <th>Parent Contact</th>}
                    <th style={{ textAlign: 'center', width: '220px' }}>Absentee Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllAbsentees.map((student, index) => {
                    const messageText = isSelectedDateSunday
                      ? `Dear Sir/Mam, this is to inform you that your child *${student.name}* of *${student.className}* was marked ABSENT for the Sunday Extra Class today (${selectedDate}). Regular attendance is critical for academic continuity. Kindly contact us if you have any questions. - HAYAGRIVA TUTORIALS`
                      : `Dear Sir/Mam, this is to inform you that your child *${student.name}* of *${student.className}* was marked ABSENT for tuition today (${selectedDate}). Regular attendance is critical for academic continuity. Kindly contact us if you have any questions. - HAYAGRIVA TUTORIALS`;
                    const whatsappUrl = `https://wa.me/91${student.parentPhone}?text=${encodeURIComponent(messageText)}`;

                    return (
                      <tr key={student.id} className="row-master-absent">
                        <td className="text-muted text-xs font-mono">{index + 1}</td>
                        <td className="font-mono text-xs text-rose font-bold">
                          {student.admissionNo || '—'}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="student-avatar-absent">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{student.name}</div>
                              <div className="text-xs text-muted">{student.school || 'School unspecified'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-class">
                            {student.className}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs font-semibold text-secondary">{student.batchName}</div>
                          <div className="text-xs text-muted font-mono">{student.batchTiming}</div>
                        </td>

                        {/* Protected: Hidden from Teachers */}
                        {!isTeacher && (
                          <td>
                            <div className="text-xs font-semibold text-white">
                              {student.parentName || 'Parent'}
                            </div>
                            <div className="text-xs font-mono text-secondary">
                              📱 {student.parentPhone}
                            </div>
                          </td>
                        )}

                        {/* Actions */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="absentee-action-buttons">
                            {/* WhatsApp Alert for Admin */}
                            {!isTeacher && student.parentPhone && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-success whatsapp-row-btn"
                                title={`Send WhatsApp Absentee Notice to ${student.parentName || 'Parent'}`}
                              >
                                <MessageSquare size={13} />
                                <span>WhatsApp Alert</span>
                              </a>
                            )}

                            {/* 1-Tap Undo / Mark Present */}
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary unmark-present-btn"
                              onClick={() => handleToggleAbsent(student.id)}
                              title="Student attended? Tap to mark Present"
                            >
                              <CheckCircle2 size={13} className="text-emerald" />
                              <span>Mark Present</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BATCH-BY-BATCH ROLL CALL REGISTER                                 */}
      {/* ========================================================================= */}
      {currentViewMode === 'batch' && (
        <div className="batch-attendance-container">
          {/* Declared Holiday Banner if current date is holiday */}
          {isDeclaredHoliday && (
            <div className="holiday-declared-banner glass-card mb-3">
              <div className="banner-content-row flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="holiday-banner-icon">🌴</div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 mb-0.5">
                      Tuition Holiday Declared: {activeHolidayTitle}
                    </h3>
                    <p className="text-xs text-secondary mb-0">
                      Tuition classes are closed on <strong>{formattedSelectedDate}</strong>. Batch roll call is paused and students are not penalized.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-warning btn-sm flex items-center gap-1.5"
                    onClick={() => handleRevertHoliday(selectedDate)}
                  >
                    <RotateCcw size={13} />
                    <span>Revert to Working Day</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sunday Extra Class Active Notice */}
          {isSelectedDateSunday && isSundayExtraClass && (
            <div className="sunday-active-banner glass-card mb-3">
              <div className="banner-left">
                <div className="sunday-active-tag">⚡ Sunday Extra Class Active</div>
                <span className="text-xs text-white">
                  Attendance roll call is active for <strong>{formattedSelectedDate}</strong>. Students marked present receive attendance credit.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleRevertSundayHoliday}
              >
                <RotateCcw size={12} />
                <span>Revert to Weekly Holiday</span>
              </button>
            </div>
          )}

          {/* Top Banner if there are absentees across tuition */}
          {allAbsenteesForDate.length > 0 && (
            <div className="center-absentees-banner glass-card">
              <div className="banner-left">
                <AlertTriangle size={17} className="text-rose" />
                <span>
                  <strong>{allAbsenteesForDate.length} students</strong> are marked absent across all classes today.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-rose"
                onClick={() => setViewMode('all-absentees')}
              >
                <span>Open All Absentees Register</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Selector Controls Card */}
          <div className="glass-card attendance-controls-card">
            <div className="controls-grid">
              {/* Batch Selector (Primary Dimension!) */}
              <div className="form-group mb-0">
                <label className="form-label font-semibold text-white">
                  <span>Tuition Batch Slot</span>
                  {isTeacher && <span className="text-emerald text-xs ml-1">(Assigned)</span>}
                </label>
                <select 
                  className="form-select font-semibold"
                  value={selectedBatchId}
                  onChange={(e) => handleSelectBatch(e.target.value)}
                >
                  {!isTeacher && <option value="">All Batches ({accessibleBatches.length} Slots)</option>}
                  {isTeacher && accessibleBatches.length > 1 && (
                    <option value="">All My Assigned Batches ({accessibleBatches.length} Batches)</option>
                  )}
                  {assignedStudentIds.length > 0 && (
                    <option value="DIRECT_ASSIGNED">
                      ⭐ Direct Assigned Students ({assignedStudentIds.length} Students)
                    </option>
                  )}
                  {accessibleBatches.map(b => {
                    const bCount = accessibleStudents.filter(s => {
                      if (!s) return false;
                      const st = String(s.status || '').toUpperCase();
                      if (st === 'INACTIVE' || st === 'DISABLED' || st === 'DELETED') return false;
                      return String(s.batchId) === String(b.id);
                    }).length;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.timing}) — {bCount} Students
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Class Filter (Optional - students can be in any class) */}
              <div className="form-group mb-0">
                <label className="form-label">
                  <span>Filter by Class</span>
                  <span className="text-muted text-xs ml-1">(Optional)</span>
                </label>
                <select 
                  className="form-select"
                  value={batchClassFilter}
                  onChange={(e) => setBatchClassFilter(e.target.value)}
                >
                  <option value="ALL">All Classes in Batch ({studentsInSelectedBatch.length} students)</option>
                  {classesInSelectedBatch.map(cls => {
                    const countInCls = studentsInSelectedBatch.filter(s => s.classCode === cls.code).length;
                    return (
                      <option key={cls.code} value={cls.code}>
                        {cls.name} ({countInCls} students)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date Picker */}
              <div className="form-group mb-0">
                <label className="form-label">Attendance Date</label>
                <div className="date-input-box">
                  <Calendar size={16} className="date-icon" />
                  <input 
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="attendance-stats-bar mt-4">
              <div className="stat-pill stat-total">
                <Users size={15} />
                <span>Enrolled: <strong>{eligibleBatchStudents.length}</strong></span>
              </div>
              <div className="stat-pill stat-present">
                <CheckCircle2 size={15} />
                <span>Present: <strong>{batchPresentCount}</strong></span>
              </div>
              <div className={`stat-pill stat-absent ${batchAbsentCount > 0 ? 'has-absent' : ''}`}>
                <XCircle size={15} />
                <span>Absent: <strong>{batchAbsentCount}</strong></span>
              </div>
              {batchLateCount > 0 && (
                <div className="stat-pill stat-late">
                  <Clock size={15} />
                  <span>Late: <strong>{batchLateCount}</strong></span>
                </div>
              )}
              <div className="stat-pill stat-rate">
                <span>Turnout: <strong>{isSelectedDateSunday && !isSundayExtraClass ? 'Weekly Off' : `${batchAttendancePercentage}%`}</strong></span>
              </div>

              <div className="batch-actions-right ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={() => {
                    setHolidayModalDate(selectedDate);
                    setHolidayModalReason(isDeclaredHoliday ? activeHolidayTitle : '');
                    setHolidayModalOpen(true);
                  }}
                  title="Declare or edit holiday for this date"
                >
                  <span>🌴</span>
                  <span>{isDeclaredHoliday ? 'Holiday Set' : 'Declare Holiday'}</span>
                </button>

                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetAllPresent}
                  title={isSelectedDateSunday ? "Mark all students in this batch as attended extra class" : "Reset everyone in this class/batch to Present"}
                  disabled={eligibleBatchStudents.length === 0}
                >
                  {isSelectedDateSunday ? <Zap size={13} className="text-amber" /> : <RotateCcw size={13} />}
                  <span>{isSelectedDateSunday ? 'Mark All Attended' : 'Reset All Present'}</span>
                </button>
              </div>
            </div>

            {/* Quick Absentees Tray (Chips list for rapid visual confirmation & 1-tap undo) */}
            {batchAbsentStudents.length > 0 && (
              <div className="absentees-tray mt-3">
                <div className="tray-label">
                  <XCircle size={14} className="text-rose" />
                  <span>Marked Absent in this Batch ({batchAbsentStudents.length}):</span>
                </div>
                <div className="tray-chips">
                  {batchAbsentStudents.map(student => (
                    <button
                      key={student.id}
                      type="button"
                      className="absentee-chip"
                      onClick={() => handleToggleAbsent(student.id)}
                      title="Tap to unmark (make Present)"
                    >
                      <span className="chip-name">{student.name}</span>
                      <X size={12} className="chip-remove-icon" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conditional: Declared Holiday Card vs Sunday Weekly Holiday Card vs Active Roll Call */}
          {isDeclaredHoliday ? (
            <div className="glass-card sunday-batch-holiday-card">
              <div className="sunday-card-icon-box">
                <span style={{ fontSize: '44px', lineHeight: 1 }}>🌴</span>
              </div>
              <div className="sunday-card-content">
                <div className="sunday-pill-tag" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                  Tuition Holiday Declared
                </div>
                <h2 className="sunday-card-title">{activeHolidayTitle}</h2>
                <p className="sunday-card-desc">
                  Tuition classes are closed on <strong>{formattedSelectedDate}</strong> for {activeHolidayTitle}. All batch sessions are suspended and students are not marked absent.
                </p>
                <div className="sunday-card-actions flex items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-warning flex items-center gap-1.5"
                    onClick={() => handleRevertHoliday(selectedDate)}
                  >
                    <RotateCcw size={15} />
                    <span>Revert to Working Day</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary flex items-center gap-1.5"
                    onClick={() => {
                      setHolidayModalDate(selectedDate);
                      setHolidayModalReason(activeHolidayTitle);
                      setHolidayModalOpen(true);
                    }}
                  >
                    <span>Edit Holiday Name</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isSelectedDateSunday && !isSundayExtraClass ? (
            <div className="glass-card sunday-batch-holiday-card">
              <div className="sunday-card-icon-box">
                <span style={{ fontSize: '44px', lineHeight: 1 }}>🌴</span>
              </div>
              <div className="sunday-card-content">
                <div className="sunday-pill-tag">Default Weekly Holiday</div>
                <h2 className="sunday-card-title">Sunday Off — No Regular Classes Scheduled</h2>
                <p className="sunday-card-desc">
                  Sundays are default weekly holidays for all tuition batches at Hayagriva Tutorials. Regular attendance roll call is off and students are not penalized.
                </p>
                <div className="sunday-card-callout">
                  <Zap size={16} className="text-amber flex-shrink-0" />
                  <span>
                    Conducted a <strong>Sunday Extra Class</strong>, revision batch, or special test? Click below to enable roll call and record student attendance.
                  </span>
                </div>
                <div className="sunday-card-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setSundayExtraClassActive(true);
                      handleResetAllPresent();
                    }}
                  >
                    <Zap size={15} />
                    <span>Enable Sunday Extra Class Attendance</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Search Input */}
              <div className="search-bar-row">
                <div className="search-input-box">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Search student by name or roll number to mark..."
                    value={batchSearchQuery}
                    onChange={(e) => setBatchSearchQuery(e.target.value)}
                  />
                  {batchSearchQuery && (
                    <button className="search-clear-btn" onClick={() => setBatchSearchQuery('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="search-helper-text">
                  {displayBatchStudents.length} of {eligibleBatchStudents.length} students shown
                </div>
              </div>

              {/* Split Layout: Attendance Table on Left + Absentee Sidebar on Right */}
              <div className="attendance-split-layout">
                {/* Student Roll Call Table */}
                <div className="table-container flex-1">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '90px' }}>Roll No</th>
                        <th>Student Name</th>
                        <th style={{ width: '130px' }}>Standard</th>
                        {!isTeacher && <th>Parent Phone</th>}
                        <th style={{ textAlign: 'center', width: '220px' }}>Take Attendance</th>
                        <th style={{ width: '120px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayBatchStudents.length === 0 ? (
                        <tr>
                          <td colSpan={!isTeacher ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            {eligibleBatchStudents.length === 0 
                              ? 'No active students enrolled in this batch yet.' 
                              : `No students matching "${batchSearchQuery}".`}
                          </td>
                        </tr>
                      ) : (
                        displayBatchStudents.map((student) => {
                          const status = getStudentStatus(student.id);
                          const isAbsent = status === 'ABSENT';
                          const isLate = status === 'LATE';
                          const sClass = classes.find(c => c.code === student.classCode);

                          return (
                            <tr key={student.id} className={isAbsent ? 'row-absent' : ''}>
                              <td className="font-mono text-xs text-muted">{student.admissionNo}</td>
                              <td>
                                <div className="font-semibold text-white">{student.name}</div>
                                <div className="text-xs text-muted">{student.school || 'School unspecified'}</div>
                              </td>
                              <td>
                                <span className="badge badge-class">
                                  {sClass?.name || student.classCode}
                                </span>
                              </td>
                              
                              {/* Privacy: Parent phone is strictly hidden from Teachers */}
                              {!isTeacher && (
                                <td className="text-xs font-mono text-secondary">{student.parentPhone}</td>
                              )}

                              {/* 1-Tap Attendance Action */}
                              <td style={{ textAlign: 'center' }}>
                                <div className="fast-attendance-cell">
                                  <button
                                    type="button"
                                    className={`btn-fast-attendance ${isAbsent ? 'status-absent' : isLate ? 'status-late' : isSelectedDateSunday ? 'status-extra' : 'status-present'}`}
                                    onClick={() => handleToggleAbsent(student.id)}
                                    title={isAbsent ? "Currently Absent. Click to mark Present." : "Currently Present. Click to mark Absent."}
                                  >
                                    {isAbsent ? (
                                      <>
                                        <XCircle size={16} />
                                        <span className="status-title">ABSENT</span>
                                        <span className="status-sub-hint">Tap for Present</span>
                                      </>
                                    ) : isLate ? (
                                      <>
                                        <Clock size={16} />
                                        <span className="status-title">LATE</span>
                                        <span className="status-sub-hint">Tap for Absent</span>
                                      </>
                                    ) : (
                                      <>
                                        {isSelectedDateSunday ? <Zap size={16} className="text-amber" /> : <CheckCircle2 size={16} />}
                                        <span className="status-title">{isSelectedDateSunday ? 'ATTENDED' : 'PRESENT'}</span>
                                        <span className="status-sub-hint">{isSelectedDateSunday ? '⚡ Extra Class' : 'Tap if Absent'}</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Quick Late Toggle Option */}
                                  <button
                                    type="button"
                                    className={`btn-late-mini ${isLate ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetStatus(student.id, isLate ? 'PRESENT' : 'LATE');
                                    }}
                                    title={isLate ? "Unmark Late" : "Mark as Late arrival"}
                                  >
                                    L
                                  </button>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td>
                                {isAbsent ? (
                                  <span className="badge badge-danger">Absent</span>
                                ) : isLate ? (
                                  <span className="badge badge-warning">Late</span>
                                ) : isSelectedDateSunday ? (
                                  <span className="badge badge-extra-class">⚡ Attended (Extra)</span>
                                ) : (
                                  <span className="badge badge-success">Present</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Right Sidebar: Batch Absentee Alerts */}
                <div className="glass-card absentee-sidebar">
                  <div className="absentee-header">
                    <AlertTriangle size={18} className="text-rose" />
                    <h2 className="absentee-title">
                      {isSelectedDateSunday ? `Extra Class Absentees (${batchAbsentStudents.length})` : `Batch Absentees (${batchAbsentStudents.length})`}
                    </h2>
                  </div>
                  
                  <p className="text-xs text-muted mb-3">
                    {!isTeacher 
                      ? 'Send instant WhatsApp notices to parents for students in this batch.'
                      : 'Absentees are automatically saved and visible to Admin in the master register.'}
                  </p>

                  {batchAbsentStudents.length === 0 ? (
                    <div className="no-absentees-box">
                      <CheckCircle2 size={26} className="text-emerald mb-2" />
                      <div className="font-semibold text-xs text-emerald">
                        {isSelectedDateSunday ? 'All Enrolled Attended Extra Class!' : '100% Present in Batch!'}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {isSelectedDateSunday
                          ? 'No students marked absent for this Sunday extra session.'
                          : 'No students marked absent for this batch.'}
                      </div>
                    </div>
                  ) : (
                    <div className="absentees-list">
                      {batchAbsentStudents.map(student => {
                        const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
                        const messageText = isSelectedDateSunday
                          ? `Dear Sir/Mam, this is to inform you that your child *${student.name}* was marked ABSENT for the *${className}* Sunday Extra Class today (${selectedDate}). Kindly ensure regular attendance. - HAYAGRIVA TUTORIALS`
                          : `Dear Sir/Mam, this is to inform you that your child *${student.name}* was marked ABSENT for *${className}* tuition today (${selectedDate}). Kindly ensure regular attendance. - HAYAGRIVA TUTORIALS`;
                        const whatsappUrl = `https://wa.me/91${student.parentPhone}?text=${encodeURIComponent(messageText)}`;

                        return (
                          <div key={student.id} className="absentee-card">
                            <div className="flex-1">
                              <div className="font-semibold text-xs text-white">{student.name}</div>
                              {!isTeacher ? (
                                <div className="text-xs text-muted font-mono">📱 {student.parentPhone}</div>
                              ) : (
                                <div className="text-xs text-emerald font-medium">Recorded Absent ✓</div>
                              )}
                            </div>

                            {!isTeacher ? (
                              <a 
                                href={whatsappUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-sm btn-success whatsapp-alert-btn"
                                title={`Send WhatsApp absentee notice to ${student.parentName || 'Parent'}`}
                              >
                                <MessageSquare size={13} />
                                <span>Alert</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleToggleAbsent(student.id)}
                                title="Unmark absent"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TUITION CALENDAR & SCHEDULE                                       */}
      {/* ========================================================================= */}
      {currentViewMode === 'calendar' && (
        <div className="calendar-view-container">
          {/* Controls Card: Month Navigation & Quick Actions */}
          <div className="glass-card calendar-toolbar-card mb-4">
            <div className="cal-top-bar flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCalDate(new Date(calYear, calMonth - 1, 1))}
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="cal-month-title text-base font-bold text-white mb-0 px-2">
                  {calMonthLabel}
                </h2>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCalDate(new Date(calYear, calMonth + 1, 1))}
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs ml-2"
                  onClick={() => setCalDate(new Date())}
                >
                  Current Month
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={() => {
                    setHolidayModalDate(selectedDate || todayDateStr);
                    setHolidayModalReason('');
                    setHolidayModalOpen(true);
                  }}
                >
                  <span>🌴</span>
                  <span>Declare Tuition Holiday</span>
                </button>
              </div>
            </div>

            {/* Monthly KPIs Bar */}
            <div className="cal-kpis-grid mt-4">
              <div className="cal-kpi-box">
                <span className="cal-kpi-label">Working Class Days</span>
                <span className="cal-kpi-value text-emerald font-bold">{calendarMonthStats.workingDays}</span>
              </div>
              <div className="cal-kpi-box">
                <span className="cal-kpi-label">Tuition Holidays</span>
                <span className="cal-kpi-value text-amber-400 font-bold">
                  🌴 {calendarMonthStats.holidayDays}
                </span>
              </div>
              <div className="cal-kpi-box">
                <span className="cal-kpi-label">Sunday Extra Classes</span>
                <span className="cal-kpi-value text-sky font-bold">⚡ {calendarMonthStats.sundayExtraClasses}</span>
              </div>
              <div className="cal-kpi-box">
                <span className="cal-kpi-label">Total Absences Recorded</span>
                <span className="cal-kpi-value text-rose font-bold">{calendarMonthStats.totalAbsences}</span>
              </div>
            </div>
          </div>

          {/* Monthly Calendar Grid Card */}
          <div className="glass-card cal-grid-card p-4">
            {/* Weekday Headers */}
            <div className="cal-weekdays-row">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                <div key={d} className={`cal-weekday-header ${idx === 0 ? 'text-rose-header' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="cal-month-grid">
              {/* Offset cells for month start */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`offset-${idx}`} className="cal-cell-slot cal-cell-empty" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInCalMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayOfWeek = new Date(calYear, calMonth, dayNum).getDay();
                const isSun = dayOfWeek === 0;
                const isToday = dStr === todayDateStr;
                const isDeclaredHol = centerHolidaysMap.has(dStr);
                const holName = centerHolidaysMap.get(dStr);
                const dayRecords = (attendance || []).filter(a => a.date === dStr);
                const hasExtraClass = isSun && dayRecords.some(a => a.status === 'PRESENT' || a.status === 'LATE' || a.status === 'ABSENT');
                const absentCount = isDeclaredHol || (isSun && !hasExtraClass) ? 0 : dayRecords.filter(a => a.status === 'ABSENT').length;
                const isPastOrToday = dStr <= todayDateStr;

                let cellClass = 'cal-day-cell';
                if (isDeclaredHol) cellClass += ' cell-declared-holiday';
                else if (hasExtraClass) cellClass += ' cell-has-extra';
                else if (isSun) cellClass += ' cell-sunday-off';
                if (isToday) cellClass += ' cell-today';

                return (
                  <div key={dStr} className={cellClass}>
                    <div className="cal-day-top flex items-center justify-between">
                      <span className={`cal-day-num ${isToday ? 'today-circle' : ''}`}>
                        {dayNum}
                      </span>
                      {isToday && <span className="today-chip">Today</span>}
                      {isDeclaredHol ? (
                        <button
                          type="button"
                          className="cal-day-icon-btn text-amber-300"
                          onClick={() => handleRevertHoliday(dStr)}
                          title={`Holiday: ${holName}. Click to revert to normal class.`}
                        >
                          <RotateCcw size={12} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="cal-day-icon-btn text-muted hover-show"
                          onClick={() => {
                            setHolidayModalDate(dStr);
                            setHolidayModalReason('');
                            setHolidayModalOpen(true);
                          }}
                          title={`Declare Holiday for ${dStr}`}
                        >
                          +🌴
                        </button>
                      )}
                    </div>

                    <div className="cal-day-body">
                      {isDeclaredHol ? (
                        <div className="cal-holiday-tag" title={holName}>
                          <span className="hol-icon">🌴</span>
                          <span className="hol-name">{holName}</span>
                        </div>
                      ) : hasExtraClass ? (
                        <div className="cal-extra-tag">
                          <span>⚡ Extra Class</span>
                          {absentCount > 0 ? (
                            <span className="cal-absent-subtag">{absentCount} absent</span>
                          ) : (
                            <span className="cal-present-subtag">All attended</span>
                          )}
                        </div>
                      ) : isSun ? (
                        <div className="cal-sunday-label">
                          <span>Sunday Off</span>
                        </div>
                      ) : isPastOrToday ? (
                        absentCount > 0 ? (
                          <div 
                            className="cal-absent-tag cursor-pointer"
                            onClick={() => {
                              setSelectedDate(dStr);
                              setViewMode('all-absentees');
                            }}
                            title={`${absentCount} absent. Click to open Register.`}
                          >
                            <AlertTriangle size={11} />
                            <span>{absentCount} Absent</span>
                          </div>
                        ) : (
                          <div 
                            className="cal-present-tag cursor-pointer"
                            onClick={() => {
                              setSelectedDate(dStr);
                              setViewMode('all-absentees');
                            }}
                            title="Classes conducted, all attended. Click to view."
                          >
                            <Check size={11} />
                            <span>Normal Class</span>
                          </div>
                        )
                      ) : (
                        <div className="cal-future-label">
                          <span>Class Scheduled</span>
                        </div>
                      )}
                    </div>

                    {/* Quick footer action to jump to this date's roll call */}
                    <div className="cal-day-footer">
                      <button
                        type="button"
                        className="cal-view-date-link"
                        onClick={() => {
                          setSelectedDate(dStr);
                          setViewMode('all-absentees');
                        }}
                      >
                        Roll Call →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="cal-legend-row flex items-center flex-wrap gap-4 pt-4 mt-4 border-t border-slate-800 text-xs text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.4)', border: '1px solid #10B981' }} />
                <span>Normal Class Attended</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.3)', border: '1px solid #F59E0B' }} />
                <span className="font-semibold text-amber-300">🌴 Declared Tuition Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px dashed #F59E0B' }} />
                <span>⚡ Sunday Extra Class</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(244, 63, 94, 0.3)', border: '1px solid #F43F5E' }} />
                <span className="text-rose font-medium">Recorded Absences</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }} />
                <span>Sunday Weekly Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: '#6366F1' }} />
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HOLIDAY DECLARATION MODAL                                                 */}
      {/* ========================================================================= */}
      {holidayModalOpen && (
        <div className="modal-overlay" onClick={() => setHolidayModalOpen(false)}>
          <div className="modal-content glass-card holiday-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌴</span>
                <h3 className="modal-title text-base font-bold text-white mb-0">Declare Tuition Holiday</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn text-muted hover:text-white" 
                onClick={() => setHolidayModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body py-4">
              <p className="text-xs text-secondary mb-3">
                Tuition will be marked as closed on this date. Students will not be penalized or counted absent, and the Tuition Calendar &amp; Parent Portal will update automatically.
              </p>

              <div className="form-group mb-3">
                <label className="form-label text-xs font-semibold text-white">Holiday Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={holidayModalDate} 
                  onChange={e => setHolidayModalDate(e.target.value)} 
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label text-xs font-semibold text-white">Quick Occasion Presets</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    'Diwali',
                    'Pongal / Sankranti',
                    'Dussehra / Navratri',
                    'Independence Day',
                    'Republic Day',
                    'Gandhi Jayanti',
                    'Eid / Ramzan',
                    'Christmas',
                    'Maha Shivaratri',
                    'Ganesh Chaturthi',
                    'Monsoon / Heavy Rain Holiday',
                    'Center Maintenance',
                    'Exam Preparation Break'
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={`btn btn-xs ${holidayModalReason === preset ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setHolidayModalReason(preset)}
                      style={{ fontSize: '0.72rem', borderRadius: '6px' }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label text-xs font-semibold text-white">Holiday Name / Occasion</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Diwali Holiday, Pongal Vacation, Center Closed"
                  value={holidayModalReason} 
                  onChange={e => setHolidayModalReason(e.target.value)} 
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setHolidayModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={() => handleDeclareHoliday(holidayModalDate, holidayModalReason)}
              >
                <span>🌴</span>
                <span>Confirm &amp; Declare Holiday</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STYLES                                                                    */}
      {/* ========================================================================= */}
      <style>{`
        .badge-amber {
          background: rgba(245, 158, 11, 0.25);
          color: #FDE68A;
          border: 1px solid rgba(245, 158, 11, 0.45);
        }

        /* Holiday Declared Banner */
        .holiday-declared-banner {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 14px 20px;
          border-radius: var(--radius-lg);
        }
        .holiday-banner-icon {
          font-size: 28px;
          line-height: 1;
        }

        /* Calendar View Styles */
        .calendar-view-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .calendar-toolbar-card {
          padding: 18px 22px;
        }
        .cal-kpis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .cal-kpi-box {
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cal-kpi-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .cal-kpi-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .cal-weekdays-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }
        .cal-weekday-header {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          padding: 6px 0;
          text-transform: uppercase;
        }
        .text-rose-header {
          color: #FB7185;
        }

        .cal-month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .cal-cell-slot {
          min-height: 100px;
          border-radius: var(--radius-md);
        }
        .cal-cell-empty {
          background: rgba(15, 23, 42, 0.15);
          opacity: 0.25;
        }
        .cal-day-cell {
          min-height: 105px;
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.15s ease;
          position: relative;
        }
        .cal-day-cell:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(15, 23, 42, 0.65);
        }
        .cal-day-cell:hover .hover-show {
          opacity: 1;
        }
        .cell-declared-holiday {
          background: rgba(245, 158, 11, 0.08) !important;
          border: 1px solid rgba(245, 158, 11, 0.4) !important;
        }
        .cell-has-extra {
          background: rgba(245, 158, 11, 0.05);
          border: 1px dashed rgba(245, 158, 11, 0.4);
        }
        .cell-sunday-off {
          background: rgba(15, 23, 42, 0.25);
          opacity: 0.7;
        }
        .cell-today {
          border-color: #6366F1 !important;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.25);
        }

        .cal-day-num {
          font-size: 0.8125rem;
          font-weight: 700;
          color: white;
        }
        .today-circle {
          background: #6366F1;
          color: white;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }
        .today-chip {
          font-size: 0.625rem;
          background: rgba(99, 102, 241, 0.2);
          color: #A5B4FC;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 600;
        }
        .cal-day-icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.7rem;
        }
        .hover-show {
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .cal-day-body {
          margin: 6px 0;
          min-height: 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .cal-holiday-tag {
          background: rgba(245, 158, 11, 0.22);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #FDE68A;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cal-extra-tag {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #FBBF24;
          font-size: 0.625rem;
          padding: 2px 4px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cal-absent-subtag {
          color: #FB7185;
          font-weight: 700;
        }
        .cal-present-subtag {
          color: #34D399;
          font-weight: 600;
        }
        .cal-sunday-label {
          font-size: 0.65rem;
          color: #64748B;
          text-align: center;
          font-weight: 600;
        }
        .cal-future-label {
          font-size: 0.625rem;
          color: #475569;
          text-align: center;
        }
        .cal-absent-tag {
          background: rgba(244, 63, 94, 0.18);
          border: 1px solid rgba(244, 63, 94, 0.45);
          color: #FB7185;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .cal-present-tag {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34D399;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .cal-day-footer {
          display: flex;
          justify-content: flex-end;
        }
        .cal-view-date-link {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.625rem;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }
        .cal-view-date-link:hover {
          color: var(--primary);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
        }
        .modal-content.holiday-modal {
          max-width: 500px;
          width: 100%;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-xl);
          padding: 22px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .attendance-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Header & Mode Switcher */
        .attendance-header-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .header-meta-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .save-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.2);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.4);
          font-size: 0.725rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
        }

        /* Mode Toggle Group */
        .mode-toggle-group {
          display: inline-flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 4px;
          gap: 4px;
        }
        .mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .mode-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .mode-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        .mode-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }
        .badge-rose {
          background: #F43F5E;
          color: white;
        }
        .badge-emerald {
          background: rgba(16, 185, 129, 0.3);
          color: #34D399;
        }

        /* All Absentees Toolbar & Metrics */
        .absentees-toolbar-card {
          padding: 18px 22px;
        }
        .toolbar-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .date-controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .control-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .quick-date-pills {
          display: flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 2px;
          gap: 2px;
        }
        .quick-date-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.775rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .quick-date-btn:hover {
          color: white;
        }
        .quick-date-btn.active {
          background: rgba(255, 255, 255, 0.12);
          color: white;
        }
        .date-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .date-input-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .date-picker-input {
          padding-left: 32px !important;
          max-width: 160px;
          height: 34px;
          font-size: 0.8rem;
        }
        .toolbar-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Metrics Bar */
        .absentees-metrics-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }
        .metric-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .metric-has-absentees {
          background: rgba(244, 63, 94, 0.1);
          border-color: rgba(244, 63, 94, 0.35);
          color: #FB7185;
        }
        .metric-all-present {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34D399;
        }

        /* Filter Controls */
        .absentees-filters-card {
          padding: 12px 18px;
        }
        .filters-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-select {
          height: 36px;
          font-size: 0.8125rem;
          min-width: 200px;
        }
        .search-group {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 260px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input {
          padding-left: 36px !important;
          padding-right: 32px !important;
          height: 36px;
          font-size: 0.8125rem;
        }

        /* Table & Row Styling */
        .absentees-table-card {
          padding: 0;
          overflow: hidden;
        }
        .row-master-absent {
          background: rgba(244, 63, 94, 0.04) !important;
          transition: background 0.15s ease;
        }
        .row-master-absent:hover {
          background: rgba(244, 63, 94, 0.08) !important;
        }
        .student-avatar-absent {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: rgba(244, 63, 94, 0.2);
          border: 1px solid rgba(244, 63, 94, 0.4);
          color: #FB7185;
          font-weight: 700;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .absentee-action-buttons {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
        .whatsapp-row-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          font-size: 0.75rem;
        }
        .unmark-present-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          font-size: 0.75rem;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .unmark-present-btn:hover {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }

        /* Celebration & Empty State */
        .perfect-attendance-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 50px 24px;
        }
        .celebration-icon-box {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.2);
        }
        .celebration-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #34D399;
          margin-bottom: 8px;
        }
        .celebration-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          max-width: 480px;
          margin-bottom: 20px;
        }
        .empty-filter-card {
          padding: 40px;
          text-align: center;
        }

        /* Center Absentees Alert Banner (Inside Batch Mode) */
        .center-absentees-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          gap: 12px;
          flex-wrap: wrap;
        }
        .banner-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FB7185;
          font-size: 0.85rem;
        }
        .btn-outline-rose {
          background: transparent;
          border: 1px solid rgba(244, 63, 94, 0.5);
          color: #FB7185;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-outline-rose:hover {
          background: rgba(244, 63, 94, 0.2);
        }

        /* Batch Controls Card */
        .attendance-controls-card {
          padding: 20px;
        }
        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .date-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .date-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .date-input-box .form-input {
          padding-left: 36px;
        }
        .attendance-stats-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .stat-present {
          color: #34D399;
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.08);
        }
        .stat-absent {
          color: var(--text-muted);
        }
        .stat-absent.has-absent {
          color: #FB7185;
          border-color: rgba(244, 63, 94, 0.4);
          background: rgba(244, 63, 94, 0.1);
        }
        .stat-late {
          color: #FBBF24;
          border-color: rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.08);
        }
        .stat-rate {
          color: #A5B4FC;
          font-weight: 600;
        }

        /* Absentees Tray */
        .absentees-tray {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: var(--radius-md);
          flex-wrap: wrap;
        }
        .tray-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #FB7185;
          flex-shrink: 0;
        }
        .tray-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .absentee-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(244, 63, 94, 0.2);
          border: 1px solid rgba(244, 63, 94, 0.5);
          color: white;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .absentee-chip:hover {
          background: rgba(244, 63, 94, 0.4);
          transform: scale(1.03);
        }
        .chip-remove-icon {
          color: #FB7185;
        }

        /* Search Bar */
        .search-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .search-input-box {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 420px;
          width: 100%;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input-box .form-input {
          padding-left: 36px;
          padding-right: 32px;
        }
        .search-clear-btn {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .search-helper-text {
          font-size: 0.775rem;
          color: var(--text-muted);
        }

        /* Fast Action Buttons & Split Layout */
        .attendance-split-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        .row-absent {
          background: rgba(244, 63, 94, 0.06) !important;
        }
        .fast-attendance-cell {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }
        .btn-fast-attendance {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-weight: 700;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          user-select: none;
        }
        .btn-fast-attendance:hover {
          transform: scale(1.02);
        }
        .btn-fast-attendance.status-present {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.4);
          color: #34D399;
        }
        .btn-fast-attendance.status-present:hover {
          background: rgba(16, 185, 129, 0.22);
          border-color: #10B981;
        }
        .btn-fast-attendance.status-absent {
          background: rgba(244, 63, 94, 0.2);
          border-color: #F43F5E;
          color: #FB7185;
          box-shadow: 0 0 12px rgba(244, 63, 94, 0.3);
        }
        .btn-fast-attendance.status-absent:hover {
          background: rgba(244, 63, 94, 0.3);
        }
        .btn-fast-attendance.status-late {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.4);
          color: #FBBF24;
        }
        .btn-fast-attendance.status-extra {
          background: rgba(245, 158, 11, 0.16);
          border-color: rgba(245, 158, 11, 0.55);
          color: #FDE68A;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
        }
        .btn-fast-attendance.status-extra:hover {
          background: rgba(245, 158, 11, 0.28);
          border-color: #F59E0B;
        }
        .badge-extra-class {
          background: rgba(245, 158, 11, 0.2) !important;
          border: 1px solid rgba(245, 158, 11, 0.55) !important;
          color: #FBBF24 !important;
          font-weight: 700;
        }
        .status-title {
          letter-spacing: 0.03em;
        }
        .status-sub-hint {
          font-size: 0.675rem;
          font-weight: 500;
          opacity: 0.75;
          margin-left: 2px;
        }
        .btn-late-mini {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-late-mini:hover {
          color: #FBBF24;
          border-color: #FBBF24;
        }
        .btn-late-mini.active {
          background: rgba(245, 158, 11, 0.2);
          color: #FBBF24;
          border-color: #FBBF24;
        }

        /* Sidebar */
        .absentee-sidebar {
          padding: 20px;
        }
        .absentee-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .absentee-title {
          font-size: 1.05rem;
          font-weight: 700;
        }
        .text-rose { color: #FB7185; }
        .no-absentees-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px dashed rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-md);
          text-align: center;
        }
        .absentees-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .absentee-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          border: 1px solid rgba(244, 63, 94, 0.25);
          gap: 10px;
        }
        .whatsapp-alert-btn {
          padding: 5px 10px;
          font-size: 0.75rem;
        }

        /* Sunday Holiday & Extra Class Banners */
        .sunday-holiday-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-md);
          gap: 16px;
          flex-wrap: wrap;
        }
        .sunday-active-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          gap: 14px;
          flex-wrap: wrap;
        }
        .banner-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sunday-banner-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sunday-pill-tag {
          display: inline-flex;
          align-items: center;
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #FBBF24;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }
        .sunday-active-tag {
          display: inline-flex;
          align-items: center;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34D399;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }
        .sunday-batch-holiday-card {
          display: flex;
          align-items: center;
          padding: 40px 32px;
          gap: 28px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-lg);
          margin-top: 16px;
        }
        .sunday-card-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          flex-shrink: 0;
        }
        .sunday-card-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .sunday-card-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: white;
          margin: 0;
        }
        .sunday-card-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .sunday-card-callout {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .sunday-card-actions {
          margin-top: 8px;
        }
        .btn-outline-secondary {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          transition: all 0.15s ease;
        }
        .btn-outline-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .attendance-header-card {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          .mode-toggle-group {
            width: 100%;
            justify-content: center;
          }
          .mode-btn {
            flex: 1;
            justify-content: center;
            font-size: 0.75rem;
            padding: 7px 10px;
          }
          .toolbar-top-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .date-controls-group {
            flex-direction: column;
            align-items: flex-start;
          }
          .toolbar-actions-group {
            width: 100%;
          }
          .toolbar-actions-group .btn {
            flex: 1;
          }
          .filters-row {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-select {
            width: 100%;
          }
          .attendance-controls-card {
            padding: 14px 12px;
          }
          .controls-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .attendance-stats-bar {
            gap: 6px;
          }
          .stat-pill {
            padding: 4px 8px;
            font-size: 0.725rem;
          }
          .attendance-split-layout {
            grid-template-columns: 1fr !important;
          }
          .btn-fast-attendance {
            padding: 6px 10px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
