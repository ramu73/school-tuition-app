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
  AlertTriangle
} from 'lucide-react';
import { generateNextId } from '../lib/storage';



export default function Attendance({ data, onSaveData }) {
  const { students = [], batches = [], classes = [], attendance = [] } = data;

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('CLASS_10');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  // Filter batches for current class
  const classBatches = batches.filter(b => b.classCode === selectedClass);

  // Filter students for current class and batch
  const eligibleStudents = students.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    if (s.classCode !== selectedClass) return false;
    if (selectedBatchId && s.batchId !== Number(selectedBatchId)) return false;
    return true;
  });

  // Get current attendance status for a student on selected date
  const getAttendanceRecord = (studentId) => {
    return attendance.find(a => a.studentId === studentId && a.date === selectedDate);
  };

  // Toggle or set status
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
  };

  // One-click Mark All Present
  const handleMarkAllPresent = () => {
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
  };

  // Stats for current selection
  const markedRecords = eligibleStudents.map(s => getAttendanceRecord(s.id)).filter(Boolean);
  const presentCount = markedRecords.filter(r => r.status === 'PRESENT').length;
  const absentCount = markedRecords.filter(r => r.status === 'ABSENT').length;
  const lateCount = markedRecords.filter(r => r.status === 'LATE').length;
  const attendancePercentage = eligibleStudents.length > 0 
    ? Math.round((presentCount / eligibleStudents.length) * 100) 
    : 0;

  // Absentees list for WhatsApp parent communication
  const absentees = eligibleStudents.filter(s => {
    const rec = getAttendanceRecord(s.id);
    return rec && rec.status === 'ABSENT';
  });

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1 className="page-title">Daily Attendance Register</h1>
          <p className="page-subtitle">Fast roll call and instant parent absentee alerts for Class 1 to 10</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleMarkAllPresent}
          disabled={eligibleStudents.length === 0}
        >
          <Zap size={16} />
          <span>Mark All Present</span>
        </button>
      </div>

      {/* Selector Filters Bar */}
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
              <option value="">All Batches for {classes.find(c => c.code === selectedClass)?.name}</option>
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
            <span>Enrolled: <strong>{eligibleStudents.length}</strong></span>
          </div>
          <div className="stat-pill stat-present">
            <CheckCircle2 size={15} />
            <span>Present: <strong>{presentCount}</strong></span>
          </div>
          <div className="stat-pill stat-absent">
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
      </div>

      {/* Split Layout: Attendance Table on Left + WhatsApp Absentee Alerts on Right */}
      <div className="attendance-split-layout">
        {/* Student Roll Call Table */}
        <div className="table-container flex-1">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Parent Phone</th>
                <th style={{ textAlign: 'center' }}>Mark Status</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {eligibleStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No active students enrolled in this class / batch yet.
                  </td>
                </tr>
              ) : (
                eligibleStudents.map((student) => {
                  const record = getAttendanceRecord(student.id);
                  const status = record?.status || 'UNMARKED';

                  return (
                    <tr key={student.id}>
                      <td className="font-mono text-xs text-muted">{student.admissionNo}</td>
                      <td>
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-xs text-muted">{student.school || 'School unspecified'}</div>
                      </td>
                      <td className="text-xs text-secondary">{student.parentPhone}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="status-toggle-group">
                          <button
                            className={`toggle-btn toggle-present ${status === 'PRESENT' ? 'active' : ''}`}
                            onClick={() => handleSetStatus(student.id, 'PRESENT')}
                            title="Mark Present"
                          >
                            <Check size={14} />
                            <span>P</span>
                          </button>
                          <button
                            className={`toggle-btn toggle-absent ${status === 'ABSENT' ? 'active' : ''}`}
                            onClick={() => handleSetStatus(student.id, 'ABSENT')}
                            title="Mark Absent"
                          >
                            <X size={14} />
                            <span>A</span>
                          </button>
                          <button
                            className={`toggle-btn toggle-late ${status === 'LATE' ? 'active' : ''}`}
                            onClick={() => handleSetStatus(student.id, 'LATE')}
                            title="Mark Late"
                          >
                            <Clock size={14} />
                            <span>L</span>
                          </button>
                        </div>
                      </td>
                      <td>
                        {status === 'PRESENT' && <span className="badge badge-success">Present</span>}
                        {status === 'ABSENT' && <span className="badge badge-danger">Absent</span>}
                        {status === 'LATE' && <span className="badge badge-warning">Late</span>}
                        {status === 'UNMARKED' && <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>Not Marked</span>}
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
            <h2 className="absentee-title">Absentee Alerts ({absentees.length})</h2>
          </div>
          <p className="text-xs text-muted mb-3">
            Notify parents via WhatsApp with a single tap when students miss tuition.
          </p>

          {absentees.length === 0 ? (
            <div className="no-absentees-box">
              <CheckCircle2 size={24} className="text-emerald mb-1" />
              <div className="font-semibold text-xs text-emerald">No Absentees Today</div>
              <div className="text-xs text-muted">All marked students are present!</div>
            </div>
          ) : (
            <div className="absentees-list">
              {absentees.map(student => {
                const messageText = `Dear Parent, this is to inform you that your child ${student.name} was marked ABSENT for ${classes.find(c => c.code === student.classCode)?.name} tuition today (${selectedDate}). Kindly ensure regular attendance. - HAYAGRIVA TUTORIALS`;
                const whatsappUrl = `https://wa.me/91${student.parentPhone}?text=${encodeURIComponent(messageText)}`;

                return (
                  <div key={student.id} className="absentee-card">
                    <div>
                      <div className="font-semibold text-xs">{student.name}</div>
                      <div className="text-xs text-muted">Parent: {student.parentPhone}</div>
                    </div>
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-sm btn-success whatsapp-alert-btn"
                    >
                      <MessageSquare size={13} />
                      <span>Alert</span>
                    </a>
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
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
        }
        .stat-total { color: #A5B4FC; }
        .stat-present { color: #34D399; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25); }
        .stat-absent { color: #FB7185; background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.25); }
        .stat-late { color: #FBBF24; background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.25); }
        .stat-rate { margin-left: auto; font-weight: 700; color: var(--text-primary); }

        .attendance-split-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .attendance-split-layout { grid-template-columns: 1fr; }
        }
        .status-toggle-group {
          display: inline-flex;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
        }
        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 6px 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 700;
          transition: all 0.15s ease;
        }
        .toggle-btn:hover {
          color: var(--text-primary);
        }
        .toggle-present.active {
          background: var(--emerald-600);
          color: white;
        }
        .toggle-absent.active {
          background: var(--rose-600);
          color: white;
        }
        .toggle-late.active {
          background: var(--amber-600);
          color: white;
        }

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
          padding: 24px;
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
          border: 1px solid rgba(244, 63, 94, 0.2);
        }
        .whatsapp-alert-btn {
          padding: 4px 8px;
          font-size: 0.725rem;
        }

        /* Mobile Responsive for Attendance */
        @media (max-width: 768px) {
          .attendance-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .attendance-header .btn {
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
        }
      `}</style>
    </div>
  );
}
