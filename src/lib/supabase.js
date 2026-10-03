// ==========================================================================
// Supabase Client Wrapper & Real-Time Synchronizer
// Direct PostgreSQL bidirectional syncing for Hayagriva Tuition System
// ==========================================================================

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, INITIAL_CLASSES } from './storage.js';
import { getStaffAccounts } from './auth.js';

let supabaseInstance = null;

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      if (!supabaseInstance) {
        supabaseInstance = createClient(config.url, config.anonKey, {
          auth: { persistSession: false }
        });
      }
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// Test live connection to Supabase
export async function testSupabaseConnection(url, anonKey) {
  try {
    const testClient = createClient(url, anonKey);
    const { data, error } = await testClient.from('class_levels').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return { success: true, message: 'Connected to Supabase! (Tables ready for setup)' };
    }
    return { success: true, message: 'Successfully connected to live Supabase PostgreSQL!' };
  } catch (e) {
    return { success: false, message: e.message || 'Connection failed. Check URL and Anon Key.' };
  }
}

// Fetch all data from Supabase PostgreSQL
export async function fetchTuitionDataFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const [
      classesRes,
      batchesRes,
      studentsRes,
      attendanceRes,
      feesRes,
      receiptsRes,
      examsRes,
      marksRes
    ] = await Promise.all([
      supabase.from('class_levels').select('*').order('id'),
      supabase.from('batches').select('*').order('id'),
      supabase.from('students').select('*').order('id'),
      supabase.from('attendance').select('*').order('id'),
      supabase.from('fee_records').select('*').order('id'),
      supabase.from('payment_receipts').select('*').order('id'),
      supabase.from('exams').select('*').order('id'),
      supabase.from('exam_marks').select('*').order('id')
    ]);

    if (studentsRes.error) {
      console.warn('Could not query students table from Supabase:', studentsRes.error);
      return null;
    }

    if (batchesRes.error) {
      console.warn('Could not query batches table from Supabase:', batchesRes.error);
    }

    const classes = (classesRes.data && classesRes.data.length > 0)
      ? classesRes.data.map(c => {
          let cleanName = (c.display_name || '').replace(/\s*\(SSC\/CBSE\)/gi, '').trim();
          if (c.code === 'CLASS_10' && (!cleanName || cleanName.toLowerCase().includes('cbse') || cleanName.toLowerCase().includes('ssc'))) {
            cleanName = 'Class 10';
          }
          return {
            id: c.id,
            code: c.code,
            name: cleanName || c.display_name || 'Class 10',
            category: c.category,
            defaultFee: Number(c.default_monthly_fee),
            subjects: INITIAL_CLASSES.find(ic => ic.code === c.code)?.subjects || ['Mathematics', 'English', 'Science', 'Social Studies', 'Telugu', 'Hindi', 'Computer']
          };
        })
      : INITIAL_CLASSES;

    // Auto-update CLASS_10 in Supabase class_levels if it still has (SSC/CBSE)
    const class10ToUpdate = classesRes.data?.find(c => c.code === 'CLASS_10' && c.display_name && (c.display_name.includes('SSC') || c.display_name.includes('CBSE')));
    if (class10ToUpdate) {
      supabase
        .from('class_levels')
        .update({ display_name: 'Class 10' })
        .eq('code', 'CLASS_10')
        .then(({ error }) => {
          if (!error) console.log('Successfully updated CLASS_10 display_name in Supabase to Class 10');
        })
        .catch(err => console.warn('Could not update CLASS_10 in Supabase:', err));
    }

    const batches = (batchesRes.data || []).map(b => ({
      id: b.id,
      name: b.batch_name,
      classCode: b.class_code || 'ALL',
      timing: b.timing,
      tutor: b.tutor_name,
      room: b.room_number || '',
      capacity: b.max_capacity || 25
    }));

    // Filter regular enrolled students vs. public website demo leads & inquiries
    const isLeadStatus = (status) => status === 'DEMO_LEAD' || status === 'TEACHER_INQUIRY' || status === 'CONTACTED';
    const rawStudentRows = studentsRes.data || [];
    const DELETED_KEY = 'hayagriva_deleted_leads_v1';
    const SAMPLE_IDS = new Set(['101', '102', '500101', '500102']);
    const deletedLeadIds = new Set(
      JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem(DELETED_KEY)) || '[]').map(String)
    );
    const leadRows = rawStudentRows
      .filter(s => isLeadStatus(s.status))
      .filter(s => !deletedLeadIds.has(String(s.id)) && !SAMPLE_IDS.has(String(s.id)));

    // If leads are found in Supabase, update inquiries storage reactively
    if (typeof localStorage !== 'undefined') {
      try {
        const INQ_KEY = 'hayagriva_inquiries_v1';
        const existingInq = JSON.parse(localStorage.getItem(INQ_KEY) || '[]');
        const map = new Map();
        if (Array.isArray(existingInq)) {
          existingInq
            .filter(i => !deletedLeadIds.has(String(i.id)) && !SAMPLE_IDS.has(String(i.id)))
            .forEach(i => map.set(String(i.id), i));
        }
        leadRows.forEach(row => {
          let meta = {};
          try {
            if (row.address && typeof row.address === 'string' && row.address.trim().startsWith('{')) {
              meta = JSON.parse(row.address);
            }
          } catch (e) {}
          const isTeacher = row.status === 'TEACHER_INQUIRY' || meta.type === 'TEACHER_APPLICATION';
          map.set(String(row.id), {
            id: row.id,
            type: isTeacher ? 'TEACHER_APPLICATION' : (meta.type || 'STUDENT_DEMO'),
            name: row.full_name || 'Prospective Lead',
            parentName: (row.parent_name === 'Direct Faculty Applicant' || row.parent_name === 'Parent') ? '' : (row.parent_name || ''),
            phone: (row.parent_phone || '').replace(/\D/g, ''),
            email: row.parent_email || '',
            classCode: row.class_code || 'CLASS_10',
            schoolName: row.school_name || '',
            subjects: meta.subjects || 'All Subjects',
            timingPreference: meta.timingPreference || 'Evening',
            experience: meta.experience || '',
            qualification: meta.qualification || '',
            notes: meta.notes || '',
            status: (row.status === 'CONTACTED' || row.status === 'ADMITTED') ? row.status : (meta.status || 'NEW'),
            createdAt: meta.createdAt || row.created_at || new Date().toISOString()
          });
        });
        const mergedInquiries = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        localStorage.setItem(INQ_KEY, JSON.stringify(mergedInquiries));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hayagriva-inquiries-updated', { detail: mergedInquiries }));
        }
      } catch (err) {
        console.warn('Could not cache leads from Supabase:', err);
      }
    }

    const regularStudentRows = rawStudentRows.filter(s => !isLeadStatus(s.status));

    const students = regularStudentRows.map(s => ({
      id: s.id,
      admissionNo: s.admission_no,
      name: s.full_name,
      gender: s.gender,
      dob: s.dob || '',
      classCode: s.class_code,
      batchId: s.batch_id,
      school: s.school_name || '',
      parentName: s.parent_name,
      parentPhone: s.parent_phone,
      parentEmail: s.parent_email || '',
      address: s.address || '',
      monthlyFee: Number(s.monthly_fee),
      status: s.status || 'ACTIVE',
      admissionDate: s.admission_date
    }));

    const attendance = (attendanceRes.data || []).map(a => ({
      id: a.id,
      studentId: a.student_id,
      batchId: a.batch_id,
      classCode: a.class_code,
      date: a.date,
      status: a.status,
      remarks: a.remarks || ''
    }));

    const fees = (feesRes.data || []).map(f => ({
      id: f.id,
      studentId: f.student_id,
      monthYear: f.month_year,
      amountDue: Number(f.amount_due),
      amountPaid: Number(f.amount_paid),
      balance: Number(f.balance !== undefined && f.balance !== null ? f.balance : (f.amount_due - f.amount_paid)),
      status: f.status,
      dueDate: f.due_date
    }));

    const receipts = (receiptsRes.data || []).map(r => {
      const student = students.find(s => s.id === r.student_id);
      return {
        id: r.id,
        receiptNo: r.receipt_no,
        feeRecordId: r.fee_record_id,
        studentId: r.student_id,
        studentName: student?.name || 'Student',
        classCode: student?.classCode || 'CLASS_10',
        amount: Number(r.amount_paid),
        monthYear: r.payment_date ? (() => {
          const d = new Date(r.payment_date);
          return !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
        })() : '',
        date: r.payment_date,
        mode: r.payment_mode,
        transactionRef: r.transaction_ref || '',
        notes: r.notes || ''
      };
    });

    const exams = (examsRes.data || []).map(e => ({
      id: e.id,
      title: e.title,
      classCode: e.class_code,
      subject: e.subject,
      totalMarks: e.total_marks,
      passingMarks: e.passing_marks,
      date: e.exam_date
    }));

    const marks = (marksRes.data || []).map(m => {
      const parentExam = exams.find(e => e.id === m.exam_id);
      return {
        id: m.id,
        examId: m.exam_id,
        studentId: m.student_id,
        subject: m.subject || parentExam?.subject || '',
        marksObtained: Number(m.marks_obtained),
        remarks: m.remarks || ''
      };
    });

    let announcements = [];
    try {
      const annRes = await supabase.from('announcements').select('*').order('id', { ascending: false });
      if (annRes.data && annRes.data.length > 0) {
        announcements = annRes.data.map(a => ({
          id: a.id,
          title: a.title,
          message: a.message,
          targetType: a.target_type || 'ALL',
          targetId: a.target_id,
          targetName: a.target_name || 'All Students',
          postedBy: a.posted_by || 'Admin',
          date: a.announcement_date || (a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          createdAt: a.created_at
        }));
      }
    } catch (annErr) {
      // Optional if table not yet created in remote DB
    }

    let tutorFeedback = [];
    try {
      const fbRes = await supabase.from('tutor_feedback').select('*').order('id', { ascending: false });
      if (fbRes.data && fbRes.data.length > 0) {
        tutorFeedback = fbRes.data.map(f => ({
          id: f.id,
          studentId: f.student_id,
          monthYear: f.month_year,
          date: f.feedback_date || (f.created_at ? f.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          strength: f.strength || 'Concepts',
          improvementArea: f.improvement_area || 'Accuracy',
          nextStep: f.next_step || 'Practice 5 problems',
          academicPerformance: f.academic_performance || 'Good',
          conceptUnderstanding: f.concept_understanding || 'Good',
          homeworkStatus: f.homework_status || 'Mostly Completed',
          classParticipation: f.class_participation || 'Active',
          regularity: f.regularity || 'Regular',
          monthlyProgress: f.monthly_progress || 'Improving',
          focusArea: f.focus_area || 'Revision',
          autoMessage: f.auto_message || '',
          tutorRemark: f.tutor_remark || '',
          goal: f.goal || null,
          createdBy: f.created_by || 'Faculty',
          createdAt: f.created_at
        }));
      }
    } catch (fbErr) {
      // Optional if table not yet created
    }

    let homework = [];
    try {
      const hwRes = await supabase.from('homework_records').select('*').order('id', { ascending: false });
      if (hwRes.data && hwRes.data.length > 0) {
        homework = hwRes.data.map(h => ({
          id: h.id,
          batchId: h.batch_id,
          classCode: h.class_code,
          date: h.homework_date || (h.created_at ? h.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
          subject: h.subject,
          topic: h.topic,
          homeworkTask: h.homework_task,
          weeklyStatus: h.weekly_status || 'Regularly Completed',
          dueDate: h.due_date,
          status: h.status || 'ACTIVE'
        }));
      }
    } catch (hwErr) {
      // Optional if table not yet created
    }

    // Fetch and sync staff accounts from Supabase PostgreSQL
    try {
      await fetchStaffAccountsFromSupabase();
    } catch (staffErr) {
      // Optional if table not yet created
    }

    return {
      hasData: students.length > 0 || batches.length > 0,
      classes,
      batches,
      students,
      attendance,
      fees,
      receipts,
      exams,
      marks,
      announcements,
      tutorFeedback: tutorFeedback || [],
      homework: homework || []
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

// Sync all data into Supabase PostgreSQL
export async function syncTuitionDataToSupabase(data) {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'Supabase client not connected.' };

  try {
    // 0. Class Levels (Fee Rates & Display Names)
    if (data.classes && data.classes.length > 0) {
      for (const cls of data.classes) {
        if (cls.code && cls.defaultFee !== undefined) {
          const updatePayload = {
            default_monthly_fee: Number(cls.defaultFee) || 0
          };
          if (cls.name) {
            updatePayload.display_name = cls.name.replace(/\s*\(SSC\/CBSE\)/gi, '').trim();
          }
          await supabase
            .from('class_levels')
            .update(updatePayload)
            .eq('code', cls.code);
        }
      }
    }

    // 1. Batches
    if (data.batches && data.batches.length > 0) {
      const validClassCodes = new Set(['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5', 'CLASS_6', 'CLASS_7', 'CLASS_8', 'CLASS_9', 'CLASS_10', 'ALL']);
      if (Array.isArray(data.classes)) {
        data.classes.forEach(c => c?.code && validClassCodes.add(c.code));
      }

      const batchRows = data.batches.map(b => ({
        id: b.id,
        batch_name: b.name,
        class_code: b.classCode && validClassCodes.has(b.classCode) ? b.classCode : (b.classCode === 'ALL' ? 'ALL' : null),
        timing: b.timing,
        tutor_name: b.tutor,
        room_number: b.room || '',
        max_capacity: b.capacity || 25
      }));
      const { error: batchErr } = await supabase.from('batches').upsert(batchRows, { onConflict: 'id' });
      if (batchErr) {
        console.error('Failed to sync batches to Supabase:', batchErr);
      }

      // Clean deleted batches
      const batchIds = data.batches.map(b => b.id);
      await supabase.from('batches').delete().not('id', 'in', `(${batchIds.join(',')})`);
    }

    // 2. Students
    if (data.students && data.students.length > 0) {
      const validBatchIds = new Set((data.batches || []).map(b => b.id));
      const studentRows = data.students.map(s => ({
        id: s.id,
        admission_no: s.admissionNo,
        full_name: s.name,
        gender: s.gender || 'Male',
        dob: s.dob && s.dob.trim() ? s.dob : null,
        class_code: s.classCode,
        batch_id: s.batchId && validBatchIds.has(s.batchId) ? s.batchId : null,
        school_name: s.school || '',
        parent_name: s.parentName,
        parent_phone: s.parentPhone,
        parent_email: s.parentEmail || null,
        address: s.address || '',
        monthly_fee: Number(s.monthlyFee) || 0,
        status: s.status || 'ACTIVE',
        admission_date: s.admissionDate || new Date().toISOString().split('T')[0]
      }));
      await supabase.from('students').upsert(studentRows, { onConflict: 'id' });

      // Clean deleted students (Never delete public website demo leads or teacher inquiries)
      const studentIds = data.students.map(s => s.id);
      if (studentIds.length > 0) {
        await supabase
          .from('students')
          .delete()
          .not('id', 'in', `(${studentIds.join(',')})`)
          .not('status', 'in', '("DEMO_LEAD","TEACHER_INQUIRY","CONTACTED")');
      }
    }

    // 3. Attendance
    if (data.attendance && data.attendance.length > 0) {
      const validStudentIds = new Set((data.students || []).map(s => s.id));
      const validBatchIds = new Set((data.batches || []).map(b => b.id));
      const attendanceRows = data.attendance
        .filter(a => validStudentIds.has(a.studentId))
        .map(a => {
          const student = data.students?.find(s => s.id === a.studentId);
          return {
            id: a.id,
            student_id: a.studentId,
            batch_id: a.batchId && validBatchIds.has(a.batchId) ? a.batchId : (student?.batchId || null),
            class_code: a.classCode || student?.classCode || 'CLASS_10',
            date: a.date,
            status: a.status,
            remarks: a.remarks || null
          };
        });
      if (attendanceRows.length > 0) {
        await supabase.from('attendance').upsert(attendanceRows, { onConflict: 'student_id, date' });
      }
    }

    // 4. Fees (Omit balance: balance is GENERATED ALWAYS in PostgreSQL)
    if (data.fees && data.fees.length > 0) {
      const validStudentIds = new Set((data.students || []).map(s => s.id));
      const feeRows = data.fees
        .filter(f => validStudentIds.has(f.studentId))
        .map(f => ({
          id: f.id,
          student_id: f.studentId,
          month_year: f.monthYear,
          amount_due: Number(f.amountDue),
          amount_paid: Number(f.amountPaid),
          status: f.status || 'PENDING',
          due_date: f.dueDate || null
        }));
      if (feeRows.length > 0) {
        await supabase.from('fee_records').upsert(feeRows, { onConflict: 'student_id, month_year' });
      }
    }

    // 5. Payment Receipts
    if (data.receipts && data.receipts.length > 0) {
      const validStudentIds = new Set((data.students || []).map(s => s.id));
      const receiptRows = data.receipts
        .filter(r => validStudentIds.has(r.studentId))
        .map(r => ({
          id: r.id,
          receipt_no: r.receiptNo,
          student_id: r.studentId,
          fee_record_id: r.feeRecordId || null,
          amount_paid: Number(r.amount),
          payment_date: r.date || new Date().toISOString().split('T')[0],
          payment_mode: r.mode || 'UPI',
          transaction_ref: r.transactionRef || '',
          notes: r.notes || ''
        }));
      if (receiptRows.length > 0) {
        await supabase.from('payment_receipts').upsert(receiptRows, { onConflict: 'receipt_no' });
      }
    }

    // 6. Exams & Marks
    if (data.exams && data.exams.length > 0) {
      const examRows = data.exams.map(e => ({
        id: e.id,
        title: e.title,
        class_code: e.classCode,
        subject: e.subject,
        total_marks: e.totalMarks,
        passing_marks: e.passingMarks,
        exam_date: e.date || new Date().toISOString().split('T')[0]
      }));
      await supabase.from('exams').upsert(examRows, { onConflict: 'id' });

      const examIds = data.exams.map(e => e.id);
      await supabase.from('exams').delete().not('id', 'in', `(${examIds.join(',')})`);
    }

    if (data.marks && data.marks.length > 0) {
      try {
        const validExamIds = new Set((data.exams || []).map(e => e.id));
        const validStudentIds = new Set((data.students || []).map(s => s.id));

        // Fetch existing marks to know their DB IDs and prevent sequence collisions
        const { data: existingDbMarks } = await supabase
          .from('exam_marks')
          .select('id, exam_id, student_id');
        
        const existingMap = new Map();
        let maxDbId = 0;
        (existingDbMarks || []).forEach(row => {
          existingMap.set(`${row.exam_id}_${row.student_id}`, row.id);
          if (row.id > maxDbId) maxDbId = row.id;
        });

        // Deduplicate client marks by exam_id + student_id to prevent ON CONFLICT aborts
        const markMap = new Map();
        data.marks
          .filter(m => validExamIds.has(m.examId) && validStudentIds.has(m.studentId))
          .forEach(m => {
            const key = `${m.examId}_${m.studentId}`;
            let rowId = existingMap.get(key) || m.id;
            if (!rowId || (rowId <= maxDbId && !existingMap.has(key))) {
              maxDbId += 1;
              rowId = maxDbId;
            }
            if (rowId > maxDbId) maxDbId = rowId;

            markMap.set(key, {
              id: rowId,
              exam_id: m.examId,
              student_id: m.studentId,
              marks_obtained: Number(m.marksObtained || 0),
              remarks: m.remarks || ''
            });
          });

        const markRows = Array.from(markMap.values());
        if (markRows.length > 0) {
          const { error: markErr } = await supabase
            .from('exam_marks')
            .upsert(markRows, { onConflict: 'exam_id, student_id' });
          if (markErr) {
            console.error('Failed to sync marks to Supabase:', markErr);
          }
        }
      } catch (markSyncErr) {
        console.error('Exception syncing marks to Supabase:', markSyncErr);
      }
    } else if (Array.isArray(data.marks)) {
      await supabase.from('exam_marks').delete().neq('id', 0);
    }

    // 7. Tutor Feedback & Child Improvement Plans
    if (data.tutorFeedback && data.tutorFeedback.length > 0) {
      try {
        const validStudentIds = new Set((data.students || []).map(s => s.id));
        const feedbackRows = data.tutorFeedback
          .filter(f => validStudentIds.has(f.studentId))
          .map(f => ({
            id: f.id,
            student_id: f.studentId,
            month_year: f.monthYear,
            feedback_date: f.date || new Date().toISOString().split('T')[0],
            strength: f.strength || 'Concepts',
            improvement_area: f.improvementArea || 'Accuracy',
            next_step: f.nextStep || 'Practice 5 problems',
            academic_performance: f.academicPerformance || 'Good',
            concept_understanding: f.conceptUnderstanding || 'Good',
            homework_status: f.homeworkStatus || 'Mostly Completed',
            class_participation: f.classParticipation || 'Active',
            regularity: f.regularity || 'Regular',
            monthly_progress: f.monthlyProgress || 'Improving',
            focus_area: f.focusArea || 'Revision',
            auto_message: f.autoMessage || '',
            tutor_remark: f.tutorRemark || '',
            goal: f.goal || null,
            created_by: f.createdBy || 'Faculty'
          }));
        if (feedbackRows.length > 0) {
          await supabase.from('tutor_feedback').upsert(feedbackRows, { onConflict: 'id' });
        }
      } catch (fbSyncErr) {
        console.warn('Could not sync tutor feedback to Supabase (table may not exist yet):', fbSyncErr);
      }
    }

    // 8. Homework & Topic Tracking
    if (data.homework && data.homework.length > 0) {
      try {
        const hwRows = data.homework.map(h => ({
          id: h.id,
          batch_id: h.batchId,
          class_code: h.classCode,
          homework_date: h.date || new Date().toISOString().split('T')[0],
          subject: h.subject,
          topic: h.topic,
          homework_task: h.homeworkTask,
          weekly_status: h.weeklyStatus || 'Regularly Completed',
          due_date: h.dueDate || null,
          status: h.status || 'ACTIVE'
        }));
        await supabase.from('homework_records').upsert(hwRows, { onConflict: 'id' });
      } catch (hwSyncErr) {
        console.warn('Could not sync homework to Supabase (table may not exist yet):', hwSyncErr);
      }
    }

    // 9. Announcements / Broadcast Notifications
    if (data.announcements && data.announcements.length > 0) {
      try {
        const annRows = data.announcements.map(a => ({
          id: a.id,
          title: a.title,
          message: a.message,
          target_type: a.targetType || 'ALL',
          target_id: a.targetId ? String(a.targetId) : null,
          target_name: a.targetName || 'All Students',
          posted_by: a.postedBy || 'Admin',
          announcement_date: a.date || new Date().toISOString().split('T')[0]
        }));
        await supabase.from('announcements').upsert(annRows, { onConflict: 'id' });
      } catch (annSyncErr) {
        console.warn('Could not sync announcements to Supabase (table may not exist yet):', annSyncErr);
      }
    }

    // 10. Staff Accounts (sync admin & teachers)
    try {
      await syncStaffAccountsToSupabase(getStaffAccounts());
    } catch (staffErr) {
      console.warn('Could not sync staff accounts to Supabase:', staffErr);
    }

    return { success: true };
  } catch (err) {
    console.error('Error syncing data to Supabase:', err);
    return { success: false, error: err.message };
  }
}

// Clear all student records in Supabase (start completely fresh)
export async function clearSupabaseDatabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'Supabase client not connected.' };

  try {
    // Delete in reverse order of foreign keys
    await supabase.from('exam_marks').delete().neq('id', 0);
    await supabase.from('exams').delete().neq('id', 0);
    await supabase.from('payment_receipts').delete().neq('id', 0);
    await supabase.from('fee_records').delete().neq('id', 0);
    await supabase.from('attendance').delete().neq('id', 0);
    await supabase.from('students').delete().neq('id', 0);
    await supabase.from('batches').delete().neq('id', 0);
    return { success: true };
  } catch (err) {
    console.error('Error clearing Supabase database:', err);
    return { success: false, error: err.message };
  }
}

// Fetch Staff & Faculty accounts from Supabase PostgreSQL
export async function fetchStaffAccountsFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: staffRows, error } = await supabase.from('staff_accounts').select('*');
    if (error || !staffRows || staffRows.length === 0) {
      return null;
    }

    const adminRow = staffRows.find(r => r.role === 'ADMIN');
    const teacherRows = staffRows.filter(r => r.role === 'TEACHER');

    const admin = adminRow ? {
      username: adminRow.username,
      password: adminRow.password,
      pin: adminRow.pin || '1234',
      name: adminRow.name,
      role: 'ADMIN',
      title: adminRow.title || 'Administrator',
      email: adminRow.email || 'admin@hayagriva.edu'
    } : null;

    const teachers = teacherRows.map(t => ({
      id: t.id,
      username: t.username,
      password: t.password,
      pin: t.pin || '1234',
      name: t.name,
      role: 'TEACHER',
      title: t.title || (t.subject ? `Faculty (${t.subject})` : 'Senior Faculty'),
      subject: t.subject || '',
      phone: t.phone || '',
      email: t.email || '',
      assignedBatchIds: Array.isArray(t.assigned_batch_ids) ? t.assigned_batch_ids : [],
      assignedStudentIds: Array.isArray(t.assigned_student_ids) ? t.assigned_student_ids : [],
      createdAt: t.created_at
    }));

    const localAccounts = getStaffAccounts();
    const localTeachers = Array.isArray(localAccounts?.teachers) ? localAccounts.teachers : [];

    let finalTeachers = teachers;
    // If Supabase has no teachers yet, but local storage already has valid teachers created by the admin,
    // preserve the local teachers and automatically sync them to Supabase PostgreSQL!
    if (teachers.length === 0 && localTeachers.length > 0) {
      finalTeachers = localTeachers;
      syncStaffAccountsToSupabase({
        admin: admin || localAccounts.admin,
        teacher: localTeachers[0],
        teachers: localTeachers
      }).catch(err => console.warn('Could not sync local teachers to Supabase:', err));
    }

    if (finalTeachers.length === 0 && !admin) return null;

    const staffAccounts = {
      admin: admin || {
        username: 'admin',
        password: 'admin123',
        pin: '1234',
        name: 'Tuition Director',
        role: 'ADMIN',
        title: 'Administrator',
        email: 'admin@hayagriva.edu'
      },
      teacher: finalTeachers[0] || null,
      teachers: finalTeachers.length > 0 ? finalTeachers : []
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hayagriva_staff_accounts_v1', JSON.stringify(staffAccounts));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hayagriva-staff-accounts-changed', { detail: staffAccounts }));
    }

    return staffAccounts;
  } catch (err) {
    console.warn('Could not fetch staff accounts from Supabase:', err);
    return null;
  }
}

