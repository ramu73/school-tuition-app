import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Users, 
  UserCheck, 
  MapPin, 
  X, 
  BookOpen, 
  Trash2, 
  UserPlus, 
  Search, 
  Check, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';
import { generateNextId } from '../lib/storage';
import { USER_ROLES } from '../lib/auth';

export default function Batches({ data, currentUser, onSaveData, setActiveTab, setSelectedClassFilter, onSelectBatchForAttendance }) {
  const { batches = [], students = [], classes = [] } = data;
  const isTeacher = currentUser?.role === USER_ROLES.TEACHER;
  const assignedBatchIds = Array.isArray(currentUser?.assignedBatchIds) 
    ? currentUser.assignedBatchIds.map(String) 
    : [];
  const assignedStudentIds = Array.isArray(currentUser?.assignedStudentIds)
    ? currentUser.assignedStudentIds.map(String)
    : [];

  const visibleBatches = isTeacher
    ? batches.filter(b => {
        const inBatch = assignedBatchIds.includes(String(b.id));
        const hasAssignedStudent = assignedStudentIds.length > 0 && 
          students.some(s => assignedStudentIds.includes(String(s.id)) && String(s.batchId) === String(b.id));
        return inBatch || hasAssignedStudent;
      })
    : batches;

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedBatchForRoster, setSelectedBatchForRoster] = useState(null);
  const [manageStudentsBatch, setManageStudentsBatch] = useState(null);
  const [batchStudentSearchQuery, setBatchStudentSearchQuery] = useState('');
  const [batchStudentClassFilter, setBatchStudentClassFilter] = useState('ALL');
  const [selectedStudentIdsForBatch, setSelectedStudentIdsForBatch] = useState([]);
  const [batchSaveFeedback, setBatchSaveFeedback] = useState(null);

  const [newBatch, setNewBatch] = useState({
    name: '',
    classCode: 'ALL',
    timing: '05:00 PM - 06:30 PM',
    tutor: '',
    room: 'Hall A',
    capacity: 25
  });

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.tutor) {
      alert('Please enter Batch Name and Tutor Name.');
      return;
    }

    const created = {
      id: generateNextId(batches),
      name: newBatch.name,
      classCode: newBatch.classCode,
      timing: newBatch.timing,
      tutor: newBatch.tutor,
      room: newBatch.room,
      capacity: Number(newBatch.capacity) || 25
    };


    onSaveData({
      ...data,
      batches: [...batches, created]
    });

    setBatchModalOpen(false);
    setNewBatch({
      name: '',
      classCode: 'ALL',
      timing: '05:00 PM - 06:30 PM',
      tutor: '',
      room: 'Hall A',
      capacity: 25
    });
  };

  const handleDeleteBatch = (batchId) => {
    if (window.confirm('Delete this batch slot?')) {
      const filtered = batches.filter(b => b.id !== batchId);
      onSaveData({ ...data, batches: filtered });
    }
  };

  const handleOpenManageStudents = (batch) => {
    setManageStudentsBatch(batch);
    const currentlyEnrolled = students
      .filter(s => String(s.batchId) === String(batch.id))
      .map(s => s.id);
    setSelectedStudentIdsForBatch(currentlyEnrolled);
    setBatchStudentSearchQuery('');
    setBatchStudentClassFilter('ALL');
    setBatchSaveFeedback(null);
  };

  const handleToggleBatchStudent = (studentId) => {
    setSelectedStudentIdsForBatch(prev => {
      const exists = prev.some(id => String(id) === String(studentId));
      return exists 
        ? prev.filter(id => String(id) !== String(studentId)) 
        : [...prev, studentId];
    });
  };

  const handleSaveBatchStudents = () => {
    if (!manageStudentsBatch) return;
    const targetBatchId = Number(manageStudentsBatch.id);

    const updatedStudents = students.map(s => {
      const isSelected = selectedStudentIdsForBatch.some(id => String(id) === String(s.id));
      const wasInBatch = Number(s.batchId) === targetBatchId;

      if (isSelected && !wasInBatch) {
        return { ...s, batchId: targetBatchId };
      }
      if (!isSelected && wasInBatch) {
        return { ...s, batchId: null };
      }
      return s;
    });

    onSaveData({
      ...data,
      students: updatedStudents
    });

    setBatchSaveFeedback(`✓ Roster updated for ${manageStudentsBatch.name}!`);
    setTimeout(() => {
      setBatchSaveFeedback(null);
      setManageStudentsBatch(null);
    }, 1200);
  };

  // Filtered students for the batch student assignment modal
  const filteredActiveStudents = students.filter(s => {
    if (!s) return false;
    const st = String(s.status || '').toUpperCase();
    if (st === 'INACTIVE' || st === 'DISABLED' || st === 'DELETED') return false;
    if (batchStudentClassFilter !== 'ALL' && s.classCode !== batchStudentClassFilter) return false;
    if (batchStudentSearchQuery.trim()) {
      const q = batchStudentSearchQuery.toLowerCase().trim();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.admissionNo && s.admissionNo.toLowerCase().includes(q);
      const matchSchool = s.school && s.school.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchSchool) return false;
    }
    return true;
  });

  return (
    <div className="batches-page">
      <div className="batches-header">
        <div>
          <h1 className="page-title">Batches & Daily Timetable</h1>
          <p className="page-subtitle">
            {isTeacher 
              ? `Faculty Schedule — Showing your ${visibleBatches.length} assigned tuition batches` 
              : 'Class schedules, tutor assignments, and seat capacities for Classes 1 to 10'}
          </p>
        </div>
        {!isTeacher && (
          <button className="btn btn-primary" onClick={() => setBatchModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Batch</span>
          </button>
        )}
      </div>

      {isTeacher && (
        <div className="teacher-scope-banner glass-card mb-4">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-emerald" />
            <div>
              <span className="font-semibold text-white text-sm">
                Assigned Faculty Batches ({visibleBatches.length}):
              </span>
              <span className="text-xs text-muted ml-2">
                {visibleBatches.length > 0 
                  ? visibleBatches.map(b => b.name).join(' • ')
                  : 'No batches assigned yet. Please ask Admin to assign your batches in Settings.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {visibleBatches.length === 0 && (
        <div className="glass-card p-6 text-center my-4">
          <Clock size={32} className="text-muted mb-2 mx-auto" />
          <h3 className="text-white font-semibold mb-1">No Batches to Display</h3>
          <p className="text-xs text-muted">
            {isTeacher 
              ? 'You currently do not have any batches assigned. Please contact Administrator to assign batches.' 
              : 'Click "Add New Batch" to configure class batches.'}
          </p>
        </div>
      )}

      {/* Batches Grid */}
      <div className="batches-grid">
        {visibleBatches.map((batch) => {
          const enrolledStudents = students.filter(s => {
            if (s.status !== 'ACTIVE') return false;
            if (Number(s.batchId) !== Number(batch.id)) return false;
            if (isTeacher) {
              const batchFullyAssigned = assignedBatchIds.includes(String(batch.id));
              if (!batchFullyAssigned) {
                return assignedStudentIds.includes(String(s.id));
              }
            }
            return true;
          });
          const percentFull = Math.round((enrolledStudents.length / (batch.capacity || 1)) * 100);

          // Classes represented in this batch
          const classesInBatch = [...new Set(enrolledStudents.map(s => {
            const c = classes.find(cls => cls.code === s.classCode);
            return c ? c.name : s.classCode;
          }))];

          return (
            <div key={batch.id} className="glass-card batch-card">
              <div className="batch-card-top">
                {classesInBatch.length > 0 ? (
                  <span className="badge badge-class" title={classesInBatch.join(', ')}>
                    {classesInBatch.length === 1 
                      ? classesInBatch[0] 
                      : `Mixed: ${classesInBatch.slice(0, 2).join(', ')}${classesInBatch.length > 2 ? ` +${classesInBatch.length - 2}` : ''}`}
                  </span>
                ) : (
                  <span className="badge badge-class">All Standards (Multi-Class)</span>
                )}
                {!isTeacher && (
                  <button 
                    className="btn-delete-mini"
                    title="Delete Batch"
                    onClick={() => handleDeleteBatch(batch.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <h2 className="batch-title">{batch.name}</h2>

              <div className="batch-meta-list">
                <div className="batch-meta-item">
                  <Clock size={15} className="text-primary" />
                  <span>{batch.timing}</span>
                </div>
                <div className="batch-meta-item">
                  <UserCheck size={15} className="text-emerald" />
                  <span>{batch.tutor}</span>
                </div>
                <div className="batch-meta-item">
                  <MapPin size={15} className="text-sky" />
                  <span>{batch.room}</span>
                </div>
              </div>

              <div className="capacity-section">
                <div className="capacity-header">
                  <span>{isTeacher ? 'Assigned Students' : 'Enrolled Seats'}</span>
                  <span className="font-semibold">{enrolledStudents.length} / {batch.capacity}</span>
                </div>
                <div className="capacity-track">
                  <div 
                    className="capacity-fill"
                    style={{ 
                      width: `${Math.min(percentFull, 100)}%`,
                      backgroundColor: percentFull >= 90 ? '#F43F5E' : percentFull >= 70 ? '#F59E0B' : '#10B981'
                    }}
                  />
                </div>
              </div>

              <div className="batch-actions-row">
                <button 
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() => setSelectedBatchForRoster({ batch, students: enrolledStudents })}
                >
                  <Users size={14} />
                  <span>Roster ({enrolledStudents.length})</span>
                </button>
                {!isTeacher && (
                  <button 
                    className="btn btn-secondary btn-sm flex-1 text-emerald"
                    onClick={() => handleOpenManageStudents(batch)}
                    title="Assign or change students in this batch by name"
                  >
                    <UserPlus size={14} />
                    <span>Assign Students</span>
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm flex-1"
                  onClick={() => {
                    if (onSelectBatchForAttendance) onSelectBatchForAttendance(String(batch.id));
                    setActiveTab('attendance');
                  }}
                >
                  <span>Roll Call</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Batch Modal */}
      {batchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create Class Batch Slot</h2>
              <button className="close-btn" onClick={() => setBatchModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="admission-form">
              <div className="form-group">
                <label className="form-label">Batch Name *</label>
                <input 
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Class 10 - Evening Batch A"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Grade / Standards Focus</label>
                  <select 
                    className="form-select"
                    value={newBatch.classCode}
                    onChange={(e) => setNewBatch({ ...newBatch, classCode: e.target.value })}
                  >
                    <option value="ALL">All Classes / Mixed Grades (Classes 1 to 10)</option>
                    <option value="PRIMARY">Primary Standards (Classes 1 to 5)</option>
                    <option value="HIGH_SCHOOL">High School Standards (Classes 6 to 10)</option>
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.name} Specific</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted mt-1">Students from any class can attend this batch.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Timing *</label>
                  <input 
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. 05:30 PM - 07:00 PM"
                    value={newBatch.timing}
                    onChange={(e) => setNewBatch({ ...newBatch, timing: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tutor / Teacher Name *</label>
                  <input 
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Mr. K. Sharma (Maths)"
                    value={newBatch.tutor}
                    onChange={(e) => setNewBatch({ ...newBatch, tutor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room / Hall</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hall 1 or Room 204"
                    value={newBatch.room}
                    onChange={(e) => setNewBatch({ ...newBatch, room: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Seat Capacity</label>
                <input 
                  type="number"
                  className="form-input"
                  value={newBatch.capacity}
                  onChange={(e) => setNewBatch({ ...newBatch, capacity: e.target.value })}
                />
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => setBatchModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Roster Modal */}
      {selectedBatchForRoster && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedBatchForRoster.batch.name}</h2>
                <div className="text-xs text-muted">{selectedBatchForRoster.batch.timing} • {selectedBatchForRoster.batch.tutor}</div>
              </div>
              <button className="close-btn" onClick={() => setSelectedBatchForRoster(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="roster-list mt-3">
              {selectedBatchForRoster.students.length === 0 ? (
                <div className="p-4 text-center text-muted">No students currently assigned to this batch.</div>
              ) : (
                selectedBatchForRoster.students.map((student, idx) => {
                  const sClass = classes.find(c => c.code === student.classCode);
                  return (
                    <div key={student.id} className="roster-item">
                      <span className="roster-idx font-mono text-muted">{idx + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{student.name}</span>
                          <span className="badge badge-class text-xs">{sClass?.name || student.classCode}</span>
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {student.school || 'School unspecified'}
                          {!isTeacher && ` • Parent: ${student.parentPhone}`}
                        </div>
                      </div>
                      <span className="font-mono text-xs badge badge-class">{student.admissionNo}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions-flex mt-4">
              {!isTeacher && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const b = selectedBatchForRoster.batch;
                    setSelectedBatchForRoster(null);
                    handleOpenManageStudents(b);
                  }}
                >
                  <UserPlus size={14} />
                  <span>Assign / Change Students by Name</span>
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedBatchForRoster(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Batch Students by Name Modal */}
      {manageStudentsBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald" />
                  <span>Assign Students to Batch</span>
                </h2>
                <div className="text-xs text-muted mt-0.5">
                  <strong>{manageStudentsBatch.name}</strong> ({manageStudentsBatch.timing}) • {selectedStudentIdsForBatch.length} enrolled
                </div>
              </div>
              <button className="close-btn" onClick={() => setManageStudentsBatch(null)}>
                <X size={20} />
              </button>
            </div>

            {batchSaveFeedback && (
              <div className="connection-alert alert-success my-2 py-1 px-3 text-xs">
                {batchSaveFeedback}
              </div>
            )}

            <p className="text-xs text-muted mb-2">
              Select students who will belong to this batch. In tuition centers, students can be in <strong>any class</strong>.
            </p>

            {/* Quick Actions & Filters */}
            <div className="batch-modal-filter-bar mb-3">
              <div className="search-input-box flex-1">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="Search student by name or roll..."
                  value={batchStudentSearchQuery}
                  onChange={(e) => setBatchStudentSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-select text-xs"
                style={{ width: '130px' }}
                value={batchStudentClassFilter}
                onChange={(e) => setBatchStudentClassFilter(e.target.value)}
              >
                <option value="ALL">All Classes</option>
                {classes.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => {
                  const filteredIds = filteredActiveStudents.map(s => s.id);
                  setSelectedStudentIdsForBatch(prev => {
                    const existingSet = new Set(prev.map(String));
                    const toAdd = filteredIds.filter(id => !existingSet.has(String(id)));
                    return [...prev, ...toAdd];
                  });
                }}
                title="Add all filtered students into this batch"
              >
                Select Filtered
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-xs text-rose-400"
                onClick={() => setSelectedStudentIdsForBatch([])}
                title="Clear all students from this batch"
              >
                Clear All
              </button>
            </div>

            {/* Scrollable Student Checklist */}
            <div className="batch-students-checklist">
              {filteredActiveStudents.map(student => {
                const isSelected = selectedStudentIdsForBatch.some(id => String(id) === String(student.id));
                const sClass = classes.find(c => c.code === student.classCode);
                const existingBatch = batches.find(b => Number(b.id) === Number(student.batchId));
                const isInAnotherBatch = existingBatch && Number(existingBatch.id) !== Number(manageStudentsBatch.id);

                return (
                  <div
                    key={student.id}
                    className={`batch-student-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleToggleBatchStudent(student.id)}
                    style={{ userSelect: 'none' }}
                  >
                    <div className="picker-checkbox-wrapper">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleBatchStudent(student.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="batch-native-checkbox"
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                      />
                    </div>
                    <div className="batch-avatar">{student.name.charAt(0)}</div>
                    <div className="batch-student-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{student.name}</span>
                        <span className="badge badge-class text-3xs">{sClass?.name || student.classCode}</span>
                        <span className="font-mono text-3xs text-muted">{student.admissionNo}</span>
                      </div>
                      <div className="text-3xs text-muted mt-0.5">
                        {student.school || 'School unspecified'}
                      </div>
                    </div>

                    <div className="batch-status-col">
                      {isSelected ? (
                        <span className="badge badge-success text-3xs">✓ In This Batch</span>
                      ) : isInAnotherBatch ? (
                        <span className="badge badge-warning text-3xs">In: {existingBatch.name}</span>
                      ) : (
                        <span className="text-muted text-3xs font-mono">No batch</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredActiveStudents.length === 0 && (
                <div className="text-center p-4 text-muted text-xs">
                  No active students matching "{batchStudentSearchQuery}".
                </div>
              )}
            </div>

            <div className="modal-actions-flex mt-4">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setManageStudentsBatch(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveBatchStudents}
              >
                <Check size={14} />
                <span>Save Batch Roster ({selectedStudentIdsForBatch.length} Students)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .batches-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .batches-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .batches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .batch-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .batch-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-delete-mini {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .btn-delete-mini:hover {
          color: var(--rose-500);
        }
        .batch-title {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .batch-meta-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .batch-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .capacity-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .capacity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .capacity-track {
          height: 6px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .capacity-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }
        .batch-actions-row {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
        .flex-1 { flex: 1; }
        .roster-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        .roster-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          font-size: 0.825rem;
        }

        .batch-modal-filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .batch-students-checklist {
          max-height: 280px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(0, 0, 0, 0.25);
          padding: 8px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .batch-student-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .batch-student-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .batch-student-row.is-selected {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
        }
        .batch-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-600), var(--secondary-600));
          color: white;
          font-weight: 700;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .batch-status-col {
          flex-shrink: 0;
        }
        .text-3xs {
          font-size: 0.625rem;
        }

        /* Mobile Responsive for Batches */
        @media (max-width: 768px) {
          .batches-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .batches-header .btn {
            width: 100%;
          }
          .batches-grid {
            grid-template-columns: 1fr !important;
            gap: 14px;
          }
          .batch-actions-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
