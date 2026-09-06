import React, { useState } from 'react';
import { Clock, Plus, Users, UserCheck, MapPin, X, BookOpen, Trash2 } from 'lucide-react';

export default function Batches({ data, onSaveData, setActiveTab, setSelectedClassFilter }) {
  const { batches = [], students = [], classes = [] } = data;

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedBatchForRoster, setSelectedBatchForRoster] = useState(null);

  const [newBatch, setNewBatch] = useState({
    name: '',
    classCode: 'CLASS_10',
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
      id: Date.now(),
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
      classCode: 'CLASS_10',
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

  return (
    <div className="batches-page">
      <div className="batches-header">
        <div>
          <h1 className="page-title">Batches & Daily Timetable</h1>
          <p className="page-subtitle">Class schedules, tutor assignments, and seat capacities for Classes 1 to 10</p>
        </div>
        <button className="btn btn-primary" onClick={() => setBatchModalOpen(true)}>
          <Plus size={16} />
          <span>Add New Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      <div className="batches-grid">
        {batches.map((batch) => {
          const enrolledStudents = students.filter(s => s.batchId === batch.id && s.status === 'ACTIVE');
          const percentFull = Math.round((enrolledStudents.length / (batch.capacity || 1)) * 100);
          const className = classes.find(c => c.code === batch.classCode)?.name || batch.classCode;

          return (
            <div key={batch.id} className="glass-card batch-card">
              <div className="batch-card-top">
                <span className="badge badge-class">{className}</span>
                <button 
                  className="btn-delete-mini"
                  title="Delete Batch"
                  onClick={() => handleDeleteBatch(batch.id)}
                >
                  <Trash2 size={14} />
                </button>
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
                  <span>Enrolled Seats</span>
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
                <button 
                  className="btn btn-primary btn-sm flex-1"
                  onClick={() => {
                    setSelectedClassFilter(batch.classCode);
                    setActiveTab('attendance');
                  }}
                >
                  <span>Take Roll Call</span>
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
                  <label className="form-label">Associated Standard (1–10)</label>
                  <select 
                    className="form-select"
                    value={newBatch.classCode}
                    onChange={(e) => setNewBatch({ ...newBatch, classCode: e.target.value })}
                  >
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.name}</option>
                    ))}
                  </select>
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
                selectedBatchForRoster.students.map((student, idx) => (
                  <div key={student.id} className="roster-item">
                    <span className="roster-idx font-mono text-muted">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-xs text-muted">{student.school || 'School unspecified'} • Parent: {student.parentPhone}</div>
                    </div>
                    <span className="font-mono text-xs badge badge-class">{student.admissionNo}</span>
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions-flex mt-4">
              <button className="btn btn-secondary" onClick={() => setSelectedBatchForRoster(null)}>
                Close
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
      `}</style>
    </div>
  );
}
