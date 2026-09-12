// ==========================================================================
// School Tuition Management - Database Storage & Real-Time Engine
// Supports local reactive persistence + direct Supabase sync
// ==========================================================================

const STORAGE_KEY = 'vidyatrack_tuition_data_v1';
const SUPABASE_CONFIG_KEY = 'vidyatrack_supabase_config_v1';

// Pre-seeded Classes 1 to 10
export const INITIAL_CLASSES = [
  { id: 1, code: 'CLASS_1', name: 'Class 1', category: 'Primary', defaultFee: 500, subjects: ['English', 'Mathematics', 'Environmental Studies', 'Telugu / Hindi'] },
  { id: 2, code: 'CLASS_2', name: 'Class 2', category: 'Primary', defaultFee: 550, subjects: ['English', 'Mathematics', 'Environmental Studies', 'Telugu / Hindi'] },
  { id: 3, code: 'CLASS_3', name: 'Class 3', category: 'Primary', defaultFee: 600, subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'Language II'] },
  { id: 4, code: 'CLASS_4', name: 'Class 4', category: 'Primary', defaultFee: 650, subjects: ['English', 'Mathematics', 'Science', 'Social Studies', 'Language II'] },
  { id: 5, code: 'CLASS_5', name: 'Class 5', category: 'Primary', defaultFee: 700, subjects: ['English', 'Mathematics', 'General Science', 'Social Studies', 'Language II'] },
  { id: 6, code: 'CLASS_6', name: 'Class 6', category: 'Middle', defaultFee: 800, subjects: ['Mathematics', 'General Science', 'Social Studies', 'English', 'Language II'] },
  { id: 7, code: 'CLASS_7', name: 'Class 7', category: 'Middle', defaultFee: 850, subjects: ['Mathematics', 'General Science', 'Social Studies', 'English', 'Language II'] },
  { id: 8, code: 'CLASS_8', name: 'Class 8', category: 'Middle', defaultFee: 900, subjects: ['Mathematics', 'Physical Science', 'Biological Science', 'Social Studies', 'English'] },
  { id: 9, code: 'CLASS_9', name: 'Class 9', category: 'High School', defaultFee: 1100, subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'English'] },
  { id: 10, code: 'CLASS_10', name: 'Class 10 (SSC/CBSE)', category: 'High School', defaultFee: 1250, subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'English'] }
];

export const INITIAL_BATCHES = [
  { id: 1, name: 'Class 10 - Morning Focus', classCode: 'CLASS_10', timing: '06:00 AM - 07:30 AM', tutor: 'Mr. R. Sharma (Maths & Physics)', room: 'Hall A', capacity: 25 },
  { id: 2, name: 'Class 10 - Evening Prime', classCode: 'CLASS_10', timing: '05:30 PM - 07:30 PM', tutor: 'Mrs. S. Lakshmi (Maths & Science)', room: 'Hall A', capacity: 30 },
  { id: 3, name: 'Class 9 - Evening Batch', classCode: 'CLASS_9', timing: '05:00 PM - 06:30 PM', tutor: 'Mr. P. Verma', room: 'Room 102', capacity: 25 },
  { id: 4, name: 'Class 8 - Foundation Batch', classCode: 'CLASS_8', timing: '04:30 PM - 06:00 PM', tutor: 'Ms. A. Reddy', room: 'Room 103', capacity: 20 },
  { id: 5, name: 'Class 5 to 7 - Junior Champs', classCode: 'CLASS_6', timing: '04:00 PM - 05:30 PM', tutor: 'Mrs. K. Deepa', room: 'Room 101', capacity: 20 },
  { id: 6, name: 'Class 1 to 4 - Primary Care', classCode: 'CLASS_3', timing: '04:00 PM - 05:15 PM', tutor: 'Ms. M. Priya', room: 'Room 104', capacity: 15 }
];

