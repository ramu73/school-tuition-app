import React, { useState } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { generateNextId } from '../lib/storage';
import { USER_ROLES } from '../lib/auth';

export default function Attendance({ 
  data, 
  currentUser, 
  onSaveData, 
  viewMode: propViewMode, 
  onViewModeChange 
}) {
  const { students = [], batches = [], classes = [], attendance = [] } = data;
  const isTeacher = currentUser?.role === USER_ROLES.TEACHER;

  // View Mode: 'all-absentees' (Consolidated master list) vs 'batch' (Batch-by-batch roll call)
  const [internalViewMode, setInternalViewMode] = useState(propViewMode || 'all-absentees');
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

  // Batch View Specific States
  const [selectedClass, setSelectedClass] = useState('CLASS_10');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  // All Absentees View Specific States
  const [absenteeClassFilter, setAbsenteeClassFilter] = useState('ALL');
  const [absenteeSearchQuery, setAbsenteeSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [saveIndicator, setSaveIndicator] = useState(false);

  const triggerSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2200);
  };

  // Helper: Get student status on selected date
  const getStudentStatus = (studentId) => {
    const record = attendance.find(a => a.studentId === studentId && a.date === selectedDate);
    if (!record) return 'PRESENT';
    return record.status || 'PRESENT';
  };

  // 1-Tap Toggle: Present ↔ Absent (Works across any view and auto-detects student batch)
  const handleToggleAbsent = (studentId) => {
    const student = students.find(s => s.id === studentId);
    const currentStatus = getStudentStatus(studentId);
    const newStatus = currentStatus === 'ABSENT' ? 'PRESENT' : 'ABSENT';

    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    let updated = [...attendance];

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: newStatus,
        batchId: student?.batchId || updated[existingIndex]?.batchId
      };
    } else {
      updated.push({
        id: generateNextId(updated),
        studentId,
        date: selectedDate,
        status: newStatus,
        batchId: student?.batchId
      });
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // Optional: Set specific status (Present, Absent, Late)
  const handleSetStatus = (studentId, status) => {
    const student = students.find(s => s.id === studentId);
    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    let updated = [...attendance];

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        batchId: student?.batchId || updated[existingIndex]?.batchId
      };
    } else {
      updated.push({
        id: generateNextId(updated),
        studentId,
        date: selectedDate,
        status,
        batchId: student?.batchId
      });
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // Reset entire batch to Present
  const handleResetAllPresent = () => {
    let updated = [...attendance];
    eligibleBatchStudents.forEach(student => {
      const existingIndex = updated.findIndex(a => a.studentId === student.id && a.date === selectedDate);
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], status: 'PRESENT' };
      } else {
        updated.push({
          id: generateNextId(updated),
          studentId: student.id,
          date: selectedDate,
          status: 'PRESENT',
          batchId: student.batchId
        });
      }
    });

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // ==========================================
  // MASTER "ALL ABSENTEES" CALCULATIONS
  // ==========================================
  const activeStudentsTotal = students.filter(s => s.status === 'ACTIVE').length;

  const allAbsenteesForDate = attendance
    .filter(a => a.date === selectedDate && a.status === 'ABSENT')
    .map(record => {
      const student = students.find(s => s.id === record.studentId);
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
    ? Math.max(0, Math.round(((activeStudentsTotal - allAbsenteesForDate.length) / activeStudentsTotal) * 100))
    : 100;

  // Filtered All Absentees list for table
  const filteredAllAbsentees = allAbsenteesForDate.filter(s => {
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

    let text = `📌 *HAYAGRIVA TUTORIALS — ABSENTEE REGISTER*\n`;
    text += `📅 Date: ${dateFormatted}\n`;
    text += `Total Absentees: ${allAbsenteesForDate.length} of ${activeStudentsTotal} (Turnout: ${overallTurnout}%)\n\n`;

    // Group by Class
    classes.forEach(cls => {
      const classAbs = allAbsenteesForDate.filter(s => s.classCode === cls.code);
      if (classAbs.length > 0) {
        text += `*${cls.name}* (${classAbs.length} absent):\n`;
        classAbs.forEach((s, idx) => {
          text += `  ${idx + 1}. ${s.name} (${s.admissionNo || 'Roll -'}) - ${s.batchName}\n`;
        });
        text += `\n`;
      }
    });

    text += `_Generated from Hayagriva Management App_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2200);
    });
  };

  // ==========================================
  // BATCH VIEW CALCULATIONS
  // ==========================================
  const classBatches = batches.filter(b => b.classCode === selectedClass);
  const eligibleBatchStudents = students.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    if (s.classCode !== selectedClass) return false;
    if (selectedBatchId && s.batchId !== Number(selectedBatchId)) return false;
    return true;
  });

  const batchAbsentStudents = eligibleBatchStudents.filter(s => getStudentStatus(s.id) === 'ABSENT');
  const batchLateStudents = eligibleBatchStudents.filter(s => getStudentStatus(s.id) === 'LATE');
  const batchPresentCount = eligibleBatchStudents.length - batchAbsentStudents.length - batchLateStudents.length;
  const batchAbsentCount = batchAbsentStudents.length;
  const batchLateCount = batchLateStudents.length;
  const batchAttendancePercentage = eligibleBatchStudents.length > 0 
    ? Math.round((batchPresentCount / eligibleBatchStudents.length) * 100) 
    : 100;

  const displayBatchStudents = eligibleBatchStudents.filter(s => {
    if (!batchSearchQuery.trim()) return true;
    const q = batchSearchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
  });

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="attendance-page">
      {/* Top Header & Dual Mode Switcher */}
      <div className="attendance-header-card glass-card">
        <div className="header-meta-left">
          <div className="flex items-center gap-2">
            <h1 className="page-title">
              {currentViewMode === 'all-absentees' ? 'All Absentees Register' : 'Daily Roll Call'}
            </h1>
            {saveIndicator && (
              <span className="save-badge-pill animate-fade-in">
                <Check size={13} /> Auto-Saved ✓
              </span>
            )}
          </div>
          <p className="page-subtitle mb-0">
            {currentViewMode === 'all-absentees'
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SINGLE UNIFIED ALL ABSENTEES REGISTER                             */}
      {/* ========================================================================= */}
      {currentViewMode === 'all-absentees' && (
        <div className="all-absentees-container">
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
              <div className="toolbar-actions-group">
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
                <CheckCircle2 size={15} className="text-emerald" />
                <span>
                  Center Turnout: <strong>{overallTurnout}%</strong>
                </span>
              </div>

              <div className="metric-pill text-muted text-xs">
                <span>
                  {classes.filter(c => allAbsenteesForDate.some(a => a.classCode === c.code)).length} of {classes.length} classes have absentees
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar: Class Dropdown + Search Input */}
          <div className="glass-card absentees-filters-card">
            <div className="filters-row">
              {/* Class Filter */}
              <div className="filter-group">
                <Filter size={15} className="text-muted" />
                <label className="text-xs text-muted font-medium">Standard:</label>
                <select
                  className="form-select filter-select"
                  value={absenteeClassFilter}
                  onChange={(e) => setAbsenteeClassFilter(e.target.value)}
                >
                  <option value="ALL">All Standards (Classes 1–10)</option>
                  {classes.map(cls => {
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
                <CheckCircle2 size={46} className="text-emerald" />
              </div>
              <h2 className="celebration-title">100% Attendance on {formattedSelectedDate}!</h2>
              <p className="celebration-subtitle">
                No students across Classes 1 to 10 are marked absent for this date. All enrolled students are marked Present.
              </p>
              <div className="celebration-actions">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setViewMode('batch')}
                >
                  <ListChecks size={15} />
                  <span>Open Roll Call Register</span>
                </button>
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
                    const messageText = `Dear Parent, this is to inform you that your child *${student.name}* of *${student.className}* was marked ABSENT for tuition today (${selectedDate}). Regular attendance is critical for academic continuity. Kindly contact us if you have any questions. - HAYAGRIVA TUTORIALS`;
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

              {/* Class 1 to 10 Selector */}
              <div className="form-group mb-0">
                <label className="form-label">Select Standard (Class 1 to 10)</label>
                <select 
                  className="form-select"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedBatchId('');
                  }}
                >
                  {classes.map(cls => (
                    <option key={cls.code} value={cls.code}>{cls.name} ({cls.category})</option>
                  ))}
                </select>
              </div>

              {/* Batch Selector */}
              <div className="form-group mb-0">
                <label className="form-label">Batch Slot</label>
                <select 
                  className="form-select"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="">All Batches ({classBatches.length} slots)</option>
                  {classBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.timing})</option>
                  ))}
                </select>
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
                <span>Turnout: <strong>{batchAttendancePercentage}%</strong></span>
              </div>

              <div className="batch-actions-right ml-auto">
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetAllPresent}
                  title="Reset everyone in this class/batch to Present"
                  disabled={eligibleBatchStudents.length === 0}
                >
                  <RotateCcw size={13} />
                  <span>Reset All Present</span>
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
                    {!isTeacher && <th>Parent Phone</th>}
                    <th style={{ textAlign: 'center', width: '220px' }}>Take Attendance</th>
                    <th style={{ width: '110px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayBatchStudents.length === 0 ? (
                    <tr>
                      <td colSpan={!isTeacher ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {eligibleBatchStudents.length === 0 
                          ? 'No active students enrolled in this class / batch yet.' 
                          : `No students matching "${batchSearchQuery}".`}
                      </td>
                    </tr>
                  ) : (
                    displayBatchStudents.map((student) => {
                      const status = getStudentStatus(student.id);
                      const isAbsent = status === 'ABSENT';
                      const isLate = status === 'LATE';

                      return (
                        <tr key={student.id} className={isAbsent ? 'row-absent' : ''}>
                          <td className="font-mono text-xs text-muted">{student.admissionNo}</td>
                          <td>
                            <div className="font-semibold text-white">{student.name}</div>
                            <div className="text-xs text-muted">{student.school || 'School unspecified'}</div>
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
                                className={`btn-fast-attendance ${isAbsent ? 'status-absent' : isLate ? 'status-late' : 'status-present'}`}
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
                                    <CheckCircle2 size={16} />
                                    <span className="status-title">PRESENT</span>
                                    <span className="status-sub-hint">Tap if Absent</span>
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
                <h2 className="absentee-title">Batch Absentees ({batchAbsentStudents.length})</h2>
              </div>
              
              <p className="text-xs text-muted mb-3">
                {!isTeacher 
                  ? 'Send instant WhatsApp notices to parents for students in this batch.'
                  : 'Absentees are automatically saved and visible to Admin in the master register.'}
              </p>

              {batchAbsentStudents.length === 0 ? (
                <div className="no-absentees-box">
                  <CheckCircle2 size={26} className="text-emerald mb-2" />
                  <div className="font-semibold text-xs text-emerald">100% Present in Batch!</div>
                  <div className="text-xs text-muted mt-1">No students marked absent for this batch.</div>
                </div>
              ) : (
                <div className="absentees-list">
                  {batchAbsentStudents.map(student => {
                    const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
                    const messageText = `Dear Parent, this is to inform you that your child *${student.name}* was marked ABSENT for *${className}* tuition today (${selectedDate}). Kindly ensure regular attendance. - HAYAGRIVA TUTORIALS`;
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* STYLES                                                                    */}
      {/* ========================================================================= */}
      <style>{`
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