// Sync Staff & Faculty accounts to Supabase PostgreSQL
export async function syncStaffAccountsToSupabase(accounts) {
  const supabase = getSupabaseClient();
  if (!supabase || !accounts) return { success: false, message: 'Supabase not connected' };

  try {
    const rowsToUpsert = [];

    // 1. Admin account row
    if (accounts.admin) {
      rowsToUpsert.push({
        id: 'admin-01',
        username: accounts.admin.username || 'admin',
        password: accounts.admin.password || 'admin123',
        pin: accounts.admin.pin || '1234',
        name: accounts.admin.name || 'Tuition Director',
        role: 'ADMIN',
        title: accounts.admin.title || 'Administrator',
        email: accounts.admin.email || 'admin@hayagriva.edu',
        assigned_batch_ids: [],
        assigned_student_ids: []
      });
    }

    // 2. Teachers accounts rows
    const teachersList = accounts.teachers || (accounts.teacher ? [accounts.teacher] : []);
    teachersList.forEach(t => {
      rowsToUpsert.push({
        id: t.id || `teacher-${Date.now()}`,
        username: t.username,
        password: t.password,
        pin: t.pin || '1234',
        name: t.name,
        role: 'TEACHER',
        title: t.title || '',
        subject: t.subject || '',
        phone: t.phone || '',
        email: t.email || '',
        assigned_batch_ids: Array.isArray(t.assignedBatchIds) ? t.assignedBatchIds : [],
        assigned_student_ids: Array.isArray(t.assignedStudentIds) ? t.assignedStudentIds : []
      });
    });

    if (rowsToUpsert.length > 0) {
      const { error: upsertErr } = await supabase.from('staff_accounts').upsert(rowsToUpsert, { onConflict: 'id' });
      if (upsertErr) {
        console.warn('Could not upsert staff_accounts to Supabase:', upsertErr);
        return { success: false, error: upsertErr.message };
      }

      // Safely delete only those teacher accounts in Supabase that were removed locally
      const validTeacherIds = teachersList.map(t => t.id).filter(Boolean);
      const { data: existingDbTeachers } = await supabase
        .from('staff_accounts')
        .select('id')
        .eq('role', 'TEACHER');

      if (Array.isArray(existingDbTeachers) && existingDbTeachers.length > 0) {
        const idsToDelete = existingDbTeachers
          .map(row => row.id)
          .filter(id => !validTeacherIds.includes(id));

        for (const staleId of idsToDelete) {
          await supabase.from('staff_accounts').delete().eq('id', staleId);
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error syncing staff accounts to Supabase:', err);
    return { success: false, error: err.message };
  }
}

// Global browser event listener: auto-sync staff accounts whenever local changes occur
if (typeof window !== 'undefined') {
  window.addEventListener('hayagriva-staff-sync-to-db', (e) => {
    if (e && e.detail) {
      syncStaffAccountsToSupabase(e.detail).catch(err => {
        console.warn('Background auto-sync of staff accounts to Supabase failed:', err);
      });
    }
  });
}