export const INITIAL_STUDENTS = [
  { id: 1, admissionNo: 'ADM-1001', name: 'Aarav Kumar', gender: 'Male', classCode: 'CLASS_10', batchId: 2, school: 'St. Ann\'s High School', parentName: 'Rajesh Kumar', parentPhone: '9876543210', monthlyFee: 1250, status: 'ACTIVE', admissionDate: '2026-01-10' },
  { id: 2, admissionNo: 'ADM-1002', name: 'Sneha Patel', gender: 'Female', classCode: 'CLASS_10', batchId: 2, school: 'Delhi Public School', parentName: 'Mahesh Patel', parentPhone: '9876543211', monthlyFee: 1250, status: 'ACTIVE', admissionDate: '2026-01-12' },
  { id: 3, admissionNo: 'ADM-1003', name: 'Rohan Varma', gender: 'Male', classCode: 'CLASS_10', batchId: 1, school: 'Narayana Olympiad', parentName: 'K. Varma', parentPhone: '9876543212', monthlyFee: 1250, status: 'ACTIVE', admissionDate: '2026-01-15' },
  { id: 4, admissionNo: 'ADM-1004', name: 'Pooja Reddy', gender: 'Female', classCode: 'CLASS_9', batchId: 3, school: 'Little Flower School', parentName: 'Suresh Reddy', parentPhone: '9876543213', monthlyFee: 1100, status: 'ACTIVE', admissionDate: '2026-01-18' },
  { id: 5, admissionNo: 'ADM-1005', name: 'Karthik Rao', gender: 'Male', classCode: 'CLASS_9', batchId: 3, school: 'Bhavan\'s Sri Ramakrishna', parentName: 'G. Rao', parentPhone: '9876543214', monthlyFee: 1100, status: 'ACTIVE', admissionDate: '2026-01-20' },
  { id: 6, admissionNo: 'ADM-1006', name: 'Ananya Sharma', gender: 'Female', classCode: 'CLASS_8', batchId: 4, school: 'Kendriya Vidyalaya', parentName: 'V. Sharma', parentPhone: '9876543215', monthlyFee: 900, status: 'ACTIVE', admissionDate: '2026-02-01' },
  { id: 7, admissionNo: 'ADM-1007', name: 'Aditya Das', gender: 'Male', classCode: 'CLASS_7', batchId: 5, school: 'DAV Public School', parentName: 'Sunil Das', parentPhone: '9876543216', monthlyFee: 850, status: 'ACTIVE', admissionDate: '2026-02-05' },
  { id: 8, admissionNo: 'ADM-1008', name: 'Diya Murthy', gender: 'Female', classCode: 'CLASS_6', batchId: 5, school: 'Sri Chaitanya Techno', parentName: 'Ravi Murthy', parentPhone: '9876543217', monthlyFee: 800, status: 'ACTIVE', admissionDate: '2026-02-10' },
  { id: 9, admissionNo: 'ADM-1009', name: 'Sai Teja', gender: 'Male', classCode: 'CLASS_5', batchId: 5, school: 'St. Joseph\'s Convent', parentName: 'N. Teja', parentPhone: '9876543218', monthlyFee: 700, status: 'ACTIVE', admissionDate: '2026-02-15' },
  { id: 10, admissionNo: 'ADM-1010', name: 'Kavya Singh', gender: 'Female', classCode: 'CLASS_4', batchId: 6, school: 'Army Public School', parentName: 'Arjun Singh', parentPhone: '9876543219', monthlyFee: 650, status: 'ACTIVE', admissionDate: '2026-02-18' },
  { id: 11, admissionNo: 'ADM-1011', name: 'Manish Goud', gender: 'Male', classCode: 'CLASS_2', batchId: 6, school: 'St. Mary\'s High School', parentName: 'B. Goud', parentPhone: '9876543220', monthlyFee: 550, status: 'ACTIVE', admissionDate: '2026-02-22' },
  { id: 12, admissionNo: 'ADM-1012', name: 'Isha Nambiar', gender: 'Female', classCode: 'CLASS_1', batchId: 6, school: 'Oakridge International', parentName: 'K. Nambiar', parentPhone: '9876543221', monthlyFee: 500, status: 'ACTIVE', admissionDate: '2026-03-01' }
];

