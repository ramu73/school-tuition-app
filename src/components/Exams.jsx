import React, { useState } from 'react';
import { Award, Plus, FileText, CheckCircle2, User, X, Check, BookOpen } from 'lucide-react';
import { generateNextId } from '../lib/storage';


export default function Exams({ data, currentUser, onSaveData }) {
  const { exams = [], marks = [], students = [], classes = [], batches = [] } = data;
  const isTeacher = currentUser?.role === 'TEACHER';
  const assignedBatchIds = Array.isArray(currentUser?.assignedBatchIds) 
    ? currentUser.assignedBatchIds.map(String) 
    : [];
  const assignedStudentIds = Array.isArray(currentUser?.assignedStudentIds) 
    ? currentUser.assignedStudentIds.map(String) 
    : [];

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

  // Derive classes from students who are actually in the teacher's assigned batches
  const accessibleClassCodes = new Set(accessibleStudents.map(s => s.classCode));
  const accessibleClasses = isTeacher && accessibleClassCodes.size > 0
    ? classes.filter(c => accessibleClassCodes.has(c.code))
    : classes;

  const [selectedClass, setSelectedClass] = useState(accessibleClasses[0]?.code || 'CLASS_10');
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
  const [newExamModalOpen, setNewExamModalOpen] = useState(false);
  const [reportCardStudent, setReportCardStudent] = useState(null);

  // New Exam Form
  const [newExamData, setNewExamData] = useState({
    title: '',
    classCode: accessibleClasses[0]?.code || 'CLASS_10',
    subject: 'Mathematics',
    totalMarks: 50,
    passingMarks: 18,
    date: new Date().toISOString().split('T')[0]
  });

  // Filter exams by class
  const classExams = exams.filter(e => e.classCode === selectedClass);
  const currentExam = exams.find(e => e.id === Number(selectedExamId)) || classExams[0];

  // Eligible students for the current exam's class (scoped to teacher batches if teacher)
  const examStudents = currentExam 
    ? accessibleStudents.filter(s => s.classCode === currentExam.classCode && s.status === 'ACTIVE')
    : [];

  const handleCreateExam = (e) => {
    e.preventDefault();
    if (!newExamData.title) {
      alert('Please enter Test / Exam Title.');
      return;
    }

    const createdId = generateNextId(exams);
    const createdExam = {
      id: createdId,
      title: newExamData.title,
      classCode: newExamData.classCode,
      subject: newExamData.subject,
      totalMarks: Number(newExamData.totalMarks) || 50,
      passingMarks: Number(newExamData.passingMarks) || 18,
      date: newExamData.date
    };

    onSaveData({
      ...data,
      exams: [createdExam, ...exams]
    });

    setSelectedClass(newExamData.classCode);
    setSelectedExamId(createdId);
    setNewExamModalOpen(false);
    setNewExamData({
      title: '',
      classCode: 'CLASS_10',
      subject: 'Mathematics',
      totalMarks: 50,
      passingMarks: 18,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Update marks for a student
  const handleMarkChange = (studentId, marksObtained) => {
    if (!currentExam) return;

    const existingIndex = marks.findIndex(m => m.examId === currentExam.id && m.studentId === studentId);
    let updatedMarks = [...marks];

    const val = marksObtained === '' ? 0 : Math.min(Number(marksObtained), currentExam.totalMarks);

    if (existingIndex >= 0) {
      updatedMarks[existingIndex] = {
        ...updatedMarks[existingIndex],
        marksObtained: val
      };
    } else {
      updatedMarks.push({
        id: generateNextId(updatedMarks),
        examId: currentExam.id,
        studentId,
        marksObtained: val,
        remarks: val >= currentExam.passingMarks ? 'Passed' : 'Needs improvement'
      });
    }


    onSaveData({
      ...data,
      marks: updatedMarks
    });
  };

  // Grade calculator helper
  const getGrade = (obtained, total) => {
    const pct = (obtained / total) * 100;
    if (pct >= 90) return { grade: 'A+', color: '#34D399' };
    if (pct >= 80) return { grade: 'A', color: '#10B981' };
    if (pct >= 70) return { grade: 'B+', color: '#38BDF8' };
    if (pct >= 60) return { grade: 'B', color: '#FBBF24' };
    if (pct >= 40) return { grade: 'C', color: '#FB923C' };
    return { grade: 'F', color: '#FB7185' };
  };

  return (
    <div className="exams-page">
      <div className="exams-header">
        <div>
          <h1 className="page-title">Tests & Academic Performance</h1>
          <p className="page-subtitle">Weekly slip tests, unit exams, and progress scorecards for Classes 1 to 10</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewExamModalOpen(true)}>
          <Plus size={16} />
          <span>Create New Test</span>
        </button>
      </div>

      {isTeacher && (
        <div className="teacher-scope-banner glass-card mb-3" style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex items-center gap-2">
            <Award size={16} className="text-emerald" />
            <span className="font-semibold text-white text-xs">
              Faculty Scoped Marks Entry:
            </span>
            <span className="text-xs text-muted">
              {accessibleBatches.length > 0
                ? `Showing students from your ${accessibleBatches.length} assigned batches (${examStudents.length} students in this standard).`
                : 'No batches assigned to your account yet.'}
            </span>
          </div>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="glass-card exam-selectors-card">
        <div className="exam-selectors-grid">
          <div className="form-group mb-0">
            <label className="form-label">Standard (Class 1 to 10)</label>
            <select 
              className="form-select"
              value={selectedClass}
              onChange={(e) => {
                const cls = e.target.value;
                setSelectedClass(cls);
                const firstExam = exams.find(ex => ex.classCode === cls);
                if (firstExam) setSelectedExamId(firstExam.id);
              }}
            >
              {accessibleClasses.map(cls => (
                <option key={cls.code} value={cls.code}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Select Test / Exam</label>
            <select 
              className="form-select"
              value={currentExam?.id || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {classExams.length === 0 ? (
                <option value="">No tests created yet for this class</option>
              ) : (
                classExams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} - {ex.subject} ({ex.date})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentExam && (
            <div className="exam-meta-pill-box">
              <div className="exam-meta-tag">
                <BookOpen size={14} />
                <span>{currentExam.subject}</span>
              </div>
              <div className="exam-meta-tag">
                <span>Max Marks: <strong>{currentExam.totalMarks}</strong></span>
              </div>
              <div className="exam-meta-tag">
                <span>Pass: <strong>{currentExam.passingMarks}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marks Entry Table */}
      {currentExam ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>School</th>
                <th style={{ width: '180px' }}>Marks Obtained (/{currentExam.totalMarks})</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th style={{ textAlign: 'center' }}>Report Card</th>
              </tr>
            </thead>
            <tbody>
              {examStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No students currently enrolled in {classes.find(c => c.code === currentExam.classCode)?.name}.
                  </td>
                </tr>
              ) : (
                examStudents.map(student => {
                  const markRecord = marks.find(m => m.examId === currentExam.id && m.studentId === student.id);
                  const marksVal = markRecord ? markRecord.marksObtained : '';
                  const hasMarks = markRecord !== undefined && markRecord.marksObtained !== null;
                  const pct = hasMarks ? Math.round((Number(marksVal) / currentExam.totalMarks) * 100) : null;
                  const gradeInfo = hasMarks ? getGrade(Number(marksVal), currentExam.totalMarks) : null;

                  return (
                    <tr key={student.id}>
                      <td className="font-mono text-xs text-muted">{student.admissionNo}</td>
                      <td>
                        <div className="font-semibold">{student.name}</div>
                      </td>
                      <td className="text-xs text-secondary">{student.school || '—'}</td>
                      <td>
                        <input 
                          type="number"
                          className="form-input mark-input-cell"
                          min="0"
                          max={currentExam.totalMarks}
                          placeholder="Marks..."
                          value={marksVal}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        />
                      </td>
                      <td>
                        {pct !== null ? (
                          <span className="font-bold">{pct}%</span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {gradeInfo ? (
                          <span 
                            className="badge" 
                            style={{ 
                              background: `${gradeInfo.color}20`, 
                              color: gradeInfo.color,
                              borderColor: `${gradeInfo.color}40`
                            }}
                          >
                            Grade {gradeInfo.grade}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">Unmarked</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => setReportCardStudent({ student, exam: currentExam, mark: markRecord })}
                          disabled={!hasMarks}
                        >
                          <FileText size={13} />
                          <span>Scorecard</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card empty-exam-card">
          <Award size={40} className="text-muted mb-2" />
          <h3>No Test Selected</h3>
          <p className="text-muted text-xs">Click "Create New Test" above to schedule an exam for this class.</p>
        </div>
      )}

      {/* Create Exam Modal */}
      {newExamModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Schedule New Test / Exam</h2>
              <button className="close-btn" onClick={() => setNewExamModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="admission-form">
              <div className="form-group">
                <label className="form-label">Test Title *</label>
                <input 
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Unit Test 2 - Quadratic Equations"
                  value={newExamData.title}
                  onChange={(e) => setNewExamData({ ...newExamData, title: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Standard (Class 1 to 10) *</label>
                  <select 
                    className="form-select"
                    value={newExamData.classCode}
                    onChange={(e) => setNewExamData({ ...newExamData, classCode: e.target.value })}
                  >
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input 
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Mathematics / Science / English"
                    value={newExamData.subject}
                    onChange={(e) => setNewExamData({ ...newExamData, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Total Maximum Marks</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={newExamData.totalMarks}
                    onChange={(e) => setNewExamData({ ...newExamData, totalMarks: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={newExamData.passingMarks}
                    onChange={(e) => setNewExamData({ ...newExamData, passingMarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={newExamData.date}
                  onChange={(e) => setNewExamData({ ...newExamData, date: e.target.value })}
                />
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => setNewExamModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Performance Scorecard Modal */}
      {reportCardStudent && (
        <div className="modal-overlay">
          <div className="modal-content report-card-modal">
            <div className="modal-header">
              <span className="badge badge-class">Academic Scorecard</span>
              <button className="close-btn" onClick={() => setReportCardStudent(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="scorecard-paper">
              <div className="scorecard-banner">
                <h3 className="scorecard-inst">HAYAGRIVA TUTORIALS</h3>
                <div className="scorecard-sub">Student Performance Assessment Report</div>
              </div>

              <div className="scorecard-details">
                <div><strong>Student Name:</strong> {reportCardStudent.student.name}</div>
                <div><strong>Roll No:</strong> {reportCardStudent.student.admissionNo}</div>
                <div><strong>Standard:</strong> {classes.find(c => c.code === reportCardStudent.student.classCode)?.name}</div>
                <div><strong>School:</strong> {reportCardStudent.student.school || 'Unspecified'}</div>
              </div>

              <div className="scorecard-marks-highlight">
                <div className="score-circle">
                  <div className="score-num">{reportCardStudent.mark?.marksObtained || 0}</div>
                  <div className="score-denom">/ {reportCardStudent.exam.totalMarks}</div>
                </div>
                <div className="score-summary">
                  <div className="font-bold text-lg">{reportCardStudent.exam.title}</div>
                  <div className="text-xs text-muted">Subject: {reportCardStudent.exam.subject} ({reportCardStudent.exam.date})</div>
                  <div className="mt-2">
                    {getGrade(reportCardStudent.mark?.marksObtained || 0, reportCardStudent.exam.totalMarks).grade && (
                      <span className="badge badge-success">
                        Grade {getGrade(reportCardStudent.mark?.marksObtained || 0, reportCardStudent.exam.totalMarks).grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="scorecard-teacher-remarks">
                <strong>Tutor Remarks:</strong> {reportCardStudent.mark?.remarks || 'Good effort. Keep practicing regularly.'}
              </div>
            </div>

            <div className="modal-actions-flex mt-4">
              <button className="btn btn-primary" onClick={() => window.print()}>
                Print Scorecard
              </button>
              <button className="btn btn-secondary" onClick={() => setReportCardStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .exams-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .exams-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .exam-selectors-card {
          padding: 16px;
        }
        .exam-selectors-grid {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .exam-meta-pill-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
        }
        .exam-meta-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .mark-input-cell {
          width: 90px;
          padding: 6px 10px;
          text-align: center;
          font-weight: 700;
        }
        .empty-exam-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        /* Scorecard styling */
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
        .scorecard-sub {
          font-size: 0.775rem;
          color: #475569;
        }
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
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: #4f46e5;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .score-num {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1;
        }
        .score-denom {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        .scorecard-teacher-remarks {
          padding: 12px;
          background: #f8fafc;
          border-left: 3px solid #4f46e5;
          font-size: 0.8125rem;
          color: #334155;
        }

        /* Mobile Responsive for Exams */
        @media (max-width: 768px) {
          .exams-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .exams-header .btn {
            width: 100%;
          }
          .exam-controls-flex {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .exam-select-box, .select-class-sm {
            width: 100%;
            min-width: 100%;
          }
          .scorecard-details {
            grid-template-columns: 1fr;
          }
          .scorecard-marks-highlight {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
