import React, { useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { 
  Award, 
  Plus, 
  FileText, 
  CheckCircle2, 
  User, 
  X, 
  Check, 
  BookOpen, 
  Edit, 
  Trash2, 
  MessageSquare, 
  AlertTriangle,
  Printer,
  Sparkles,
  Download,
  Copy,
  Share2,
  CheckCircle
} from 'lucide-react';
import { generateNextId } from '../lib/storage';
import { logger } from '../lib/logger';

export default function Exams({ data, currentUser, onSaveData, initialClassFilter }) {
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

  // Determine initial selected class:
  // 1. If parent passed a filter (e.g. from Dashboard or Students tab)
  // 2. Otherwise class with existing exams
  // 3. Otherwise first accessible class
  const initialClassCode = (initialClassFilter && accessibleClasses.some(c => c.code === initialClassFilter))
    ? initialClassFilter
    : (exams.find(e => accessibleClasses.some(c => c.code === e.classCode))?.classCode 
       || accessibleClasses[0]?.code 
       || 'CLASS_10');

  const [selectedClass, setSelectedClass] = useState(initialClassCode);
  const [selectedExamId, setSelectedExamId] = useState(() => {
    const firstExamForClass = exams.find(e => e.classCode === initialClassCode);
    return firstExamForClass ? firstExamForClass.id : '';
  });
  const [newExamModalOpen, setNewExamModalOpen] = useState(false);
  const [editExamModalOpen, setEditExamModalOpen] = useState(false);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState(null);
  const [reportCardStudent, setReportCardStudent] = useState(null);
  const [examErrors, setExamErrors] = useState({});
  const [isSharingCard, setIsSharingCard] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  // New Exam Form
  const [newExamData, setNewExamData] = useState({
    title: '',
    classCode: initialClassCode,
    subject: 'Mathematics',
    totalMarks: 50,
    passingMarks: 18,
    date: new Date().toISOString().split('T')[0]
  });

  // Edit Exam Form
  const [editExamData, setEditExamData] = useState(null);

  // Filter exams strictly by the selected class!
  const classExams = exams.filter(e => e.classCode === selectedClass);
  // Guarantee currentExam belongs to the selected class only (never leak across classes!)
  const currentExam = classExams.find(e => e.id === Number(selectedExamId)) || classExams[0] || null;

  // Keep selectedExamId strictly synchronized with the selected class exams
  useEffect(() => {
    if (classExams.length > 0) {
      const exists = classExams.some(e => e.id === Number(selectedExamId));
      if (!exists) {
        setSelectedExamId(classExams[0].id);
      }
    } else {
      setSelectedExamId('');
    }
  }, [selectedClass, exams]);

  // Helper to get normalized subjects available for any class
  const getSubjectsForClass = useCallback((classCode) => {
    const classObj = classes.find(c => c.code === classCode);
    const raw = classObj?.subjects && classObj.subjects.length > 0
      ? classObj.subjects
      : ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General Science', 'Social Studies', 'English', 'Telugu', 'Hindi', 'Computer'];

    const list = [];
    raw.forEach(s => {
      if (s === 'Telugu / Hindi' || s === 'Language II') {
        list.push('Telugu', 'Hindi');
      } else {
        list.push(s);
      }
    });

    ['Telugu', 'Hindi', 'Computer'].forEach(s => {
      if (!list.includes(s)) list.push(s);
    });

    return Array.from(new Set(list));
  }, [classes]);

  // Subjects available for current test / selected class
  const availableClassSubjects = useMemo(() => {
    return getSubjectsForClass(currentExam?.classCode || selectedClass);
  }, [getSubjectsForClass, currentExam?.classCode, selectedClass]);

  // Eligible students for the current exam's class (scoped to teacher batches if teacher)
  const examStudents = currentExam 
    ? accessibleStudents.filter(s => s.classCode === currentExam.classCode && s.status === 'ACTIVE')
    : [];

  const handleCreateExam = (e) => {
    e.preventDefault();
    const errors = {};

    if (!newExamData.title || newExamData.title.trim().length < 3) {
      errors.title = 'Test title must be at least 3 characters.';
    }
    if (!newExamData.subject || newExamData.subject.trim().length < 2) {
      errors.subject = 'Subject name must be at least 2 characters.';
    }
    const tot = Number(newExamData.totalMarks);
    if (isNaN(tot) || tot <= 0 || tot > 500) {
      errors.totalMarks = 'Total marks must be a positive number between 1 and 500.';
    }
    const pass = Number(newExamData.passingMarks);
    if (isNaN(pass) || pass < 0 || pass > tot) {
      errors.passingMarks = `Passing marks must be between 0 and total marks (${tot || 50}).`;
    }
    if (!newExamData.date) {
      errors.date = 'Please select a valid exam date.';
    }

    if (Object.keys(errors).length > 0) {
      setExamErrors(errors);
      logger.warn(logger.CATEGORIES.VALIDATION, 'Exam creation validation failed', { errors, examTitle: newExamData.title });
      return;
    }

    const createdId = generateNextId(exams);
    const createdExam = {
      id: createdId,
      title: newExamData.title.trim(),
      classCode: newExamData.classCode,
      subject: newExamData.subject.trim(),
      totalMarks: tot || 50,
      passingMarks: pass || 18,
      date: newExamData.date
    };

    onSaveData({
      ...data,
      exams: [createdExam, ...exams]
    });

    logger.action(currentUser, 'CREATE_EXAM', `Scheduled test "${createdExam.title}" for ${createdExam.classCode} (${createdExam.totalMarks} marks)`, {
      examId: createdId,
      subject: createdExam.subject,
      classCode: createdExam.classCode
    });

    setSelectedClass(newExamData.classCode);
    setSelectedExamId(createdId);
    setNewExamModalOpen(false);
    setExamErrors({});
    setNewExamData({
      title: '',
      classCode: 'CLASS_10',
      subject: 'Mathematics',
      totalMarks: 50,
      passingMarks: 18,
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Open Edit Exam Modal
  const handleOpenEditExam = (exam) => {
    if (!exam) return;
    setEditExamData({
      id: exam.id,
      title: exam.title || '',
      classCode: exam.classCode || selectedClass,
      subject: exam.subject || 'Mathematics',
      totalMarks: exam.totalMarks || 50,
      passingMarks: exam.passingMarks || 18,
      date: exam.date || new Date().toISOString().split('T')[0]
    });
    setExamErrors({});
    setEditExamModalOpen(true);
  };

  // Save Edited Exam
  const handleSaveEditExam = (e) => {
    e.preventDefault();
    if (!editExamData) return;

    const errors = {};
    if (!editExamData.title || editExamData.title.trim().length < 3) {
      errors.title = 'Test title must be at least 3 characters.';
    }
    if (!editExamData.subject || editExamData.subject.trim().length < 2) {
      errors.subject = 'Subject name must be at least 2 characters.';
    }
    const tot = Number(editExamData.totalMarks);
    if (isNaN(tot) || tot <= 0 || tot > 500) {
      errors.totalMarks = 'Total marks must be a positive number between 1 and 500.';
    }
    const pass = Number(editExamData.passingMarks);
    if (isNaN(pass) || pass < 0 || pass > tot) {
      errors.passingMarks = `Passing marks must be between 0 and total marks (${tot || 50}).`;
    }
    if (!editExamData.date) {
      errors.date = 'Please select a valid exam date.';
    }

    if (Object.keys(errors).length > 0) {
      setExamErrors(errors);
      return;
    }

    const oldExam = exams.find(ex => ex.id === editExamData.id);
    const oldSubject = oldExam?.subject;
    const newSubject = editExamData.subject.trim();

    const updatedExams = exams.map(ex => {
      if (ex.id === editExamData.id) {
        return {
          ...ex,
          title: editExamData.title.trim(),
          classCode: editExamData.classCode,
          subject: newSubject,
          totalMarks: tot,
          passingMarks: pass,
          date: editExamData.date
        };
      }
      return ex;
    });

    // Also update existing marks for this exam if they used the old default subject or had no subject
    const updatedMarks = marks.map(m => {
      if (m.examId === editExamData.id) {
        if (!m.subject || m.subject === oldSubject) {
          return { ...m, subject: newSubject };
        }
      }
      return m;
    });

    onSaveData({
      ...data,
      exams: updatedExams,
      marks: updatedMarks
    });

    logger.action(currentUser, 'EDIT_EXAM', `Updated test "${editExamData.title}" details`, { examId: editExamData.id });
    setEditExamModalOpen(false);
    setEditExamData(null);
    setExamErrors({});
  };

  // Delete Exam with Confirmation
  const handleDeleteExam = (examToDelete) => {
    if (!examToDelete) return;
    const remainingExams = exams.filter(e => e.id !== examToDelete.id);
    const remainingMarks = marks.filter(m => m.examId !== examToDelete.id);

    onSaveData({
      ...data,
      exams: remainingExams,
      marks: remainingMarks
    });

    logger.action(currentUser, 'DELETE_EXAM', `Deleted test "${examToDelete.title}" and its score records`, { examId: examToDelete.id });

    // Switch selection to remaining test in same class
    const nextExam = remainingExams.find(e => e.classCode === selectedClass);
    setSelectedExamId(nextExam ? nextExam.id : '');
    setDeleteConfirmExam(null);
  };

  // Update marks for a student
  const handleMarkChange = (studentId, marksObtained) => {
    if (!currentExam) return;

    const existingIndex = marks.findIndex(m => m.examId === currentExam.id && m.studentId === studentId);
    let updatedMarks = [...marks];

    const val = marksObtained === '' ? '' : Math.min(Number(marksObtained), currentExam.totalMarks);

    if (existingIndex >= 0) {
      updatedMarks[existingIndex] = {
        ...updatedMarks[existingIndex],
        marksObtained: val,
        remarks: (val !== '' && Number(val) >= currentExam.passingMarks) ? 'Passed' : 'Needs improvement'
      };
    } else {
      updatedMarks.push({
        id: generateNextId(updatedMarks),
        examId: currentExam.id,
        studentId,
        subject: currentExam.subject,
        marksObtained: val,
        remarks: (val !== '' && Number(val) >= currentExam.passingMarks) ? 'Passed' : 'Needs improvement'
      });
    }

    onSaveData({
      ...data,
      marks: updatedMarks
    });

    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
    }, 2500);
  };

  const handleSaveAllMarks = () => {
    setSaveStatus('saving');
    onSaveData({
      ...data,
      marks: [...marks]
    });
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2500);
    }, 400);
  };

  // Update student-specific subject for this exam (independent per student!)
  const handleSubjectChange = (studentId, newSubject) => {
    if (!currentExam || !newSubject) return;

    const existingIndex = marks.findIndex(m => m.examId === currentExam.id && m.studentId === studentId);
    let updatedMarks = [...marks];

    if (existingIndex >= 0) {
      updatedMarks[existingIndex] = {
        ...updatedMarks[existingIndex],
        subject: newSubject.trim()
      };
    } else {
      updatedMarks.push({
        id: generateNextId(updatedMarks),
        examId: currentExam.id,
        studentId,
        subject: newSubject.trim(),
        marksObtained: '',
        remarks: 'Pending'
      });
    }

    onSaveData({
      ...data,
      marks: updatedMarks
    });
  };

  // Grade calculator helper
  const getGrade = (obtained, total) => {
    const pct = total > 0 ? (obtained / total) * 100 : 0;
    if (pct >= 90) return { grade: 'A+', color: '#34D399' };
    if (pct >= 80) return { grade: 'A', color: '#10B981' };
    if (pct >= 70) return { grade: 'B+', color: '#38BDF8' };
    if (pct >= 60) return { grade: 'B', color: '#FBBF24' };
    if (pct >= 40) return { grade: 'C', color: '#FB923C' };
    return { grade: 'F', color: '#FB7185' };
  };

  // Helper to render the Scorecard DOM element as a crisp 2x resolution canvas
  const captureScorecardCanvas = async () => {
    const cardEl = document.getElementById('scorecard-capture-card');
    if (!cardEl) return null;

    try {
      const canvas = await html2canvas(cardEl, {
        scale: 2, // 2x high resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById('scorecard-capture-card');
          if (clonedCard) {
            clonedCard.style.boxShadow = 'none';
            clonedCard.style.borderRadius = '12px';
            clonedCard.style.width = '560px';
            clonedCard.style.margin = '0 auto';
          }
        }
      });
      return canvas;
    } catch (err) {
      console.error('Failed to capture scorecard card:', err);
      return null;
    }
  };

  // Share Card as an Image to WhatsApp
  // Clean 10-digit / 91-prefixed WhatsApp phone formatter
  const getCleanWhatsAppPhone = (phone) => {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }
    if (digits.startsWith('0') && digits.length === 11) {
      digits = digits.slice(1);
    }
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  };

  // Build clean text message for parent WhatsApp
  const buildScorecardTextMessage = (student, exam, mark) => {
    const marksObtained = mark ? Number(mark.marksObtained) : 0;
    const totalMarks = Number(exam.totalMarks) || 50;
    const passingMarks = Number(exam.passingMarks) || 18;
    const pct = Math.round((marksObtained / totalMarks) * 100);
    const isPassed = marksObtained >= passingMarks;
    const studentSubject = mark?.subject || exam.subject;
    const grade = getGrade(marksObtained, totalMarks).grade;
    const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
    const remarks = mark?.remarks || (isPassed ? 'Good effort! Continue consistent daily problem practice.' : 'Needs improvement');

    return [
      `*HAYAGRIVA TUTORIALS*`,
      `Student Performance Assessment Report`,
      ``,
      `*Student Name:* ${student.name}`,
      `*Roll No:* ${student.admissionNo}`,
      `*Standard:* ${className}`,
      `*School:* ${student.school || 'Unspecified'}`,
      ``,
      `*Test:* ${exam.title}`,
      `*Subject:* ${studentSubject} (${exam.date})`,
      `*Marks Obtained:* ${marksObtained} / ${totalMarks} (${pct}%)`,
      `*Grade:* Grade ${grade}`,
      `*Status:* ${isPassed ? 'PASSED' : 'Needs Revision'}`,
      ``,
      `*Tutor Remarks:* ${remarks}`,
      ``,
      `— Hayagriva Tutorials, Classes 1 to 10 Tuition Academy`,
      `Helpdesk: 9848266892`
    ].join('\n');
  };

  // Share Scorecard directly to the Parent's WhatsApp chat (Admin only)
  const handleShareCardImage = (student, exam, mark) => {
    if (isTeacher || !student || !exam) return;
    const targetPhone = getCleanWhatsAppPhone(student.parentPhone);
    const textMessage = buildScorecardTextMessage(student, exam, mark);

    // Open WhatsApp DIRECTLY to the parent's phone number with the clean scorecard message
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(textMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Download scorecard directly as a high-resolution PNG image
  const handleDownloadCardImage = async (student, exam) => {
    if (!student || !exam) return;
    setIsSharingCard(true);
    try {
      const canvas = await captureScorecardCanvas();
      if (!canvas) return;
      const studentCleanName = (student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
      const testCleanTitle = (exam.title || 'Exam').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Scorecard_${studentCleanName}_${testCleanTitle}.png`;

      const downloadLink = document.createElement('a');
      downloadLink.download = fileName;
      downloadLink.href = canvas.toDataURL('image/png');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Error downloading card image:', err);
    } finally {
      setIsSharingCard(false);
    }
  };

  // Copy card image to clipboard
  const handleCopyCardImage = async () => {
    setIsSharingCard(true);
    try {
      const canvas = await captureScorecardCanvas();
      if (!canvas) return;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopyCardSuccess(true);
        setTimeout(() => setCopyCardSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error copying card image:', err);
    } finally {
      setIsSharingCard(false);
    }
  };

  // Clean text message without broken surrogate symbols
  const handleCleanWhatsAppText = (student, exam, mark) => {
    if (!student || !exam) return;
    const marksObtained = mark ? Number(mark.marksObtained) : 0;
    const totalMarks = Number(exam.totalMarks) || 50;
    const passingMarks = Number(exam.passingMarks) || 18;
    const pct = Math.round((marksObtained / totalMarks) * 100);
    const isPassed = marksObtained >= passingMarks;
    const studentSubject = mark?.subject || exam.subject;
    const grade = getGrade(marksObtained, totalMarks).grade;
    const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
    const remarks = mark?.remarks || (isPassed ? 'Good effort! Continue consistent practice.' : 'Needs focused revision and mistake practice.');

    const lines = [
      `*HAYAGRIVA TUTORIALS*`,
      `*Academic Assessment Scorecard*`,
      ``,
      `*Student Name:* ${student.name}`,
      `*Admission / Roll No:* ${student.admissionNo}`,
      `*Standard:* ${className}`,
      ``,
      `*Test:* ${exam.title}`,
      `*Subject:* ${studentSubject}`,
      `*Exam Date:* ${exam.date}`,
      ``,
      `*Marks Obtained:* ${marksObtained} / ${totalMarks}`,
      `*Percentage:* ${pct}%`,
      `*Grade:* Grade ${grade}`,
      `*Status:* ${isPassed ? 'PASSED' : 'Needs Support / Revision'}`,
      ``,
      `*Tutor Remarks:* ${remarks}`,
      ``,
      `-- Hayagriva Tutorials, Classes 1 to 10 Tuition Academy`,
      `Helpdesk: 9848266892`
    ];

    const cleanPhone = (student.parentPhone || '').replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  // When opened via "WhatsApp" button on student table row, automatically initiate card share
  useEffect(() => {
    if (reportCardStudent && reportCardStudent.autoShare) {
      const timer = setTimeout(() => {
        handleShareCardImage(reportCardStudent.student, reportCardStudent.exam, reportCardStudent.mark);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [reportCardStudent?.student?.id, reportCardStudent?.exam?.id, reportCardStudent?.autoShare]);

  return (
    <div className="exams-page">
      <div className="exams-header">
        <div>
          <h1 className="page-title">Tests & Academic Performance</h1>
          <p className="page-subtitle">Weekly slip tests, unit exams, subject customization, and WhatsApp scorecards</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setNewExamData(prev => ({ ...prev, classCode: selectedClass }));
            setNewExamModalOpen(true);
          }}
        >
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
                setSelectedExamId(firstExam ? firstExam.id : '');
              }}
            >
              {accessibleClasses.map(cls => (
                <option key={cls.code} value={cls.code}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0" style={{ minWidth: '260px', flex: 1 }}>
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
                <span>Max: <strong>{currentExam.totalMarks}</strong></span>
              </div>
              <div className="exam-meta-tag">
                <span>Pass: <strong>{currentExam.passingMarks}</strong></span>
              </div>

              {/* Save Status & Action Buttons */}
              <div className="flex items-center gap-2">
                {saveStatus === 'saved' ? (
                  <span className="badge badge-success text-xs font-semibold flex items-center gap-1">
                    <CheckCircle size={12} />
                    <span>Saved to Database</span>
                  </span>
                ) : saveStatus === 'saving' ? (
                  <span className="badge badge-warning text-xs font-semibold flex items-center gap-1">
                    <span>Saving to DB...</span>
                  </span>
                ) : null}

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveAllMarks}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Save All Marks to Cloud Database"
                >
                  <CheckCircle2 size={13} />
                  <span>Save Marks</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEditExam(currentExam)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Edit Test Details"
                >
                  <Edit size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteConfirmExam(currentExam)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  title="Delete this Test and marks"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
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
                <th>Exam Subject (Customizable)</th>
                <th>School</th>
                <th style={{ width: '160px' }}>Marks (/{currentExam.totalMarks})</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th style={{ textAlign: 'center' }}>Scorecard & Share</th>
              </tr>
            </thead>
            <tbody>
              {examStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No students currently enrolled in {classes.find(c => c.code === currentExam.classCode)?.name}.
                  </td>
                </tr>
              ) : (
                examStudents.map(student => {
                  const markRecord = marks.find(m => m.examId === currentExam.id && m.studentId === student.id);
                  const marksVal = markRecord ? markRecord.marksObtained : '';
                  const hasMarks = markRecord !== undefined && markRecord.marksObtained !== null && markRecord.marksObtained !== '';
                  const pct = hasMarks ? Math.round((Number(marksVal) / currentExam.totalMarks) * 100) : null;
                  const gradeInfo = hasMarks ? getGrade(Number(marksVal), currentExam.totalMarks) : null;
                  const studentSubject = markRecord?.subject || currentExam.subject;
                  const isCustomSubject = markRecord?.subject && markRecord.subject !== currentExam.subject;

                  return (
                    <tr key={student.id}>
                      <td className="font-mono text-xs text-muted">{student.admissionNo}</td>
                      <td>
                        <div className="font-semibold text-white">{student.name}</div>
                      </td>

                      {/* Student-Specific Subject Selector */}
                      <td>
                        <select 
                          className="form-select form-select-sm"
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '4px 8px', 
                            maxWidth: '180px',
                            background: isCustomSubject ? 'rgba(99, 102, 241, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                            borderColor: isCustomSubject ? 'var(--primary-400)' : 'var(--border-subtle)',
                            color: isCustomSubject ? '#C7D2FE' : 'white',
                            fontWeight: isCustomSubject ? 700 : 500
                          }}
                          value={studentSubject}
                          onChange={(e) => {
                            if (e.target.value === '__CUSTOM__') {
                              const custom = window.prompt(`Enter custom exam subject for ${student.name}:`, studentSubject);
                              if (custom && custom.trim()) {
                                handleSubjectChange(student.id, custom.trim());
                              }
                            } else {
                              handleSubjectChange(student.id, e.target.value);
                            }
                          }}
                          title={`Subject for ${student.name} (Independent per student)`}
                        >
                          <option value={currentExam.subject}>{currentExam.subject} (Default)</option>
                          {availableClassSubjects.filter(s => s !== currentExam.subject).map((subj, idx) => (
                            <option key={idx} value={subj}>{subj}</option>
                          ))}
                          {isCustomSubject && !availableClassSubjects.includes(markRecord.subject) && (
                            <option value={markRecord.subject}>{markRecord.subject} (Custom)</option>
                          )}
                          <option value="__CUSTOM__">✏️ Other / Custom Subject...</option>
                        </select>
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
                          <span className="font-bold text-white">{pct}%</span>
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setReportCardStudent({ student, exam: currentExam, mark: markRecord })}
                            disabled={!hasMarks}
                            title="View Full Printable Scorecard"
                          >
                            <FileText size={13} />
                            <span>Scorecard</span>
                          </button>
                          {!isTeacher && (
                            <button 
                              className="btn btn-sm"
                              onClick={() => setReportCardStudent({ student, exam: currentExam, mark: markRecord, autoShare: true })}
                              disabled={!hasMarks}
                              title={`Send Scorecard Card to ${student.parentName} via WhatsApp`}
                              style={{ 
                                background: '#10B981', 
                                color: 'white', 
                                border: 'none', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                opacity: hasMarks ? 1 : 0.4,
                                cursor: hasMarks ? 'pointer' : 'not-allowed'
                              }}
                            >
                              <MessageSquare size={13} />
                              <span>WhatsApp</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-card empty-exam-card" style={{ textAlign: 'center', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Award size={44} className="text-muted mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">
            No Tests Scheduled for {classes.find(c => c.code === selectedClass)?.name || selectedClass}
          </h3>
          <p className="text-muted text-sm mb-4" style={{ maxWidth: '420px' }}>
            There are no exams recorded for this standard yet. Click below to schedule a new test, enter slip test marks, and share scorecards with parents.
          </p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => {
              setNewExamData(prev => ({ ...prev, classCode: selectedClass }));
              setNewExamModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Schedule Test for {classes.find(c => c.code === selectedClass)?.name || selectedClass}</span>
          </button>
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
              {Object.keys(examErrors).length > 0 && (
                <div className="form-error-banner" style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Please fix the highlighted fields to create this test.
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Test Title *</label>
                <input 
                  type="text"
                  className={`form-input ${examErrors.title ? 'input-error' : ''}`}
                  placeholder="e.g. Unit Test 2 - Quadratic Equations"
                  value={newExamData.title}
                  onChange={(e) => {
                    setNewExamData({ ...newExamData, title: e.target.value });
                    if (examErrors.title) setExamErrors(prev => ({ ...prev, title: null }));
                  }}
                />
                {examErrors.title && (
                  <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {examErrors.title}
                  </span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Standard (Class 1 to 10) *</label>
                  <select 
                    className="form-select"
                    value={newExamData.classCode}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      const subs = getSubjectsForClass(newCls);
                      setNewExamData(prev => ({ 
                        ...prev, 
                        classCode: newCls,
                        subject: subs.includes(prev.subject) ? prev.subject : (subs[0] || 'Mathematics')
                      }));
                    }}
                  >
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Subject *</label>
                  <select 
                    className={`form-select ${examErrors.subject ? 'input-error' : ''}`}
                    value={getSubjectsForClass(newExamData.classCode).includes(newExamData.subject) ? newExamData.subject : (newExamData.subject ? '__CUSTOM__' : '')}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        const custom = window.prompt('Enter custom subject name for this test:', newExamData.subject && !getSubjectsForClass(newExamData.classCode).includes(newExamData.subject) ? newExamData.subject : '');
                        if (custom && custom.trim()) {
                          setNewExamData({ ...newExamData, subject: custom.trim() });
                          if (examErrors.subject) setExamErrors(prev => ({ ...prev, subject: null }));
                        }
                      } else {
                        setNewExamData({ ...newExamData, subject: e.target.value });
                        if (examErrors.subject) setExamErrors(prev => ({ ...prev, subject: null }));
                      }
                    }}
                  >
                    <option value="">-- Select Subject --</option>
                    {getSubjectsForClass(newExamData.classCode).map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                    {!getSubjectsForClass(newExamData.classCode).includes(newExamData.subject) && newExamData.subject && (
                      <option value={newExamData.subject}>{newExamData.subject} (Custom)</option>
                    )}
                    <option value="__CUSTOM__">✏️ Other / Custom Subject...</option>
                  </select>
                  {examErrors.subject && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {examErrors.subject}
                    </span>
                  )}
                  <span className="text-3xs text-muted mt-1">Note: Individual students can also have different subjects in the marks table.</span>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Total Maximum Marks</label>
                  <input 
                    type="number"
                    className={`form-input ${examErrors.totalMarks ? 'input-error' : ''}`}
                    value={newExamData.totalMarks}
                    onChange={(e) => {
                      setNewExamData({ ...newExamData, totalMarks: e.target.value });
                      if (examErrors.totalMarks) setExamErrors(prev => ({ ...prev, totalMarks: null }));
                    }}
                  />
                  {examErrors.totalMarks && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {examErrors.totalMarks}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input 
                    type="number"
                    className={`form-input ${examErrors.passingMarks ? 'input-error' : ''}`}
                    value={newExamData.passingMarks}
                    onChange={(e) => {
                      setNewExamData({ ...newExamData, passingMarks: e.target.value });
                      if (examErrors.passingMarks) setExamErrors(prev => ({ ...prev, passingMarks: null }));
                    }}
                  />
                  {examErrors.passingMarks && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {examErrors.passingMarks}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exam Date *</label>
                <input 
                  type="date"
                  className={`form-input ${examErrors.date ? 'input-error' : ''}`}
                  value={newExamData.date}
                  onChange={(e) => {
                    setNewExamData({ ...newExamData, date: e.target.value });
                    if (examErrors.date) setExamErrors(prev => ({ ...prev, date: null }));
                  }}
                />
                {examErrors.date && (
                  <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {examErrors.date}
                  </span>
                )}
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => { setNewExamModalOpen(false); setExamErrors({}); }}>
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

      {/* Edit Exam Modal */}
      {editExamModalOpen && editExamData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Test / Exam Details</h2>
              <button className="close-btn" onClick={() => setEditExamModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditExam} className="admission-form">
              {Object.keys(examErrors).length > 0 && (
                <div className="form-error-banner" style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ Please fix highlighted errors before saving.
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Test Title *</label>
                <input 
                  type="text"
                  className={`form-input ${examErrors.title ? 'input-error' : ''}`}
                  value={editExamData.title}
                  onChange={(e) => setEditExamData({ ...editExamData, title: e.target.value })}
                />
                {examErrors.title && (
                  <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    {examErrors.title}
                  </span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Standard *</label>
                  <select 
                    className="form-select"
                    value={editExamData.classCode}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      const subs = getSubjectsForClass(newCls);
                      setEditExamData(prev => ({ 
                        ...prev, 
                        classCode: newCls,
                        subject: subs.includes(prev.subject) ? prev.subject : (subs[0] || 'Mathematics')
                      }));
                    }}
                  >
                    {classes.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Subject *</label>
                  <select 
                    className={`form-select ${examErrors.subject ? 'input-error' : ''}`}
                    value={getSubjectsForClass(editExamData.classCode).includes(editExamData.subject) ? editExamData.subject : (editExamData.subject ? '__CUSTOM__' : '')}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        const custom = window.prompt('Enter custom subject name for this test:', editExamData.subject && !getSubjectsForClass(editExamData.classCode).includes(editExamData.subject) ? editExamData.subject : '');
                        if (custom && custom.trim()) {
                          setEditExamData({ ...editExamData, subject: custom.trim() });
                          if (examErrors.subject) setExamErrors(prev => ({ ...prev, subject: null }));
                        }
                      } else {
                        setEditExamData({ ...editExamData, subject: e.target.value });
                        if (examErrors.subject) setExamErrors(prev => ({ ...prev, subject: null }));
                      }
                    }}
                  >
                    <option value="">-- Select Subject --</option>
                    {getSubjectsForClass(editExamData.classCode).map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                    {!getSubjectsForClass(editExamData.classCode).includes(editExamData.subject) && editExamData.subject && (
                      <option value={editExamData.subject}>{editExamData.subject} (Custom)</option>
                    )}
                    <option value="__CUSTOM__">✏️ Other / Custom Subject...</option>
                  </select>
                  {examErrors.subject && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {examErrors.subject}
                    </span>
                  )}
                  <span className="text-3xs text-muted mt-1">Note: Existing marks for this test will be updated to the new default subject.</span>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Total Maximum Marks</label>
                  <input 
                    type="number"
                    className={`form-input ${examErrors.totalMarks ? 'input-error' : ''}`}
                    value={editExamData.totalMarks}
                    onChange={(e) => setEditExamData({ ...editExamData, totalMarks: e.target.value })}
                  />
                  {examErrors.totalMarks && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {examErrors.totalMarks}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input 
                    type="number"
                    className={`form-input ${examErrors.passingMarks ? 'input-error' : ''}`}
                    value={editExamData.passingMarks}
                    onChange={(e) => setEditExamData({ ...editExamData, passingMarks: e.target.value })}
                  />
                  {examErrors.passingMarks && (
                    <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {examErrors.passingMarks}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exam Date *</label>
                <input 
                  type="date"
                  className={`form-input ${examErrors.date ? 'input-error' : ''}`}
                  value={editExamData.date}
                  onChange={(e) => setEditExamData({ ...editExamData, date: e.target.value })}
                />
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => setEditExamModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Exam Confirmation Modal */}
      {deleteConfirmExam && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-2 text-rose">
                <AlertTriangle size={20} />
                <h3 className="modal-title text-rose">Delete Test?</h3>
              </div>
              <button className="close-btn" onClick={() => setDeleteConfirmExam(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <p className="mb-2">
                Are you sure you want to delete <strong>"{deleteConfirmExam.title}"</strong> ({deleteConfirmExam.subject})?
              </p>
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem' }}>
                ⚠️ Warning: Deleting this test will also remove all student score records entered for it.
              </div>
            </div>

            <div className="modal-actions-flex">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmExam(null)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => handleDeleteExam(deleteConfirmExam)}
              >
                Yes, Delete Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Performance Scorecard Modal */}
      {reportCardStudent && (() => {
        const student = reportCardStudent.student;
        const exam = reportCardStudent.exam;
        const mark = reportCardStudent.mark;
        const marksObtained = mark ? Number(mark.marksObtained) : 0;
        const totalMarks = Number(exam.totalMarks) || 50;
        const passingMarks = Number(exam.passingMarks) || 18;
        const pct = Math.round((marksObtained / totalMarks) * 100);
        const isPassed = marksObtained >= passingMarks;
        const gradeInfo = getGrade(marksObtained, totalMarks);
        const studentSubject = mark?.subject || exam.subject;
        const standardName = classes.find(c => c.code === student.classCode)?.name || student.classCode;

        return (
          <div className="modal-overlay">
            <div className="modal-content report-card-modal">
              <div className="modal-header">
                <span className="badge badge-class" style={{ fontSize: '0.85rem', padding: '4px 14px' }}>Academic Scorecard</span>
                <button className="close-btn" onClick={() => setReportCardStudent(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* Exact Clean Minimal White Certificate Sheet */}
              <div id="scorecard-capture-card" className="scorecard-paper printable-card">
                {/* Header Banner */}
                <div className="scorecard-banner">
                  <h3 className="scorecard-inst">HAYAGRIVA TUTORIALS</h3>
                  <div className="scorecard-sub">Student Performance Assessment Report</div>
                </div>

                {/* Student Details Grid */}
                <div className="scorecard-details">
                  <div><strong>Student Name:</strong> {student.name}</div>
                  <div><strong>Roll No:</strong> {student.admissionNo}</div>
                  <div><strong>Standard:</strong> {standardName}</div>
                  <div><strong>School:</strong> {student.school || 'Unspecified'}</div>
                </div>

                {/* Test & Performance Highlight Box */}
                <div className="scorecard-marks-highlight">
                  <div className="score-circle">
                    <div className="score-num">{marksObtained}</div>
                    <div className="score-denom">/ {totalMarks}</div>
                  </div>

                  <div className="score-summary">
                    <div className="font-bold text-lg text-slate-900" style={{ fontSize: '1.15rem', color: '#0F172A' }}>
                      {exam.title}
                    </div>
                    <div className="text-xs text-muted" style={{ fontSize: '0.825rem', color: '#64748B' }}>
                      Subject: <strong>{studentSubject}</strong> ({exam.date})
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span 
                        className="badge"
                        style={{ 
                          background: `${gradeInfo.color}20`, 
                          color: gradeInfo.color,
                          borderColor: `${gradeInfo.color}40`,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '3px 10px'
                        }}
                      >
                        Grade {gradeInfo.grade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tutor Remarks */}
                <div className="scorecard-teacher-remarks">
                  <strong>Tutor Remarks:</strong> {mark?.remarks || (isPassed ? 'Good effort! Continue consistent practice.' : 'Needs improvement')}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="modal-actions-flex mt-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    <span>Print Scorecard</span>
                  </button>

                  {!isTeacher && (
                    <button 
                      type="button"
                      className="btn"
                      disabled={isSharingCard}
                      onClick={() => handleShareCardImage(student, exam, mark)}
                      style={{
                        background: '#10B981',
                        color: 'white',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                      title="Send directly to parent on WhatsApp"
                    >
                      <MessageSquare size={15} />
                      <span>{isSharingCard ? 'Opening...' : 'Send to WhatsApp'}</span>
                    </button>
                  )}

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    disabled={isSharingCard}
                    onClick={() => handleDownloadCardImage(student, exam)}
                    title="Download scorecard card as high-res PNG image"
                  >
                    <Download size={14} />
                    <span>Save Image (.PNG)</span>
                  </button>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setReportCardStudent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
          flex-wrap: wrap;
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

        /* Scorecard Modal & Printable Styling */
        .report-card-modal {
          max-width: 600px;
          width: 100%;
          padding: 20px 22px;
          max-height: 94vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .report-card-modal::-webkit-scrollbar {
          width: 5px;
        }
        .report-card-modal::-webkit-scrollbar-track {
          background: transparent;
        }
        .report-card-modal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
        }

        /* Clean Scorecard Paper - Matches User Screenshot Exactly */
        .scorecard-paper {
          background: white;
          color: #0f172a;
          border-radius: var(--radius-md);
          padding: 24px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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
          margin: 0;
        }
        .scorecard-sub {
          font-size: 0.775rem;
          color: #475569;
          margin-top: 4px;
        }
        .scorecard-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 16px;
          font-size: 0.8125rem;
          margin-bottom: 16px;
          background: #f8fafc;
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          color: #1e293b;
        }
        .scorecard-details strong {
          color: #0f172a;
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
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
        }
        .score-num {
          font-size: 1.45rem;
          font-weight: 800;
          line-height: 1;
        }
        .score-denom {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 2px;
        }
        .score-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .scorecard-teacher-remarks {
          padding: 12px 14px;
          background: #f8fafc;
          border-left: 3px solid #4f46e5;
          font-size: 0.8125rem;
          color: #334155;
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        /* Modern Scorecard Action Wrapper & Buttons */
        .scorecard-actions-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
        }
        .scorecard-main-action-btn {
          width: 100%;
          padding: 11px 16px;
          font-size: 0.925rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #10B981 !important;
          color: white !important;
          border: none !important;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35) !important;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .scorecard-main-action-btn:hover {
          background: #059669 !important;
          transform: translateY(-1px);
        }
        .scorecard-main-action-btn:disabled {
          opacity: 0.75;
          cursor: wait;
        }
        .scorecard-actions-subrow {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .scorecard-actions-subrow .btn {
          flex: 1;
          min-width: 95px;
          font-size: 0.775rem;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .scorecard-loading-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: spinScorecard 0.7s linear infinite;
        }
        @keyframes spinScorecard {
          to { transform: rotate(360deg); }
        }
        .scorecard-helpdesk-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
          font-size: 0.675rem;
          color: #64748B;
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
          .exam-selectors-grid {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .exam-meta-pill-box {
            margin-left: 0;
            width: 100%;
            justify-content: flex-start;
          }
          .scorecard-actions-row {
            grid-template-columns: 1fr;
          }
          .scorecard-student-grid {
            grid-template-columns: 1fr;
          }
          .scorecard-marks-highlight {
            flex-direction: column;
            text-align: center;
          }
          .scorecard-pill-row {
            justify-content: center;
          }
        }

        /* Print Media Style for Scorecard */
        @media print {
          body * {
            visibility: hidden;
          }
          .scorecard-paper, .scorecard-paper * {
            visibility: visible;
          }
          .scorecard-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #94A3B8 !important;
          }
        }
      `}</style>
    </div>
  );
}