export const INITIAL_FEES = [
  { id: 1, studentId: 1, monthYear: 'March 2026', amountDue: 1250, amountPaid: 1250, balance: 0, status: 'PAID', lastPaymentDate: '2026-03-02', receiptNo: 'REC-2026-001', paymentMode: 'UPI' },
  { id: 2, studentId: 2, monthYear: 'March 2026', amountDue: 1250, amountPaid: 1000, balance: 250, status: 'PARTIAL', lastPaymentDate: '2026-03-03', receiptNo: 'REC-2026-002', paymentMode: 'CASH' },
  { id: 3, studentId: 3, monthYear: 'March 2026', amountDue: 1250, amountPaid: 0, balance: 1250, status: 'PENDING', lastPaymentDate: null, receiptNo: null, paymentMode: null },
  { id: 4, studentId: 4, monthYear: 'March 2026', amountDue: 1100, amountPaid: 1100, balance: 0, status: 'PAID', lastPaymentDate: '2026-03-01', receiptNo: 'REC-2026-003', paymentMode: 'PHONEPE' },
  { id: 5, studentId: 5, monthYear: 'March 2026', amountDue: 1100, amountPaid: 0, balance: 1100, status: 'PENDING', lastPaymentDate: null, receiptNo: null, paymentMode: null },
  { id: 6, studentId: 6, monthYear: 'March 2026', amountDue: 900, amountPaid: 900, balance: 0, status: 'PAID', lastPaymentDate: '2026-03-04', receiptNo: 'REC-2026-004', paymentMode: 'GPAY' },
  { id: 7, studentId: 7, monthYear: 'March 2026', amountDue: 850, amountPaid: 850, balance: 0, status: 'PAID', lastPaymentDate: '2026-03-05', receiptNo: 'REC-2026-005', paymentMode: 'CASH' },
  { id: 8, studentId: 8, monthYear: 'March 2026', amountDue: 800, amountPaid: 0, balance: 800, status: 'PENDING', lastPaymentDate: null, receiptNo: null, paymentMode: null },
  { id: 9, studentId: 9, monthYear: 'March 2026', amountDue: 700, amountPaid: 700, balance: 0, status: 'PAID', lastPaymentDate: '2026-03-02', receiptNo: 'REC-2026-006', paymentMode: 'UPI' },
  { id: 10, studentId: 10, monthYear: 'March 2026', amountDue: 650, amountPaid: 650, balance: 0, status: 'PAID', lastPaymentDate: '2026-03-03', receiptNo: 'REC-2026-007', paymentMode: 'CASH' }
];

export const INITIAL_RECEIPTS = [
  { id: 1, receiptNo: 'REC-2026-001', studentId: 1, studentName: 'Aarav Kumar', classCode: 'CLASS_10', amount: 1250, monthYear: 'March 2026', date: '2026-03-02', mode: 'UPI', transactionRef: 'UPI-9831741289', notes: 'Monthly tuition full payment' },
  { id: 2, receiptNo: 'REC-2026-002', studentId: 2, studentName: 'Sneha Patel', classCode: 'CLASS_10', amount: 1000, monthYear: 'March 2026', date: '2026-03-03', mode: 'CASH', transactionRef: 'CASH-REC', notes: 'Partial payment - balance Rs 250' },
  { id: 3, receiptNo: 'REC-2026-003', studentId: 4, studentName: 'Pooja Reddy', classCode: 'CLASS_9', amount: 1100, monthYear: 'March 2026', date: '2026-03-01', mode: 'PHONEPE', transactionRef: 'PP-18928371', notes: 'Full fee cleared' }
];

