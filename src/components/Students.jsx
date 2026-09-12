import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  MessageSquare, 
  School, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Filter,
  X,
  IndianRupee,
  Award
} from 'lucide-react';
import { generateNextId } from '../lib/storage';


export default function Students({ 
  data, 
  onSaveData, 
  selectedClassFilter, 
  setSelectedClassFilter,
  admitModalOpen,
  setAdmitModalOpen 
}) {
  const { students = [], batches = [], classes = [], fees = [], exams = [], marks = [] } = data;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // New Student Form State
  const [formData, setFormData] = useState({
    name: '',
    admissionNo: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
    gender: 'Male',
    classCode: 'CLASS_10',
    batchId: '',
    school: '',
    parentName: '',
    parentPhone: '',
    monthlyFee: 1250,
    admissionDate: new Date().toISOString().split('T')[0],
    address: ''
  });

  // Handle Class change in Admission Form (auto-populate default fee)
  const handleFormClassChange = (e) => {
    const classCode = e.target.value;
    const matchedClass = classes.find(c => c.code === classCode);
    setFormData(prev => ({
      ...prev,
      classCode,
      monthlyFee: matchedClass ? matchedClass.defaultFee : prev.monthlyFee
    }));
  };

  // Submit Admission
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.parentPhone) {
      alert('Please fill in Student Name and Parent Phone number.');
      return;
    }

    if (editingStudent) {
      // Update
      const updatedStudents = students.map(s => 
        s.id === editingStudent.id 
          ? { ...s, ...formData, monthlyFee: Number(formData.monthlyFee), status: editingStudent.status || s.status || 'ACTIVE' }
          : s
      );
      onSaveData({ ...data, students: updatedStudents });
      setEditingStudent(null);
    } else {
      // Create new
      const newId = generateNextId(students);
      const newStudent = {
        id: newId,
        admissionNo: formData.admissionNo || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.name,
        gender: formData.gender,
        classCode: formData.classCode,
        batchId: formData.batchId ? Number(formData.batchId) : null,
        school: formData.school,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        monthlyFee: Number(formData.monthlyFee) || 1000,
        status: 'ACTIVE',
        admissionDate: formData.admissionDate || new Date().toISOString().split('T')[0]
      };

      // Also create current month fee record for this student
      const currentMonthYear = 'March 2026';
      const newFeeRecord = {
        id: generateNextId(fees),
        studentId: newId,
        monthYear: currentMonthYear,
        amountDue: newStudent.monthlyFee,
        amountPaid: 0,
        balance: newStudent.monthlyFee,
        status: 'PENDING',
        lastPaymentDate: null
      };


      onSaveData({
        ...data,
        students: [newStudent, ...students],
        fees: [...fees, newFeeRecord]
      });
    }

    // Reset
    setFormData({
      name: '',
      admissionNo: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      gender: 'Male',
      classCode: 'CLASS_10',
      batchId: '',
      school: '',
      parentName: '',
      parentPhone: '',
      monthlyFee: 1250,
      admissionDate: new Date().toISOString().split('T')[0],
      address: ''
    });
    setAdmitModalOpen(false);
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      admissionNo: student.admissionNo,
      gender: student.gender,
      classCode: student.classCode,
      batchId: student.batchId || '',
      school: student.school || '',
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      monthlyFee: student.monthlyFee,
      admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
      address: student.address || ''
    });
    setAdmitModalOpen(true);
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm('Are you sure you want to remove this student record?')) {
      const filtered = students.filter(s => s.id !== id);
      onSaveData({ ...data, students: filtered });
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    // 1. Class filter
    if (selectedClassFilter !== 'ALL') {
      if (selectedClassFilter === 'PRIMARY') {
        const primaryCodes = ['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5'];
        if (!primaryCodes.includes(student.classCode)) return false;
      } else if (selectedClassFilter === 'MIDDLE') {
        const middleCodes = ['CLASS_6', 'CLASS_7', 'CLASS_8'];
        if (!middleCodes.includes(student.classCode)) return false;
      } else if (selectedClassFilter === 'HIGH') {
        const highCodes = ['CLASS_9', 'CLASS_10'];
        if (!highCodes.includes(student.classCode)) return false;
      } else if (student.classCode !== selectedClassFilter) {
        return false;
      }
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = student.name.toLowerCase().includes(q);
      const matchRoll = student.admissionNo.toLowerCase().includes(q);
      const matchParent = student.parentName.toLowerCase().includes(q);
      const matchPhone = student.parentPhone.includes(q);
      const matchSchool = (student.school || '').toLowerCase().includes(q);
      return matchName || matchRoll || matchParent || matchPhone || matchSchool;
    }

    return true;
  });

  return (
    <div className="students-container">
      {/* Top Controls Header */}
      <div className="students-header">
        <div>
          <h1 className="page-title">Students Directory</h1>
          <p className="page-subtitle">Managing enrollments and admissions for Classes 1 to 10</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingStudent(null);
            setFormData({
              name: '',
              admissionNo: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
              gender: 'Male',
              classCode: 'CLASS_10',
              batchId: '',
              school: '',
              parentName: '',
              parentPhone: '',
              monthlyFee: 1250,
              address: ''
            });
            setAdmitModalOpen(true);
          }}
        >
          <UserPlus size={16} />
          <span>Admit New Student</span>
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="glass-card filters-card">
        <div className="filters-flex">
          {/* Class Category Pills */}
          <div className="category-pills">
            <button 
              className={`pill-btn ${selectedClassFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedClassFilter('ALL')}
            >
              All Classes ({students.length})
            </button>
            <button 
              className={`pill-btn ${selectedClassFilter === 'PRIMARY' ? 'active' : ''}`}
              onClick={() => setSelectedClassFilter('PRIMARY')}
            >
              Primary (1–5)
            </button>
            <button 
              className={`pill-btn ${selectedClassFilter === 'MIDDLE' ? 'active' : ''}`}
              onClick={() => setSelectedClassFilter('MIDDLE')}
            >
              Middle (6–8)
            </button>
            <button 
              className={`pill-btn ${selectedClassFilter === 'HIGH' ? 'active' : ''}`}
              onClick={() => setSelectedClassFilter('HIGH')}
            >
              High School (9–10)
            </button>
          </div>

          {/* Specific Class Dropdown Selector */}
          <div className="specific-class-select">
            <select 
              className="form-select select-class-sm"
              value={selectedClassFilter.startsWith('CLASS_') ? selectedClassFilter : ''}
              onChange={(e) => setSelectedClassFilter(e.target.value || 'ALL')}
            >
              <option value="">Specific Standard (1 to 10)...</option>
              {classes.map(cls => (
                <option key={cls.code} value={cls.code}>{cls.name}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text"
              placeholder="Search by student, roll no, parent phone, or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Adm. No</th>
              <th>Student Name</th>
              <th>Class / Standard</th>
              <th>Batch & Timing</th>
              <th>Parent & Contact</th>
              <th>School</th>
              <th>Monthly Fee</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No students found matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const assignedBatch = batches.find(b => b.id === student.batchId);
                const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
                const whatsappUrl = `https://wa.me/91${student.parentPhone}?text=Dear%20Sir%2FMam,%20this%20is%20from%20HAYAGRIVA%20TUTORIALS%20regarding%20${encodeURIComponent(student.name)}.`;

                return (
                  <tr key={student.id}>
                    <td>
                      <span className="font-mono text-xs text-muted">{student.admissionNo}</span>
                    </td>
                    <td>
                      <div className="student-name-cell">
                        <div className="avatar-circle">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="student-name-text">{student.name}</div>
                          <span className="text-xs text-muted">{student.gender}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-class">{className}</span>
                    </td>
                    <td>
                      {assignedBatch ? (
                        <div>
                          <div className="text-xs font-semibold">{assignedBatch.name}</div>
                          <div className="text-xs text-muted">{assignedBatch.timing}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <div className="text-xs font-semibold">{student.parentName}</div>
                        <div className="contact-links-flex">
                          <a href={`tel:${student.parentPhone}`} className="contact-icon-link" title="Call Parent">
                            <Phone size={12} />
                            <span>{student.parentPhone}</span>
                          </a>
                          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="contact-icon-link whatsapp-link" title="WhatsApp Parent">
                            <MessageSquare size={12} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-secondary">{student.school || '—'}</span>
                    </td>
                    <td>
                      <span className="text-emerald font-semibold text-xs">
                        ₹{student.monthlyFee}/mo
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">{student.status}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-flex">
                        <button 
                          className="btn-icon" 
                          title="View Profile & Ledger"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Edit Student"
                          onClick={() => handleEditClick(student)}
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          className="btn-icon btn-icon-danger" 
                          title="Delete Student"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Admission / Edit Modal */}
      {admitModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStudent ? 'Edit Student Details' : 'Student Admission (Class 1 to 10)'}
              </h2>
              <button className="close-btn" onClick={() => setAdmitModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="admission-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Admission / Roll No</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.admissionNo}
                    onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Standard / Class *</label>
                  <select 
                    className="form-select" 
                    value={formData.classCode}
                    onChange={handleFormClassChange}
                  >
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.name} ({cls.category})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Slot</label>
                  <select 
                    className="form-select" 
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  >
                    <option value="">Select a batch...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.timing})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Regular School Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. St. Joseph's / DPS"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Parent / Guardian Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Father / Mother name"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone (WhatsApp) *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    required 
                    placeholder="10-digit mobile number"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Monthly Tuition Fee (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admission / Joining Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  />
                  <span className="text-xs text-secondary mt-1">
                    🗓️ <strong>Fee Cycle:</strong> Due on {formData.admissionDate ? new Date(formData.admissionDate).getDate() : 1}th of every month
                  </span>
                </div>
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => setAdmitModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail & Profile Modal */}
      {selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <div className="modal-header">
              <h2 className="modal-title">Student Profile & Ledger</h2>
              <button className="close-btn" onClick={() => setSelectedStudent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="student-profile-header">
              <div className="avatar-circle-lg">{selectedStudent.name.charAt(0)}</div>
              <div>
                <h3 className="profile-student-name">{selectedStudent.name}</h3>
                <div className="profile-meta-tags">
                  <span className="badge badge-class">
                    {classes.find(c => c.code === selectedStudent.classCode)?.name}
                  </span>
                  <span className="text-muted text-xs font-mono">{selectedStudent.admissionNo}</span>
                  <span className="badge badge-success">{selectedStudent.status}</span>
                </div>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="profile-field">
                <span className="field-title">Parent / Guardian:</span>
                <span className="field-val">{selectedStudent.parentName}</span>
              </div>
              <div className="profile-field">
                <span className="field-title">Contact Number:</span>
                <span className="field-val">{selectedStudent.parentPhone}</span>
              </div>
              <div className="profile-field">
                <span className="field-title">School Name:</span>
                <span className="field-val">{selectedStudent.school || 'Not specified'}</span>
              </div>
              <div className="profile-field">
                <span className="field-title">Agreed Monthly Fee:</span>
                <span className="field-val text-emerald font-bold">₹{selectedStudent.monthlyFee}/month</span>
              </div>
            </div>

            {/* Fee History for this Student */}
            <div className="profile-section-title mt-4">
              <IndianRupee size={15} />
              <span>Tuition Fee Records</span>
            </div>
            <div className="mini-ledger-table">
              {fees.filter(f => f.studentId === selectedStudent.id).map(fee => (
                <div key={fee.id} className="ledger-row">
                  <div>
                    <span className="font-semibold">{fee.monthYear}</span>
                    <div className="text-xs text-muted">Status: {fee.status}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-semibold text-emerald">Paid: ₹{fee.amountPaid}</div>
                    {fee.balance > 0 && (
                      <div className="text-xs text-danger">Due: ₹{fee.balance}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Academic Performance */}
            <div className="profile-section-title mt-4">
              <Award size={15} />
              <span>Exam Test Marks</span>
            </div>
            <div className="mini-ledger-table">
              {marks.filter(m => m.studentId === selectedStudent.id).map(mark => {
                const exam = exams.find(e => e.id === mark.examId);
                return (
                  <div key={mark.id} className="ledger-row">
                    <div>
                      <span className="font-semibold">{exam?.title || 'Class Test'}</span>
                      <div className="text-xs text-muted">{exam?.subject} ({exam?.date})</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-class">{mark.marksObtained} / {exam?.totalMarks}</span>
                    </div>
                  </div>
                );
              })}
              {marks.filter(m => m.studentId === selectedStudent.id).length === 0 && (
                <div className="text-xs text-muted p-2">No exam marks entered yet.</div>
              )}
            </div>

            <div className="modal-actions-flex mt-4">
              <button className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .students-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .students-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .page-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .filters-card {
          padding: 16px;
        }
        .filters-flex {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .category-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: var(--radius-md);
        }
        .pill-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 0.8125rem;
          font-weight: 600;
          font-family: var(--font-body);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pill-btn:hover {
          color: var(--text-primary);
        }
        .pill-btn.active {
          background: var(--primary-600);
          color: white;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
        }
        .select-class-sm {
          width: auto;
          min-width: 180px;
        }
        .search-box-wrapper {
          flex: 1;
          min-width: 250px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }
        .search-input {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 34px 8px 36px;
          color: var(--text-primary);
          font-size: 0.84rem;
          outline: none;
        }
        .search-input:focus {
          border-color: var(--primary-500);
        }
        .clear-search {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .student-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-600) 0%, #818CF8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .avatar-circle-lg {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-600) 0%, #818CF8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          font-size: 1.25rem;
        }
        .student-name-text {
          font-weight: 600;
        }
        .contact-links-flex {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .contact-icon-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.725rem;
        }
        .contact-icon-link:hover {
          color: var(--text-primary);
        }
        .whatsapp-link {
          color: #34D399;
        }
        .action-buttons-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-icon:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .btn-icon-danger:hover {
          color: var(--rose-500);
          background: rgba(244, 63, 94, 0.12);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .close-btn:hover { color: white; }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr; }
        }
        .modal-actions-flex {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .student-profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 16px;
        }
        .profile-student-name {
          font-size: 1.25rem;
          margin-bottom: 4px;
        }
        .profile-meta-tags {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .profile-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: var(--bg-subtle);
          padding: 14px;
          border-radius: var(--radius-md);
        }
        .profile-field {
          display: flex;
          flex-direction: column;
        }
        .field-title {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .field-val {
          font-size: 0.85rem;
          font-weight: 600;
        }
        .profile-section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .mini-ledger-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 180px;
          overflow-y: auto;
        }
        .ledger-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          font-size: 0.8125rem;
        }

        /* Mobile Responsive for Students */
        @media (max-width: 768px) {
          .students-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .students-header .btn {
            width: 100%;
          }
          .filters-card {
            padding: 12px 10px;
          }
          .filters-flex {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .category-pills {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .select-class-sm {
            width: 100%;
            min-width: 100%;
          }
          .search-box-wrapper {
            width: 100%;
            min-width: 100%;
          }
          .profile-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
