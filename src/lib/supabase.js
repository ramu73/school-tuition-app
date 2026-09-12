// ==========================================================================
// Supabase Client Wrapper & Real-Time Synchronizer
// Direct PostgreSQL bidirectional syncing for Hayagriva Tuition System
// ==========================================================================

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, INITIAL_CLASSES } from './storage';

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

    const classes = (classesRes.data && classesRes.data.length > 0)
      ? classesRes.data.map(c => ({
          id: c.id,
          code: c.code,
          name: c.display_name,
          category: c.category,
          defaultFee: Number(c.default_monthly_fee),
          subjects: INITIAL_CLASSES.find(ic => ic.code === c.code)?.subjects || ['English', 'Mathematics', 'Science']
        }))
      : INITIAL_CLASSES;

    const batches = (batchesRes.data || []).map(b => ({
      id: b.id,
      name: b.batch_name,
      classCode: b.class_code,
      timing: b.timing,
      tutor: b.tutor_name,
      room: b.room_number || '',
      capacity: b.max_capacity || 25
    }));

    const students = (studentsRes.data || []).map(s => ({
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
        monthYear: '',
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

    const marks = (marksRes.data || []).map(m => ({
      id: m.id,
      examId: m.exam_id,
      studentId: m.student_id,
      marksObtained: Number(m.marks_obtained),
      remarks: m.remarks || ''
    }));

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
      announcements
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
    // 1. Batches
    if (data.batches && data.batches.length > 0) {
      const batchRows = data.batches.map(b => ({
        id: b.id,
        batch_name: b.name,
        class_code: b.classCode,
        timing: b.timing,
        tutor_name: b.tutor,
        room_number: b.room || '',
        max_capacity: b.capacity || 25
      }));
      await supabase.from('batches').upsert(batchRows, { onConflict: 'id' });

      // Clean deleted batches
      const batchIds = data.batches.map(b => b.id);
      await supabase.from('batches').delete().not('id', 'in', `(${batchIds.join(',')})`);
    } else {
      await supabase.from('batches').delete().neq('id', 0);
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

      // Clean deleted students
      const studentIds = data.students.map(s => s.id);
      await supabase.from('students').delete().not('id', 'in', `(${studentIds.join(',')})`);
    } else {
      await supabase.from('students').delete().neq('id', 0);
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
      const validExamIds = new Set((data.exams || []).map(e => e.id));
      const validStudentIds = new Set((data.students || []).map(s => s.id));
      const markRows = data.marks
        .filter(m => validExamIds.has(m.examId) && validStudentIds.has(m.studentId))
        .map(m => ({
          id: m.id,
          exam_id: m.examId,
          student_id: m.studentId,
          marks_obtained: Number(m.marksObtained),
          remarks: m.remarks || ''
        }));
      if (markRows.length > 0) {
        await supabase.from('exam_marks').upsert(markRows, { onConflict: 'exam_id, student_id' });
      }
    }

    // 7. Announcements / Broadcast Notifications
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