export const INITIAL_EXAMS = [
  { id: 1, title: 'Class 10 - Mathematics Unit Test (Linear Equations)', classCode: 'CLASS_10', subject: 'Mathematics', totalMarks: 50, passingMarks: 18, date: '2026-02-25' },
  { id: 2, title: 'Class 10 - Physical Science Slip Test', classCode: 'CLASS_10', subject: 'Physics', totalMarks: 25, passingMarks: 10, date: '2026-02-28' },
  { id: 3, title: 'Class 9 - Biology Fundamentals Quiz', classCode: 'CLASS_9', subject: 'Biology', totalMarks: 30, passingMarks: 12, date: '2026-03-01' }
];

export const INITIAL_MARKS = [
  { id: 1, examId: 1, studentId: 1, marksObtained: 47, remarks: 'Outstanding work!' },
  { id: 2, examId: 1, studentId: 2, marksObtained: 42, remarks: 'Very good' },
  { id: 3, examId: 1, studentId: 3, marksObtained: 38, remarks: 'Needs more practice in word problems' },
  { id: 4, examId: 2, studentId: 1, marksObtained: 24, remarks: 'Excellent' },
  { id: 5, examId: 2, studentId: 2, marksObtained: 21, remarks: 'Good grasp of optics' }
];

export const INITIAL_ATTENDANCE = [
  { id: 1, studentId: 1, date: new Date().toISOString().split('T')[0], status: 'PRESENT', batchId: 2 },
  { id: 2, studentId: 2, date: new Date().toISOString().split('T')[0], status: 'PRESENT', batchId: 2 },
  { id: 3, studentId: 3, date: new Date().toISOString().split('T')[0], status: 'ABSENT', batchId: 1, remarks: 'Fever reported by parent' },
  { id: 4, studentId: 4, date: new Date().toISOString().split('T')[0], status: 'PRESENT', batchId: 3 },
  { id: 5, studentId: 5, date: new Date().toISOString().split('T')[0], status: 'PRESENT', batchId: 3 }
];

export const INITIAL_ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Special Sunday Tuition Class',
    message: 'Dear Sir/Mam, Please note that there will be a Special Sunday Revision Class for Class 10 on Sunday from 09:00 AM to 12:00 PM for board exam preparation. Attendance is compulsory.',
    targetType: 'ALL',
    targetId: null,
    targetName: 'All Students & Batches',
    postedBy: 'Admin (Director)',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }
];

// Initialize Storage
export function getStoredData() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (!parsed.announcements || !Array.isArray(parsed.announcements)) {
        parsed.announcements = INITIAL_ANNOUNCEMENTS;
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse local storage', e);
    }
  }
  const defaultData = {
    classes: INITIAL_CLASSES,
    batches: INITIAL_BATCHES,
    students: INITIAL_STUDENTS,
    fees: INITIAL_FEES,
    receipts: INITIAL_RECEIPTS,
    exams: INITIAL_EXAMS,
    marks: INITIAL_MARKS,
    attendance: INITIAL_ATTENDANCE,
    announcements: INITIAL_ANNOUNCEMENTS
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
}

export function saveStoredData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Dispatch reactive event so all components update in real time
  window.dispatchEvent(new CustomEvent('tuition-db-updated', { detail: data }));
}

// Supabase Connection Credentials Storage
export function getSupabaseConfig() {
  const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch (e) {
      // fallback to env variables
    }
  }
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, isConnected: true };
  }
  return { url: '', anonKey: '', isConnected: false };
}

export function saveSupabaseConfig(config) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('tuition-supabase-config-changed', { detail: config }));
}

// Generate clean positive integer IDs (< 2 billion) for PostgreSQL SERIAL compatibility
export function generateNextId(items = []) {
  if (!items || items.length === 0) return 1;
  const max = items.reduce((m, item) => {
    const num = Number(item?.id);
    return !isNaN(num) && num < 2000000000 ? Math.max(m, num) : m;
  }, 0);
  return max + 1;
}

// Clean blank slate template (0 students, standard classes)
export function getEmptyTuitionData() {
  return {
    classes: INITIAL_CLASSES,
    batches: [],
    students: [],
    fees: [],
    receipts: [],
    exams: [],
    marks: [],
    attendance: [],
    announcements: []
  };
}

