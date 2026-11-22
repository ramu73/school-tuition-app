import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CheckCircle,
  Users,
  Calendar,
  Layers
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

  // Helper to determine the current week of the month (1 to 5)
  const getCurrentWeekOfMonth = (d = new Date()) => {
    const day = d.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 28) return 4;
    return 5;
  };

  // Helper to compute Saturday for any specific week number of the current month
  const getSaturdayForWeek = (weekNumber, referenceDate = new Date()) => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const saturdays = [];
    const d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      if (d.getDay() === 6) {
        saturdays.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    const idx = Math.min(Math.max(1, Number(weekNumber) || 1) - 1, saturdays.length - 1);
    const sat = saturdays[idx] || new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${sat.getFullYear()}-${pad(sat.getMonth() + 1)}-${pad(sat.getDate())}`;
  };

  // Helper to compute next upcoming Saturday date for the Saturday weekly test template
  const getNextSaturdayDate = () => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    const diff = day === 6 ? 0 : (6 - day);
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  };

  const initialWeekNum = getCurrentWeekOfMonth();

  const [selectedClass, setSelectedClass] = useState(initialClassCode);
  const [examTabFilter, setExamTabFilter] = useState('ACTIVE'); // 'ACTIVE' | 'COMPLETED' | 'ALL'
  const [newExamModalOpen, setNewExamModalOpen] = useState(false);
  const [editExamModalOpen, setEditExamModalOpen] = useState(false);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState(null);
  const [reportCardStudent, setReportCardStudent] = useState(null);
  const [examErrors, setExamErrors] = useState({});
  const [isSharingCard, setIsSharingCard] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  // New and Edit exam state objects for modal dialogs (prevents ReferenceErrors)
  const [newExamData, setNewExamData] = useState({
    week: `WEEK_${initialWeekNum}`,
    title: `Week ${initialWeekNum} Saturday Test`,
    classCode: initialClassCode,
    targetMode: 'ALL_CLASSES',
    selectedClasses: accessibleClasses.map(c => c.code),
    subject: 'Multi-Subject',
    customSubject: '',
    totalMarks: 50,
    passingMarks: 18,
    date: getSaturdayForWeek(initialWeekNum)
  });
  const [editExamData, setEditExamData] = useState(null);

  // In-memory virtual marks buffer: allows entering marks before test is saved to DB
  const [virtualMarks, setVirtualMarks] = useState({});
  const [customVirtualRules, setCustomVirtualRules] = useState({});

  // Input refs for Excel-like ArrowDown / Enter key navigation
  const markInputsRef = React.useRef({});

  // All persisted exams for the currently selected class
  const allClassExams = useMemo(() => {
    return exams.filter(e => e.classCode === selectedClass);
  }, [exams, selectedClass]);

  // Active and completed exams for tab pill counts
  const activeClassExams = useMemo(() => {
    return allClassExams.filter(e => e.status !== 'COMPLETED');
  }, [allClassExams]);

  const completedClassExams = useMemo(() => {
    return allClassExams.filter(e => e.status === 'COMPLETED');
  }, [allClassExams]);

  // Generate the 5 Saturday week slots + Basic Test + Table Test for the currently selected class
  const classWeekSlots = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    const slotDefinitions = [
      { key: 'WEEK_1', weekNum: 1, type: 'WEEK', defaultTitle: 'Week 1 Saturday Test', date: getSaturdayForWeek(1), defaultTotal: 50, defaultPass: 18, matchTerms: ['week 1', 'week1'] },
      { key: 'WEEK_2', weekNum: 2, type: 'WEEK', defaultTitle: 'Week 2 Saturday Test', date: getSaturdayForWeek(2), defaultTotal: 50, defaultPass: 18, matchTerms: ['week 2', 'week2'] },
      { key: 'WEEK_3', weekNum: 3, type: 'WEEK', defaultTitle: 'Week 3 Saturday Test', date: getSaturdayForWeek(3), defaultTotal: 50, defaultPass: 18, matchTerms: ['week 3', 'week3'] },
      { key: 'WEEK_4', weekNum: 4, type: 'WEEK', defaultTitle: 'Week 4 Saturday Test', date: getSaturdayForWeek(4), defaultTotal: 50, defaultPass: 18, matchTerms: ['week 4', 'week4'] },
      { key: 'WEEK_5', weekNum: 5, type: 'WEEK', defaultTitle: 'Week 5 Saturday Test', date: getSaturdayForWeek(5), defaultTotal: 50, defaultPass: 18, matchTerms: ['week 5', 'week5'] },
      { key: 'BASIC_TEST', weekNum: null, type: 'BASIC', defaultTitle: 'Basic Test', date: todayStr, defaultTotal: 25, defaultPass: 9, matchTerms: ['basic test', 'basics test', 'basic'] },
      { key: 'TABLE_TEST', weekNum: null, type: 'TABLE', defaultTitle: 'Table Test', date: todayStr, defaultTotal: 20, defaultPass: 7, matchTerms: ['table test', 'tables test', 'table', 'tables'] },
    ];

    return slotDefinitions.map(def => {
      const slotKey = def.key;
      const rule = customVirtualRules[`${selectedClass}_${slotKey}`] || {};
      
      // Look for an existing exam matching this slot for the selected class:
      const existingExam = allClassExams.find(e => {
        const titleLower = e.title?.toLowerCase() || '';
        const matchesTerm = def.matchTerms.some(term => titleLower.includes(term));
        const matchesDate = def.type === 'WEEK' && e.date === def.date;
        return matchesTerm || matchesDate;
      });

      if (existingExam) {
        return {
          id: existingExam.id,
          slotKey,
          isVirtual: false,
          weekNum: def.weekNum,
          type: def.type,
          title: existingExam.title,
          classCode: selectedClass,
          subject: existingExam.subject || (def.type === 'TABLE' ? 'Mathematics' : 'Multi-Subject'),
          totalMarks: existingExam.totalMarks || def.defaultTotal,
          passingMarks: existingExam.passingMarks || def.defaultPass,
          date: existingExam.date || def.date,
          status: existingExam.status || 'ACTIVE',
          existingExam
        };
      }

      // Virtual Slot ready to be graded and auto-created on save
      return {
        id: `VIRTUAL_${slotKey}`,
        slotKey,
        isVirtual: true,
        weekNum: def.weekNum,
        type: def.type,
        title: rule.title || def.defaultTitle,
        classCode: selectedClass,
        subject: def.type === 'TABLE' ? 'Mathematics' : 'Multi-Subject',
        totalMarks: rule.totalMarks || def.defaultTotal,
        passingMarks: rule.passingMarks || def.defaultPass,
        date: rule.date || def.date,
        status: 'ACTIVE'
      };
    });
  }, [allClassExams, selectedClass, customVirtualRules]);

  // Other non-weekly / custom tests for this class (e.g. mock boards, unit revisions)
  const otherClassExams = useMemo(() => {
    const standardSlotIds = new Set(classWeekSlots.filter(s => !s.isVirtual).map(s => s.id));
    return allClassExams.filter(e => !standardSlotIds.has(e.id));
  }, [allClassExams, classWeekSlots]);

  // Initial selected test slot: defaults to current week
  const [selectedExamId, setSelectedExamId] = useState(() => {
    const def = classWeekSlots.find(s => s.weekNum === initialWeekNum) || classWeekSlots[0];
    return def ? def.id : `VIRTUAL_WEEK_${initialWeekNum}`;
  });

  // Current active exam: guarantees a valid test or week slot is ALWAYS selected
  const currentExam = useMemo(() => {
    if (selectedExamId) {
      const matchedSlot = classWeekSlots.find(s => String(s.id) === String(selectedExamId));
      if (matchedSlot) return matchedSlot;

      const matchedOther = otherClassExams.find(e => String(e.id) === String(selectedExamId));
      if (matchedOther) return matchedOther;
    }

    const defaultSlot = classWeekSlots.find(s => s.weekNum === initialWeekNum) || classWeekSlots[0];
    return defaultSlot;
  }, [classWeekSlots, otherClassExams, selectedExamId, initialWeekNum]);

  // Virtual key for local draft state
  const virtualKey = `${selectedClass}_${currentExam?.slotKey || (currentExam?.weekNum ? `WEEK_${currentExam.weekNum}` : currentExam?.id || 'DEFAULT')}`;

  // Keep selectedExamId valid when switching class
  useEffect(() => {
    if (selectedExamId) {
      const existsInSlots = classWeekSlots.some(s => String(s.id) === String(selectedExamId));
      const existsInOthers = otherClassExams.some(e => String(e.id) === String(selectedExamId));
      if (!existsInSlots && !existsInOthers) {
        const def = classWeekSlots.find(s => s.weekNum === initialWeekNum) || classWeekSlots[0];
        setSelectedExamId(def ? def.id : `VIRTUAL_WEEK_${initialWeekNum}`);
      }
    } else {
      const def = classWeekSlots.find(s => s.weekNum === initialWeekNum) || classWeekSlots[0];
      setSelectedExamId(def ? def.id : `VIRTUAL_WEEK_${initialWeekNum}`);
    }
  }, [selectedClass, initialWeekNum]);

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

  // Summary performance statistics for the current exam (supports both persisted & virtual slots)
  const examStats = useMemo(() => {
    if (!currentExam || examStudents.length === 0) return null;
    let graded = 0;
    let absent = 0;
    let totalScore = 0;
    let highest = -1;
    let highestStudent = null;
    let passed = 0;

    const classWeekData = virtualMarks[virtualKey] || {};

    examStudents.forEach(s => {
      const m = currentExam.isVirtual
        ? classWeekData[s.id]
        : marks.find(mk => mk.examId === currentExam.id && mk.studentId === s.id);
      if (!m) return;
      if (m.isAbsent || m.marksObtained === 'AB') {
        absent++;
      } else if (m.marksObtained !== '' && m.marksObtained !== null && !isNaN(Number(m.marksObtained))) {
        graded++;
        const score = Number(m.marksObtained);
        totalScore += score;
        if (score >= currentExam.passingMarks) {
          passed++;
        }
        if (score > highest) {
          highest = score;
          highestStudent = s.name;
        }
      }
    });

    const pending = examStudents.length - graded - absent;
    const avgScore = graded > 0 ? (totalScore / graded).toFixed(1) : 0;
    const avgPct = graded > 0 && currentExam.totalMarks > 0 ? Math.round((Number(avgScore) / currentExam.totalMarks) * 100) : 0;
    const passRate = graded > 0 ? Math.round((passed / graded) * 100) : 0;

    return {
      total: examStudents.length,
      graded,
      absent,
      pending,
      avgScore,
      avgPct,
      highest: highest >= 0 ? highest : null,
      highestStudent,
      passed,
      passRate
    };
  }, [currentExam, examStudents, marks, virtualMarks, virtualKey]);

  const handleSelectWeek = (weekNumber) => {
    const wn = Number(weekNumber) || 1;
    const satDate = getSaturdayForWeek(wn);
    const activeSub = (newExamData.subject === '__CUSTOM__' ? newExamData.customSubject : newExamData.subject) || 'Mathematics';
    setNewExamData(prev => ({
      ...prev,
      week: `WEEK_${wn}`,
      title: `Week ${wn} Test - ${activeSub}`,
      date: satDate
    }));
    if (examErrors.title) setExamErrors(prev => ({ ...prev, title: null }));
    if (examErrors.date) setExamErrors(prev => ({ ...prev, date: null }));
  };

  const handleSelectSubject = (newSubject) => {
    const weekNum = newExamData.week && newExamData.week !== 'CUSTOM'
      ? newExamData.week.replace('WEEK_', '')
      : getCurrentWeekOfMonth();
    const displaySub = newSubject === '__CUSTOM__' ? (newExamData.customSubject || '') : newSubject;
    setNewExamData(prev => {
      const isStandardTitle = !prev.title || prev.title.startsWith('Week ') || prev.title.includes('Test -');
      return {
        ...prev,
        subject: newSubject,
        title: isStandardTitle && displaySub ? `Week ${weekNum} Test - ${displaySub}` : prev.title
      };
    });
    if (examErrors.subject) setExamErrors(prev => ({ ...prev, subject: null }));
  };

  const handleOpenCreateModal = (forcedClassCode = null) => {
    const targetCls = forcedClassCode || selectedClass || accessibleClasses[0]?.code || 'CLASS_10';
    const weekNum = getCurrentWeekOfMonth();
    const subs = getSubjectsForClass(targetCls);
    const chosenSub = subs.includes('Mathematics') ? 'Mathematics' : (subs[0] || 'Mathematics');

    setNewExamData({
      week: `WEEK_${weekNum}`,
      title: `Week ${weekNum} Test - ${chosenSub}`,
      classCode: targetCls,
      targetMode: forcedClassCode ? 'SINGLE_CLASS' : 'ALL_CLASSES',
      selectedClasses: accessibleClasses.map(c => c.code),
      subject: chosenSub,
      customSubject: '',
      totalMarks: 50,
      passingMarks: 18,
      date: getSaturdayForWeek(weekNum)
    });
    setExamErrors({});
    setNewExamModalOpen(true);
  };

  const handleCreateExam = (e) => {
    e.preventDefault();
    const errors = {};

    if (!newExamData.title || newExamData.title.trim().length < 3) {
      errors.title = 'Test title must be at least 3 characters.';
    }
    const finalSubject = (newExamData.subject === '__CUSTOM__' ? newExamData.customSubject : newExamData.subject) || '';
    if (!finalSubject || finalSubject.trim().length < 2) {
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

    const targetClassCodes = newExamData.targetMode === 'SINGLE_CLASS'
      ? [newExamData.classCode]
      : (newExamData.selectedClasses && newExamData.selectedClasses.length > 0 ? newExamData.selectedClasses : []);

    if (targetClassCodes.length === 0) {
      errors.targetClasses = 'Please select at least one standard/class.';
    }

    if (Object.keys(errors).length > 0) {
      setExamErrors(errors);
      logger.warn(logger.CATEGORIES.VALIDATION, 'Exam creation validation failed', { errors, examTitle: newExamData.title });
      return;
    }

    let nextId = generateNextId(exams);
    const createdExams = [];

    for (const code of targetClassCodes) {
      createdExams.push({
        id: nextId++,
        title: newExamData.title.trim(),
        classCode: code,
        subject: finalSubject.trim(),
        totalMarks: tot || 50,
        passingMarks: pass || 18,
        date: newExamData.date,
        status: 'ACTIVE'
      });
    }

    onSaveData({
      ...data,
      exams: [...createdExams, ...exams]
    });

    logger.action(currentUser, 'CREATE_EXAM', `Scheduled test "${newExamData.title.trim()}" across ${createdExams.length} classes (${tot} marks)`, {
      examCount: createdExams.length,
      subject: finalSubject.trim(),
      classCodes: targetClassCodes
    });

    // Automatically focus on current class or first created exam
    const primaryExam = createdExams.find(ex => ex.classCode === selectedClass) || createdExams[0];
    if (primaryExam) {
      setSelectedClass(primaryExam.classCode);
      setSelectedExamId(primaryExam.id);
    }
    setExamTabFilter('ACTIVE'); // Ensure newly created test is visible in Active tab
    setNewExamModalOpen(false);
    setExamErrors({});
  };

  // 1-Click Template Quick Filler for New Tests
  const handleApplyTemplate = (templateType) => {
    const subjects = getSubjectsForClass(newExamData.classCode);
    const chosenSubject = (newExamData.subject === '__CUSTOM__' ? newExamData.customSubject : newExamData.subject) || subjects[0] || 'Mathematics';

    if (templateType.startsWith('WEEK_')) {
      const wn = Number(templateType.replace('WEEK_', '')) || 1;
      handleSelectWeek(wn);
      return;
    }

    if (templateType === 'WEEKLY') {
      const wn = getCurrentWeekOfMonth();
      setNewExamData(prev => ({
        ...prev,
        week: `WEEK_${wn}`,
        title: `Week ${wn} Test - ${chosenSubject}`,
        subject: chosenSubject,
        totalMarks: 50,
        passingMarks: 18,
        date: getSaturdayForWeek(wn)
      }));
    } else if (templateType === 'SLIP') {
      setNewExamData(prev => ({
        ...prev,
        week: 'CUSTOM',
        title: `Slip Test - ${chosenSubject}`,
        subject: chosenSubject,
        totalMarks: 25,
        passingMarks: 9,
        date: new Date().toISOString().split('T')[0]
      }));
    } else if (templateType === 'BASIC') {
      setNewExamData(prev => ({
        ...prev,
        week: 'BASIC_TEST',
        title: 'Basic Test',
        subject: chosenSubject,
        totalMarks: 25,
        passingMarks: 9,
        date: new Date().toISOString().split('T')[0]
      }));
    } else if (templateType === 'TABLE') {
      setNewExamData(prev => ({
        ...prev,
        week: 'TABLE_TEST',
        title: 'Table Test',
        subject: 'Mathematics',
        totalMarks: 20,
        passingMarks: 7,
        date: new Date().toISOString().split('T')[0]
      }));
    } else if (templateType === 'MONTHLY') {
      setNewExamData(prev => ({
        ...prev,
        week: 'CUSTOM',
        title: `Monthly Assessment - ${chosenSubject}`,
        subject: chosenSubject,
        totalMarks: 100,
        passingMarks: 35,
        date: new Date().toISOString().split('T')[0]
      }));
    }
    setExamErrors({});
  };

  // Toggle Exam Completion Lifecycle Status
  const handleToggleExamStatus = (examToToggle) => {
    if (!examToToggle) return;
    const isCompleted = examToToggle.status === 'COMPLETED';
    const newStatus = isCompleted ? 'ACTIVE' : 'COMPLETED';

    const updatedExams = exams.map(e => {
      if (e.id === examToToggle.id) {
        return { ...e, status: newStatus };
      }
      return e;
    });

    onSaveData({
      ...data,
      exams: updatedExams
    });

    logger.action(
      currentUser,
      'UPDATE_EXAM_STATUS',
      `${newStatus === 'COMPLETED' ? 'Marked as Completed & Archived' : 'Reopened for grading'} test "${examToToggle.title}"`,
      { examId: examToToggle.id, status: newStatus }
    );
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
      date: exam.date || new Date().toISOString().split('T')[0],
      status: exam.status || 'ACTIVE'
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
          date: editExamData.date,
          status: editExamData.status || ex.status || 'ACTIVE'
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

  // Update marks for a student (supports numbers, blank, or 'AB' for Absent)
  const handleMarkChange = (studentId, marksObtained) => {
    if (!currentExam) return;

    let val = marksObtained;
    const isAbsent = val === 'AB';

    if (!isAbsent && val !== '' && val !== null) {
      const num = Number(val);
      if (!isNaN(num)) {
        val = Math.max(0, Math.min(num, currentExam.totalMarks));
      }
    }

    const remarks = isAbsent
      ? 'Absent'
      : (val !== '' && val !== null && Number(val) >= currentExam.passingMarks)
        ? 'Passed'
        : (val !== '' && val !== null) ? 'Needs improvement' : 'Pending';

    if (currentExam.isVirtual) {
      setVirtualMarks(prev => {
        const classWeek = prev[virtualKey] || {};
        const existingStudent = classWeek[studentId] || {
          subject: availableClassSubjects[0] || 'Mathematics'
        };
        return {
          ...prev,
          [virtualKey]: {
            ...classWeek,
            [studentId]: {
              ...existingStudent,
              marksObtained: val,
              isAbsent,
              remarks
            }
          }
        };
      });
      setSaveStatus('dirty');
      return;
    }

    const existingIndex = marks.findIndex(m => m.examId === currentExam.id && m.studentId === studentId);
    let updatedMarks = [...marks];

    if (existingIndex >= 0) {
      updatedMarks[existingIndex] = {
        ...updatedMarks[existingIndex],
        marksObtained: val,
        isAbsent,
        remarks
      };
    } else {
      updatedMarks.push({
        id: generateNextId(updatedMarks),
        examId: currentExam.id,
        studentId,
        subject: currentExam.subject || availableClassSubjects[0] || 'Mathematics',
        marksObtained: val,
        isAbsent,
        remarks
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

  // 1-Click Toggle Absent for a Student
  const handleToggleAbsent = (studentId) => {
    if (!currentExam) return;
    if (currentExam.isVirtual) {
      const classWeek = virtualMarks[virtualKey] || {};
      const existing = classWeek[studentId];
      const currentlyAbsent = existing?.isAbsent || existing?.marksObtained === 'AB';
      handleMarkChange(studentId, currentlyAbsent ? '' : 'AB');
    } else {
      const existing = marks.find(m => m.examId === currentExam.id && m.studentId === studentId);
      const currentlyAbsent = existing?.isAbsent || existing?.marksObtained === 'AB';
      handleMarkChange(studentId, currentlyAbsent ? '' : 'AB');
    }
  };

  // Mark all remaining ungraded students as Absent
  const handleMarkUnmarkedAbsent = () => {
    if (!currentExam) return;
    const classWeek = virtualMarks[virtualKey] || {};
    const unmarkedStudents = examStudents.filter(s => {
      const m = currentExam.isVirtual 
        ? classWeek[s.id] 
        : marks.find(mk => mk.examId === currentExam.id && mk.studentId === s.id);
      return !m || m.marksObtained === '' || m.marksObtained === null;
    });

    if (unmarkedStudents.length === 0) {
      alert('All students in this standard already have marks or are marked absent.');
      return;
    }

    if (!window.confirm(`Mark remaining ${unmarkedStudents.length} ungraded student(s) as Absent for this test?`)) {
      return;
    }

    if (currentExam.isVirtual) {
      setVirtualMarks(prev => {
        const updated = { ...(prev[virtualKey] || {}) };
        unmarkedStudents.forEach(s => {
          updated[s.id] = {
            ...(updated[s.id] || { subject: availableClassSubjects[0] || 'Mathematics' }),
            marksObtained: 'AB',
            isAbsent: true,
            remarks: 'Absent'
          };
        });
        return { ...prev, [virtualKey]: updated };
      });
      setSaveStatus('dirty');
      return;
    }

    let updatedMarks = [...marks];
    unmarkedStudents.forEach(s => {
      const existingIdx = updatedMarks.findIndex(m => m.examId === currentExam.id && m.studentId === s.id);
      if (existingIdx >= 0) {
        updatedMarks[existingIdx] = {
          ...updatedMarks[existingIdx],
          marksObtained: 'AB',
          isAbsent: true,
          remarks: 'Absent'
        };
      } else {
        updatedMarks.push({
          id: generateNextId(updatedMarks),
          examId: currentExam.id,
          studentId: s.id,
          subject: currentExam.subject || availableClassSubjects[0] || 'Mathematics',
          marksObtained: 'AB',
          isAbsent: true,
          remarks: 'Absent'
        });
      }
    });

    onSaveData({
      ...data,
      marks: updatedMarks
    });

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2500);
  };

  // Excel-like keyboard navigation (Enter or ArrowDown to next row, ArrowUp to previous row)
  const handleKeyDownMarks = (e, studentIndex) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextStudent = examStudents[studentIndex + 1];
      if (nextStudent && markInputsRef.current[nextStudent.id]) {
        markInputsRef.current[nextStudent.id].focus();
        markInputsRef.current[nextStudent.id].select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevStudent = examStudents[studentIndex - 1];
      if (prevStudent && markInputsRef.current[prevStudent.id]) {
        markInputsRef.current[prevStudent.id].focus();
        markInputsRef.current[prevStudent.id].select();
      }
    }
  };

  // Save All Marks to Cloud (creates the exam on-the-fly if virtual slot!)
  const handleSaveAllMarks = () => {
    if (!currentExam) return;
    setSaveStatus('saving');

    if (currentExam.isVirtual) {
      const newExamId = generateNextId(exams);
      const defaultTitle = currentExam.slotKey === 'BASIC_TEST'
        ? 'Basic Test'
        : currentExam.slotKey === 'TABLE_TEST'
          ? 'Table Test'
          : `Week ${currentExam.weekNum || 1} Saturday Test`;

      const defaultSubject = currentExam.slotKey === 'TABLE_TEST'
        ? 'Mathematics'
        : (currentExam.subject || 'Multi-Subject');

      const newExam = {
        id: newExamId,
        title: currentExam.title || defaultTitle,
        classCode: selectedClass,
        subject: defaultSubject,
        totalMarks: currentExam.totalMarks || (currentExam.slotKey === 'TABLE_TEST' ? 20 : currentExam.slotKey === 'BASIC_TEST' ? 25 : 50),
        passingMarks: currentExam.passingMarks || (currentExam.slotKey === 'TABLE_TEST' ? 7 : currentExam.slotKey === 'BASIC_TEST' ? 9 : 18),
        date: currentExam.date,
        status: 'ACTIVE'
      };

      const classWeekData = virtualMarks[virtualKey] || {};
      const newMarkRecords = [];
      let nextMarkId = generateNextId(marks);

      examStudents.forEach(s => {
        const vRec = classWeekData[s.id];
        const val = vRec?.marksObtained ?? '';
        const isAbsent = Boolean(vRec?.isAbsent || val === 'AB');
        const subject = vRec?.subject || (currentExam.slotKey === 'TABLE_TEST' ? 'Mathematics' : (availableClassSubjects[0] || 'Mathematics'));
        const remarks = isAbsent
          ? 'Absent'
          : (val !== '' && val !== null && Number(val) >= newExam.passingMarks)
            ? 'Passed'
            : (val !== '' && val !== null) ? 'Needs improvement' : 'Pending';

        newMarkRecords.push({
          id: nextMarkId++,
          examId: newExamId,
          studentId: s.id,
          subject: subject,
          marksObtained: isAbsent ? 'AB' : val,
          isAbsent: isAbsent,
          remarks: remarks
        });
      });

      onSaveData({
        ...data,
        exams: [newExam, ...exams],
        marks: [...marks, ...newMarkRecords]
      });

      setVirtualMarks(prev => {
        const next = { ...prev };
        delete next[virtualKey];
        return next;
      });

      setSelectedExamId(newExamId);
      logger.action(
        currentUser,
        'CREATE_AND_SAVE_EXAM',
        `Created test "${newExam.title}" for ${selectedClass} and saved ${newMarkRecords.length} marks directly from dropdown`,
        { examId: newExamId, classCode: selectedClass }
      );
    } else {
      onSaveData({
        ...data,
        marks: [...marks]
      });
    }

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2500);
    }, 400);
  };

  // Update student-specific subject for this exam (independent per student!)
  const handleSubjectChange = (studentId, newSubject) => {
    if (!currentExam || !newSubject) return;

    if (currentExam.isVirtual) {
      setVirtualMarks(prev => {
        const classWeek = prev[virtualKey] || {};
        const existingStudent = classWeek[studentId] || {
          marksObtained: '',
          isAbsent: false,
          remarks: 'Pending'
        };
        return {
          ...prev,
          [virtualKey]: {
            ...classWeek,
            [studentId]: {
              ...existingStudent,
              subject: newSubject.trim()
            }
          }
        };
      });
      setSaveStatus('dirty');
      return;
    }

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

  // Batch helper: Set all students in this class to one subject in 1 click
  const handleSetAllStudentsSubject = (newSubject) => {
    if (!currentExam || !newSubject) return;

    if (currentExam.isVirtual) {
      setVirtualMarks(prev => {
        const classWeek = { ...(prev[virtualKey] || {}) };
        examStudents.forEach(s => {
          classWeek[s.id] = {
            ...(classWeek[s.id] || { marksObtained: '', isAbsent: false, remarks: 'Pending' }),
            subject: newSubject.trim()
          };
        });
        return {
          ...prev,
          [virtualKey]: classWeek
        };
      });
      setSaveStatus('dirty');
      return;
    }

    let updatedMarks = [...marks];
    examStudents.forEach(s => {
      const idx = updatedMarks.findIndex(m => m.examId === currentExam.id && m.studentId === s.id);
      if (idx >= 0) {
        updatedMarks[idx] = { ...updatedMarks[idx], subject: newSubject.trim() };
      } else {
        updatedMarks.push({
          id: generateNextId(updatedMarks),
          examId: currentExam.id,
          studentId: s.id,
          subject: newSubject.trim(),
          marksObtained: '',
          remarks: 'Pending'
        });
      }
    });

    onSaveData({
      ...data,
      marks: updatedMarks
    });
  };

  // Change Max and Pass marks for current exam directly from pill dropdown
  const handleUpdateExamMarksRule = (newTot, newPass) => {
    if (!currentExam) return;
    if (currentExam.isVirtual) {
      setCustomVirtualRules(prev => ({
        ...prev,
        [virtualKey]: {
          ...(prev[virtualKey] || {}),
          totalMarks: newTot,
          passingMarks: newPass
        }
      }));
    } else {
      const updatedExams = exams.map(e => {
        if (e.id === currentExam.id) {
          return { ...e, totalMarks: newTot, passingMarks: newPass };
        }
        return e;
      });
      onSaveData({
        ...data,
        exams: updatedExams
      });
    }
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
    const isAbsent = mark?.isAbsent || mark?.marksObtained === 'AB';
    const marksObtained = mark ? (isAbsent ? 'AB' : Number(mark.marksObtained)) : 0;
    const totalMarks = Number(exam.totalMarks) || 50;
    const passingMarks = Number(exam.passingMarks) || 18;
    const pct = isAbsent ? 'Absent' : `${Math.round((Number(marksObtained) / totalMarks) * 100)}%`;
    const isPassed = !isAbsent && Number(marksObtained) >= passingMarks;
    const studentSubject = mark?.subject || exam.subject;
    const grade = isAbsent ? 'Absent' : `Grade ${getGrade(Number(marksObtained), totalMarks).grade}`;
    const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
    const remarks = mark?.remarks || (isAbsent ? 'Student was absent for this test.' : (isPassed ? 'Good effort! Continue consistent daily problem practice.' : 'Needs improvement'));

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
      isAbsent ? `*Score:* ABSENT (Leave Recorded)` : `*Marks Obtained:* ${marksObtained} / ${totalMarks} (${pct})`,
      `*Grade:* ${grade}`,
      `*Status:* ${isAbsent ? 'ABSENT' : (isPassed ? 'PASSED' : 'Needs Revision')}`,
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
    const isAbsent = mark?.isAbsent || mark?.marksObtained === 'AB';
    const marksObtained = mark ? (isAbsent ? 'AB' : Number(mark.marksObtained)) : 0;
    const totalMarks = Number(exam.totalMarks) || 50;
    const passingMarks = Number(exam.passingMarks) || 18;
    const pct = isAbsent ? 'Absent' : `${Math.round((Number(marksObtained) / totalMarks) * 100)}%`;
    const isPassed = !isAbsent && Number(marksObtained) >= passingMarks;
    const studentSubject = mark?.subject || exam.subject;
    const grade = isAbsent ? 'Absent' : `Grade ${getGrade(Number(marksObtained), totalMarks).grade}`;
    const className = classes.find(c => c.code === student.classCode)?.name || student.classCode;
    const remarks = mark?.remarks || (isAbsent ? 'Student was absent for this test.' : (isPassed ? 'Good effort! Continue consistent practice.' : 'Needs focused revision and mistake practice.'));

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
      isAbsent ? `*Score:* ABSENT (Leave Recorded)` : `*Marks Obtained:* ${marksObtained} / ${totalMarks} (${pct})`,
      `*Grade:* ${grade}`,
      `*Status:* ${isAbsent ? 'ABSENT' : (isPassed ? 'PASSED' : 'Needs Support / Revision')}`,
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
          className="btn btn-primary flex items-center gap-2" 
          onClick={() => handleOpenCreateModal()}
          title="Schedule Week 1–5 Test for all classes at once"
        >
          <Sparkles size={16} />
          <span>Create New Test (Week 1–5 / All Classes)</span>
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

      {/* Exam Lifecycle Status Tabs */}
      <div className="exam-lifecycle-tabs-card glass-card">
        <div className="exam-tabs-row">
          <div className="exam-tabs-pills">
            <button
              type="button"
              className={`exam-tab-pill ${examTabFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setExamTabFilter('ACTIVE')}
            >
              <span className="tab-pill-dot active-dot" />
              <span>Active Tests (Grading)</span>
              <span className="tab-pill-count">{activeClassExams.length}</span>
            </button>

            <button
              type="button"
              className={`exam-tab-pill ${examTabFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setExamTabFilter('COMPLETED')}
            >
              <CheckCircle2 size={13} className="text-emerald" />
              <span>Completed & Graded (Archives)</span>
              <span className="tab-pill-count">{completedClassExams.length}</span>
            </button>

            <button
              type="button"
              className={`exam-tab-pill ${examTabFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setExamTabFilter('ALL')}
            >
              <FileText size={13} />
              <span>All Tests</span>
              <span className="tab-pill-count">{allClassExams.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="glass-card exam-selectors-card">
        <div className="exam-selectors-grid">
          <div className="form-group mb-0">
            <label className="form-label">Standard (Class 1 to 10)</label>
            <select 
              className="form-select font-semibold"
              value={selectedClass}
              onChange={(e) => {
                const cls = e.target.value;
                setSelectedClass(cls);
              }}
            >
              {accessibleClasses.map(cls => (
                <option key={cls.code} value={cls.code}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0" style={{ minWidth: '320px', flex: 1 }}>
            <label className="form-label">
              Select Test / Exam
              {currentExam?.isVirtual ? (
                <span className="text-3xs text-sky-400 ml-1.5 font-semibold">✨ (Zero Modal Auto-Create Mode)</span>
              ) : currentExam?.status === 'COMPLETED' ? (
                <span className="text-3xs text-emerald ml-1.5">(Completed Test)</span>
              ) : (
                <span className="text-3xs text-amber-300 ml-1.5">(Active Test)</span>
              )}
            </label>
            <select 
              className="form-select font-semibold"
              value={currentExam?.id || ''}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <optgroup label="📅 Saturday Weekly Tests (Month Weeks 1 to 5)">
                {classWeekSlots.filter(s => s.type === 'WEEK').map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {slot.isVirtual ? '✨ ' : (slot.status === 'COMPLETED' ? '✓ ' : '⚡ ')}
                    {slot.title} ({slot.date}) {slot.isVirtual ? '— [Ready to Grade & Save]' : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎯 Foundation & Drill Tests (Basic & Table Tests)">
                {classWeekSlots.filter(s => s.type !== 'WEEK').map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {slot.isVirtual ? '✨ ' : (slot.status === 'COMPLETED' ? '✓ ' : '⚡ ')}
                    {slot.title} {slot.isVirtual ? '— [Ready to Grade & Save]' : `(${slot.date})`}
                  </option>
                ))}
              </optgroup>
              {otherClassExams.length > 0 && (
                <optgroup label="📝 Other Tests / Assessments">
                  {otherClassExams.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.status === 'COMPLETED' ? '✓ ' : '⚡ '}
                      {ex.title} - {ex.subject} ({ex.date})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {currentExam && (
            <div className="exam-meta-pill-box">
              <div className="exam-meta-tag" title="Each student can have their own independent subject in the table below">
                <BookOpen size={14} className="text-sky-400" />
                <span>{currentExam.slotKey === 'TABLE_TEST' ? 'Mathematics (Tables)' : 'Multi-Subject / Per Student'}</span>
              </div>

              {/* Max & Pass Marks Preset Selector */}
              <div className="exam-meta-tag flex items-center gap-1.5" style={{ padding: '3px 10px' }} title="Change Total Marks for this test">
                <span className="text-muted text-xs font-semibold">Max:</span>
                <select
                  className="form-select form-select-xs"
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    width: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  value={currentExam.totalMarks}
                  onChange={(e) => {
                    const newTot = Number(e.target.value);
                    const newPass = Math.round(newTot * 0.36);
                    handleUpdateExamMarksRule(newTot, newPass);
                  }}
                >
                  <option value={20} style={{ background: '#1e293b' }}>20</option>
                  <option value={25} style={{ background: '#1e293b' }}>25</option>
                  <option value={50} style={{ background: '#1e293b' }}>50</option>
                  <option value={100} style={{ background: '#1e293b' }}>100</option>
                </select>
              </div>

              <div className="exam-meta-tag">
                <span>Pass: <strong>{currentExam.passingMarks}</strong></span>
              </div>

              {/* Status Pill */}
              <div className="exam-meta-tag" style={{
                background: currentExam.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                borderColor: currentExam.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)',
                color: currentExam.status === 'COMPLETED' ? '#34D399' : '#FBBF24',
                fontWeight: 700
              }}>
                {currentExam.status === 'COMPLETED' ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Concluded</span>
                  </>
                ) : (
                  <>
                    <span className="pulsing-badge-dot" style={{ width: '6px', height: '6px' }} />
                    <span>Grading / Active</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {saveStatus === 'saved' ? (
                  <span className="badge badge-success text-xs font-semibold flex items-center gap-1">
                    <CheckCircle size={12} />
                    <span>Saved to Cloud</span>
                  </span>
                ) : saveStatus === 'saving' ? (
                  <span className="badge badge-warning text-xs font-semibold flex items-center gap-1">
                    <span>Saving to DB...</span>
                  </span>
                ) : saveStatus === 'dirty' ? (
                  <span className="badge text-xs font-semibold flex items-center gap-1" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    <span>Unsaved Changes</span>
                  </span>
                ) : null}

                {/* Mark as Completed / Reopen Toggle (for saved exams) */}
                {!currentExam.isVirtual && (
                  currentExam.status === 'COMPLETED' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggleExamStatus(currentExam)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title="Reopen this test for editing and grading"
                    >
                      <Sparkles size={13} className="text-amber" />
                      <span>Reopen Test</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => handleToggleExamStatus(currentExam)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#059669', borderColor: '#10B981' }}
                      title="Finish test & move to completed archives"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark as Completed</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveAllMarks}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#4F46E5', borderColor: '#6366F1', fontWeight: 700 }}
                  title={currentExam.isVirtual ? 'Creates this exam and saves all entered student marks to Cloud' : 'Save all marks to Cloud'}
                >
                  <CheckCircle2 size={13} />
                  <span>{currentExam.isVirtual ? 'Save Marks (Create Test)' : 'Save Marks'}</span>
                </button>

                {!currentExam.isVirtual ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditExam(currentExam)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title="Edit Test Details (Name, Date, Max Marks)"
                    >
                      <Edit size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirmExam(currentExam)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      title="Delete this test"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (virtualMarks[virtualKey]) {
                        if (window.confirm('Clear all unsaved marks entered for this week slot?')) {
                          setVirtualMarks(prev => {
                            const next = { ...prev };
                            delete next[virtualKey];
                            return next;
                          });
                          setSaveStatus('idle');
                        }
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', opacity: virtualMarks[virtualKey] ? 1 : 0.4 }}
                    disabled={!virtualMarks[virtualKey]}
                    title="Clear unsaved marks for this week slot"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Class Exam Performance Statistics Header Bar */}
      {currentExam && examStats && (
        <div className="glass-card exam-stats-banner">
          <div className="exam-stat-item">
            <div className="stat-label flex items-center justify-between">
              <span>Class Students</span>
              <span className="text-3xs text-secondary font-mono">
                {examStats.graded}/{examStats.total} Graded
              </span>
            </div>
            <div className="stat-value text-white">
              {examStats.total} <span className="stat-subtext">Students</span>
            </div>
            <div className="stat-footnote">
              {examStats.absent > 0 && <span className="text-amber font-semibold">{examStats.absent} Absent • </span>}
              {examStats.pending > 0 ? (
                <span className="text-rose font-medium">{examStats.pending} Ungraded</span>
              ) : (
                <span className="text-emerald font-medium">✓ All Graded</span>
              )}
            </div>
          </div>

          <div className="exam-stat-item">
            <div className="stat-label">Class Average Score</div>
            <div className="stat-value text-white">
              {examStats.avgScore} <span className="stat-subtext">/ {currentExam.totalMarks}</span>
            </div>
            <div className="stat-footnote">
              <span className="text-sky font-semibold">{examStats.avgPct}% Average</span> across class
            </div>
          </div>

          <div className="exam-stat-item">
            <div className="stat-label">Highest Score</div>
            <div className="stat-value text-amber-400">
              {examStats.highest !== null ? `${examStats.highest} / ${currentExam.totalMarks}` : '—'}
            </div>
            <div className="stat-footnote truncate">
              {examStats.highestStudent ? `Top: ${examStats.highestStudent}` : 'Pending marks'}
            </div>
          </div>

          <div className="exam-stat-item">
            <div className="stat-label flex items-center justify-between">
              <span>Pass Rate</span>
              {examStats.pending > 0 && (
                <button
                  type="button"
                  className="quick-absent-fill-link"
                  onClick={handleMarkUnmarkedAbsent}
                  title="Automatically mark all remaining ungraded students as Absent"
                >
                  Mark {examStats.pending} as Absent
                </button>
              )}
            </div>
            <div className="stat-value text-emerald">
              {examStats.passRate}%
            </div>
            <div className="stat-footnote">
              <span className="font-semibold">{examStats.passed}</span> of {examStats.graded} evaluated passed
            </div>
          </div>
        </div>
      )}

      {/* Marks Entry Table */}
      {currentExam ? (
        <div className="table-container">
          <div className="table-hints-bar">
            <span className="hint-pill">💡 <strong>Excel Navigation:</strong> Press <code>Enter</code> or <code>↓</code> to jump to next student.</span>
            <span className="hint-pill">🌴 <strong>Absent:</strong> Click <code>AB</code> to mark student absent without giving 0%.</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>
                  <div className="flex items-center gap-2">
                    <span>Subject</span>
                    <select
                      className="form-select form-select-xs"
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        width: 'auto',
                        background: 'rgba(30, 41, 59, 0.9)',
                        borderColor: 'rgba(99, 102, 241, 0.5)',
                        color: '#93C5FD',
                        cursor: 'pointer'
                      }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSetAllStudentsSubject(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      title="Set all students in this class to this subject in 1 click"
                    >
                      <option value="" disabled>Set All To... ▼</option>
                      {availableClassSubjects.map((subj, idx) => (
                        <option key={idx} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th>School</th>
                <th style={{ width: '180px' }}>Marks (/{currentExam.totalMarks})</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th style={{ textAlign: 'center' }}>Scorecard & Share</th>
              </tr>
            </thead>
            <tbody>
              {examStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No students currently enrolled in {classes.find(c => c.code === currentExam.classCode)?.name || selectedClass}.
                  </td>
                </tr>
              ) : (
                examStudents.map((student, idx) => {
                  const markRecord = currentExam.isVirtual
                    ? (virtualMarks[virtualKey]?.[student.id] || { marksObtained: '', isAbsent: false, subject: availableClassSubjects[0] || 'Mathematics', remarks: 'Pending' })
                    : marks.find(m => m.examId === currentExam.id && m.studentId === student.id);
                  const isAbsent = markRecord?.isAbsent || markRecord?.marksObtained === 'AB';
                  const marksVal = markRecord ? (isAbsent ? '' : markRecord.marksObtained) : '';
                  const hasMarks = !isAbsent && markRecord !== undefined && markRecord.marksObtained !== null && markRecord.marksObtained !== '' && !isNaN(Number(markRecord.marksObtained));
                  const pct = hasMarks ? Math.round((Number(marksVal) / currentExam.totalMarks) * 100) : null;
                  const gradeInfo = hasMarks ? getGrade(Number(marksVal), currentExam.totalMarks) : null;
                  const studentSubject = markRecord?.subject || availableClassSubjects[0] || 'Mathematics';
                  const isCustomSubject = markRecord?.subject && markRecord.subject !== availableClassSubjects[0];

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
                          {availableClassSubjects.map((subj, sIdx) => (
                            <option key={sIdx} value={subj}>{subj}</option>
                          ))}
                          {isCustomSubject && !availableClassSubjects.includes(markRecord.subject) && (
                            <option value={markRecord.subject}>{markRecord.subject} (Custom)</option>
                          )}
                          <option value="__CUSTOM__">✏️ Other / Custom Subject...</option>
                        </select>
                      </td>

                      <td className="text-xs text-secondary">{student.school || '—'}</td>
                      <td>
                        <div className="mark-input-group">
                          <input 
                            ref={el => (markInputsRef.current[student.id] = el)}
                            type="text"
                            inputMode="numeric"
                            className={`form-input mark-input-cell ${isAbsent ? 'input-absent' : ''}`}
                            placeholder={isAbsent ? 'AB' : '0'}
                            disabled={isAbsent}
                            value={isAbsent ? 'AB' : marksVal}
                            onKeyDown={(e) => handleKeyDownMarks(e, idx)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.toUpperCase() === 'AB') {
                                handleToggleAbsent(student.id);
                              } else {
                                handleMarkChange(student.id, val);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className={`btn-absent-toggle ${isAbsent ? 'active' : ''}`}
                            onClick={() => handleToggleAbsent(student.id)}
                            title={isAbsent ? 'Click to unmark absent' : 'Mark student as Absent'}
                          >
                            {isAbsent ? 'ABS' : 'AB'}
                          </button>
                        </div>
                      </td>
                      <td>
                        {isAbsent ? (
                          <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
                            Absent
                          </span>
                        ) : pct !== null ? (
                          <span className="font-bold text-white">{pct}%</span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {isAbsent ? (
                          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                            Leave
                          </span>
                        ) : gradeInfo ? (
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
                            onClick={() => {
                              if (currentExam.isVirtual) {
                                handleSaveAllMarks();
                              }
                              setReportCardStudent({ student, exam: currentExam, mark: markRecord });
                            }}
                            disabled={!hasMarks && !isAbsent}
                            title="View Full Printable Scorecard"
                          >
                            <FileText size={13} />
                            <span>Scorecard</span>
                          </button>
                          {!isTeacher && (
                            <button 
                              className="btn btn-sm"
                              onClick={() => {
                                if (currentExam.isVirtual) {
                                handleSaveAllMarks();
                              }
                              setReportCardStudent({ student, exam: currentExam, mark: markRecord, autoShare: true });
                            }}
                            disabled={!hasMarks && !isAbsent}
                            title={`Send Scorecard Card to ${student.parentName || 'Parent'} via WhatsApp`}
                            style={{ 
                              background: '#10B981', 
                              color: 'white', 
                              border: 'none', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              opacity: (hasMarks || isAbsent) ? 1 : 0.4,
                              cursor: (hasMarks || isAbsent) ? 'pointer' : 'not-allowed'
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
            onClick={() => handleOpenCreateModal(selectedClass)}
          >
            <Plus size={16} />
            <span>Schedule Test for {classes.find(c => c.code === selectedClass)?.name || selectedClass}</span>
          </button>
        </div>
      )}

      {/* Create Exam Modal - 1-Click Week 1-5 & Multi-Class Scheduling */}
      {newExamModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title flex items-center gap-2">
                  <Sparkles size={20} className="text-amber" />
                  <span>Schedule Test / Exam</span>
                </h2>
                <p className="text-3xs text-muted mt-0.5">Quickly schedule Saturday slip tests across Week 1–5 for all classes at once</p>
              </div>
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
                  ⚠️ Please resolve the highlighted fields to schedule this test.
                </div>
              )}

              {/* 1. Fast Week 1 - Week 5 Selector Banner */}
              <div className="exam-week-banner mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0 flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <Calendar size={13} className="text-amber" />
                    <span>Select Week (Saturday Weekly Slip Tests):</span>
                  </label>
                  <span className="text-3xs text-muted">Auto-fills Saturday date &amp; title</span>
                </div>

                {/* 1-Tap Week Pills */}
                <div className="week-pills-cluster flex items-center gap-2 flex-wrap mb-3">
                  {[1, 2, 3, 4, 5].map((wn) => {
                    const isSelected = newExamData.week === `WEEK_${wn}`;
                    const satDate = getSaturdayForWeek(wn);
                    return (
                      <button
                        key={wn}
                        type="button"
                        className={`week-pill-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectWeek(wn)}
                        title={`Week ${wn} (Saturday: ${satDate})`}
                      >
                        <span className="week-pill-badge">{isSelected ? '✓' : '⚡'}</span>
                        <span className="font-bold">Week {wn}</span>
                        <span className="week-pill-date">({satDate.split('-').slice(1).join('/')})</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className={`week-pill-btn ${newExamData.week === 'BASIC_TEST' ? 'active' : ''}`}
                    onClick={() => {
                      setNewExamData(prev => ({
                        ...prev,
                        week: 'BASIC_TEST',
                        title: 'Basic Test',
                        totalMarks: 25,
                        passingMarks: 9,
                        date: new Date().toISOString().split('T')[0]
                      }));
                    }}
                    title="Basic Foundation / Arithmetic Test"
                  >
                    <span>🎯 Basic Test</span>
                  </button>
                  <button
                    type="button"
                    className={`week-pill-btn ${newExamData.week === 'TABLE_TEST' ? 'active' : ''}`}
                    onClick={() => {
                      setNewExamData(prev => ({
                        ...prev,
                        week: 'TABLE_TEST',
                        title: 'Table Test',
                        subject: 'Mathematics',
                        totalMarks: 20,
                        passingMarks: 7,
                        date: new Date().toISOString().split('T')[0]
                      }));
                    }}
                    title="Tables 1–20 Mathematics Drill Test"
                  >
                    <span>🔢 Table Test</span>
                  </button>
                  <button
                    type="button"
                    className={`week-pill-btn ${newExamData.week === 'CUSTOM' ? 'active' : ''}`}
                    onClick={() => {
                      setNewExamData(prev => ({ ...prev, week: 'CUSTOM' }));
                    }}
                    title="Custom or Unit Test"
                  >
                    <span>📝 Custom / Unit Test</span>
                  </button>
                </div>

                {/* Week & Subject Dropdown Grid */}
                <div className="form-grid-2">
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Test Period / Week *</label>
                    <select
                      className="form-select"
                      value={newExamData.week || 'WEEK_1'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setNewExamData(prev => ({ ...prev, week: 'CUSTOM' }));
                        } else if (val === 'BASIC_TEST') {
                          setNewExamData(prev => ({
                            ...prev,
                            week: 'BASIC_TEST',
                            title: 'Basic Test',
                            totalMarks: 25,
                            passingMarks: 9,
                            date: new Date().toISOString().split('T')[0]
                          }));
                        } else if (val === 'TABLE_TEST') {
                          setNewExamData(prev => ({
                            ...prev,
                            week: 'TABLE_TEST',
                            title: 'Table Test',
                            subject: 'Mathematics',
                            totalMarks: 20,
                            passingMarks: 7,
                            date: new Date().toISOString().split('T')[0]
                          }));
                        } else {
                          handleSelectWeek(val.replace('WEEK_', ''));
                        }
                      }}
                    >
                      <option value="WEEK_1">📅 Week 1 (1st Saturday Test)</option>
                      <option value="WEEK_2">📅 Week 2 (2nd Saturday Test)</option>
                      <option value="WEEK_3">📅 Week 3 (3rd Saturday Test)</option>
                      <option value="WEEK_4">📅 Week 4 (4th Saturday Test)</option>
                      <option value="WEEK_5">📅 Week 5 (5th Saturday Test)</option>
                      <option value="BASIC_TEST">🎯 Basic Test</option>
                      <option value="TABLE_TEST">🔢 Table Test (Multiplication)</option>
                      <option value="CUSTOM">📝 Custom / Unit Test / Mid-Term</option>
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Subject *</label>
                    <select
                      className={`form-select ${examErrors.subject ? 'input-error' : ''}`}
                      value={['Mathematics', 'Science', 'Social Studies', 'English', 'Telugu', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Computer'].includes(newExamData.subject) ? newExamData.subject : (newExamData.subject ? '__CUSTOM__' : 'Mathematics')}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setNewExamData(prev => ({ ...prev, subject: '__CUSTOM__' }));
                        } else {
                          handleSelectSubject(e.target.value);
                        }
                      }}
                    >
                      <option value="Mathematics">📐 Mathematics</option>
                      <option value="Science">🔬 Science (General / Physical / Bio)</option>
                      <option value="Social Studies">🌍 Social Studies</option>
                      <option value="English">📖 English</option>
                      <option value="Telugu">🔤 Telugu</option>
                      <option value="Hindi">🇮🇳 Hindi</option>
                      <option value="Physics">⚡ Physics</option>
                      <option value="Chemistry">🧪 Chemistry</option>
                      <option value="Biology">🌱 Biology</option>
                      <option value="Computer">💻 Computer Science</option>
                      <option value="__CUSTOM__">✏️ Type Custom Subject...</option>
                    </select>
                    {newExamData.subject === '__CUSTOM__' && (
                      <input
                        type="text"
                        className="form-input mt-2"
                        placeholder="Type custom subject name (e.g. Sanskrit, EVS)..."
                        value={newExamData.customSubject}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewExamData(prev => {
                            const wn = prev.week && prev.week !== 'CUSTOM' ? prev.week.replace('WEEK_', '') : getCurrentWeekOfMonth();
                            const isStandardTitle = !prev.title || prev.title.startsWith('Week ') || prev.title.includes('Test -');
                            return {
                              ...prev,
                              customSubject: val,
                              title: isStandardTitle && val ? `Week ${wn} Test - ${val}` : prev.title
                            };
                          });
                          if (examErrors.subject) setExamErrors(p => ({ ...p, subject: null }));
                        }}
                        autoFocus
                      />
                    )}
                    {examErrors.subject && (
                      <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        {examErrors.subject}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Target Classes Section - Batch create for all classes */}
              <div className="target-classes-section mb-3">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <label className="form-label mb-0 flex items-center gap-1.5 text-xs text-indigo-300 font-bold">
                      <Users size={14} className="text-primary-500" />
                      <span>Target Classes / Standards:</span>
                    </label>
                    <span className="text-3xs text-muted">Schedule for all classes simultaneously or select one</span>
                  </div>

                  {/* Toggle between All Classes and Single Class */}
                  <div className="class-mode-toggle flex items-center gap-1 bg-surface p-1 rounded-lg border border-subtle">
                    <button
                      type="button"
                      className={`mode-toggle-btn ${newExamData.targetMode === 'ALL_CLASSES' ? 'active' : ''}`}
                      onClick={() => {
                        setNewExamData(prev => ({
                          ...prev,
                          targetMode: 'ALL_CLASSES',
                          selectedClasses: accessibleClasses.map(c => c.code)
                        }));
                        if (examErrors.targetClasses) setExamErrors(p => ({ ...p, targetClasses: null }));
                      }}
                    >
                      🚀 All Classes ({accessibleClasses.length})
                    </button>
                    <button
                      type="button"
                      className={`mode-toggle-btn ${newExamData.targetMode === 'SINGLE_CLASS' ? 'active' : ''}`}
                      onClick={() => {
                        setNewExamData(prev => ({
                          ...prev,
                          targetMode: 'SINGLE_CLASS'
                        }));
                        if (examErrors.targetClasses) setExamErrors(p => ({ ...p, targetClasses: null }));
                      }}
                    >
                      🎯 Single Class
                    </button>
                  </div>
                </div>

                {newExamData.targetMode === 'SINGLE_CLASS' ? (
                  <div className="form-group mb-0">
                    <select
                      className="form-select"
                      value={newExamData.classCode}
                      onChange={(e) => {
                        setNewExamData(prev => ({ ...prev, classCode: e.target.value }));
                      }}
                    >
                      {accessibleClasses.map(cls => (
                        <option key={cls.code} value={cls.code}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    {/* Quick filter helpers */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap text-3xs">
                      <span className="text-muted">Quick filters:</span>
                      <button
                        type="button"
                        className="text-amber-300 hover:underline"
                        onClick={() => setNewExamData(prev => ({ ...prev, selectedClasses: accessibleClasses.map(c => c.code) }))}
                      >
                        Select All ({accessibleClasses.length})
                      </button>
                      <span className="text-muted">•</span>
                      <button
                        type="button"
                        className="text-amber-300 hover:underline"
                        onClick={() => {
                          const highSchool = accessibleClasses.filter(c => ['CLASS_6', 'CLASS_7', 'CLASS_8', 'CLASS_9', 'CLASS_10'].includes(c.code)).map(c => c.code);
                          setNewExamData(prev => ({ ...prev, selectedClasses: highSchool }));
                        }}
                      >
                        Classes 6 to 10 (High School)
                      </button>
                      <span className="text-muted">•</span>
                      <button
                        type="button"
                        className="text-amber-300 hover:underline"
                        onClick={() => {
                          const primary = accessibleClasses.filter(c => ['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5'].includes(c.code)).map(c => c.code);
                          setNewExamData(prev => ({ ...prev, selectedClasses: primary }));
                        }}
                      >
                        Classes 1 to 5 (Primary)
                      </button>
                    </div>

                    {/* Class Chips Grid */}
                    <div className="class-chips-grid">
                      {accessibleClasses.map(cls => {
                        const isChecked = (newExamData.selectedClasses || []).includes(cls.code);
                        return (
                          <button
                            key={cls.code}
                            type="button"
                            className={`class-chip-pill ${isChecked ? 'active' : ''}`}
                            onClick={() => {
                              const current = newExamData.selectedClasses || [];
                              const updated = isChecked 
                                ? current.filter(c => c !== cls.code)
                                : [...current, cls.code];
                              setNewExamData(prev => ({ ...prev, selectedClasses: updated }));
                              if (examErrors.targetClasses) setExamErrors(p => ({ ...p, targetClasses: null }));
                            }}
                          >
                            <span className="chip-indicator">{isChecked ? '✓' : '+'}</span>
                            <span>{cls.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {examErrors.targetClasses && (
                      <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                        {examErrors.targetClasses}
                      </span>
                    )}

                    <div className="mt-2 text-xs text-indigo-200 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-300" />
                      <span>
                        Creates this test simultaneously for <strong>{(newExamData.selectedClasses || []).length} classes</strong> in 1 click!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Generated Title & Customization */}
              <div className="form-group mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0 text-xs">Test Title *</label>
                  <span className="text-3xs text-muted">Auto-generated from Week &amp; Subject</span>
                </div>
                <input 
                  type="text"
                  className={`form-input ${examErrors.title ? 'input-error' : ''}`}
                  placeholder="e.g. Week 1 Test - Mathematics"
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

              {/* 4. Marks & Date Grid */}
              <div className="form-grid-3 mb-3">
                <div className="form-group mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0 text-xs">Total Marks *</label>
                    <div className="flex items-center gap-1">
                      {[25, 50, 100].map(m => (
                        <button
                          key={m}
                          type="button"
                          className={`marks-preset-btn ${Number(newExamData.totalMarks) === m ? 'active' : ''}`}
                          onClick={() => {
                            const pass = m === 25 ? 9 : (m === 50 ? 18 : 35);
                            setNewExamData(prev => ({ ...prev, totalMarks: m, passingMarks: pass }));
                          }}
                        >
                          {m}M
                        </button>
                      ))}
                    </div>
                  </div>
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

                <div className="form-group mb-0">
                  <label className="form-label text-xs">Passing Marks *</label>
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

                <div className="form-group mb-0">
                  <label className="form-label text-xs">Test Date (Saturday) *</label>
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
              </div>

              <div className="modal-actions-flex">
                <button type="button" className="btn btn-secondary" onClick={() => { setNewExamModalOpen(false); setExamErrors({}); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '220px' }}>
                  {newExamData.targetMode === 'SINGLE_CLASS' ? (
                    <>
                      <Plus size={16} />
                      <span>Create Test ({classes.find(c => c.code === newExamData.classCode)?.name || 'Class'})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Create Test for {(newExamData.selectedClasses || []).length} Classes 🚀</span>
                    </>
                  )}
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

      {/* Delete Exam Confirmation Modal with History Protection */}
      {deleteConfirmExam && (() => {
        const marksInDeleteExam = marks.filter(m => m.examId === deleteConfirmExam.id && m.marksObtained !== '' && m.marksObtained !== null);
        const hasScores = marksInDeleteExam.length > 0;

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '460px' }}>
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
                
                {hasScores ? (
                  <>
                    <div style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>
                      <div className="font-bold mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={15} />
                        <span>DANGER: {marksInDeleteExam.length} student scores recorded!</span>
                      </div>
                      <span>Deleting this test will permanently destroy all student marks and report card histories for this test.</span>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '8px', color: '#FCD34D', fontSize: '0.8rem', marginBottom: '12px' }}>
                      💡 <strong>Recommended:</strong> Instead of deleting, click <em>"Archive as Completed"</em>. It will keep all student scores 100% safe while clearing this test from your active list.
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem' }}>
                    No marks have been recorded for this test yet. Safe to delete draft.
                  </div>
                )}
              </div>

              <div className="modal-actions-flex" style={{ flexDirection: 'column', gap: '8px' }}>
                {hasScores && (
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => {
                      handleToggleExamStatus(deleteConfirmExam);
                      setDeleteConfirmExam(null);
                    }}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Archive as Completed (Keep Marks Safe)</span>
                  </button>
                )}

                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => setDeleteConfirmExam(null)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger flex-1"
                    onClick={() => handleDeleteExam(deleteConfirmExam)}
                  >
                    {hasScores ? 'Delete & Erase Marks' : 'Yes, Delete Test'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Student Performance Scorecard Modal */}
      {reportCardStudent && (() => {
        const student = reportCardStudent.student;
        const exam = reportCardStudent.exam;
        const mark = reportCardStudent.mark;
        const isAbsent = mark?.isAbsent || mark?.marksObtained === 'AB';
        const marksObtained = isAbsent ? 'AB' : (mark ? Number(mark.marksObtained) : 0);
        const totalMarks = Number(exam.totalMarks) || 50;
        const passingMarks = Number(exam.passingMarks) || 18;
        const pct = isAbsent ? null : Math.round((Number(marksObtained) / totalMarks) * 100);
        const isPassed = !isAbsent && Number(marksObtained) >= passingMarks;
        const gradeInfo = !isAbsent ? getGrade(Number(marksObtained), totalMarks) : null;
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
                  <div className="score-circle" style={isAbsent ? { background: '#D97706' } : {}}>
                    <div className="score-num" style={isAbsent ? { fontSize: '1.25rem' } : {}}>{marksObtained}</div>
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
                      {isAbsent ? (
                        <span className="badge badge-warning" style={{ background: '#F59E0B25', color: '#D97706', borderColor: '#F59E0B50' }}>
                          Status: ABSENT (Leave Recorded)
                        </span>
                      ) : gradeInfo ? (
                        <>
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
                          <span className="text-xs font-bold text-slate-700">
                            {isPassed ? 'Status: PASSED' : 'Status: Needs Revision'}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Tutor Remarks */}
                <div className="scorecard-teacher-remarks">
                  <strong>Tutor Remarks:</strong> {mark?.remarks || (isAbsent ? 'Student was absent for this test.' : isPassed ? 'Good effort! Continue consistent practice.' : 'Needs improvement')}
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

        /* Exam Lifecycle Tabs */
        .exam-lifecycle-tabs-card {
          padding: 8px 12px;
          border-radius: var(--radius-md);
        }
        .exam-tabs-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .exam-tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .exam-tab-pill:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #FFFFFF;
        }
        .exam-tab-pill.active {
          background: rgba(99, 102, 241, 0.18);
          border-color: rgba(99, 102, 241, 0.5);
          color: #A5B4FC;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
        }
        .tab-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #F59E0B;
        }
        .active-dot {
          box-shadow: 0 0 8px #F59E0B;
          animation: pulse 1.5s infinite;
        }
        .tab-pill-count {
          padding: 1px 7px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.72rem;
          font-weight: 700;
        }

        /* Class Exam Performance Summary Banner */
        .exam-stats-banner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 16px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .exam-stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          padding-right: 12px;
        }
        .exam-stat-item:last-child {
          border-right: none;
        }
        .stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .stat-value {
          font-size: 1.35rem;
          font-weight: 800;
          font-family: var(--font-heading);
          line-height: 1.2;
        }
        .stat-subtext {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .stat-footnote {
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .quick-absent-fill-link {
          background: transparent;
          border: none;
          color: #FCD34D;
          font-size: 0.68rem;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }
        .quick-absent-fill-link:hover {
          color: #F59E0B;
        }

        /* Table Navigation & Hint Bar */
        .table-hints-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .hint-pill {
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .hint-pill code {
          background: rgba(255, 255, 255, 0.1);
          color: #FCD34D;
          padding: 1px 5px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }

        /* Excel-like Mark Input & Absent Toggle */
        .mark-input-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-absent-toggle {
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-absent-toggle:hover {
          background: rgba(245, 158, 11, 0.15);
          color: #FCD34D;
          border-color: rgba(245, 158, 11, 0.35);
        }
        .btn-absent-toggle.active {
          background: rgba(245, 158, 11, 0.25);
          color: #FCD34D;
          border-color: rgba(245, 158, 11, 0.55);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.25);
        }
        .input-absent {
          background: rgba(245, 158, 11, 0.1) !important;
          color: #FCD34D !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        /* 1-Click Quick Exam Templates */
        .template-pills-row {
          margin-top: 4px;
        }
        .template-pill-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #FCD34D;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .template-pill-btn:hover {
          background: rgba(245, 158, 11, 0.2);
          border-color: #F59E0B;
          transform: translateY(-1px);
        }

        /* Week 1–5 Quick Selector & Multi-Class Scheduling Styles */
        .exam-week-banner {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-md);
          padding: 12px;
        }
        .week-pills-cluster {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }
        .week-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 11px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .week-pill-btn:hover {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.4);
          color: #FCD34D;
          transform: translateY(-1px);
        }
        .week-pill-btn.active {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.22) 100%);
          border-color: #F59E0B;
          color: #FCD34D;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.25);
        }
        .week-pill-badge {
          font-size: 0.75rem;
        }
        .week-pill-date {
          font-size: 0.7rem;
          opacity: 0.8;
        }

        /* Target Classes Multi-Selection */
        .target-classes-section {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: var(--radius-md);
          padding: 12px;
        }
        .class-mode-toggle {
          display: inline-flex;
          gap: 4px;
        }
        .mode-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mode-toggle-btn.active {
          background: var(--primary-600);
          color: #FFFFFF;
        }
        .class-chips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
          gap: 8px;
          margin-top: 6px;
        }
        .class-chip-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .class-chip-pill:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.4);
          color: #EEF2FF;
        }
        .class-chip-pill.active {
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(16, 185, 129, 0.5);
          color: #34D399;
          font-weight: 700;
        }
        .chip-indicator {
          font-size: 0.75rem;
        }
        .marks-preset-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          cursor: pointer;
        }
        .marks-preset-btn.active {
          background: rgba(245, 158, 11, 0.25);
          border-color: #F59E0B;
          color: #FCD34D;
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .form-grid-3 {
            grid-template-columns: 1fr;
          }
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
          width: 80px;
          padding: 6px 8px;
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
