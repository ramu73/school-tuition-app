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
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import { generateNextId } from '../lib/storage';
import { USER_ROLES } from '../lib/auth';

export default function Attendance({ data, currentUser, onSaveData }) {
  const { students = [], batches = [], classes = [], attendance = [] } = data;
  const isTeacher = currentUser?.role === USER_ROLES.TEACHER;

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('CLASS_10');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveIndicator, setSaveIndicator] = useState(false);

  // Filter batches for current class
  const classBatches = batches.filter(b => b.classCode === selectedClass);

  // Filter students for current class and batch
  const eligibleStudents = students.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    if (s.classCode !== selectedClass) return false;
    if (selectedBatchId && s.batchId !== Number(selectedBatchId)) return false;
    return true;
  });

  // Default Assumption: In tuition, all students are PRESENT unless explicitly marked ABSENT or LATE
  const getStudentStatus = (studentId) => {
    const record = attendance.find(a => a.studentId === studentId && a.date === selectedDate);
    if (!record) return 'PRESENT';
    return record.status || 'PRESENT';
  };

  // 1-Tap Toggle: Present ↔ Absent ("Only absent will take")
  const handleToggleAbsent = (studentId) => {
    const currentStatus = getStudentStatus(studentId);
    const newStatus = currentStatus === 'ABSENT' ? 'PRESENT' : 'ABSENT';

    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    let updated = [...attendance];

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: newStatus,
        batchId: eligibleStudents.find(s => s.id === studentId)?.batchId
      };
    } else {
      updated.push({
        id: generateNextId(updated),
        studentId,
        date: selectedDate,
        status: newStatus,
        batchId: eligibleStudents.find(s => s.id === studentId)?.batchId
      });
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // Optional: Set specific status (Present, Absent, Late)
  const handleSetStatus = (studentId, status) => {
    const existingIndex = attendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    let updated = [...attendance];

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        batchId: eligibleStudents.find(s => s.id === studentId)?.batchId
      };
    } else {
      updated.push({
        id: generateNextId(updated),
        studentId,
        date: selectedDate,
        status,
        batchId: eligibleStudents.find(s => s.id === studentId)?.batchId
      });
    }

    onSaveData({ ...data, attendance: updated });
    triggerSaveIndicator();
  };

  // One-click: Reset All Students to Present (Clears all absentees)
  const handleResetAllPresent = () => {
    let updated = [...attendance];
    eligibleStudents.forEach(student => {
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

  const triggerSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2200);
  };

  // Stats calculation
  const absentStudents = eligibleStudents.filter(s => getStudentStatus(s.id) === 'ABSENT');
  const lateStudents = eligibleStudents.filter(s => getStudentStatus(s.id) === 'LATE');
  const presentCount = eligibleStudents.length - absentStudents.length - lateStudents.length;
  const absentCount = absentStudents.length;
  const lateCount = lateStudents.length;
  const attendancePercentage = eligibleStudents.length > 0 
    ? Math.round((presentCount / eligibleStudents.length) * 100) 
    : 100;

  // Filtered students based on search query
  const displayStudents = eligibleStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || (s.admissionNo && s.admissionNo.toLowerCase().includes(q));
  });

  return (
    <div className="attendance-page">
      {/* Header */}
      <div className="attendance-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Daily Attendance Register</h1>
            {saveIndicator && (
              <span className="save-badge-pill animate-fade-in">
                <Check size={13} /> Saved ✓
              </span>
            )}
          </div>
          <p className="page-subtitle">
            <strong>Fast Mode:</strong> All students are marked Present by default. Simply tap on any student to mark them <strong>Absent</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetAllPresent}
            title="Reset everyone in this class/batch to Present"
            disabled={eligibleStudents.length === 0}
          >
            <RotateCcw size={14} />
            <span>Reset All Present</span>
          </button>
        </div>
      </div>

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
            <span>Total Enrolled: <strong>{eligibleStudents.length}</strong></span>
          </div>
          <div className="stat-pill stat-present">
            <CheckCircle2 size={15} />
            <span>Present: <strong>{presentCount}</strong></span>
          </div>
          <div className={`stat-pill stat-absent ${absentCount > 0 ? 'has-absent' : ''}`}>
            <XCircle size={15} />
            <span>Absent: <strong>{absentCount}</strong></span>
          </div>
          {lateCount > 0 && (
            <div className="stat-pill stat-late">
              <Clock size={15} />
              <span>Late: <strong>{lateCount}</strong></span>
            </div>
          )}
          <div className="stat-pill stat-rate">
            <span>Turnout: <strong>{attendancePercentage}%</strong></span>
          </div>
        </div>

        {/* Quick Absentees Tray (Chips list for rapid visual confirmation & 1-tap undo) */}
        {absentStudents.length > 0 && (
          <div className="absentees-tray mt-3">
            <div className="tray-label">
              <XCircle size={14} className="text-rose" />
              <span>Marked Absent Today ({absentStudents.length}):</span>
            </div>
            <div className="tray-chips">
              {absentStudents.map(student => (
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="search-helper-text">
          {displayStudents.length} of {eligibleStudents.length} students shown
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
              {displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={!isTeacher ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {eligibleStudents.length === 0 
                      ? 'No active students enrolled in this class / batch yet.' 
                      : `No students matching "${searchQuery}".`}
                  </td>
                </tr>
              ) : (
                displayStudents.map((student) => {
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

                      {/* 1-Tap Attendance Action (User-friendly toggle) */}
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

        {/* Right Sidebar: Absentee Alerts & Follow-up */}
        <div className="glass-card absentee-sidebar">
          <div className="absentee-header">
            <AlertTriangle size={18} className="text-rose" />
            <h2 className="absentee-title">Absentee Alerts ({absentStudents.length})</h2>
          </div>
          
          <p className="text-xs text-muted mb-3">
            {!isTeacher 
              ? 'Send instant WhatsApp notices to parents when students are absent from tuition.'
              : 'Absentees are automatically saved and available to the Admin for parent communication.'}
          </p>

          {absentStudents.length === 0 ? (
            <div className="no-absentees-box">
              <CheckCircle2 size={26} className="text-emerald mb-2" />
              <div className="font-semibold text-xs text-emerald">100% Present Today!</div>
              <div className="text-xs text-muted mt-1">No students marked absent for this batch.</div>
            </div>
          ) : (
            <div className="absentees-list">
              {absentStudents.map(student => {
                const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
                const messageText = `Dear Parent, this is to inform you that your child ${student.name} was marked ABSENT for ${className} tuition today (${selectedDate}). Kindly ensure regular attendance. - HAYAGRIVA TUTORIALS`;
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

      <style>{`
        .attendance-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .attendance-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
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
          margin-left: auto;
          color: #A5B4FC;
          font-weight: 600;
        }

        /* Top Absentees Tray */
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

        /* Table & Fast Action Button */
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
          .attendance-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
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
